import express from "express";
import userRouter from "./src/modules/users/router.js";
import authRouter from "./src/modules/auth/route.js";
import friendRouter from "./src/modules/friends/router.js";
import fs from "fs";
import path from "path";

import cookieParser from "cookie-parser";
import messageRoute from "./src/modules/message/router.js";
import conversationRoute from "./src/modules/conversation/router.js";
import groupRoute from "./src/modules/groups/router.js";
import cors from "cors";
import os from "os";

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173", // đổi theo port FE
    credentials: true,
  }),
);
app.use(cookieParser());
// Global middlewares
app.use(express.json());

const uploadRoot = path.resolve(process.cwd(), "uploads");
fs.mkdirSync(uploadRoot, { recursive: true });
app.use("/uploads", express.static(uploadRoot));

// Health check
app.get("/", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "API is running",
  });
});

app.get("/api/instance", (req, res) => {
  res.json({
    instance: os.hostname(),
  });
});
// Routes
app.use("/api/users", userRouter);
app.use("/api/auth", authRouter);
app.use("/api/messages", messageRoute);
app.use("/api/conversations", conversationRoute);
app.use("/api/groups", groupRoute);
app.use("/api/friends", friendRouter);

export default app;
