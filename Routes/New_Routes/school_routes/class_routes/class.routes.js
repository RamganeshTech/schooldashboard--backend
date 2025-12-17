import express from "express";
import {
    createClass,
    getClasses,
    updateClass,
    deleteClass
} from "../../../../Controllers/New_Controllers/school_controllers/class_controllers/class.controllers.js";
import { multiRoleAuth } from "../../../../Middleware/multiRoleRequest.js";

const classRoutes = express.Router();

// READ: Teachers and Admins can view classes
classRoutes.get(
    "/getall/:schoolId",
    multiRoleAuth("correspondent", "teacher", "principal", "admin", "viceprincipal"),
    getClasses
);

// CREATE: Only Admins/Principals
classRoutes.post(
    "/create/:schoolId",
    multiRoleAuth("correspondent",  "admin"),
    createClass
);

// UPDATE
classRoutes.put(
    "/update/:id",
    multiRoleAuth("correspondent", "admin"),
    updateClass
);

// DELETE
classRoutes.delete(
    "/delete/:id",
    multiRoleAuth("correspondent", "admin"),
    deleteClass
);

export default classRoutes;