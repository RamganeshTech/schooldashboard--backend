
import AcademicCalendarModel from "../../../Models/New_Model/academicCalendar_model/academicCalendar.model.js";
import SchoolModel from "../../../Models/New_Model/SchoolModel/shoolModel.model.js";

export const createCalendarEvent = async (req, res) => {
    try {
        let {
            schoolId,
            title,
            description,
            startDate,
            endDate,
            type,
            applicableToClasses,
            academicYear
        } = req.body;


        // 1. STRICTOR VALIDATION: Title is mandatory from the user
        if (!title || title.trim() === "") {
            return res.status(400).json({
                ok: false,
                message: "Event title is required. Please provide a name for this calendar entry."
            });
        }
        if (!academicYear) {
            // // 1. Get Academic Year (Source of Truth)
            const schoolDoc = await SchoolModel.findById(schoolId)
            academicYear = schoolDoc?.currentAcademicYear;

            if (!academicYear) {
                return res.status(500).json({
                    ok: false,
                    message: "Current Academic year is not set for the school , either set in school department or else provide the academic year"
                });
            }
        }


        // 3. Validate remaining fields
        if (!startDate || !endDate || !type) {
            return res.status(400).json({
                ok: false,
                message: "Please provide the startDate, endDate, and event type (holiday/exam/event)."
            });
        }

        // 4. Duplicate Check (Check if this title exists on this specific start date)
        const existingEvent = await AcademicCalendarModel.findOne({
            schoolId,
            academicYear,
            title: title.trim(),
            startDate: new Date(startDate),
        });

        if (existingEvent) {
            return res.status(400).json({
                ok: false,
                message: `The event '${title}' is already scheduled for this date in the ${academicYear} calendar.`
            });
        }

        // 5. Create the New Event
        const newEvent = new AcademicCalendarModel({
            schoolId,
            title: title.trim(),
            description,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            type,
            academicYear, // Injected from the school document
            applicableToClasses: applicableToClasses || []
        });

        await newEvent.save();

        res.status(201).json({
            ok: true,
            data: newEvent,
            message: `Successfully created '${title}' for the ${academicYear} academic year.`
        });

    } catch (error) {
        console.error("Create Calendar Event Error:", error);
        res.status(500).json({ ok: false, message: error.message });
    }
};


export const updateCalendarEvent = async (req, res) => {
    try {
        const { id } = req.params;
        // const  = req.user.schoolId;
        // const updates = req.body;

        // Explicitly destructure only the allowed fields
        const { 
            title, 
            description, 
            startDate, 
            endDate, 
            type, 
            applicableToClasses,
            academicYear 
        } = req.body;


// Construct the update object with only defined fields
        const updateData = {};
        if (title !== undefined) updateData.title = title.trim();
        if (description !== undefined) updateData.description = description;
        if (startDate !== undefined) updateData.startDate = new Date(startDate);
        if (endDate !== undefined) updateData.endDate = new Date(endDate);
        if (type !== undefined) updateData.type = type;
        if (applicableToClasses !== undefined) updateData.applicableToClasses = applicableToClasses;
        if (academicYear !== undefined) updateData.academicYear = academicYear;


        const updatedEvent = await AcademicCalendarModel.findOneAndUpdate(
            { _id: id },
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!updatedEvent) {
            return res.status(404).json({ ok: false, message: "Event not found or unauthorized." });
        }

        return res.status(200).json({
            ok: true,
            data: updatedEvent,
            message: "Calendar event updated successfully."
        });
    } catch (error) {
       return res.status(500).json({ ok: false, message: error.message });
    }
};


export const getAllCalendarEvents = async (req, res) => {
    try {
        const { month, type, academicYear, schoolId } = req.query;

        let activeYear = academicYear;

        // 1. If no academicYear provided in query, fetch the default from SchoolModel
        if (!activeYear) {
            const schoolDoc = await SchoolModel.findById(schoolId).select("currentAcademicYear");
            activeYear = schoolDoc?.currentAcademicYear;
        }

        const filter = { schoolId, academicYear: activeYear };

        // 2. Filter by Event Type (holiday, exam, etc.)
        if (type) filter.type = type;

        // 3. Filter by Month (1-12)
        if (month) {
            const yearNum = parseInt(activeYear.split('-')[0]); // e.g., "2025" from "2025-2026"
            // Note: If month is Jan(1), it might belong to 2026. 
            // Simple logic: If month < 6, assume it's the second half of the academic year
            const targetYear = parseInt(month) < 6 ? yearNum + 1 : yearNum;
            
            const startOfMonth = new Date(targetYear, month - 1, 1);
            const endOfMonth = new Date(targetYear, month, 0, 23, 59, 59);

            filter.startDate = { $gte: startOfMonth, $lte: endOfMonth };
        }

        const events = await AcademicCalendarModel.find(filter).sort({ startDate: 1 });

        res.status(200).json({
            ok: true,
            count: events.length,
            data: events,
            message: `Fetched calendar events for ${activeYear}`
        });
    } catch (error) {
        res.status(500).json({ ok: false, message: error.message });
    }
};


export const getSingleCalendarEvent = async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Find the event and ensure it belongs to the user's school
        const event = await AcademicCalendarModel.findOne({ 
            _id: id, 
        }).populate("applicableToClasses", "name schoolId"); // Optional: populate class details

        if (!event) {
            return res.status(404).json({ 
                ok: false, 
                message: "Calendar event not found or you do not have permission to view it." 
            });
        }

        res.status(200).json({
            ok: true,
            data: event,
            message: "Event details fetched successfully."
        });
    } catch (error) {
        console.error("Get Single Event Error:", error);
        res.status(500).json({ ok: false, message: error.message });
    }
};


export const deleteCalendarEvent = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedEvent = await AcademicCalendarModel.findOneAndDelete({ 
            _id: id, 
        });

        if (!deletedEvent) {
            return res.status(404).json({ ok: false, message: "Event not found or unauthorized." });
        }

        res.status(200).json({
            ok: true,
            message: `'${deletedEvent.title}' has been removed from the calendar.`
        });
    } catch (error) {
        res.status(500).json({ ok: false, message: error.message });
    }
};