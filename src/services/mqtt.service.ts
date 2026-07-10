// CONFIGS
import { createDeviceData, Device } from "../configs/db.config";
import { mqttClient } from "../configs/mqtt.config";

export const onConnectHandler = async () => {
    const devices = await Device.find();
    if (!devices) throw new Error('Failed to sync device data instances. Unable to find devices');

    for (const device of devices) {
        const { d_id, d_did, can_monitor, can_control, has_relay } = device;
        const topic_base = `pacer/${d_did}`;
        mqttClient.subscribe(`${topic_base}/status`, message => { });

        if (can_monitor) {
            createDeviceData(d_id);
            mqttClient.subscribe(`${topic_base}/data`, message => { });
        }
    }
}
