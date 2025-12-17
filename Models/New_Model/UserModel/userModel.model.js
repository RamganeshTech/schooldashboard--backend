import mongoose from "mongoose";

const { Schema, model } = mongoose;

const userSchema = new Schema(
  {
    email: { type: String, },
    userName: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String, required: true, enum: ["correspondent", "otherRole1", "otherRole2"] },
    phoneNo: { type: String },
    schoolId: { type: mongoose.Schema.ObjectId, default: null, ref: "Schoolmodel" },
    isPlatformAdmin: { type: Boolean }, // internal field for conditional storage
  },
  { timestamps: true }
);

const UserModel = model("UserModel", userSchema);

export default UserModel;
