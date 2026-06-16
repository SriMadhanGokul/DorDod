import axios from "axios";

export const api = axios.create({
  //baseURL: "http://localhost:5000/api",
  baseURL: "https://dordod-1.onrender.com/api",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// Mock mode - set to true for frontend-only development
export const MOCK_MODE = false;

// ✅ REQUEST INTERCEPTOR - Add auth token to every request
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem("authToken");

    // If token exists, add it to Authorization header
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// ✅ RESPONSE INTERCEPTOR - Handle 401 errors (but not during auth check)
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // ✅ FIX: Don't redirect on /auth/me 401 (let AuthContext handle it)
    if (
      error.response?.status === 401 &&
      error.config?.url !== "/auth/me" &&
      !error.config?.url?.includes("/auth/me")
    ) {
      console.warn("🔐 Unauthorized - Redirecting to login");
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  },
);
