// CONFIGS
import { db, Company, User, UserSecret } from "../configs/db.config";

// HELPERS
import Message from "../helpers/message.helper";

// MODULES
import Route from "@harrypoggers25/route";
import { hashSync } from "bcrypt-ts";

// MIDDLEWARES
import { Roles } from "../middlewares/access-control.middleware";
import { getPayload } from "../middlewares/authorization.middleware";

// SERVICES
import { createUserActivityLog } from "../services/user-activity-log.service";

export const createCompanyHandler = Route.asyncHandler(async (req, res) => {
    const date = new Date();
    const payload = getPayload(req);

    const { comp_name, user_name, user_email, user_phone } = req.body;
    const [created_at, updated_at] = [date, date];
    const created_by = payload.user_id
    let { user_password } = req.body;
    const user_role: Roles = 'admin';

    for (const key of ['comp_name', 'user_email', 'user_password']) {
        if (!req.body[key]) {
            res.status(400);
            throw new Error(Message.failed(['create', 'new company'], { subMessage: `${key} is required` }));
        }
    }
    user_password = hashSync(user_password, 10);

    const transaction = await db.transaction({ rollbackOnError: true });
    const company = await Company.create({ comp_name, created_at, updated_at }, { transaction });
    if (!company) throw new Error(Message.failed(['create', 'new company']));

    const { comp_id } = company;
    const user = await User.create(
        { user_name, user_email, user_phone, user_role, comp_id, created_at, updated_at, created_by },
        { transaction }
    );
    if (!user) throw new Error(Message.failed(['create', 'new company'], { causer: ['create', 'admin'] }));

    const user_id = user.user_id;
    const userSecret = await UserSecret.create({ user_password, user_id }, { transaction });
    if (!userSecret) throw new Error(Message.failed(['create', 'new company'], { causer: ['create', 'admin password'] }));

    const ual1 = await createUserActivityLog({
        ual_type: 'COMPANY_CREATE',
        ual_activity: Message.success(['create', 'company', comp_id]),
        ual_date: date,
        user_id: created_by
    }, transaction);
    if (!ual1) throw new Error(Message.failed(['create', 'new company'], { causer: ['create', 'new user activity log'] }));
    const ual2 = await createUserActivityLog({
        ual_type: 'USER_CREATE',
        ual_activity: Message.success(['create', 'user account', user_id]),
        ual_date: date,
        user_id: created_by
    }, transaction);
    if (!ual2) throw new Error(Message.failed(['create', 'new company'], { causer: ['create', 'new user activity log'] }));

    await transaction.commit();
    res.status(201).json({ company, user });
});

export const findCompanyHandler = Route.asyncHandler(async (req, res) => {
    const comp_id = +req.params.comp_id;
    const company = await Company.findByPk(comp_id);
    if (!company) throw new Error(Message.failed(['find', 'company', comp_id]));

    res.status(200).json(company);
});

export const findAllCompanyHandler = Route.asyncHandler(async (_, res) => {
    const companies = await Company.find();
    if (!companies) throw new Error(Message.failed(['find', 'all company']));

    res.status(200).json(companies);
});

export const updateCompanyHandler = Route.asyncHandler(async (req, res) => {
    const comp_id = +req.params.comp_id;
    const { comp_name } = req.body;
    const updated_at = new Date();

    const transaction = await db.transaction({ rollbackOnError: true });

    const company = await Company.updateByPk(comp_id, { comp_name, updated_at }, { transaction });
    if (!company) throw new Error(Message.failed(['update', 'company', comp_id]));

    const payload = getPayload(req);
    const ual = await createUserActivityLog({
        ual_type: 'COMPANY_UPDATE',
        ual_activity: Message.success(['update', 'company', comp_id]),
        ual_date: updated_at,
        user_id: payload.user_id
    }, transaction);
    if (!ual) throw new Error(Message.failed(['update', 'company', comp_id], {
        causer: ['create', 'new user activity log']
    }));

    await transaction.commit();
    res.status(200).json(company);
});

export const deleteCompanyHandler = Route.asyncHandler(async (req, res) => {
    const comp_id = +req.params.comp_id;
    const { user_id } = getPayload(req);
    const transaction = await db.transaction({ rollbackOnError: true });

    const company = await Company.deleteByPk(comp_id, { transaction });
    if (!company) throw new Error(Message.failed(['delete', 'company', comp_id]));

    const ual = await createUserActivityLog({
        ual_type: 'COMPANY_DELETE',
        ual_activity: Message.success(['delete', 'company', comp_id]),
        user_id
    }, transaction);
    if (!ual) throw new Error(Message.failed(['delete', 'company', comp_id], {
        causer: ['create', 'new user activity log']
    }));

    await transaction.commit();
    res.status(200).json(company);
});
