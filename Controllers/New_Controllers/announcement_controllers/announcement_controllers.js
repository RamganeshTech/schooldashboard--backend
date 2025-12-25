import mongoose from "mongoose";
import { uploadFileToS3New } from "../../../Utils/s4UploadsNew.js";
import SchoolModel from "../../../Models/New_Model/SchoolModel/shoolModel.model.js";
import { AnnouncementModel } from "../../../Models/New_Model/announcement_model/announcement.model.js";
import { archiveData } from "../deleteArchieve_controller/deleteArchieve.controller.js";
import StudentNewModel from "../../../Models/New_Model/StudentModel/studentNew.model.js";
import UserModel from "../../../Models/New_Model/UserModel/userModel.model.js";

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



//  FIRST VERSION
// export const getAnnouncements = async (req, res) => {
//     try {
//         const { schoolId, page = 1, limit = 10, studentClassId } = req.query;
//         const userRole = req.user.role.toLowerCase();

//         if (!schoolId) return res.status(400).json({ ok: false, message: "schoolId required" });

//         // --- BASE QUERY ---
//         let query = {
//             schoolId: new mongoose.Types.ObjectId(schoolId),
//             // isDeleted: false // 1. NEVER show deleted items
//         };

//         const now = new Date();

//         // --- ROLE BASED FILTERING ---

//         // ADMIN / PRINCIPAL / CORRESPONDENT
//         // They should see ALL (Active) posts, even future scheduled ones
//         if (["administrator", "principal", "correspondent"].includes(userRole)) {
//             // No extra filters needed. They see everything.

//         }

//         // TEACHERS / STAFF
//         else if (["teacher"].includes(userRole)) {
//             query.targetAudience = { $in: ["all", "teacher"] };

//             // // Logic: Must be published already
//             // query.publishDate = { $lte: now }; 

//             // // Logic: Must NOT be expired (OR expiry is null)
//             // query.$or = [
//             //     { expiryDate: null },
//             //     { expiryDate: { $gte: now } }
//             // ];
//         }

//         // PARENTS / STUDENTS
//         else if (["parent"].includes(userRole)) {
//             // 1. Date Logic (Visible & Not Expired)
//             // query.publishDate = { $lte: now };
//             // query.$and = [
//             //     { $or: [{ expiryDate: null }, { expiryDate: { $gte: now } }] }
//             // ];

//             // 2. Audience Logic
//             // If we know the student's class, show Class Specific + All
//             if (studentClassId) {
//                 query.$or = [
//                     { targetAudience: { $in: ["all", "parent"] } },
//                     {
//                         targetAudience: "specific_classes",
//                         targetClasses: new mongoose.Types.ObjectId(studentClassId)
//                     }
//                 ];
//             } else {
//                 // Fallback if class not provided
//                 query.targetAudience = { $in: ["all", "parent"] };
//             }
//         }

//         // --- PAGINATION ---
//         const skip = (parseInt(page) - 1) * parseInt(limit);

//         const announcements = await AnnouncementModel.find(query)
//             .sort({ createdAt: -1 }) // High priority first, then newest
//             .skip(skip)
//             .limit(parseInt(limit))
//             .populate("createdBy", "userName role _id");

//         const total = await AnnouncementModel.countDocuments(query);

//         res.status(200).json({
//             ok: true,
//             data: announcements,
//             pagination: {
//                 total,
//                 page: parseInt(page),
//                 totalPages: Math.ceil(total / parseInt(limit))
//             }
//         });

//     } catch (error) {
//         console.error("Get Announcements Error:", error);
//         res.status(500).json({ ok: false, message: error.message });
//     }
// };


//  SECOND VERISON
// export const getAnnouncements = async (req, res) => {
//     try {
//         const { schoolId, page = 1, limit = 10, classId, studentId } = req.query;
//         const userRole = req.user?.role?.toLowerCase();

//         if (!schoolId) {
//             return res.status(400).json({ ok: false, message: "schoolId required" });
//         }

//         // --- PRE-FETCH: Get Class ID from Student ID (For Parents) ---
//         let derivedClassId = classId;

//         if (userRole === "parent" && studentId && !classId) {
//             if (!mongoose.Types.ObjectId.isValid(studentId)) {
//                 return res.status(400).json({ ok: false, message: "Invalid studentId format" });
//             }

//             // Find the student and get their current class
//             const student = await StudentNewModel.findById(studentId).select("currentClassId");

//             if (student && student.currentClassId) {
//                 derivedClassId = student.currentClassId;
//             } else {
//                 return res.status(404).json({ ok: false, message: "Student or Class not found" });
//             }
//         }


//         // --- BASE QUERY ---
//         let query = {
//             schoolId: new mongoose.Types.ObjectId(schoolId),
//             // isDeleted: false // Uncomment if you use soft deletes
//         };

//         // Optional: Date Filtering (Uncomment if needed)
//         // const now = new Date();
//         // query.publishDate = { $lte: now }; 
//         // query.$or = [{ expiryDate: null }, { expiryDate: { $gte: now } }];

//         // =========================================================
//         // ROLE BASED QUERY CONSTRUCTION
//         // =========================================================

//         // 1. ADMINS: See everything
//         if (["administrator", "principal", "correspondent", "viceprincipal"].includes(userRole)) {
//             // No additional filters needed. They see all posts for the school.
//         }

//         // 2. TEACHERS: See "all" and "teacher"
//         else if (userRole === "teacher") {
//             // Checks if "all" OR "teacher" exists in the targetAudience array
//             // query.targetAudience = { $in: ["all", "teacher"] };

//             const teacherScopes = ["all", "teacher"];

//             if (derivedClassId) {
//                 // Scenario: Teacher is viewing a SPECIFIC CLASS
//                 // Show: General stuff OR Stuff specifically for this class
//                 query.$or = [
//                     { targetAudience: { $in: teacherScopes } },
//                     {
//                         targetAudience: "specific_classes",
//                         targetClasses: new mongoose.Types.ObjectId(derivedClassId)
//                     }
//                 ];
//             } else {
//                 // Scenario: Teacher is viewing GENERAL FEED
//                 // Show: General stuff OR ANY specific class stuff (so they are informed)
//                 // We add "specific_classes" to the list so they can see what's being sent to students
//                 query.targetAudience = { $in: [...teacherScopes, "specific_classes"] };
//             }
//         }

//         // 3. PARENTS: The Critical Logic
//         else if (userRole === "parent") {

//             // Define the "General Parent" Rule (Must be 'parent' AND NOT 'specific_classes')
//             const generalParentRule = {
//                 $and: [
//                     { targetAudience: "parent" },
//                     { targetAudience: { $ne: "specific_classes" } }
//                 ]
//             };



//             if (!derivedClassId) {
//                 // If no class ID provided, they can ONLY see general stuff that is NOT specific
//                 query.$or = [
//                     { targetAudience: "all" },
//                     {
//                         targetAudience: "parent",
//                         targetAudience: { $ne: "specific_classes" } // Exclude if strictly for specific classes
//                     }
//                 ];
//             } else {
//                 // If Class ID IS provided, use specific 3-step logic
//                 query.$or = [
//                     // A. Public Announcements
//                     { targetAudience: "all" },

//                     // B. General Parent Announcements (That are NOT specific to classes)
//                     // If we don't exclude 'specific_classes' here, a specific post would leak through 
//                     // just because it has the 'parent' tag.
//                    // B. General Parent (Fixed Logic)
//                     generalParentRule,


//                     // C. Class Specific Announcements
//                     // This finds docs where "specific_classes" exists AND the class ID matches
//                     {
//                         targetAudience: "specific_classes",
//                         targetClasses: new mongoose.Types.ObjectId(derivedClassId)
//                     }
//                 ];
//             }
//         }

//         // Fallback for unknown roles (optional security)
//         // else {
//         //     return res.status(403).json({ ok: false, message: "Role not authorized" });
//         // }

//         // =========================================================
//         // EXECUTION & PAGINATION
//         // =========================================================
//         const skip = (parseInt(page) - 1) * parseInt(limit);

//         const [announcements, total] = await Promise.all([
//             AnnouncementModel.find(query)
//                 .sort({ createdAt: -1 }) // Newest first
//                 .skip(skip)
//                 .limit(parseInt(limit))
//                 .populate("createdBy", "userName role _id") // Populate creator details
//                 .populate("targetClasses", "name"),
//             AnnouncementModel.countDocuments(query)
//         ]);


//         res.status(200).json({
//             ok: true,
//             data: announcements,
//             pagination: {
//                 total,
//                 page: parseInt(page),
//                 totalPages: Math.ceil(total / parseInt(limit))
//             }
//         });

//     } catch (error) {
//         console.error("Get Announcements Error:", error);
//         res.status(500).json({ ok: false, message: error.message });
//     }
// };



export const getAnnouncements = async (req, res) => {
    try {
        const { schoolId, page = 1, limit = 10 } = req.query; // ONLY schoolId comes from Frontend
        const userRole = req.user?.role?.toLowerCase();
        const userId = req.user?._id;

        console.log("userRole", userRole)

        if (!schoolId) {
            return res.status(400).json({ ok: false, message: "schoolId required" });
        }

        // --- PRE-CALCULATION: Find Allowed Class IDs ---
        // We will populate this array based on whether it's a Teacher (assignments) or Parent (children)
        let allowedClassIds = [];

        if (userRole === "teacher") {
            // 1. Fetch Teacher's Assignments
            const teacherUser = await UserModel.findById(userId).select("assignments");
            
            if (teacherUser?.assignments?.length > 0) {
                // Extract classId from every assignment object
                allowedClassIds = teacherUser.assignments
                    .map(a => a.classId)
                    .filter(id => id); // Remove nulls/undefined
            }
        } 
        else if (userRole === "parent") {
            // 1. Fetch Parent's Student IDs
            const parentUser = await UserModel.findById(userId).select("studentId");

            console.log("parentUser", parentUser)
            if (parentUser?.studentId?.length > 0) {
                // 2. Fetch the actual Student documents to get their Classes
                const students = await StudentNewModel.find({
                    _id: { $in: parentUser.studentId }
                }).select("currentClassId");


            console.log("students", students)

                // 3. Extract class IDs from the students
                allowedClassIds = students
                    .map(s => s.currentClassId)
                    .filter(id => id); // Remove nulls/undefined

            console.log("allowedClassIds", allowedClassIds)
            
            }
        }

        // --- QUERY CONSTRUCTION ---
        let query = {
            schoolId: new mongoose.Types.ObjectId(schoolId),
        };

        // =========================================================
        // ROLE BASED FILTERS
        // =========================================================

        // A. ADMINS (See Everything)
        if (["administrator", "principal", "correspondent", "viceprincipal"].includes(userRole)) {
            // No extra filters needed.
        }

        // B. TEACHERS
        else if (userRole === "teacher") {
            query.$or = [
                // 1. General Teacher Announcements
                { targetAudience: { $in: ["all", "teacher"] } },
                
                // 2. Class Specific Announcements (Matches ANY class in their assignments)
                {
                    targetAudience: "specific_classes",
                    targetClasses: { $in: allowedClassIds } 
                }
            ];
        }

        // C. PARENTS
        else if (userRole === "parent") {
            
            // Logic: Must match "parent" AND NOT be "specific_classes" to be considered General
            const generalParentRule = {
                $and: [
                    { targetAudience: "parent" },
                    { targetAudience: { $ne: "specific_classes" } }
                ]
            };

            // Logic:
            // 1. Public (All)
            // 2. General Parent News
            // 3. Specific Class News (Matches ANY of their children's classes)
            query.$or = [
                { targetAudience: "all" },
                generalParentRule,
                {
                    targetAudience: "specific_classes",
                    targetClasses: { $in: allowedClassIds }
                }
            ];
        }
        
        // D. FALLBACK
        else {
             return res.status(403).json({ ok: false, message: "Access Denied: Unknown Role" });
        }

        // =========================================================
        // EXECUTION
        // =========================================================
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [announcements, total] = await Promise.all([
            AnnouncementModel.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .populate("createdBy", "userName role _id")
                .populate("targetClasses", "name _id"), // Shows "Class 10-A", etc.
            AnnouncementModel.countDocuments(query)
        ]);

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
        // const { classId } = req.query; // Required for Parent/Student validation
        // const userRole = req?.user?.role.toLowerCase();

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

        // =========================================================
        // ACCESS CONTROL LOGIC
        // =========================================================

        // const isAdminLevel = ["correspondent", "principal", "viceprincipal", "administrator"].includes(userRole);

        // // A. ADMINS: Can see everything. Skip checks.
        // if (isAdminLevel) {
        //     return res.status(200).json({ ok: true, data: announcement });
        // }


        // // Check 3: Audience Validation
        // // const audience = announcement.targetAudience;

        // // Ensure audience is always an array (handles cases where DB might return a string or array)
        // const audience = Array.isArray(announcement.targetAudience)
        //     ? announcement.targetAudience
        //     : [announcement.targetAudience];


        // if (userRole === "teacher") {
        //     // Teachers can see "ALL" and "STAFF"
        //     const isAllowed = audience.some(role => ["all", "teacher"].includes(role));

        //     if (!isAllowed) {
        //         return res.status(403).json({ ok: false, message: "Access Denied. This is not for teachers." });
        //     }
        // }
        // else if (userRole === "parent") {
        //     // Parents/Students can see "ALL", "PARENTS", "STUDENTS"
        //     const allowedGeneral = ["all", "parent"];

        //     if (audience.includes("specific_classes")) {
        //         // Must provide classId to verify access
        //         if (!classId) {
        //             return res.status(400).json({
        //                 ok: false,
        //                 message: "classId is required to view class-specific announcements."
        //             });
        //         }

        //         // Check if the announcement's targetClasses includes the student's class
        //         // const isClassTargeted = announcement.targetClasses.some(
        //         //     cls => cls._id.toString() === classId
        //         // );

        //         const isClassTargeted = announcement.targetClasses.some(cls => {
        //             const clsId = cls._id ? cls._id.toString() : cls.toString();
        //             return clsId === classId;
        //         });

        //         if (!isClassTargeted) {
        //             return res.status(403).json({ ok: false, message: "This announcement is not for your class." });
        //         }
        //     }
        //     // else if(!allowedGeneral.includes(audience)) {
        //     else {
        //         // return res.status(403).json({ ok: false, message: "Access Denied." });
        //         const hasGeneralAccess = audience.some(role => allowedGeneral.includes(role));

        //         if (!hasGeneralAccess) {
        //             return res.status(403).json({ ok: false, message: "Access Denied." });
        //         }
        //     }
        // }

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