import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { UserDto, LoginDto, RegisterDto } from "@vestly/shared";
import { authApi } from "../api/services";
import { setAccessToken } from "../api/client";

interface AuthState {
  user: UserDto | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  login: (dto: LoginDto) => Promise<void>;
  register: (dto: RegisterDto) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // Attempt silent refresh on app mount (user may have a valid httpOnly cookie)
  useEffect(() => {
    authApi
      .refresh()
      .then(({ accessToken, user }) => {
        setAccessToken(accessToken);
        setState({ user, isLoading: false, isAuthenticated: true });
      })
      .catch(() => {
        setAccessToken(null);
        setState({ user: null, isLoading: false, isAuthenticated: false });
      });
  }, []);

  // Listen for 401-triggered logouts from the axios interceptor
  useEffect(() => {
    const handle = () => {
      setState({ user: null, isLoading: false, isAuthenticated: false });
    };
    window.addEventListener("auth:logout", handle);
    return () => window.removeEventListener("auth:logout", handle);
  }, []);

  const login = useCallback(async (dto: LoginDto) => {
    const { accessToken, user } = await authApi.login(dto);
    setAccessToken(accessToken);
    setState({ user, isLoading: false, isAuthenticated: true });
  }, []);

  const register = useCallback(async (dto: RegisterDto) => {
    const { accessToken, user } = await authApi.register(dto);
    setAccessToken(accessToken);
    setState({ user, isLoading: false, isAuthenticated: true });
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout().catch(() => {});
    setAccessToken(null);
    setState({ user: null, isLoading: false, isAuthenticated: false });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
