import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { stats } from "../controllers/stats.controller";

const router = Router();
router.use(requireAuth);
router.get("/", stats);

export default router;
