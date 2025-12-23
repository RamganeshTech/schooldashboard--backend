import express from "express";
import { getAllAuditLogs, getAuditLogById } from "../../../Controllers/New_Controllers/audit_controllers/audit.controllers.js";
import { multiRoleAuth } from "../../../Middleware/multiRoleRequest.js";

const auditRoutes = express.Router();

// ==============================================================================
// 1. SHEET OPERATIONS (Class Level)
// ==============================================================================

// GET: Fetch the Daily Sheet (Create Mode or Edit Mode)
// Used by Teachers daily
auditRoutes.get(
  "/getall", 
  multiRoleAuth("correspondent", "principal"), 
  getAllAuditLogs
);



auditRoutes.get(
  "/get/:id",
  multiRoleAuth("administrator", "correspondent", "principal", "teacher"), 
  getAuditLogById
);

export default auditRoutes;