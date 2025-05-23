const express = require('express')

const router = express.Router()

const {accountantLogin, accountantLogout, accountantRefreshAccessToken, getTakenSRNo, isAuthenticatedUser,
     getAccountantRole, addStudent, getStudentsList, updateStudentWithPermission, updateStudentDirectly, 
     getPermissionStatus, changesMadeOnDate, changesRetrived, editStudentMandatoryDetails, 
     editStudentNonMandatoryDetails, generateExcelFile, searchStudent,
     uploadStudentImage} = require('../Controllers/accountant.controller')

const { verifyAccountantMiddleware } = require('../Middleware/verifyTokenMiddleware')
const { upload } = require('../Utils/s3upload')

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

router.get('/students/taken-sr-ids', verifyAccountantMiddleware, getTakenSRNo)
router.get('/excelfile', verifyAccountantMiddleware, generateExcelFile)
router.get('/searchstudent', searchStudent)

router.post('/student/uploadimage/:studentId', upload.single('file'), uploadStudentImage);

module.exports = router