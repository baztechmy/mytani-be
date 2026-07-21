import Mqtt from "../helpers/mqtt.helper";
import env from "./env.config";

export const mqttClient = Mqtt.define({
    host: env.MQTT_HOST,
    username: env.MQTT_USER,
    password: env.MQTT_PASSWORD,
    port: env.MQTT_PORT,
    protocol: 'mqtt',
}, { timeout_ms: 10000 });

