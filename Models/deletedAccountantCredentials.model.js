// const mongoose = require('mongoose')
import mongoose from "mongoose";


const DeletedAccountantCredentials = mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique:true,
    },
    password: {
        type: String,
        required: true,
    },
    status:{
        type:Boolean,
        required:true,
    },
}, {
    timestamps:true
});


const DeletedAccountantCredentialsModel  = mongoose.model('DeletedCredentials', DeletedAccountantCredentials);

// module.exports = DeletedAccountantCredentialsModel;


export default DeletedAccountantCredentialsModel;