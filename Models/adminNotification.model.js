// const mongoose = require('mongoose')
import mongoose from "mongoose";


const AdminNotification = mongoose.Schema({
    email: {
        type: String,
        required: true,
    },
    requestTo: {
        type: String,
        required: true,
    },
    studentName:{
        type:String,
    },
    studentId:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref:"Student"
    },
    fields:{
        type:Object,
        required:true,
    },
    status: {
        type:String,
        default:null,
    }
}, {
    timestamps:true
});

// module.exports = mongoose.model('AdminNotification', AdminNotification);
const AdminNotificationModel = mongoose.model("AdminNotification", AdminNotification )
export default AdminNotificationModel;
