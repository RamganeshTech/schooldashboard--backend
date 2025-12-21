import express from "express";
import { multiRoleAuth } from "../../../Middleware/multiRoleRequest.js";
import { cancelTransaction, getAllTransactions, getTransactionById } from "../../../Controllers/New_Controllers/financeLedger_controller/financeLedger.controller.js";
// import { multiRoleAuth } from "../../../Middlewares/authMiddleware.js";
// import { 
//     getAllTransactions, 
//     getTransactionById, 
//     cancelTransaction,
//     getFinanceStats
// } from "../../../Controllers/New_Controller/finance_controller/finance.controller.js";

const financeRoutes = express.Router();

// Get All (Filterable)
financeRoutes.get("/getall", multiRoleAuth("correspondent", "accountant", "principal"), getAllTransactions);

// Get Stats (Dashboard)
// financeRoutes.get("/stats", multiRoleAuth("correspondent", "accountant", "principal"), getFinanceStats);

// Get Single ID
financeRoutes.get("/get/:id", multiRoleAuth("correspondent", "accountant", "principal"), getTransactionById);

// Cancel (Soft Delete) - Correspondent Only
financeRoutes.patch("/cancel/:id", multiRoleAuth("correspondent"), cancelTransaction);

export default financeRoutes;