// CONFIGS
import { db, Device, Site } from "../configs/db.config";

// HELPERS
import { stringifyJson } from "../helpers/json.helper";

// MODULES
import Route from "@harrypoggers25/route";

// MIDDLEWARES
import { getPayload } from "../middlewares/authorization.middleware";

// SERVICES
import { createUserActivityLog } from "../services/user-activity-log.service";

export const createDeviceBySiteHandler = Route.asyncHandler(async (req, res) => {
    const site_id = +req.params.site_id;
    const { d_id, d_did, d_name } = req.body;
    const payload = getPayload(req);
    const transaction = await db.transaction({ rollbackOnError: true });

    const site = await Site.findByPk(site_id, { transaction });
    if (!site) throw new Error(`Failed to create device by site ${stringifyJson({ site_id })}`);

    const { comp_id } = site;
    const device = await Device.create({ d_id, d_did, d_name, site_id, comp_id }, { transaction });
    if (!device) throw new Error(`Failed to create device by site ${stringifyJson({ site_id })}`);

    const ual = await createUserActivityLog(
        { ual_type: 'DEVICE_CREATE', ual_activity: `Created new device with d_id = '${device.d_id}'`, user_id: payload.user_id },
        transaction
    );
    if (!ual) throw new Error(`Failed to create device by site ${stringifyJson({ site_id })}. Unable to create new user activity log`);

    await transaction.commit();
    res.status(201).json(device);
});

export const findDeviceHandler = Route.asyncHandler(async (req, res) => {
    const d_id = +req.params.d_id;
    const device = await Device.findByPk(+d_id);
    if (!device) throw new Error(`Failed to find device [${d_id}]`);

    res.status(200).json(device);
});

export const findAllDeviceHandler = Route.asyncHandler(async (_, res) => {
    const devices = await Device.find();
    if (!devices) throw new Error('Failed to find all devices');

    res.status(200).json(devices);
});

export const findAllDeviceBySiteHandler = Route.asyncHandler(async (req, res) => {
    const site_id = +req.params.site_id;
    const device = await Device.find({ where: { site_id } });
    if (!device) throw new Error(`Failed to find all devices by site ${stringifyJson({ site_id })}`);

    res.status(200).json(device);
});

export const findAllDeviceByCompanyHandler = Route.asyncHandler(async (req, res) => {
    const comp_id = +req.params.comp_id;
    const device = await Device.find({ where: { comp_id } });
    if (!device) throw new Error(`Failed to find all devices by company ${stringifyJson({ comp_id })}`);

    res.status(200).json(device);
});

export const updateDeviceHandler = Route.asyncHandler(async (req, res) => {
    const d_id = +req.params.d_id;
    const { d_did, d_name } = req.body;
    const payload = getPayload(req);
    const transaction = await db.transaction({ rollbackOnError: true });

    const device = await Device.updateByPk(d_id,
        { d_did, d_name },
        { transaction }
    );
    if (!device) throw new Error(`Failed to update device [${d_id}]`);

    const ual = await createUserActivityLog(
        { ual_type: 'DEVICE_UPDATE', ual_activity: `Updated device with d_id = '${d_id}'`, user_id: payload.user_id },
        transaction
    );
    if (!ual) throw new Error(`Failed to update device [${d_id}]. Unable to create new user activity log`);

    await transaction.commit();
    res.status(200).json(device);
});

export const deleteDeviceHandler = Route.asyncHandler(async (req, res) => {
    const d_id = +req.params.d_id;
    const payload = getPayload(req);
    const transaction = await db.transaction({ rollbackOnError: true });

    const device = await Device.deleteByPk(d_id, { transaction });
    if (!device) throw new Error(`Failed to delete device [${d_id}]`);

    const ual = await createUserActivityLog(
        { ual_type: 'DEVICE_DELETE', ual_activity: `Deleted device with d_id = '${d_id}'`, user_id: payload.user_id },
        transaction
    );
    if (!ual) throw new Error(`Failed to delete device [${d_id}]. Unable to create new user activity log`);

    await transaction.commit();
    res.status(200).json(device);
});
