// MIDDLEWARE
import { Device, DeviceParam, User } from "../configs/db.config";
import { stringifyJson } from "../helpers/json.helper";
import { getPayload } from "./authorization.middleware";

// MODULE
import Route from "@harrypoggers25/route";

export type Roles = 'superadmin' | 'admin' | 'user';
export function stringifyRoles(roles: Array<Roles>): string {
    return roles.map(role => `'${role}'`).join(', ')
}
const isSuper = (role: Roles) => role === 'superadmin';

namespace AccessControl {
    export const roles = (roles: Array<Roles> = []) => {
        return Route.asyncHandler(async (req, res, next) => {
            const user = getPayload(req);
            if (!user) {
                res.status(403);
                throw new Error('Forbidden access. No session available');
            }

            const user_role = user.user_role as Roles;
            if (!isSuper(user_role) && !roles.includes(user_role)) {
                res.status(403);
                throw new Error('Forbidden access. Valid role required');
            }

            next();
        })
    };

    export const rolesOrAccountOwner = (roles: Array<Roles>) => {
    export const accountOwner = (roles: Array<Roles> = []) => {
        return Route.asyncHandler(async (req, res, next) => {
            const payload = getPayload(req);
            const user_id = +req.params.user_id;

            if (!payload) {
                res.status(403);
                throw new Error('Forbidden access. No session available');
            }

            const user_role = payload.user_role as Roles;
            if (!(isSuper(user_role) || roles.includes(user_role) && payload.user_id === user_id)) {
                res.status(403);
                throw new Error('Forbidden access. Valid role or Account owner access required');
            }

            next();
        })
    };

    export const rolesOrDeviceOwner = (roles: Array<Roles>) => {
        return Route.asyncHandler(async (req, res, next) => {
            const payload = getPayload(req);
            const d_id = +req.params.d_id;

            if (!payload) {
                res.status(403);
                throw new Error('Forbidden access. No session available');
            }

            const { user_id } = payload;
            const device = await Device.find({ where: { d_id, user_id } });
            if (!device) {
                res.status(403);
                throw new Error(`Forbidden access. Unable to find device ${stringifyJson({ d_id, user_id })}`);
            }

            const user_role = payload.user_role as Roles;
            if (!isSuper(user_role) && !roles.includes(user_role) && !device.length) {
                res.status(403);
                throw new Error('Forbidden access. Valid role or Account owner access required');
            }

            next();
        });
    }

    export const rolesOrDeviceParamOwner = (roles: Array<Roles> = []) => {
        return Route.asyncHandler(async (req, res, next) => {
            const payload = getPayload(req);
            const dp_id = +req.params.dp_id;

            if (!payload) {
                res.status(403);
                throw new Error('Forbidden access. No session available');
            }

            const { user_id } = payload;
            const deviceParam = await DeviceParam.findByPk(dp_id)
            if (!deviceParam) {
                res.status(403);
                throw new Error(`Forbidden access. Unable to find device param [${dp_id}]`);
            }

            const d_id = deviceParam.d_id;
            const device = await Device.find({ where: { d_id, user_id } });
            if (!device) {
                res.status(403);
                throw new Error(`Forbidden access. Unable to find device ${stringifyJson({ d_id, user_id })}`);
            }

            const user_role = payload.user_role as Roles;
            if (!isSuper(user_role) && !roles.includes(user_role) && !device.length) {
                res.status(403);
                throw new Error('Forbidden access. Valid role or Account owner access required');
            }

            next();
        });
    }
}

export default AccessControl;
