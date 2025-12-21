import mongoose from "mongoose";
import { FinanceLedgerModel } from "../../../Models/New_Model/financeLedger_model/financeLedger.model.js";

export const createLedgerEntry = async ({
    schoolId,
    academicYear, // e.g., "2024-2025"
    transactionType, // "CREDIT" or "DEBIT"
    amount,
    date,
    referenceModel, // "ExpenseModel" or "StudentFeeModel"
    referenceId,    // The _id of the expense/fee
    studentRecordId = null,
    category,       // "Salary", "Term 1 Fee", etc.
    section,
    paymentMode,
    description,
    createdBy       // User ID (Accountant/Admin)
}, session = null) => {
    try {
        const newEntry = new FinanceLedgerModel({
            schoolId,
            academicYear,
            transactionType,
            amount,
            date: date || new Date(),
            referenceModel,
            referenceId,
            section,
            studentRecordId,
            category,
            paymentMode,
            description,
            createdBy,
            status: "active" // Default status
        });

        // await newEntry.save();

        // ✅ USE SESSION ONLY IF PROVIDED
        if (session) {
            await newEntry.save({ session });
        } else {
            await newEntry.save();
        }

        console.log(`[Ledger] New ${transactionType} entry created: ${amount}`);
        return newEntry;
    } catch (error) {
        // Critical Error: If Ledger fails, your financial reports will be wrong.
        // We log it heavily. In a strict system, you might want to throw error to rollback the transaction.
        console.error("[Ledger Error] Failed to create entry:", error);
        return null;
    }
};




export const getAllTransactions = async (req, res) => {
    try {
        const {
            schoolId,
            academicYear,
            transactionType, // CREDIT or DEBIT
            accountType,     // CASH_IN_HAND or BANK_ACCOUNT
            status,          // active or cancelled
            paymentMode,
            fromDate,
            toDate,
            page = 1,
            limit = 10
        } = req.query;

        if (!schoolId) {
            return res.status(400).json({ ok: false, message: "schoolId is required" });
        }

        // 1. Build Query
        const query = { schoolId: new mongoose.Types.ObjectId(schoolId) };

        if (academicYear) query.academicYear = academicYear;
        if (transactionType) query.transactionType = transactionType;
        if (accountType) query.accountType = accountType;
        if (status) query.status = status;
        if (paymentMode) query.paymentMode = paymentMode;

        // Date Range Filter
        if (fromDate || toDate) {
            query.date = {};
            if (fromDate) query.date.$gte = new Date(fromDate);
            if (toDate) {
                const endDate = new Date(toDate);
                endDate.setHours(23, 59, 59, 999);
                query.date.$lte = endDate;
            }
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        // 2. Fetch Data
        const transactions = await FinanceLedgerModel.find(query)
            .populate("studentRecordId", "studentId className sectionName _id") // If linked to student
            .populate("createdBy", "userName role _id") // Who made this entry
            .sort({ date: -1, createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        // 3. Count
        const totalDocs = await FinanceLedgerModel.countDocuments(query);

        res.status(200).json({
            ok: true,
            message: "Transactions fetched successfully",
            data: transactions,
            pagination: {
                total: totalDocs,
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalDocs / parseInt(limit)),
                limit: parseInt(limit)
            }
        });

    } catch (error) {
        console.error("Get All Finance Error:", error);
        res.status(500).json({ ok: false, message: "Failed to fetch transactions", error: error.message });
    }
};




export const getTransactionById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ ok: false, message: "Invalid Transaction ID" });
        }

        const transaction = await FinanceLedgerModel.findById(id)
            .populate("studentRecordId", "studentId className sectionName _id")
            .populate("createdBy", "userName role _id")
            .populate("cancelledBy", "userName role _id");

        if (!transaction) {
            return res.status(404).json({ ok: false, message: "Transaction not found" });
        }

        res.status(200).json({
            ok: true,
            data: transaction
        });

    } catch (error) {
        console.error("Get Transaction By ID Error:", error);
        res.status(500).json({ ok: false, message: "Failed to fetch transaction", error: error.message });
    }
};






export const cancelTransaction = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        // 1. Strict Role Check
        if (req.user.role !== "correspondent") {
            return res.status(403).json({
                ok: false,
                message: "Access Denied. Only Correspondent can cancel financial transactions."
            });
        }

        if (!reason) {
            return res.status(400).json({ ok: false, message: "Cancellation reason is mandatory." });
        }

        // 2. Find and Update
        const transaction = await FinanceLedgerModel.findByIdAndUpdate(
            id,
            {
                status: "cancelled",
                cancelledBy: req.user._id,
                cancellationReason: reason
            },
            { new: true }
        );

        if (!transaction) {
            return res.status(404).json({ ok: false, message: "Transaction not found" });
        }

        res.status(200).json({
            ok: true,
            message: "Transaction cancelled successfully.",
            data: transaction
        });

    } catch (error) {
        console.error("Cancel Transaction Error:", error);
        res.status(500).json({ ok: false, message: "Failed to cancel transaction", error: error.message });
    }
};


