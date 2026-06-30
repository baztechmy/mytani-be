// CONFIGS
import { db, Company, User, UserSecret } from "../configs/db.config";

// MODULES
import Route from "@harrypoggers25/route";
import { compareSync, hashSync } from "bcrypt-ts";

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

    if (!comp_name) {
        res.status(400);
        throw new Error('Failed to create new company. Company name is required');
    }

    if (!user_email) {
        res.status(400);
        throw new Error('Failed to create new company. User email is required');
    }

    if (!user_password) {
        res.status(400);
        throw new Error('Failed to create new company. User password is required');
    }
    user_password = hashSync(user_password, 10);

    const transaction = await db.transaction({ rollbackOnError: true });
    const company = await Company.create({ comp_name, created_at, updated_at }, { transaction });
    if (!company) throw new Error('Failed to create new company. Internal error');

    const user = await User.create(
        { user_name, user_email, user_phone, user_role, created_at, updated_at, created_by },
        { transaction }
    );
    if (!user) throw new Error('Failed to create new company. Unable to create admin');

    const user_id = user.user_id;
    const userSecret = await UserSecret.create({ user_password, user_id }, { transaction });
    if (!userSecret) throw new Error('Failed to create new company. Unable to create admin password');

    const ual = await createUserActivityLog(
        {
            ual_type: 'COMPANY_CREATE',
            ual_activity: `Created company with comp_id = '${company.comp_id}' and user account with user_id = '${user_id}'`,
            ual_date: date,
            user_id: created_by
        },
        transaction
    );
    if (!ual) throw new Error('Failed to create new company. Unable to create new user activity log');

    await transaction.commit();
    res.status(201).json({ company, user });
});

export const findCompanyHandler = Route.asyncHandler(async (req, res) => {
    const comp_id = +req.params.comp_id;
    const company = await Company.findByPk(comp_id);
    if (!company) throw new Error(`Failed to find company [${comp_id}]`);

    res.status(200).json(company);
});

export const findAllCompanyHandler = Route.asyncHandler(async (_, res) => {
    const companies = await Company.find();
    if (!companies) throw new Error(`Failed to find all company`);

    res.status(200).json(companies);
});

export const updateCompanyHandler = Route.asyncHandler(async (req, res) => {
    const comp_id = +req.params.comp_id;
    const { comp_name } = req.body;
    const updated_at = new Date();

    const transaction = await db.transaction({ rollbackOnError: true });

    const company = await Company.updateByPk(comp_id, { comp_name, updated_at }, { transaction });
    if (!company) throw new Error(`Failed to update company [${comp_id}]`);

    const payload = getPayload(req);
    const ual = await createUserActivityLog(
        { ual_type: 'COMPANY_UPDATE', ual_activity: `Updated company with user_id = '${comp_id}'`, ual_date: updated_at, user_id: payload.user_id },
        transaction
    );
    if (!ual) throw new Error(`Failed to update company [${comp_id}]. Unable to create new user activity log`);

    await transaction.commit();
    res.status(200).json(company);
});

export const deleteCompanyHandler = Route.asyncHandler(async (req, res) => {
    const comp_id = +req.params.comp_id;
    const { user_id } = getPayload(req);
    const { user_password } = req.body;
    const transaction = await db.transaction({ rollbackOnError: true });

    if (!user_password) {
        res.status(400);
        throw new Error(`Failed to delete company [${comp_id}]. Super admin password is required`);
    }

    const userSecret = await UserSecret.find({ where: { user_id }, transaction });
    if (!userSecret || !userSecret.length) throw new Error(`Failed to delete company [${comp_id}]. Unable to get super admin password`);
    if (!compareSync(user_password, userSecret[0].user_password)) throw new Error(`Failed to delete company [${comp_id}]. Invalid super admin password`);

    const company = await Company.deleteByPk(comp_id, { transaction });
    if (!company) throw new Error(`Failed to delete company [${comp_id}]`);

    const ual = await createUserActivityLog(
        { ual_type: 'COMPANY_DELETE', ual_activity: `Deleted company with user_id = '${comp_id}'`, user_id },
        transaction
    );
    if (!ual) throw new Error(`Failed to delete company [${comp_id}]. Unable to create new user activity log`);

    await transaction.commit();
    res.status(200).json(company);
});
