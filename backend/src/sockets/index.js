import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";
import { User } from "../models/User.model.js";

export const setupSocket = async (httpServer) => {
    console.log("🔌 Setting up Socket.IO server...");
    
    const io = new Server(httpServer, {
        cors: {
            origin: process.env.CORS_ORIGIN || "http://localhost:3000",
            credentials: true
        }
    });

    // Redis setup with error handling
    try {
        if (process.env.REDIS_URL) {
            console.log("🔄 Connecting to Redis...");
            const pubClient = createClient({
                url: process.env.REDIS_URL,
                socket: {
                    tls: true,
                    rejectUnauthorized: false,
                }
            });
            
            const subClient = pubClient.duplicate();
            
            await pubClient.connect();
            await subClient.connect();
            
            io.adapter(createAdapter(pubClient, subClient));
            console.log("✅ Redis adapter connected successfully");
        } else {
            console.log("⚠️ No Redis URL provided, running without Redis adapter");
        }
    } catch (error) {
        console.error("❌ Redis connection failed:", error.message);
        console.log("⚠️ Continuing without Redis adapter...");
    }

    io.on("connection", (socket) => {
        console.log("🟢 New Client connected:", socket.id);

        socket.on("setup", async (userData) => {
            if (!userData?._id) {
                console.log("❌ Setup failed: No user ID provided");
                return;
            }
            
            socket.join(userData._id);
            console.log("👤 User joined room:", userData._id, "Name:", userData.fullName);
            socket.emit("connected");
            
            // Mark user as online in DB
            try {
                await User.findByIdAndUpdate(userData._id, { status: "online" });
                console.log("✅ User marked as online:", userData.fullName);
            } catch (error) {
                console.error("❌ Failed to update user status:", error);
            }
        });

        socket.on("join chat", (roomId) => {
            socket.join(roomId);
            console.log("💬 User joined chat room:", roomId);
        });

        socket.on("new message", (messageData) => {
            console.log("📨 New message received:");
            console.log("  - Message ID:", messageData._id);
            console.log("  - Chat ID:", messageData.chat._id);
            console.log("  - Sender:", messageData.sender.fullName);
            console.log("  - Content:", messageData.content);
            
            const chat = messageData.chat;
            if (!chat?.users || !messageData?.sender?._id) {
                console.log("❌ Invalid message data - missing chat users or sender");
                return;
            }

            console.log("👥 Chat has", chat.users.length, "users:");
            chat.users.forEach(user => {
                console.log("  -", user.fullName, "(", user._id, ")");
            });

            let broadcastCount = 0;
            chat.users.forEach((user) => {
                if (user._id === messageData.sender._id) {
                    console.log("⏭️ Skipping sender:", user.fullName);
                    return;
                }
                
                console.log("📡 Broadcasting to:", user.fullName, "Room:", user._id);
                io.to(user._id).emit("message received", messageData);
                broadcastCount++;
            });
            
            console.log("✅ Message broadcasted to", broadcastCount, "users");
        });

        socket.on("disconnect", async (reason) => {
            console.log("🔴 Client disconnected:", socket.id, "Reason:", reason);
        });

        socket.on("disconnecting", async () => {
            const userId = [...socket.rooms].find(id => id !== socket.id);
            if (userId) {
                try {
                    await User.findByIdAndUpdate(userId, {
                        status: "offline",
                        lastSeen: new Date()
                    });
                    console.log("👤 User marked as offline:", userId);
                } catch (error) {
                    console.error("❌ Failed to update user status on disconnect:", error);
                }
            }
        });
    });

    console.log("✅ Socket.IO server setup complete");
    return io;
};