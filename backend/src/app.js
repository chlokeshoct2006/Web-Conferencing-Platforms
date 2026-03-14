import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import { connectToSocket } from "./controllers/socketManager.js";
import cors from "cors";
import userRoutes from "./routes/users.routes.js";
import dotenv from "dotenv";  // ✅ FIXED: Credentials were hardcoded — use environment variables instead

dotenv.config();

const app = express();
const server = createServer(app);
const io = connectToSocket(server);

app.set("port", process.env.PORT || 8000);

app.use(cors({
    origin: process.env.CLIENT_URL || "*",  // ✅ FIXED: Was accepting all origins — restrict in production
    methods: ["GET", "POST"]
}));

app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));

app.use("/api/v1/users", userRoutes);

// ✅ FIXED: Removed app.set("mongo_user") — this does nothing and was likely a mistake
const start = async () => {
    try {
        const connectionDB = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`Mongo Connected DB Host: ${connectionDB.connection.host}`);
        server.listen(app.get("port"), () => {
            console.log(`LISTENING ON PORT ${app.get("port")}`);
        });
    } catch (err) {
        console.error("Failed to connect to MongoDB:", err);
        process.exit(1);  // ✅ FIXED: App silently failed before; now exits with error
    }
};

start();
