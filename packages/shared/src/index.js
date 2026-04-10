"use strict";
// ─── Enums ───────────────────────────────────────────────────────────────────
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoteDirection = exports.TransactionType = exports.WalletType = void 0;
var WalletType;
(function (WalletType) {
    WalletType["STOCKS"] = "stocks";
    WalletType["ETF"] = "etf";
    WalletType["CRYPTO"] = "crypto";
    WalletType["BONDS"] = "bonds";
    WalletType["CASH"] = "cash";
    WalletType["OTHER"] = "other";
})(WalletType || (exports.WalletType = WalletType = {}));
var TransactionType;
(function (TransactionType) {
    TransactionType["BUY"] = "buy";
    TransactionType["SELL"] = "sell";
    TransactionType["DIVIDEND"] = "dividend";
    TransactionType["DEPOSIT"] = "deposit";
    TransactionType["WITHDRAWAL"] = "withdrawal";
    TransactionType["FEE"] = "fee";
})(TransactionType || (exports.TransactionType = TransactionType = {}));
var NoteDirection;
(function (NoteDirection) {
    NoteDirection["INCOME"] = "income";
    NoteDirection["EXPENSE"] = "expense";
})(NoteDirection || (exports.NoteDirection = NoteDirection = {}));
