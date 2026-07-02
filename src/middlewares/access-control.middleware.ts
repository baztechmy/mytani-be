// MIDDLEWARE
import { Device, Site, User } from "../configs/db.config";
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
            res.status(403);
            const user = getPayload(req);
            if (!user) throw new Error('Forbidden access. No session available');

            const user_role = user.user_role as Roles;
            if (!(isSuper(user_role) || roles.includes(user_role))) throw new Error('Forbidden access. Valid role required');

            res.status(200);
            next();
        })
    };

    export const companyAccount = (roles: Array<Roles> = []) => {
        return Route.asyncHandler(async (req, res, next) => {
            const payload = getPayload(req);
            const comp_id = +req.params.comp_id;

            res.status(403);
            if (!payload) throw new Error('Forbidden access. No session available');

            const user_role = payload.user_role as Roles;
            const isValidCompanyAndRole = roles.includes(user_role) && payload.comp_id === comp_id;
            if (!(isSuper(user_role) || isValidCompanyAndRole)) {
                throw new Error('Forbidden access. Valid role or Company account access required');
            }
            res.status(200);
            next();
        });
    }

    export const accountOwner = (roles: Array<Roles> = []) => {
        return Route.asyncHandler(async (req, res, next) => {
            const payload = getPayload(req);
            const user_id = +req.params.user_id;

            res.status(403);
            if (!payload) throw new Error('Forbidden access. No session available');

            const user = await User.findByPk(user_id);
            if (!user) throw new Error(`Forbidden access. Unable to find user [${user_id}]`);

            const user_role = payload.user_role as Roles;
            const isValidCompanyAndRole = roles.includes(user_role) && payload.comp_id === user.comp_id;
            if (!(isSuper(user_role) || isValidCompanyAndRole || payload.user_id === user_id)) {
                throw new Error('Forbidden access. Valid role or Account owner access required');
            }

            res.status(200);
            next();
        })
    };

    export const siteOwner = (roles: Array<Roles> = []) => {
        return Route.asyncHandler(async (req, res, next) => {
            const payload = getPayload(req);
            const site_id = +req.params.site_id;

            res.status(403);
            if (!payload) throw new Error('Forbidden access. No session available');

            const site = await Site.findByPk(site_id);
            if (!site) throw new Error(`Forbidden access. Unable to find site [${site_id}]`);

            const user_role = payload.user_role as Roles;
            const isValidCompanyAndRole = roles.includes(user_role) && payload.comp_id === site.comp_id;
            if (!(isSuper(user_role) || isValidCompanyAndRole)) {
                throw new Error('Forbidden access. Valid role or Site owner access required');
            }

            res.status(200);
            next();
        });
    }

    export const deviceOwner = (roles: Array<Roles> = []) => {
        return Route.asyncHandler(async (req, res, next) => {
            const payload = getPayload(req);
            const d_id = +req.params.d_id;

            res.status(403);
            if (!payload) throw new Error('Forbidden access. No session available');

            const device = await Device.findByPk(d_id);
            if (!device) throw new Error(`Forbidden access. Unable to find device [${d_id}]`);

            const user_role = payload.user_role as Roles;
            const isValidCompanyAndRole = roles.includes(user_role) && payload.comp_id === device.comp_id;
            if (!(isSuper(user_role) || isValidCompanyAndRole)) {
                throw new Error('Forbidden access. Valid role or Device owner access required');
            }

            res.status(200);
            next();
        });
    }
}

export default AccessControl;
