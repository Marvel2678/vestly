import {
  pgTable,
  uuid,
  varchar,
  text,
  numeric,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { WalletType } from "@vestly/shared";

export const walletTypeEnum = pgEnum("wallet_type", [
  WalletType.STOCKS,
  WalletType.ETF,
  WalletType.CRYPTO,
  WalletType.BONDS,
  WalletType.CASH,
  WalletType.OTHER,
]);

export const wallets = pgTable("wallets", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  type: walletTypeEnum("type").notNull(),
  currency: varchar("currency", { length: 10 }).default("USD").notNull(),
  description: text("description"),
  totalInvested: numeric("total_invested", { precision: 18, scale: 2 })
    .default("0")
    .notNull(),
  currentValue: numeric("current_value", { precision: 18, scale: 2 })
    .default("0")
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Wallet = typeof wallets.$inferSelect;
export type NewWallet = typeof wallets.$inferInsert;
