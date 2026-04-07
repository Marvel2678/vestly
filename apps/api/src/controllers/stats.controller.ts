import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { getPortfolioStats } from "../services/stats.service";
import { sendSuccess, sendError } from "../utils/response";

export async function stats(req: AuthRequest, res: Response) {
  try {
    const data = await getPortfolioStats(req.userId!);
    return sendSuccess(res, data);
  } catch (err) {
    return sendError(res, 500, "Failed to compute stats");
  }
}
