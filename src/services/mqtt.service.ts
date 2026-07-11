// CONFIGS
import { createDeviceData, db, Device, DeviceDatas } from "../configs/db.config";
import { mqttClient } from "../configs/mqtt.config";

// HELPERS
import { parseJson } from "../helpers/json.helper";
import Message from "../helpers/message.helper";

export const onConnectHandler = async () => {
    const devices = await Device.find();
    if (!devices) throw new Error('Failed to sync device data instances. Unable to find devices');

    for (const device of devices) {
        const { d_did, can_monitor, can_control, has_relay } = device;
        const topic_base = `pacer/${d_did}`;
        if (d_did === 'ccba97082958') {
            await mqttClient.subscribe(`${topic_base}/status`, message => { });
        } {
            await mqttClient.subscribe(`${topic_base}/heartbeat`, message => { });
        }

        if (can_monitor) {
            const transaction = await db.transaction({ rollbackOnError: true });
            if (!(await canMonitorHandler(device, false, transaction))) {
                throw new Error('Failed to create device data instance');
            }
            await transaction.commit();
        }
        if (can_control) {
            if (!(await canControlHandler(device))) {
                throw new Error('Failed to create device control subscribe instance');
            }
        }
        if (has_relay) {
            if (!(await hasRelayHandler(device))) {
                throw new Error('Failed to create device relay subscribe instance');
            }
        }

    }
}

export const canMonitorHandler = async (device: ReturnType<typeof Device.getEmptyModel>, alter: boolean, transaction?: any) => {
    const { d_id, d_did, can_monitor } = device;
    const topic = d_did === 'ccba97082958' ? `pacer/${d_did}/data` : `pacer/${d_did}/data/monitor`; // temporary solution

    if (can_monitor) {
        const deviceData = createDeviceData(d_id);
        if (!(await deviceData.sync({ alter, transaction }))) return false;
        return await mqttClient.subscribe(topic, async message => {
            const response = await deviceData.create({ raw_data: message, dd_date: new Date() });
            if (!response) throw new Error(Message.failed(['create', 'raw data', { d_id }]));
        });
    } else {
        await db.dropTable(DeviceDatas[d_id].tableName, { transaction });
        return await mqttClient.unsubscribe(topic);
    }

}

export const canControlHandler = async (device: ReturnType<typeof Device.getEmptyModel>) => {
    const { d_did, can_control } = device;
    const topic = `pacer/${d_did}/data/control`;

    if (can_control) {
        return await mqttClient.subscribe(topic, async (message, buffer) => {
            const { req_uuid } = parseJson(message);
            if (buffer.has(req_uuid)) {
                buffer.get(req_uuid)();
                buffer.remove(req_uuid);
            }
        });
    }

    return await mqttClient.unsubscribe(topic);
}

export const hasRelayHandler = async (device: ReturnType<typeof Device.getEmptyModel>) => {
    const { d_did, has_relay } = device;
    const topic = d_did === 'ccba97082958' ? `pacer/${d_did}/data` : `pacer/${d_did}/data/relays`; // temporary solution

    if (has_relay) {
        if (mqttClient.getTopics().includes(topic)) return;
        return await mqttClient.subscribe(topic, async (message, buffer) => {
            const { req_uuid = '' } = parseJson(message)
            if (buffer.has(req_uuid)) {
                buffer.get(req_uuid)();
                buffer.remove(req_uuid);
            }
        });
    } else {
        return await mqttClient.unsubscribe(topic);
    }
}

