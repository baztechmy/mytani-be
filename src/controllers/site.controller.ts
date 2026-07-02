// CONFIGS
import { db, Site } from "../configs/db.config";

// MODULES
import Route from "@harrypoggers25/route";

// MIDDLEWARES
import { getPayload } from "../middlewares/authorization.middleware";

// SERVICES
import { createUserActivityLog } from "../services/user-activity-log.service";
import Message from "../helpers/message.helper";

export const createSiteByCompanyHandler = Route.asyncHandler(async (req, res) => {
    const date = new Date();

    const comp_id = +req.params.comp_id;
    const payload = getPayload(req);
    const { site_name, site_location } = req.body;
    const [created_at, updated_at] = [date, date];
    const transaction = await db.transaction({ rollbackOnError: true });

    const site = await Site.create({ site_name, site_location, comp_id, created_at, updated_at }, { transaction });
    if (!site) throw new Error(Message.failed(['create', 'site by company', { comp_id }]));

    const { site_id } = site;
    const ual = await createUserActivityLog({
        ual_type: 'SITE_CREATE',
        ual_activity: Message.success(['create', 'new site', site_id]),
        user_id: payload.user_id
    }, transaction);
    if (!ual) throw new Error(Message.failed(['create', 'site by company', { comp_id }], {
        causer: ['create', 'new user activity log']
    }));

    await transaction.commit();
    res.status(201).json(site);
});

export const findSiteHandler = Route.asyncHandler(async (req, res) => {
    const site_id = +req.params.site_id;
    const site = await Site.findByPk(+site_id);
    if (!site) throw new Error(Message.failed(['find', 'site', site_id]));

    res.status(200).json(site);
});

export const findAllSiteHandler = Route.asyncHandler(async (_, res) => {
    const sites = await Site.find();
    if (!sites) throw new Error(Message.failed(['find', 'all sites']));

    res.status(200).json(sites);
});

export const findAllSiteByCompanyHandler = Route.asyncHandler(async (req, res) => {
    const comp_id = +req.params.comp_id;
    const sites = await Site.find({ where: { comp_id } });
    if (!sites) throw new Error(Message.failed(['find', 'all sites by company', { comp_id }]));

    res.status(200).json(sites);
});

export const updateSiteHandler = Route.asyncHandler(async (req, res) => {
    const site_id = +req.params.site_id;
    const { site_name, site_location } = req.body;
    const updated_at = new Date();
    const payload = getPayload(req);
    const transaction = await db.transaction({ rollbackOnError: true });

    const site = await Site.updateByPk(site_id, { site_name, site_location, updated_at }, { transaction });
    if (!site) throw new Error(Message.failed(['update', 'site', site_id]));

    const ual = await createUserActivityLog({
        ual_type: 'SITE_UPDATE',
        ual_activity: Message.success(['update', 'site', site_id]),
        user_id: payload.user_id
    }, transaction);
    if (!ual) throw new Error(Message.failed(['update', 'site', site_id], {
        causer: ['create', 'new user activity log']
    }));

    await transaction.commit();
    res.status(200).json(site);
});

export const deleteSiteHandler = Route.asyncHandler(async (req, res) => {
    const site_id = +req.params.site_id;
    const payload = getPayload(req);
    const transaction = await db.transaction({ rollbackOnError: true });

    const site = await Site.deleteByPk(site_id, { transaction });
    if (!site) throw new Error(Message.failed(['delete', 'site', site_id]));

    const ual = await createUserActivityLog({
        ual_type: 'SITE_DELETE',
        ual_activity: Message.success(['delete', 'site', site_id]),
        user_id: payload.user_id
    }, transaction);
    if (!ual) throw new Error(Message.failed(['delete', 'site', site_id], {
        causer: ['create', 'new user activity log']
    }));

    await transaction.commit();
    res.status(200).json(site);
});
