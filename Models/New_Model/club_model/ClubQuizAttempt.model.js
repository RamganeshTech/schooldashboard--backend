import { model } from "mongoose";
import { Schema } from "mongoose";





const answers = new Schema({
    questionText: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctOptionIndex: { type: Number, required: true }, // 0, 1, 2, or 3
    points: { type: Number, default: 1 }
}, { _id: true })



const attemptSchema = new Schema({
    quizId: { type: Schema.Types.ObjectId, ref: 'ClubQuizModel', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'StudentNewModel', required: true },
    schoolId: { type: Schema.Types.ObjectId, ref: "SchoolModel", required: true },
    // Denormalized for fast leaderboards:
    academicYear: {type:String, default: null},
    classId: { type: Schema.Types.ObjectId, ref: 'ClassModel', default: null },
    sectionId: { type: Schema.Types.ObjectId, ref: 'SectionModel', default: null },
    answers: { type: [answers], default: [] },
    score: { type: Number, required: true },
    percentage: { type: Number }, // score / totalPoints * 100
    completedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const ClubQuizAttemptModel = model('ClubQuizAttemptModel', attemptSchema);

export default ClubQuizAttemptModel