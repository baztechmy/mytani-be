// CONTROLLERS
import {
    createDeviceParamHandler,
    findDeviceParamHandler,
    updateDeviceParamHandler,
    deleteDeviceParamHandler,
} from '../controllers/device-param.controller';

// MIDDLEWARES
import AccessControl from '../middlewares/access-control.middleware';
import Authorize from '../middlewares/authorization.middleware';

// MODULES
import { Router } from 'express';

const deviceParamRouter = Router();
deviceParamRouter.use(Authorize.accesstoken);

deviceParamRouter.route('/:d_id')
    .post(AccessControl.deviceOwner(['admin']), createDeviceParamHandler);
deviceParamRouter.route('/:dp_id')
    .get(AccessControl.deviceParamOwner(['admin', 'user']), findDeviceParamHandler)
    .patch(AccessControl.deviceParamOwner(['admin']), updateDeviceParamHandler)
    .delete(AccessControl.deviceParamOwner(['admin']), deleteDeviceParamHandler);

export default deviceParamRouter;
