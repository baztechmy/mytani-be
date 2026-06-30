// CONTROLLERS
import {
    findAllDeviceParamHandler,
    createDeviceParamHandler,
    findDeviceParamHandler,
    updateDeviceParamHandler,
    deleteDeviceParamHandler,
    findAllDeviceParamByDeviceHandler,
    findAllDeviceParamByUserHandler,
} from '../controllers/device-param.controller';

// MIDDLEWARES
import AccessControl from '../middlewares/access-control.middleware';
import Authorize from '../middlewares/authorization.middleware';

// MODULES
import { Router } from 'express';

const deviceParamRouter = Router();
deviceParamRouter.use(Authorize.accesstoken);

deviceParamRouter.route('/')
    .get(AccessControl.roles(['admin']), findAllDeviceParamHandler);
deviceParamRouter.route('/:d_id')
    .post(AccessControl.rolesOrDeviceOwner(['admin']), createDeviceParamHandler);
deviceParamRouter.route('/:dp_id')
    .get(AccessControl.rolesOrDeviceParamOwner(['admin']), findDeviceParamHandler)
    .patch(AccessControl.rolesOrDeviceParamOwner(['admin']), updateDeviceParamHandler)
    .delete(AccessControl.rolesOrDeviceParamOwner(['admin']), deleteDeviceParamHandler);
deviceParamRouter.route('/devices/:d_id')
    .get(AccessControl.rolesOrDeviceOwner(['admin']), findAllDeviceParamByDeviceHandler)
deviceParamRouter.route('/users/:user_id')
    .get(AccessControl.rolesOrAccountOwner(['admin']), findAllDeviceParamByUserHandler);

export default deviceParamRouter;
