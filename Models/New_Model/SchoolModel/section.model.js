import mongoose from "mongoose";
const { Schema, model } = mongoose;

const sectionSchema = new Schema(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "SchoolModel"},
    classId: { type: Schema.Types.ObjectId, ref: "ClassModel"},
    
    name: { type: String, }, // e.g., "A", "B", "Rose"
    
    // ASSIGN TEACHER: Used for standard classes with sections
    classTeacherId: { type: [Schema.Types.ObjectId], ref: "UserModel", default: [] },
    
    // Optional: Room number and capacity
    roomNumber: { type: String },
    capacity: { type: Number, default: null }
  },
  { timestamps: true }
);

// Prevent duplicate section names within the same Class
// sectionSchema.index({ classId: 1, name: 1 }, { unique: true });
sectionSchema.index({ classId: 1});
const SectionModel = model("SectionModel", sectionSchema);
export default SectionModel;