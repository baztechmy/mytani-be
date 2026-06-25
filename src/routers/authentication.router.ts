// MODULES
import { Router } from 'express';

// CONTROLLERS
import { loginUserHandler, logoutUserHandler } from '../controllers/authentication.controller';

// MIDDLEWARES
import Authorize from '../middlewares/authorization.middleware';

const authenticationRouter = Router();

authenticationRouter.route('/')
    .post(loginUserHandler);
authenticationRouter.route('/logout')
    .post(Authorize.accesstoken, logoutUserHandler);

export default authenticationRouter;
