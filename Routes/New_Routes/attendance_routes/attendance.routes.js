import express from "express";
import { getAttendanceSheet, getClassAttendanceHistory, markAttendance } from "../../../Controllers/New_Controllers/attendance_controller/attendance.controller.js";
import { multiRoleAuth } from "../../../Middleware/multiRoleRequest.js";
// import { 
//   getAttendanceSheet, 
//   markAttendance, 
//   getStudentAttendanceReport 
// } from "../controllers/attendanceController.js";
// import { multiRoleAuth } from "../middlewares/authMiddleware.js";

const attendanceRoutes = express.Router();

// ==============================================================================
// 1. SHEET OPERATIONS (Class Level)
// ==============================================================================

// GET: Fetch the Daily Sheet (Create Mode or Edit Mode)
// Used by Teachers daily
attendanceRoutes.get(
  "/sheet", 
  multiRoleAuth("administrator", "correspondent", "principal", "teacher"), 
  getAttendanceSheet
);

// POST: Mark or Update Attendance
// Used by Teachers daily
attendanceRoutes.post(
  "/mark", 
  multiRoleAuth("correspondent", "teacher"), 
  markAttendance
);


attendanceRoutes.get(
  "/getallclass",
  multiRoleAuth("administrator", "correspondent", "principal", "teacher"), 
  getClassAttendanceHistory
);

// ==============================================================================
// 2. REPORT OPERATIONS (Student Level)
// ==============================================================================

// GET: View Single Student's History (e.g. "Rahul's Attendance for 2025")
// Used by Parents, Teachers, Admin
// attendanceRoutes.get(
//   "/student-report", 
//   multiRoleAuth("administrator", "correspondent", "principal", "teacher", "parent"), 
//   getStudentAttendanceReport
// );

export default attendanceRoutes;