// CONFIGS
import { db, User, UserSecret } from "../configs/db.config";

// MODULES
import Route from "@harrypoggers25/route";
import { hashSync } from "bcrypt-ts";

// MIDDLEWARES
import { getPayload } from "../middlewares/authorization.middleware";

// SERVICES
import { createUserActivityLog } from "../services/user-activity-log.service";
import { Roles } from "../middlewares/access-control.middleware";
import Message from "../helpers/message.helper";

export namespace UserHandler {
    export const createByCompany = Route.asyncHandler(async (req, res) => {
        const date = new Date();

        const comp_id = +req.params.comp_id;
        const payload = getPayload(req);
        const { user_name, user_email, user_phone, created_by = payload.user_id } = req.body;
        const [created_at, updated_at] = [date, date];
        let { user_password } = req.body;

        if (!user_email) {
            res.status(400);
            throw new Error(Message.failed(['create', 'new user by company', { comp_id }], {
                subMessage: 'user_email is required'
            }));
        }

        if (!user_password) {
            res.status(400);
            throw new Error(Message.failed(['create', 'new user by company', { comp_id }], {
                subMessage: 'user_password is required'
            }));
        }
        user_password = hashSync(user_password, 10);

        const transaction = await db.transaction({ rollbackOnError: true });
        const user_role: Roles = 'user';
        const user = await User.create(
            { user_name, user_email, user_phone, user_role, comp_id, created_at, updated_at, created_by },
            { transaction }
        );
        if (!user) throw new Error(Message.failed(['create', 'new user by company', { comp_id }]));

        const { user_id } = user;
        const userSecret = await UserSecret.create({ user_password, user_id: user.user_id }, { transaction });
        if (!userSecret) throw new Error(Message.failed(['create', 'new user by company', { comp_id }], {
            causer: ['create', 'user password']
        }));

        const ual = await createUserActivityLog({
            ual_type: 'USER_CREATE',
            ual_activity: Message.success(['create', 'user account', user_id]),
            ual_date: date,
            user_id: payload.user_id
        },
            transaction
        );
        if (!ual) throw new Error(Message.failed(['create', 'new user by company', { comp_id }], {
            causer: ['create', 'new user activity log']
        }));

        await transaction.commit();
        res.status(201).json(user);
    });

    export const find = Route.asyncHandler(async (req, res) => {
        const user_id = +req.params.user_id;
        const user = await User.findByPk(user_id);
        if (!user) throw new Error(Message.failed(['find', 'user', user_id]));

        res.status(200).json(user);
    });

    export const findAll = Route.asyncHandler(async (_, res) => {
        const users = await User.find();
        if (!users) throw new Error(Message.failed(['find', 'all users']));

        res.status(200).json(users);
    });

    export const findAllByCompany = Route.asyncHandler(async (req, res) => {
        const comp_id = +req.params.comp_id;
        const users = await User.find({ where: { comp_id } });
        if (!users) throw new Error(Message.failed(['find', 'all users by company', { comp_id }]));

        res.status(200).json(users);
    });

    export const update = Route.asyncHandler(async (req, res) => {
        const user_id = +req.params.user_id;
        const { user_name, user_email, user_password, user_phone, user_role } = req.body;
        const updated_at = new Date();

        const transaction = await db.transaction({ rollbackOnError: true });

        if (user_password) {
            const userSecret = await UserSecret.update({ user_password: hashSync(user_password, 10) }, { where: { user_id }, transaction });
            if (!userSecret) throw new Error(Message.failed(['update', 'user', user_id], {
                subMessage: 'Invalid user password'
            }));
        }

        const roles: Array<Roles> = ['admin', 'user'];
        if (user_role && (typeof user_role !== 'string' || !roles.some(role => user_role.toLowerCase() === role))) {
            await transaction.rollback()
            res.status(400);
            throw new Error(Message.failed(['update', 'user', user_id], {
                subMessage: 'Invalid user role'
            }));
        }

        const user = await User.updateByPk(user_id, { user_name, user_email, user_phone, user_role, updated_at }, { transaction });
        if (!user) throw new Error(Message.failed(['update', 'user', user_id]));

        const payload = getPayload(req);
        const ual = await createUserActivityLog({
            ual_type: 'USER_UPDATE',
            ual_activity: Message.success(['update', 'user account', user_id]),
            ual_date: updated_at,
            user_id: payload.user_id
        }, transaction);
        if (!ual) throw new Error(Message.failed(['update', 'user', user_id], {
            causer: ['create', 'new user activity log']
        }));

        await transaction.commit();
        res.status(200).json(user);
    });

    export const remove = Route.asyncHandler(async (req, res) => {
        const user_id = +req.params.user_id;
        const transaction = await db.transaction({ rollbackOnError: true });

        const user = await User.deleteByPk(user_id, { transaction });
        if (!user) throw new Error(Message.failed(['delete', 'user', user_id]));

        const payload = getPayload(req);
        const ual = await createUserActivityLog({
            ual_type: 'USER_DELETE',
            ual_activity: Message.success(['delete', 'user account', user_id]),
            user_id: payload.user_id
        }, transaction);
        if (!ual) throw new Error(Message.failed(['delete', 'user', user_id], {
            causer: ['create', 'new user activity log']
        }));

        await transaction.commit();
        res.status(200).json(user);
    });
}
