import mongoose from "mongoose";

const StudentRecordSchema = mongoose.Schema({
    // === REFERENCES ===
    schoolId: { type: mongoose.Schema.Types.ObjectId, ref: "SchoolModel", default:null },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "StudentNewModel", default:null },

    // === TIME CONTEXT (The Critical Field) ===
    academicYear: { type: String, required: true }, // e.g., "2025-2026"

    // === LOCATION CONTEXT (For THIS Year) ===
    classId: { type: mongoose.Schema.Types.ObjectId, ref: "ClassModel", required: true },
    sectionId: { type: mongoose.Schema.Types.ObjectId, ref: "SectionModel", default: null },

    // Storing Names as Strings too (for Reporting speed/Legacy support)
    className: { type: String, required: true }, // "10" or "LKG"
    sectionName: { type: String, required: true }, // "A" or "N/A"

    // === ENROLLMENT STATUS ===
    newOld: { type: String, required: true }, // "New" or "Old" (Specific to this year)
    rollNumber: { type: String, default: null },

    // === FINANCIALS: FEE STRUCTURE (Targets) ===
    feeStructure: {
        admissionFee: { type: Number, default: 0 },
        firstTermAmt: { type: Number, default: 0 },
        secondTermAmt: { type: Number, default: 0 },
        annualFee: { type: Number, default: 0 },
        busFirstTermAmt: { type: Number, default: 0 },
        busSecondTermAmt: { type: Number, default: 0 },
    },

    // === FINANCIALS: FEE PAID (Actuals) ===
    feePaid: {
        admissionFee: { type: Number, default: 0 },
        firstTermAmt: { type: Number, default: 0 },
        secondTermAmt: { type: Number, default: 0 },
        annualFee: { type: Number, default: 0 },
        busFirstTermAmt: { type: Number, default: 0 },
        busSecondTermAmt: { type: Number, default: 0 },
    },

    // === DISCOUNTS / CONCESSIONS ===
    concession: {
        isApplied: { type: Boolean, default: false },
        type: { type: String, enum: ["Percentage", "Flat"], default: null },
        value: { type: Number, default: 0 },
        remark: { type: String },
        proofUrl: { type: String }, // S3 Link
        approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "UserModel" }
    },

    dues: {
        academicDues: {
            type: Number,
            default: null
        },
        busfirstTermDues: {
            type: Number,
            default: null
        },
        busSecondTermDues: {
            type: Number,
            default: null
        },
    },



    // === CALCULATED TOTALS ===
    // totalDue: { type: Number, default: 0 },
    isFullyPaid: { type: Boolean, default: false },

    // === OPTIONAL: BUS DETAILS FOR THIS YEAR ===
    busPoint: {
        type: String, default: null
    },

}, { timestamps: true });

// CONSTRAINT: One Record per Student per Academic Year
// StudentRecordSchema.index({ studentId: 1, academicYear: 1 }, { unique: true });

const StudentRecordModel = mongoose.model('StudentRecord', StudentRecordSchema);
export default StudentRecordModel;