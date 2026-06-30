// CONTROLLERS
import {
    createDeviceDataHandler,
    deleteDeviceDataHandler,
} from '../controllers/device-data.controller';

// MIDDLEWARES
import AccessControl from '../middlewares/access-control.middleware';
import Authorize from '../middlewares/authorization.middleware';

// MODULES
import { Router } from 'express';

const deviceDataRouter = Router();
deviceDataRouter.use(Authorize.accesstoken);

deviceDataRouter.route('/:d_id')
    .post(AccessControl.rolesOrDeviceOwner(['admin']), createDeviceDataHandler)
    .delete(AccessControl.rolesOrDeviceOwner(['admin']), deleteDeviceDataHandler);

export default deviceDataRouter;
