const mongoose = require('mongoose')

const AccountantSchema = mongoose.Schema({
    email:{
        type: String,
        required:true,
        unique: true
    },
    password:{
        type:String,
        required:true,
    },
    relationId:{
        type: mongoose.Schema.Types.ObjectId,
        required: true,
         ref: 'DeletedAccountantCredentialsModel'
    },
    permissionStatus:{
        type:Boolean,
        default: false
    }
}, {
    minimize:true
})

const AccountantModel = mongoose.model("AccountantModel", AccountantSchema)

module.exports = AccountantModel