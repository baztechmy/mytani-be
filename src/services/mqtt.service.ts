// CONFIGS
import { createDeviceData, Device } from "../configs/db.config";
import { mqttClient } from "../configs/mqtt.config";

export const onConnectHandler = async () => {
    const devices = await Device.find();
    if (!devices) throw new Error('Failed to sync device data instances. Unable to find devices');

    for (const { d_id, can_monitor, can_control, has_relay } of devices) {
        mqttClient.subscribe(`pacer/${d_id}/status`, message => { });

        if (can_monitor) {
            createDeviceData(d_id);
            mqttClient.subscribe(`pacer/${d_id}/data`, message => { });
        }
    }
}
