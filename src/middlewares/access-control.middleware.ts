// MIDDLEWARE
import { Device, DeviceParam } from "../configs/db.config";
import { stringifyJson } from "../helpers/json.helper";
import { getPayload } from "./authorization.middleware";

// MODULE
import Route from "@harrypoggers25/route";

namespace AccessControl {
    export const roles = (roles: Array<string>) => {
        return Route.asyncHandler(async (req, res, next) => {
            const user = getPayload(req);
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
            const user = getPayload(req);
            const user_id = +req.params.user_id;

            if (!user) {
                res.status(403);
                throw new Error('Forbidden access. No session available');
            }

            if (!roles.includes(user.user_role) && user.user_id !== user_id) {
                res.status(403);
                throw new Error('Forbidden access. Admin role or Account owner access required');
            }

            next();
        })
    };

    export const rolesOrDeviceOwner = (roles: Array<string>) => {
        return Route.asyncHandler(async (req, res, next) => {
            const user = getPayload(req);
            const d_id = +req.params.d_id;

            if (!user) {
                res.status(403);
                throw new Error('Forbidden access. No session available');
            }
            const { user_id, user_role } = user;

            const device = await Device.find({ where: { d_id, user_id } });
            if (!device) {
                res.status(403);
                throw new Error(`Forbidden access. Unable to find device ${stringifyJson({ user_id })}`);
            }
            if (!roles.includes(user_role) && !device.length) {
                res.status(403);
                throw new Error('Forbidden access. Admin role or Account owner access required');
            }

            next();
        });
    }

    export const rolesOrDeviceParamOwner = (roles: Array<string>) => {
        return Route.asyncHandler(async (req, res, next) => {
            const user = getPayload(req);
            const dp_id = +req.params.dp_id;

            if (!user) {
                res.status(403);
                throw new Error('Forbidden access. No session available');
            }
            const { user_id, user_role } = user;

            const deviceParam = await DeviceParam.findByPk(dp_id)
            if (!deviceParam) {
                res.status(403);
                throw new Error(`Forbidden access. Unable to find device param [${dp_id}]`);
            }

            const d_id = deviceParam.d_id;
            const device = await Device.find({ where: { d_id, user_id } });
            if (!device) {
                res.status(403);
                throw new Error(`Forbidden access. Unable to find device ${stringifyJson({ user_id })}`);
            }
            if (!roles.includes(user_role) && !device.length) {
                res.status(403);
                throw new Error('Forbidden access. Admin role or Account owner access required');
            }

            next();
        });
    }
}

export default AccessControl;
