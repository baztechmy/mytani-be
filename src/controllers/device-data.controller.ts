// CONFIGS
import { db, Device, DeviceDatas } from "../configs/db.config";

// HELPERS
import Message from "@harrypoggers25/message";

// MODULES
import Route from "@harrypoggers25/route";

// MIDDLEWARES
import { getPayload } from "../middlewares/authorization.middleware";

// SERVICES
import { canMonitorHandler } from "../services/mqtt.service";
import { createUserActivityLog } from "../services/user-activity-log.service";

export namespace DeviceDataHandler {
    export const createByDevice = Route.asyncHandler(async (req, res) => {
        const d_id = +req.params.d_id;
        const transaction = await db.transaction({ rollbackOnError: true });

        if (DeviceDatas[d_id]) throw new Error(Message.failed(['create', 'device data instance', { d_id }], {
            subMessage: 'Device already has an existing device data instance'
        }));

        const device = await Device.updateByPk(d_id, { can_monitor: true }, { transaction });
        if (!device) throw new Error(Message.failed(['create', 'device data instance', { d_id }], {
            causer: ['update', 'device']
        }));

        if (!(await canMonitorHandler(device, true, transaction))) {
            if (transaction.conn) transaction.rollback();
            throw new Error(Message.failed(['create', 'device data instance', { d_id }], {
                subMessage: 'Unable to subscribe to mqtt topic'
            }))
        }

        const ual = await createUserActivityLog({
            ual_type: 'DEVICE_DATA_CREATE',
            ual_activity: Message.success(['create', 'new device data instance', d_id]),
            user_id: getPayload(req).user_id
        }, transaction);
        if (!ual) throw new Error(Message.failed(['create', 'device data instance', { d_id }], {
            causer: ['create', 'new user activity log']
        }));

        await transaction.commit();
        res.status(201).json({ message: Message.success(['create', 'device data instance', [d_id]]) });
    });

    export const findAllByDevice = Route.asyncHandler(async (req, res) => {
        const d_id = +req.params.d_id;
        if (!DeviceDatas[d_id]) {
            res.status(404);
            throw new Error(Message.failed(['find', 'device data', { d_id }], {
                subMessage: 'Device data does not have an instance'
            }));
        }

        const DeviceData = DeviceDatas[d_id];
        const deviceData = await DeviceData.find({ orderBy: { dd_date: 'ASC' } });
        if (!deviceData) throw new Error(Message.failed(['find', 'device data', { d_id }]));

        res.status(200).json(deviceData);
    });

    export const removeByDevice = Route.asyncHandler(async (req, res) => {
        const d_id = +req.params.d_id;
        const transaction = await db.transaction({ rollbackOnError: true });

        if (!DeviceDatas[d_id]) {
            res.status(404);
            throw new Error(Message.failed(['create', 'device data instance', { d_id }], {
                subMessage: 'Device data does not have an instance'
            }));
        }

        const device = await Device.updateByPk(d_id, { can_monitor: false }, { transaction });
        if (!device) throw new Error(Message.failed(['delete', 'device data instance', { d_id }], {
            causer: ['update', 'device']
        }));

        if (!(await canMonitorHandler(device, true, transaction))) {
            if (transaction.conn) transaction.rollback();
            throw new Error(Message.failed(['delete', 'device data instance', { d_id }], {
                subMessage: 'Unable to unsubscribe to mqtt topic'
            }))
        }

        const ual = await createUserActivityLog({
            ual_type: 'DEVICE_DATA_DELETE',
            ual_activity: Message.success(['delete', 'device data instance', { d_id }]),
            user_id: getPayload(req).user_id
        }, transaction);
        if (!ual) throw new Error(Message.failed(['delete', 'device data instance', { d_id }], {
            causer: ['create', 'new user activity log']
        }));

        await transaction.commit();
        res.status(200).json(device);
    });
}
