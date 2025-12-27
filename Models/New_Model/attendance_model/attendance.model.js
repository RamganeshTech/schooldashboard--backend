import mongoose from "mongoose";

// Sub-schema for individual student status
const recordSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "StudentNewModel", required: true },
    studentName: { type: String }, // Cache name for faster reporting
    rollNumber: { type: String },  // Cache roll no
    status: {
        type: String,
        enum: ["present", "absent", "late", "half-day"],
        required: true
    },
    remark: { type: String, default: null }
}, { _id: false });

// Sub-schema for Audit Trail (Corrections)
const correctionSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "StudentNewModel" },
    studentName: String,
    oldStatus: String,
    newStatus: String,
    modifiedAt: { type: Date, default: new Date() }
}, { _id: false });


const AttendanceSchema = new mongoose.Schema({
    schoolId: { type: mongoose.Schema.Types.ObjectId, ref: "SchoolModel", required: true },

    // Context
    academicYear: { type: String, required: true }, // "2025-2026"
    classId: { type: mongoose.Schema.Types.ObjectId, ref: "ClassModel", default: null },
    sectionId: { type: mongoose.Schema.Types.ObjectId, ref: "SectionModel", default: null },

    // The "Register" Date (Normalized to Midnight)
    date: { type: Date, required: true },

    // Who took it originally?
    takenBy: { type: mongoose.Schema.Types.ObjectId, ref: "UserModel", required: true },

    // The Attendance List (Array of 30-50 students)
    records: [recordSchema],

    // The History of Mistakes/Corrections
    corrections: [correctionSchema]

}, { timestamps: true });

AttendanceSchema.index({schoolId:1, academicYear:1});

const AttendanceModel = mongoose.model('AttendanceModel', AttendanceSchema);
export default AttendanceModel;