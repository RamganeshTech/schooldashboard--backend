import express from 'express';
import { createClub, deleteClub, getAllClubs, getClubById, updateClubText, updateClubThumbnail } from '../../../Controllers/New_Controllers/club_controllers/club.controller.js';
import { createClubVideo, deleteClubVideo, getAllClubVideos, getClubVideoById, updateClubVideoDetails, updateClubVideoFile } from '../../../Controllers/New_Controllers/club_controllers/clubVideo.controller.js';
import { upload } from '../../../Utils/s4UploadsNew.js';
import { multiRoleAuth } from '../../../Middleware/multiRoleRequest.js';
import { featureGuard } from '../../../Middleware/featureGuard.js';

const clubRoutes = express.Router();

// ==========================================
// PUBLIC / VIEW ROUTES
// ==========================================
// Get all clubs (Supports pagination ?page=1&limit=10&schoolId=...)
clubRoutes.get('/getall', 
        featureGuard("club"),

    multiRoleAuth("correspondent", "principal", "teacher", "parent", "administrator", "accountant" , "viceprincipal"), getAllClubs);

// Get single club details
clubRoutes.get('/get/:id', 
        featureGuard("club"),
    multiRoleAuth("correspondent", "principal", "teacher", "parent", "administrator", "accountant" , "viceprincipal"), getClubById);


// ==========================================
// ADMIN / MANAGEMENT ROUTES
// ==========================================

// Create a new Club (Multipart form-data: fields + 'thumbnail' file)
clubRoutes.post('/create', 
        featureGuard("club"),
    multiRoleAuth("correspondent", "administrator"), upload.single('thumbnail'),  createClub);

// Update text details only (Name, Description, isActive)
clubRoutes.put('/updatetext/:id',  
        featureGuard("club"),
    multiRoleAuth("correspondent", "administrator"), updateClubText);

// Update thumbnail only (Multipart form-data: 'thumbnail' file)
clubRoutes.put('/updatethumbnail/:id', 
        featureGuard("club"),
    multiRoleAuth("correspondent", "administrator"), upload.single('thumbnail'), updateClubThumbnail);

// Delete Club (and cascades to delete videos)
clubRoutes.delete('/delete/:id',  
        featureGuard("club"),
    multiRoleAuth("correspondent", "administrator"), deleteClub);



// ==========================================
// VIEW ROUTES
// ==========================================
// Get videos (Supports pagination ?clubId=...&page=1)

// {{baseURL}}/api/club/video/getall?clubId=694a3de7e615dd6fec381c3e&page=1&limit=10

clubRoutes.get('/video/getall', 
        featureGuard("club"),
    multiRoleAuth("correspondent", "principal", "teacher", "parent", "administrator", "accountant" , "viceprincipal"), getAllClubVideos);

// Get single video details
clubRoutes.get('/video/get/:id',
        featureGuard("club"),
    multiRoleAuth("correspondent", "principal", "teacher", "parent", "administrator", "accountant" , "viceprincipal"),  getClubVideoById);
// {{baseURL}}/api/club/video/get/


// ==========================================
// MANAGEMENT ROUTES
// ==========================================

// Upload a new Video (Multipart form-data: fields + 'video' file)
// {{baseURL}}/api/club/video/upload/

clubRoutes.post('/video/upload',
        featureGuard("club"),
    multiRoleAuth("correspondent", "administrator"), upload.single('video'),   createClubVideo);

// Update details only (Title, Topic, Level) - No file upload here
clubRoutes.put('/video/updatedetails/:id',  
        featureGuard("club"),
    multiRoleAuth("correspondent", "administrator"), updateClubVideoDetails);

// Update VIDEO FILE only (Multipart form-data: 'video' file) - Re-uploads the file
clubRoutes.put('/video/updatefile/:id',  
        featureGuard("club"),
    multiRoleAuth("correspondent", "administrator"), upload.single('video'), updateClubVideoFile);

// Delete Video
clubRoutes.delete('/video/delete/:id', 
        featureGuard("club"),
    multiRoleAuth("correspondent", "administrator"), deleteClubVideo);

export default clubRoutes;