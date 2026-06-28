// CONFIGS
import { db, Device } from "../configs/db.config";

// HELPERS
import { stringifyJson } from "../helpers/json.helper";

// MODULES
import Route from "@harrypoggers25/route";

// MIDDLEWARES
import { getPayload } from "../middlewares/authorization.middleware";

// SERVICES
import { createUserActivityLog } from "../services/user-activity-log.service";

export const createDeviceHandler = Route.asyncHandler(async (req, res) => {
    const { d_id, d_did, d_name, can_monitor, can_control, user_id = getPayload(req).user_id } = req.body;
    const transaction = await db.transaction({ rollbackOnError: true });

    const device = await Device.create({ d_id, d_did, d_name, can_monitor, can_control, user_id }, { transaction });
    if (!device) throw new Error('Failed to create device');

    const ual = await createUserActivityLog(
        { ual_type: 'DEVICE_CREATE', ual_activity: `Created new device with d_id = '${device.d_id}'`, user_id: getPayload(req).user_id },
        transaction
    );
    if (!ual) throw new Error('Failed to create device. Unable to create new user activity log');

    await transaction.commit();
    res.status(201).json(device);
});

export const findAllDeviceHandler = Route.asyncHandler(async (_, res) => {
    const devices = await Device.find();
    if (!devices) throw new Error('Failed to find all devices');

    res.status(200).json(devices);
});

export const findDeviceHandler = Route.asyncHandler(async (req, res) => {
    const d_id = +req.params.d_id;
    const device = await Device.findByPk(+d_id);
    if (!device) throw new Error(`Failed to find device [${d_id}]`);

    res.status(200).json(device);
});

export const findAllDeviceByUserHandler = Route.asyncHandler(async (req, res) => {
    const user_id = +req.params.user_id;
    const device = await Device.find({ where: { user_id } });
    if (!device) throw new Error(`Failed to find devices by user ${stringifyJson({ user_id })}`);

    res.status(200).json(device);
});

export const updateDeviceHandler = Route.asyncHandler(async (req, res) => {
    const d_id = +req.params.d_id;
    const { d_did, d_name, can_monitor, can_control } = req.body;
    const transaction = await db.transaction({ rollbackOnError: true });

    const device = await Device.updateByPk(d_id,
        { d_did, d_name, can_monitor, can_control },
        { transaction }
    );
    if (!device) throw new Error('Failed to update device');

    const ual = await createUserActivityLog(
        { ual_type: 'DEVICE_UPDATE', ual_activity: `Updated device with d_id = '${d_id}'`, user_id: getPayload(req).user_id },
        transaction
    );
    if (!ual) throw new Error('Failed to update device. Unable to create new user activity log');

    await transaction.commit();
    res.status(200).json(device);
});

export const deleteDeviceHandler = Route.asyncHandler(async (req, res) => {
    const d_id = +req.params.d_id;
    const transaction = await db.transaction({ rollbackOnError: true });

    const device = await Device.deleteByPk(d_id, { transaction });
    if (!device) throw new Error('Failed to delete device');

    const ual = await createUserActivityLog(
        { ual_type: 'DEVICE_DELETE', ual_activity: `Deleted device with d_id = '${d_id}'`, user_id: getPayload(req).user_id },
        transaction
    );
    if (!ual) throw new Error('Failed to delete device. Unable to create new user activity log');

    await transaction.commit();
    res.status(200).json(device);
});
