
// ==========================================
// 1. CREATE A NEW SCHOOL

import SchoolModel from "../../../Models/New_Model/SchoolModel/shoolModel.model.js";
import { isValidEmail, isValidPhone } from "../../../Utils/basicValidation.js";
import { uploadImageToS3 } from "../../../Utils/s3upload.js";
import { archiveData } from "../deleteArchieve_controller/deleteArchieve.controller.js";

// ==========================================
export const createSchool = async (req, res) => {
  try {

    const isPlatformAdmin = req?.user?.isPlatformAdmin || false

    if (!isPlatformAdmin) {
      return res.status(403).json({ message: "sorry you cant create the school", ok: false })
    }


    let { name, email, phoneNo, address, currentAcademicYear } = req.body;



    const file = req.file; // ✅ multer puts file here

    name = name?.trim();
    email = email?.trim();
    phoneNo = phoneNo?.trim();
    address = address?.trim();
    currentAcademicYear = currentAcademicYear?.trim();



    console.log("file 11111111", file)

    if (!isPlatformAdmin) {
      return res.status(403).json({
        message: "You do not have permission to create a school. Please contact the platform administrator.",
        ok: false
      })
    }

    // Validation: Ensure Name is provided
    if (!name) {
      return res.status(400).json({ message: "School Name is required.", ok: false });
    }

    if (!currentAcademicYear) {
      return res.status(400).json({ message: "Current academic year is required.", ok: false });

    }


    // 2. Validate formats (assuming you have these helpers)
    if (email && !isValidEmail(email)) {
      return res.status(400).json({ message: "Invalid email format", ok: false });
    }

    if (phoneNo && !isValidPhone(phoneNo)) {
      return res.status(400).json({ message: "Invalid phone number format", ok: false });
    }


    // 5. Check for Conflicts (Name, Email, Phone)
    // We build a query to check all 3 at once
    const conflictChecks = [];
    if (name) conflictChecks.push({ name });
    if (email) conflictChecks.push({ email });
    if (phoneNo) conflictChecks.push({ phoneNo });

    if (conflictChecks.length > 0) {
      const duplicate = await SchoolModel.findOne({ $or: conflictChecks });

      if (duplicate) {
        if (duplicate.name === name) {
          return res.status(400).json({ message: "School Name already exists.", ok: false });
        }
        if (duplicate.email === email) {
          return res.status(400).json({ message: "Email already exists.", ok: false });
        }
        if (duplicate.phoneNo === phoneNo) {
          return res.status(400).json({ message: "Phone number already exists.", ok: false });
        }
      }
    }


    let uploadedLogo = null
    if (file) {
      const uploadedUrl = await uploadImageToS3(file)
      uploadedLogo = {
        type: "image",
        url: uploadedUrl,
        originalName: file?.originalname,

      }
    }

    console.log("file after upload 22222233", uploadedLogo)


    // Create the School
    const newSchool = new SchoolModel({
      name,
      email,
      phoneNo,
      address,
      logo: uploadedLogo,
      isActive: true, // Default to true
    });

    await newSchool.save();

    return res.status(201).json({
      message: "School created successfully",
      data: newSchool,
      ok: true
    });
  } catch (error) {
    console.error("Error creating school:", error);
    return res.status(500).json({ message: "Internal Server Error", error: error.message, ok: false });
  }
};

// ==========================================
// 2. GET ALL SCHOOLS
// ==========================================
export const getAllSchools = async (req, res) => {
  try {
    // Fetches all schools. You can add pagination here later if needed.
    const schools = await SchoolModel.find().sort({ createdAt: -1 });

    return res.status(200).json({
      ok: true,
      count: schools.length,
      data: schools,
    });
  } catch (error) {
    console.error("Error fetching schools:", error);
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

// ==========================================
// 3. GET SINGLE SCHOOL BY ID
// ==========================================
export const getSchoolById = async (req, res) => {
  try {
    const { id } = req.params;

    const school = await SchoolModel.findById(id);

    if (!school) {
      return res.status(404).json({ message: "School not found.", ok: false });
    }

    return res.status(200).json({ ok: true, data: school });
  } catch (error) {
    console.error("Error fetching school:", error);
    return res.status(500).json({ message: "Internal Server Error", error: error.message, ok: false });
  }
};

// ==========================================
// 4. UPDATE SCHOOL DETAILS
// ==========================================
export const updateSchool = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phoneNo, address, currentAcademicYear } = req.body;


    const updates = {};

    if (name) updates.name = name.trim();
    if (email) updates.email = email.trim();
    if (phoneNo) updates.phoneNo = phoneNo.trim();
    if (address) updates.address = address.trim();
    if (currentAcademicYear) updates.currentAcademicYear = currentAcademicYear.trim();

    if (!currentAcademicYear) {
      return res.status(400).json({ message: "Current Academic year cannot be null", ok: false });
    }

    // Prevent schoolCode updates
    if (req.body.schoolCode) {
      return res.status(400).json({ message: "School code cannot be updated", ok: false });
    }


    // 2. Validate formats (assuming you have these helpers)
    if (updates.email && !isValidEmail(updates.email)) {
      return res.status(400).json({ message: "Invalid email format", ok: false });
    }

    if (updates.phoneNo && !isValidPhone(updates.phoneNo)) {
      return res.status(400).json({ message: "Invalid phone number format", ok: false });
    }


    // Check for duplicate school name
    // if (name) {
    //   const existingSchool = await SchoolModel.findOne({ name, _id: { $ne: id } });
    //   if (existingSchool) {
    //     return res.status(400).json({ message: "School name already exists", ok: false });
    //   }
    // }

    // Check for duplicates in a single DB call
    // Single query to find any conflict
    // 3. Dynamic Duplicate Check
    // Build the query array dynamically based on what is being updated
    const conflictChecks = [];
    if (updates.name) conflictChecks.push({ name: updates.name });
    if (updates.email) conflictChecks.push({ email: updates.email });
    if (updates.phoneNo) conflictChecks.push({ phoneNo: updates.phoneNo });

    // ONLY run the DB query if there is something to check
    if (conflictChecks.length > 0) {
      const duplicate = await SchoolModel.findOne({
        _id: { $ne: id }, // Exclude current school
        $or: conflictChecks
      });

      if (duplicate) {
        // We use 'updates' here to compare against the DB result
        if (updates.name && duplicate.name === updates.name) {
          return res.status(400).json({ message: "School name already exists", ok: false });
        }
        if (updates.email && duplicate.email === updates.email) {
          return res.status(400).json({ message: "Email already exists", ok: false });
        }
        if (updates.phoneNo && duplicate.phoneNo === updates.phoneNo) {
          return res.status(400).json({ message: "Phone number already exists", ok: false });
        }
      }
    }



    // // Check if the school exists
    // const school = await SchoolModel.findById(id);
    // if (!school) {
    //   return res.status(404).json({ ok: false, message: "School not found." });
    // }

    // Update the school
    // { new: true } returns the updated document instead of the old one
    const updatedSchool = await SchoolModel.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    return res.status(200).json({
      ok: true,
      message: "School updated successfully",
      data: updatedSchool,
    });
  } catch (error) {
    console.error("Error updating school:", error);
    return res.status(500).json({ message: "Internal Server Error", error: error.message, ok: false });
  }
};



export const updateSchoolLogo = async (req, res) => {
  try {
    const { id } = req.params;
    const file = req.file; // ✅ multer puts file here

    // Check if the school exists


    if (!file) {
      return res.status(404).json({ message: "logo not found.", ok: false });
    }


    const uploadedUrl = await uploadImageToS3(file)

    let uploadedLogo = {
      type: "image",
      originalName: file?.originalname,
      url: uploadedUrl,
    }

    // const school = await SchoolModel.findById(id);
    // if (!school) {
    //   return res.status(404).json({ message: "School not found." });
    // }


    // Update the school
    // { new: true } returns the updated document instead of the old one
    const updatedSchool = await SchoolModel.findByIdAndUpdate(id, { logo: uploadedLogo }, {
      new: true,
    });

    return res.status(200).json({
      message: "School logo updated successfully",
      data: updatedSchool,
      ok: false
    });
  } catch (error) {
    console.error("Error updating school:", error);
    return res.status(500).json({ message: "Internal Server Error", error: error.message, ok: false });
  }
};

// ==========================================
// 5. DELETE SCHOOL
// ==========================================
export const deleteSchool = async (req, res) => {
  try {
    const { id } = req.params;

    // const school = await SchoolModel.findById(id);


    // Hard Delete: Removes it from the database completely
    const school = await SchoolModel.findByIdAndDelete(id);

    if (!school) {
      return res.status(404).json({ message: "School not found.", ok: false });
    }


    await archiveData({
      schoolId: school._id,
      category: "school",
      originalId: school._id,
      deletedData: school.toObject(), // Convert Mongoose doc to plain object
      deletedBy: req.user._id || null,
      reason: null, // Optional reason from body
    });

    // Note: In an LMS, usually we prefer "Soft Delete" (setting isActive: false)
    // to preserve history. If you want that, replace the line above with:
    // await SchoolModel.findByIdAndUpdate(id, { isActive: false });

    return res.status(200).json({ message: "School deleted successfully.", ok: false });
  } catch (error) {
    console.error("Error deleting school:", error);
    return res.status(500).json({ message: "Internal Server Error", error: error.message, ok: false });
  }
};