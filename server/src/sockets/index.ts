import { Namespace, Server } from "socket.io";
import { ISocketHandler } from "./interface";
import { TSocketHandler } from "./types";

export abstract class SocketHandler implements ISocketHandler {
    protected io: Server;
    protected nameSpace: Namespace;

    constructor({ io, nameSpace }: TSocketHandler) {
        this.io = io;
        this.nameSpace = this.io.of(nameSpace);
    }
    abstract initialize(): Promise<void>;
}
