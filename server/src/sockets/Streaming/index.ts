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
        String,
        {
            router?: Router;
            producerTransport?: WebRtcTransport;
            consumerTransport?: WebRtcTransport;
            producer?: Producer;
            consumer?: Consumer;
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
                    this.connectionMap.set(socket.id, { router: router! });
                    socket
                        .to(roomId)
                        .emit("joinRoom", { ...data, userId: socket.id });

                    socket.emit(
                        EVENT_NAMES.ROUTER_CAPABILITIES,
                        router?.rtpCapabilities
                    );
                });

                socket.on(EVENT_NAMES.CREATE_TRANSPORT, async (data) => {
                    const { sender, callback } = data;
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
                        }
                    } else {
                        console.log("Connection not created yet");
                    }
                });

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
                    }
                );
                socket.on(
                    EVENT_NAMES.CONNECT_CONSUMER_TRANSPORT,
                    async (data) => {
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
                    async ({ rtpCapabilities }, callback) => {
                        const connection = this.connectionMap.get(socket.id)!;

                        const { consumerTransport, producer, router } =
                            connection;

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
                            connection.consumer = consumer;

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
                    await connection?.consumer?.resume();
                });

                socket.on("disconnect", (data) => {
                    this.connectionMap.delete(socket.id);
                    console.log(`User ${socket.id} got disconnected`);
                });
            });
        } catch (error) {}
    }
}
