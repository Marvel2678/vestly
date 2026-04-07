import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { PortfolioProvider } from "./contexts/PortfolioContext";
import { ReactNode } from "react";

import AppLayout from "./components/layout/AppLayout";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import DashboardPage from "./pages/dashboard/DashboardPage";
import WalletsPage from "./pages/wallets/WalletsPage";
import TransactionsPage from "./pages/transactions/TransactionsPage";
import NotesPage from "./pages/notes/NotesPage";

function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <div className="splash">Loading…</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function GuestOnly({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <div className="splash">Loading…</div>;
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PortfolioProvider>
          <Routes>
            <Route
              path="/login"
              element={
                <GuestOnly>
                  <LoginPage />
                </GuestOnly>
              }
            />
            <Route
              path="/register"
              element={
                <GuestOnly>
                  <RegisterPage />
                </GuestOnly>
              }
            />
            <Route
              path="/"
              element={
                <RequireAuth>
                  <AppLayout />
                </RequireAuth>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="wallets" element={<WalletsPage />} />
              <Route path="transactions" element={<TransactionsPage />} />
              <Route path="notes" element={<NotesPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </PortfolioProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
