import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import { getAuth } from "./config/auth.js";
import { register, activeConnections, pixelUpdates } from "./config/metrics.js";
import { metricsMiddleware } from "./middleware/metrics.js";
import projectRoutes from "./routes/projectRoutes.js";

dotenv.config();

const app: express.Application = express();
const httpServer = createServer(app);

// Trust Proxy for Vercel
app.set("trust proxy", 1);

// Debug endpoint for deployment verification
app.get("/api/debug", (_req, res) => {
    res.json({
        status: "alive",
        env: {
            hasDb: !!process.env.DATABASE_URL,
            hasRedis: !!process.env.REDIS_URL,
            hasAuthSecret: !!process.env.BETTER_AUTH_SECRET,
            nodeEnv: process.env.NODE_ENV
        }
    });
});

app.options('*', cors({
  origin: true,
  credentials: true,
}));

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

    // Prevent crash on connection loss & suppress verbose logs in serverless
    const handleRedisError = (err: any) => {
        // Ignore "Socket closed unexpectedly" errors common in Vercel/Serverless
        if (err?.message?.includes("Socket closed unexpectedly")) return;
        console.error("Redis Client Error:", err);
    };

    pubClient.on("error", handleRedisError);
    subClient.on("error", handleRedisError);

    Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
        io.adapter(createAdapter(pubClient, subClient));
        console.log("Redis Adapter connected");
    }).catch(err => {
        console.error("Redis connection failed", err);
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
app.get("/metrics", async (_req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});

// Better-auth routes
app.all("/api/auth/*", async (req, res, next) => {
    try {
        const { toNodeHandler } = await import("better-auth/node");
        const auth = await getAuth();
        const handler = toNodeHandler(auth);
        return handler(req, res);
    } catch (e) {
        next(e);
    }
});

// API routes
app.use("/api/projects", projectRoutes);

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Socket.io for real-time collaboration
io.on("connection", (socket) => {
  activeConnections.inc();
  console.log(`Client connected: ${socket.id}`);

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
    
    console.log(`User ${user.name} (${socket.id}) joined project ${projectId}`);
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
    console.log(`Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== 'production') {
  httpServer.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export { app, httpServer };
