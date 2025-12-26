// Routes/expenseRoutes.js
import express from "express";
// import { addExpense } from "../Controllers/expenseController.js";
// import { upload } from "../Utils/s4UploadsNew.js";
// import { multiRoleAuth } from "../Middlewares/authMiddleware.js";
import { multiRoleAuth } from './../../../Middleware/multiRoleRequest.js';
import { upload } from "../../../Utils/s4UploadsNew.js";
import { addExpense, deleteExpense, deleteProof, getAllExpenses, getExpenseById, updateExpense, updateExpenseStatus } from "../../../Controllers/New_Controllers/expense_controller/expense.controller.js";
import { featureGuard } from "../../../Middleware/featureGuard.js";

const expenseRoutes = express.Router();

expenseRoutes.post(
  "/add",
  // Allow these roles to access the route
  
  multiRoleAuth("correspondent", "accountant",), 
  featureGuard("expense"),
  upload.fields([
    { name: "billProof"}, 
    { name: "workProof"} 
  ]),
  
  addExpense
);


expenseRoutes.get("/getall", 
  multiRoleAuth("correspondent", "accountant", "principal"),
  featureGuard("expense"), getAllExpenses);
expenseRoutes.get("/get/:id", 
  multiRoleAuth("correspondent", "accountant", "principal"),
  featureGuard("expense"), getExpenseById);


expenseRoutes.delete("/delete/:id", 
  multiRoleAuth("correspondent"),
  featureGuard("expense"), deleteExpense);
expenseRoutes.delete("/deleteproof", 
  multiRoleAuth("correspondent"),
  featureGuard("expense"), deleteProof);

expenseRoutes.patch("/updatestatus/:id", 
  multiRoleAuth("correspondent"),
  featureGuard("expense"), updateExpenseStatus);

// Note: Update uses 'upload.fields' because files might be added
expenseRoutes.put(
    "/update/:id", 
    
    multiRoleAuth("correspondent"),
    featureGuard("expense"),
    upload.fields([
        { name: "billProof"}, 
        { name: "workProof"} 
    ]), 
    updateExpense
);

export default expenseRoutes;