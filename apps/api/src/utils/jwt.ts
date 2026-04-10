import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { getEnv } from "./getenv";
dotenv.config();

export interface AccessTokenPayload {
  sub: string;
  email: string;
}

export interface RefreshTokenPayload {
  sub: string;
  jti: string;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  const secret = getEnv("JWT_ACCESS_SECRET");
  const expiresIn = getEnv("JWT_ACCESS_EXPIRES_IN");
  return jwt.sign(payload, secret, {
    expiresIn: expiresIn as jwt.SignOptions["expiresIn"],
    algorithm: "HS256",
  });
}

export function signRefreshToken(payload: RefreshTokenPayload): string {
  const secret = getEnv("JWT_REFRESH_SECRET");
  const expiresIn = getEnv("JWT_REFRESH_EXPIRES_IN");
  return jwt.sign(payload, secret, {
    expiresIn: expiresIn as jwt.SignOptions["expiresIn"],
    algorithm: "HS256",
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const secret = getEnv("JWT_ACCESS_SECRET");
  return jwt.verify(token, secret) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  const secret = getEnv("JWT_REFRESH_SECRET");
  return jwt.verify(token, secret) as RefreshTokenPayload;
}

export function getRefreshTokenExpiry(): Date {
  const raw = getEnv("JWT_REFRESH_EXPIRES_IN");
  const days = parseInt(raw.replace(/\D/g, ""), 10);
  const d = new Date();
  d.setDate(d.getDate() + (isNaN(days) ? 7 : days));
  return d;
}
