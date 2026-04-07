import { Outlet, NavLink } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export default function AppLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="logo">
          <div className="logo-icon">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 12L6 7l3 3 5-6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          Vestly
        </div>

        <div className="nav-section">
          <div className="nav-label">Overview</div>
          <NavLink to="/" end className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="9" width="4" height="6" rx="1" fill="currentColor" />
              <rect x="6" y="5" width="4" height="10" rx="1" fill="currentColor" opacity=".6" />
              <rect x="11" y="1" width="4" height="14" rx="1" fill="currentColor" opacity=".35" />
            </svg>
            Dashboard
          </NavLink>
          <NavLink to="/wallets" className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="4" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.4" />
              <path d="M1 7h14" stroke="currentColor" strokeWidth="1.4" />
              <circle cx="12" cy="10.5" r="1" fill="currentColor" />
            </svg>
            Wallets
          </NavLink>
          <NavLink to="/transactions" className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 5h10M3 8h7M3 11h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            Transactions
          </NavLink>
          <NavLink to="/notes" className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.4" />
              <path d="M5 6h6M5 9h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            Notes
          </NavLink>
        </div>

        <div className="sidebar-footer">
          <div className="nav-item" style={{ flexDirection: "column", alignItems: "flex-start", gap: 2 }}>
            <span style={{ fontWeight: 500, fontSize: 13 }}>{user?.name}</span>
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{user?.email}</span>
          </div>
          <button className="nav-item btn-ghost" style={{ width: "100%", textAlign: "left" }} onClick={logout}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M10 11l3-3-3-3M13 8H6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Sign out
          </button>
        </div>
      </aside>

      <div className="main-content">
        <Outlet />
      </div>
    </div>
  );
}
