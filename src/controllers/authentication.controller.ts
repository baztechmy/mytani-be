// CONFIGS
import { User, UserSecret } from "../configs/db.config";
import env from "../configs/env.config";

// MIDDLEWARES
import { Payload } from "../middlewares/authorization.middleware";

// MODULES
import Route from "@harrypoggers25/route";
import { compareSync } from "bcrypt-ts";
import ms from 'ms';

// HELPERS
import Token from "../helpers/token.helper";

export const loginUserHandler = Route.asyncHandler(async (req, res) => {
    const { user_email, user_password } = req.body;
    if (!user_email || !user_password) {
        res.status(400);
        throw new Error('Failed to login user. Email and password are both required');
    }

    const users = await User.find({ where: { user_email } });
    if (!users) throw new Error(`Failed to login user [${user_email}]. Unable to find user`);
    if (!users.length) throw new Error(`Failed to login user [${user_email}]. User not found`);

    const { user_id, user_name, user_role } = users[0];
    const userSecrets = await UserSecret.find({ where: { user_id } });
    if (!userSecrets) throw new Error(`Failed to login user [${user_email}]. Failed to find user secret`);
    if (!userSecrets.length) throw new Error(`Failed to login user [${user_email}]. User secret not found`);

    const userSecret = userSecrets[0];
    if (!compareSync(user_password, userSecret.user_password)) throw new Error(`Failed to login user [${user_email}]. Password is incorrect`);

    const login_id = Date.now();
    const payload = { user_id, user_email, user_name, user_role, login_id };

    const tokens = {
        access: Token.generate(payload, env.ACCESS_TOKEN_SECRET, env.ACCESS_TOKEN_EXPIRESIN as ms.StringValue),
        refresh: Token.generate(payload, env.REFRESH_TOKEN_SECRET, env.REFRESH_TOKEN_EXPIRESIN as ms.StringValue)
    }

    const newUserSecret = await UserSecret.update({ user_refresh_token: tokens.refresh.token }, { where: { user_id } });
    if (!newUserSecret) throw new Error(`Failed to login user [${user_email}]. Unable to update user refresh token`);

    res.cookie('access_token', tokens.access.token, { httpOnly: true, secure: true, sameSite: 'strict' });

    res.status(200).json({ ...tokens, payload: { user_id, user_email, user_name, user_role } });
});

export const logoutUserHandler = Route.asyncHandler(async (req, res) => {
    const user = req.user as Payload;
    if (!user) throw new Error(`Failed to logout user. User is not logged in`);

    const { user_id, user_email } = user;
    const userSecret = await UserSecret.update({ user_refresh_token: null }, { where: { user_id } });
    if (!userSecret) throw new Error(`Failed to logout user [${user_email}]. Unable to update user refresh token`);

    res.status(200).json({ message: `Successfully logged out user [${user_email}]` });
});
