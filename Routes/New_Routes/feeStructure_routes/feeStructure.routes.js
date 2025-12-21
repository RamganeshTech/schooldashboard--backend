import express from "express";
import { getFeeStructureByClass, setFeeStructure } from "../../../Controllers/New_Controllers/feeStructure_controller/feeStructure.controller.js";
import { multiRoleAuth } from "../../../Middleware/multiRoleRequest.js";
// import { setFeeStructure, getFeeStructureByClass } from "../controllers/feeStructureController.js";
// import { multiRoleAuth } from "../middlewares/authMiddleware.js";

const feeStructureRoutes = express.Router();

// ====================================================================
// FEE STRUCTURE ROUTES
// ====================================================================

// Endpoint: Set or Update Fee Structure for a Class
// Access: PlatformAdmin, Correspondent, Principal
feeStructureRoutes.post(
  "/set",
  multiRoleAuth("correspondent", "administrator"), 
  setFeeStructure
);

// Endpoint: Get Fee Structure (Used for editing or during Admission)
// Access: Accountant also needs this to see fees
feeStructureRoutes.get(
  "/getbyclass",
  multiRoleAuth("correspondent", "administrator", "principal", "accountant", "teacher"), 
  getFeeStructureByClass
);

export default feeStructureRoutes;