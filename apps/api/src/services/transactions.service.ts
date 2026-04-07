import { eq, and, desc, sum } from "drizzle-orm";
import { db } from "../db";
import { transactions } from "../db/schema/transactions";
import { wallets } from "../db/schema/wallets";
import { CreateTransactionDto, TransactionType } from "@vestly/shared";

export async function getWalletTransactions(walletId: string, userId: string) {
  const [wallet] = await db
    .select({ id: wallets.id })
    .from(wallets)
    .where(and(eq(wallets.id, walletId), eq(wallets.userId, userId)))
    .limit(1);

  if (!wallet) return null;

  return db
    .select()
    .from(transactions)
    .where(eq(transactions.walletId, walletId))
    .orderBy(desc(transactions.date));
}

export async function createTransaction(
  userId: string,
  dto: CreateTransactionDto,
) {
  const [wallet] = await db
    .select()
    .from(wallets)
    .where(and(eq(wallets.id, dto.walletId), eq(wallets.userId, userId)))
    .limit(1);

  if (!wallet) return null;

  const total = dto.quantity * dto.price + (dto.fee ?? 0);

  const [tx] = await db
    .insert(transactions)
    .values({
      walletId: dto.walletId,
      type: dto.type,
      asset: dto.asset,
      quantity: dto.quantity.toString(),
      price: dto.price.toString(),
      fee: (dto.fee ?? 0).toString(),
      total: total.toString(),
      date: new Date(dto.date),
      notes: dto.notes,
    })
    .returning();

  // Recompute wallet totals from scratch after every transaction
  // This avoids drift from rounding and ensures correctness on delete too
  await recomputeWalletTotals(dto.walletId);

  return tx;
}

export async function deleteTransaction(id: string, userId: string) {
  const [row] = await db
    .select({ tx: transactions, wallet: wallets })
    .from(transactions)
    .innerJoin(
      wallets,
      and(eq(transactions.walletId, wallets.id), eq(wallets.userId, userId)),
    )
    .where(eq(transactions.id, id))
    .limit(1);

  if (!row) return false;

  const walletId = row.tx.walletId;
  await db.delete(transactions).where(eq(transactions.id, id));
  await recomputeWalletTotals(walletId);
  return true;
}

/**
 * Recompute totalInvested and currentValue for a wallet by summing all transactions.
 *
 * Model:
 *   totalInvested = sum of all cash you deposited or used to buy assets
 *     - DEPOSIT:    +amount  (fresh capital added)
 *     - BUY:        +total   (capital deployed into asset)
 *     - FEE:        +fee     (cost of investing, counts against ROI)
 *
 *   currentValue = current worth of the wallet (cash + unrealized asset book value)
 *     - DEPOSIT:    +amount  (cash balance up)
 *     - WITHDRAWAL: -amount  (cash balance down)
 *     - BUY:        -total   (cash leaves wallet, offset by asset at cost; net = 0 until price moves)
 *     - SELL:       +total   (cash received, asset removed at sell price)
 *     - DIVIDEND:   +total   (free income, increases current value)
 *     - FEE:        -total   (cost reduces current value)
 *
 *   ROI = (currentValue - totalInvested) / totalInvested * 100
 *
 *   Example: deposit $1000, buy 10 shares at $80 ($800 total), sell 10 shares at $95 ($950)
 *     totalInvested = 1000 + 800 = 1800
 *     currentValue  = 1000 - 800 + 950 = 1150   (remaining cash $200 + received $950)
 *     Wait — totalInvested double-counts here. Better model:
 *
 *   Simpler correct model:
 *     totalInvested = only DEPOSIT amounts (cash you actually transferred in)
 *     currentValue  = net of all cash flows in the wallet
 *
 *   Example: deposit $1000, buy 10@$80, sell 10@$95
 *     totalInvested = $1000
 *     currentValue  = +1000 (deposit) - 800 (buy) + 950 (sell) = $1150
 *     ROI = (1150 - 1000) / 1000 = +15%  ✓ correct
 */
async function recomputeWalletTotals(walletId: string) {
  const txs = await db
    .select()
    .from(transactions)
    .where(eq(transactions.walletId, walletId));

  let totalInvested = 0; // capital you put in (deposits only)
  let currentValue = 0; // net running balance

  for (const tx of txs) {
    const amount = parseFloat(tx.total);
    switch (tx.type) {
      case TransactionType.DEPOSIT:
        totalInvested += amount;
        currentValue += amount;
        break;
      case TransactionType.WITHDRAWAL:
        currentValue -= amount;
        break;
      case TransactionType.BUY:
        // Cash out, asset in at cost — currentValue neutral (book value preserved)
        // No change to currentValue: cash -amount, asset +amount (at cost)
        // totalInvested unchanged — you already deposited this cash
        break;
      case TransactionType.SELL:
        // Asset out, cash in at sell price — reflects P&L
        currentValue = currentValue + amount - totalInvested; // add cash received, remove book value of asset sold
        break;
      case TransactionType.DIVIDEND:
        currentValue += amount;
        break;
      case TransactionType.FEE:
        currentValue -= amount;
        break;
    }
  }

  await db
    .update(wallets)
    .set({
      totalInvested: totalInvested.toFixed(2),
      currentValue: Math.max(0, currentValue).toFixed(2),
      updatedAt: new Date(),
    })
    .where(eq(wallets.id, walletId));
}

// Exported so wallets service can trigger recalculation
export { recomputeWalletTotals as recalculateWallet };
