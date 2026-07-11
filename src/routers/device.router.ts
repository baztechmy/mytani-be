// CONTROLLERS
import { DeviceHandler } from '../controllers/device.controller';
import { DeviceRelayHandler } from '../controllers/device-relay.controller';
import { DeviceRelayScheduleHandler } from '../controllers/device-relay-schedule.controller';
import { DeviceMonitorParamHandler } from '../controllers/device-monitor-param.controller';
import { DeviceControlParamHandler } from '../controllers/device-control-param.controller';
import { DeviceDataHandler } from '../controllers/device-data.controller';

// MIDDLEWARES
import AC from '../middlewares/access-control.middleware';
import Authorize from '../middlewares/authorization.middleware';

// MODULES
import { Router } from 'express';

const deviceRouter = Router();
deviceRouter.use(Authorize.accesstoken);

// Devices
deviceRouter.route('/')
    .get(AC.roles(), DeviceHandler.findAll);
deviceRouter.route('/:d_id')
    .get(AC.deviceOwner(['admin', 'user']), DeviceHandler.find)
    .patch(AC.deviceOwner(['admin']), DeviceHandler.update)
    .delete(AC.deviceOwner(['admin']), DeviceHandler.remove);

// Device relays
deviceRouter.route('/:d_id/relays')
    .post(AC.deviceOwner(['admin', 'user']), DeviceRelayHandler.createByDevice)
    .get(AC.deviceOwner(['admin', 'user']), DeviceRelayHandler.findAllByDevice)
    .delete(AC.deviceOwner(['admin', 'user']), DeviceRelayHandler.removeAllByDevice);
deviceRouter.route('/:d_id/relays/add')
    .post(AC.deviceOwner(['admin', 'user']), DeviceRelayHandler.addByDevice);
deviceRouter.route('/:d_id/relays/control')
    .post(AC.deviceOwner(['admin', 'user']), DeviceRelayHandler.controlAllByDevice);
deviceRouter.route('/:d_id/relays/:dr_id')
    .get(AC.deviceRelayOwner(['admin', 'user']), DeviceRelayHandler.find)
    .patch(AC.deviceRelayOwner(['admin', 'user']), DeviceRelayHandler.update)
    .delete(AC.deviceRelayOwner(['admin', 'user']), DeviceRelayHandler.remove);
deviceRouter.route('/:d_id/relays/:dr_id/control')
    .post(AC.deviceOwner(['admin', 'user']), DeviceRelayHandler.control);

// Device relay schedules
deviceRouter.route('/:d_id/relays/:dr_id/schedules')
    .post(AC.deviceRelayOwner(['admin', 'user']), DeviceRelayScheduleHandler.createByDeviceRelay)
    .get(AC.deviceRelayOwner(['admin', 'user']), DeviceRelayScheduleHandler.findAllByDeviceRelay)
deviceRouter.route('/:d_id/relays/:dr_id/schedules/:drs_id')
    .get(AC.deviceRelayOwner(['admin', 'user']), DeviceRelayScheduleHandler.find)
    .patch(AC.deviceRelayOwner(['admin', 'user']), DeviceRelayScheduleHandler.update)
    .delete(AC.deviceRelayOwner(['admin', 'user']), DeviceRelayScheduleHandler.remove)

// Device monitor params
deviceRouter.route('/:d_id/params/monitor')
    .post(AC.deviceOwner(['admin', 'user']), DeviceMonitorParamHandler.createByDevice)
    .get(AC.deviceOwner(['admin', 'user']), DeviceMonitorParamHandler.findAllByDevice);
deviceRouter.route('/:d_id/params/monitor/:dmp_id')
    .get(AC.deviceOwner(['admin', 'user']), DeviceMonitorParamHandler.find)
    .patch(AC.deviceOwner(['admin', 'user']), DeviceMonitorParamHandler.update)
    .delete(AC.deviceOwner(['admin', 'user']), DeviceMonitorParamHandler.remove);

// Device control params
deviceRouter.route('/:d_id/params/control')
    .post(AC.deviceOwner(['admin', 'user']), DeviceControlParamHandler.createByDevice)
    .get(AC.deviceOwner(['admin', 'user']), DeviceControlParamHandler.findAllByDevice);
deviceRouter.route('/:d_id/params/control/:dcp_id')
    .get(AC.deviceOwner(['admin', 'user']), DeviceControlParamHandler.find)
    .patch(AC.deviceOwner(['admin', 'user']), DeviceControlParamHandler.update)
    .delete(AC.deviceOwner(['admin', 'user']), DeviceControlParamHandler.remove);

// Device control
deviceRouter.route(':/d_id/control')
    .post(AC.deviceOwner(['admin', 'user']), DeviceHandler.control);

// Device data
deviceRouter.route('/:d_id/data')
    .post(AC.deviceOwner(['admin', 'user']), DeviceDataHandler.createByDevice)
    .get(AC.deviceOwner(['admin', 'user']), DeviceDataHandler.findAllByDevice)
    .delete(AC.deviceOwner(['admin', 'user']), DeviceDataHandler.removeByDevice);

export default deviceRouter;
