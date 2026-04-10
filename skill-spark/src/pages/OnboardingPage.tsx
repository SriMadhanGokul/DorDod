import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/utils/api";
import toast from "react-hot-toast";
import {
  FaRocket,
  FaBullseye,
  FaFire,
  FaCheck,
  FaArrowRight,
  FaPlus,
  FaTimes,
  FaStar,
  FaTag,
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

// Tag input component
function TagInput({
  tags,
  onChange,
  placeholder,
}: {
  tags: string[];
  onChange: (t: string[]) => void;
  placeholder: string;
}) {
  const [input, setInput] = useState("");
  const ref = useRef<HTMLInputElement>(null);

  const add = (val: string) => {
    const t = val.trim();
    if (!t || tags.includes(t)) return;
    onChange([...tags, t]);
    setInput("");
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(input);
    }
    if (e.key === "Backspace" && !input && tags.length > 0)
      onChange(tags.slice(0, -1));
  };

  return (
    <div
      className="flex flex-wrap gap-1.5 p-2.5 border border-border rounded-xl bg-card min-h-[44px] cursor-text"
      onClick={() => ref.current?.focus()}
    >
      {tags.map((tag, i) => (
        <span
          key={i}
          className="flex items-center gap-1 bg-primary/15 text-primary text-xs px-2 py-1 rounded-lg"
        >
          {tag}
          <button
            type="button"
            onClick={() => onChange(tags.filter((_, idx) => idx !== i))}
          >
            <FaTimes className="w-2.5 h-2.5 hover:text-destructive" />
          </button>
        </span>
      ))}
      <input
        ref={ref}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={onKey}
        onBlur={() => add(input)}
        placeholder={tags.length === 0 ? placeholder : "Add more..."}
        className="flex-1 min-w-[100px] outline-none text-sm bg-transparent placeholder:text-foreground-muted/60"
      />
    </div>
  );
}

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

  // Custom skill form
  const [showCustomSkill, setShowCustomSkill] = useState(false);
  const [customSkill, setCustomSkill] = useState({
    skillName: "",
    alreadyKnows: [] as string[],
    wantsToLearn: [] as string[],
    description: "",
    category: "Technical",
    status: "current",
  });
  const [savedCustomSkills, setSavedCustomSkills] = useState<string[]>([]);
  const [savingSkill, setSavingSkill] = useState(false);

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

  const handleSaveCustomSkill = async () => {
    if (!customSkill.skillName.trim())
      return toast.error("Skill name is required");
    setSavingSkill(true);
    try {
      await api.post("/custom-skills", {
        ...customSkill,
        alreadyKnows: customSkill.alreadyKnows.join(", "),
        wantsToLearn: customSkill.wantsToLearn.join(", "),
      });
      setSavedCustomSkills((p) => [...p, customSkill.skillName]);
      setCustomSkill({
        skillName: "",
        alreadyKnows: [],
        wantsToLearn: [],
        description: "",
        category: "Technical",
        status: "current",
      });
      setShowCustomSkill(false);
      toast.success("Skill added!");
    } catch {
      toast.error("Failed to add skill");
    } finally {
      setSavingSkill(false);
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
      localStorage.setItem("onboarded", "true");
      toast.success("🎉 All set! Welcome to DoR-DoD!");
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
            <span className="text-white font-bold text-2xl">D</span>
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

        {/* Step 1 — Career Path + Other Skills */}
        {step === 1 && (
          <div className="card-elevated p-6 md:p-8 space-y-5 animate-fade-in">
            <div>
              <h2 className="text-xl font-bold">🗺️ Choose Your Career Path</h2>
              <p className="text-foreground-muted text-sm mt-1">
                We'll track the right skills for your path. Or add your own
                custom skills below.
              </p>
            </div>

            {/* Career path cards */}
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
                  <p className="text-xs text-primary mt-1">🔥 {path.demand}</p>
                </button>
              ))}
            </div>

            {/* Other Skills section */}
            <div className="border-t border-border pt-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-semibold text-sm flex items-center gap-2">
                    <FaStar className="text-secondary" /> My Other Skills
                  </p>
                  <p className="text-xs text-foreground-muted mt-0.5">
                    Not in the career paths above? Add your own skills here.
                  </p>
                </div>
                <button
                  onClick={() => setShowCustomSkill(true)}
                  className="btn-secondary text-xs flex items-center gap-1.5 py-2"
                >
                  <FaPlus className="w-3 h-3" /> Add Other Skill
                </button>
              </div>

              {savedCustomSkills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {savedCustomSkills.map((name, i) => (
                    <span
                      key={i}
                      className="text-xs bg-secondary/15 text-secondary px-3 py-1.5 rounded-full flex items-center gap-1"
                    >
                      <FaCheck className="w-2.5 h-2.5" /> {name}
                    </span>
                  ))}
                </div>
              )}
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

        {/* Step 2 — Goal */}
        {step === 2 && (
          <div className="card-elevated p-6 md:p-8 space-y-5 animate-fade-in">
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

        {/* Step 3 — Habit */}
        {step === 3 && (
          <div className="card-elevated p-6 md:p-8 space-y-5 animate-fade-in">
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
              ].map((s) => (
                <button
                  key={s}
                  onClick={() => setHabit(s)}
                  className={`p-3 rounded-xl border text-sm text-left transition-all ${habit === s ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/40"}`}
                >
                  {s}
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

        {/* ── Add Custom Skill Modal ─────────────────────────────────────────── */}
        {showCustomSkill && (
          <div className="fixed inset-0 bg-foreground/50 flex items-start justify-center z-50 p-4 pt-8 overflow-y-auto">
            <div className="bg-card rounded-2xl p-6 w-full max-w-md my-auto animate-fade-in">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="font-bold text-lg flex items-center gap-2">
                    <FaStar className="text-secondary" /> Add Your Skill
                  </h2>
                  <p className="text-xs text-foreground-muted mt-0.5">
                    Track a skill not in the career paths
                  </p>
                </div>
                <button
                  onClick={() => setShowCustomSkill(false)}
                  className="text-foreground-muted hover:text-foreground"
                >
                  <FaTimes />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-foreground-muted">
                    Skill Name *
                  </label>
                  <input
                    placeholder="e.g. Video Editing, Public Speaking, Figma"
                    value={customSkill.skillName}
                    onChange={(e) =>
                      setCustomSkill((p) => ({
                        ...p,
                        skillName: e.target.value,
                      }))
                    }
                    className="input-field mt-1"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-foreground-muted flex items-center gap-1 mb-1">
                    <FaTag className="w-3 h-3" /> What I already know
                    <span className="font-normal opacity-60 ml-1">
                      (press Enter after each)
                    </span>
                  </label>
                  <TagInput
                    tags={customSkill.alreadyKnows}
                    onChange={(tags) =>
                      setCustomSkill((p) => ({ ...p, alreadyKnows: tags }))
                    }
                    placeholder="e.g. React, Node.js, CSS"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-foreground-muted flex items-center gap-1 mb-1">
                    <FaTag className="w-3 h-3" /> What I want to learn
                    <span className="font-normal opacity-60 ml-1">
                      (press Enter after each)
                    </span>
                  </label>
                  <TagInput
                    tags={customSkill.wantsToLearn}
                    onChange={(tags) =>
                      setCustomSkill((p) => ({ ...p, wantsToLearn: tags }))
                    }
                    placeholder="e.g. TypeScript, GraphQL, Docker"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-foreground-muted">
                      Category
                    </label>
                    <select
                      value={customSkill.category}
                      onChange={(e) =>
                        setCustomSkill((p) => ({
                          ...p,
                          category: e.target.value,
                        }))
                      }
                      className="input-field mt-1"
                    >
                      {[
                        "Technical",
                        "Leadership",
                        "Soft Skills",
                        "Creative",
                        "Language",
                        "Design",
                        "Business",
                        "Other",
                      ].map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground-muted">
                      Status
                    </label>
                    <select
                      value={customSkill.status}
                      onChange={(e) =>
                        setCustomSkill((p) => ({
                          ...p,
                          status: e.target.value,
                        }))
                      }
                      className="input-field mt-1"
                    >
                      <option value="planned">⏳ Planned</option>
                      <option value="current">📖 Learning</option>
                      <option value="completed">✅ Completed</option>
                    </select>
                  </div>
                </div>

                <textarea
                  placeholder="Description (optional)"
                  value={customSkill.description}
                  onChange={(e) =>
                    setCustomSkill((p) => ({
                      ...p,
                      description: e.target.value,
                    }))
                  }
                  className="input-field min-h-[50px]"
                />

                <button
                  onClick={handleSaveCustomSkill}
                  disabled={savingSkill || !customSkill.skillName.trim()}
                  className="btn-primary w-full disabled:opacity-50"
                >
                  {savingSkill ? "Saving..." : "+ Add This Skill"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
