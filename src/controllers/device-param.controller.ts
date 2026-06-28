// CONFIGS
import { db, Device, DeviceParam } from "../configs/db.config";

// HELPERS
import { stringifyJson } from "../helpers/json.helper";

// MODULES
import Route from "@harrypoggers25/route";

// MIDDLEWARES
import { getPayload } from "../middlewares/authorization.middleware";

// SERVICES
import { createUserActivityLog } from "../services/user-activity-log.service";
import { Pool } from "@harrypoggers25/db-postgresql";

export const createDeviceParamHandler = Route.asyncHandler(async (req, res) => {
    const date = new Date();

    const { dp_did, dp_name, dp_target } = req.body;
    const [created_at, updated_at] = [date, date];
    const d_id = +req.params.d_id;
    const transaction = await db.transaction({ rollbackOnError: true });

    const device = await Device.findByPk(d_id);
    if (!device) throw new Error(`Failed to create new device param. Unable to find device [${d_id}]`);

    const deviceParam = await DeviceParam.create({ dp_did, dp_name, dp_target, created_at, updated_at, d_id }, { transaction });
    if (!deviceParam) throw new Error('Failed to create new device param');

    const ual = await createUserActivityLog(
        { ual_type: 'DEVICE_PARAM_CREATE', ual_activity: `Created new device param with dp_id = '${deviceParam.dp_id}'`, user_id: getPayload(req).user_id },
        transaction
    );
    if (!ual) throw new Error('Failed to create device param. Unable to create new user activity log');

    await transaction.commit();
    res.status(201).json(deviceParam);
});

export const findAllDeviceParamHandler = Route.asyncHandler(async (_, res) => {
    const deviceParams = await DeviceParam.find({ orderBy: { d_id: 'ASC', dp_id: 'ASC' } });
    if (!deviceParams) throw new Error('Failed to find all device params');

    res.status(200).json(deviceParams);
});

export const findDeviceParamHandler = Route.asyncHandler(async (req, res) => {
    const dp_id = +req.params.dp_id;
    const deviceParam = await DeviceParam.findByPk(dp_id);
    if (!deviceParam) throw new Error(`Failed to find device param  [${dp_id}]`);

    res.status(200).json(deviceParam);
});

export const findAllDeviceParamByDeviceHandler = Route.asyncHandler(async (req, res) => {
    const d_id = +req.params.d_id;
    const deviceParam = await DeviceParam.find({ where: { d_id } });
    if (!deviceParam) throw new Error(`Failed to find device params  ${stringifyJson({ d_id })}`);

    res.status(200).json(deviceParam);
});

export const findAllDeviceParamByUserHandler = Route.asyncHandler(async (req, res) => {
    const user_id = +req.params.user_id;
    const query =
        `SELECT dp_id, dp_did, dp_name, dp_target, created_at, updated_at, d.d_id FROM ${DeviceParam.tableName} dr ` +
        `INNER JOIN ${Device.tableName} d ` +
        'ON dr.d_id = d.d_id ' +
        'WHERE d.user_id = $1;'
    const response = await db.pool.query(query, { values: [user_id] });
    if (!Pool.isSuccess(response)) throw new Error(`Failed to find all user device param ${stringifyJson({ user_id })}`);

    const deviceParams: Record<number, Array<any>> = {};
    for (const row of response.rows) {
        const d_id = row.d_id;
        if (!deviceParams[d_id]) deviceParams[d_id] = [];
        deviceParams[d_id].push(row);
    }

    res.status(200).json(Object.entries(deviceParams).map(param => param[1]));
});

export const updateDeviceParamHandler = Route.asyncHandler(async (req, res) => {
    const dp_id = +req.params.dp_id;
    const { dp_did, dp_name, dp_target, d_id } = req.body;
    const updated_at = new Date();
    const transaction = await db.transaction({ rollbackOnError: true });

    const deviceParam = await DeviceParam.updateByPk(dp_id,
        { dp_did, dp_name, dp_target, updated_at, d_id },
        { transaction }
    );
    if (!deviceParam) throw new Error(`Failed to update device param [${dp_id}]`);

    const ual = await createUserActivityLog(
        { ual_type: 'DEVICE_PARAM_UPDATE', ual_activity: `Updated device param with dp_id = '${dp_id}'`, user_id: getPayload(req).user_id },
        transaction
    );
    if (!ual) throw new Error(`Failed to update device param [${dp_id}]. Unable to create new user activity log`);

    await transaction.commit();
    res.status(200).json(deviceParam);
});

export const deleteDeviceParamHandler = Route.asyncHandler(async (req, res) => {
    const dp_id = +req.params.dp_id;
    const transaction = await db.transaction({ rollbackOnError: true });

    const deviceParam = await DeviceParam.deleteByPk(dp_id, { transaction });
    if (!deviceParam) throw new Error(`Failed to delete device param [${dp_id}]`);

    const ual = await createUserActivityLog(
        { ual_type: 'DEVICE_PARAM_DELETE', ual_activity: `Deleted device with dp_id = '${dp_id}'`, user_id: getPayload(req).user_id },
        transaction
    );
    if (!ual) throw new Error(`Failed to delete device param [${dp_id}]. Unable to create new user activity log`);

    await transaction.commit();
    res.status(200).json(deviceParam);
});
