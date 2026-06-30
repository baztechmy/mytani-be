// CONFIGS
import { UserSecret } from '../configs/db.config';
import env from '../configs/env.config';

// MODULES
import Route from '@harrypoggers25/route';

// HELPERS
import Token from '../helpers/token.helper';

export type Payload = { user_id: number, user_email: string, user_name: string, user_role: string, comp_id: number, login_id: number };
export function getPayload(req: Route.ERequest) {
    return req.user as Payload;
}

namespace Authorize {
    export const accesstoken = Route.asyncHandler(async (req, res, next) => {
        const access_token = req.cookies?.access_token;
        if (!access_token) {
            res.status(401);
            throw new Error('Unauthorized access. No access token provided for request');
        }

        const verifiedAToken = Token.verify(access_token, env.ACCESS_TOKEN_SECRET);
        if (verifiedAToken.isExpired) {
            res.status(401);
            throw new Error('Unauthorized access. Access token has expired');
        }
        if (!verifiedAToken.isValid) {
            res.status(401);
            throw new Error('Unauthorized access. Access token is invalid');
        }

        const aPayload = verifiedAToken.payload as Payload;
        const { user_id } = aPayload;
        const userSecrets = await UserSecret.find({ where: { user_id } });
        if (!userSecrets) throw new Error(`Failed to authorize user access [${user_id}]. Unable to fetch user refresh token`);
        if (!userSecrets.length) throw new Error(`Failed to authorize access [${user_id}]. User refresh token not found`);

        const refresh_token = userSecrets[0].user_refresh_token;
        if (!refresh_token) {
            res.status(401);
            throw new Error(`Unauthorized access. No session available`);
        }

        const verifiedRToken = Token.verify(refresh_token, env.REFRESH_TOKEN_SECRET);
        if (verifiedRToken.isExpired) {
            res.status(401);
            throw new Error('Unauthorized access. Session has expired');
        }
        if (!verifiedRToken.isValid) {
            res.status(401);
            throw new Error('Unauthorized access. Refresh token is invalid');
        }

        const rPayload = verifiedRToken.payload as Payload;
        if (aPayload.login_id !== rPayload.login_id) {
            res.status(401);
            throw new Error('Unauthorized access. Token login id do not match');
        }

        req.user = aPayload;
        next();
    });
}

export default Authorize;
