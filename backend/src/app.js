import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth.routes.js";
import chatRoutes from "./routes/chat.routes.js"
import messageRoutes from "./routes/message.routes.js"

import http from "http";



const app = express();
const server=http.createServer(app); //this is new





app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://soga-frontend.onrender.com"
  ],
  credentials: true
}));



app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));



app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/chat",chatRoutes);
app.use("/api/v1/message", messageRoutes)


// Health Route or default route
app.get("/", (req,res)=>{
    res.send("API is Live 🔥")
})

app.use((req,res,next)=>{
    res.status(404).json({
        success: false,
        message: "Route not found"
    });
});

app.use((err,req,res,next)=>{
    const statusCode=err.statusCode || 500;
    return res.status(statusCode).json({
        success: false,
        message: err.message || "Internal Server Error",
    });
})


export {app, server}; // Export both