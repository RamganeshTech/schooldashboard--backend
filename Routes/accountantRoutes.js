// const express = require('express')
import express from 'express'
import { upload } from '../Utils/s3upload.js';



// const {
     
//      accountantLogin, accountantLogout, accountantRefreshAccessToken, getTakenSRNo, isAuthenticatedUser,
//      getAccountantRole, addStudent, getStudentsList, updateStudentWithPermission, updateStudentDirectly, 
//      getPermissionStatus, changesMadeOnDate, changesRetrived, editStudentMandatoryDetails, 
//      editStudentNonMandatoryDetails, generateExcelFile, searchStudent,
//      uploadStudentImage

// } = require('../Controllers/accountant.controller')

import {
     accountantLogin, accountantLogout, accountantRefreshAccessToken, getTakenSRNo, isAuthenticatedUser,
     getAccountantRole, addStudent, getStudentsList, updateStudentWithPermission, updateStudentDirectly, 
     getPermissionStatus, changesMadeOnDate, changesRetrived, editStudentMandatoryDetails, 
     editStudentNonMandatoryDetails, generateExcelFile, searchStudent,
     uploadStudentImage
     
} from '../Controllers/accountant.controller.js'

// const { verifyAccountantMiddleware } = require('../Middleware/verifyTokenMiddleware')
import {verifyAccountantMiddleware} from '../Middleware/verifyTokenMiddleware.js'

// const { upload } = require('../Utils/s3upload')
// const { upload } = require('../Utils/s3upload')

const router = express.Router()

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

export default router