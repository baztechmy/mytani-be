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

// MODULES
import { Router } from 'express';

const userRouter = Router();
userRouter.use(Authorize.accesstoken);

userRouter.route('/')
    .post(AccessControl.roles(['superadmin', 'admin']), createUserHandler)
    .get(AccessControl.roles(['superadmin', 'admin']), findAllUserHandler);
userRouter.route('/:user_id')
    .get(AccessControl.rolesOrOwner(['superadmin', 'admin']), findUserHandler)
    .patch(AccessControl.rolesOrOwner(['superadmin', 'admin']), updateUserHandler)
    .delete(AccessControl.roles(['superadmin', 'admin']), deleteUserHandler);

export default userRouter;
