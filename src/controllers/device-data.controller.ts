// CONFIGS
import { db, createDeviceData, Device, DeviceDatas } from "../configs/db.config";

// HELPERS
import { stringifyJson } from "../helpers/json.helper";

// MODULES
import Route from "@harrypoggers25/route";

// MIDDLEWARES
import { getPayload } from "../middlewares/authorization.middleware";

// SERVICES
import { createUserActivityLog } from "../services/user-activity-log.service";

export const createDeviceDataHandler = Route.asyncHandler(async (req, res) => {
    const d_id = +req.params.d_id;
    const transaction = await db.transaction({ rollbackOnError: true });

    if (DeviceDatas[d_id]) throw new Error(`Failed to create device data instance ${stringifyJson({ d_id })}. Device already has an existing device data instance`);

    const DeviceData = createDeviceData(d_id);
    await DeviceData.sync({ alter: true, transaction });

    const device = await Device.updateByPk(d_id, { can_monitor: true }, { transaction });
    if (!device) throw new Error(`Failed to create device data instance ${stringifyJson({ d_id })}. Unable to update device`);

    const ual = await createUserActivityLog(
        { ual_type: 'DEVICE_CREATE', ual_activity: `Created new device data instance with d_id = '${device.d_id}'`, user_id: getPayload(req).user_id },
        transaction
    );
    if (!ual) throw new Error(`Failed to device data instance ${stringifyJson({ d_id })}. Unable to create new user activity log`);

    await transaction.commit();
    res.status(201).json({ message: `Sucessfully created table '${DeviceData.tableName}'` });
});

export const findDeviceDataHandler = Route.asyncHandler(async (req, res) => {
    const d_id = +req.params.d_id;

    const deviceData = await DeviceDatas[d_id].find({});
    if (!deviceData) throw new Error(`Failed to find device [${d_id}]`);

    deviceData[0].dd_id;

    res.status(200).json(deviceData);
});

export const deleteDeviceDataHandler = Route.asyncHandler(async (req, res) => {
    const d_id = +req.params.d_id;
    const transaction = await db.transaction({ rollbackOnError: true });

    if (!DeviceDatas[d_id]) throw new Error(`Failed to delete device data instance ${stringifyJson({ d_id })}. Device data doesn't have an instance`);

    const dropTable = await db.dropTable(DeviceDatas[d_id].tableName, { transaction });
    if (!dropTable) throw new Error(`Failed to delete device data instance ${stringifyJson({ d_id })}`);

    const device = await Device.updateByPk(d_id, { can_monitor: false }, { transaction });
    if (!device) throw new Error(`Failed to delete device data instance ${stringifyJson({ d_id })}. Unable to update device`);

    const ual = await createUserActivityLog(
        { ual_type: 'DEVICE_DELETE', ual_activity: `Deleted device with d_id = '${d_id}'`, user_id: getPayload(req).user_id },
        transaction
    );
    if (!ual) throw new Error(`Failed to delete device data instance ${stringifyJson({ d_id })}. Unable to create new user activity log`);

    await transaction.commit();
    res.status(200).json(device);
});
