import express from 'express'
import { assignRolesToUser, createUser, deleteUser, isAuthenticated, loginUser, logoutUser, updateUser } from '../../../Controllers/New_Controllers/user_contorllers/user.controllers.js';
import { multiRoleAuth } from '../../../Middleware/multiRoleRequest.js';
import { getUsersBySchool } from '../../../Controllers/New_Controllers/user_contorllers/userUtil.controller.js';

const userRoutes = express.Router()

userRoutes.post('/create', createUser);

userRoutes.post('/login', loginUser);
userRoutes.post('/logout', logoutUser);
userRoutes.get('/isauthenticated',
    multiRoleAuth("correspondent", "teacher", "principal", "administrator", "viceprincipal"),
    isAuthenticated);

userRoutes.delete("/delete/:id",
    multiRoleAuth("correspondent"),
    deleteUser);

userRoutes.put("/update/:id",
    multiRoleAuth("correspondent", "teacher", "principal", "administrator", "viceprincipal"),
    updateUser);




//  new route (in role  if you send the all in the role params , then youll get all the users irrespective of role)
userRoutes.get(
    "/:role/:schoolId",
    multiRoleAuth("correspondent", "teacher", "principal", "administrator", "viceprincipal"),
    getUsersBySchool
);


userRoutes.put(
    "/assignrole/:userId",
    multiRoleAuth("correspondent", "administrator",),
    assignRolesToUser
);





export default userRoutes;