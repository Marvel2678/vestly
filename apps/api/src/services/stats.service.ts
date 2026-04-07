import { eq, and, gte, lt, inArray, sum } from "drizzle-orm";
import { db } from "../db";
import { wallets } from "../db/schema/wallets";
import { transactions } from "../db/schema/transactions";
import { WalletType, TransactionType } from "@vestly/shared";

export async function getPortfolioStats(userId: string) {
  const userWallets = await db
    .select()
    .from(wallets)
    .where(eq(wallets.userId, userId));

  const totalValue = userWallets.reduce((s, w) => s + parseFloat(w.currentValue), 0);
  const totalInvested = userWallets.reduce((s, w) => s + parseFloat(w.totalInvested), 0);
  const totalGain = totalValue - totalInvested;
  const totalGainPercent = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;

  const allocationByType = Object.values(WalletType)
    .map((type) => {
      const value = userWallets
        .filter((w) => w.type === type)
        .reduce((s, w) => s + parseFloat(w.currentValue), 0);
      const percent = totalValue > 0 ? (value / totalValue) * 100 : 0;
      return { type, value: value.toFixed(2), percent: percent.toFixed(2) };
    })
    .filter((a) => parseFloat(a.value) > 0);

  const walletIds = userWallets.map((w) => w.id);
  const quarterResult = await getQuarterResults(walletIds);

  return {
    totalValue: totalValue.toFixed(2),
    totalInvested: totalInvested.toFixed(2),
    totalGain: totalGain.toFixed(2),
    totalGainPercent: totalGainPercent.toFixed(2),
    rateOfReturn: totalGainPercent.toFixed(2),
    quarterResult,
    allocationByType,
  };
}

async function getQuarterResults(walletIds: string[]) {
  const now = new Date();

  const quarters = Array.from({ length: 4 }, (_, i) => {
    const d = new Date(now);
    d.setMonth(now.getMonth() - i * 3);
    const q = Math.floor(d.getMonth() / 3);
    const year = d.getFullYear();
    const start = new Date(year, q * 3, 1);
    const end = new Date(year, q * 3 + 3, 1);
    return { label: `Q${q + 1} '${String(year).slice(2)}`, start, end };
  }).reverse();

  if (walletIds.length === 0) {
    return quarters.map((q) => ({ label: q.label, gain: "0.00", gainPercent: "0.00" }));
  }

  return Promise.all(
    quarters.map(async ({ label, start, end }) => {
      const [buyRow] = await db
        .select({ total: sum(transactions.total) })
        .from(transactions)
        .where(
          and(
            inArray(transactions.walletId, walletIds),
            eq(transactions.type, TransactionType.BUY),
            gte(transactions.date, start),
            lt(transactions.date, end)
          )
        );

      const [sellRow] = await db
        .select({ total: sum(transactions.total) })
        .from(transactions)
        .where(
          and(
            inArray(transactions.walletId, walletIds),
            eq(transactions.type, TransactionType.SELL),
            gte(transactions.date, start),
            lt(transactions.date, end)
          )
        );

      const buyTotal = parseFloat(buyRow?.total ?? "0");
      const sellTotal = parseFloat(sellRow?.total ?? "0");
      const gain = sellTotal - buyTotal;
      const gainPercent = buyTotal > 0 ? (gain / buyTotal) * 100 : 0;

      return {
        label,
        gain: gain.toFixed(2),
        gainPercent: gainPercent.toFixed(2),
      };
    })
  );
}
