// CONTROLLERS
import { findAllDeviceParamByDeviceHandler } from '../controllers/device-param.controller';
import { DeviceHandler } from '../controllers/device.controller';

// MIDDLEWARES
import AccessControl from '../middlewares/access-control.middleware';
import Authorize from '../middlewares/authorization.middleware';

// MODULES
import { Router } from 'express';

const deviceRouter = Router();
deviceRouter.use(Authorize.accesstoken);

deviceRouter.route('/')
    .get(AccessControl.roles(), DeviceHandler.findAll);
deviceRouter.route('/:d_id')
    .get(AccessControl.deviceOwner(['admin', 'user']), DeviceHandler.find)
    .patch(AccessControl.deviceOwner(['admin']), DeviceHandler.update)
    .delete(AccessControl.deviceOwner(['admin']), DeviceHandler.remove);
deviceRouter.route('/:d_id/device-params')
    .get(AccessControl.deviceOwner(['admin', 'user']), findAllDeviceParamByDeviceHandler);

export default deviceRouter;
