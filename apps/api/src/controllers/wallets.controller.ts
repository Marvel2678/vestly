import { Response } from "express";
import { z } from "zod";
import { AuthRequest } from "../middleware/auth.middleware";
import {
  getUserWallets,
  getWalletById,
  createWallet,
  updateWallet,
  deleteWallet,
  recalculateAllWallets,
} from "../services/wallets.service";
import { sendError, sendSuccess } from "../utils/response";
import { WalletType } from "@vestly/shared";

const createSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.nativeEnum(WalletType),
  currency: z.string().max(10).optional(),
  description: z.string().optional(),
});

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
});

export async function list(req: AuthRequest, res: Response) {
  const data = await getUserWallets(req.userId!);
  return sendSuccess(res, data);
}

export async function get(req: AuthRequest, res: Response) {
  const wallet = await getWalletById(req.params.id, req.userId!);
  if (!wallet) return sendError(res, 404, "Wallet not found");
  return sendSuccess(res, wallet);
}

export async function create(req: AuthRequest, res: Response) {
  const result = createSchema.safeParse(req.body);
  if (!result.success)
    return sendError(res, 400, result.error.message, "Validation Error");

  const wallet = await createWallet(req.userId!, result.data);
  return sendSuccess(res, wallet, 201);
}

export async function update(req: AuthRequest, res: Response) {
  const result = updateSchema.safeParse(req.body);
  if (!result.success)
    return sendError(res, 400, result.error.message, "Validation Error");

  const wallet = await updateWallet(req.params.id, req.userId!, result.data);
  if (!wallet) return sendError(res, 404, "Wallet not found");
  return sendSuccess(res, wallet);
}

export async function remove(req: AuthRequest, res: Response) {
  const ok = await deleteWallet(req.params.id, req.userId!);
  if (!ok) return sendError(res, 404, "Wallet not found");
  return sendSuccess(res, { deleted: true });
}

export async function recalculate(req: AuthRequest, res: Response) {
  try {
    const wallets = await recalculateAllWallets(req.userId!);
    return sendSuccess(res, wallets);
  } catch (error) {
    console.error("Error recalculating wallets:", error);
    return sendError(res, 500, "An error occurred while recalculating wallets");
  }
}
