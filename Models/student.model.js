// const mongoose = require('mongoose')
import mongoose from "mongoose";

const StudentSchema = mongoose.Schema({
    srId: {
        type: String, // Example: "SR-104"
        required: true,
        unique: true,
        maxLength: [15, "SR-ID should contain only upto 15 digits"]
    },
    // === CURRENT ACADEMIC LOCATION ===
    classId: { type: mongoose.Schema.Types.ObjectId, ref: "ClassModel", default: null },

    // Nullable (For LKG or if not assigned yet)
    sectionId: { type: mongoose.Schema.Types.ObjectId, ref: "SectionModel", default: null },

    isActive: { type: Boolean, default: true },
    newOld: {
        type: String,
        maxLength: [3, "New or Old column should contain only new or old"],
        required: true,
    },
    studentClass: {
        type: String,
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
    isTcIssued: {
        type: Boolean,
        default: false,
    },
    studentImage: {
        type: String,
    },
    mandatory: {
        gender: { type: String, default: null },
        dob: { type: String, default: null },
        educationNumber: { type: String, default: null },
        motherName: { type: String, default: null },
        fatherName: { type: String, default: null },
        guardianName: { type: String, default: null },
        aadhaarNumber: { type: String, default: null },
        aadhaarName: { type: String, default: null },
        address: { type: String, default: null },
        pincode: { type: String, default: null },
        mobileNumber: { type: String, default: null },
        alternateMobile: { type: String, default: null },
        email: { type: String, default: null },
        motherTongue: { type: String, default: null },
        socialCategory: { type: String, default: null },
        minorityGroup: { type: String, default: null },
        bpl: { type: String, default: null },
        aay: { type: String, default: null },
        ews: { type: String, default: null },
        cwsn: { type: String, default: null },
        impairments: { type: String, default: null },
        indian: { type: String, default: null },
        outOfSchool: { type: String, default: null },
        mainstreamedDate: { type: String, default: null },
        disabilityCert: { type: String, default: null },
        disabilityPercent: { type: String, default: null },
        bloodGroup: { type: String, default: null },
    },
    nonMandatory: {
        facilitiesProvided: { type: String, default: null },
        facilitiesForCWSN: { type: String, default: null },
        screenedForSLD: { type: String, default: null },
        sldType: { type: String, default: null },
        screenedForASD: { type: String, default: null },
        screenedForADHD: { type: String, default: null },
        isGiftedOrTalented: { type: String, default: null },
        participatedInCompetitions: { type: String, default: null },
        participatedInActivities: { type: String, default: null },
        canHandleDigitalDevices: { type: String, default: null },
        heightInCm: { type: String, default: null }, // or number if preferred
        weightInKg: { type: String, default: null }, // or number
        distanceToSchool: { type: String, default: null },
        parentEducationLevel: { type: String, default: null },

        // ENTROLLMENT DETAILS 

        admissionNumber: { type: String, default: null },
        admissionDate: { type: String, default: null }, // Format: DD/MM/YYYY
        rollNumber: { type: String, default: null },
        mediumOfInstruction: { type: String, default: null },
        languagesStudied: { type: String, default: null },
        academicStream: { type: String, default: null },
        subjectsStudied: { type: String, default: null },
        statusInPreviousYear: { type: String, default: null },
        gradeStudiedLastYear: { type: String, default: null },
        enrolledUnder: { type: String, default: null },
        previousResult: { type: String, default: null },
        marksObtainedPercentage: { type: String, default: null },
        daysAttendedLastYear: { type: String, default: null },
    }
}, {
    timestamps: true,
    minimize: true
});

// module.exports = mongoose.model('Student', StudentSchema);
const StudentModel = mongoose.model('Student', StudentSchema);

export default StudentModel