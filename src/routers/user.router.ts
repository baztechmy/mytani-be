// CONTROLLERS
import { UserHandler } from '../controllers/user.controller';

// MIDDLEWARES
import Authorize from '../middlewares/authorization.middleware';
import AC from '../middlewares/access-control.middleware';

// MODULES
import { Router } from 'express';

const userRouter = Router();
userRouter.use(Authorize.accesstoken);

userRouter.route('/')
    .get(AC.roles(), UserHandler.findAll);
userRouter.route('/:user_id')
    .get(AC.accountOwner(['admin']), UserHandler.find)
    .patch(AC.accountOwner(['admin']), UserHandler.update)
    .delete(AC.roles(['admin']), UserHandler.remove);

export default userRouter;
