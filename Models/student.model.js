const mongoose = require('mongoose')

const StudentSchema = mongoose.Schema({
    newOld: {
        type: String,
        maxLength: [3, "New or Old column should contain only new or old"],
        required: true,
    },
    section: {
        type: String,
        minLength: [1, "Section should be provided"],
        match: [/^[a-zA-Z0-9]+$/, "Section should contain only alphabets and numbers"],
        required: true,
    },
    studentName: {
        type: String,
        required: true,
        match: [/^[a-zA-Z. ]+$/, "Student name should not contain numbers or special characters except space and period (.)"],
    },
    adminssionAmt: {
        type: Number,
        default: null
    },
    adminssionPaidAmt: {
        type: Number,
        default: null
    },
    admissionBillNo: {
        type: Number,
        default: null
    },
    admissionDate: {
        type: String,
        default: null
    },

    firstTermAmt: {
        type: Number,
        default: null
    },
    firstTermPaidAmt: {
        type: Number,
        default: null
    },
    firstTermBillNo: {
        type: Number,
        default: null
    },
    firstTermDate: {
        type: String,
        default: null
    },

    secondTermAmt: {
        type: Number,
        default: null
    },
    secondTermPaidAmt: {
        type: Number,
        default: null
    },
    secondTermBillNo: {
        type: Number,
        default: null
    },
    secondTermDate: {
        type: String,
        default: null
    },
    annualFee: {
        type: Number,
        default: null
    },
    annualPaidAmt: {
        type: Number,
        default: null
    },
    dues: {
        type: Number,
        default: null
    },
    concession: {
        type: Number,
        default: null
    },
    remarks: {
        type: String,
        default: null
    },

    busFirstTermAmt: {
        type: Number,
        default: null
    },
    busFirstTermPaidAmt: {
        type: Number,
        default: null
    },
    busfirstTermDues: {
        type: Number,
        default: null
    },

    busSecondTermAmt: {
        type: Number,
        default: null
    },
    busSecondTermPaidAmt: {
        type: Number,
        default: null
    },
    busSecondTermDues: {
        type: Number,
        default: null
    },

    busPoint: {
        type: String,
        default: null
    },
    whatsappNumber: {
        type: String,
        default: null,
        match: [/^[0-9]+$/, "WhatsApp number should contain only numbers"] 
    },
}, {
    timestamps:true,
    minimize: true
});

module.exports = mongoose.model('Student', StudentSchema);