// CONTROLLERS
import {
    createDeviceHandler,
    deleteDeviceHandler,
    findAllDeviceByUserHandler,
    findAllDeviceHandler,
    findDeviceHandler,
    updateDeviceHandler
} from '../controllers/device.controller';

// MIDDLEWARES
import AccessControl from '../middlewares/access-control.middleware';
import Authorize from '../middlewares/authorization.middleware';

// MODULES
import { Router } from 'express';

const deviceRouter = Router();
deviceRouter.use(Authorize.accesstoken);

deviceRouter.route('/')
    .post(createDeviceHandler)
    .get(AccessControl.roles(['admin']), findAllDeviceHandler);
deviceRouter.route('/:d_id')
    .get(AccessControl.rolesOrDeviceOwner(['admin']), findDeviceHandler)
    .patch(AccessControl.rolesOrDeviceOwner(['admin']), updateDeviceHandler)
    .delete(AccessControl.rolesOrDeviceOwner(['admin']), deleteDeviceHandler);
deviceRouter.route('/users/:user_id')
    .get(AccessControl.rolesOrAccountOwner(['admin']), findAllDeviceByUserHandler)

export default deviceRouter;
