// const express = require('express')

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

// const mongoose = require('mongoose');
// const cookieParser = require('cookie-parser')
// const cors = require("cors");
// const connectDB = require('./Config/ConnectDB');
// // require('dotenv').config()

// require('dotenv').config({ path: '.env.production' });

// const adminRoutes = require('./Routes/adminRoutes')
// const accountantRoutes = require('./Routes/accountantRoutes');
// const { default: schoolRoutes } = require('./Routes/New_Routes/school_routes/school.routes');

import adminRoutes from "./Routes/adminRoutes.js"
import accountantRoutes from "./Routes/accountantRoutes.js"
import schoolRoutes from './Routes/New_Routes/school_routes/school.routes.js';
import connectDB from './Config/ConnectDB.js';
import userRoutes from './Routes/New_Routes/user_routes/user.routes.js';
import classRoutes from './Routes/New_Routes/school_routes/class_routes/class.routes.js';
import sectionRoutes from './Routes/New_Routes/school_routes/section_routes/section.routes.js';
import teacherRoutes from './Routes/New_Routes/teacher_routes/teacher.routes.js';
import feeStructureRoutes from './Routes/New_Routes/feeStructure_routes/feeStructure.routes.js';
import studentRoutes from './Routes/New_Routes/studentNew_routes/studentNew.routes.js';
import studentRecordRoutes from './Routes/New_Routes/studentNew_routes/studentRecord_route/studentRecord.route.js';
import attendanceRoutes from './Routes/New_Routes/attendance_routes/attendance.routes.js';
import downloadRoutes from './Routes/New_Routes/download_routes/download.routes.js';
import expenseRoutes from './Routes/New_Routes/expense_routes/expense.routes.js';
import deleteArchiveRoutes from './Routes/New_Routes/deleteArchive_routes/deleteArchieve.routes.js';
import financeRoutes from './Routes/New_Routes/financeLedger_routes/financeLedger.routes.js';
import annoucementRoutes from './Routes/New_Routes/announcement_routes/annoucement.routes.js';
import clubRoutes from './Routes/New_Routes/club_routes/club.routes.js';
import auditRoutes from './Routes/New_Routes/audit_routes/audit.routes.js';
import feeReceiptRoutes from './Routes/New_Routes/feeTrasaction_receipt_routes/feeTrasactionReceipt.routes.js';


dotenv.config({ path: '.env.production' });
const app = express()

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}))

app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: "50mb" }));


app.use('/api/admin', adminRoutes)
app.use('/api/accountant', accountantRoutes)

// NEW ROUTES
app.use('/api/school', schoolRoutes)
app.use('/api/user', userRoutes)
app.use('/api/class', classRoutes)
app.use('/api/section', sectionRoutes)
app.use('/api/teacher', teacherRoutes)
app.use('/api/feestructure', feeStructureRoutes)
app.use('/api/student', studentRoutes)
app.use('/api/studentrecord', studentRecordRoutes)
app.use('/api/attendance', attendanceRoutes)
app.use('/api/fee/receipt', feeReceiptRoutes)



app.use('/api/expense', expenseRoutes)
app.use('/api/announcement', annoucementRoutes)

app.use('/api/club', clubRoutes);

// not mentioned in the docuemntation
app.use('/api/financeledger', financeRoutes)
app.use('/api/deletearchive', deleteArchiveRoutes)
app.use('/api/audit', auditRoutes)
// not mentioned in the docuemntation


app.use('/api/download', downloadRoutes)

// app.use("/api/feereceipt")




app.get("/api/health-check", (req, res) => {
  res.status(200).json({
    ok: true,
    message: "Server is up and running!",
    timestamp: new Date()
  });
});

let PORT = process.env.PORT || 4000

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running in the http://locahost:${PORT}`)
  })
}).catch(err => console.log(err.message))