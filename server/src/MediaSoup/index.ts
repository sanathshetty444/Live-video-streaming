import * as mediasoup from "mediasoup";
import { Router } from "mediasoup/node/lib/RouterTypes";
import { Worker } from "mediasoup/node/lib/types";

export class MediaSoup {
    static worker: Worker;

    static routers: Map<String, Router>;
    static async getWorker() {
        if (!this.worker)
            this.worker = await mediasoup.createWorker({
                rtcMinPort: 40000,
                rtcMaxPort: 49999,
            });
        console.log("Mediasoup Worker created");

        return this.worker;
    }

    async createRouter({ roomId }: { roomId: string }) {
        if (MediaSoup.routers.has(roomId)) return MediaSoup.routers.get(roomId);
        const worker = await MediaSoup.getWorker();

        const router = await worker.createRouter({
            mediaCodecs: [
                {
                    kind: "audio",
                    mimeType: "audio/opus",
                    clockRate: 48000, //48khz for higher sampling rate
                    channels: 2, //spatial left and right
                },
                { kind: "video", mimeType: "video/VP8", clockRate: 90000 },
            ],
        });

        MediaSoup.routers.set(roomId, router);

        console.log("Created router for room Id:", roomId);
        return router;
    }

    async createTransport(router: Router) {
        const transport = await router.createWebRtcTransport({
            listenIps: [{ ip: "0.0.0.0", announcedIp: "127.0.0.1" }],
            enableUdp: true,
            enableTcp: true,
            preferUdp: true,
        });

        return transport;
    }
}
