const express = require('express')
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser')
const cors = require("cors");
const connectDB = require('./Config/ConnectDB');
require('dotenv').config()

const adminRoutes = require('./Routes/adminRoutes')
const accountantRoutes = require('./Routes/accountantRoutes');

const app = express()

app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
}))

app.use(cookieParser())
app.use(express.json())

app.use('/api/admin', adminRoutes)
app.use('/api/accountant', accountantRoutes)

let PORT = process.env.PORT || 4000

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running in the ${PORT}`)
    })
}).catch(err => console.log(err.message))