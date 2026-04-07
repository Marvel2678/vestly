import { Response } from "express";
import { z } from "zod";
import { AuthRequest } from "../middleware/auth.middleware";
import { getUserNotes, getNoteById, createNote, updateNote, deleteNote } from "../services/notes.service";
import { sendError, sendSuccess } from "../utils/response";
import { NoteDirection } from "@vestly/shared";

const createSchema = z.object({
  walletId: z.string().uuid().optional(),
  direction: z.nativeEnum(NoteDirection),
  amount: z.number().positive(),
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  date: z.string().datetime(),
  tags: z.array(z.string()).optional(),
});

const updateSchema = createSchema.partial();

export async function list(req: AuthRequest, res: Response) {
  const data = await getUserNotes(req.userId!);
  return sendSuccess(res, data);
}

export async function get(req: AuthRequest, res: Response) {
  const note = await getNoteById(req.params.id, req.userId!);
  if (!note) return sendError(res, 404, "Note not found");
  return sendSuccess(res, note);
}

export async function create(req: AuthRequest, res: Response) {
  const result = createSchema.safeParse(req.body);
  if (!result.success) return sendError(res, 400, result.error.message, "Validation Error");

  const note = await createNote(req.userId!, result.data);
  return sendSuccess(res, note, 201);
}

export async function update(req: AuthRequest, res: Response) {
  const result = updateSchema.safeParse(req.body);
  if (!result.success) return sendError(res, 400, result.error.message, "Validation Error");

  const note = await updateNote(req.params.id, req.userId!, result.data);
  if (!note) return sendError(res, 404, "Note not found");
  return sendSuccess(res, note);
}

export async function remove(req: AuthRequest, res: Response) {
  const ok = await deleteNote(req.params.id, req.userId!);
  if (!ok) return sendError(res, 404, "Note not found");
  return sendSuccess(res, { deleted: true });
}
