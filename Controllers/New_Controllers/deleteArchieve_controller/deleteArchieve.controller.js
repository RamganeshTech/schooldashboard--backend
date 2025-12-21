import mongoose from "mongoose";
import { DeletedArchiveModel } from "../../../Models/New_Model/deleteArchive_model/deleteArchieve.model.js";

export const archiveData = async ({ 
    schoolId, 
    category, 
    originalId, 
    deletedData, 
    deletedBy, 
    reason 
}) => {
    try {
        const newArchive = new DeletedArchiveModel({
            schoolId,
            category,
            originalId,
            deletedData,
            deletedBy,
            reason: reason || null
        });

        

        await newArchive.save();


        console.log(`[Archive] Successfully archived ${category} - ${originalId}`);
        return newArchive;

    } catch (error) {
        // We log the error but usually don't throw it, 
        // to prevent the main delete flow from failing just because archiving failed.
        console.error("[Archive Error] Failed to archive data:", error);
        return null; 
    }
};




// ---------------------------------------------------
// 1. GET ALL ARCHIVED ITEMS (With Pagination & Filters)
// ---------------------------------------------------
export const getAllDeletedItems = async (req, res) => {
    try {
        const { schoolId, category, page = 1, limit = 10 } = req.query;

        if (!schoolId) {
            return res.status(400).json({ ok: false, message: "schoolId is required" });
        }

        // Build Query
        const query = { schoolId: new mongoose.Types.ObjectId(schoolId) };

        // Optional: Filter by specific category (e.g., only show deleted 'Expense')
        if (category) {
            // query.category = category
             query.category = { $regex: new RegExp(category, "i") };
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Fetch Data
        const archives = await DeletedArchiveModel.find(query)
            .populate("deletedBy", "userName role _id") // Show who deleted it
            .sort({ deletedAt: -1 }) // Newest deleted first
            .skip(skip)
            .limit(parseInt(limit));

        // Get Count
        const totalDocs = await DeletedArchiveModel.countDocuments(query);

        res.status(200).json({
            ok: true,
            message: "Archived items fetched successfully",
            data: archives,
            pagination: {
                total: totalDocs,
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalDocs / parseInt(limit)),
                limit: parseInt(limit)
            }
        });

    } catch (error) {
        console.error("Get All Archive Error:", error);
        res.status(500).json({ ok: false, message: "Failed to fetch archives", error: error.message });
    }
};

// ---------------------------------------------------
// 2. GET ARCHIVED ITEM BY ID (View Details)
// ---------------------------------------------------
export const getDeletedItemById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ ok: false, message: "Invalid Archive ID" });
        }

        const item = await DeletedArchiveModel.findById(id)
            .populate("deletedBy", "userName role _id");

        if (!item) {
            return res.status(404).json({ ok: false, message: "Archived item not found" });
        }

        res.status(200).json({
            ok: true,
            data: item
        });

    } catch (error) {
        console.error("Get Archive By ID Error:", error);
        res.status(500).json({ ok: false, message: "Failed to fetch item", error: error.message });
    }
};

// ---------------------------------------------------
// 3. PERMANENTLY DELETE (Empty Trash)
// ---------------------------------------------------
export const deletePermanently = async (req, res) => {
    try {
        const { id } = req.params;

        // Role Check (Optional but recommended)
        // if (req.user.role !== 'correspondent') return res.status(403).json(...)

        const deletedItem = await DeletedArchiveModel.findByIdAndDelete(id);

        if (!deletedItem) {
            return res.status(404).json({ ok: false, message: "Archived item not found" });
        }

        res.status(200).json({
            ok: true,
            message: "Record permanently deleted from archive.",
            data: deletedItem // Returns what was removed
        });

    } catch (error) {
        console.error("Permanent Delete Error:", error);
        res.status(500).json({ ok: false, message: "Failed to delete item", error: error.message });
    }
};