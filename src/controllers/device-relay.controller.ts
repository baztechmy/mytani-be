// CONFIGS
import { db, Device, DeviceRelay } from "../configs/db.config";

// HELPERS
import Message from "../helpers/message.helper";
import { isArrayObj } from "../helpers/json.helper";

// MODULES
import Route from "@harrypoggers25/route";

// MIDDLEWARES
import { getPayload } from "../middlewares/authorization.middleware";

// SERVICES
import { createUserActivityLog } from "../services/user-activity-log.service";

export namespace DeviceRelayHandler {
    export const createByDevice = Route.asyncHandler(async (req, res) => {
        const date = new Date();

        const d_id = +req.params.d_id;
        const { dr_names } = req.body;
        const [created_at, updated_at] = [date, date];
        const transaction = await db.transaction({ rollbackOnError: true });

        if (!isArrayObj<string>(dr_names, 'string')) throw new Error(Message.failed(['create', 'new device relays', { d_id }], {
            subMessage: 'dr_names must be an array of strings'
        }));

        const oldDeviceRelays = await DeviceRelay.delete({ where: { d_id }, transaction });
        if (!oldDeviceRelays) throw new Error(Message.failed(['create', 'new device relays', { d_id }], {
            causer: ['delete', 'old device relays', { d_id }],
        }));

        const deviceRelays: Array<ReturnType<typeof DeviceRelay.getEmptyModel>> = [];
        for (const dr_name of dr_names) {
            const deviceRelay = await DeviceRelay.create({ dr_name, created_at, updated_at, d_id }, {
                transaction
            });
            if (!deviceRelay) throw new Error(Message.failed(['create', 'new device relays', { d_id }], {
                causer: ['add', 'device relay', { dr_name }],
            }));
            deviceRelays.push(deviceRelay);
        }

        const device = await Device.updateByPk(d_id, { can_control: true }, { transaction });
        if (!device) throw new Error(Message.failed(['create', 'new device relay', { d_id }], {
            causer: ['update', 'device']
        }));

        const ual = await createUserActivityLog({
            ual_type: 'DEVICE_RELAYS_CREATE',
            ual_activity: Message.success(['create', 'new device relay', { d_id }]),
            user_id: getPayload(req).user_id
        }, transaction);
        if (!ual) throw new Error(Message.failed(['create', 'device relay', { d_id }], {
            causer: ['create', 'new user activity log']
        }));

        await transaction.commit();
        res.status(201).json(deviceRelays);
    });

    export const addByDevice = Route.asyncHandler(async (req, res) => {
        const date = new Date();

        const d_id = +req.params.d_id;
        const { dr_name } = req.body;
        const [created_at, updated_at] = [date, date];
        const transaction = await db.transaction({ rollbackOnError: true });

        const deviceRelay = await DeviceRelay.create({ dr_name, created_at, updated_at, d_id }, {
            transaction
        });
        if (!deviceRelay) throw new Error(Message.failed(['add', 'new device relay', { d_id }]));

        const device = await Device.updateByPk(d_id, { can_control: true }, { transaction });
        if (!device) throw new Error(Message.failed(['add', 'new device relay', { d_id }], {
            causer: ['update', 'device']
        }));

        const ual = await createUserActivityLog({
            ual_type: 'DEVICE_RELAY_ADD',
            ual_activity: Message.success(['add', 'new device relay', { d_id }]),
            user_id: getPayload(req).user_id
        }, transaction);
        if (!ual) throw new Error(Message.failed(['create', 'device relay', { d_id }], {
            causer: ['create', 'new user activity log']
        }));

        await transaction.commit();
        res.status(201).json(deviceRelay);
    });

    export const findAllByDevice = Route.asyncHandler(async (req, res) => {
        const d_id = +req.params.d_id;
        const deviceRelays = await DeviceRelay.find({ where: { d_id } });
        if (!deviceRelays) throw new Error(Message.failed(['find', 'all device relays']));

        res.status(200).json(deviceRelays);
    });

    export const find = Route.asyncHandler(async (req, res) => {
        const dr_id = +req.params.dr_id;
        const deviceRelay = await DeviceRelay.findByPk(dr_id);
        if (!deviceRelay) throw new Error(Message.failed(['find', 'device relay', dr_id]));

        res.status(200).json(deviceRelay);
    })

    export const update = Route.asyncHandler(async (req, res) => {
        const dr_id = +req.params.dr_id;
        const { dr_name, current_state } = req.body;
        const transaction = await db.transaction({ rollbackOnError: true });

        const prevDeviceRelay = await DeviceRelay.findByPk(dr_id, { transaction });
        if (!prevDeviceRelay) throw new Error(Message.failed(['update', 'device relay', dr_id], {
            causer: ['find', 'previous device relay']
        }));

        const previous_state = prevDeviceRelay.current_state;

        const deviceRelay = await DeviceRelay.updateByPk(dr_id, { dr_name, current_state, previous_state }, { transaction });
        if (!deviceRelay) throw new Error(Message.failed(['update', 'device relay', dr_id]));

        const ual = await createUserActivityLog({
            ual_type: 'DEVICE_RELAY_UPDATE',
            ual_activity: Message.success(['update', 'device relay', dr_id]),
            user_id: getPayload(req).user_id
        }, transaction);
        if (!ual) throw new Error(Message.failed(['update', 'device_relay', dr_id], {
            causer: ['create', 'new user activity log']
        }));

        await transaction.commit();
        res.status(200).json(deviceRelay);
    });

    export const removeAllByDevice = Route.asyncHandler(async (req, res) => {
        const d_id = +req.params.d_id;
        const transaction = await db.transaction({ rollbackOnError: true });

        const deviceRelays = await DeviceRelay.delete({ where: { d_id }, transaction });
        if (!deviceRelays) throw new Error(Message.failed(['delete', 'all device relays', { d_id }]));
        if (!deviceRelays.length) throw new Error(Message.failed(['delete', 'device relays', { d_id }], {
            causer: ['find', 'device relays']
        }));

        const ual = await createUserActivityLog({
            ual_type: 'DEVICE_RELAYS_DELETE',
            ual_activity: Message.success(['delete', 'all device relays', { d_id }]),
            user_id: getPayload(req).user_id
        }, transaction);
        if (!ual) throw new Error(Message.failed(['delete', 'device relay', { d_id }], {
            causer: ['create', 'new user activity log']
        }));

        await transaction.commit();
        res.status(200).json(deviceRelays);
    });

    export const remove = Route.asyncHandler(async (req, res) => {
        const dr_id = +req.params.dr_id;
        const transaction = await db.transaction({ rollbackOnError: true });

        const deviceRelay = await DeviceRelay.deleteByPk(dr_id, { transaction });
        if (!deviceRelay) throw new Error(Message.failed(['delete', 'device relay', dr_id]));

        const ual = await createUserActivityLog({
            ual_type: 'DEVICE_RELAY_DELETE',
            ual_activity: Message.success(['delete', 'device relay', dr_id]),
            user_id: getPayload(req).user_id
        }, transaction);
        if (!ual) throw new Error(Message.failed(['delete', 'device relay', dr_id], {
            causer: ['create', 'new user activity log']
        }));

        await transaction.commit();
        res.status(200).json(deviceRelay);
    });
}
