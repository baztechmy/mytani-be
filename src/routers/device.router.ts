// CONTROLLERS
import {
    findAllDeviceHandler,
    findDeviceHandler,
    updateDeviceHandler,
    deleteDeviceHandler,
} from '../controllers/device.controller';
import { findAllDeviceParamByDeviceHandler } from '../controllers/device-param.controller';

// MIDDLEWARES
import AccessControl from '../middlewares/access-control.middleware';
import Authorize from '../middlewares/authorization.middleware';

// MODULES
import { Router } from 'express';

const deviceRouter = Router();
deviceRouter.use(Authorize.accesstoken);

deviceRouter.route('/')
    .get(AccessControl.roles(), findAllDeviceHandler);
deviceRouter.route('/:d_id')
    .get(AccessControl.deviceOwner(['admin', 'user']), findDeviceHandler)
    .patch(AccessControl.deviceOwner(['admin']), updateDeviceHandler)
    .delete(AccessControl.deviceOwner(['admin']), deleteDeviceHandler);
deviceRouter.route('/:d_id/device-params')
    .get(AccessControl.deviceOwner(['admin', 'user']), findAllDeviceParamByDeviceHandler);

export default deviceRouter;
