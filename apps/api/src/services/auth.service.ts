import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db } from "../db";
import { users } from "../db/schema/users";
import { refreshTokens } from "../db/schema/refresh-tokens";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  getRefreshTokenExpiry,
} from "../utils/jwt";
import { LoginDto, RegisterDto } from "@vestly/shared";

export async function registerUser(dto: RegisterDto) {
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, dto.email))
    .limit(1);

  if (existing.length > 0) {
    throw new Error("EMAIL_TAKEN");
  }

  const passwordHash = await bcrypt.hash(dto.password, 12);
  const [user] = await db
    .insert(users)
    .values({ email: dto.email, name: dto.name, passwordHash })
    .returning();

  return issueTokens(user.id, user.email);
}

export async function loginUser(dto: LoginDto) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, dto.email))
    .limit(1);

  if (!user) throw new Error("INVALID_CREDENTIALS");

  const valid = await bcrypt.compare(dto.password, user.passwordHash);
  if (!valid) throw new Error("INVALID_CREDENTIALS");

  return issueTokens(user.id, user.email);
}

export async function refreshAccessToken(rawRefreshToken: string) {
  let payload;
  try {
    payload = verifyRefreshToken(rawRefreshToken);
  } catch {
    throw new Error("INVALID_REFRESH_TOKEN");
  }

  const [stored] = await db
    .select()
    .from(refreshTokens)
    .where(eq(refreshTokens.token, rawRefreshToken))
    .limit(1);

  if (!stored || stored.revoked || stored.expiresAt < new Date()) {
    throw new Error("INVALID_REFRESH_TOKEN");
  }

  // Rotate: revoke old token, issue new pair
  await db
    .update(refreshTokens)
    .set({ revoked: true })
    .where(eq(refreshTokens.id, stored.id));

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, payload.sub))
    .limit(1);

  if (!user) throw new Error("USER_NOT_FOUND");

  return issueTokens(user.id, user.email);
}

export async function revokeRefreshToken(rawRefreshToken: string) {
  await db
    .update(refreshTokens)
    .set({ revoked: true })
    .where(eq(refreshTokens.token, rawRefreshToken));
}

async function issueTokens(userId: string, email: string) {
  const jti = randomUUID();
  const accessToken = signAccessToken({ sub: userId, email });
  const refreshToken = signRefreshToken({ sub: userId, jti });

  await db.insert(refreshTokens).values({
    userId,
    token: refreshToken,
    expiresAt: getRefreshTokenExpiry(),
  });

  const [user] = await db
    .select({ id: users.id, email: users.email, name: users.name, createdAt: users.createdAt })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return { accessToken, refreshToken, user };
}
