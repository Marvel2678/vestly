import { eq, and, desc } from "drizzle-orm";
import { db } from "../db";
import { notes } from "../db/schema/notes";
import { CreateNoteDto, UpdateNoteDto } from "@vestly/shared";

export async function getUserNotes(userId: string) {
  return db
    .select()
    .from(notes)
    .where(eq(notes.userId, userId))
    .orderBy(desc(notes.date));
}

export async function getNoteById(id: string, userId: string) {
  const [note] = await db
    .select()
    .from(notes)
    .where(and(eq(notes.id, id), eq(notes.userId, userId)))
    .limit(1);
  return note ?? null;
}

export async function createNote(userId: string, dto: CreateNoteDto) {
  const [note] = await db
    .insert(notes)
    .values({
      userId,
      walletId: dto.walletId ?? null,
      direction: dto.direction,
      amount: dto.amount.toString(),
      title: dto.title,
      description: dto.description,
      date: new Date(dto.date),
      tags: dto.tags ?? [],
    })
    .returning();
  return note;
}

export async function updateNote(id: string, userId: string, dto: UpdateNoteDto) {
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (dto.direction !== undefined) updates.direction = dto.direction;
  if (dto.amount !== undefined) updates.amount = dto.amount.toString();
  if (dto.title !== undefined) updates.title = dto.title;
  if (dto.description !== undefined) updates.description = dto.description;
  if (dto.date !== undefined) updates.date = new Date(dto.date);
  if (dto.tags !== undefined) updates.tags = dto.tags;

  const [note] = await db
    .update(notes)
    .set(updates)
    .where(and(eq(notes.id, id), eq(notes.userId, userId)))
    .returning();
  return note ?? null;
}

export async function deleteNote(id: string, userId: string) {
  const result = await db
    .delete(notes)
    .where(and(eq(notes.id, id), eq(notes.userId, userId)))
    .returning();
  return result.length > 0;
}
