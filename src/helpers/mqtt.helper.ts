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
        onDisconnect?: (date: Date, invokedDisconnect: boolean) => (Promise<void> | void);
    }

    export class MqttClient {
        private config: MqttClientConfig;
        private client?: mqtt.MqttClient;
        private subscribedTopicHandlers: Record<string, (message: string) => (Promise<void> | void)>;
        private showMessage: boolean;
        private newTopics: Array<string>;
        private invokedDisconnect: boolean;

        constructor(config: MqttClientConfig, options?: MqttClientOptions) {
            options = {
                showMessage: options?.showMessage ?? true
            };

            this.subscribedTopicHandlers = {};
            this.showMessage = options.showMessage!;
            this.newTopics = [];
            this.invokedDisconnect = false;

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

        public connect(options?: MqttClientConnectOptions) {
            this.client = (() => {
                try {
                    const client = mqtt.connect(this.config);
                    client.on('connect', async () => {
                        console.log(ch.green('MQTT CONNECT:'), `Client connected to MQTT broker at ${this.config.host}`);
                        try {
                            await options?.onConnect?.(new Date());
                        } catch (error: any) {
                            console.log(ch.red('MQTT ONCONNECT ERROR:'), error.message ?? error);
                        }
                    });

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
                            await options?.onDisconnect?.(new Date(), this.invokedDisconnect);
                        } catch (error: any) {
                            console.log(ch.red('MQTT ONDISCONNECT ERROR:'), error.message ?? error);
                        } finally {
                            this.invokedDisconnect = false;
                        }
                    });

                    client.on('offline', () => {
                        if (this.showMessage) console.log(ch.yellow('MQTT OFFLINE:'), `MQTT broker at ${this.config.host} is offline`);
                    });

                    client.on('message', async (topic, message) => {
                        if (this.newTopics.some(newTopic => newTopic === topic)) {
                            const index = this.newTopics.indexOf(topic);
                            if (index !== -1) this.newTopics.splice(index, 1);

                            console.log(ch.green('MQTT SUBSCRIBE:'), `Client subscribed to MQTT topic ${topic}`);
                        }

                        if (this.showMessage) console.log(ch.yellow(`MQTT MESSAGE [${topic}]:`), `Client received message '${message.toString()}'`);
                        await this.subscribedTopicHandlers[topic](message.toString());
                    });

                    return client;
                } catch (error: any) {
                    console.log(ch.red('MQTT CONNECT:'), error.message ?? error);
                    return undefined;
                }
            })();
        }

        public disconnect() {
            try {
                if (!this.client) throw new Error('Client is not currently connected to an MQTT broker');

                this.invokedDisconnect = true;
                this.client.end(() => {
                    console.log(ch.green('MQTT DISCONNECT:'), `Client disconnected from MQTT broker at ${this.config.host}`);

                    this.client = undefined;
                    this.subscribedTopicHandlers = {};
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
                if (Object.keys(this.subscribedTopicHandlers).includes(topic)) {
                    throw new Error(`Client is already subscribed to the MQTT topic '${topic}'`);
                }
                if (this.newTopics.some(oldTopic => oldTopic === topic)) {
                    throw new Error(`Client is already connecting to the MQTT topic '${topic}'`);
                }

                this.newTopics.push(topic);
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
    }

    export function define(config: MqttClientConfig): MqttClient {
        return new MqttClient(config);
    }
}

export default Mqtt;
