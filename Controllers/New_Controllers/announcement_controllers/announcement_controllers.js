import mongoose from "mongoose";
import { uploadFileToS3New } from "../../../Utils/s4UploadsNew.js";
import SchoolModel from "../../../Models/New_Model/SchoolModel/shoolModel.model.js";
import { AnnouncementModel } from "../../../Models/New_Model/announcement_model/announcement.model.js";
import { archiveData } from "../deleteArchieve_controller/deleteArchieve.controller.js";

export const createAnnouncement = async (req, res) => {
    try {
        let {
            schoolId,
            academicYear,
            title, description, type, priority,
            targetAudience, targetClasses, // Coming from Body
            // publishDate, expiryDate
        } = req.body;

        const userId = req.user._id;

        // 1. Basic Validation
        if (!schoolId || !title || !targetAudience) {
            return res.status(400).json({ ok: false, message: "Missing required fields: schoolId, title, targetAudience" });
        }

        // 2. PARSE TARGET AUDIENCE (Ensure it is an Array)
        // -----------------------------------------------------
        let parsedAudience = [];

        // FormData sends arrays as JSON strings (e.g., '["parent", "specific_classes"]')
        // or sometimes just the array if using raw JSON body.
        if (typeof targetAudience === 'string') {
            try {
                parsedAudience = JSON.parse(targetAudience);
            } catch (e) {
                // Should not happen if frontend sends JSON array string, but safe fallback
                return res.status(400).json({ ok: false, message: "targetAudience must be a valid JSON array string." });
            }
        } else if (Array.isArray(targetAudience)) {
            parsedAudience = targetAudience;
        }


        // Ensure we work with lowercase for comparison
        parsedAudience = parsedAudience.map(a => a.toLowerCase());

        const allowedAudiences = ["all", "parent", "teacher", "student", "specific_classes"];
        const hasInvalidValue = parsedAudience.some(role => !allowedAudiences.includes(role));

        if (hasInvalidValue) {
            return res.status(400).json({
                ok: false,
                message: `Invalid target audience. Allowed values: ${allowedAudiences.join(", ")}`
            });
        }


        // 2. ROBUST PARSING for Target Classes
        let finalClassIds = [];

        // Note: Check against lowercase 'specific_classes' to match your logic
        if (targetAudience.includes("specific_classes")) {
            if (!targetClasses) {
                return res.status(400).json({ ok: false, message: "Please select at least one class." });
            }

            try {
                // Step A: Parse String back to JSON (if coming from FormData)
                const parsed = typeof targetClasses === 'string' ? JSON.parse(targetClasses) : targetClasses;

                // Step B: Extract IDs safely
                if (Array.isArray(parsed)) {
                    finalClassIds = parsed.map(item => {
                        // Case 1: Item is just a string ID ["id1", "id2"]
                        if (typeof item === 'string') return item;

                        // Case 2: Item is an object from a dropdown [{ _id: "id1", name: "A" }]
                        if (typeof item === 'object' && item !== null) {
                            return item._id || item.value; // Check common key names
                        }
                        return null;
                    }).filter(id => id); // Remove nulls/undefined
                }
            } catch (err) {
                // console.error("Parsing Error:", err);
                // return res.status(400).json({ ok: false, message: "Invalid format for targetClasses" });
                console.error("Class Parsing Error:", err);
                return res.status(400).json({
                    ok: false,
                    message: "Invalid format for targetClasses. Must be an array of IDs or Objects. either ['id1', 'id2'] or [{ _id: 'id1', name: '6' }]"
                });
            }

            if (finalClassIds.length === 0) {
                return res.status(400).json({ ok: false, message: "Please select at least one valid class." });
            }
        }



        if (!academicYear) {
            // // 1. Get Academic Year (Source of Truth)
            const schoolDoc = await SchoolModel.findById(schoolId)
            academicYear = schoolDoc?.currentAcademicYear;

            if (!academicYear) {
                return res.status(500).json({
                    ok: false,
                    message: "Current Academic year is not set for the school , either set in school department or else provide the academic year"
                });
            }
        }

        // 4. Handle Attachments (Images, PDFs, Videos)
        let attachments = [];
        if (req.files && req.files.length > 0) {
            attachments = await Promise.all(
                req.files.map(async (file) => {
                    const uploadData = await uploadFileToS3New(file);

                    // Determine Type
                    let fileType = "pdf";
                    if (file.mimetype.startsWith("image/")) fileType = "image";
                    else if (file.mimetype.startsWith("video/")) fileType = "video";

                    return {
                        _id: new mongoose.Types.ObjectId(),
                        type: fileType,
                        key: uploadData.key,
                        url: uploadData.url,
                        originalName: file.originalname,
                        uploadedAt: new Date()
                    };
                })
            );
        }

        // 5. Save to DB
        const newAnnouncement = new AnnouncementModel({
            schoolId,
            academicYear,
            title,
            description,
            type: type || "announcement",
            priority: priority || "normal",
            targetAudience: parsedAudience,
            targetClasses: finalClassIds,
            attachments,
            createdBy: userId,

            // Logic: If user didn't provide dates, default Publish to NOW, Expiry to NULL
            // publishDate: publishDate || new Date(),
            // expiryDate: expiryDate || null
        });

        await newAnnouncement.save();

        // TODO: Trigger Push Notifications here (FCM) based on targetAudience

        res.status(201).json({
            ok: true,
            message: "Announcement created successfully",
            data: newAnnouncement
        });

    } catch (error) {
        console.error("Create Announcement Error:", error);
        res.status(500).json({ ok: false, message: error.message });
    }
};




export const getAnnouncements = async (req, res) => {
    try {
        const { schoolId, page = 1, limit = 10, studentClassId } = req.query;
        const userRole = req.user.role.toLowerCase();

        if (!schoolId) return res.status(400).json({ ok: false, message: "schoolId required" });

        // --- BASE QUERY ---
        let query = {
            schoolId: new mongoose.Types.ObjectId(schoolId),
            // isDeleted: false // 1. NEVER show deleted items
        };

        const now = new Date();

        // --- ROLE BASED FILTERING ---

        // ADMIN / PRINCIPAL / CORRESPONDENT
        // They should see ALL (Active) posts, even future scheduled ones
        if (["administrator", "principal", "correspondent"].includes(userRole)) {
            // No extra filters needed. They see everything.

        }

        // TEACHERS / STAFF
        else if (["teacher"].includes(userRole)) {
            query.targetAudience = { $in: ["all", "teacher"] };

            // // Logic: Must be published already
            // query.publishDate = { $lte: now }; 

            // // Logic: Must NOT be expired (OR expiry is null)
            // query.$or = [
            //     { expiryDate: null },
            //     { expiryDate: { $gte: now } }
            // ];
        }

        // PARENTS / STUDENTS
        else if (["parent"].includes(userRole)) {
            // 1. Date Logic (Visible & Not Expired)
            // query.publishDate = { $lte: now };
            // query.$and = [
            //     { $or: [{ expiryDate: null }, { expiryDate: { $gte: now } }] }
            // ];

            // 2. Audience Logic
            // If we know the student's class, show Class Specific + All
            if (studentClassId) {
                query.$or = [
                    { targetAudience: { $in: ["all", "parent"] } },
                    {
                        targetAudience: "specific_classes",
                        targetClasses: new mongoose.Types.ObjectId(studentClassId)
                    }
                ];
            } else {
                // Fallback if class not provided
                query.targetAudience = { $in: ["all", "parent"] };
            }
        }

        // --- PAGINATION ---
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const announcements = await AnnouncementModel.find(query)
            .sort({ createdAt: -1 }) // High priority first, then newest
            .skip(skip)
            .limit(parseInt(limit))
            .populate("createdBy", "userName role _id");

        const total = await AnnouncementModel.countDocuments(query);

        res.status(200).json({
            ok: true,
            data: announcements,
            pagination: {
                total,
                page: parseInt(page),
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });

    } catch (error) {
        console.error("Get Announcements Error:", error);
        res.status(500).json({ ok: false, message: error.message });
    }
};



export const getAnnouncementById = async (req, res) => {
    try {
        const { id } = req.params;
        const { studentClassId } = req.query; // Required for Parent/Student validation
        const userRole = req?.user?.role.toLowerCase();

        // 1. Validate ID
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ ok: false, message: "Invalid Announcement ID" });
        }

        // 2. Fetch the Announcement
        const announcement = await AnnouncementModel.findById(id)
            .populate("createdBy", "userName role _id")
            .populate("targetClasses", "name _id"); // Populate class names if specific

        // 3. Check Existence & Soft Delete
        if (!announcement) {
            return res.status(404).json({ ok: false, message: "Announcement not found" });
        }

        // If deleted, it's 404 for everyone (unless you want Admins to see deleted ones)
        // if (announcement.isDeleted) {
        //     return res.status(404).json({ ok: false, message: "Announcement not found (Deleted)" });
        // }

        // =========================================================
        // ACCESS CONTROL LOGIC
        // =========================================================

        const isAdminLevel = ["correspondent", "principal", "viceprincipal", "administrator"].includes(userRole);

        // A. ADMINS: Can see everything. Skip checks.
        if (isAdminLevel) {
            return res.status(200).json({ ok: true, data: announcement });
        }

        // B. STANDARD USERS (Teachers, Parents, Students): Needs checks.
        // const now = new Date();

        // // Check 1: Is it Published?
        // if (new Date(announcement.publishDate) > now) {
        //     return res.status(403).json({ ok: false, message: "This announcement is not published yet." });
        // }

        // // Check 2: Is it Expired?
        // if (announcement.expiryDate && new Date(announcement.expiryDate) < now) {
        //     return res.status(403).json({ ok: false, message: "This announcement has expired." });
        // }

        // Check 3: Audience Validation
        const audience = announcement.targetAudience;

        if (userRole === "teacher") {
            // Teachers can see "ALL" and "STAFF"
            if (!["all", "teacher"].includes(audience)) {
                return res.status(403).json({ ok: false, message: "Access Denied. This is not for teachers." });
            }
        }
        else if (userRole === "parent") {
            // Parents/Students can see "ALL", "PARENTS", "STUDENTS"
            const allowedGeneral = ["all", "parent"];

            if (audience === "specific_classes") {
                // Must provide studentClassId to verify access
                if (!studentClassId) {
                    return res.status(400).json({
                        ok: false,
                        message: "studentClassId is required to view class-specific announcements."
                    });
                }

                // Check if the announcement's targetClasses includes the student's class
                const isClassTargeted = announcement.targetClasses.some(
                    cls => cls._id.toString() === studentClassId
                );

                if (!isClassTargeted) {
                    return res.status(403).json({ ok: false, message: "This announcement is not for your class." });
                }
            }
            else if (!allowedGeneral.includes(audience)) {
                return res.status(403).json({ ok: false, message: "Access Denied." });
            }
        }

        // If all checks pass:
        res.status(200).json({
            ok: true,
            data: announcement
        });

    } catch (error) {
        console.error("Get Announcement By ID Error:", error);
        res.status(500).json({ ok: false, message: error.message });
    }
};


export const updateAnnouncementText = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            academicYear,
            title, description, type, priority,
            targetAudience, targetClasses,
            // publishDate, expiryDate
        } = req.body;



        // 2. Find Existing
        const announcement = await AnnouncementModel.findById(id);
        if (!announcement) {
            return res.status(404).json({ ok: false, message: "Announcement not found" });
        }


        let parsedAudience = announcement.targetAudience;

        if (targetAudience) {
            if (Array.isArray(targetAudience)) {
                parsedAudience = targetAudience;
            } else if (typeof targetAudience === 'string') {
                try {
                    // Try JSON parse e.g. '["parent", "specific_classes"]'
                    parsedAudience = JSON.parse(targetAudience);
                } catch (e) {
                    // Fallback to comma split or single value
                    parsedAudience = targetAudience.split(',').map(s => s.trim());
                }
            }
            // Normalize
            parsedAudience = parsedAudience.map(a => a.toLowerCase());
        }




        // const userRole = req.user.role;

        // // 1. Permissions
        // if (!["correspondent", "principal", "admin", "clerk"].includes(userRole)) {
        //     return res.status(403).json({ ok: false, message: "Access Denied" });
        // }



        // 3. Logic: Parse Target Classes if Audience is Specific
        let finalClassIds = announcement.targetClasses; // Default to existing

        // Check if audience is changing or classes are provided
        if (targetAudience) {
            if (parsedAudience.includes("specific_classes")) {                // If switching to specific, classes must be provided or exist
                if (targetClasses) {
                    try {
                        const parsed = typeof targetClasses === 'string' ? JSON.parse(targetClasses) : targetClasses;
                        if (Array.isArray(parsed)) {
                            finalClassIds = parsed.map(item => {
                                if (typeof item === 'string') return item;
                                if (typeof item === 'object' && item !== null) return item._id || item.value || item.id;
                                return null;
                            }).filter(id => id);
                        }
                    } catch (err) {
                        return res.status(400).json({ ok: false, message: "Invalid format for targetClasses" });
                    }
                } else if (announcement.targetAudience !== "specific_classes") {
                    // Switching to specific but didn't provide classes
                    return res.status(400).json({ ok: false, message: "Target classes required when audience is specific." });
                }
            }
            else {
                // User didn't provide new classes.
                // If the OLD audience didn't include specific_classes, we can't switch to it without classes.
                const wasSpecificBefore = announcement.targetAudience.includes("specific_classes");

                if (!wasSpecificBefore) {
                    return res.status(400).json({ ok: false, message: "Target classes required when switching to 'specific_classes'." });
                }
                // If it was specific before, we keep the existing finalClassIds (line 46)
            }

            if (finalClassIds.length === 0) {
                return res.status(400).json({ ok: false, message: "At least one class is required." });
            }
        }  // CASE B: New audience does NOT include "specific_classes"
        else {
            // Clear the classes array as it's no longer needed
            finalClassIds = [];
        }


        // 4. Update Fields (Only if provided)
        if (academicYear) announcement.academicYear = academicYear;
        if (title) announcement.title = title;
        if (description) announcement.description = description;
        if (type) announcement.type = type;
        if (priority) announcement.priority = priority;
        if (targetAudience) announcement.targetAudience = targetAudience;
        // if (publishDate) announcement.publishDate = publishDate;

        // Handle Expiry Date (Allow nulling it out)
        // if (expiryDate !== undefined) announcement.expiryDate = expiryDate;

        announcement.targetClasses = finalClassIds;

        await announcement.save();

        res.status(200).json({
            ok: true,
            message: "Announcement details updated",
            data: announcement
        });

    } catch (error) {
        console.error("Update Text Error:", error);
        res.status(500).json({ ok: false, message: error.message });
    }
};



export const addAnnouncementAttachments = async (req, res) => {
    try {
        const { id } = req.params;
        // const userRole = req.user.role;

        // // 1. Permissions
        // if (!["correspondent", "principal", "admin", "clerk"].includes(userRole)) {
        //     return res.status(403).json({ ok: false, message: "Access Denied" });
        // }

        // 2. Check Files
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ ok: false, message: "No files uploaded" });
        }

        // 3. Find Announcement
        const announcement = await AnnouncementModel.findById(id);
        if (!announcement) {
            return res.status(404).json({ ok: false, message: "Announcement not found" });
        }

        // 4. Upload Files
        const newAttachments = await Promise.all(
            req.files.map(async (file) => {
                const uploadData = await uploadFileToS3New(file);

                let fileType = "pdf";
                if (file.mimetype.startsWith("image/")) fileType = "image";
                else if (file.mimetype.startsWith("video/")) fileType = "video";

                return {
                    _id: new mongoose.Types.ObjectId(),
                    type: fileType,
                    key: uploadData.key,
                    url: uploadData.url,
                    originalName: file.originalname,
                    uploadedAt: new Date()
                };
            })
        );

        // 5. Push to Array (Append)
        announcement.attachments.push(...newAttachments);
        await announcement.save();

        res.status(200).json({
            ok: true,
            message: `${newAttachments.length} file(s) added successfully`,
            data: announcement.attachments
        });

    } catch (error) {
        console.error("Add Attachment Error:", error);
        res.status(500).json({ ok: false, message: error.message });
    }
};


export const deleteAnnouncementAttachment = async (req, res) => {
    try {
        const { id, fileId } = req.params;
        // const userRole = req.user.role;

        // // 1. Permissions
        // if (!["correspondent", "principal", "admin", "clerk"].includes(userRole)) {
        //     return res.status(403).json({ ok: false, message: "Access Denied" });
        // }

        if (!fileId) {
            return res.status(400).json({ ok: false, message: "fileId is required" });
        }

        // 2. Find Announcement
        const announcement = await AnnouncementModel.findById(id);
        if (!announcement) {
            return res.status(404).json({ ok: false, message: "Announcement not found" });
        }

        // 3. Check if file exists in array
        const fileExists = announcement.attachments.some(att => {

            console.log("fileId", fileId.toString())
            console.log("att._id", att._id.toString())
            return att._id?.toString() === fileId?.toString()
        });
        if (!fileExists) {
            return res.status(404).json({ ok: false, message: "File not found in this announcement" });
        }

        // 4. Delete from S3
        // await deleteFileFromS3(fileKey);

        // 5. Remove from DB Array ($pull)
        await AnnouncementModel.findByIdAndUpdate(id, {
            $pull: { attachments: { _id: fileId } }
        });

        res.status(200).json({
            ok: true,
            message: "Attachment deleted successfully"
        });

    } catch (error) {
        console.error("Delete Attachment Error:", error);
        res.status(500).json({ ok: false, message: error.message });
    }
};



export const deleteAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;
        // const userRole = req.user.role;

        // // 1. Role Check
        // if (!["correspondent", "principal", "admin"].includes(userRole)) {
        //     return res.status(403).json({ ok: false, message: "Access Denied" });
        // }

        // 2. Soft Delete (Update Flag)
        const updated = await AnnouncementModel.findByIdAndDelete(
            id
        );


        // 2. CALL THE ARCHIVE UTILITY
        await archiveData({
            schoolId: updated.schoolId,
            category: "annoucement",
            originalId: updated._id,
            deletedData: updated.toObject(), // Convert Mongoose doc to plain object
            deletedBy: req.user._id || null,
            reason: null, // Optional reason from body
        });


        if (!updated) {
            return res.status(404).json({ ok: false, message: "Announcement not found" });
        }

        res.status(200).json({
            ok: true,
            message: "Announcement deleted successfully",
            data: updated
        });

    } catch (error) {
        res.status(500).json({ ok: false, message: error.message });
    }
};