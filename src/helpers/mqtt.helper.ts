// MODULES
import ch from "@harrypoggers25/color-utils";
import mqtt from "mqtt";

namespace Mqtt {
    export interface MqttClientConfig extends mqtt.IClientOptions {
        host: string
    };
    export interface MqttClientOptions {
        showMessage?: boolean;
        timeout_ms?: number;
    }
    export interface MqttClientConnectOptions {
        onConnect?: (date: Date) => (Promise<void> | void);
        onReconnect?: (date: Date) => (Promise<void> | void);
        onClose?: (date: Date) => (Promise<void> | void);
    }

    function timedHandler(timeout_ms: number, handler: (end: () => void) => Promise<void>, errorHandler: (error: any) => void | Promise<void>): () => Promise<boolean> {
        return async () => {
            let timer: NodeJS.Timeout | undefined;
            const response = await Promise.race<{ success: boolean, error?: any }>([
                new Promise(resolve => {
                    timer = setTimeout(() => resolve({
                        success: false,
                        error: new Error('Request timed out')
                    }), timeout_ms);
                }),
                new Promise(resolve => {
                    const end = () => resolve({ success: true });
                    handler(end).catch(error => resolve({ success: false, error }));
                }),
            ]);
            if (!response.success) await errorHandler(response.error);
            if (timer) clearTimeout(timer);

            return response.success;
        }
    }

    class Buffer {
        private buffer: Record<string, string>;
        private expiry: Record<string, number>;
        private lifespan_ms: number;

        constructor(lifespan_ms?: number) {
            this.buffer = {};
            this.expiry = {};
            this.lifespan_ms = lifespan_ms ?? 10000; // 10 seconds
        }
        public add(uuid: string, message: string) {
            const now = Date.now();
            for (const [key, val] of Object.entries(this.expiry)) {
                if (now >= val) this.remove(key);
            }

            this.buffer[uuid] = message;
            this.expiry[uuid] = now + this.lifespan_ms;
        }
        public get(uuid: string) {
            return this.buffer[uuid];
        }
        public has(uuid: string) {
            if (this.buffer[uuid]) return true;
            return false;
        }
        public remove(uuid: string) {
            if (this.buffer[uuid]) {
                delete this.expiry[uuid];
                delete this.buffer[uuid];
            }
        }
    }

    export class MqttClient {
        private config: MqttClientConfig;
        private client?: mqtt.MqttClient;
        private subscribedTopicHandlers: Record<string, (message: string, buffer: Buffer) => (Promise<void> | void)>;
        private showMessage: boolean;
        private newTopics: Set<string>;
        private timeout_ms: number;
        private buffer: Buffer;

        constructor(config: MqttClientConfig, options?: MqttClientOptions) {
            options = {
                showMessage: options?.showMessage ?? true,
                timeout_ms: options?.timeout_ms ?? 10000, // 10 seconds
            };

            this.subscribedTopicHandlers = {};
            this.showMessage = options.showMessage!;
            this.newTopics = new Set;
            this.timeout_ms = options.timeout_ms!;
            this.buffer = new Buffer(this.timeout_ms);
            this.config = config;
        }

        public getTopics() {
            return Object.keys(this.subscribedTopicHandlers);
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
            return await timedHandler(this.timeout_ms, async end => {
                const client = mqtt.connect(this.config);
                client.once('connect', async () => {
                    console.log(ch.green('MQTT CONNECT:'), `Client connected to MQTT broker at ${this.config.host}`);
                    try {
                        this.onEvents(client, options);
                        await options?.onConnect?.(new Date());
                    } catch (error: any) {
                        console.log(ch.red('MQTT ONCONNECT ERROR:'), error.message ?? error);
                    } finally {
                        end();
                    }
                });
                this.client = client;
            }, error => {
                console.log(ch.red('MQTT CONNECT ERROR:'), error.message ?? error);
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
                try {
                    if (this.newTopics.has(topic)) return;

                    if (this.showMessage) console.log(ch.yellow(`MQTT MESSAGE [${topic}]:`), `Client received message '${message.toString()}'`);
                    await this.subscribedTopicHandlers[topic](message.toString(), this.buffer);
                } catch (error: any) {
                    console.log(ch.red(`MQTT MESSAGE ERROR [${topic}]:`), error.message ?? error);
                }
            });
        }

        private offEvents() {
            if (!this.client) throw new Error('Client is not currently connected to an MQTT broker');
            for (const listener of ['reconnect', 'error', 'close', 'offline', 'message',]) {
                this.client.removeAllListeners(listener as any);
            }
        }

        public async disconnect(onDisconnect?: (date: Date) => (Promise<void> | void)) {
            return await timedHandler(this.timeout_ms, async end => {
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
                    end();
                });
            }, error => {
                console.log(ch.red('MQTT DISCONNECT ERROR:'), error.message ?? error);
            })();
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

        public subscribe(topic: string, handler: (message: string, buffer: Buffer) => (Promise<void> | void)) {
            return timedHandler(this.timeout_ms, async end => {
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

                    console.log(ch.green('MQTT SUBSCRIBE:'), `Client subscribed to MQTT topic ${topic}`);
                    this.newTopics.delete(topic);
                    end();
                });
            }, error => {
                console.log(ch.red('MQTT SUBSCRIBE ERROR:'), error.message ?? error);
            })();
        }

        public async unsubscribe(topic: string) {
            return await timedHandler(this.timeout_ms, async end => {
                if (!this.client) throw new Error('Client is not currently connected to an MQTT broker');
                if (!this.getTopics().includes(topic)) {
                    throw new Error(`Client is not subscribed to topic '${topic}'`);
                }

                this.client.unsubscribe(topic, (error: any) => {
                    if (error) throw error;

                    if (!this.newTopics.delete(topic)) console.log(ch.green('MQTT UNSUBSCRIBE:'), `Client unsubscribed to topic '${topic}'`);
                    end();
                });
            }, error => {
                console.log(ch.red('MQTT UNSUBSCRIBE ERROR:'), error.message ?? error);
            })();
        }

        public async publish(topic: string, message: string, response?: { uuid: string, callback: (message: string) => Promise<void> }) {
            return await timedHandler(this.timeout_ms, async end => {
                if (!this.client) throw new Error('Client is not currently connected to an MQTT broker');

                if (response) this.buffer.remove(response.uuid);
                this.client.publish(topic, message, (error: any) => {
                    if (error) throw error;

                    if (!response) {
                        console.log(ch.green(`MQTT PUBLISH [${topic}]:`), `Client published message '${message}' to MQTT topic ${topic}`);
                        end();
                        return;
                    }

                    console.log(ch.yellow(`MQTT PUBLISH [${topic}]:`), `Client published message '${message}' to MQTT topic ${topic}. Awaiting for response`);
                    const interval = setInterval(async () => {
                        if (this.buffer.has(response.uuid)) {
                            await response.callback(this.buffer.get(response.uuid));
                            clearInterval(interval);
                            console.log(ch.green(`MQTT PUBLISH [${topic}]:`), `Client published message '${message}' to MQTT topic ${topic}. Response received`);
                            end();
                        }
                    });
                });
            }, error => {
                console.log(ch.red('MQTT PUBLISH ERROR:'), error.message ?? error);
            })();
        }
    }

    export function define(config: MqttClientConfig): MqttClient {
        return new MqttClient(config);
    }
}

export default Mqtt;
