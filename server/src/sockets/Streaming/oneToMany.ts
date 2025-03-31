import { Server } from "socket.io";
import { SocketHandler } from "..";
import { STREAMING_NAMESPACE } from "../constants";
import { MediaSoup } from "../../MediaSoup";
import { Router } from "mediasoup/node/lib/RouterTypes";
import { WebRtcTransport } from "mediasoup/node/lib/WebRtcTransportTypes";
import { EVENT_NAMES } from "./constants";
import { Consumer, Producer } from "mediasoup/node/lib/types";

export class StreamingSocket extends SocketHandler {
    private connectionMap: Map<
        string,
        {
            router?: Router;
            producerTransport?: WebRtcTransport;
            consumerTransport?: WebRtcTransport;
            producer?: Producer;
            consumers?: Consumer[];
            roomId?: string;
        }
    >;
    mediaSoupClient: MediaSoup;

    constructor(io: Server) {
        super({ io, nameSpace: STREAMING_NAMESPACE });
        this.connectionMap = new Map();
        this.mediaSoupClient = new MediaSoup();
    }
    async initialize(): Promise<void> {
        try {
            this.nameSpace.on("connection", (socket) => {
                socket.on(EVENT_NAMES.JOIN_ROOM, async (data) => {
                    const { roomId } = data;

                    const router = await this.mediaSoupClient.createRouter({
                        roomId,
                    });
                    this.connectionMap.set(socket.id, {
                        router: router!,
                        roomId,
                    });
                    socket.join(roomId);
                    socket
                        .to(roomId)
                        .emit("joinRoom", { ...data, userId: socket.id });

                    socket.emit(
                        EVENT_NAMES.ROUTER_CAPABILITIES,
                        router?.rtpCapabilities
                    );
                });

                socket.on(
                    EVENT_NAMES.CREATE_TRANSPORT,
                    async ({ sender }, callback) => {
                        const userId = socket.id;
                        const connection = this.connectionMap.get(userId)!;
                        if (connection?.router) {
                            if (sender) {
                                const transport =
                                    await this.mediaSoupClient.createTransport(
                                        connection?.router
                                    );

                                connection.producerTransport = transport;

                                callback({
                                    id: transport.id,
                                    iceParameters: transport.iceParameters,
                                    iceCandidates: transport.iceCandidates,
                                    dtlsParameters: transport.dtlsParameters,
                                });
                            } else {
                                const consumer =
                                    await this.mediaSoupClient.createTransport(
                                        connection?.router
                                    );

                                connection.consumerTransport = consumer;

                                callback({
                                    id: consumer.id,
                                    iceParameters: consumer.iceParameters,
                                    iceCandidates: consumer.iceCandidates,
                                    dtlsParameters: consumer.dtlsParameters,
                                });

                                const existingUsers: string[] = [];
                                this.connectionMap.forEach((_, key) => {
                                    if (key !== socket?.id)
                                        existingUsers.push(key);
                                });
                                socket.emit(EVENT_NAMES.EXISTING_USERS_LIST, {
                                    users: existingUsers,
                                });
                            }
                        } else {
                            console.log("Connection not created yet");
                        }
                    }
                );

                socket.on(
                    EVENT_NAMES.CONNECT_PRODUCER_TRANSPORT,
                    async (data) => {
                        const { dtlsParameters } = data;
                        const connection = this.connectionMap.get(socket.id)!;
                        if (!connection?.producerTransport) {
                            console.log("Transport not found");
                        }

                        await connection.producerTransport?.connect({
                            dtlsParameters,
                        });

                        console.log(
                            "EVENT_NAMES.NEW_PRODUCER_TRANSPORT_CONNECTED===",
                            socket.id,
                            connection?.roomId
                        );

                        //for existing users to connect to the new one
                        socket
                            .to(connection?.roomId!)
                            .emit(
                                EVENT_NAMES.NEW_PRODUCER_TRANSPORT_CONNECTED,
                                {
                                    newUserId: socket.id,
                                }
                            );

                        //for the new user to connect to the new one
                    }
                );
                socket.on(
                    EVENT_NAMES.CONNECT_CONSUMER_TRANSPORT,
                    async (data) => {
                        //TODO: Send roomId from client
                        const { dtlsParameters } = data;
                        const connection = this.connectionMap.get(socket.id)!;
                        if (!connection?.consumerTransport) {
                            console.log("Transport not found");
                        }

                        await connection.consumerTransport?.connect({
                            dtlsParameters,
                        });
                    }
                );

                socket.on(
                    EVENT_NAMES.TRANSPORT_PRODUCE,
                    async ({ kind, rtpParameters }, callback) => {
                        const connection = this.connectionMap.get(socket.id)!;

                        if (!connection?.producerTransport) {
                            console.log("Producer Transport not found");
                        }
                        const producer =
                            await connection.producerTransport?.produce({
                                kind,
                                rtpParameters,
                            });

                        producer?.on("transportclose", () => {
                            console.log("Producer transport closed");
                            producer?.close();
                        });
                        connection.producer = producer;

                        callback({ id: producer?.id });
                    }
                );

                socket.on(
                    EVENT_NAMES.CONSUME_MEDIA,
                    async ({ rtpCapabilities, fromUserId }, callback) => {
                        const connection = this.connectionMap.get(fromUserId)!;
                        const toUser = this.connectionMap.get(socket.id)!;

                        const { producer, router } = connection;
                        const { consumerTransport } = toUser;

                        if (producer) {
                            if (
                                !router?.canConsume({
                                    producerId: producer?.id,
                                    rtpCapabilities,
                                })
                            ) {
                                console.error("Cannot consume");
                                return;
                            }

                            const consumer = await consumerTransport?.consume({
                                rtpCapabilities,
                                producerId: producer?.id,
                            });

                            consumer?.on("transportclose", () => {
                                console.log("Consumer transport closed");
                                consumer?.close();
                            });

                            // Event handler for producer closure
                            // This helps ensure that the consumer is closed when the producer is closed
                            consumer?.on("producerclose", () => {
                                console.log("Producer closed");
                                consumer?.close();
                            });
                            toUser.consumers?.push(consumer!);

                            callback({
                                params: {
                                    producerId: producer?.id,
                                    id: consumer?.id,
                                    kind: consumer?.kind,
                                    rtpParameters: consumer?.rtpParameters,
                                },
                            });
                        }
                    }
                );

                socket.on(EVENT_NAMES.CONSUME_RESUME, async () => {
                    console.log("consume-resume");
                    const connection = this.connectionMap.get(socket.id)!;
                    connection.consumers?.forEach((consumer) => {
                        consumer?.resume();
                    });
                });

                socket.on("disconnect", (data) => {
                    this.connectionMap.delete(socket.id);
                    console.log(`User ${socket.id} got disconnected`);
                });
            });
        } catch (error) {}
    }
}
