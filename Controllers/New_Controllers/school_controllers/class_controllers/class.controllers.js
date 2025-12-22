// import ClassModel from "../models/ClassModel.js"; // adjust path
import mongoose from "mongoose";
// import ClassModel from "../../../../Models/New_Model/SchoolModel/classModel.model";
// import UserModel from "../../../../Models/New_Model/UserModel/userModel.model";
import UserModel from "../../../../Models/New_Model/UserModel/userModel.model.js";
import ClassModel from "../../../../Models/New_Model/SchoolModel/classModel.model.js";
import { archiveData } from "../../deleteArchieve_controller/deleteArchieve.controller.js";

// ============================
// GET CLASSES
// ============================
export const getClasses = async (req, res) => {
    try {
        const { schoolId } = req.params;

        const classes = await ClassModel.find({ schoolId }).populate("classTeacherId", "userName email")
            .sort({ order: 1 }); // IMPORTANT: Sort by order (LKG, UKG, 1, 2...)

        return res.status(200).json({ ok: true, data: classes });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ ok: false, message: "Internal server error" });
    }
};

// ============================
// CREATE CLASS
// ============================
export const createClass = async (req, res) => {
    try {
        const { name, order = 0, hasSections = false, classTeacherId = null } = req.body;
        const { schoolId } = req.params

        // Auto-detect schoolId from logged-in user (Best Practice)
        // const schoolId = req.user?.schoolId || req.body.schoolId;


        if (!schoolId || !name) {
            return res.status(400).json({ ok: false, message: "schoolId and name are required" });
        }

        // 2. Duplicate Check
        // Case-insensitive check (e.g., "Grade 1" vs "grade 1")
        const existing = await ClassModel.findOne({
            schoolId,
            name: { $regex: new RegExp(`^${name}$`, "i") }
        });

        if (existing) {
            return res.status(400).json({ ok: false, message: "Class name already exists for this school" });
        }

        // 3. Teacher Validation (If assigning one)
        let finalTeacherId = null;

        // Logic: Only assign teacher if Class has NO sections
        if (!hasSections && classTeacherId) {
            const teacher = await UserModel.findById(classTeacherId);

            if (!teacher) {
                return res.status(404).json({ ok: false, message: "Selected teacher not found" });
            }

            // Ensure the user is actually a Teacher
            if (teacher.role !== "teacher") { // Adjust casing based on your DB
                return res.status(400).json({ ok: false, message: "Selected user is not a Teacher" });
            }

            // Ensure teacher belongs to THIS school
            if (teacher.schoolId.toString() !== schoolId.toString()) {
                return res.status(403).json({ ok: false, message: "Teacher belongs to a different school" });
            }

            finalTeacherId = classTeacherId;
        }



        const newClass = await ClassModel.create({
            schoolId,
            name,
            order,
            hasSections, // If true, teacher is ignored
            classTeacherId: finalTeacherId // If hasSections is true, this remains null
        });

        return res.status(201).json({ ok: true, data: newClass });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ ok: false, message: "Internal server error" });
    }
};

// ============================
// UPDATE CLASS
// ============================
export const updateClass = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, order, hasSections, classTeacherId } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ ok: false, message: "Invalid class ID" });
        }

        const classDoc = await ClassModel.findById(id);
        if (!classDoc) {
            return res.status(404).json({ ok: false, message: "Class not found" });
        }

        // Check for duplicate class name if name is being updated
        if (name && name !== classDoc.name) {
            const existing = await ClassModel.findOne({
                schoolId: classDoc.schoolId,
                name: { $regex: new RegExp(`^${name}$`, "i") },
                _id: { $ne: id } // Exclude current doc
            });
            if (existing) {
                return res.status(400).json({ ok: false, message: "Class name already exists for this school" });
            }
            classDoc.name = name;
        }

        // Update fields
        // if (name) classDoc.name = name;
        if (order !== undefined) classDoc.order = order;
        if (hasSections !== undefined) classDoc.hasSections = hasSections;
        if (classTeacherId !== undefined) classDoc.classTeacherId = classTeacherId;


        await classDoc.save();

        return res.status(200).json({ ok: true, data: classDoc });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ ok: false, message: "Internal server error" });
    }
};

// ============================
// DELETE CLASS
// ============================
export const deleteClass = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ ok: false, message: "Invalid class ID" });
        }

        // TODO: FUTURE SAFETY CHECK
        // Check if any Sections exist for this class. If so, BLOCK delete.
        // const sections = await SectionModel.findOne({ classId: id });
        // if (sections) return res.status(400).json({ message: "Delete sections first" });

        const deleted = await ClassModel.findByIdAndDelete(id);
        if (!deleted) {
            return res.status(404).json({ ok: false, message: "Class not found" });
        }

        await archiveData({
            schoolId: deleted.schoolId,
            category: "class",
            originalId: deleted._id,
            deletedData: deleted.toObject(), // Convert Mongoose doc to plain object
            deletedBy: req.user._id || null,
            reason: null, // Optional reason from body
        });


        return res.status(200).json({ ok: true, message: "Class deleted successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ ok: false, message: "Internal server error" });
    }
};
