import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { api } from "@/utils/api";
import toast from "react-hot-toast";
import { FaLock, FaCheckCircle } from "react-icons/fa";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const token = searchParams.get("token") || "";
  const email = searchParams.get("email") || "";

  useEffect(() => {
    if (!token || !email) {
      toast.error("Invalid reset link");
      navigate("/forgot-password");
    }
  }, [token, email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6)
      return toast.error("Password must be at least 6 characters");
    if (password !== confirm) return toast.error("Passwords do not match");

    setLoading(true);
    try {
      await api.post("/auth/reset-password", { email, token, password });
      setDone(true);
      toast.success("Password reset successfully!");
      setTimeout(() => navigate("/login"), 2500);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card rounded-2xl shadow-[var(--shadow-elevated)] p-8 animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl gradient-hero flex items-center justify-center mx-auto mb-4">
            <span className="text-primary-foreground font-bold text-lg">D</span>
          </div>
          <h1 className="text-2xl font-bold">Reset Password</h1>
          <p className="text-foreground-muted text-sm mt-1">
            Create a new password for your account
          </p>
        </div>

        {!done ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground-muted" />
              <input
                type="password"
                placeholder="New Password (min 6 chars)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="input-field pl-11"
              />
            </div>
            <div className="relative">
              <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground-muted" />
              <input
                type="password"
                placeholder="Confirm New Password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                className="input-field pl-11"
              />
            </div>
            {/* Password match indicator */}
            {confirm && (
              <p
                className={`text-xs ${password === confirm ? "text-success" : "text-destructive"}`}
              >
                {password === confirm
                  ? "✓ Passwords match"
                  : "✗ Passwords do not match"}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        ) : (
          <div className="text-center space-y-4">
            <FaCheckCircle className="text-5xl text-success mx-auto" />
            <h2 className="text-lg font-semibold">Password Reset!</h2>
            <p className="text-sm text-foreground-muted">
              Redirecting you to login...
            </p>
          </div>
        )}

        <p className="text-center text-sm text-foreground-muted mt-6">
          <Link
            to="/login"
            className="text-primary font-semibold hover:underline"
          >
            Back to Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
