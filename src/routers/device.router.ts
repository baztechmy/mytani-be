// CONTROLLERS
import { createDeviceHandler, deleteDeviceHandler, findAllDeviceHandler, findDeviceHandler, updateDeviceHandler } from '../controllers/device.controller';

// MIDDLEWARES
import AccessControl from '../middlewares/access-control.middleware';
import Authorize from '../middlewares/authorization.middleware';

// MODULES
import { Router } from 'express';

const deviceRouter = Router();
deviceRouter.use(Authorize.accesstoken);

deviceRouter.route('/')
    .post(createDeviceHandler)
    .get(AccessControl.roles(['superadmin', 'admin']), findAllDeviceHandler);
deviceRouter.route('/:d_id')
    .get(AccessControl.rolesOrDeviceOwner(['superadmin', 'admin']), findDeviceHandler)
    .patch(AccessControl.rolesOrDeviceOwner(['superadmin', 'admin']), updateDeviceHandler)
    .delete(AccessControl.rolesOrDeviceOwner(['superadmin', 'admin']), deleteDeviceHandler);

export default deviceRouter;
