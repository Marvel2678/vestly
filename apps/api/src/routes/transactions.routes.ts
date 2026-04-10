import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { list, create, remove } from "../controllers/transactions.controller";

const router: Router = Router();

router.use(requireAuth);
router.get("/wallet/:walletId", list);
router.post("/", create);
router.delete("/:id", remove);

export default router;
