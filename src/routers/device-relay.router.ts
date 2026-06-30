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
    .post(AccessControl.rolesOrDeviceOwner(['admin']), createDeviceRelayHandler)
    .get(AccessControl.rolesOrDeviceOwner(['admin']), findDeviceRelayHandler)
    .patch(AccessControl.rolesOrDeviceOwner(['admin']), updateDeviceRelayHandler)
    .delete(AccessControl.rolesOrDeviceOwner(['admin']), deleteDeviceRelayHandler);
deviceRelayRouter.route('/users/:user_id')
    .get(AccessControl.rolesOrAccountOwner(['admin']), findAllDeviceRelayByUserHandler);

export default deviceRelayRouter;
