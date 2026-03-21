import ClubQuizModel from "../../../Models/New_Model/club_model/ClubQuiz.model.js";
import SchoolModel from "../../../Models/New_Model/SchoolModel/shoolModel.model.js";

export const createClubQuiz = async (req, res) => {
    try {
        let {
            clubId,
            clubVideoId,
            classId,
            sectionId,
            title,
            description,
            questions,
            academicYear
            
        } = req.body;

        const schoolId = req.body.schoolId || req.user.schoolId;

          if(!schoolId){
            return res.status(400).json({ ok: false, message: "SchoolId is required." });
        }

        // 1. Basic Validation
        if (!title || !questions || !Array.isArray(questions) || questions.length === 0) {
            return res.status(400).json({ ok: false, message: "Title and at least one question are required." });
        }


      

        // 2. Academic Year Fallback
        if (!academicYear) {
            const school = await SchoolModel.findById(schoolId);
            academicYear = school?.currentAcademicYear;
            if (!academicYear) {
                return res.status(400).json({ ok: false, message: "Academic year not provided and not set in school settings." });
            }
        }

        // 3. Senior Dev Logic: Calculate Total Points and validate question structure
        let calculatedTotalPoints = 0;
        for (const q of questions) {
            if (!q.questionText || !q.options || q.options.length < 2) {
                return res.status(400).json({ ok: false, message: "Each question must have text and at least 2 options." });
            }
            calculatedTotalPoints += (Number(q.points) || 1);
        }

        const newQuiz = new ClubQuizModel({
            schoolId,
            clubId,
            clubVideoId,
            classId,
            sectionId,
            title,
            description,
            questions,
            totalPoints: calculatedTotalPoints,
            academicYear,
            isActive: true
        });

        await newQuiz.save();

        res.status(201).json({
            ok: true,
            message: "Club Quiz created successfully",
            data: newQuiz
        });

    } catch (error) {
        res.status(500).json({ ok: false, message: error.message });
    }
};

export const getAllClubQuizzes = async (req, res) => {
    try {
        const { clubId, classId, sectionId, page = 1, limit = 10 } = req.query;
        const schoolId = req.user.schoolId;

        const filter = { schoolId, isActive: true };
        if (clubId) filter.clubId = clubId;
        if (classId) filter.classId = classId;
        if (sectionId) filter.sectionId = sectionId;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const quizzes = await ClubQuizModel.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate("clubId", "name")
            .populate("clubVideoId", "title");

        const total = await ClubQuizModel.countDocuments(filter);

        res.status(200).json({
            ok: true,
            data: quizzes,
            pagination: {
                total,
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ ok: false, message: error.message });
    }
};


// Get Single Quiz
export const getSingleClubQuiz = async (req, res) => {
    try {
        const { id } = req.params;
        const quiz = await ClubQuizModel.findOne({ _id: id, schoolId: req.user.schoolId });

        if (!quiz) return res.status(404).json({ ok: false, message: "Quiz not found" });

        res.status(200).json({ ok: true, data: quiz });
    } catch (error) {
        res.status(500).json({ ok: false, message: error.message });
    }
};

// Delete Quiz
export const deleteClubQuiz = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedQuiz = await ClubQuizModel.findOneAndDelete({ _id: id, schoolId: req.user.schoolId });

        if (!deletedQuiz) {
            return res.status(404).json({ ok: false, message: "Quiz not found or unauthorized" });
        }

        res.status(200).json({ ok: true, message: "Quiz deleted successfully" });
    } catch (error) {
        res.status(500).json({ ok: false, message: error.message });
    }
};