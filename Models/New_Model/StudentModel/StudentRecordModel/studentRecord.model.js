import mongoose, { Schema } from "mongoose";



const uploadSchema = new Schema({
    type: { type: String, enum: ["image", "pdf"] },
    key: { type: String, },
    url: { type: String, },
    originalName: String,
    uploadedAt: { type: Date, default: new Date() }
});



const StudentRecordSchema = mongoose.Schema({
    // === REFERENCES ===
    schoolId: { type: mongoose.Schema.Types.ObjectId, ref: "SchoolModel", default: null },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "StudentNewModel", default: null },
    studentName: { type: String },

    // === TIME CONTEXT (The Critical Field) ===
    academicYear: { type: String, required: true }, // e.g., "2025-2026"

    // === LOCATION CONTEXT (For THIS Year) ===
    classId: { type: mongoose.Schema.Types.ObjectId, ref: "ClassModel", default: null },
    sectionId: { type: mongoose.Schema.Types.ObjectId, ref: "SectionModel", default: null },

    // Storing Names as Strings too (for Reporting speed/Legacy support)
    className: { type: String, default: null }, // "10" or "LKG"
    sectionName: { type: String, default: null }, // "A" or "N/A"

    // === ENROLLMENT STATUS ===
    newOld: { type: String, }, // "New" or "Old" (Specific to this year)
    rollNumber: { type: String, default: null },

    // === FINANCIALS: FEE STRUCTURE (Targets) ===
    feeStructure: {
        admissionFee: { type: Number, default: 0 },
        firstTermAmt: { type: Number, default: 0 },
        secondTermAmt: { type: Number, default: 0 },
        busFirstTermAmt: { type: Number, default: 0 },
        busSecondTermAmt: { type: Number, default: 0 },
    },

    // === 2. FEE PAID (The Actuals / Collected So Far) ===
    // This increases every time a receipt is generated via FIFO
    feePaid: {
        admissionFee: { type: Number, default: 0 },
        firstTermAmt: { type: Number, default: 0 },
        secondTermAmt: { type: Number, default: 0 },
        busFirstTermAmt: { type: Number, default: 0 },
        busSecondTermAmt: { type: Number, default: 0 },
    },


    // === DISCOUNTS / CONCESSIONS ===
    concession: {
        isApplied: { type: Boolean, default: false },
        type: { type: String, default: null },//percentage or amount
        value: { type: Number, default: 0 },
        inAmount: { type: Number, default: 0 },
        remark: { type: String },
        proof: { type: uploadSchema, default: null }, // S3 Link
        approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "UserModel" }
    },

    dues: {
        admissionDues: { type: Number, default: null },
        firstTermDues: { type: Number, default: null },
        secondTermDues: { type: Number, default: null },
        busfirstTermDues: { type: Number, default: null },
        busSecondTermDues: { type: Number, default: null },
    },
    isActive: { type: Boolean, default: true },

    isBusApplicable: { type: Boolean, default: false }, // The new field

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