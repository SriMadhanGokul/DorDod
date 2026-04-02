import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "@/utils/api";
import { useAuth } from "@/contexts/AuthContext";
import toast from "react-hot-toast";
import { FaUser, FaEnvelope, FaLock, FaShieldAlt } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";

type Step = "details" | "otp" | "password";

export default function RegisterPage() {
  const [step, setStep] = useState<Step>("details");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const { login } = useAuth();
  const navigate = useNavigate();

  // ─── Step 1: Send OTP ───────────────────────────────────────────────────────
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Please enter your name");
    if (!email.trim()) return toast.error("Please enter your email");
    setLoading(true);
    try {
      await api.post("/auth/send-otp", { name, email });
      toast.success(`OTP sent to ${email}`);
      setStep("otp");
      startResendTimer();
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to send OTP";
      // If email already exists, offer to login instead
      if (err.response?.data?.alreadyExists) {
        toast.error(msg, { duration: 4000 });
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  // ─── Step 2: Verify OTP ─────────────────────────────────────────────────────
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) return toast.error("Enter the 6-digit OTP");
    setLoading(true);
    try {
      await api.post("/auth/verify-otp", { email, otp });
      toast.success("Email verified! Set your password.");
      setStep("password");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  // ─── Step 3: Set Password ───────────────────────────────────────────────────
  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6)
      return toast.error("Password must be at least 6 characters");
    if (password !== confirm) return toast.error("Passwords do not match");
    setLoading(true);
    try {
      await api.post("/auth/set-password", { email, password });
      await login(email, password);
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  // ─── Resend OTP ─────────────────────────────────────────────────────────────
  const handleResend = async () => {
    if (resendTimer > 0) return;
    try {
      await api.post("/auth/resend-otp", { email });
      toast.success("New OTP sent!");
      startResendTimer();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to resend");
    }
  };

  const startResendTimer = () => {
    setResendTimer(60);
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

    const handleGoogle = () => {
    const backendUrl =
      process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";
    window.location.href = `${backendUrl}/auth/google`;
  };

  const steps = [
    { id: "details", label: "Details", num: 1 },
    { id: "otp", label: "Verify", num: 2 },
    { id: "password", label: "Password", num: 3 },
  ];

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card rounded-2xl shadow-[var(--shadow-elevated)] p-8 animate-fade-in">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl gradient-hero flex items-center justify-center mx-auto mb-3">
            <span className="text-primary-foreground font-bold text-lg">D</span>
          </div>
          <h1 className="text-2xl font-bold">Create Account</h1>
          <p className="text-foreground-muted text-sm mt-1">
            Start your growth journey today
          </p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step === s.id
                    ? "bg-primary text-primary-foreground"
                    : steps.findIndex((x) => x.id === step) > i
                      ? "bg-success text-white"
                      : "bg-muted text-foreground-muted"
                }`}
              >
                {steps.findIndex((x) => x.id === step) > i ? "✓" : s.num}
              </div>
              <span
                className={`text-xs ${step === s.id ? "text-primary font-medium" : "text-foreground-muted"}`}
              >
                {s.label}
              </span>
              {i < steps.length - 1 && <div className="w-6 h-px bg-border" />}
            </div>
          ))}
        </div>

        {/* ─── Step 1: Details ──────────────────────────────────────────────── */}
        {step === "details" && (
          <>
            <button
              onClick={handleGoogle}
              className="w-full flex items-center justify-center gap-3 border border-border rounded-xl py-3 px-4 text-sm font-medium hover:bg-muted transition-all mb-4"
            >
              <FcGoogle className="text-xl" /> Sign up with Google
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-foreground-muted">
                or sign up with email
              </span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <form onSubmit={handleSendOTP} className="space-y-4">
              <div className="relative">
                <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground-muted" />
                <input
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="input-field pl-11"
                />
              </div>
              <div className="relative">
                <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground-muted" />
                <input
                  type="email"
                  placeholder="Email Address"
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
                {loading ? "Sending OTP..." : "Send Verification OTP"}
              </button>
            </form>
            {/* Already have account */}
            <p className="text-center text-sm text-foreground-muted mt-4">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-primary font-semibold hover:underline"
              >
                Sign In
              </Link>
            </p>
          </>
        )}

        {/* ─── Step 2: OTP Verification ─────────────────────────────────────── */}
        {step === "otp" && (
          <div className="space-y-4">
            <div className="text-center mb-2">
              <FaShieldAlt className="text-4xl text-primary mx-auto mb-2" />
              <p className="text-sm text-foreground-muted">
                We sent a 6-digit OTP to <strong>{email}</strong>
              </p>
              <p className="text-xs text-foreground-muted mt-1">
                Check your inbox and spam folder
              </p>
            </div>
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <input
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                required
                maxLength={6}
                className="input-field text-center text-2xl font-bold tracking-[0.5em] py-4"
              />
              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="btn-primary w-full disabled:opacity-50"
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </button>
            </form>
            <div className="text-center space-y-2">
              <button
                onClick={handleResend}
                disabled={resendTimer > 0}
                className={`text-sm transition-colors ${resendTimer > 0 ? "text-foreground-muted" : "text-primary hover:underline"}`}
              >
                {resendTimer > 0
                  ? `Resend OTP in ${resendTimer}s`
                  : "Resend OTP"}
              </button>
              <br />
              <button
                onClick={() => {
                  setStep("details");
                  setOtp("");
                }}
                className="text-sm text-foreground-muted hover:text-foreground"
              >
                ← Change email
              </button>
            </div>
          </div>
        )}

        {/* ─── Step 3: Set Password ─────────────────────────────────────────── */}
        {step === "password" && (
          <form onSubmit={handleSetPassword} className="space-y-4">
            <div className="text-center mb-2">
              <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-2">
                <span className="text-success text-2xl">✓</span>
              </div>
              <p className="text-sm text-foreground-muted">
                Email verified! Now set your password.
              </p>
            </div>
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

            {/* Match indicator */}
            {confirm.length > 0 && (
              <p
                className={`text-xs ${password === confirm ? "text-success" : "text-destructive"}`}
              >
                {password === confirm
                  ? "✓ Passwords match"
                  : "✗ Passwords do not match"}
              </p>
            )}

            {/* Strength bar */}
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
              {loading ? "Creating Account..." : "Create Account 🚀"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
