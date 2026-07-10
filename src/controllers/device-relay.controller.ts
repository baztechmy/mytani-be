// CONFIGS
import { db, Device, DeviceRelay } from "../configs/db.config";
import { mqttClient } from "../configs/mqtt.config";

// HELPERS
import Message from "../helpers/message.helper";
import { isArrayObj, stringifyJson } from "../helpers/json.helper";

// MODULES
import Route from "@harrypoggers25/route";
import { nanoid } from "nanoid";

// MIDDLEWARES
import AccessControl from "../middlewares/access-control.middleware";
import { getPayload } from "../middlewares/authorization.middleware";

// SERVICES
import { createUserActivityLog } from "../services/user-activity-log.service";
import { hasRelayHandler } from "../services/mqtt.service";

export namespace DeviceRelayHandler {
    export const createByDevice = Route.asyncHandler(async (req, res) => {
        const date = new Date();

        const d_id = +req.params.d_id;
        const { dr_names } = req.body;
        const [created_at, updated_at] = [date, date];
        const transaction = await db.transaction({ rollbackOnError: true });

        if (!isArrayObj<string>(dr_names, name => typeof name === 'string')) {
            res.status(400);
            throw new Error(Message.failed(['create', 'new device relays', { d_id }], {
                subMessage: 'dr_names must be an array of strings'
            }));
        }

        const oldDeviceRelays = await DeviceRelay.delete({ where: { d_id }, transaction });
        if (!oldDeviceRelays) throw new Error(Message.failed(['create', 'new device relays', { d_id }], {
            causer: ['delete', 'old device relays', { d_id }],
        }));

        const deviceRelays: Array<ReturnType<typeof DeviceRelay.getEmptyModel>> = [];
        for (const dr_name of dr_names) {
            const deviceRelay = await DeviceRelay.create({ dr_name, created_at, updated_at, d_id }, {
                transaction
            });
            if (!deviceRelay) throw new Error(Message.failed(['create', 'new device relays', { d_id }], {
                causer: ['add', 'device relay', { dr_name }],
            }));
            deviceRelays.push(deviceRelay);
        }

        if (!AccessControl.fromReq(req).device.has_relay) {
            const device = await Device.updateByPk(d_id, { has_relay: true }, { transaction });
            if (!device) throw new Error(Message.failed(['create', 'new device relay', { d_id }], {
                subMessage: 'Unable to toggle has_relay on device'
            }));

            await hasRelayHandler(device);
        }

        const ual = await createUserActivityLog({
            ual_type: 'DEVICE_RELAYS_CREATE',
            ual_activity: Message.success(['create', 'new device relay', { d_id }]),
            user_id: getPayload(req).user_id
        }, transaction);
        if (!ual) throw new Error(Message.failed(['create', 'device relay', { d_id }], {
            causer: ['create', 'new user activity log']
        }));

        await transaction.commit();
        res.status(201).json(deviceRelays);
    });

    export const addByDevice = Route.asyncHandler(async (req, res) => {
        const date = new Date();

        const d_id = +req.params.d_id;
        const { dr_name } = req.body;
        const [created_at, updated_at] = [date, date];
        const transaction = await db.transaction({ rollbackOnError: true });

        const deviceRelay = await DeviceRelay.create({ dr_name, created_at, updated_at, d_id }, {
            transaction
        });
        if (!deviceRelay) throw new Error(Message.failed(['add', 'new device relay', { d_id }]));

        if (!AccessControl.fromReq(req).device.has_relay) {
            const device = await Device.updateByPk(d_id, { has_relay: true }, { transaction });
            if (!device) throw new Error(Message.failed(['add', 'new device relay', { d_id }], {
                causer: ['update', 'device']
            }));

            await hasRelayHandler(device);
        }

        const ual = await createUserActivityLog({
            ual_type: 'DEVICE_RELAY_ADD',
            ual_activity: Message.success(['add', 'new device relay', { d_id }]),
            user_id: getPayload(req).user_id
        }, transaction);
        if (!ual) throw new Error(Message.failed(['create', 'device relay', { d_id }], {
            causer: ['create', 'new user activity log']
        }));

        await transaction.commit();
        res.status(201).json(deviceRelay);
    });

    export const findAllByDevice = Route.asyncHandler(async (req, res) => {
        const d_id = +req.params.d_id;
        const deviceRelays = await DeviceRelay.find({ where: { d_id }, orderBy: { d_id: 'ASC' } });
        if (!deviceRelays) throw new Error(Message.failed(['find', 'all device relays', { d_id }]));

        res.status(200).json(deviceRelays);
    });

    export const find = Route.asyncHandler(async (req, res) => {
        const d_id = +req.params.d_id;
        const dr_id = +req.params.dr_id;
        const deviceRelay = await DeviceRelay.findByPk(dr_id, { where: { d_id } });
        if (!deviceRelay) throw new Error(Message.failed(['find', 'device relay', dr_id]));

        res.status(200).json(deviceRelay);
    })

    export const update = Route.asyncHandler(async (req, res) => {
        const d_id = +req.params.d_id;
        const dr_id = +req.params.dr_id;
        const { dr_name } = req.body;
        const transaction = await db.transaction({ rollbackOnError: true });

        const deviceRelay = await DeviceRelay.updateByPk(dr_id,
            { dr_name },
            { where: { d_id }, transaction }
        );
        if (!deviceRelay) throw new Error(Message.failed(['update', 'device relay', dr_id]));

        const ual = await createUserActivityLog({
            ual_type: 'DEVICE_RELAY_UPDATE',
            ual_activity: Message.success(['update', 'device relay', dr_id]),
            user_id: getPayload(req).user_id
        }, transaction);
        if (!ual) throw new Error(Message.failed(['update', 'device_relay', dr_id], {
            causer: ['create', 'new user activity log']
        }));

        await transaction.commit();
        res.status(200).json(deviceRelay);
    });

    export const controlAllByDevice = Route.asyncHandler(async (req, res) => {
        const d_id = +req.params.d_id;
        const { current_states } = req.body;
        const transaction = await db.transaction({ rollbackOnError: true });

        const device = AccessControl.fromReq(req).device;
        if (!device.has_relay) {
            throw new Error(Message.failed(['control', 'device relays', { d_id }], {
                subMessage: 'has_relay must be toggled on'
            }));
        }

        if (!isArrayObj<number>(current_states, state => state === 1 || state === 0)) {
            res.status(400);
            throw new Error(Message.failed(['control', 'device relays', { d_id }], {
                subMessage: 'current_states must be an array of 1s and 0s'
            }));
        }

        const deviceRelays = await DeviceRelay.find({ where: { d_id }, orderBy: { d_id: 'ASC' }, transaction });
        if (!deviceRelays) throw new Error(Message.failed(['control', 'device relays', { d_id }], {
            causer: ['find', 'device relays']
        }));
        if (current_states.length !== deviceRelays.length) throw new Error(Message.failed(['control', 'device relays', { d_id }], {
            subMessage: 'relay count does not match'
        }));

        const updatedDeviceRelays = [];
        for (let i = 0; i < current_states.length; i++) {
            const { dr_id } = deviceRelays[i];
            const previous_state = deviceRelays[i].current_state;
            const current_state = current_states[i] === 0 ? false : true;
            const updatedDeviceRelay = await DeviceRelay.updateByPk(dr_id, { current_state, previous_state }, { transaction });
            if (!updatedDeviceRelay) throw new Error(Message.failed(['control', 'device relays', { d_id }], {
                causer: ['update', 'device relay', dr_id]
            }));
            updatedDeviceRelays.push(updatedDeviceRelay);
        }

        // MQTT LOGIC
        const temp = 'ccba97082958';
        const { d_did } = device;
        const topic = d_did === temp ? `pacer/${d_did}/control` : `pacer/${d_did}/control/relays`;
        const uuid = d_did === temp ? '' : nanoid(16);
        // const uuid = nanoid(16);
        const message = stringifyJson({ outputs: current_states, req_uuid: uuid });
        const publish = await mqttClient.publish(topic, message, { uuid });
        if (!publish) {
            await transaction.rollback();
            throw new Error(Message.failed(['control', 'device relays', { d_id }], {
                subMessage: 'MQTT publish response in invalid'
            }));
        }

        await transaction.commit();
        res.status(200).json(updatedDeviceRelays);
    });

    export const control = Route.asyncHandler(async (req, res) => {
        const d_id = +req.params.d_id;
        const dr_id = +req.params.dr_id;
        const { current_state } = req.body;
        const transaction = await db.transaction({ rollbackOnError: true });

        const device = AccessControl.fromReq(req).device;
        if (!device.has_relay) {
            throw new Error(Message.failed(['control', 'device relay', { d_id }], {
                subMessage: 'has_relay must be toggled on'
            }));
        }

        if (current_state === undefined) throw new Error(Message.failed(['control', 'device relay', dr_id], {
            subMessage: 'current_state is required'
        }));

        const deviceRelays = await DeviceRelay.find({ where: { d_id }, orderBy: { d_id: 'ASC' }, transaction });
        if (!deviceRelays) throw new Error(Message.failed(['control', 'device relay', dr_id], {
            causer: ['find', 'device relays']
        }));

        const index = deviceRelays.findIndex(deviceRelay => deviceRelay.dr_id === dr_id);
        if (index === -1) {
            res.status(404);
            throw new Error(Message.failed(['control', 'device relay', dr_id], {
                subMessage: `Device relay ${dr_id} not found`
            }));
        }

        const previous_state = deviceRelays[index].current_state;
        const updatedDeviceRelay = await DeviceRelay.updateByPk(dr_id, { current_state, previous_state }, { transaction });
        if (!updatedDeviceRelay) throw new Error(Message.failed(['control', 'device relays', { d_id }], {
            causer: ['update', 'device relay', dr_id]
        }));

        // MQTT LOGIC
        const temp = 'ccba97082958';
        const { d_did } = device;
        const topic = d_did === temp ? `pacer/${d_did}/control` : `pacer/${d_did}/control/relays`;
        const uuid = d_did === temp ? '' : nanoid(16);
        const message = stringifyJson({ output: index + 1, state: current_state, req_uuid: uuid });
        const publish = await mqttClient.publish(topic, message, { uuid });
        if (!publish) {
            await transaction.rollback();
            throw new Error(Message.failed(['control', 'device relays', { d_id }], {
                subMessage: 'MQTT publish response in invalid'
            }));
        }

        await transaction.commit();
        res.status(200).json(updatedDeviceRelay);
    });

    export const removeAllByDevice = Route.asyncHandler(async (req, res) => {
        const d_id = +req.params.d_id;
        const transaction = await db.transaction({ rollbackOnError: true });

        const deviceRelays = await DeviceRelay.delete({ where: { d_id }, transaction });
        if (!deviceRelays || !deviceRelays.length) throw new Error(Message.failed(['delete', 'all device relays', { d_id }]));

        const device = await Device.updateByPk(d_id, { has_relay: false }, { transaction });
        if (!device) throw new Error(Message.failed(['delete', 'all device relays', { d_id }], {
            subMessage: 'Unable to toggle has_relay on device'
        }));

        if (!(await hasRelayHandler(device))) {
            await transaction.rollback();
            throw new Error(Message.failed(['delete', 'all device relays', { d_id }], {
                subMessage: 'Unable to unsubscribe to mqtt topic'
            }))
        };

        const ual = await createUserActivityLog({
            ual_type: 'DEVICE_RELAY_DELETE_ALL',
            ual_activity: Message.success(['delete', 'all device relays', { d_id }]),
            user_id: getPayload(req).user_id
        }, transaction);
        if (!ual) throw new Error(Message.failed(['delete', 'device relay', { d_id }], {
            causer: ['create', 'new user activity log']
        }));

        await transaction.commit();
        res.status(200).json(deviceRelays);
    });

    export const remove = Route.asyncHandler(async (req, res) => {
        const d_id = +req.params.d_id;
        const dr_id = +req.params.dr_id;
        const transaction = await db.transaction({ rollbackOnError: true });

        const deviceRelay = await DeviceRelay.deleteByPk(dr_id, { where: { d_id }, transaction });
        if (!deviceRelay) throw new Error(Message.failed(['delete', 'device relay', dr_id]));

        const deviceRelays = await DeviceRelay.find({ where: { d_id }, transaction });
        if (!deviceRelays) throw new Error(Message.failed(['delete', 'device relay', dr_id], {
            causer: ['find', 'remaining device relays']
        }));

        if (!deviceRelays.length) {
            const device = await Device.updateByPk(d_id, { has_relay: false }, { transaction });
            if (!device) throw new Error(Message.failed(['delete', 'device relay', dr_id], {
                subMessage: 'Unable to toggle has_relay on device'
            }));

            if (!(await hasRelayHandler(device))) {
                await transaction.rollback();
                throw new Error(Message.failed(['delete', 'all device relays', { d_id }], {
                    subMessage: 'Unable to unsubscribe to mqtt topic'
                }))
            };
        }

        const ual = await createUserActivityLog({
            ual_type: 'DEVICE_RELAY_DELETE',
            ual_activity: Message.success(['delete', 'device relay', dr_id]),
            user_id: getPayload(req).user_id
        }, transaction);
        if (!ual) throw new Error(Message.failed(['delete', 'device relay', dr_id], {
            causer: ['create', 'new user activity log']
        }));

        await transaction.commit();
        res.status(200).json(deviceRelay);
    });
}
