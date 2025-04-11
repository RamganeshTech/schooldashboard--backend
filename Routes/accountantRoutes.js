const express = require('express')

const router = express.Router()

const {accountantLogin, accountantLogout, accountantRefreshAccessToken, isAuthenticatedUser, getAccountantRole, addStudent, getStudentsList, updateStudentWithPermission, updateStudentDirectly, getPermissionStatus, changesMadeOnDate, changesRetrived, editStudentProfile, editStudentMandatoryDetails, editStudentNonMandatoryDetails} = require('../Controllers/accountant.controller')
const { verifyAccountantMiddleware } = require('../Middleware/verifyTokenMiddleware')

router.post('/accountantlogin', accountantLogin)
router.post('/accountantlogout', accountantLogout)
router.post('/refresh', accountantRefreshAccessToken)

router.post('/addStudent',verifyAccountantMiddleware, addStudent)

router.put('/updateStudentwithPermession/:id',verifyAccountantMiddleware, updateStudentWithPermission)
router.put('/updateStudentDirectly/:id',verifyAccountantMiddleware, updateStudentDirectly)

router.get('/getStudentList',verifyAccountantMiddleware, getStudentsList)

router.get("/isAuthUser", isAuthenticatedUser);
router.get("/getRole", getAccountantRole);
router.get("/getPermissionStatus", verifyAccountantMiddleware,getPermissionStatus);


router.post('/changesmodified',verifyAccountantMiddleware, changesMadeOnDate)
router.get('/changesRetrived/:date',verifyAccountantMiddleware, changesRetrived)
router.patch('/updateStudentProfile/:studentId',verifyAccountantMiddleware, editStudentMandatoryDetails)
router.patch('/updateStudentProfileNonMandatory/:studentId',verifyAccountantMiddleware, editStudentNonMandatoryDetails)


// router.get("/getRole", verifyAccountantMiddleware,getAccountantRole);



module.exports = router