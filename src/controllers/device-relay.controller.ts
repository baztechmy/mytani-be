// CONFIGS
import { db, Device, DeviceRelay } from "../configs/db.config";

// HELPERS
import { isArrayObj, stringifyJson } from "../helpers/json.helper";

// MODULES
import Route from "@harrypoggers25/route";

// MIDDLEWARES
import { getPayload } from "../middlewares/authorization.middleware";

// SERVICES
import { createUserActivityLog } from "../services/user-activity-log.service";
import { Pool } from "@harrypoggers25/db-postgresql";

export const createDeviceRelayHandler = Route.asyncHandler(async (req, res) => {
    const d_id = +req.params.d_id;
    const { count } = req.body;
    let { relay_names, relay_vals } = req.body;
    const transaction = await db.transaction({ rollbackOnError: true });

    const device = await Device.findByPk(d_id);
    if (!device) throw new Error(`Failed to create new device relay. Unable to find device [${d_id}]`);
    if (!device.can_control) throw new Error(`Failed to create new device relay. can_control is set to false for device [${d_id}]`);

    if (typeof count !== 'number') throw new Error(`Failed to create new device relay. count must be a number`);

    if (!relay_names || !isArrayObj(relay_names, 'string')) throw new Error(`Failed to create new device relay. relay_names must be an array of strings`);
    if (relay_names.length !== count) throw new Error(`Failed to create new device relay. relay_names count must be ${count}`)
    relay_names = stringifyJson(relay_names);

    if (!relay_vals || !isArrayObj(relay_vals, 'number')) throw new Error(`Failed to create new device relay. relay_vals must be an array of numbers`);
    if (relay_vals.length !== count) throw new Error(`Failed to create new device relay. relay_vals count must be ${count}`)
    relay_vals = stringifyJson(relay_vals.map(val => val > 0 ? 1 : 0));

    const deviceRelay = await DeviceRelay.create({ relay_names, relay_vals, count, d_id }, { transaction });
    if (!deviceRelay) throw new Error('Failed to create new device relay');

    const ual = await createUserActivityLog(
        { ual_type: 'DEVICE_RELAY_CREATE', ual_activity: `Created new device relay with d_id = '${deviceRelay.d_id}'`, user_id: getPayload(req).user_id },
        transaction
    );
    if (!ual) throw new Error('Failed to create device relay. Unable to create new user activity log');

    await transaction.commit();
    res.status(201).json(deviceRelay);
});

export const findAllDeviceRelayHandler = Route.asyncHandler(async (_, res) => {
    const deviceRelays = await DeviceRelay.find();
    if (!deviceRelays) throw new Error('Failed to find all device relays');

    res.status(200).json(deviceRelays);
});

export const findDeviceRelayHandler = Route.asyncHandler(async (req, res) => {
    const d_id = +req.params.d_id;
    const deviceRelay = await DeviceRelay.find({ where: { d_id } });
    if (!deviceRelay || !deviceRelay.length) throw new Error(`Failed to find device relay  ${stringifyJson({ d_id })}`);

    res.status(200).json(deviceRelay[0]);
});

export const findAllDeviceRelayByUserHandler = Route.asyncHandler(async (req, res) => {
    const user_id = +req.params.user_id;
    const query =
        `SELECT * FROM ${DeviceRelay.tableName} dr ` +
        `INNER JOIN ${Device.tableName} d ` +
        'ON dr.d_id = d.d_id ' +
        'WHERE d.user_id = $1;'
    const response = await db.pool.query(query, { values: [user_id] });
    if (!Pool.isSuccess(response)) throw new Error(`Failed to find all device relay by user ${stringifyJson({ user_id })}`);

    res.status(200).json(response.rows);
});

export const updateDeviceRelayHandler = Route.asyncHandler(async (req, res) => {
    const d_id = +req.params.d_id;
    let { relay_names, relay_vals } = req.body;
    const transaction = await db.transaction({ rollbackOnError: true });

    const oldDeviceRelay = await DeviceRelay.find({ where: { d_id } });
    if ((!oldDeviceRelay || !oldDeviceRelay.length) && !req.body.count) throw new Error(`Failed to update device relay ${stringifyJson({ d_id })}. Unable to retrieve relay count`);

    const count = req.body.count ?? oldDeviceRelay?.[0].count;

    if (relay_names) {
        if (!isArrayObj(relay_names, 'string')) throw new Error(`Failed to update device relay ${stringifyJson({ d_id })}. relay_names must be an array of strings`);
        if (relay_names.length !== count) throw new Error(`Failed to update device relay ${stringifyJson({ d_id })}. relay_names count must be ${count}`)
        relay_names = stringifyJson(relay_names);
    }

    if (relay_vals) {
        if (!isArrayObj(relay_vals, 'number')) throw new Error(`Failed to update device relay ${stringifyJson({ d_id })}. relay_vals must be an array of numbers`);
        if (relay_vals.length !== count) throw new Error(`Failed to update device relay. relay_vals count must be ${count}`)
        relay_vals = stringifyJson(relay_vals.map(val => val > 0 ? 1 : 0));
    }

    const deviceRelay = await DeviceRelay.update(
        { relay_names, relay_vals, count },
        { where: { d_id }, transaction }
    );
    if (!deviceRelay) throw new Error(`Failed to update device relay ${stringifyJson({ d_id })}`);

    const ual = await createUserActivityLog(
        { ual_type: 'DEVICE_RELAY_UPDATE', ual_activity: `Updated device relay with d_id = '${d_id}'`, user_id: getPayload(req).user_id },
        transaction
    );
    if (!ual) throw new Error(`Failed to update device relay ${stringifyJson({ d_id })}. Unable to create new user activity log`);

    await transaction.commit();
    res.status(200).json(deviceRelay);
});

export const deleteDeviceRelayHandler = Route.asyncHandler(async (req, res) => {
    const d_id = +req.params.d_id;
    const transaction = await db.transaction({ rollbackOnError: true });

    const deviceRelay = await DeviceRelay.delete({ where: { d_id }, transaction });
    if (!deviceRelay) throw new Error(`Failed to delete device relay ${stringifyJson({ d_id })}`);

    const ual = await createUserActivityLog(
        { ual_type: 'DEVICE_RELAY_DELETE', ual_activity: `Deleted device with d_id = '${d_id}'`, user_id: getPayload(req).user_id },
        transaction
    );
    if (!ual) throw new Error(`Failed to delete device relay ${stringifyJson({ d_id })}. Unable to create new user activity log`);

    await transaction.commit();
    res.status(200).json(deviceRelay);
});
