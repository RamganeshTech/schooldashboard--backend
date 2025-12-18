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


dotenv.config({ path: '.env.production' });
const app = express()

app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
}))

app.use(cookieParser())
app.use(express.json())

app.use('/api/admin', adminRoutes)
app.use('/api/accountant', accountantRoutes)

// NEW ROUTES
app.use('/api/school', schoolRoutes)
app.use('/api/user', userRoutes)
app.use('/api/class', classRoutes)
app.use('/api/section', sectionRoutes)
app.use('/api/teacher', teacherRoutes)


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