import express from "express";
import { assignStudentToParent, createStudentProfile, deleteStudent, getAllStudents, getStudentById, updateStudent } from "../../../Controllers/New_Controllers/studentNew_controllers/studentNew.controller.js";
import { upload } from "../../../Utils/s3upload.js";
import { multiRoleAuth } from "../../../Middleware/multiRoleRequest.js";

const studentRoutes = express.Router();

// ==============================================================================
// STUDENT PROFILE ROUTES
// ==============================================================================

// CREATE
studentRoutes.post(
  "/create",
  multiRoleAuth("correspondent", "administrator", "accountant",),
  upload.single("file"), // Image
  createStudentProfile
);

// UPDATE
studentRoutes.put(
  "/update/:id",
  multiRoleAuth("correspondent", "administrator", "accountant",),
  upload.single("file"), // Image
  updateStudent
);

// DELETE
studentRoutes.delete(
  "/delete/:id",
  //   multiRoleAuth("PlatformAdmin", "Correspondent", "Principal"), 
  multiRoleAuth("correspondent"),
  deleteStudent
);

// GET SINGLE
studentRoutes.get(
  "/get/:id",
  //   multiRoleAuth("PlatformAdmin", "Correspondent", "Principal", "Accountant", "Teacher"), 
  multiRoleAuth("correspondent", "administrator", "principal", "accountant", "teacher"),

  getStudentById
);

// GET ALL (Filter by School, Class, Section in Query Params)
// Usage: /api/students/list?schoolId=123&classId=456&page=1&limit=20
studentRoutes.get(
  "/getall",
  //   multiRoleAuth("PlatformAdmin", "Correspondent", "Principal", "Accountant", "Teacher"), 
  multiRoleAuth("correspondent", "administrator", "principal", "accountant", "teacher"),

  getAllStudents
);

studentRoutes.put(
  "/assignstudent",
  multiRoleAuth("correspondent", "administrator"),
  assignStudentToParent
);


export default studentRoutes;