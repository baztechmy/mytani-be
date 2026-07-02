// CONTROLLERS
import { UserHandler } from '../controllers/user.controller';

// MIDDLEWARES
import Authorize from '../middlewares/authorization.middleware';
import AccessControl from '../middlewares/access-control.middleware';

// MODULES
import { Router } from 'express';

const userRouter = Router();
userRouter.use(Authorize.accesstoken);

userRouter.route('/')
    .get(AccessControl.roles(), UserHandler.findAll);
userRouter.route('/:user_id')
    .get(AccessControl.accountOwner(['admin']), UserHandler.find)
    .patch(AccessControl.accountOwner(['admin']), UserHandler.update)
    .delete(AccessControl.roles(['admin']), UserHandler.remove);

export default userRouter;
