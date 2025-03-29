import express from "express";
import httpServer from "http";
import { Server } from "socket.io";
import { cors } from "./src/middlewares/cors";
import { StreamingSocket } from "./src/sockets/Streaming";
import { MediaSoup } from "./src/MediaSoup";

const app = express();
const port = 8888;

const server = httpServer.createServer(app);
const io = new Server(server);

app.use(cors);

new StreamingSocket(io).initialize();
MediaSoup.getWorker();

app.get("/", (req, res) => {
    res.status(200).json({ success: true });
});

server.listen(port, () => {
    console.log("Server is up and running!");
});
