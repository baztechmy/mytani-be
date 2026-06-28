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
    .get(AccessControl.roles(['superadmin', 'admin']), findAllDeviceParamHandler);
deviceParamRouter.route('/:d_id')
    .post(AccessControl.rolesOrDeviceOwner(['superadmin', 'admin']), createDeviceParamHandler);
deviceParamRouter.route('/:dp_id')
    .get(AccessControl.rolesOrDeviceParamOwner(['superadmin', 'admin']), findDeviceParamHandler)
    .patch(AccessControl.rolesOrDeviceParamOwner(['superadmin', 'admin']), updateDeviceParamHandler)
    .delete(AccessControl.rolesOrDeviceParamOwner(['superadmin', 'admin']), deleteDeviceParamHandler);
deviceParamRouter.route('/devices/:d_id')
    .get(AccessControl.rolesOrDeviceOwner(['superadmin', 'admin']), findAllDeviceParamByDeviceHandler)
deviceParamRouter.route('/users/:user_id')
    .get(AccessControl.rolesOrAccountOwner(['superadmin', 'admin']), findAllDeviceParamByUserHandler);

export default deviceParamRouter;
