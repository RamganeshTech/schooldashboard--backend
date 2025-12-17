// const mongoose = require('mongoose')
import mongoose from "mongoose";


let connectDB = async ()=>{
    try{
        await mongoose.connect(process.env.MONGODB_CONNECTIONSTRING)
        console.log("connected to Db")
    }
    catch(err){
        console.log(err.message)
    }
}  

// module.exports = connectDB;
export default connectDB;
