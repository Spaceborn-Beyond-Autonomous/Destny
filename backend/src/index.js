import 'dotenv/config';
import dns from "node:dns";
import http from "node:http";
import { Server } from "socket.io";
import connectDB from "./db/index.js"
import { app } from "./app.js"
import { setSocketServer } from "./socket.js";
import { socketAuthMiddleware } from "./middlewares/socketAuth.middleware.js";

dns.setServers(["8.8.8.8", "8.8.4.4"]);


connectDB()
.then(() => {
    
    app.on("error", (err) => {
        console.log("App connection error ", err)
            throw err;
        })
        const server = http.createServer(app);
        const origin = process.env.CLIENT_URL || process.env.CORS_ORIGIN || "http://localhost:5173";
        const io = new Server(server, {
            cors: {
                origin: origin.replace(/\/$/, ""),
                credentials: true,
            },
        });

        io.use(socketAuthMiddleware);

        io.on("connection", (socket) => {
            if (socket.user?.admin) {
                socket.join("admin");
            }
        });

        setSocketServer(io);

        const PORTT = process.env.PORT || 4000
        server.listen(PORTT, () => {
            console.log(`Server running on port ${PORTT}`);
        })
    })
    .catch((err) => {
        console.log("Error in connecting to app", err);
    })