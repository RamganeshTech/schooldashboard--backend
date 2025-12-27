import mongoose, { Schema } from "mongoose";

const denominationSchema = new mongoose.Schema({
    label: { type: String }, // "500", "200", "100"
    count: { type: Number, default: 0 }
}, { _id: false });


const feeHeads = new Schema({
    feeHead: { type: String, default: null },
    amount: { type: Number, default: 0 }
}, { _id: true })

const FeeTransactionSchema = new mongoose.Schema({
    schoolId: { type: mongoose.Schema.Types.ObjectId, ref: "SchoolModel", },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "StudentNewModel", },
    recordId: { type: mongoose.Schema.Types.ObjectId, ref: "StudentRecord", }, // The Year Ledger
    academicYear: { type: String, default: null },

    receiptNo: { type: String, }, // REC-2025-001

    paymentDate: { type: Date, default: new Date() },
    paymentMode: { type: String, enum: ["cash", "upi", "cheque", "bank_transfer"], },

    amountPaid: { type: Number, },

    // The Allocation (Snapshot of what this receipt paid for)
    allocation: {
        type: [feeHeads], default: []
    },

    // Cash Denominations (Array of Objects as requested)
    cashDenominations: {
        type: [denominationSchema],
        default: []
    },

    // Cheque / UPI Details
    referenceNumber: { type: String },
    bankName: { type: String },
    chequeDate: { type: String },

    collectedBy: { type: mongoose.Schema.Types.ObjectId, ref: "UserModel" },
    remarks: { type: String },

    status: { type: String, enum: ["success", "cancelled", "bounced", "pending", "draft"], default: "success" }

}, { timestamps: true });


FeeTransactionSchema.index({
    schoolId: 1,
    studentId: 1,
    recordId: 1
});

const FeeTransactionModel = mongoose.model('FeeTransactionModel', FeeTransactionSchema);

export default FeeTransactionModel