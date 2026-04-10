import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth.routes";
import walletsRoutes from "./routes/wallets.routes";
import transactionsRoutes from "./routes/transactions.routes";
import notesRoutes from "./routes/notes.routes";
import statsRoutes from "./routes/stats.routes";

const app: express.Application = express();

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/wallets", walletsRoutes);
app.use("/api/transactions", transactionsRoutes);
app.use("/api/notes", notesRoutes);
app.use("/api/stats", statsRoutes);

app.use((_req, res) => res.status(404).json({ error: "Not Found" }));

export default app;
