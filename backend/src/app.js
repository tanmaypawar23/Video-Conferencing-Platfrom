import express from "express";
import { createServer } from "node:http";

import { Server } from "socket.io";

import mongoose from "mongoose";
import connectToSocket from "./controllers/socketManager.js";

import cors from "cors";
import userRoutes from "./routes/users.routes.js";

const app = express();
const server = createServer(app);
const io = connectToSocket(server);

app.set("port", process.env.PORT || 8000);
app.use(
  cors({
    origin: [
      "https://video-conferencing-platfrom-wp9l.onrender.com",
      "http://localhost:5173",
    ],
  }),
);
app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));

app.use("/api/v1/users", userRoutes);

const start = async () => {
  try {
    const connectionDb = await mongoose.connect(
      "mongodb+srv://tanmaypawar230705_db_user:wPSuOig9Ag69HXM6@videocallplatformcluste.ojhr0iv.mongodb.net/",
    );
    console.log(`MONGO CONNECTED TO DB HOST: ${connectionDb.connection.host}`);
    server.listen(app.get("port"), () => {
      console.log(`LISTENING ON PORT ${app.get("port")}`);
    });
  } catch (e) {
    console.error("Failed to start server:", e);
    process.exit(1);
  }
};

start();
