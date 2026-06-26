// CONFIGS
import { db, User, UserSecret } from "../configs/db.config";
import { hashSync } from "bcrypt-ts";

// MODULES
import Route from "@harrypoggers25/route";

// MIDDLEWARES
import { getPayload } from "../middlewares/authorization.middleware";

// SERVICES
import { createUserActivityLog } from "../services/user-activity-log.service";

export const createUserHandler = Route.asyncHandler(async (req, res) => {
    const date = new Date();

    const { user_name, user_email, user_phone, created_by } = req.body;
    const [created_at, updated_at] = [date, date];
    let { user_role, user_password } = req.body;

    if (!user_email) {
        res.status(400);
        throw new Error('Failed to create new user. User email is required');
    }

    if (!user_password) {
        res.status(400);
        throw new Error('Failed to create new user. User password is required');
    }
    user_password = hashSync(user_password, 10);

    if (!user_role || typeof user_role !== 'string' || !['admin', 'user'].some(role => user_role.toLowerCase() === role)) {
        res.status(400);
        throw new Error('Failed to create new user. Invalid user role');
    }
    user_role = user_role.toLowerCase();

    const transaction = await db.transaction({ rollbackOnError: true });
    const user = await User.create(
        { user_name, user_email, user_phone, user_role, created_at, updated_at, created_by },
        { transaction }
    );
    if (!user) throw new Error('Failed to create new user. Internal error');

    const user_id = user.user_id;
    const userSecret = await UserSecret.create({ user_password, user_id }, { transaction });
    if (!userSecret) throw new Error('Failed to create new user password');

    const ual = await createUserActivityLog(
        { ual_type: 'USER_CREATE', ual_activity: `Created user account with user_id = '${user_id}'`, ual_date: date, user_id: created_by },
        transaction
    );
    if (!ual) throw new Error('Failed to create new user. Unable to create new user activity log');

    await transaction.commit();
    res.status(201).json(user);
});

export const findUserHandler = Route.asyncHandler(async (req, res) => {
    const user_id = +req.params.user_id;
    const user = await User.findByPk(user_id);
    if (!user) throw new Error(`Failed to find user [${user_id}]`);

    res.status(200).json(user);
});

export const findAllUserHandler = Route.asyncHandler(async (_, res) => {
    const users = await User.find();
    if (!users) throw new Error(`Failed to find all users`);

    res.status(200).json(users);
});

export const updateUserHandler = Route.asyncHandler(async (req, res) => {
    const user_id = +req.params.user_id;
    const { user_name, user_email, user_password, user_phone, user_role } = req.body;
    const updated_at = new Date();

    const transaction = await db.transaction({ rollbackOnError: true });

    if (user_password) {
        const userSecret = await UserSecret.update({ user_password: hashSync(user_password, 10) }, { where: { user_id }, transaction });
        if (!userSecret) throw new Error(`Failed to update user password [${user_id}]`);
    }

    if (user_role && (typeof user_role !== 'string' || !['admin', 'user'].some(role => user_role.toLowerCase() === role))) {
        await transaction.rollback()
        res.status(400);
        throw new Error('Failed to create new user. Invalid user role');
    }

    const user = await User.updateByPk(user_id, { user_name, user_email, user_phone, user_role, updated_at }, { transaction });
    if (!user) throw new Error(`Failed to update user [${user_id}]`);

    const payload = getPayload(req);
    const ual = await createUserActivityLog(
        { ual_type: 'USER_UPDATE', ual_activity: `Updated user account with user_id = '${user_id}'`, ual_date: updated_at, user_id: payload.user_id },
        transaction
    );
    if (!ual) throw new Error('Failed to update user. Unable to create new user activity log');

    await transaction.commit();
    res.status(200).json(user);
});

export const deleteUserHandler = Route.asyncHandler(async (req, res) => {
    const user_id = +req.params.user_id;
    const transaction = await db.transaction({ rollbackOnError: true });

    const user = await User.deleteByPk(user_id, { transaction });
    if (!user) throw new Error(`Failed to delete user [${user_id}]`);

    const payload = getPayload(req);
    const ual = await createUserActivityLog(
        { ual_type: 'USER_DELETE', ual_activity: `Deleted user account with user_id = '${user_id}'`, user_id: payload.user_id },
        transaction
    );
    if (!ual) throw new Error('Failed to delete user. Unable to create new user activity log');

    await transaction.commit();
    res.status(200).json(user);
});
