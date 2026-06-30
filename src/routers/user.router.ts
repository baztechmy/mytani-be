// CONTROLLERS
import {
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
    .get(AccessControl.roles(), findAllUserHandler);
userRouter.route('/:user_id')
    .get(AccessControl.accountOwner(['admin']), findUserHandler)
    .patch(AccessControl.accountOwner(['admin']), updateUserHandler)
    .delete(AccessControl.roles(['admin']), deleteUserHandler);

export default userRouter;
