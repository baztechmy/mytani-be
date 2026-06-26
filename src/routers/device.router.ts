// CONTROLLERS
import { createDeviceHandler, deleteDeviceHandler, findAllDeviceHandler, findDeviceHandler, updateDeviceHandler } from '../controllers/device.controller';

// MIDDLEWARES
import Authorize from '../middlewares/authorization.middleware';

// MODULES
import { Router } from 'express';

const deviceRouter = Router();
deviceRouter.use(Authorize.accesstoken);

deviceRouter.route('/')
    .post(Authorize.accesstoken, createDeviceHandler)
    .get(Authorize.accesstoken, findAllDeviceHandler);
deviceRouter.route('/:d_id')
    .get(Authorize.accesstoken, findDeviceHandler)
    .patch(Authorize.accesstoken, updateDeviceHandler)
    .delete(Authorize.accesstoken, deleteDeviceHandler);

export default deviceRouter;
