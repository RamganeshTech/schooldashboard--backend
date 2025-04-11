const express = require('express')

const {adminLogin, refreshAccessToken, adminLogout, updateValue, createAccountantCredential, getDeletedAccountantCredentials, deleteAccountantCredential, isAuthenticatedUser, getAdminRole, getNotifications, acceptNotification, rejectNotification, updateStudentAdmin, getStudentsList, getActiveAccountant, updatePermissionAccountant, changesMadeOnDate, changesRetrived, editStudentMandatoryDetails, editStudentNonMandatoryDetails} = require('../Controllers/admin.controller');

const { verifyTokenMiddleware } = require('../Middleware/verifyTokenMiddleware');
const { editStudentProfile } = require('../Controllers/accountant.controller');

const router = express.Router()

router.post("/adminLogin", adminLogin);
router.post("/refresh", refreshAccessToken);
router.post("/adminlogout", adminLogout);

router.get("/isAuthUser", isAuthenticatedUser);
router.get("/getRole", getAdminRole);

router.post('/createCredentials',verifyTokenMiddleware ,createAccountantCredential)
router.get('/getDeletedAccountantCredentials',verifyTokenMiddleware ,getDeletedAccountantCredentials)
router.delete('/deleteAccountantCredential/:id',verifyTokenMiddleware ,deleteAccountantCredential)

router.get('/getNotifications',verifyTokenMiddleware ,getNotifications)
router.patch('/acceptNotification/:id',verifyTokenMiddleware ,acceptNotification)
router.patch('/rejectNotification/:id',verifyTokenMiddleware ,rejectNotification)

router.patch('/updateStudentAdmin/:id',verifyTokenMiddleware ,updateStudentAdmin)

router.get('/getStudentList',verifyTokenMiddleware, getStudentsList)

router.get('/getAccountant',verifyTokenMiddleware, getActiveAccountant)
router.patch('/updatePermission/:id',verifyTokenMiddleware, updatePermissionAccountant)

router.post('/changesmodified',verifyTokenMiddleware, changesMadeOnDate)
router.get('/changesRetrived/:date',verifyTokenMiddleware, changesRetrived)
router.patch('/updateStudentProfile/:studentId',verifyTokenMiddleware, editStudentMandatoryDetails)
router.patch('/updateStudentProfileNonMandatory/:studentId',verifyTokenMiddleware, editStudentNonMandatoryDetails)



module.exports = router