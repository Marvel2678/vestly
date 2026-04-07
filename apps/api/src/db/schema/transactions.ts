import {
  pgTable,
  uuid,
  varchar,
  text,
  numeric,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { wallets } from "./wallets";
import { TransactionType } from "@vestly/shared";

export const transactionTypeEnum = pgEnum("transaction_type", [
  TransactionType.BUY,
  TransactionType.SELL,
  TransactionType.DIVIDEND,
  TransactionType.DEPOSIT,
  TransactionType.WITHDRAWAL,
  TransactionType.FEE,
]);

export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  walletId: uuid("wallet_id")
    .notNull()
    .references(() => wallets.id, { onDelete: "cascade" }),
  type: transactionTypeEnum("type").notNull(),
  asset: varchar("asset", { length: 20 }).notNull(),
  quantity: numeric("quantity", { precision: 18, scale: 8 }).notNull(),
  price: numeric("price", { precision: 18, scale: 2 }).notNull(),
  fee: numeric("fee", { precision: 18, scale: 2 }).default("0").notNull(),
  total: numeric("total", { precision: 18, scale: 2 }).notNull(),
  date: timestamp("date").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
