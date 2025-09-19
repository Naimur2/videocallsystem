import dotenv from "dotenv";

// Load environment variables
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || "3001", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:3000",
  allowedOrigins: (
    process.env.ALLOWED_ORIGINS || "http://localhost:3000"
  ).split(","),
  apiPrefix: process.env.API_PREFIX || "/api/v1",

  // Development settings
  isDevelopment: process.env.NODE_ENV === "development",
  isProduction: process.env.NODE_ENV === "production",

  // Future configurations
  jwtSecret: process.env.JWT_SECRET || "fallback-secret-key",
  databaseUrl: process.env.DATABASE_URL,
};
