import express from 'express'
// import { upload } from '../Utils/s3upload'
import { createSchool, deleteSchool, getAllSchools, getSchoolById, updateSchool, updateSchoolLogo } from '../../../Controllers/New_Controllers/school_controllers/school.controllers.js';
// import { upload } from '../../../Utils/s3upload.js';
import { multiRoleAuth } from '../../../Middleware/multiRoleRequest.js';
import { upload } from '../../../Utils/s4UploadsNew.js';

const schoolRoutes = express.Router()

schoolRoutes.post('/create',
    multiRoleAuth("correspondent"),
    upload.single('file'), createSchool);

schoolRoutes.get('/getall',
    multiRoleAuth("correspondent"),
    getAllSchools);

schoolRoutes.get('/getsingle/:id',
     multiRoleAuth("correspondent","teacher", "principal", "administrator", "viceprincipal", "accountant"),
    getSchoolById);

schoolRoutes.put('/update/:id',
    multiRoleAuth("correspondent"),
    updateSchool);

schoolRoutes.put('/updatelogo/:id',
    multiRoleAuth("correspondent"),
    upload.single('file'), 
    updateSchoolLogo);

schoolRoutes.delete('/delete/:id',
    multiRoleAuth("correspondent"),
    deleteSchool);



export default schoolRoutes;