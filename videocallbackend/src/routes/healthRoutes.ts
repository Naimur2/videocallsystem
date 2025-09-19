import { Router } from "express";
import { getServerInfo, healthCheck } from "../controllers/healthController";

const router = Router();

// Health check endpoint
router.get("/health", healthCheck);

// Server info endpoint
router.get("/info", getServerInfo);

export default router;
