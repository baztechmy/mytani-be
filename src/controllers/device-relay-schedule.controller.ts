// CONFIGS
import { db, Device, DeviceRelaySchedule } from "../configs/db.config";

// HELPERS
import Message from "../helpers/message.helper";
import { isArrayObj, stringifyJson } from "../helpers/json.helper";

// MODULES
import Route from "@harrypoggers25/route";

// MIDDLEWARES
import { getPayload } from "../middlewares/authorization.middleware";

// SERVICES
import { createUserActivityLog } from "../services/user-activity-log.service";

function verifyRecurrence(obj: any): string | undefined {
    if (!isArrayObj<string>(obj, day => typeof day === 'string')) return undefined;
    const recurrence = Array.from(new Set(obj.map(day => day.toLowerCase())));

    for (const day of recurrence) {
        if (!['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'].includes(day)) return undefined;
    }

    return stringifyJson(recurrence);
}

export namespace DeviceRelayScheduleHandler {
    export const createByDeviceRelay = Route.asyncHandler(async (req, res) => {
        const d_id = +req.params.d_id;
        const dr_id = +req.params.dr_id;

        const { drs_name, action, time, start_at, end_at, active } = req.body;
        const recurrence = verifyRecurrence(req.body.recurrence);
        const transaction = await db.transaction({ rollbackOnError: true });

        if (!recurrence) {
            res.status(400);
            throw new Error(Message.failed(['create', 'new device relay schedule', { dr_id }], {
                subMessage: 'recurrence must be an array of valid days'
            }));
        }

        const device = await Device.findByPk(d_id, { transaction });
        if (!device) throw new Error(Message.failed(['create', 'new device relay schedule', { dr_id }], {
            causer: ['find', 'device']
        }));

        const { has_relay } = device;
        if (!has_relay) throw new Error(Message.failed(['create', 'new device relay schedule', { dr_id }], {
            subMessage: `has_relay must be toggled on device [${d_id}]`
        }));

        const deviceRelaySchedule = await DeviceRelaySchedule.create(
            { drs_name, action, time, recurrence, start_at, end_at, active, dr_id },
            { transaction }
        );
        if (!deviceRelaySchedule) throw new Error(Message.failed(['create', 'new device relay schedule', { dr_id }]));

        const ual = await createUserActivityLog({
            ual_type: 'DEVICE_RELAY_SCHEDULE_CREATE',
            ual_activity: Message.success(['create', 'new device relay schedule', { dr_id }]),
            user_id: getPayload(req).user_id
        }, transaction);
        if (!ual) throw new Error(Message.failed(['create', 'new device relay schedule', { dr_id }], {
            causer: ['create', 'new user activity log']
        }));

        await transaction.commit();
        res.status(201).json(deviceRelaySchedule);
    });

    export const findAllByDeviceRelay = Route.asyncHandler(async (req, res) => {
        const dr_id = +req.params.dr_id;

        const deviceRelays = await DeviceRelaySchedule.find({ where: { dr_id } });
        if (!deviceRelays) throw new Error(Message.failed(['find', 'all device relay schedules', { dr_id }]));

        res.status(200).json(deviceRelays);
    });

    export const find = Route.asyncHandler(async (req, res) => {
        const drs_id = +req.params.drs_id;
        const dr_id = +req.params.dr_id;

        const deviceRelay = await DeviceRelaySchedule.findByPk(drs_id, { where: { dr_id } });
        if (!deviceRelay) throw new Error(Message.failed(['find', 'device relay schedule', drs_id]));

        res.status(200).json(deviceRelay);
    })

    export const update = Route.asyncHandler(async (req, res) => {
        const drs_id = +req.params.drs_id;
        const dr_id = +req.params.dr_id;
        const { drs_name, action, time, start_at, end_at, active } = req.body;
        const recurrence = verifyRecurrence(req.body.recurrence);
        const transaction = await db.transaction({ rollbackOnError: true });

        const deviceRelaySchedule = await DeviceRelaySchedule.updateByPk(drs_id,
            { drs_name, action, time, recurrence, start_at, end_at, active },
            { where: { dr_id }, transaction }
        );
        if (!deviceRelaySchedule) throw new Error(Message.failed(['update', 'device relay schedule', drs_id]));

        const ual = await createUserActivityLog({
            ual_type: 'DEVICE_RELAY_SCHEDULE_UPDATE',
            ual_activity: Message.success(['update', 'device relay schedule', drs_id]),
            user_id: getPayload(req).user_id
        }, transaction);
        if (!ual) throw new Error(Message.failed(['update', 'device relay schedule', drs_id], {
            causer: ['create', 'new user activity log']
        }));

        await transaction.commit();
        res.status(200).json(deviceRelaySchedule);
    });

    export const remove = Route.asyncHandler(async (req, res) => {
        const drs_id = +req.params.drs_id;
        const dr_id = +req.params.dr_id;
        const transaction = await db.transaction({ rollbackOnError: true });

        const deviceRelaySchedule = await DeviceRelaySchedule.deleteByPk(drs_id, { where: { dr_id }, transaction });
        if (!deviceRelaySchedule) throw new Error(Message.failed(['delete', 'device relay schedule', dr_id]));

        const ual = await createUserActivityLog({
            ual_type: 'DEVICE_RELAY_SCHEDULE_DELETE',
            ual_activity: Message.success(['delete', 'device relay schedule', dr_id]),
            user_id: getPayload(req).user_id
        }, transaction);
        if (!ual) throw new Error(Message.failed(['delete', 'device relay schedule', dr_id], {
            causer: ['create', 'new user activity log']
        }));

        await transaction.commit();
        res.status(200).json(deviceRelaySchedule);
    });
}
