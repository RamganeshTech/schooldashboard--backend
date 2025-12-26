// import { SchoolModel } from "../models/school.model.js";

import SchoolModel from "../Models/New_Model/SchoolModel/shoolModel.model.js";

// This function takes the module name you want to protect (e.g., 'attendance')
export const featureGuard = (moduleName) => {
    return async (req, res, next) => {
        try {
            // 1. Get School ID (Assuming it's in req.user from auth middleware, or req.query)
            // Adjust this based on how you pass schoolId (headers, query, or token)
            const schoolId = req.user?.schoolId || req.query.schoolId;

            if (!schoolId) {
                return res.status(400).json({ ok: false, message: "School ID missing" });
            }

            // 2. Fetch School Subscription
            const school = await SchoolModel.findById(schoolId).select("subscription isActive");

            if (!school || !school.isActive) {
                return res.status(403).json({ ok: false, message: "School is inactive or not found" });
            }

            // 3. Check specific module permission
            // We check if the module exists in the list AND is set to true
            const hasAccess = school.subscription?.modules?.[moduleName];

            if (!hasAccess) {
                return res.status(403).json({
                    ok: false,
                    message: `Upgrade Required: Your plan does not include the '${moduleName}' module.`
                });
            }

            // 4. Access Granted
            next();

        } catch (error) {
            console.error("Feature Guard Error:", error);
            res.status(500).json({ ok: false, message: "Internal Server Error" });
        }
    };
};