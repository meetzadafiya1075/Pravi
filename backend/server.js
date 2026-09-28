require("dotenv").config();
const app = require("./src/app");
const connectDB = require("./src/config/db");

const PORT = process.env.PORT || 8000;

// Connect to MongoDB Atlas / Local MongoDB
connectDB().then(() => {
  const server = app.listen(PORT, () => {
    console.log(`[GovInfra ALM] Server is listening on port ${PORT}`);
    console.log(`[GovInfra ALM] Health Check: http://localhost:${PORT}/health`);
    console.log(`[GovInfra ALM] API V1 Root: http://localhost:${PORT}/api/v1`);
  });

  // Graceful shutdown
  const handleExit = (signal) => {
    console.log(`[GovInfra ALM] Received ${signal}. Shutting down gracefully...`);
    server.close(() => {
      console.log("[GovInfra ALM] HTTP server closed.");
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => handleExit("SIGTERM"));
  process.on("SIGINT", () => handleExit("SIGINT"));
});
