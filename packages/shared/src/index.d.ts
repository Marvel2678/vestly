export declare enum WalletType {
    STOCKS = "stocks",
    ETF = "etf",
    CRYPTO = "crypto",
    BONDS = "bonds",
    CASH = "cash",
    OTHER = "other"
}
export declare enum TransactionType {
    BUY = "buy",
    SELL = "sell",
    DIVIDEND = "dividend",
    DEPOSIT = "deposit",
    WITHDRAWAL = "withdrawal",
    FEE = "fee"
}
export declare enum NoteDirection {
    INCOME = "income",
    EXPENSE = "expense"
}
export interface RegisterDto {
    email: string;
    password: string;
    name: string;
}
export interface LoginDto {
    email: string;
    password: string;
}
export interface AuthResponse {
    accessToken: string;
    user: UserDto;
}
export interface UserDto {
    id: string;
    email: string;
    name: string;
    createdAt: string;
}
export interface CreateWalletDto {
    name: string;
    type: WalletType;
    currency?: string;
    description?: string;
}
export interface UpdateWalletDto {
    name?: string;
    description?: string;
}
export interface WalletDto {
    id: string;
    userId: string;
    name: string;
    type: WalletType;
    currency: string;
    description: string | null;
    totalInvested: string;
    currentValue: string;
    createdAt: string;
    updatedAt: string;
}
export interface CreateTransactionDto {
    walletId: string;
    type: TransactionType;
    asset: string;
    quantity: number;
    price: number;
    fee?: number;
    date: string;
    notes?: string;
}
export interface TransactionDto {
    id: string;
    walletId: string;
    type: TransactionType;
    asset: string;
    quantity: string;
    price: string;
    fee: string;
    total: string;
    date: string;
    notes: string | null;
    createdAt: string;
}
export interface CreateNoteDto {
    walletId?: string;
    direction: NoteDirection;
    amount: number;
    title: string;
    description?: string;
    date: string;
    tags?: string[];
}
export interface UpdateNoteDto {
    direction?: NoteDirection;
    amount?: number;
    title?: string;
    description?: string;
    date?: string;
    tags?: string[];
}
export interface NoteDto {
    id: string;
    userId: string;
    walletId: string | null;
    direction: NoteDirection;
    amount: string;
    title: string;
    description: string | null;
    date: string;
    tags: string[];
    createdAt: string;
    updatedAt: string;
}
export interface PortfolioStatsDto {
    totalValue: string;
    totalInvested: string;
    totalGain: string;
    totalGainPercent: string;
    rateOfReturn: string;
    quarterResult: QuarterResultDto[];
    allocationByType: AllocationDto[];
}
export interface QuarterResultDto {
    label: string;
    gain: string;
    gainPercent: string;
}
export interface AllocationDto {
    type: WalletType;
    value: string;
    percent: string;
}
export interface ApiResponse<T> {
    data: T;
    message?: string;
}
export interface ApiError {
    error: string;
    message: string;
    statusCode: number;
}
export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
