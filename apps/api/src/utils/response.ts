import { Response } from "express";

export function sendError(res: Response, statusCode: number, message: string, error = "Error") {
  return res.status(statusCode).json({ statusCode, error, message });
}

export function sendSuccess<T>(res: Response, data: T, statusCode = 200) {
  return res.status(statusCode).json({ data });
}
