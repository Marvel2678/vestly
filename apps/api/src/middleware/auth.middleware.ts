import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt";
import { sendError } from "../utils/response";

export interface AuthRequest extends Request {
  userId?: string;
  userEmail?: string;
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return sendError(res, 401, "Missing or invalid authorization header", "Unauthorized");
  }

  const token = authHeader.slice(7);

  try {
    const payload = verifyAccessToken(token);
    req.userId = payload.sub;
    req.userEmail = payload.email;
    next();
  } catch {
    return sendError(res, 401, "Access token expired or invalid", "Unauthorized");
  }
}
