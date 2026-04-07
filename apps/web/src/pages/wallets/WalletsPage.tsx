import { useState, FormEvent } from "react";
import { usePortfolio } from "../../contexts/PortfolioContext";
import { WalletType, CreateWalletDto } from "@vestly/shared";

const COLORS: Record<string, string> = {
  [WalletType.STOCKS]: "#1D9E75",
  [WalletType.ETF]: "#378ADD",
  [WalletType.CRYPTO]: "#BA7517",
  [WalletType.BONDS]: "#7F77DD",
  [WalletType.CASH]: "#888780",
  [WalletType.OTHER]: "#D4537E",
};

function fmt(n: string | number) {
  return "$" + parseFloat(String(n)).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function WalletsPage() {
  const { wallets, createWallet, deleteWallet } = usePortfolio();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<CreateWalletDto>({ name: "", type: WalletType.STOCKS, currency: "USD" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await createWallet(form);
      setShowModal(false);
      setForm({ name: "", type: WalletType.STOCKS, currency: "USD" });
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Failed to create wallet");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete wallet "${name}"? This will remove all its transactions.`)) return;
    await deleteWallet(id);
  }

  return (
    <>
      <div className="topbar">
        <span className="topbar-title">Wallets</span>
        <div className="topbar-actions">
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New wallet</button>
        </div>
      </div>

      <div className="page">
        {wallets.length === 0 ? (
          <div className="card">
            <div className="empty">
              <p>No wallets yet. Create your first wallet to start tracking investments.</p>
              <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New wallet</button>
            </div>
          </div>
        ) : (
          <div className="grid-3">
            {wallets.map((w) => {
              const roi = parseFloat(w.totalInvested) > 0
                ? ((parseFloat(w.currentValue) - parseFloat(w.totalInvested)) / parseFloat(w.totalInvested)) * 100
                : 0;
              const gain = parseFloat(w.currentValue) - parseFloat(w.totalInvested);
              return (
                <div key={w.id} className="card">
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: COLORS[w.type] ?? "#888", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <div style={{ width: 12, height: 12, borderRadius: "50%", background: "rgba(255,255,255,0.5)" }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500, fontSize: 14 }}>{w.name}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "capitalize" }}>{w.type} · {w.currency}</div>
                    </div>
                    <button className="btn-ghost" style={{ padding: "4px 8px", fontSize: 12, color: "var(--text-muted)" }} onClick={() => handleDelete(w.id, w.name)}>✕</button>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>Current value</span>
                      <span style={{ fontWeight: 500 }}>{fmt(w.currentValue)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>Invested</span>
                      <span>{fmt(w.totalInvested)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>Gain / Loss</span>
                      <span style={{ color: gain >= 0 ? "var(--color-teal-dark)" : "#993c1d", fontWeight: 500 }}>
                        {gain >= 0 ? "+" : ""}{fmt(gain)}
                      </span>
                    </div>
                    <div style={{ height: "0.5px", background: "var(--border)", margin: "4px 0" }} />
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>ROI</span>
                      <span style={{ fontWeight: 500, color: roi >= 0 ? "var(--color-teal-dark)" : "#993c1d" }}>
                        {roi >= 0 ? "+" : ""}{roi.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                  {w.description && (
                    <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 12 }}>{w.description}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">New wallet</span>
              <button className="btn-ghost" onClick={() => setShowModal(false)}>✕</button>
            </div>
            {error && <div className="error-msg">{error}</div>}
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">Wallet name</label>
                <input className="form-input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. US Stocks" required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select className="form-select" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as WalletType }))}>
                    {Object.values(WalletType).map((t) => (
                      <option key={t} value={t} style={{ textTransform: "capitalize" }}>{t}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Currency</label>
                  <select className="form-select" value={form.currency} onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}>
                    {["USD", "EUR", "GBP", "PLN", "CHF"].map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Description (optional)</label>
                <input className="form-input" value={form.description ?? ""} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Short note about this wallet" />
              </div>
              <div className="form-actions">
                <button type="button" className="btn" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? "Creating…" : "Create wallet"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
