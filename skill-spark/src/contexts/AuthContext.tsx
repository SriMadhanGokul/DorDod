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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ✅ FIX: Check localStorage first, then verify with backend
    const initAuth = async () => {
      try {
        // Step 1: Check localStorage for existing session
        const token = localStorage.getItem("authToken");
        const userStr = localStorage.getItem("user");

        // If no token, user is not logged in
        if (!token) {
          setUser(null);
          setLoading(false);
          return;
        }

        // Step 2: Try to validate token with backend
        try {
          const res = await api.get("/auth/me");
          setUser(res.data.user);
        } catch (err: any) {
          // Token is invalid or expired, clear it
          console.log("Token validation failed, clearing auth");
          localStorage.removeItem("authToken");
          localStorage.removeItem("user");
          setUser(null);
        }
      } catch (err) {
        console.error("Auth init error:", err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await api.post("/auth/login", { email, password });

      // Save token and user to localStorage
      if (res.data.token) {
        localStorage.setItem("authToken", res.data.token);
      }
      if (res.data.user) {
        localStorage.setItem("user", JSON.stringify(res.data.user));
        setUser(res.data.user);
      }

      toast.success(res.data.message || "Welcome back!");
    } catch (err: any) {
      const message = err.response?.data?.message || "Login failed";
      toast.error(message);
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      console.log("Logout error (expected):", err);
    }

    // Clear all auth data
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
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
