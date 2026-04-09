import mongoose from "mongoose";

const { Schema, model } = mongoose;



const subjectSchema = new Schema({
    subject: { type: String, },
    //   examId: { type: Schema.Types.ObjectId, ref: "ExamModel", required: true }, // e.g., "Unit Test 1", "Finals"

    // === DATA ===
    marksObtained: { type: Number, default: 0 },
    maxMarks: { type: Number, default: 100 },
    minPassingMarks: { type: Number, default: 35 },

    grade: { type: String, default: null }, // A, B, C, etc.
}, { _id: true })

const markReportSchema = new Schema({
    // === TENANCY & TIME ===
    schoolId: { type: Schema.Types.ObjectId, ref: "SchoolModel", required: true },
    academicYear: { type: String, required: true }, // e.g., "2025-2026"

    // === HIERARCHY ===
    classId: { type: Schema.Types.ObjectId, ref: "ClassModel", required: true },
    sectionId: { type: Schema.Types.ObjectId, ref: "SectionModel", default: null },

    // === THE TARGETS ===
    studentId: { type: Schema.Types.ObjectId, ref: "StudentNewModel", required: true },

    subjects: { type: [subjectSchema], default: [] },

    remarks: { type: String, default: "" },

    isAbsent: { type: Boolean, default: false },

    // === METADATA ===
    recordedBy: { type: Schema.Types.ObjectId, ref: "UserModel" }, // The teacher who entered the marks
}, { timestamps: true });

// CRITICAL FOR SCALABILITY: COMPOUND INDEXES
// This allows you to quickly find "All marks for a student" OR "All marks for a specific exam in a class"
markReportSchema.index({ schoolId: 1, academicYear: 1, classId: 1, studentId: 1 });

const MarkReportModel = model("MarkReportModel", markReportSchema);

export default MarkReportModel;