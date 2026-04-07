import { Response } from "express";
import { z } from "zod";
import { AuthRequest } from "../middleware/auth.middleware";
import {
  getWalletTransactions,
  createTransaction,
  deleteTransaction,
} from "../services/transactions.service";
import { sendError, sendSuccess } from "../utils/response";
import { TransactionType } from "@vestly/shared";

const createSchema = z.object({
  walletId: z.string().uuid(),
  type: z.nativeEnum(TransactionType),
  asset: z.string().min(1).max(20),
  quantity: z.number().positive(),
  price: z.number().positive(),
  fee: z.number().min(0).optional(),
  date: z.string().datetime(),
  notes: z.string().optional(),
});

export async function list(req: AuthRequest, res: Response) {
  const data = await getWalletTransactions(req.params.walletId, req.userId!);
  if (data === null) return sendError(res, 404, "Wallet not found");
  return sendSuccess(res, data);
}

export async function create(req: AuthRequest, res: Response) {
  const result = createSchema.safeParse(req.body);
  if (!result.success) return sendError(res, 400, result.error.message, "Validation Error");

  const tx = await createTransaction(req.userId!, result.data);
  if (!tx) return sendError(res, 404, "Wallet not found");
  return sendSuccess(res, tx, 201);
}

export async function remove(req: AuthRequest, res: Response) {
  const ok = await deleteTransaction(req.params.id, req.userId!);
  if (!ok) return sendError(res, 404, "Transaction not found");
  return sendSuccess(res, { deleted: true });
}
