import dotenv from "dotenv";
dotenv.config();

import connectToDB from "./src/config/database.js";
import app from "./src/app.js";

import http from "http";
import { initSocket } from "./src/sockets/server.socket.js";

const PORT = process.env.PORT || 3000;

const httpServer = http.createServer(app);
initSocket(httpServer);

async function startServer() {
  try {
    // DB connect
    await connectToDB();

    console.log("Database connected successfully 🎉");

    // server start after DB connection
    httpServer.listen(PORT, () => {
      console.log(`Server is running on port: ${PORT} 🚀`);
      // startChat();
    });
  } catch (error) {
    console.error("Database connection failed ❌");
    console.error(error.message);
    process.exit(1); // stop app if DB not connected
  }
}

startServer();
