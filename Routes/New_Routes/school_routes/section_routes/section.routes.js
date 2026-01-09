import express from "express";

import { multiRoleAuth } from "../../../../Middleware/multiRoleRequest.js";
import { createSection, deleteSection, getSections, updateSection } from "../../../../Controllers/New_Controllers/school_controllers/section_controllers/section.controllers.js";

const sectionRoutes = express.Router();


sectionRoutes.get(
  "/getall", 
  multiRoleAuth("correspondent", "teacher", "principal", "administrator", "viceprincipal", "accountant"), 
  getSections
);

sectionRoutes.post(
  "/create", 
  multiRoleAuth("correspondent", "administrator", ), 
  createSection
);


sectionRoutes.put(
  "/update/:id", 
  multiRoleAuth("correspondent", "administrator", ), 
  updateSection
);

sectionRoutes.delete(
  "/delete/:id", 
  multiRoleAuth("correspondent" ), 
  deleteSection
);

export default sectionRoutes;