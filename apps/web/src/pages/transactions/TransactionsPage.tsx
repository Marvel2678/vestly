import { useState, FormEvent, useEffect } from "react";
import { usePortfolio } from "../../contexts/PortfolioContext";
import { TransactionType, CreateTransactionDto } from "@vestly/shared";

function fmt(n: string | number) {
  return "$" + parseFloat(String(n)).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const TX_BADGE: Record<string, string> = {
  buy: "badge-buy",
  sell: "badge-sell",
  dividend: "badge-dividend",
  deposit: "badge-income",
  withdrawal: "badge-expense",
  fee: "badge-expense",
};

export default function TransactionsPage() {
  const { wallets, transactions, fetchTransactions, createTransaction, deleteTransaction } = usePortfolio();
  const [selectedWallet, setSelectedWallet] = useState<string>("");
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<Omit<CreateTransactionDto, "walletId">>({
    type: TransactionType.BUY,
    asset: "",
    quantity: 1,
    price: 0,
    fee: 0,
    date: new Date().toISOString().slice(0, 10),
    notes: "",
  });

  useEffect(() => {
    if (wallets.length && !selectedWallet) setSelectedWallet(wallets[0].id);
  }, [wallets]);

  useEffect(() => {
    if (selectedWallet && !transactions[selectedWallet]) {
      fetchTransactions(selectedWallet);
    }
  }, [selectedWallet]);

  const walletTxs = transactions[selectedWallet] ?? [];

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await createTransaction({ ...form, walletId: selectedWallet, date: new Date(form.date).toISOString() });
      setShowModal(false);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Failed to add transaction");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this transaction?")) return;
    await deleteTransaction(id, selectedWallet);
  }

  return (
    <>
      <div className="topbar">
        <span className="topbar-title">Transactions</span>
        <div className="topbar-actions">
          {wallets.length > 0 && (
            <select className="form-select" style={{ width: "auto" }} value={selectedWallet} onChange={(e) => setSelectedWallet(e.target.value)}>
              {wallets.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          )}
          <button className="btn btn-primary" onClick={() => setShowModal(true)} disabled={!selectedWallet}>+ Add transaction</button>
        </div>
      </div>

      <div className="page">
        {wallets.length === 0 ? (
          <div className="card"><div className="empty"><p>Create a wallet first to track transactions.</p></div></div>
        ) : walletTxs.length === 0 ? (
          <div className="card"><div className="empty"><p>No transactions yet for this wallet.</p><button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add transaction</button></div></div>
        ) : (
          <div className="card">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Asset</th>
                    <th>Quantity</th>
                    <th>Price</th>
                    <th>Fee</th>
                    <th>Total</th>
                    <th>Date</th>
                    <th>Notes</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {walletTxs.map((tx) => (
                    <tr key={tx.id}>
                      <td><span className={`badge ${TX_BADGE[tx.type] ?? ""}`}>{tx.type}</span></td>
                      <td style={{ fontWeight: 500 }}>{tx.asset}</td>
                      <td>{parseFloat(tx.quantity).toLocaleString()}</td>
                      <td>{fmt(tx.price)}</td>
                      <td style={{ color: "var(--text-muted)" }}>{fmt(tx.fee)}</td>
                      <td style={{ fontWeight: 500 }}>{fmt(tx.total)}</td>
                      <td style={{ color: "var(--text-muted)" }}>{new Date(tx.date).toLocaleDateString()}</td>
                      <td style={{ color: "var(--text-muted)", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tx.notes ?? "—"}</td>
                      <td>
                        <button className="btn-ghost" style={{ padding: "2px 8px", color: "var(--text-muted)" }} onClick={() => handleDelete(tx.id)}>✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Add transaction</span>
              <button className="btn-ghost" onClick={() => setShowModal(false)}>✕</button>
            </div>
            {error && <div className="error-msg">{error}</div>}
            <form onSubmit={handleCreate}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select className="form-select" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as TransactionType }))}>
                    {Object.values(TransactionType).map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Asset ticker</label>
                  <input className="form-input" value={form.asset} onChange={(e) => setForm((f) => ({ ...f, asset: e.target.value.toUpperCase() }))} placeholder="AAPL" maxLength={20} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Quantity</label>
                  <input className="form-input" type="number" min="0.00000001" step="any" value={form.quantity} onChange={(e) => setForm((f) => ({ ...f, quantity: parseFloat(e.target.value) }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Price per unit</label>
                  <input className="form-input" type="number" min="0" step="any" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: parseFloat(e.target.value) }))} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Fee</label>
                  <input className="form-input" type="number" min="0" step="any" value={form.fee} onChange={(e) => setForm((f) => ({ ...f, fee: parseFloat(e.target.value) }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input className="form-input" type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Notes (optional)</label>
                <input className="form-input" value={form.notes ?? ""} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Any additional context" />
              </div>
              <div style={{ padding: "10px 12px", background: "var(--bg-surface)", borderRadius: "var(--radius-md)", fontSize: 13, color: "var(--text-secondary)", marginBottom: 16 }}>
                Total: <strong style={{ color: "var(--text-primary)" }}>
                  ${((form.quantity * form.price) + (form.fee ?? 0)).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </strong>
              </div>
              <div className="form-actions">
                <button type="button" className="btn" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? "Adding…" : "Add transaction"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
