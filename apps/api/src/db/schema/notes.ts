import {
  pgTable,
  uuid,
  text,
  numeric,
  varchar,
  timestamp,
  pgEnum,
  json,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { wallets } from "./wallets";
import { NoteDirection } from "@vestly/shared";

export const noteDirectionEnum = pgEnum("note_direction", [
  NoteDirection.INCOME,
  NoteDirection.EXPENSE,
]);

export const notes = pgTable("notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  walletId: uuid("wallet_id").references(() => wallets.id, {
    onDelete: "set null",
  }),
  direction: noteDirectionEnum("direction").notNull(),
  amount: numeric("amount", { precision: 18, scale: 2 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  date: timestamp("date").notNull(),
  tags: json("tags").$type<string[]>().default([]).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;
