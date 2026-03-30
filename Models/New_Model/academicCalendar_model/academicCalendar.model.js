import mongoose from "mongoose";

const academicCalendarSchema = new mongoose.Schema(
    {
        schoolId: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: "SchoolModel", 
            required: true 
        },
        academicYear: { 
            type: String, // e.g., "2025-2026" 
        },
        title: { type: String, }, // e.g., "Diwali", "Mid-Term Exam"
        description: { type: String, default: null },
        
        startDate: { type: Date,  },
        endDate: { type: Date, }, // For single day events, startDate = endDate
        
        type: { 
            type: String, 
            // enum: ["holiday", "exam", "event", "special_occasion"], 
            // required: true 
        },
                
        // Optional: Target specific classes (e.g., only Grade 10 has an exam)
        applicableToClasses: [{ type: mongoose.Schema.Types.ObjectId, ref: "ClassModel" }] 
    },
    { timestamps: true }
);

// Index for fast lookups by school and year
academicCalendarSchema.index({ schoolId: 1, academicYear: 1, });

const AcademicCalendarModel = mongoose.model("AcademicCalendarModel", academicCalendarSchema);
export default AcademicCalendarModel;