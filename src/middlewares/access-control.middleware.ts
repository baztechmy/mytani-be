// MIDDLEWARE
import { Device, DeviceRelay, Site, User } from "../configs/db.config";
import { getPayload } from "./authorization.middleware";

// MODULE
import Route from "@harrypoggers25/route";

export type Roles = 'superadmin' | 'admin' | 'user';
export function stringifyRoles(roles: Array<Roles>): string {
    return roles.map(role => `'${role}'`).join(', ')
}
const isSuper = (role: Roles) => role === 'superadmin';

namespace AccessControl {
    export const fromReq = (req: any) => ({
        site: req.site as ReturnType<typeof Site.getEmptyModel>,
        device: req.device as ReturnType<typeof Device.getEmptyModel>,
        deviceRelay: req.deviceRelay as ReturnType<typeof DeviceRelay.getEmptyModel>,
    });

    const findPayload = (req: Route.ERequest) => {
        const payload = getPayload(req);
        if (!payload) throw new Error('Forbidden access. No session available');

        return payload;
    }
    export const roles = (roles: Array<Roles> = []) => {
        return Route.asyncHandler(async (req, res, next) => {
            res.status(403);
            const payload = findPayload(req);
            const user_role = payload.user_role as Roles;

            const isValidRole = roles.includes(user_role);
            if (!(isSuper(user_role) || isValidRole)) throw new Error('Forbidden access. Valid role required');

            res.status(200);
            next();
        })
    };

    export const companyAccount = (roles: Array<Roles> = []) => {
        return Route.asyncHandler(async (req, res, next) => {
            res.status(403);
            const payload = findPayload(req);
            const user_role = payload.user_role as Roles;
            const comp_id = +req.params.comp_id;

            const isValidRole = roles.includes(user_role)
            const isValidCompany = payload.comp_id === comp_id;
            if (!(isSuper(user_role) || (isValidRole && isValidCompany))) {
                throw new Error('Forbidden access. Valid role or company account access required');
            }

            res.status(200);
            next();
        });
    }

    export const accountOwner = (roles: Array<Roles> = []) => {
        return Route.asyncHandler(async (req, res, next) => {
            res.status(403);
            const payload = findPayload(req);
            const user_role = payload.user_role as Roles;
            const user_id = +req.params.user_id;
            const user = await User.findByPk(user_id);
            if (!user) throw new Error(`Forbidden access. Unable to find user [${user_id}]`);

            const isValidRole = roles.includes(user_role);
            const isValidCompanyAccount = payload.comp_id === user.comp_id;
            const isAccountOwner = payload.user_id === user_id;
            if (!(isSuper(user_role) || isAccountOwner || (isValidRole && isValidCompanyAccount))) {
                throw new Error('Forbidden access. Valid role or Account owner access required');
            }

            res.status(200);
            next();
        })
    };

    export const siteOwner = (roles: Array<Roles> = []) => {
        return Route.asyncHandler(async (req, res, next) => {
            res.status(403);
            const payload = findPayload(req);
            const user_role = payload.user_role as Roles;
            const site_id = +req.params.site_id;
            const site = await Site.findByPk(site_id);
            if (!site) throw new Error(`Forbidden access. Unable to find site [${site_id}]`);

            const isValidRole = roles.includes(user_role);
            const isValidCompanySite = payload.comp_id === site.comp_id;
            if (!(isSuper(user_role) || (isValidRole && isValidCompanySite))) {
                throw new Error('Forbidden access. Valid role or Site owner access required');
            }

            (req as any).site = site;
            res.status(200);
            next();
        });
    }

    const findDevice = async (d_id: number) => {
        const device = await Device.findByPk(d_id);
        if (!device) throw new Error(`Forbidden access. Unable to find device [${d_id}]`);

        return device;
    }
    export const deviceOwner = (roles: Array<Roles> = []) => {
        return Route.asyncHandler(async (req, res, next) => {
            res.status(403);
            const payload = findPayload(req);
            const user_role = payload.user_role as Roles;
            const d_id = +req.params.d_id;
            const device = await findDevice(d_id);

            const isValidRole = roles.includes(user_role);
            const isValidCompany = payload.comp_id === device.comp_id;
            if (!(isSuper(user_role) || (isValidRole && isValidCompany))) {
                throw new Error('Forbidden access. Valid role or Device ownership access required');
            }

            (req as any).device = device;
            res.status(200);
            next();
        });
    }

    const findDeviceRelay = async (dr_id: number) => {
        const deviceRelay = await DeviceRelay.findByPk(dr_id);
        if (!deviceRelay) throw new Error(`Forbidden access. Unable to find device relay [${dr_id}]`);

        return deviceRelay;
    }
    export const deviceRelayOwner = (roles: Array<Roles> = []) => {
        return Route.asyncHandler(async (req, res, next) => {
            res.status(403);
            const payload = findPayload(req);
            const user_role = payload.user_role as Roles;
            const d_id = +req.params.d_id;
            const dr_id = +req.params.dr_id;
            const device = await findDevice(d_id);
            const deviceRelay = await findDeviceRelay(dr_id);

            const isValidRole = roles.includes(user_role);
            const isValidCompanyDevice = payload.comp_id === device.comp_id;
            const isValidDeviceRelay = d_id === deviceRelay.d_id;
            if (!(isSuper(user_role) || (isValidRole && isValidCompanyDevice && isValidDeviceRelay))) {
                throw new Error('Forbidden access. Valid role or Device relay ownership access required');
            }

            (req as any).device = device;
            (req as any).deviceRelay = deviceRelay;
            res.status(200);
            next();
        });
    }
}

export default AccessControl;
