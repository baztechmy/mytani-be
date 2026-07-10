import ch from "@harrypoggers25/color-utils";
import mqtt from "mqtt";

namespace Mqtt {
    export interface MqttClientConfig extends mqtt.IClientOptions {
        host: string
    };
    export interface MqttClientOptions {
        showMessage?: boolean;
    }
    export interface MqttClientConnectOptions {
        onConnect?: (date: Date) => (Promise<void> | void);
        onReconnect?: (date: Date) => (Promise<void> | void);
        onClose?: (date: Date) => (Promise<void> | void);
    }

    export class MqttClient {
        private config: MqttClientConfig;
        private client?: mqtt.MqttClient;
        private subscribedTopicHandlers: Record<string, (message: string) => (Promise<void> | void)>;
        private showMessage: boolean;
        private newTopics: Set<string>;

        constructor(config: MqttClientConfig, options?: MqttClientOptions) {
            options = {
                showMessage: options?.showMessage ?? true
            };

            this.subscribedTopicHandlers = {};
            this.showMessage = options.showMessage!;
            this.newTopics = new Set;
            this.config = config;
        }

        public setConfig(config: MqttClientConfig): boolean {
            if (this.client) {
                console.log(ch.red('MQTT SETCONFIG ERROR:'), 'Failed to set MQTT client config. There is currently already an active client');
                return false;
            }

            this.config = config;
            return true;
        }

        public async connect(options?: MqttClientConnectOptions) {
            this.client = (() => {
                try {
                    const client = mqtt.connect(this.config);
                    client.once('connect', async () => {
                        console.log(ch.green('MQTT CONNECT:'), `Client connected to MQTT broker at ${this.config.host}`);
                        try {
                            this.onEvents(client, options);
                            await options?.onConnect?.(new Date());
                        } catch (error: any) {
                            console.log(ch.red('MQTT ONCONNECT ERROR:'), error.message ?? error);
                        }
                    });

                    return client;
                } catch (error: any) {
                    console.log(ch.red('MQTT CONNECT:'), error.message ?? error);
                    return undefined;
                }
            })();
        }

        private onEvents(client: mqtt.MqttClient, options?: MqttClientConnectOptions) {
            client.on('reconnect', async () => {
                console.log(ch.green('MQTT RECONNECT:'), `Client reconnected to MQTT broker at ${this.config.host}`);
                try {
                    await options?.onReconnect?.(new Date());
                } catch (error: any) {
                    console.log(ch.red('MQTT ONRECONNECT ERROR:'), error.message ?? error);
                }
            })

            client.on('error', (error: any) => {
                console.log(ch.red('MQTT ERROR:'), error.message ?? error);
            });

            client.on('close', async () => {
                if (this.showMessage) console.log(ch.yellow('MQTT CLOSE:'), `Client closed connection from MQTT broker at ${this.config.host}`);
                try {
                    await options?.onClose?.(new Date());
                } catch (error: any) {
                    console.log(ch.red('MQTT ONCLOSE ERROR:'), error.message ?? error);
                }
            });

            client.on('offline', () => {
                if (this.showMessage) console.log(ch.yellow('MQTT OFFLINE:'), `MQTT broker at ${this.config.host} is offline`);
            });

            client.on('message', async (topic, message) => {
                if (this.newTopics.has(topic)) {
                    this.newTopics.delete(topic);
                    console.log(ch.green('MQTT SUBSCRIBE:'), `Client subscribed to MQTT topic ${topic}`);
                }

                if (this.showMessage) console.log(ch.yellow(`MQTT MESSAGE [${topic}]:`), `Client received message '${message.toString()}'`);
                await this.subscribedTopicHandlers[topic](message.toString());
            });
        }

        private offEvents() {
            if (!this.client) throw new Error('Client is not currently connected to an MQTT broker');
            this.client.removeAllListeners('reconnect');
            this.client.removeAllListeners('error');
            this.client.removeAllListeners('close');
            this.client.removeAllListeners('offline');
            this.client.removeAllListeners('message');
        }

        public disconnect(onDisconnect?: (date: Date) => (Promise<void> | void)) {
            try {
                if (!this.client) throw new Error('Client is not currently connected to an MQTT broker');

                this.offEvents();
                for (const topic of this.getTopics()) {
                    this.unsubscribe(topic);
                    delete this.subscribedTopicHandlers[topic];
                }
                this.client.end(() => {
                    console.log(ch.green('MQTT DISCONNECT:'), `Client disconnected from MQTT broker at ${this.config.host}`);

                    this.client = undefined;
                    onDisconnect?.(new Date);
                });
            } catch (error: any) {
                console.log(ch.red('MQTT DISCONNECT ERROR:'), error.message ?? error);
            }
        }

        public reconnect() {
            try {
                if (!this.client) throw new Error('Client is not currently connected to an MQTT broker');

                console.log(ch.green('MQTT RECONNECTING:'), `Client reconnecting to MQTT broker at ${this.config.host}`);
                this.client.reconnect();
            } catch (error: any) {
                console.log(ch.red('MQTT RECONNECT ERROR:'), error.message ?? error);
            }
        }

        public subscribe(topic: string, handler: (message: string) => (Promise<void> | void)) {
            try {
                if (!this.client) throw new Error('Client is not currently connected to an MQTT broker');
                if (this.getTopics().includes(topic)) {
                    throw new Error(`Client is already subscribed to the MQTT topic '${topic}'`);
                }
                if (this.newTopics.has(topic)) {
                    throw new Error(`Client subscribe to topic '${topic}' is already pending`);
                }

                this.newTopics.add(topic);
                this.subscribedTopicHandlers[topic] = handler;
                this.client.subscribe(topic, (error: any) => {
                    if (error) {
                        delete this.subscribedTopicHandlers[topic];
                        throw error;
                    }
                });
            } catch (error: any) {
                console.log(ch.red('MQTT SUBSCRIBE ERROR:'), error.message ?? error);
            }
        }

        public unsubscribe(topic: string) {
            try {
                if (!this.client) throw new Error('Client is not currently connected to an MQTT broker');
                if (!this.getTopics().includes(topic)) {
                    throw new Error(`Client is not subscribed to topic '${topic}'`);
                }

                this.client.unsubscribe(topic, (error: any) => {
                    if (error) throw error;

                    if (!this.newTopics.delete(topic)) console.log(ch.green('MQTT UNSUBSCRIBE:'), `Client unsubscribed to topic '${topic}'`);
                });
            } catch (error: any) {
                console.log(ch.red('MQTT UNSUBSCRIBE ERROR:'), error.message ?? error);
            }
        }

        public publish(topic: string, message: string) {
            try {
                if (!this.client) throw new Error('Client is not currently connected to an MQTT broker');
                this.client.publish(topic, message, (error: any) => {
                    if (error) throw error;

                    console.log(ch.green('MQTT PUBLISH:'), `Client published message '${message}' to MQTT topic ${topic}`);
                });
            } catch (error: any) {
                console.log(ch.red('MQTT PUBLISH ERROR:'), error.message ?? error);
            }
        }

        public getTopics() {
            return Object.keys(this.subscribedTopicHandlers);
        }
    }

    export function define(config: MqttClientConfig): MqttClient {
        return new MqttClient(config);
    }
}

export default Mqtt;
