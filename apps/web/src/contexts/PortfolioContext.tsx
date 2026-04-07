import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import {
  WalletDto,
  NoteDto,
  TransactionDto,
  PortfolioStatsDto,
  CreateWalletDto,
  CreateNoteDto,
  UpdateNoteDto,
  CreateTransactionDto,
} from "@vestly/shared";
import { walletsApi, notesApi, transactionsApi, statsApi } from "../api/services";
import { useAuth } from "./AuthContext";

interface PortfolioContextValue {
  wallets: WalletDto[];
  notes: NoteDto[];
  transactions: Record<string, TransactionDto[]>; // keyed by walletId
  stats: PortfolioStatsDto | null;
  isLoading: boolean;

  // Wallets
  createWallet: (dto: CreateWalletDto) => Promise<WalletDto>;
  deleteWallet: (id: string) => Promise<void>;

  // Notes
  createNote: (dto: CreateNoteDto) => Promise<NoteDto>;
  updateNote: (id: string, dto: UpdateNoteDto) => Promise<NoteDto>;
  deleteNote: (id: string) => Promise<void>;

  // Transactions
  fetchTransactions: (walletId: string) => Promise<void>;
  createTransaction: (dto: CreateTransactionDto) => Promise<TransactionDto>;
  deleteTransaction: (id: string, walletId: string) => Promise<void>;

  // Refresh
  refreshAll: () => Promise<void>;
}

const PortfolioContext = createContext<PortfolioContextValue | null>(null);

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [wallets, setWallets] = useState<WalletDto[]>([]);
  const [notes, setNotes] = useState<NoteDto[]>([]);
  const [transactions, setTransactions] = useState<Record<string, TransactionDto[]>>({});
  const [stats, setStats] = useState<PortfolioStatsDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refreshAll = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const [w, n, s] = await Promise.all([
        walletsApi.list(),
        notesApi.list(),
        statsApi.portfolio(),
      ]);
      setWallets(w);
      setNotes(n);
      setStats(s);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) refreshAll();
    else {
      setWallets([]);
      setNotes([]);
      setTransactions({});
      setStats(null);
    }
  }, [isAuthenticated, refreshAll]);

  // ─── Wallets ───────────────────────────────────────────────────────────────

  const createWallet = useCallback(async (dto: CreateWalletDto) => {
    const wallet = await walletsApi.create(dto);
    setWallets((prev) => [...prev, wallet]);
    return wallet;
  }, []);

  const deleteWallet = useCallback(async (id: string) => {
    await walletsApi.delete(id);
    setWallets((prev) => prev.filter((w) => w.id !== id));
    setTransactions((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    statsApi.portfolio().then(setStats).catch(() => {});
  }, []);

  // ─── Notes ─────────────────────────────────────────────────────────────────

  const createNote = useCallback(async (dto: CreateNoteDto) => {
    const note = await notesApi.create(dto);
    setNotes((prev) => [note, ...prev]);
    return note;
  }, []);

  const updateNote = useCallback(async (id: string, dto: UpdateNoteDto) => {
    const note = await notesApi.update(id, dto);
    setNotes((prev) => prev.map((n) => (n.id === id ? note : n)));
    return note;
  }, []);

  const deleteNote = useCallback(async (id: string) => {
    await notesApi.delete(id);
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // ─── Transactions ──────────────────────────────────────────────────────────

  const fetchTransactions = useCallback(async (walletId: string) => {
    const txs = await transactionsApi.listByWallet(walletId);
    setTransactions((prev) => ({ ...prev, [walletId]: txs }));
  }, []);

  const createTransaction = useCallback(async (dto: CreateTransactionDto) => {
    const tx = await transactionsApi.create(dto);
    setTransactions((prev) => ({
      ...prev,
      [dto.walletId]: [tx, ...(prev[dto.walletId] ?? [])],
    }));
    statsApi.portfolio().then(setStats).catch(() => {});
    return tx;
  }, []);

  const deleteTransaction = useCallback(async (id: string, walletId: string) => {
    await transactionsApi.delete(id);
    setTransactions((prev) => ({
      ...prev,
      [walletId]: (prev[walletId] ?? []).filter((t) => t.id !== id),
    }));
    statsApi.portfolio().then(setStats).catch(() => {});
  }, []);

  return (
    <PortfolioContext.Provider
      value={{
        wallets,
        notes,
        transactions,
        stats,
        isLoading,
        createWallet,
        deleteWallet,
        createNote,
        updateNote,
        deleteNote,
        fetchTransactions,
        createTransaction,
        deleteTransaction,
        refreshAll,
      }}
    >
      {children}
    </PortfolioContext.Provider>
  );
}

export function usePortfolio(): PortfolioContextValue {
  const ctx = useContext(PortfolioContext);
  if (!ctx) throw new Error("usePortfolio must be used inside PortfolioProvider");
  return ctx;
}
