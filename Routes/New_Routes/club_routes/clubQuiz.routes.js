import express from 'express';
import { multiRoleAuth } from '../../../Middleware/multiRoleRequest.js';
import { featureGuard } from '../../../Middleware/featureGuard.js';
import { createClubQuiz, deleteClubQuiz, getAllClubQuizzes, getSingleClubQuiz } from '../../../Controllers/New_Controllers/club_controllers/clubQuiz.controller.js';

const clubQuizRoutes = express.Router();

clubQuizRoutes.post('/create',
    multiRoleAuth("correspondent", "administrator", "teacher"),
    featureGuard("club"),
    createClubQuiz);


clubQuizRoutes.get('/getall',
    multiRoleAuth("correspondent", "principal", "teacher", "parent", "administrator", "accountant", "viceprincipal"),
    featureGuard("club"),
    getAllClubQuizzes);

clubQuizRoutes.get('/get/:id',
    multiRoleAuth("correspondent", "principal", "teacher", "parent", "administrator", "accountant", "viceprincipal"),
    featureGuard("club"),
    getSingleClubQuiz);


// Delete Club (and cascades to delete videos)
clubQuizRoutes.delete('/delete/:id',
    multiRoleAuth("correspondent", "administrator", "teacher"),
    featureGuard("club"),
    deleteClubQuiz);


export default clubQuizRoutes;