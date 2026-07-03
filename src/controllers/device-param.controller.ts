// CONFIGS
import { db, DeviceParam } from "../configs/db.config";

// HELPERS
import Message from "../helpers/message.helper";

// MODULES
import Route from "@harrypoggers25/route";

// MIDDLEWARES
import { getPayload } from "../middlewares/authorization.middleware";

// SERVICES
import { createUserActivityLog } from "../services/user-activity-log.service";

const dp_units = ['°C', '°F', '%', 'pH', 'ppm', 'lux', 'm', 'cm', 'mm', 'L', 'mL', 'V', 'A', 'W', 'kWh', 'dS/m', 'µS/cm', 'kg', 'g'];
function validateParamUnit(obj: any): string | undefined {
    if (typeof obj !== 'string' || !dp_units.includes(obj)) return undefined;
    return obj
}

export namespace DeviceParamHandler {
    export const createByDevice = Route.asyncHandler(async (req, res) => {
        const date = new Date();
        const d_id = +req.params.d_id;

        const { dp_did, dp_name } = req.body;
        const dp_unit = validateParamUnit(req.body.dp_unit);
        const { dp_target } = req.body; // optional
        const [created_at, updated_at] = [date, date];
        const transaction = await db.transaction({ rollbackOnError: true });

        if (!dp_units) {
            res.status(400);
            throw new Error(Message.failed(['create', 'new device param'], {
                subMessage: 'dp_unit is invalid'
            }));
        }

        const deviceParam = await DeviceParam.create({ dp_did, dp_name, dp_unit, dp_target, created_at, updated_at, d_id }, { transaction });
        if (!deviceParam) throw new Error(Message.failed(['create', 'new device param', { d_id }]));

        const { dp_id } = deviceParam;
        const ual = await createUserActivityLog({
            ual_type: 'DEVICE_PARAM_CREATE',
            ual_activity: Message.success(['create', 'new device param', dp_id]),
            user_id: getPayload(req).user_id
        }, transaction);
        if (!ual) throw new Error(Message.failed(['create', 'new device param', { d_id }], {
            causer: ['create', 'new user activity log']
        }));

        await transaction.commit();
        res.status(201).json(deviceParam);
    });

    export const find = Route.asyncHandler(async (req, res) => {
        const d_id = +req.params.d_id;
        const dp_id = +req.params.dp_id;

        const deviceParam = await DeviceParam.findByPk(dp_id, { where: { d_id } });
        if (!deviceParam) throw new Error(Message.failed(['find', 'device param', dp_id]));

        res.status(200).json(deviceParam);
    });

    export const findAllByDevice = Route.asyncHandler(async (req, res) => {
        const d_id = +req.params.d_id;

        const deviceParams = await DeviceParam.find({ where: { d_id } });
        if (!deviceParams) throw new Error(Message.failed(['find', 'device params', { d_id }]));

        res.status(200).json(deviceParams);
    });

    export const update = Route.asyncHandler(async (req, res) => {
        const d_id = +req.params.d_id;
        const dp_id = +req.params.dp_id;

        const { dp_did, dp_name, dp_target } = req.body;
        const dp_unit = validateParamUnit(req.body.dp_unit);
        const updated_at = new Date();
        const transaction = await db.transaction({ rollbackOnError: true });

        const deviceParam = await DeviceParam.updateByPk(dp_id,
            { dp_did, dp_name, dp_unit, dp_target, updated_at },
            { where: { d_id }, transaction }
        );
        if (!deviceParam) throw new Error(Message.failed(['update', 'device param', dp_id]));

        const ual = await createUserActivityLog({
            ual_type: 'DEVICE_PARAM_UPDATE',
            ual_activity: Message.success(['update', 'device param', dp_id]),
            user_id: getPayload(req).user_id
        }, transaction);
        if (!ual) throw new Error(Message.failed(['update', 'device param', dp_id], {
            causer: ['create', 'new user activity log']
        }));

        await transaction.commit();
        res.status(200).json(deviceParam);
    });

    export const remove = Route.asyncHandler(async (req, res) => {
        const d_id = +req.params.d_id;
        const dp_id = +req.params.dp_id;
        const transaction = await db.transaction({ rollbackOnError: true });

        const deviceParam = await DeviceParam.deleteByPk(dp_id, { where: { d_id }, transaction });
        if (!deviceParam) throw new Error(Message.failed(['delete', 'device param', dp_id]));

        const ual = await createUserActivityLog({
            ual_type: 'DEVICE_PARAM_DELETE',
            ual_activity: Message.success(['delete', 'device', dp_id]),
            user_id: getPayload(req).user_id
        }, transaction);
        if (!ual) throw new Error(Message.failed(['delete', 'device param', dp_id], {
            causer: ['create', 'new user activity log']
        }));

        await transaction.commit();
        res.status(200).json(deviceParam);
    });
}

