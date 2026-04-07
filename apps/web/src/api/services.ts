import { api, publicApi } from "./client";
import {
  AuthResponse,
  LoginDto,
  RegisterDto,
  WalletDto,
  CreateWalletDto,
  UpdateWalletDto,
  TransactionDto,
  CreateTransactionDto,
  NoteDto,
  CreateNoteDto,
  UpdateNoteDto,
  PortfolioStatsDto,
  UserDto,
} from "@vestly/shared";

type Wrap<T> = { data: T };

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const authApi = {
  register: (dto: RegisterDto) =>
    publicApi.post<Wrap<AuthResponse>>("/auth/register", dto).then((r) => r.data.data),
  login: (dto: LoginDto) =>
    publicApi.post<Wrap<AuthResponse>>("/auth/login", dto).then((r) => r.data.data),
  refresh: () =>
    publicApi.post<Wrap<AuthResponse>>("/auth/refresh").then((r) => r.data.data),
  logout: () => publicApi.post("/auth/logout"),
  me: () => api.get<Wrap<UserDto>>("/auth/me").then((r) => r.data.data),
};

// ─── Wallets ──────────────────────────────────────────────────────────────────

export const walletsApi = {
  list: () => api.get<Wrap<WalletDto[]>>("/wallets").then((r) => r.data.data),
  get: (id: string) => api.get<Wrap<WalletDto>>(`/wallets/${id}`).then((r) => r.data.data),
  create: (dto: CreateWalletDto) =>
    api.post<Wrap<WalletDto>>("/wallets", dto).then((r) => r.data.data),
  update: (id: string, dto: UpdateWalletDto) =>
    api.patch<Wrap<WalletDto>>(`/wallets/${id}`, dto).then((r) => r.data.data),
  delete: (id: string) => api.delete(`/wallets/${id}`),
};

// ─── Transactions ─────────────────────────────────────────────────────────────

export const transactionsApi = {
  listByWallet: (walletId: string) =>
    api
      .get<Wrap<TransactionDto[]>>(`/transactions/wallet/${walletId}`)
      .then((r) => r.data.data),
  create: (dto: CreateTransactionDto) =>
    api.post<Wrap<TransactionDto>>("/transactions", dto).then((r) => r.data.data),
  delete: (id: string) => api.delete(`/transactions/${id}`),
};

// ─── Notes ────────────────────────────────────────────────────────────────────

export const notesApi = {
  list: () => api.get<Wrap<NoteDto[]>>("/notes").then((r) => r.data.data),
  get: (id: string) => api.get<Wrap<NoteDto>>(`/notes/${id}`).then((r) => r.data.data),
  create: (dto: CreateNoteDto) =>
    api.post<Wrap<NoteDto>>("/notes", dto).then((r) => r.data.data),
  update: (id: string, dto: UpdateNoteDto) =>
    api.patch<Wrap<NoteDto>>(`/notes/${id}`, dto).then((r) => r.data.data),
  delete: (id: string) => api.delete(`/notes/${id}`),
};

// ─── Stats ────────────────────────────────────────────────────────────────────

export const statsApi = {
  portfolio: () =>
    api.get<Wrap<PortfolioStatsDto>>("/stats").then((r) => r.data.data),
};
