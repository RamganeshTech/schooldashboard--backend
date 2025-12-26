import express from "express";
// import { upload } from "../../../Utils/s3upload.js";
import { multiRoleAuth } from "../../../Middleware/multiRoleRequest.js";
import { getMyFeatures, updateSchoolSubscription } from "../../../Controllers/New_Controllers/subscription_controllers/subscription.controller.js";

const subscriptionRoutes = express.Router();


subscriptionRoutes.put("/update", multiRoleAuth('correspondent'), updateSchoolSubscription)
subscriptionRoutes.get("/get", multiRoleAuth('correspondent', "principal"), getMyFeatures)


export default subscriptionRoutes;