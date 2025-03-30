import express from "express";
import httpServer from "http";
import { Server } from "socket.io";
import { StreamingSocket } from "./src/sockets/Streaming/oneToMany";
import { MediaSoup } from "./src/MediaSoup";
import corsMiddleware from "./src/middlewares/cors";

const app = express();
const port = 8888;
app.use(express.json());
app.use(corsMiddleware);

const server = httpServer.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins or specify your frontend URL
    },
});

new StreamingSocket(io).initialize();
MediaSoup.getWorker();

app.get("/", (req, res) => {
    res.status(200).json({ success: true });
});

server.listen(port, () => {
    console.log("Server is up and running! on port");
});
