import jwt from "jsonwebtoken";

export interface AccessTokenPayload {
  sub: string;
  email: string;
}

export interface RefreshTokenPayload {
  sub: string;
  jti: string;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET!, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? "15m",
  });
}

export function signRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? "7d",
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as RefreshTokenPayload;
}

export function getRefreshTokenExpiry(): Date {
  const raw = process.env.JWT_REFRESH_EXPIRES_IN ?? "7d";
  const days = parseInt(raw.replace(/\D/g, ""), 10);
  const d = new Date();
  d.setDate(d.getDate() + (isNaN(days) ? 7 : days));
  return d;
}
