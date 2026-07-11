// CONFIGS
import { db, Device, DeviceControlParam } from "../configs/db.config";

// HELPERS
import Message from "../helpers/message.helper";

// MODULES
import Route from "@harrypoggers25/route";

// MIDDLEWARES
import { getPayload } from "../middlewares/authorization.middleware";

// SERVICES
import { createUserActivityLog } from "../services/user-activity-log.service";
import AccessControl from "../middlewares/access-control.middleware";
import { canControlHandler } from "../services/mqtt.service";

const dmp_units = ['°C', '°F', '%', 'pH', 'ppm', 'lux', 'm', 'cm', 'mm', 'L', 'mL', 'V', 'A', 'W', 'kWh', 'dS/m', 'µS/cm', 'kg', 'g'];
async function validateParamUnit(obj: any): Promise<string | undefined> {
    if (typeof obj !== 'string' || !dmp_units.includes(obj)) return undefined;
    return obj
}

export namespace DeviceControlParamHandler {
    export const createByDevice = Route.asyncHandler(async (req, res) => {
        const date = new Date();
        const d_id = +req.params.d_id;

        const { dcp_tag, dcp_name } = req.body;
        const dcp_unit = await validateParamUnit(req.body.dcp_unit);
        const [created_at, updated_at] = [date, date];
        const transaction = await db.transaction({ rollbackOnError: true });

        if (!dcp_unit) {
            res.status(400);
            throw new Error(Message.failed(['create', 'new device control param'], {
                subMessage: 'dcp_unit is invalid'
            }));
        }

        const deviceParam = await DeviceControlParam.create(
            { dcp_tag, dcp_name, dcp_unit, created_at, updated_at, d_id },
            { transaction }
        );
        if (!deviceParam) throw new Error(Message.failed(['create', 'new device control param', { d_id }]));

        if (!AccessControl.fromReq(req).device.can_control) {
            const device = await Device.updateByPk(d_id, { can_control: true }, { transaction });
            if (!device) throw new Error(Message.failed(['create', 'new device control param', { d_id }], {
                subMessage: 'Unable to toggle can_control on device'
            }));

            if (!(canControlHandler(device))) {
                await transaction.rollback();
                throw new Error(Message.failed(['create', 'new device control param', { d_id }], {
                    subMessage: 'Unable to subscribe to mqtt topic'
                }))
            }
        }

        const { dcp_id } = deviceParam;
        const ual = await createUserActivityLog({
            ual_type: 'DEVICE_CONTROL_PARAM_CREATE',
            ual_activity: Message.success(['create', 'new device control param', dcp_id]),
            user_id: getPayload(req).user_id
        }, transaction);
        if (!ual) throw new Error(Message.failed(['create', 'new device control param', { d_id }], {
            causer: ['create', 'new user activity log']
        }));

        await transaction.commit();
        res.status(201).json(deviceParam);
    });

    export const findAllByDevice = Route.asyncHandler(async (req, res) => {
        const d_id = +req.params.d_id;

        const deviceParams = await DeviceControlParam.find({ where: { d_id } });
        if (!deviceParams) throw new Error(Message.failed(['find', 'device control params', { d_id }]));

        res.status(200).json(deviceParams);
    });

    export const find = Route.asyncHandler(async (req, res) => {
        const d_id = +req.params.d_id;
        const dcp_id = +req.params.dcp_id;

        const deviceParam = await DeviceControlParam.findByPk(dcp_id, { where: { d_id } });
        if (!deviceParam) throw new Error(Message.failed(['find', 'device control param', dcp_id]));

        res.status(200).json(deviceParam);
    });

    export const update = Route.asyncHandler(async (req, res) => {
        const d_id = +req.params.d_id;
        const dcp_id = +req.params.dcp_id;

        const { dcp_tag, dcp_name } = req.body;
        const dcp_unit = await validateParamUnit(req.body.dcp_unit);
        const updated_at = new Date();
        const transaction = await db.transaction({ rollbackOnError: true });

        const deviceParam = await DeviceControlParam.updateByPk(dcp_id,
            { dcp_tag, dcp_name, dcp_unit, updated_at },
            { where: { d_id }, transaction }
        );
        if (!deviceParam) throw new Error(Message.failed(['update', 'device control param', dcp_id]));

        const ual = await createUserActivityLog({
            ual_type: 'DEVICE_CONTROL_PARAM_UPDATE',
            ual_activity: Message.success(['update', 'device control param', dcp_id]),
            user_id: getPayload(req).user_id
        }, transaction);
        if (!ual) throw new Error(Message.failed(['update', 'device control param', dcp_id], {
            causer: ['create', 'new user activity log']
        }));

        await transaction.commit();
        res.status(200).json(deviceParam);
    });

    export const removeAllByDevice = Route.asyncHandler(async (req, res) => {
        const d_id = +req.params.d_id;
        const transaction = await db.transaction({ rollbackOnError: true });

        const deviceParam = await DeviceControlParam.delete({ where: { d_id }, transaction });
        if (!deviceParam) throw new Error(Message.failed(['delete', 'device control params', { d_id }]));

        const device = await Device.updateByPk(d_id, { can_control: false }, { transaction });
        if (!device) throw new Error(Message.failed(['delete', 'device control params', { d_id }], {
            subMessage: 'Unable to toggle can_control on device'
        }));

        if (!(canControlHandler(device))) {
            await transaction.rollback();
            throw new Error(Message.failed(['delete', 'device control params', { d_id }], {
                subMessage: 'Unable to unsubscribe to mqtt topic'
            }))
        }

        const ual = await createUserActivityLog({
            ual_type: 'DEVICE_CONTROL_PARAM_DELETE',
            ual_activity: Message.success(['delete', 'device control params', { d_id }]),
            user_id: getPayload(req).user_id
        }, transaction);
        if (!ual) throw new Error(Message.failed(['delete', 'device control param', { d_id }], {
            causer: ['create', 'new user activity log']
        }));

        await transaction.commit();
        res.status(200).json(deviceParam);
    })

    export const remove = Route.asyncHandler(async (req, res) => {
        const d_id = +req.params.d_id;
        const dcp_id = +req.params.dcp_id;
        const transaction = await db.transaction({ rollbackOnError: true });

        const deviceParam = await DeviceControlParam.deleteByPk(dcp_id, { where: { d_id }, transaction });
        if (!deviceParam) throw new Error(Message.failed(['delete', 'device control param', dcp_id]));

        const deviceParams = await DeviceControlParam.find({ where: { d_id }, transaction });
        if (!deviceParams) throw new Error(Message.failed(['delete', 'device control param', dcp_id], {
            causer: ['find', 'remaining device relays']
        }));

        if (!deviceParams.length) {
            const device = await Device.updateByPk(d_id, { can_control: false }, { transaction });
            if (!device) throw new Error(Message.failed(['delete', 'device control param', dcp_id], {
                subMessage: 'Unable to toggle can_control on device'
            }));

            if (!(canControlHandler(device))) {
                await transaction.rollback();
                throw new Error(Message.failed(['delete', 'device control param', { d_id }], {
                    subMessage: 'Unable to unsubscribe to mqtt topic'
                }))
            }
        }

        const ual = await createUserActivityLog({
            ual_type: 'DEVICE_CONTROL_PARAM_DELETE',
            ual_activity: Message.success(['delete', 'device control param', dcp_id]),
            user_id: getPayload(req).user_id
        }, transaction);
        if (!ual) throw new Error(Message.failed(['delete', 'device control param', dcp_id], {
            causer: ['create', 'new user activity log']
        }));

        await transaction.commit();
        res.status(200).json(deviceParam);
    });
}

