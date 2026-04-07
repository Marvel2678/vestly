import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { list, get, create, update, remove } from "../controllers/notes.controller";

const router = Router();

router.use(requireAuth);
router.get("/", list);
router.get("/:id", get);
router.post("/", create);
router.patch("/:id", update);
router.delete("/:id", remove);

export default router;
