import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./config/auth.js";
import { logger } from "./config/logger.js";
import { register, activeConnections, pixelUpdates } from "./config/metrics.js";
import { metricsMiddleware } from "./middleware/metrics.js";
import projectRoutes from "./routes/projectRoutes.js";

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Setup Socket.IO with potential Redis Adapter
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  },
  // Vercel compatibility
  transports: ["websocket", "polling"],
});

// Redis Adapter logic for Vercel/Scaling
if (process.env.REDIS_URL) {
    const pubClient = createClient({ url: process.env.REDIS_URL });
    const subClient = pubClient.duplicate();

    Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
        io.adapter(createAdapter(pubClient, subClient));
        logger.info("Redis Adapter connected");
    }).catch(err => {
        logger.error("Redis connection failed", err);
    });
}

// Middleware
app.use(helmet());
app.use(cors({
  origin: true, // Allow all origins for now to prevent Vercel domain mismatch
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

// Better-auth routes
app.all("/api/auth/*", toNodeHandler(auth));

// API routes
app.use("/api/projects", projectRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Socket.io for real-time collaboration
io.on("connection", (socket) => {
  activeConnections.inc();
  logger.info(`Client connected: ${socket.id}`);

  socket.on("join-project", (data: string | { projectId: string, user?: { id?: string, name: string } }) => {
    let projectId: string;
    let user = { name: "Guest", id: socket.id };

    if (typeof data === "string") {
      projectId = data;
    } else {
      projectId = data.projectId;
      if (data.user) {
        user = { ...user, ...data.user };
      }
    }

    socket.join(projectId);
    // Notify others in room
    socket.to(projectId).emit("user-joined", { 
       socketId: socket.id, 
       user 
    });
    
    logger.info(`User ${user.name} (${socket.id}) joined project ${projectId}`);
  });

  socket.on("pixel-update", (data: { projectId: string; layerId: string; frameIndex: number; x: number; y: number; color: string } | { projectId: string; layerId: string; frameIndex: number; updates: { x: number; y: number; color: string }[] }) => {
    // Broadcast to others in the same project
    socket.to(data.projectId).emit("pixel-update", data);
    pixelUpdates.inc();
  });

  socket.on("cursor-move", (data: { projectId: string; x: number; y: number; userName: string }) => {
     // Broadcast cursor position to others (volatile for performance)
     socket.to(data.projectId).timeout(5000).emit("cursor-update", {
        socketId: socket.id, 
        ...data
     });
  });

  socket.on("leave-project", (projectId: string) => {
    socket.leave(projectId);
    socket.to(projectId).emit("user-left", socket.id);
  });

  socket.on("disconnect", () => {
    activeConnections.dec();
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== 'production') {
  httpServer.listen(PORT, () => {
    logger.info(`Server running on http://localhost:${PORT}`);
  });
}

export { app, httpServer };
