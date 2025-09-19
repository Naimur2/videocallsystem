import { Router } from "express";
import chatRoutes from "./chatRoutes";
import healthRoutes from "./healthRoutes";

const router = Router();

// Mount route modules
router.use("/", healthRoutes);
router.use("/chat", chatRoutes);

export default router;
