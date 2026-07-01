// CONTROLLERS
import {
    createDeviceRelayHandler,
    deleteDeviceRelayHandler,
    findAllDeviceRelayHandler,
    findAllDeviceRelayByUserHandler,
    findDeviceRelayHandler,
    updateDeviceRelayHandler
} from '../controllers/device-relay.controller';

// MIDDLEWARES
import AccessControl from '../middlewares/access-control.middleware';
import Authorize from '../middlewares/authorization.middleware';

// MODULES
import { Router } from 'express';

const deviceRelayRouter = Router();
deviceRelayRouter.use(Authorize.accesstoken);

deviceRelayRouter.route('/')
    .get(AccessControl.roles(['admin']), findAllDeviceRelayHandler);
deviceRelayRouter.route('/:d_id')
    .post(AccessControl.deviceOwner(['admin']), createDeviceRelayHandler)
    .get(AccessControl.deviceOwner(['admin']), findDeviceRelayHandler)
    .patch(AccessControl.deviceOwner(['admin']), updateDeviceRelayHandler)
    .delete(AccessControl.deviceOwner(['admin']), deleteDeviceRelayHandler);
deviceRelayRouter.route('/users/:user_id')
    .get(AccessControl.accountOwner(['admin']), findAllDeviceRelayByUserHandler);

export default deviceRelayRouter;
