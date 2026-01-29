import mongoose from "mongoose";
const { Schema, model } = mongoose;

const timetableSchema = new Schema(
    {
        schoolId: { type: Schema.Types.ObjectId, ref: "SchoolModel", },
        academicYear: { type: String, }, // e.g., "2025-2026"

        // The Target
        classId: { type: Schema.Types.ObjectId, ref: "ClassModel", },
        sectionId: { type: Schema.Types.ObjectId, ref: "SectionModel", default: null },

        // The Schedule Data
        // We store an array of days, and each day contains an array of periods
        weeklySchedule: [
            {
                day: {
                    type: String,
                    //   enum: ["monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
                },
                periods: [
                    {
                        periodNumber: { type: Number, required: true }, // 1, 2, 3...
                        startTime: { type: String }, // e.g., "09:00 AM"
                        endTime: { type: String },   // e.g., "09:45 AM"
                        subjectName: { type: String, },
                        teacherId: { type: Schema.Types.ObjectId, ref: "UserModel", default: null },
                        isBreak: { type: Boolean, default: false }, // For Lunch/Recess
                        roomNumber: { type: String }
                    }
                ]
            }
        ]
    },
    { timestamps: true }
);

// Indexing for fast lookups
timetableSchema.index({ schoolId: 1});

const TimeTableModel = model("TimeTableModel", timetableSchema);
export default TimeTableModel;