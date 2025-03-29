import { Server } from "socket.io";
import { SocketHandler } from "..";
import { STREAMING_NAMESPACE } from "../constants";
import { MediaSoup } from "../../MediaSoup";
import { Router } from "mediasoup/node/lib/RouterTypes";
import { WebRtcTransport } from "mediasoup/node/lib/WebRtcTransportTypes";

export class StreamingSocket extends SocketHandler {
    private connectionMap: Map<
        String,
        { router?: Router; transport?: WebRtcTransport }
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
                socket.on("joinRoom", async (data) => {
                    const { roomId } = data;

                    const router = await this.mediaSoupClient.createRouter({
                        roomId,
                    });
                    this.connectionMap.set(socket.id, { router: router! });
                    socket
                        .to(roomId)
                        .emit("joinRoom", { ...data, userId: socket.id });

                    socket.emit("routerCapabilities", router?.rtpCapabilities);
                });

                socket.on("createTransport", async (data) => {
                    const userId = socket.id;
                    const connection = this.connectionMap.get(userId)!;
                    if (connection?.router) {
                        const transport =
                            await this.mediaSoupClient.createTransport(
                                connection?.router
                            );

                        connection.transport = transport;

                        socket.emit("transportCreated", {
                            id: transport.id,
                            iceParameters: transport.iceParameters,
                            iceCandidates: transport.iceCandidates,
                            dtlsParameters: transport.dtlsParameters,
                        });
                    } else {
                        console.log("Connection not created yet");
                    }
                });

                socket.on("disconnect", (data) => {
                    this.connectionMap.delete(socket.id);
                    console.log(`User ${socket.id} got disconnected`);
                });
            });
        } catch (error) {}
    }
}
