import { Request, Response } from "express";
import { z } from "zod";
import {
  registerUser,
  loginUser,
  refreshAccessToken,
  revokeRefreshToken,
} from "../services/auth.service";
import { sendError, sendSuccess } from "../utils/response";
import { getEnv } from "../utils/getenv";

const REFRESH_COOKIE = "refresh_token";
const NODE_ENV = getEnv("NODE_ENV")!;
const COOKIE_OPTS = {
  httpOnly: true,
  secure: NODE_ENV === "production",
  sameSite: "strict" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
};

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(100),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function register(req: Request, res: Response) {
  const result = registerSchema.safeParse(req.body);
  if (!result.success) return sendError(res, 400, result.error.message, "Validation Error");

  try {
    const { accessToken, refreshToken, user } = await registerUser(result.data);
    res.cookie(REFRESH_COOKIE, refreshToken, COOKIE_OPTS);
    return sendSuccess(res, { accessToken, user }, 201);
  } catch (err: any) {
    if (err.message === "EMAIL_TAKEN") return sendError(res, 409, "Email already in use", "Conflict");
    return sendError(res, 500, "Registration failed");
  }
}

export async function login(req: Request, res: Response) {
  const result = loginSchema.safeParse(req.body);
  if (!result.success) return sendError(res, 400, result.error.message, "Validation Error");

  try {
    const { accessToken, refreshToken, user } = await loginUser(result.data);
    res.cookie(REFRESH_COOKIE, refreshToken, COOKIE_OPTS);
    return sendSuccess(res, { accessToken, user });
  } catch (err: any) {
    if (err.message === "INVALID_CREDENTIALS") return sendError(res, 401, "Invalid email or password", "Unauthorized");
    return sendError(res, 500, "Login failed");
  }
}

export async function refresh(req: Request, res: Response) {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (!token) return sendError(res, 401, "No refresh token", "Unauthorized");

  try {
    const { accessToken, refreshToken, user } = await refreshAccessToken(token);
    res.cookie(REFRESH_COOKIE, refreshToken, COOKIE_OPTS);
    return sendSuccess(res, { accessToken, user });
  } catch {
    res.clearCookie(REFRESH_COOKIE);
    return sendError(res, 401, "Invalid or expired refresh token", "Unauthorized");
  }
}

export async function logout(req: Request, res: Response) {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (token) await revokeRefreshToken(token);
  res.clearCookie(REFRESH_COOKIE, { path: "/" });
  return sendSuccess(res, { message: "Logged out" });
}
