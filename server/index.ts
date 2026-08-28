import express from "express";
import cors from "cors";
import { initializeDatabase, seedDatabase } from "./database/schema";

// Import API routes
import authRoutes from "./routes/auth";
import ticketRoutes from "./routes/tickets";
import ticketBatchRoutes from "./routes/ticket-batches";
import bookingRoutes from "./routes/bookings";
import userRoutes from "./routes/users";
import settingsRoutes from "./routes/settings";
import umrahRoutes from "./routes/umrah";

export function createServer() {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", 1);

  // Initialize database
  try {
    initializeDatabase();
    seedDatabase();
    console.log("Database initialized and seeded successfully");
  } catch (error) {
    console.error("Database initialization error:", error);
  }

  const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  const defaultOrigins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
  ];

  app.use(
    cors({
      origin: (origin, callback) => {
        const allowedList = [
          ...defaultOrigins,
          ...allowedOrigins,
          ...(process.env.NODE_ENV === "production"
            ? []
            : [undefined]),
        ];

        const sameHostOrigin =
          origin &&
          typeof origin === "string" &&
          typeof process.env.PORT === "string" &&
          (origin === `http://localhost:${process.env.PORT}` ||
            origin === `http://127.0.0.1:${process.env.PORT}` ||
            origin === `https://localhost:${process.env.PORT}` ||
            origin === `https://127.0.0.1:${process.env.PORT}`);

        const localhostPreviewOrigin =
          typeof origin === "string" &&
          /^(https?:\/\/)(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

        if (!origin || allowedList.includes(origin) || sameHostOrigin || localhostPreviewOrigin) {
          callback(null, true);
          return;
        }

        callback(new Error(`CORS blocked for origin: ${origin}`));
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  );

  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });

  // Health check endpoint
  app.get("/api/ping", (_req, res) => {
    res.json({
      message: "BD TicketPro API Server",
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
    });
  });

  // API Routes
  app.use("/api/auth", authRoutes);
  app.use("/api/tickets", ticketRoutes);
  app.use("/api/ticket-batches", ticketBatchRoutes);
  app.use("/api/bookings", bookingRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/settings", settingsRoutes);
  app.use("/api/umrah", umrahRoutes);

  // Global error handler
  app.use(
    (
      err: any,
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      console.error("Global error handler:", err);

      res.status(err.status || 500).json({
        success: false,
        message: err.message || "Internal server error",
        ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
      });
    },
  );

  // 404 handler for API routes
  app.use("/api/*", (req, res) => {
    res.status(404).json({
      success: false,
      message: "API endpoint not found",
      path: req.path,
    });
  });

  return app;
}
