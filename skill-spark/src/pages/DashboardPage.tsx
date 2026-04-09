import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/utils/api";
import toast from "react-hot-toast";
import {
  FaBullseye,
  FaLightbulb,
  FaCalendarCheck,
  FaTrophy,
  FaSmile,
  FaFire,
  FaBook,
  FaPlus,
  FaTimes,
} from "react-icons/fa";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";

interface DashboardData {
  stats: {
    skillsAssessed: number;
    activeGoals: number;
    habitsTracked: number;
    achievements: number;
  };
  radarData: { skill: string; current: number; desired: number }[];
  activeGoals: {
    _id: string;
    title: string;
    progress: number;
    priority: string;
  }[];
  habit: { name: string; days: boolean[]; streak: number } | null;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showHabitModal, setShowHabitModal] = useState(false);
  const [goalTitle, setGoalTitle] = useState("");
  const [habitName, setHabitName] = useState("");
  const [saving, setSaving] = useState(false);

  // Onboarding check
  useEffect(() => {
    const onboarded = localStorage.getItem("onboarded");
    if (!onboarded) {
      navigate("/onboarding");
    }
  }, []);

  useEffect(() => {
    api
      .get("/dashboard")
      .then((r) => setData(r.data.data))
      .catch(() => toast.error("Failed to load dashboard"))
      .finally(() => setLoading(false));
  }, []);

  const quickAddGoal = async () => {
    if (!goalTitle.trim()) return toast.error("Enter a goal title");
    setSaving(true);
    try {
      await api.post("/goals", {
        title: goalTitle,
        category: "Career",
        goalType: "Professional",
        priority: "Medium",
        status: "Not Started",
        progress: 0,
      });
      toast.success("Goal created!");
      setGoalTitle("");
      setShowGoalModal(false);
    } catch {
      toast.error("Failed to create goal");
    } finally {
      setSaving(false);
    }
  };

  const quickAddHabit = async () => {
    if (!habitName.trim()) return toast.error("Enter a habit name");
    setSaving(true);
    try {
      await api.post("/habits", {
        name: habitName,
        days: Array(21).fill(false),
      });
      toast.success("Habit started!");
      setHabitName("");
      setShowHabitModal(false);
    } catch {
      toast.error("Failed to create habit");
    } finally {
      setSaving(false);
    }
  };

  const stats = data
    ? [
        {
          icon: FaLightbulb,
          label: "Skills Assessed",
          value: data.stats.skillsAssessed,
          color: "bg-primary-light text-primary",
        },
        {
          icon: FaBullseye,
          label: "Active Goals",
          value: data.stats.activeGoals,
          color: "bg-secondary/20 text-secondary",
        },
        {
          icon: FaCalendarCheck,
          label: "Habits Tracked",
          value: data.stats.habitsTracked,
          color: "bg-success/20 text-success",
        },
        {
          icon: FaTrophy,
          label: "Achievements",
          value: data.stats.achievements,
          color: "bg-destructive/10 text-destructive",
        },
      ]
    : [];

  const quickActions = [
    {
      icon: FaBullseye,
      label: "+ Add Goal",
      color:
        "bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground",
      onClick: () => setShowGoalModal(true),
    },
    {
      icon: FaSmile,
      label: "+ Log Mood",
      color:
        "bg-secondary/10 text-secondary hover:bg-secondary hover:text-secondary-foreground",
      onClick: () => navigate("/frame-of-mind"),
    },
    {
      icon: FaFire,
      label: "+ Start Habit",
      color:
        "bg-destructive/10 text-destructive hover:bg-destructive hover:text-white",
      onClick: () => setShowHabitModal(true),
    },
    {
      icon: FaBook,
      label: "+ Find Course",
      color: "bg-success/10 text-success hover:bg-success hover:text-white",
      onClick: () => navigate("/learning"),
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">
            Welcome back, {user?.name?.split(" ")[0]}! 👋
          </h1>
          <p className="text-foreground-muted mt-1">
            Here's your growth overview
          </p>
        </div>

        {/* Loading spinner */}
        {loading && (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((s, i) => (
                <div key={i} className="stat-card">
                  <div
                    className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center mb-3`}
                  >
                    <s.icon className="text-lg" />
                  </div>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-sm text-foreground-muted">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div>
              <h2 className="font-semibold text-sm text-foreground-muted mb-3 uppercase tracking-wide">
                Quick Actions
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {quickActions.map((a, i) => (
                  <button
                    key={i}
                    onClick={a.onClick}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl font-medium text-sm transition-all ${a.color}`}
                  >
                    <a.icon className="text-xl" />
                    <span>{a.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Active Goals */}
            {data?.activeGoals && data.activeGoals.length > 0 && (
              <div className="card-elevated">
                <h2 className="font-semibold mb-4">Active Goals</h2>
                <div className="space-y-3">
                  {data.activeGoals.slice(0, 4).map((goal) => (
                    <div key={goal._id}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">
                          {goal.title}
                        </span>
                        <span className="text-xs text-foreground-muted">
                          {goal.progress}%
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${goal.progress === 100 ? "bg-success" : "bg-primary"}`}
                          style={{ width: `${goal.progress}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => navigate("/goals")}
                  className="text-sm text-primary hover:underline mt-3 block"
                >
                  View all goals →
                </button>
              </div>
            )}

            {/* Radar Chart */}
            {data?.radarData && data.radarData.length > 0 && (
              <div className="card-elevated">
                <h2 className="font-semibold mb-4">Skill Overview</h2>
                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart data={data.radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="skill" tick={{ fontSize: 12 }} />
                    <PolarRadiusAxis
                      angle={30}
                      domain={[0, 5]}
                      tick={{ fontSize: 10 }}
                    />
                    <Radar
                      name="Current"
                      dataKey="current"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.3}
                    />
                    <Radar
                      name="Desired"
                      dataKey="desired"
                      stroke="hsl(var(--secondary))"
                      fill="hsl(var(--secondary))"
                      fillOpacity={0.1}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        )}

        {/* Quick Add Goal Modal */}
        {showGoalModal && (
          <div className="fixed inset-0 bg-foreground/50 flex items-start justify-center z-50 p-4 pt-8 overflow-y-auto">
            <div className="bg-card rounded-2xl p-6 w-full max-w-md my-auto animate-fade-in">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold flex items-center gap-2">
                  <FaBullseye className="text-primary" /> Quick Add Goal
                </h2>
                <button onClick={() => setShowGoalModal(false)}>
                  <FaTimes />
                </button>
              </div>
              <input
                placeholder="What do you want to achieve?"
                value={goalTitle}
                onChange={(e) => setGoalTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && quickAddGoal()}
                className="input-field mb-3"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={quickAddGoal}
                  disabled={saving || !goalTitle.trim()}
                  className="btn-primary flex-1 disabled:opacity-50"
                >
                  {saving ? "Adding..." : "Add Goal"}
                </button>
                <button
                  onClick={() => {
                    setShowGoalModal(false);
                    navigate("/goals");
                  }}
                  className="btn-secondary text-sm px-4"
                >
                  Full Form →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Add Habit Modal */}
        {showHabitModal && (
          <div className="fixed inset-0 bg-foreground/50 flex items-start justify-center z-50 p-4 pt-8 overflow-y-auto">
            <div className="bg-card rounded-2xl p-6 w-full max-w-md my-auto animate-fade-in">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold flex items-center gap-2">
                  <FaFire className="text-destructive" /> Quick Start Habit
                </h2>
                <button onClick={() => setShowHabitModal(false)}>
                  <FaTimes />
                </button>
              </div>
              <input
                placeholder="e.g. Practice coding for 1 hour"
                value={habitName}
                onChange={(e) => setHabitName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && quickAddHabit()}
                className="input-field mb-3"
                autoFocus
              />
              <div className="grid grid-cols-2 gap-2 mb-3">
                {[
                  "Practice coding daily",
                  "Read 30 minutes",
                  "Exercise for 20 mins",
                  "Learn 5 new things",
                ].map((s) => (
                  <button
                    key={s}
                    onClick={() => setHabitName(s)}
                    className="text-xs bg-muted hover:bg-accent px-3 py-2 rounded-lg text-left transition-all"
                  >
                    {s}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={quickAddHabit}
                  disabled={saving || !habitName.trim()}
                  className="btn-primary flex-1 disabled:opacity-50"
                >
                  {saving ? "Starting..." : "Start Habit"}
                </button>
                <button
                  onClick={() => {
                    setShowHabitModal(false);
                    navigate("/habits");
                  }}
                  className="btn-secondary text-sm px-4"
                >
                  Full Page →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
