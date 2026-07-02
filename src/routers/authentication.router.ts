// CONTROLLERS
import { AuthenticationHandler } from '../controllers/authentication.controller';

// MIDDLEWARES
import Authorize from '../middlewares/authorization.middleware';

// MODULES
import { Router } from 'express';

const authenticationRouter = Router();

authenticationRouter.route('/')
    .post(AuthenticationHandler.loginUser);
authenticationRouter.route('/logout')
    .post(Authorize.accesstoken, AuthenticationHandler.logoutUser);

export default authenticationRouter;
