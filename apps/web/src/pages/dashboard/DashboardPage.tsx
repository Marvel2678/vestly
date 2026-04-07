import { useEffect, useRef } from "react";
import { usePortfolio } from "../../contexts/PortfolioContext";
import { WalletType } from "@vestly/shared";

const WALLET_COLORS: Record<string, string> = {
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

function fmtPct(n: string | number) {
  const v = parseFloat(String(n));
  return (v >= 0 ? "+" : "") + v.toFixed(2) + "%";
}

declare global {
  interface Window { Chart: any; }
}

function useChartJs(cb: () => void, deps: unknown[]) {
  useEffect(() => {
    if (window.Chart) { cb(); return; }
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js";
    s.onload = cb;
    document.head.appendChild(s);
  }, deps);
}

export default function DashboardPage() {
  const { stats, wallets, notes, isLoading } = usePortfolio();
  const quarterRef = useRef<HTMLCanvasElement>(null);

  useChartJs(() => {
    if (!stats?.quarterResult?.length || !quarterRef.current) return;
    const Chart = window.Chart;
    const existing = Chart.getChart(quarterRef.current);
    if (existing) existing.destroy();
    new Chart(quarterRef.current, {
      type: "bar",
      data: {
        labels: stats.quarterResult.map((q) => q.label),
        datasets: [{
          data: stats.quarterResult.map((q) => parseFloat(q.gain)),
          backgroundColor: stats.quarterResult.map((q) =>
            parseFloat(q.gain) >= 0 ? "rgba(29,158,117,0.75)" : "rgba(226,75,74,0.75)"
          ),
          borderRadius: 4,
          borderSkipped: false,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { color: "#888780", font: { size: 11 } } },
          y: {
            grid: { color: "rgba(128,128,128,0.1)" },
            ticks: {
              color: "#888780",
              font: { size: 11 },
              callback: (v: number) => "$" + (Math.abs(v) >= 1000 ? (v / 1000).toFixed(1) + "k" : v),
            },
          },
        },
      },
    });
  }, [stats]);

  if (isLoading) return <div className="splash">Loading…</div>;

  const gain = stats ? parseFloat(stats.totalGain) : 0;

  return (
    <>
      <div className="topbar">
        <span className="topbar-title">Dashboard</span>
      </div>

      <div className="page">
        {/* Metrics */}
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-label">Total portfolio</div>
            <div className="metric-value">{stats ? fmt(stats.totalValue) : "—"}</div>
            <div className={`metric-delta ${gain >= 0 ? "up" : "down"}`}>
              {stats ? `${fmt(stats.totalGain)} total gain` : "No data yet"}
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Rate of return</div>
            <div className="metric-value">{stats ? fmtPct(stats.rateOfReturn) : "—"}</div>
            <div className="metric-delta" style={{ color: "var(--text-muted)" }}>overall</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Total invested</div>
            <div className="metric-value">{stats ? fmt(stats.totalInvested) : "—"}</div>
            <div className="metric-delta" style={{ color: "var(--text-muted)" }}>cost basis</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Wallets</div>
            <div className="metric-value">{wallets.length}</div>
            <div className="metric-delta" style={{ color: "var(--text-muted)" }}>active</div>
          </div>
        </div>

        <div className="grid-2" style={{ marginBottom: 18 }}>
          {/* Allocation */}
          <div className="card">
            <div className="card-header"><span className="card-title">Allocation</span></div>
            {stats?.allocationByType?.length ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {stats.allocationByType.map((a) => (
                  <div key={a.type} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)", width: 64, flexShrink: 0, textTransform: "capitalize" }}>{a.type}</div>
                    <div style={{ flex: 1, height: 6, background: "var(--bg-surface)", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ height: "100%", borderRadius: 3, background: WALLET_COLORS[a.type] ?? "#888", width: `${parseFloat(a.percent)}%` }} />
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)", width: 36, textAlign: "right" }}>{parseFloat(a.percent).toFixed(1)}%</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", width: 80, textAlign: "right" }}>{fmt(a.value)}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty"><p>Add wallets and transactions to see allocation</p></div>
            )}
          </div>

          {/* Quarterly results */}
          <div className="card">
            <div className="card-header"><span className="card-title">Quarterly results</span></div>
            <div style={{ position: "relative", width: "100%", height: 180 }}>
              <canvas ref={quarterRef} />
            </div>
          </div>
        </div>

        {/* Wallets summary */}
        <div className="card" style={{ marginBottom: 18 }}>
          <div className="card-header"><span className="card-title">Wallets</span></div>
          {wallets.length === 0 ? (
            <div className="empty"><p>No wallets yet — create one in the Wallets page</p></div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {wallets.map((w) => {
                const roi = parseFloat(w.totalInvested) > 0
                  ? ((parseFloat(w.currentValue) - parseFloat(w.totalInvested)) / parseFloat(w.totalInvested)) * 100
                  : 0;
                return (
                  <div key={w.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", border: "0.5px solid var(--border)", borderRadius: "var(--radius-md)" }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: WALLET_COLORS[w.type] ?? "#888", flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500, fontSize: 13 }}>{w.name}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "capitalize" }}>{w.type} · {w.currency}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: 500, fontSize: 13 }}>{fmt(w.currentValue)}</div>
                      <div style={{ fontSize: 11, color: roi >= 0 ? "var(--color-teal-dark)" : "#993c1d" }}>{fmtPct(roi)} ROI</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent notes */}
        <div className="card">
          <div className="card-header"><span className="card-title">Recent activity</span></div>
          {notes.length === 0 ? (
            <div className="empty"><p>No notes yet</p></div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {notes.slice(0, 5).map((n) => (
                <div key={n.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 0", borderBottom: "0.5px solid var(--border)" }}>
                  <span className={`badge badge-${n.direction}`}>{n.direction}</span>
                  <span style={{ flex: 1, fontSize: 13 }}>{n.title}</span>
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{new Date(n.date).toLocaleDateString()}</span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: n.direction === "income" ? "var(--color-teal-dark)" : "#993c1d" }}>
                    {n.direction === "income" ? "+" : "-"}{fmt(n.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
