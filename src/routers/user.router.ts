// MIDDLEWARES
import { Router } from 'express';

// CONTROLLERS
import {
    createUserHandler,
    findUserHandler,
    findAllUserHandler,
    updateUserHandler,
    deleteUserHandler
} from '../controllers/user.controller';

// MIDDLEWARES
import Authorize from '../middlewares/authorization.middleware';
import AccessControl from '../middlewares/access-control.middleware';

const userRouter = Router();
userRouter.use(Authorize.accesstoken);

userRouter.route('/')
    .post(AccessControl.roles(['superadmin', 'admin']), Authorize.accesstoken, createUserHandler)
    .get(AccessControl.roles(['superadmin', 'admin']), Authorize.accesstoken, findAllUserHandler);
userRouter.route('/:user_id')
    .get(AccessControl.rolesOrAccountOwner(['superadmin', 'admin']), Authorize.accesstoken, findUserHandler)
    .patch(AccessControl.rolesOrAccountOwner(['superadmin', 'admin']), Authorize.accesstoken, updateUserHandler)
    .delete(AccessControl.roles(['superadmin', 'admin']), Authorize.accesstoken, deleteUserHandler);

export default userRouter;
