import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import cors from "cors";

const app = express();
const server = createServer(app);
const io = new Server(server);

app.set("port", process.env.PORT || 8000);
app.get("/home", (req, res) => {
  return res.json({ hello: "world" });
});

const start = async () => {
app.set("mongo_user")
  const connectionDB = await mongoose.connect(
    "mongodb+srv://chlokeshoct2006_db_user:lokesh_1234@cluster0.nfe3yhz.mongodb.net/",
  );
  server.listen(app.get("port"), () => {
    console.log("LISTENING ON PORT 8000");
  });
};
start();
