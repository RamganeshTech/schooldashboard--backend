import express from 'express'
import { createUser, deleteUser, isAuthenticated, loginUser, logoutUser, updateUser } from '../../../Controllers/New_Controllers/user_contorllers/user.controllers.js';
import { multiRoleAuth } from '../../../Middleware/multiRoleRequest.js';

const userRoutes = express.Router()

userRoutes.post('/create', multiRoleAuth("correspondent"), createUser);
userRoutes.post('/login', loginUser);
userRoutes.post('/logout', logoutUser);
userRoutes.get('/isauthenticated',
    multiRoleAuth("correspondent", "teacher", "principal", "admin", "viceprincipal"),
    isAuthenticated);
userRoutes.delete("/delete/:id",
    multiRoleAuth("correspondent"),

    deleteUser)
userRoutes.put("/update/:id",
    multiRoleAuth("correspondent", "teacher", "principal", "admin", "viceprincipal"),
    updateUser)

export default userRoutes;