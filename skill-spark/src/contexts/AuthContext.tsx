import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import { api } from "@/utils/api";
import toast from "react-hot-toast";

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  subscription?: string;
  hasPassword?: boolean;
  isGoogleUser?: boolean;
  role?: string;
  suspended?: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  // ✅ Starts true — we are checking session cookie on mount
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user has a valid cookie session
    api
      .get("/auth/me")
      .then((r) => setUser(r.data.user))
      .catch(() => setUser(null)) // no session = null, not an error
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post("/auth/login", { email, password });
    setUser(res.data.user);
    toast.success(res.data.message || "Welcome back!");
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch {}
    setUser(null);
    toast.success("Logged out!");
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, loading, login, logout, setUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
