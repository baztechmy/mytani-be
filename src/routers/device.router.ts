// CONTROLLERS
import { DeviceHandler } from '../controllers/device.controller';
import { DeviceRelayHandler } from '../controllers/device-relay.controller';
import { DeviceParamHandler } from '../controllers/device-param.controller';
import { DeviceDataHandler } from '../controllers/device-data.controller';

// MIDDLEWARES
import AccessControl from '../middlewares/access-control.middleware';
import Authorize from '../middlewares/authorization.middleware';

// MODULES
import { Router } from 'express';
import { DeviceRelayScheduleHandler } from '../controllers/device-relay-schedule.controller';

const deviceRouter = Router();
deviceRouter.use(Authorize.accesstoken);

// Devices
deviceRouter.route('/')
    .get(AccessControl.roles(), DeviceHandler.findAll);
deviceRouter.route('/:d_id')
    .get(AccessControl.deviceOwner(['admin', 'user']), DeviceHandler.find)
    .patch(AccessControl.deviceOwner(['admin']), DeviceHandler.update)
    .delete(AccessControl.deviceOwner(['admin']), DeviceHandler.remove);

// Device relays
deviceRouter.route('/:d_id/relays')
    .post(AccessControl.deviceOwner(['admin', 'user']), DeviceRelayHandler.createByDevice)
    .get(AccessControl.deviceOwner(['admin', 'user']), DeviceRelayHandler.findAllByDevice)
    .delete(AccessControl.deviceOwner(['admin', 'user']), DeviceRelayHandler.removeAllByDevice);
deviceRouter.route('/:d_id/relays/add')
    .post(AccessControl.deviceOwner(['admin', 'user']), DeviceRelayHandler.addByDevice);
deviceRouter.route('/:d_id/relays/:dr_id')
    .get(AccessControl.deviceRelayOwner(['admin', 'user']), DeviceRelayHandler.find)
    .patch(AccessControl.deviceRelayOwner(['admin', 'user']), DeviceRelayHandler.update)
    .delete(AccessControl.deviceRelayOwner(['admin', 'user']), DeviceRelayHandler.remove);

// Device relay schedules
deviceRouter.route('/:d_id/relays/:dr_id/schedules')
    .post(AccessControl.deviceRelayOwner(['admin', 'user']), DeviceRelayScheduleHandler.createByDeviceRelay)
    .get(AccessControl.deviceRelayOwner(['admin', 'user']), DeviceRelayScheduleHandler.findAllByDeviceRelay)
deviceRouter.route('/:d_id/relays/:dr_id/schedules/:drs_id')
    .get(AccessControl.deviceRelayOwner(['admin', 'user']), DeviceRelayScheduleHandler.find)
    .patch(AccessControl.deviceRelayOwner(['admin', 'user']), DeviceRelayScheduleHandler.update)
    .delete(AccessControl.deviceRelayOwner(['admin', 'user']), DeviceRelayScheduleHandler.remove)

// Device params
deviceRouter.route('/:d_id/params')
    .post(AccessControl.deviceOwner(['admin', 'user']), DeviceParamHandler.createByDevice)
    .get(AccessControl.deviceOwner(['admin', 'user']), DeviceParamHandler.findAllByDevice);
deviceRouter.route('/:d_id/params/:dp_id')
    .get(AccessControl.deviceOwner(['admin', 'user']), DeviceParamHandler.find)
    .patch(AccessControl.deviceOwner(['admin', 'user']), DeviceParamHandler.update)
    .delete(AccessControl.deviceOwner(['admin', 'user']), DeviceParamHandler.remove);

// Device data
deviceRouter.route('/:d_id/data')
    .post(AccessControl.deviceOwner(['admin', 'user']), DeviceDataHandler.createByDevice)
    .delete(AccessControl.deviceOwner(['admin', 'user']), DeviceDataHandler.removeByDevice);

export default deviceRouter;
