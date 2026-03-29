import axios from "axios";

export const api = axios.create({
  baseURL: "https://dordod-1.onrender.com",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// Mock mode - set to true for frontend-only development
export const MOCK_MODE = false;
