// const mongoose = require('mongoose')
import mongoose from "mongoose";


const ChangesMadeSchema = mongoose.Schema({

    modifiedDate:{
        type: String,
    },
    fieldsModified:{
        type:[String],
        default:null
    }, 
    modifiedBy:{
        type:String,
    },
    relationId:{
        ref:"Student",
          type: mongoose.Schema.Types.ObjectId,
    }
}, {
    minimize:true
})

// module.exports = mongoose.model("Changesmade", ChangesMadeSchema )
const ChangesMadeModel = mongoose.model("Changesmade", ChangesMadeSchema )
export default ChangesMadeModel;
