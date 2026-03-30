import express from "express";
import { multiRoleAuth } from "../../../Middleware/multiRoleRequest.js";
import { getPendingTasksForParent } from "../../../Controllers/New_Controllers/pendingTask_controllers/pendingTask.controllers.js";

const PendingTaskRoutes = express.Router();

// Fetch Routes
PendingTaskRoutes.get("/getall", multiRoleAuth("correspondent", "administrator", "principal", "parent", "accountant", "viceprincipal", "teacher"), getPendingTasksForParent);

// PendingTaskRoutes.get("/getsingle/:id", multiRoleAuth("correspondent", "administrator", "principal", "parent", "accountant", "viceprincipal", "teacher"), getSingleHomeworkSubmission);


export default PendingTaskRoutes;