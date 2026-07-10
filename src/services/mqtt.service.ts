// CONFIGS
import { createDeviceData, db, Device, DeviceDatas } from "../configs/db.config";
import { mqttClient } from "../configs/mqtt.config";

// HELPERS
import { parseJson } from "../helpers/json.helper";

export const onConnectHandler = async () => {
    const devices = await Device.find();
    if (!devices) throw new Error('Failed to sync device data instances. Unable to find devices');

    for (const device of devices) {
        const { d_id, d_did, can_monitor, can_control, has_relay } = device;
        const topic_base = `pacer/${d_did}`;
        mqttClient.subscribe(`${topic_base}/status`, message => { });

        if (has_relay) await hasRelayHandler(device);
    }
}

export const hasRelayHandler = async (device: ReturnType<typeof Device.getEmptyModel>) => {
    const { d_did, has_relay } = device;
    const topic = d_did === 'ccba97082958' ? `pacer/${d_did}/data` : `pacer/${d_did}/data/relays`; // temporary solution

    if (has_relay) {
        if (mqttClient.getTopics().includes(topic)) return;
        mqttClient.subscribe(topic, async (message, buffer) => {
            const { req_uuid = '' } = parseJson(message)
            if (buffer.has(req_uuid)) {
                buffer.get(req_uuid)();
                buffer.remove(req_uuid);
            }
        });
    } else {
        mqttClient.unsubscribe(topic);
    }
}

