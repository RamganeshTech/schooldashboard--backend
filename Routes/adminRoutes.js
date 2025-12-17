// const express = require('express')
import express from "express"
// const {
// adminLogin, refreshAccessToken, adminLogout, updateValue, createAccountantCredential, 
//     getDeletedAccountantCredentials, deleteAccountantCredential, isAuthenticatedUser, 
//     getAdminRole, getNotifications, acceptNotification, rejectNotification, updateStudentAdmin, 
//     getStudentsList, getActiveAccountant, updatePermissionAccountant, changesMadeOnDate, 
//     changesRetrived, editStudentMandatoryDetails, editStudentNonMandatoryDetails, getTakenSRNo,
//     generateTC, generateExcelFile,
//     searchStudent,
//     uploadStudentImage
// } = require('../Controllers/admin.controller');


import {
    adminLogin, refreshAccessToken, adminLogout, 
    // updateValue,
     createAccountantCredential,
    getDeletedAccountantCredentials, deleteAccountantCredential, isAuthenticatedUser,
    getAdminRole, getNotifications, acceptNotification, rejectNotification, updateStudentAdmin,
    getStudentsList, getActiveAccountant, updatePermissionAccountant, changesMadeOnDate,
    changesRetrived, editStudentMandatoryDetails, editStudentNonMandatoryDetails, getTakenSRNo,
    generateTC, generateExcelFile,
    searchStudent,
    uploadStudentImage
} from '../Controllers/admin.controller.js';

// const { verifyTokenMiddleware } = require('../Middleware/verifyTokenMiddleware');
import {verifyTokenMiddleware} from '../Middleware/verifyTokenMiddleware.js';
// const { editStudentProfile } = require('../Controllers/accountant.controller');
// import { editStudentProfile } from '../Controllers/accountant.controller.js';
// const { upload } = require('../Utils/s3upload');
import { upload } from '../Utils/s3upload.js';
const router = express.Router()

router.post("/adminLogin", adminLogin);
router.post("/refresh", refreshAccessToken);
router.post("/adminlogout", adminLogout);

router.get("/isAuthUser", isAuthenticatedUser);
router.get("/getRole", getAdminRole);

router.post('/createCredentials', verifyTokenMiddleware, createAccountantCredential)
router.get('/getDeletedAccountantCredentials', verifyTokenMiddleware, getDeletedAccountantCredentials)
router.delete('/deleteAccountantCredential/:id', verifyTokenMiddleware, deleteAccountantCredential)

router.get('/getNotifications', verifyTokenMiddleware, getNotifications)
router.patch('/acceptNotification/:id', verifyTokenMiddleware, acceptNotification)
router.patch('/rejectNotification/:id', verifyTokenMiddleware, rejectNotification)

router.patch('/updateStudentAdmin/:id', verifyTokenMiddleware, updateStudentAdmin)

router.get('/getStudentList', verifyTokenMiddleware, getStudentsList)

router.get('/getAccountant', verifyTokenMiddleware, getActiveAccountant)
router.patch('/updatePermission/:id', verifyTokenMiddleware, updatePermissionAccountant)

router.post('/changesmodified', verifyTokenMiddleware, changesMadeOnDate)
router.get('/changesRetrived/:date', verifyTokenMiddleware, changesRetrived)
router.patch('/updateStudentProfile/:studentId', verifyTokenMiddleware, editStudentMandatoryDetails)
router.patch('/updateStudentProfileNonMandatory/:studentId', verifyTokenMiddleware, editStudentNonMandatoryDetails)

router.get('/students/taken-sr-ids', verifyTokenMiddleware, getTakenSRNo)
router.patch('/generatetc/:srId', verifyTokenMiddleware, generateTC)
router.get('/excelfile', verifyTokenMiddleware, generateExcelFile)
router.get('/searchstudent', searchStudent)

router.post('/student/uploadimage/:studentId', upload.single('file'), uploadStudentImage);


// module.exports = router

export default router;