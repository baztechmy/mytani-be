// CONTROLLERS
import { DeviceHandler } from '../controllers/device.controller';
import { DeviceRelayHandler } from '../controllers/device-relay.controller';
// import { findAllDeviceParamByDeviceHandler } from '../controllers/device-param.controller';

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

deviceRouter.route('/:d_id/relays')
    .post(AccessControl.deviceOwner(['admin', 'user']), DeviceRelayHandler.createByDevice)
    .get(AccessControl.deviceOwner(['admin', 'user']), DeviceRelayHandler.findAllByDevice)
    .delete(AccessControl.deviceOwner(['admin', 'user']), DeviceRelayHandler.removeAllByDevice)
deviceRouter.route('/:d_id/relays/add')
    .post(AccessControl.deviceOwner(['admin', 'user']), DeviceRelayHandler.addByDevice);
deviceRouter.route('/:d_id/relays/:dr_id')
    .get(AccessControl.deviceOwner(['admin', 'user']), DeviceRelayHandler.find)
    .patch(AccessControl.deviceOwner(['admin', 'user']), DeviceRelayHandler.update)
    .delete(AccessControl.deviceOwner(['admin', 'user']), DeviceRelayHandler.remove)
// deviceRouter.route('/:d_id/device-params')
// .get(AccessControl.deviceOwner(['admin', 'user']), findAllDeviceParamByDeviceHandler);

export default deviceRouter;
