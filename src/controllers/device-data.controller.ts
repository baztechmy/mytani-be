// CONFIGS
import { db, createDeviceData, Device, DeviceDatas } from "../configs/db.config";

// HELPERS
import Message from "../helpers/message.helper";

// MODULES
import Route from "@harrypoggers25/route";

// MIDDLEWARES
import { getPayload } from "../middlewares/authorization.middleware";

// SERVICES
import { createUserActivityLog } from "../services/user-activity-log.service";

export namespace DeviceDataHandler {
    export const createByDevice = Route.asyncHandler(async (req, res) => {
        const d_id = +req.params.d_id;
        const transaction = await db.transaction({ rollbackOnError: true });

        if (DeviceDatas[d_id]) throw new Error(Message.failed(['create', 'device data instance', { d_id }], {
            subMessage: 'Device already has an existing device data instance'
        }));

        const DeviceData = createDeviceData(d_id);
        await DeviceData.sync({ alter: true, transaction });

        const device = await Device.updateByPk(d_id, { can_monitor: true }, { transaction });
        if (!device) throw new Error(Message.failed(['create', 'device data instance', { d_id }], {
            causer: ['update', 'device']
        }));

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

    export const removeByDevice = Route.asyncHandler(async (req, res) => {
        const d_id = +req.params.d_id;
        const transaction = await db.transaction({ rollbackOnError: true });

        if (!DeviceDatas[d_id]) throw new Error(Message.failed(['create', 'device data instance', { d_id }], {
            subMessage: 'Device data does not have an instance'
        }));

        const dropTable = await db.dropTable(DeviceDatas[d_id].tableName, { transaction });
        if (!dropTable) throw new Error(Message.failed(['delete', 'device data instance', { d_id }]));

        const device = await Device.updateByPk(d_id, { can_monitor: false }, { transaction });
        if (!device) throw new Error(Message.failed(['delete', 'device data instance', { d_id }], {
            causer: ['update', 'device']
        }));

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
