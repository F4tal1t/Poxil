import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
// import { auth } from "./config/auth.js";
import { logger } from "./config/logger.js";
import { register, activeConnections, pixelUpdates } from "./config/metrics.js";
import { metricsMiddleware } from "./middleware/metrics.js";
// import projectRoutes from "./routes/projectRoutes.js";

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  },
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));
app.use(metricsMiddleware);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use("/api/", limiter);

// Prometheus metrics endpoint
app.get("/metrics", async (req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});

// Better-auth routes (DISABLED FOR NOW)
// app.all("/api/auth/*", (req, res) => auth.handler(req, res));

// API routes (DISABLED FOR NOW)
// app.use("/api/projects", projectRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Socket.io for real-time collaboration
io.on("connection", (socket) => {
  activeConnections.inc();
  logger.info(`Client connected: ${socket.id}`);

  socket.on("join-project", (projectId: string) => {
    socket.join(projectId);
    socket.to(projectId).emit("user-joined", socket.id);
    logger.info(`User ${socket.id} joined project ${projectId}`);
  });

  socket.on("pixel-update", (data: { projectId: string; x: number; y: number; color: string }) => {
    socket.to(data.projectId).emit("pixel-update", data);
    pixelUpdates.inc();
  });

  socket.on("disconnect", () => {
    activeConnections.dec();
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`);
});
