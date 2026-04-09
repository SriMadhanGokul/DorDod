import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function LandingPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  // ✅ If already logged in, skip landing and go straight to the right page
  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      const role = (user as any).role;
      if (role === "admin") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    }
  }, [loading, isAuthenticated, user]);

  // Show spinner while checking session
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">D</span>
          </div>
          <span className="font-bold text-lg">DoR-DoD</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="text-sm text-foreground-muted hover:text-foreground transition-colors"
          >
            Sign In
          </Link>
          <Link to="/register" className="btn-primary text-sm py-2 px-4">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="gradient-hero py-24 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <span className="text-xs font-semibold bg-primary/10 text-primary px-3 py-1 rounded-full">
            Your Personal Growth Platform
          </span>
          <h1 className="text-4xl md:text-6xl font-bold mt-6 mb-4 leading-tight">
            Track Your Skills.
            <br />
            <span className="text-primary">Achieve Your Goals.</span>
          </h1>
          <p className="text-foreground-muted text-lg mb-8 max-w-xl mx-auto">
            DoR-DoD helps you choose a career path, track skills, set goals,
            build habits, and measure your growth — all in one place.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link to="/register" className="btn-primary text-base py-3 px-8">
              Start for Free 🚀
            </Link>
            <Link to="/login" className="btn-secondary text-base py-3 px-8">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 max-w-6xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
          Everything you need to grow
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              emoji: "🎯",
              title: "Goal Tracking",
              desc: "Set personal and professional goals with sub-goals, progress tracking, and auto-achievements.",
            },
            {
              emoji: "🚀",
              title: "Career Paths",
              desc: "Choose from 6 career paths — Full Stack, AI/ML, Cloud, Cybersecurity, Data, Mobile.",
            },
            {
              emoji: "📖",
              title: "Skill Tracker",
              desc: "Mark skills as Learned, Learning, or To Learn. Add custom skills outside your path.",
            },
            {
              emoji: "🔥",
              title: "21-Day Habits",
              desc: "Build lasting habits with a 21-day tracker. See your streaks and completion rates.",
            },
            {
              emoji: "📊",
              title: "Analytics",
              desc: "Real charts showing your growth across goals, habits, skills, and courses.",
            },
            {
              emoji: "🏆",
              title: "Achievements",
              desc: "Auto-earn achievements when you hit 75%+ on goals. Celebrate your wins.",
            },
          ].map((f, i) => (
            <div key={i} className="card-elevated text-center">
              <div className="text-4xl mb-3">{f.emoji}</div>
              <h3 className="font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-foreground-muted">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="gradient-hero py-16 px-6 text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-4">
          Ready to start your journey?
        </h2>
        <p className="text-foreground-muted mb-8">
          Join thousands of learners tracking their growth with DoR-DoD.
        </p>
        <Link to="/register" className="btn-primary text-base py-3 px-8">
          Create Free Account
        </Link>
      </section>

      {/* Footer */}
      <footer className="text-center py-6 text-sm text-foreground-muted border-t border-border">
        © 2025 DoR-DoD Learning Platform. Built for growth.
      </footer>
    </div>
  );
}
