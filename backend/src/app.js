const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const apiV1Router = require("./routes/index");
const errorHandler = require("./middleware/errorHandler");

const app = express();

// Security Headers
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

// CORS configuration (Render Backend <-> Vercel Frontend & Localhost)
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",").map((s) => s.trim())
  : [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "http://localhost:5173",
      "https://asset-platform.vercel.app",
    ];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== "production") {
        return callback(null, true);
      }
      return callback(new Error("CORS policy violation: Origin not allowed"), false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { detail: "Too many requests from this IP, please try again later." },
});
app.use("/api/", limiter);

// Body Parsing
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

// Health Check Endpoint (Required by Render)
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "Government Infrastructure Asset Lifecycle Management Platform API",
    stack: "MERN (MongoDB, Express, React, Node)",
    timestamp: new Date().toISOString(),
  });
});

// Root API Endpoint
app.get("/", (req, res) => {
  res.json({
    title: "Government Infrastructure Asset Lifecycle Management Platform API",
    version: "1.0.0",
    health: "/health",
    api: "/api/v1",
  });
});

// Mount V1 API
app.use("/api/v1", apiV1Router);

// Central Error Handler
app.use(errorHandler);

module.exports = app;
