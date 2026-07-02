// CONFIGS
import { db, Device, Site } from "../configs/db.config";

// MODULES
import Route from "@harrypoggers25/route";

// MIDDLEWARES
import { getPayload } from "../middlewares/authorization.middleware";

// SERVICES
import { createUserActivityLog } from "../services/user-activity-log.service";
import Message from "../helpers/message.helper";

export namespace DeviceHandler {
    export const createBySite = Route.asyncHandler(async (req, res) => {
        const site_id = +req.params.site_id;
        const { d_did, d_name } = req.body;
        const payload = getPayload(req);
        const transaction = await db.transaction({ rollbackOnError: true });

        const site = await Site.findByPk(site_id, { transaction });
        if (!site) throw new Error(Message.failed([`create`, 'device by site', { site_id }], {
            causer: ['find', 'site']
        }));

        const { comp_id } = site;
        const device = await Device.create({ d_did, d_name, site_id, comp_id }, { transaction });
        if (!device) throw new Error(Message.failed([`create`, 'device by site', { site_id }]));

        const ual = await createUserActivityLog({
            ual_type: 'DEVICE_CREATE',
            ual_activity: Message.success([`create`, 'device by site', { site_id }]),
            user_id: payload.user_id
        }, transaction);
        if (!ual) throw new Error(Message.failed(['create', 'device by site', { site_id }], {
            causer: ['create', 'new user activity log']
        }));

        await transaction.commit();
        res.status(201).json(device);
    });

    export const find = Route.asyncHandler(async (req, res) => {
        const d_id = +req.params.d_id;
        const device = await Device.findByPk(+d_id);
        if (!device) throw new Error(Message.failed(['find', 'device', d_id]));

        res.status(200).json(device);
    });

    export const findAll = Route.asyncHandler(async (_, res) => {
        const devices = await Device.find();
        if (!devices) throw new Error(Message.failed(['find', 'all devices']));

        res.status(200).json(devices);
    });

    export const findAllBySite = Route.asyncHandler(async (req, res) => {
        const site_id = +req.params.site_id;
        const device = await Device.find({ where: { site_id } });
        if (!device) throw new Error(Message.failed(['find', 'all devices by site', { site_id }]));

        res.status(200).json(device);
    });

    export const findAllByCompany = Route.asyncHandler(async (req, res) => {
        const comp_id = +req.params.comp_id;
        const device = await Device.find({ where: { comp_id } });
        if (!device) throw new Error(Message.failed(['find', 'all devices by company', { comp_id }]));

        res.status(200).json(device);
    });

    export const update = Route.asyncHandler(async (req, res) => {
        const d_id = +req.params.d_id;
        const { d_did, d_name } = req.body;
        const payload = getPayload(req);
        const transaction = await db.transaction({ rollbackOnError: true });

        const device = await Device.updateByPk(d_id,
            { d_did, d_name },
            { transaction }
        );
        if (!device) throw new Error(Message.failed(['update', 'device', d_id]));

        const ual = await createUserActivityLog({
            ual_type: 'DEVICE_UPDATE',
            ual_activity: Message.success(['update', 'device', d_id]),
            user_id: payload.user_id
        }, transaction);
        if (!ual) throw new Error(Message.failed(['update', 'device', d_id], {
            causer: ['create', 'new user activity log']
        }));

        await transaction.commit();
        res.status(200).json(device);
    });

    export const remove = Route.asyncHandler(async (req, res) => {
        const d_id = +req.params.d_id;
        const payload = getPayload(req);
        const transaction = await db.transaction({ rollbackOnError: true });

        const device = await Device.deleteByPk(d_id, { transaction });
        if (!device) throw new Error(Message.failed(['delete', 'device', d_id]));

        const ual = await createUserActivityLog({
            ual_type: 'DEVICE_DELETE',
            ual_activity: Message.success(['delete', 'device', d_id]),
            user_id: payload.user_id
        }, transaction);
        if (!ual) throw new Error(Message.failed(['delete', 'device', d_id], {
            causer: ['create', 'new user activity log']
        }));

        await transaction.commit();
        res.status(200).json(device);
    });
}

