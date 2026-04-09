import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/utils/api";
import toast from "react-hot-toast";
import {
  FaRocket,
  FaBullseye,
  FaFire,
  FaCheck,
  FaArrowRight,
} from "react-icons/fa";

const CAREER_PATHS = [
  {
    id: "fullstack",
    emoji: "🚀",
    title: "Full Stack Developer",
    subtitle: "MERN / Next.js",
    demand: "Very High",
  },
  {
    id: "ai_ml",
    emoji: "🤖",
    title: "AI / ML Engineer",
    subtitle: "Machine Learning",
    demand: "Exploding",
  },
  {
    id: "cloud_devops",
    emoji: "☁️",
    title: "Cloud / DevOps",
    subtitle: "AWS / Azure / GCP",
    demand: "Very High",
  },
  {
    id: "cybersecurity",
    emoji: "🔐",
    title: "Cybersecurity",
    subtitle: "Ethical Hacking",
    demand: "Increasing Fast",
  },
  {
    id: "data",
    emoji: "📊",
    title: "Data Analyst",
    subtitle: "Analytics & Insights",
    demand: "High",
  },
  {
    id: "mobile",
    emoji: "📱",
    title: "Mobile Developer",
    subtitle: "React Native / Flutter",
    demand: "High",
  },
];

const CATEGORIES = [
  "Career",
  "Fitness",
  "Spiritual",
  "Family",
  "Financial",
  "Intellectual",
  "Social",
  "Other",
];

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [careerPath, setCareerPath] = useState("");
  const [goal, setGoal] = useState({
    title: "",
    category: "Career",
    priority: "Medium",
  });
  const [habit, setHabit] = useState("");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const handleSelectPath = async () => {
    if (!careerPath) return toast.error("Please select a career path");
    setSaving(true);
    try {
      await api.post("/skill-path/select", { careerId: careerPath });
      setStep(2);
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateGoal = async () => {
    if (!goal.title.trim()) return toast.error("Please enter a goal");
    setSaving(true);
    try {
      await api.post("/goals", {
        ...goal,
        goalType: "Professional",
        status: "Not Started",
        progress: 0,
      });
      setStep(3);
    } catch {
      toast.error("Failed to create goal");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateHabit = async () => {
    if (!habit.trim()) return toast.error("Please enter a habit");
    setSaving(true);
    try {
      await api.post("/habits", { name: habit, days: Array(21).fill(false) });
      // Mark onboarding complete
      localStorage.setItem("onboarded", "true");
      toast.success("🎉 Welcome to DoR-DoD! Let's grow together!");
      navigate("/dashboard");
    } catch {
      toast.error("Failed to create habit");
    } finally {
      setSaving(false);
    }
  };

  const skip = () => {
    localStorage.setItem("onboarded", "true");
    navigate("/dashboard");
  };

  const steps = [
    { num: 1, icon: FaRocket, label: "Career Path" },
    { num: 2, icon: FaBullseye, label: "First Goal" },
    { num: 3, icon: FaFire, label: "First Habit" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl gradient-hero flex items-center justify-center mx-auto mb-4">
            <span className="text-primary-foreground font-bold text-2xl">
              D
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold">
            Welcome to DoR-DoD! 🎉
          </h1>
          <p className="text-foreground-muted mt-2">
            Let's set you up in 3 quick steps
          </p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-0 mb-8">
          {steps.map((s, i) => (
            <div key={s.num} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                    step === s.num
                      ? "bg-primary text-primary-foreground shadow-lg scale-110"
                      : step > s.num
                        ? "bg-success text-white"
                        : "bg-muted text-foreground-muted"
                  }`}
                >
                  {step > s.num ? (
                    <FaCheck className="text-lg" />
                  ) : (
                    <s.icon className="text-lg" />
                  )}
                </div>
                <span
                  className={`text-xs mt-1 font-medium ${step === s.num ? "text-primary" : "text-foreground-muted"}`}
                >
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`w-16 md:w-24 h-0.5 mx-2 mb-4 transition-all ${step > s.num ? "bg-success" : "bg-border"}`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="card-elevated p-6 md:p-8 animate-fade-in">
          {/* Step 1: Career Path */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold">
                  🗺️ Choose Your Career Path
                </h2>
                <p className="text-foreground-muted text-sm mt-1">
                  We'll track the right skills for your chosen path
                </p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {CAREER_PATHS.map((path) => (
                  <button
                    key={path.id}
                    onClick={() => setCareerPath(path.id)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      careerPath === path.id
                        ? "border-primary bg-primary/5 shadow-md"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    <span className="text-3xl block mb-2">{path.emoji}</span>
                    <p className="font-semibold text-sm">{path.title}</p>
                    <p className="text-xs text-foreground-muted">
                      {path.subtitle}
                    </p>
                    <p className="text-xs text-primary mt-1">
                      🔥 {path.demand}
                    </p>
                  </button>
                ))}
              </div>
              <div className="flex justify-between pt-2">
                <button
                  onClick={skip}
                  className="text-sm text-foreground-muted hover:text-foreground"
                >
                  Skip setup →
                </button>
                <button
                  onClick={handleSelectPath}
                  disabled={!careerPath || saving}
                  className="btn-primary flex items-center gap-2 disabled:opacity-50"
                >
                  {saving ? "Setting up..." : "Next"}{" "}
                  <FaArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: First Goal */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold">🎯 Set Your First Goal</h2>
                <p className="text-foreground-muted text-sm mt-1">
                  What do you want to achieve? Be specific.
                </p>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-foreground-muted font-medium">
                    Goal Title *
                  </label>
                  <input
                    placeholder="e.g. Become a Full Stack Developer in 6 months"
                    value={goal.title}
                    onChange={(e) =>
                      setGoal((p) => ({ ...p, title: e.target.value }))
                    }
                    className="input-field mt-1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-foreground-muted font-medium">
                      Category
                    </label>
                    <select
                      value={goal.category}
                      onChange={(e) =>
                        setGoal((p) => ({ ...p, category: e.target.value }))
                      }
                      className="input-field mt-1"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-foreground-muted font-medium">
                      Priority
                    </label>
                    <select
                      value={goal.priority}
                      onChange={(e) =>
                        setGoal((p) => ({ ...p, priority: e.target.value }))
                      }
                      className="input-field mt-1"
                    >
                      <option>High</option>
                      <option>Medium</option>
                      <option>Low</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex justify-between pt-2">
                <button
                  onClick={() => setStep(1)}
                  className="btn-secondary text-sm"
                >
                  ← Back
                </button>
                <button
                  onClick={handleCreateGoal}
                  disabled={!goal.title.trim() || saving}
                  className="btn-primary flex items-center gap-2 disabled:opacity-50"
                >
                  {saving ? "Creating..." : "Next"}{" "}
                  <FaArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: First Habit */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold">🔥 Build Your First Habit</h2>
                <p className="text-foreground-muted text-sm mt-1">
                  21 days to build a habit. What will you do every day?
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  "Practice coding daily",
                  "Read 30 minutes",
                  "Exercise for 20 mins",
                  "Watch 1 tutorial",
                  "Write in journal",
                  "Learn 5 new words",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setHabit(suggestion)}
                    className={`p-3 rounded-xl border text-sm text-left transition-all ${
                      habit === suggestion
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
              <div>
                <label className="text-xs text-foreground-muted font-medium">
                  Or write your own:
                </label>
                <input
                  placeholder="e.g. Practice React for 1 hour"
                  value={habit}
                  onChange={(e) => setHabit(e.target.value)}
                  className="input-field mt-1"
                />
              </div>
              <div className="flex justify-between pt-2">
                <button
                  onClick={() => setStep(2)}
                  className="btn-secondary text-sm"
                >
                  ← Back
                </button>
                <button
                  onClick={handleCreateHabit}
                  disabled={!habit.trim() || saving}
                  className="btn-primary flex items-center gap-2 disabled:opacity-50"
                >
                  {saving ? "Finishing..." : "🚀 Go to Dashboard"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
