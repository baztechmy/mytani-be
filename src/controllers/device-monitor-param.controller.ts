// CONFIGS
import { db, DeviceMonitorParam } from "../configs/db.config";

// HELPERS
import Message from "../helpers/message.helper";

// MODULES
import Route from "@harrypoggers25/route";

// MIDDLEWARES
import { getPayload } from "../middlewares/authorization.middleware";

// SERVICES
import { createUserActivityLog } from "../services/user-activity-log.service";

const dmp_units = ['°C', '°F', '%', 'pH', 'ppm', 'lux', 'm', 'cm', 'mm', 'L', 'mL', 'V', 'A', 'W', 'kWh', 'dS/m', 'µS/cm', 'kg', 'g'];
async function validateParamUnit(obj: any): Promise<string | undefined> {
    if (typeof obj !== 'string' || !dmp_units.includes(obj)) return undefined;
    return obj
}

export namespace DeviceMonitorParamHandler {
    export const createByDevice = Route.asyncHandler(async (req, res) => {
        const date = new Date();
        const d_id = +req.params.d_id;

        const { dmp_tag, dmp_name } = req.body;
        const dmp_unit = await validateParamUnit(req.body.dmp_unit);
        const { dmp_target } = req.body; // optional
        const [created_at, updated_at] = [date, date];
        const transaction = await db.transaction({ rollbackOnError: true });

        if (!dmp_unit) {
            res.status(400);
            throw new Error(Message.failed(['create', 'new device monitor param'], {
                subMessage: 'dmp_unit is invalid'
            }));
        }

        const deviceParam = await DeviceMonitorParam.create(
            { dmp_tag, dmp_name, dmp_unit, dmp_target, created_at, updated_at, d_id },
            { transaction }
        );
        if (!deviceParam) throw new Error(Message.failed(['create', 'new device monitor param', { d_id }]));

        const { dmp_id } = deviceParam;
        const ual = await createUserActivityLog({
            ual_type: 'DEVICE_MONITOR_PARAM_CREATE',
            ual_activity: Message.success(['create', 'new device monitor param', dmp_id]),
            user_id: getPayload(req).user_id
        }, transaction);
        if (!ual) throw new Error(Message.failed(['create', 'new device monitor param', { d_id }], {
            causer: ['create', 'new user activity log']
        }));

        await transaction.commit();
        res.status(201).json(deviceParam);
    });

    export const find = Route.asyncHandler(async (req, res) => {
        const d_id = +req.params.d_id;
        const dmp_id = +req.params.dmp_id;

        const deviceParam = await DeviceMonitorParam.findByPk(dmp_id, { where: { d_id } });
        if (!deviceParam) throw new Error(Message.failed(['find', 'device monitor param', dmp_id]));

        res.status(200).json(deviceParam);
    });

    export const findAllByDevice = Route.asyncHandler(async (req, res) => {
        const d_id = +req.params.d_id;

        const deviceParams = await DeviceMonitorParam.find({ where: { d_id } });
        if (!deviceParams) throw new Error(Message.failed(['find', 'device monitor params', { d_id }]));

        res.status(200).json(deviceParams);
    });

    export const update = Route.asyncHandler(async (req, res) => {
        const d_id = +req.params.d_id;
        const dmp_id = +req.params.dmp_id;

        const { dmp_tag, dmp_name, dmp_target } = req.body;
        const dmp_unit = await validateParamUnit(req.body.dmp_unit);
        const updated_at = new Date();
        const transaction = await db.transaction({ rollbackOnError: true });

        const deviceParam = await DeviceMonitorParam.updateByPk(dmp_id,
            { dmp_tag, dmp_name, dmp_unit, dmp_target, updated_at },
            { where: { d_id }, transaction }
        );
        if (!deviceParam) throw new Error(Message.failed(['update', 'device monitor param', dmp_id]));

        const ual = await createUserActivityLog({
            ual_type: 'DEVICE_MONITOR_PARAM_UPDATE',
            ual_activity: Message.success(['update', 'device monitor param', dmp_id]),
            user_id: getPayload(req).user_id
        }, transaction);
        if (!ual) throw new Error(Message.failed(['update', 'device monitor param', dmp_id], {
            causer: ['create', 'new user activity log']
        }));

        await transaction.commit();
        res.status(200).json(deviceParam);
    });

    export const remove = Route.asyncHandler(async (req, res) => {
        const d_id = +req.params.d_id;
        const dmp_id = +req.params.dmp_id;
        const transaction = await db.transaction({ rollbackOnError: true });

        const deviceParam = await DeviceMonitorParam.deleteByPk(dmp_id, { where: { d_id }, transaction });
        if (!deviceParam) throw new Error(Message.failed(['delete', 'device monitor param', dmp_id]));

        const ual = await createUserActivityLog({
            ual_type: 'DEVICE_MONITOR_PARAM_DELETE',
            ual_activity: Message.success(['delete', 'device', dmp_id]),
            user_id: getPayload(req).user_id
        }, transaction);
        if (!ual) throw new Error(Message.failed(['delete', 'device monitor param', dmp_id], {
            causer: ['create', 'new user activity log']
        }));

        await transaction.commit();
        res.status(200).json(deviceParam);
    });
}

