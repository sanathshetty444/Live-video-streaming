import { Server } from "socket.io";

export type TSocketHandler = {
    io: Server;
    nameSpace: string;
};
