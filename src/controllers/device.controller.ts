// CONFIGS
import { db, Device, DeviceControlParam, Site } from "../configs/db.config";
import { mqttClient } from "../configs/mqtt.config";

// HELPERS
import Message from "@harrypoggers25/message";
import { stringifyJson } from "../helpers/json.helper";

// MODULES
import Route from "@harrypoggers25/route";

// MIDDLEWARES
import AccessControl from "../middlewares/access-control.middleware";
import { getPayload } from "../middlewares/authorization.middleware";

// SERVICES
import { createUserActivityLog } from "../services/user-activity-log.service";
import { nanoid } from "nanoid";

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

    export const control = Route.asyncHandler(async (req, res) => {
        const d_id = +req.params.d_id;

        const device = AccessControl.fromReq(req).device;
        if (!device.can_control) throw new Error(Message.failed(['control', 'device', d_id], {
            subMessage: 'can_control must be toggled on'
        }));

        const deviceParams = await DeviceControlParam.find({ where: { d_id: d_id } });
        if (!deviceParams) throw new Error(Message.failed(['control', 'device', d_id], {
            causer: ['find', 'device params']
        }));

        const controlBody: Record<string, any> = {};
        for (const { dcp_tag, dcp_required } of deviceParams) {
            if (!dcp_required) continue;
            if (!req.body[dcp_tag]) throw new Error(Message.failed(['control', 'device', d_id], {
                subMessage: `Parameter ${dcp_tag} is required`
            }));

            controlBody[dcp_tag] = req.body[dcp_tag];
        }

        // MQTT LOGIC
        const { d_did } = device;
        const topic = `pacer/${d_did}/control`;
        const uuid = nanoid(16);
        const message = stringifyJson({ ...controlBody, req_uuid: uuid });
        const publish = await mqttClient.publish(topic, message, { uuid });
        if (!publish) {
            throw new Error(Message.failed(['control', 'device relays', { d_id }], {
                subMessage: 'MQTT publish response in invalid'
            }));
        }

        res.status(200).json(controlBody);
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

