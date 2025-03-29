import io, { Socket } from "socket.io-client";
import { EventEmitter } from "../EventEmitter";
import { EVENT_NAMES } from "./constants";

export class SocketHandler {
    static socket: Socket;

    static getSocket() {
        if (!this.socket) {
            this.socket = io("http://localhost:8888/streaming", {
                transports: ["websocket"],
            });
        }

        this.socket.on("connect", () => {
            console.log("Connected to server successfully");
        });

        this.socket.on("connect_error", (error) => {
            console.log("Error in connection", error);
        });

        this.socket.on(EVENT_NAMES.JOIN_ROOM, (data) => {
            EventEmitter.emit(EVENT_NAMES.JOIN_ROOM, data);
        });
        this.socket.on(EVENT_NAMES.TRANSPORT_CREATED, (data) => {
            EventEmitter.emit(EVENT_NAMES.TRANSPORT_CREATED, data);
        });
        this.socket.on(EVENT_NAMES.ROUTER_CAPABILITIES, (data) => {
            EventEmitter.emit(EVENT_NAMES.ROUTER_CAPABILITIES, data);
        });

        console.log(this.socket);

        return this.socket;
    }

    connectToRoom({ roomId }: { roomId: string }) {
        const socket = SocketHandler.getSocket();
        socket?.emit("joinRoom", { roomId });
    }

    subscribeToAnEvent(name: keyof typeof EVENT_NAMES, callback: Function) {
        EventEmitter.listen(name, callback);
    }

    emitAnEvent(name: keyof typeof EVENT_NAMES, data: any) {
        const socket = SocketHandler.getSocket();
        socket?.emit(name, data);
    }
}
