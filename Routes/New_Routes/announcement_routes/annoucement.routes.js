import express from "express";
import { addAnnouncementAttachments, createAnnouncement, deleteAnnouncement,
     deleteAnnouncementAttachment, getAnnouncementById, getAnnouncements, 
     updateAnnouncementText } from "../../../Controllers/New_Controllers/announcement_controllers/announcement_controllers.js";
import { multiRoleAuth } from "../../../Middleware/multiRoleRequest.js";
import { upload } from "../../../Utils/s4UploadsNew.js";


const annoucementRoutes = express.Router();

// 1. Create (Supports multiple attachments)
annoucementRoutes.post(
    "/create", 
    multiRoleAuth("correspondent", "principal", "administrator"), 
    upload.array("attachment"), // 'attachments' is the key name in Postman
    createAnnouncement
);

// 2. Get All (Auto-filtered by role)
annoucementRoutes.get(
    "/getall", 
    multiRoleAuth("correspondent", "principal", "viceprincipal", "teacher", "parent","administrator"), 
    getAnnouncements
);


// Get Single ID
annoucementRoutes.get(
    "/get/:id", 
    multiRoleAuth("correspondent", "administrator", "viceprincipal", "principal", "teacher", "parent"), 
    getAnnouncementById
);

annoucementRoutes.put(
    "/update/:id", 
    multiRoleAuth("correspondent", "principal", "administrator"), 
    updateAnnouncementText
);

// 2. Add New Files (Multipart Form)
annoucementRoutes.put(
    "/addattachment/:id", 
    multiRoleAuth("correspondent", "principal", "administrator"), 
    upload.array("attachment"), // 'attachments' is key name
    addAnnouncementAttachments
);

// 3. Delete A File (JSON Body: { "fileKey": "..." })
annoucementRoutes.delete(
    "/deleteattachment/:id/:fileId", 
    multiRoleAuth("correspondent", "principal", "administrator"), 
    deleteAnnouncementAttachment
);

// 3. Delete announcement
annoucementRoutes.delete(
    "/delete/:id", 
    multiRoleAuth("correspondent", "principal", "administrator"), 
    deleteAnnouncement
);

export default annoucementRoutes;
