import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import ApiError from "./utils/ApiError.js";


const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

import authRoutes from "./routes/auth.routes.js";

app.use("/api/v1/auth", authRoutes);

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


export {app};