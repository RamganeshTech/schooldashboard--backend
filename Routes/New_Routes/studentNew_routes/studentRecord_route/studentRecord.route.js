import express from "express";
import { applyConcession, collectFeeAndManageRecord, deleteStudentRecord, getStudentRecordById, revertFeeTransaction, toggleStudentRecordStatus, updateConcessionDetails, uploadConcessionProof } from "../../../../Controllers/New_Controllers/studentRecord_controller/studentRecord.controller.js";
// import { upload } from "../../../../Utils/s3upload.js";
import { multiRoleAuth } from "../../../../Middleware/multiRoleRequest.js";
import { upload } from "../../../../Utils/s4UploadsNew.js";

const studentRecordRoutes = express.Router();



// studentRecordRoutes.post(
//   "/applyconcession",
//   multiRoleAuth("correspondent", "accountant", "principal"),
//   upload.single("file"), // Image
//   applyConcession
// );

// UPLOAD ROUTE
studentRecordRoutes.post(
  "/applyconcession",
  multiRoleAuth("correspondent", "accountant", "principal"),
  // "files" is the key name for form-data. 10 is max count.
  upload.array("file"), 
  applyConcession
);



studentRecordRoutes.put(
  "/updatevalue",
  multiRoleAuth("correspondent", "accountant", "principal"),
  // "files" is the key name for form-data. 10 is max count.
 updateConcessionDetails
);

//  one fule only allowed, it will take the first file
studentRecordRoutes.put(
  "/update/proof",
  multiRoleAuth("correspondent", "accountant", "principal"),
  upload.array("file"), 
  uploadConcessionProof
);



studentRecordRoutes.post(
  "/collectfee",
  multiRoleAuth("correspondent", "accountant"),
  collectFeeAndManageRecord
);


studentRecordRoutes.get(
  "/getrecord/:schoolId/:studentId",
  multiRoleAuth("administrator", "correspondent", "principal", "viceprincipal", "accountant"),
  getStudentRecordById
);


studentRecordRoutes.delete(
  "/deleterecord/:id",
  multiRoleAuth("correspondent"), // Only Top-Level Access
  deleteStudentRecord
);


studentRecordRoutes.patch(
  "/togglestatus/:id",
  multiRoleAuth("administrator", "correspondent", "accountant"),
  toggleStudentRecordStatus
);



studentRecordRoutes.put(
  "/revertreceipt",
  multiRoleAuth("correspondent", "accountant", "principal"),
  revertFeeTransaction
);



export default studentRecordRoutes;