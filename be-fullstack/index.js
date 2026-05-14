import dotenv from "dotenv";
import http from "http";
import app from "./app.js";
import { pool } from "./config/dbconfig.js";
import initSocket from "./src/socketio/index.js";
import { connectMongo } from "./config/mongo.js";

dotenv.config();

const PORT = process.env.PORT;

// ✅ Tạo HTTP server từ app
const server = http.createServer(app);

async function startServer() {
  try {
    await pool.query("SELECT 1");
    console.log("✅ Database connected");
    await connectMongo();
    // ✅ attach socket vào server
    await initSocket(server);
    console.log("✅ Socket initialized");

    app.set("io", server.io);

    // dùng server.listen (KHÔNG dùng app.listen)
    server.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
