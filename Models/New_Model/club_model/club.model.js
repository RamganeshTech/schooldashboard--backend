import mongoose, { Schema } from "mongoose";


const uploadSchema = new Schema({
    type: { type: String, enum: ["image", "pdf", "video"] },
    key: { type: String, },
    url: { type: String, },
    originalName: String,
    uploadedAt: { type: Date, default: new Date() }
}, { _id: true });

const clubSchema = new Schema({
    schoolId: { type: mongoose.Schema.Types.ObjectId, ref: "SchoolModel", default: null },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: "ClassModel", default: null },

    name: {
        type: String
    },
    description: {
        type: String,
    },
    studentId: [{ type: mongoose.Schema.Types.ObjectId, ref: "StudentNewModel" }],
    // REPLACED: thumbnailUrl string
    // WITH: Your uploadSchema structure
    thumbnail: {
        type: uploadSchema,
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });



const clubVideoSchema = new Schema({
    clubId: {
        type: Schema.Types.ObjectId,
        ref: 'ClubMainModel',
        // required: true
    },
    academicYear: {
        type: String, default: null,
    },
    title: {
        type: String,
        default: null,
        // required: true,
        // trim: true
    },

    // REPLACED: videoUrl string
    // WITH: Your uploadSchema structure
    video: {
        type: uploadSchema,
        // required: true
        default: null,
    },

    // Categorization (As per requirements)
    topic: {
        type: String,
        // required: true // e.g. "Kinematics" or "Modern Art"
        default: null,

    },

    level: {
        type: String,
        default: 'general'
    },

    uploadedBy: {
        type: Schema.Types.ObjectId,
        ref: 'UserModel' // Assuming you have a User model for admin/staff
    }
}, { timestamps: true });


clubSchema.index({ schoolId: 1, });
clubVideoSchema.index({clubId:1});

const ClubVideoModel = mongoose.model('ClubVideoModel', clubVideoSchema);
const ClubMainModel = mongoose.model('ClubMainModel', clubSchema);

export { ClubVideoModel, ClubMainModel }