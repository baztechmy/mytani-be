import Route from "@harrypoggers25/route";
import { Payload } from "./authorization.middleware";

namespace AccessControl {
    export const roles = (roles: Array<string>) => {
        return Route.asyncHandler(async (req, res, next) => {
            const user = req.user as Payload;
            if (!user) {
                res.status(403);
                throw new Error('Forbidden access. No session available');
            }

            if (!roles.some(role => role === user.user_role)) {
                res.status(403);
                throw new Error('Forbidden access. Admin role required');
            }

            next();
        })
    };

    export const rolesOrAccountOwner = (roles: Array<string>) => {
        return Route.asyncHandler(async (req, res, next) => {
            const user = req.user as Payload;
            const user_id = +req.params.user_id;

            if (!user) {
                res.status(403);
                throw new Error('Forbidden access. No session available');
            }

            if (!roles.some(role => role === user.user_role) && user.user_id !== user_id) {
                res.status(403);
                throw new Error('Forbidden access. Admin role or Account owner access required');
            }

            next();
        })
    };
}

export default AccessControl;
