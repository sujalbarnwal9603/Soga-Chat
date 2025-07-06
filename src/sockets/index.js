import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";
import { User } from "../models/User.model.js";

export const setupSocket = async (httpServer) => {
    const io = new Server(httpServer, {
        cors: {
            origin: process.env.CORS_ORIGIN,
            credentials: true
        }
    });

    /********************
    redis-client

    // const pubClient = createClient({ url: process.env.REDIS_URL });
    // const subClient = pubClient.duplicate();

    // await pubClient.connect();
    // await subClient.connect();

    // io.adapter(createAdapter(pubClient, subClient));

    ****************/

    //** Redis Upstash connection (TLS enabled)**//
    const pubClient = createClient({
        url: process.env.REDIS_URL, //.env
        socket:{
            tls:true,
            rejectUnauthorized:false,
        }
    });
    const subClient=pubClient.duplicate();

    await pubClient.connect();
    await subClient.connect();

    io.adapter(createAdapter(pubClient, subClient))
    //*******************//

    io.on("connection", (socket) => {
        console.log("🟢  New Client connected", socket.id);

        // Setup user room and mark as online
        socket.on("setup", async (userData) => {
            if (!userData?._id) return;

            socket.join(userData._id);
            console.log("User joined room: ", userData._id);
            socket.emit("connected");

            // ✅ Mark user as online in DB
            await User.findByIdAndUpdate(userData._id, { status: "online" });
        });

        socket.on("join chat", (roomId) => {
            socket.join(roomId);
            console.log("User joined chat room", roomId);
        });

        socket.on("new message", (messageData) => {
            const chat = messageData.chat;
            if (!chat?.users) return;

            chat.users.forEach((user) => {
                if (user._id === messageData.sender._id) return;
                socket.in(user._id).emit("message received", messageData);
            });
        });

        socket.on("disconnecting", async () => {
            // Get user ID from socket rooms before disconnect
            const userId = [...socket.rooms].find(id => id !== socket.id);

            if (userId) {
                // ✅ Mark user as offline in DB
                await User.findByIdAndUpdate(userId, {
                    status: "offline",
                    lastSeen: new Date()
                });
                console.log("🔴  Client disconnected", socket.id, "User ID:", userId);
            }
        });
    });
};
