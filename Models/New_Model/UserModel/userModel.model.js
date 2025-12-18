import mongoose from "mongoose";

const { Schema, model } = mongoose;


const assignmentSchema = new Schema({
  classId: { type: Schema.Types.ObjectId, ref: "ClassModel" },
  // sectionId is Nullable (for classes like LKG that don't have sections)
  sectionId: { type: Schema.Types.ObjectId, ref: "SectionModel", default: null },
}, { _id: true });
// No need for unique IDs for these sub-documents


const userSchema = new Schema(
  {
    email: { type: String, },
    userName: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String, required: true, enum: ["correspondent", "teacher", "principal", "viceprincipal", "administrator", "parent", "accountant"] },
    phoneNo: { type: String },
    schoolCode: { type: String, default: null },
    schoolId: { type: mongoose.Schema.ObjectId, default: null, ref: "Schoolmodel" },
    isPlatformAdmin: { type: Boolean }, // internal field for conditional storage

    // only for teachers
    assignments: { type: [assignmentSchema] },

  },
  { timestamps: true }
);

const UserModel = model("UserModel", userSchema);

export default UserModel;
