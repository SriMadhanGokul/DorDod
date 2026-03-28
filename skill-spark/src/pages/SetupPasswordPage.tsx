import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/utils/api";
import { useAuth } from "@/contexts/AuthContext";
import toast from "react-hot-toast";
import { FaLock, FaGoogle } from "react-icons/fa";

export default function SetupPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [skipping, setSkipping] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If user already has a password, skip this page
    if (user && user.hasPassword) navigate("/dashboard");
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6)
      return toast.error("Password must be at least 6 characters");
    if (password !== confirm) return toast.error("Passwords do not match");

    setLoading(true);
    try {
      await api.post("/auth/setup-password", { password });
      toast.success("Password set! You can now login with email too 🎉");
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to set password");
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    setSkipping(true);
    toast("You can set a password anytime from your Profile settings.", {
      icon: "ℹ️",
    });
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card rounded-2xl shadow-[var(--shadow-elevated)] p-8 animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <FaGoogle className="text-2xl text-primary" />
          </div>
          <h1 className="text-2xl font-bold">One More Step!</h1>
          <p className="text-foreground-muted text-sm mt-2">
            Hi <strong>{user?.name}</strong>! You signed in with Google.
            <br />
            Set a password so you can also login with email.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground-muted" />
            <input
              type="password"
              placeholder="Create Password (min 6 chars)"
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
              placeholder="Confirm Password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              className="input-field pl-11"
            />
          </div>

          {/* Password match indicator */}
          {confirm.length > 0 && (
            <p
              className={`text-xs ${password === confirm ? "text-success" : "text-destructive"}`}
            >
              {password === confirm
                ? "✓ Passwords match"
                : "✗ Passwords do not match"}
            </p>
          )}

          {/* Password strength */}
          {password.length > 0 && (
            <div className="space-y-1">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`flex-1 h-1.5 rounded-full transition-all ${
                      password.length >= i * 3
                        ? i <= 1
                          ? "bg-destructive"
                          : i <= 2
                            ? "bg-secondary"
                            : i <= 3
                              ? "bg-blue-400"
                              : "bg-success"
                        : "bg-muted"
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-foreground-muted">
                {password.length < 6
                  ? "Too short"
                  : password.length < 9
                    ? "Weak"
                    : password.length < 12
                      ? "Good"
                      : "Strong"}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full disabled:opacity-50"
          >
            {loading ? "Setting Password..." : "Set Password & Continue"}
          </button>
        </form>

        {/* Skip option */}
        <button
          onClick={handleSkip}
          disabled={skipping}
          className="w-full mt-3 py-2 text-sm text-foreground-muted hover:text-foreground transition-colors"
        >
          Skip for now — I'll use Google login only
        </button>

        <p className="text-center text-xs text-foreground-muted mt-4">
          You can always set a password later from Profile → Settings
        </p>
      </div>
    </div>
  );
}
