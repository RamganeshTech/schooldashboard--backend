import mongoose, { Schema } from "mongoose";

export const uploadSchema = new Schema({
    type: { type: String, enum: ["image", "pdf"] },
    key: { type: String, },
    url: { type: String, },
    originalName: String,
    uploadedAt: { type: Date, default: new Date() }
}, {_id:true});


const homeworkSchema = new mongoose.Schema(
    {
        schoolId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "SchoolModel",
            default: null
        },
        academicYear: {
            type: String, // e.g., "2025-2026"
            default: null
        },
        classId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ClassModel",
            default: null
        },
        sectionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "SectionModel",
            default: null, // If null, it's for all sections
        },
        homeworkDate: {
            type: Date,
            default: new Date(),
        },
        // Array of homework for different subjects for THIS specific day
        subjects: [
            {
                subjectName: { type: String, },
                teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "UserModel", default: null },
                description: { type: String, },
                attachments: { type: [uploadSchema] },
                updatedAt: { type: Date, default: new Date() },
            },
        ],
    },
    { timestamps: true }
);

// Compound Index: Ensures we can quickly find a specific day's work for a class
homeworkSchema.index({ schoolId: 1, classId: 1, sectionId: 1, homeworkDate: -1 });

const HomeworkModel = mongoose.model("HomeWorkModel", homeworkSchema);

export default HomeworkModel;