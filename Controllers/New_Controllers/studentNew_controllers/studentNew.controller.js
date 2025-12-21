
// ==========================================
// CREATE STUDENT PROFILE

import StudentNewModel from "../../../Models/New_Model/StudentModel/studentNew.model.js";
import UserModel from "../../../Models/New_Model/UserModel/userModel.model.js";
import { uploadImageToS3 } from "../../../Utils/s3upload.js";

// ==========================================
export const createStudentProfile = async (req, res) => {
    try {
        const {
            schoolId,
            studentName,
            gender,
            dob,
            whatsappNumber,
            //   mandatory, 
            //   nonMandatory 
        } = req.body;

        const file = req.file; // From Multer

        // 1. PARSE NESTED OBJECTS (FormData sends them as strings)
        let mandatoryData = {};
        let nonMandatoryData = {};

        try {
            if (req.body.mandatory) {
                mandatoryData = JSON.parse(req.body.mandatory);
            }
            if (req.body.nonMandatory) {
                nonMandatoryData = JSON.parse(req.body.nonMandatory);
            }
        } catch (parseError) {
            return res.status(400).json({ ok: false, message: "Invalid JSON format for mandatory/nonMandatory fields" });
        }

        // 1. Basic Validation
        if (!schoolId) {
            return res.status(400).json({ ok: false, message: "schoolId is required" });
        }
        if (!studentName) {
            return res.status(400).json({ ok: false, message: "studentName is required" });
        }

        // 2. Handle Image Upload (Optional)
        let uploadedImage = null;
        if (file) {
            const uploadedUrl = await uploadImageToS3(file);
            uploadedImage = {
                type: "image",
                url: uploadedUrl,
                originalName: file.originalname,
                uploadedAt: new Date()
            };
        }

        // 3. Create Student Instance
        // Note: We do NOT pass srId here. The pre-save hook handles it.
        const newStudent = new StudentNewModel({
            schoolId,
            studentName,
            gender: gender || null,
            dob: dob || null,
            whatsappNumber: whatsappNumber || null,
            studentImage: uploadedImage,

            // Since these are objects in schema, we pass them directly
            // If frontend sends nothing, they default to empty objects per schema
            mandatory: mandatoryData || {},
            nonMandatory: nonMandatoryData || {},

            // Defaulting cache IDs to null initially
            currentClassId: null,
            currentSectionId: null,
            isActive: true
        });

        // 4. Save (Triggers Pre-Save Hook for SR-ID)
        await newStudent.save();

        // if (mandatoryData.mobileNumber) {
        //     await UserModel.findOneAndUpdate({ phoneNo: mandatoryData.mobileNumber }, {
        //         $addToSet: { studentId: newStudent._id }
        //     })

        // }

        // =========================================================
        // 6. PARENT LINKING LOGIC
        // =========================================================
        // Check if a mobile number was provided in mandatory details
        const parentMobile = mandatoryData?.mobileNumber;

        if (parentMobile) {
            // Find a User who is a 'parent' AND has this phone number
            const parentUser = await UserModel.findOne({
                phoneNo: parentMobile,
                role: "parent"
            });

            if (parentUser) {
                // Add this new student's ID to the parent's list
                // We use $addToSet to prevent duplicates just in case
                parentUser.studentId = parentUser?.studentId || []; // Ensure array exists

                // Push only if not already present (Standard JS check or Mongoose $addToSet)
                if (!parentUser?.studentId?.includes(newStudent._id)) {
                    parentUser.studentId.push(newStudent._id);
                    await parentUser.save();
                    console.log(`Linked Student ${newStudent.srId} to Parent ${parentUser.userName}`);
                }
            }
        }

        return res.status(201).json({
            ok: true,
            message: "Student profile created successfully",
            data: newStudent
        });

    } catch (error) {
        console.error("Create Student Profile Error:", error);
        return res.status(500).json({ ok: false, message: "Internal server error", error: error.message });
    }
};






// ==========================================
// 1. UPDATE STUDENT PROFILE
// ==========================================
export const updateStudent = async (req, res) => {
    try {
        const { id } = req.params;
        // const updates = req.body;
        let updates = { ...req.body };
        const file = req.file;


        // Handle Image Update
        if (file) {
            const uploadedUrl = await uploadImageToS3(file);
            updates.studentImage = {
                type: "image",
                url: uploadedUrl,
                originalName: file.originalname,
                uploadedAt: new Date()
            };
        }

        try {
            if (typeof updates.mandatory === 'string') {
                updates.mandatory = JSON.parse(updates.mandatory);
            }
            if (typeof updates.nonMandatory === 'string') {
                updates.nonMandatory = JSON.parse(updates.nonMandatory);
            }
        } catch (parseError) {
            return res.status(400).json({
                ok: false,
                message: "Invalid JSON format for mandatory/nonMandatory fields"
            });
        }


        // Prevent updating Immutable Fields
        if (updates.srId) delete updates.srId;
        if (updates.schoolId) delete updates.schoolId;

        // Handle Nested Objects (Mandatory/NonMandatory)
        // If you send partial data (e.g. only fatherName), we need to merge it, 
        // otherwise Mongoose might overwrite the whole object if not careful.
        // However, usually with $set and dot notation in frontend (mandatory.fatherName) it works best.
        // For simplicity here, we assume the frontend sends the structure correctly.

        const updatedStudent = await StudentNewModel.findByIdAndUpdate(
            id,
            { $set: updates },
            { new: true, runValidators: true }
        );

        if (!updatedStudent) {
            return res.status(404).json({ ok: false, message: "Student not found" });
        }

        return res.status(200).json({
            ok: true,
            message: "Student updated successfully",
            data: updatedStudent
        });

    } catch (error) {
        console.error("Update Student Error:", error);
        return res.status(500).json({ ok: false, message: "Internal server error", error: error.message });
    }
};

// ==========================================
// 2. DELETE STUDENT PROFILE
// ==========================================
export const deleteStudent = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedStudent = await StudentNewModel.findByIdAndDelete(id);

        if (!deletedStudent) {
            return res.status(404).json({ ok: false, message: "Student not found" });
        }

        // TODO: Ideally, you should also delete related FeeRecords here to clean up.
        // await StudentRecordModel.deleteMany({ studentId: id });

        return res.status(200).json({
            ok: true,
            message: "Student profile deleted successfully"
        });

    } catch (error) {
        console.error("Delete Student Error:", error);
        return res.status(500).json({ ok: false, message: "Internal server error", error: error.message });
    }
};

// ==========================================
// 3. GET SINGLE STUDENT BY ID
// ==========================================
export const getStudentById = async (req, res) => {
    try {
        const { id } = req.params;

        const student = await StudentNewModel.findById(id)
            .populate("currentClassId", "name")   // Populate Class Name
            .populate("currentSectionId", "name"); // Populate Section Name

        if (!student) {
            return res.status(404).json({ ok: false, message: "Student not found" });
        }

        return res.status(200).json({
            ok: true,
            data: student
        });

    } catch (error) {
        console.error("Get Student Error:", error);
        return res.status(500).json({ ok: false, message: "Internal server error", error: error.message });
    }
};

// ==========================================
// 4. GET ALL STUDENTS (School / Class / Section) + PAGINATION
// ==========================================
export const getAllStudents = async (req, res) => {
    try {
        const {
            schoolId,
            classId,
            sectionId,
            page = 1,
            limit = 10,
            search // Optional search by name/srId
        } = req.query;

        if (!schoolId) {
            return res.status(400).json({ ok: false, message: "schoolId is required" });
        }

        // Build Filter
        const filter = { schoolId };

        if (classId) filter.currentClassId = classId;
        if (sectionId) filter.currentSectionId = sectionId;

        // Search Logic (Name OR SR-ID)
        if (search) {
            filter.$or = [
                { studentName: { $regex: search, $options: "i" } },
                { srId: { $regex: search, $options: "i" } }
            ];
        }

        // Pagination Calculation
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // Execute Query
        const students = await StudentNewModel.find(filter)
            .select("-__v") // Exclude internal version
            .populate("currentClassId", "name")
            .populate("currentSectionId", "name")
            .sort({ createdAt: -1 }) // Newest first
            .skip(skip)
            .limit(limitNum);

        // Get Total Count (for frontend pagination)
        const total = await StudentNewModel.countDocuments(filter);

        return res.status(200).json({
            ok: true,
            data: students,
            pagination: {
                totalItems: total,
                totalPages: Math.ceil(total / limitNum),
                currentPage: pageNum,
                pageSize: limitNum
            }
        });

    } catch (error) {
        console.error("Get All Students Error:", error);
        return res.status(500).json({ ok: false, message: "Internal server error", error: error.message });
    }
};