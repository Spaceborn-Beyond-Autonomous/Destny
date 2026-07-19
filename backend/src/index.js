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
        const allowedOrigins = origin
            .split(",")
            .map((item) => item.trim().replace(/\/$/, ""))
            .filter(Boolean);
        const io = new Server(server, {
            cors: {
                origin: allowedOrigins,
                credentials: true,
            },
        });

        io.use(socketAuthMiddleware);

        io.on("connection", (socket) => {
            if (socket.user?._id) {
                socket.join(`user:${socket.user._id}`);
            }

            if (socket.user?.admin) {
                socket.join("admin");
            } else {
                socket.on("join:order", (orderId) => {
                    if (typeof orderId === "string" && orderId.trim()) {
                        socket.join(`order:${orderId.trim()}`);
                    }
                });
                socket.on("join:quote", (quoteId) => {
                    if (typeof quoteId === "string" && quoteId.trim()) {
                        socket.join(`quote:${quoteId.trim()}`);
                    }
                });
                socket.on("join:freelance-contract", (contractId) => {
                    if (typeof contractId === "string" && contractId.trim()) {
                        socket.join(`freelance:contract:${contractId.trim()}`);
                    }
                });
            }
        });

        setSocketServer(io);

        const PORTT = process.env.PORT || 4000;

        const onListen = () => {
            console.log(`Server running on port ${PORTT}`);
        };

        server.on('error', (err) => {
            if (err?.code === 'EADDRINUSE') {
                console.error(`Port ${PORTT} is already in use. Stop the existing server and restart.`);
                process.exit(1);
            }
            throw err;
        });

        server.listen(PORTT, onListen);
    })
    .catch((err) => {
        console.log("Error in connecting to app", err);
    })

