import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/utils/api";
import toast from "react-hot-toast";
import { FaEnvelope, FaCheckCircle } from "react-icons/fa";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setSent(true);
      toast.success("Reset link sent!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to send reset email");
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
          <h1 className="text-2xl font-bold">Forgot Password?</h1>
          <p className="text-foreground-muted text-sm mt-1">
            Enter your email to receive a reset link
          </p>
        </div>

        {!sent ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground-muted" />
              <input
                type="email"
                placeholder="Your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input-field pl-11"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        ) : (
          <div className="text-center space-y-4">
            <FaCheckCircle className="text-5xl text-success mx-auto" />
            <h2 className="text-lg font-semibold">Check your email!</h2>
            <p className="text-sm text-foreground-muted">
              We sent a password reset link to <strong>{email}</strong>.<br />
              It expires in 15 minutes.
            </p>
            <button
              onClick={() => setSent(false)}
              className="text-sm text-primary hover:underline"
            >
              Didn't receive it? Send again
            </button>
          </div>
        )}

        <p className="text-center text-sm text-foreground-muted mt-6">
          Remember your password?{" "}
          <Link
            to="/login"
            className="text-primary font-semibold hover:underline"
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
