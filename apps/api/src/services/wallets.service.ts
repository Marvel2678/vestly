import { eq, and } from "drizzle-orm";
import { db } from "../db";
import { wallets } from "../db/schema/wallets";
import { CreateWalletDto, UpdateWalletDto } from "@vestly/shared";

export async function getUserWallets(userId: string) {
  return db.select().from(wallets).where(eq(wallets.userId, userId));
}

export async function getWalletById(id: string, userId: string) {
  const [wallet] = await db
    .select()
    .from(wallets)
    .where(and(eq(wallets.id, id), eq(wallets.userId, userId)))
    .limit(1);
  return wallet ?? null;
}

export async function createWallet(userId: string, dto: CreateWalletDto) {
  const [wallet] = await db
    .insert(wallets)
    .values({ userId, ...dto })
    .returning();
  return wallet;
}

export async function updateWallet(
  id: string,
  userId: string,
  dto: UpdateWalletDto,
) {
  const [wallet] = await db
    .update(wallets)
    .set({ ...dto, updatedAt: new Date() })
    .where(and(eq(wallets.id, id), eq(wallets.userId, userId)))
    .returning();
  return wallet ?? null;
}

export async function deleteWallet(id: string, userId: string) {
  const result = await db
    .delete(wallets)
    .where(and(eq(wallets.id, id), eq(wallets.userId, userId)))
    .returning();
  return result.length > 0;
}

export async function recalculateAllWallets(userId: string) {
  const userWallets = await db
    .select({ id: wallets.id })
    .from(wallets)
    .where(eq(wallets.userId, userId));

  const { recalculateWallet } = await import("./transactions.service");
  await Promise.all(userWallets.map((w) => recalculateWallet(w.id)));
  return getUserWallets(userId);
}
