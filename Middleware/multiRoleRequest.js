import jwt from "jsonwebtoken";
// import UserModel from "../Models/New_Model/UserModel/userModel.model";
// import UserModel from "../models/UserModel.js";

export const multiRoleAuth = (...allowedRoles) => {
    return async (req, res, next) => {
        try {
            // 1. Get the token from the Header
            const authHeader = req.headers.authorization;

            console.log("req.headers.authorization", req.headers.authorization)
            console.log(" --------------")

            console.log("headers", authHeader)

            let token;
            if (authHeader && authHeader.startsWith("Bearer")) {
                token = authHeader.split(" ")[1];
            }

            // If no token found
            if (!token) {
                return res.status(401).json({
                    message: "Unauthorized: No token provided",
                    ok: false
                });
            }

            // 2. Verify the Token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // 3. Check if User exists in DB 
            // (Crucial: prevents access if a teacher was fired/deleted but token is still valid)
            // const user = await UserModel.findById(decoded.id).select("-password");

            // if (!user) {
            //     return res.status(401).json({
            //         message: "Unauthorized: User no longer exists",
            //         ok: false
            //     });
            // }

            // 4. Role Validation
            // We check if the user's role (from DB) is in the allowed list passed to the function
            if (!allowedRoles.includes(decoded.role)) {
                return res.status(403).json({
                    message: `Access denied: Role '${decoded.role}' is not authorized.`,
                    ok: false
                });
            }


            console.log(" --------------")
            console.log("decoded", decoded)
            // 5. Attach User to Request
            // Now controllers can access req.user.schoolId, req.user._id, etc.
            req.user = {
                _id: decoded._id,
                schoolId: decoded.schoolId,
                role: decoded.role,
                isPlatformAdmin: decoded.isPlatformAdmin,
            };

            next();

        } catch (error) {
            console.error("Auth Middleware Error:", error.message);
            return res.status(401).json({
                message: "Authentication failed: Invalid or expired token",
                ok: false
            });
        }
    };
};