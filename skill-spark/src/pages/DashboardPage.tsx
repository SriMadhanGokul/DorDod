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
  FaTimes,
  FaQuoteLeft,
} from "react-icons/fa";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";

// ─── Motivational Quotes ──────────────────────────────────────────────────────
const QUOTES = [
  {
    text: "The secret of getting ahead is getting started.",
    author: "Mark Twain",
  },
  {
    text: "It always seems impossible until it's done.",
    author: "Nelson Mandela",
  },
  {
    text: "Don't watch the clock; do what it does. Keep going.",
    author: "Sam Levenson",
  },
  {
    text: "The future depends on what you do today.",
    author: "Mahatma Gandhi",
  },
  {
    text: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    author: "Winston Churchill",
  },
  {
    text: "Believe you can and you're halfway there.",
    author: "Theodore Roosevelt",
  },
  {
    text: "You are never too old to set another goal or to dream a new dream.",
    author: "C.S. Lewis",
  },
  {
    text: "Act as if what you do makes a difference. It does.",
    author: "William James",
  },
  {
    text: "Success usually comes to those who are too busy to be looking for it.",
    author: "Henry David Thoreau",
  },
  {
    text: "The only way to do great work is to love what you do.",
    author: "Steve Jobs",
  },
  {
    text: "Don't let yesterday take up too much of today.",
    author: "Will Rogers",
  },
  {
    text: "You don't have to be great to start, but you have to start to be great.",
    author: "Zig Ziglar",
  },
  { text: "Little by little, one travels far.", author: "J.R.R. Tolkien" },
  { text: "We become what we repeatedly do.", author: "Aristotle" },
  {
    text: "The harder you work for something, the greater you'll feel when you achieve it.",
    author: "Unknown",
  },
  {
    text: "Push yourself because no one else is going to do it for you.",
    author: "Unknown",
  },
  { text: "Great things never come from comfort zones.", author: "Unknown" },
  { text: "Dream it. Wish it. Do it.", author: "Unknown" },
  { text: "Your limitation—it's only your imagination.", author: "Unknown" },
  { text: "Sometimes later becomes never. Do it now.", author: "Unknown" },
  {
    text: "Hard work beats talent when talent doesn't work hard.",
    author: "Tim Notke",
  },
  { text: "Stay focused and never give up.", author: "Unknown" },
  {
    text: "Small steps in the right direction can turn out to be the biggest step of your life.",
    author: "Unknown",
  },
  {
    text: "Wake up with determination. Go to bed with satisfaction.",
    author: "Unknown",
  },
  {
    text: "Do something today that your future self will thank you for.",
    author: "Sean Patrick Flanery",
  },
  {
    text: "Discipline is the bridge between goals and accomplishment.",
    author: "Jim Rohn",
  },
  { text: "Don't stop until you're proud.", author: "Unknown" },
  { text: "Be stronger than your strongest excuse.", author: "Unknown" },
  { text: "One day or day one. You decide.", author: "Unknown" },
  {
    text: "A year from now you may wish you had started today.",
    author: "Karen Lamb",
  },
  {
    text: "The best time to plant a tree was 20 years ago. The second best time is now.",
    author: "Chinese Proverb",
  },
];

const getDailyQuote = () => {
  const day = Math.floor(Date.now() / 86400000);
  return QUOTES[day % QUOTES.length];
};

// ─── Progress Ring Component ──────────────────────────────────────────────────
function ProgressRing({
  pct,
  color,
  label,
  emoji,
  size = 80,
}: {
  pct: number;
  color: string;
  label: string;
  emoji: string;
  size?: number;
}) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(pct, 100) / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth={8}
            className="text-muted opacity-40"
          />
          {/* Progress */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={8}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.8s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg leading-none">{emoji}</span>
          <span className="text-xs font-bold mt-0.5" style={{ color }}>
            {pct}%
          </span>
        </div>
      </div>
      <span className="text-xs text-foreground-muted font-medium">{label}</span>
    </div>
  );
}

// ─── Streak Widget ────────────────────────────────────────────────────────────
function StreakWidget({
  streak,
  bestStreak,
}: {
  streak: number;
  bestStreak: number;
}) {
  const flames = Math.min(streak, 7);
  const msgs = [
    {
      min: 0,
      msg: "Start your streak today! 💪",
      color: "text-foreground-muted",
    },
    { min: 1, msg: "Great start! Keep going! ✨", color: "text-yellow-500" },
    {
      min: 3,
      msg: "3 days strong! You're building it! 🔥",
      color: "text-orange-500",
    },
    {
      min: 7,
      msg: "7-day streak! You're on FIRE! 🔥🔥",
      color: "text-red-500",
    },
    {
      min: 14,
      msg: "14 days! Unstoppable force! 💥",
      color: "text-purple-500",
    },
    { min: 21, msg: "21 DAYS! You built a HABIT! 👑", color: "text-primary" },
  ];
  const current = [...msgs].reverse().find((m) => streak >= m.min) || msgs[0];

  return (
    <div className="card-elevated">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-sm uppercase tracking-wide text-foreground-muted">
            Daily Streak
          </h3>
          <p className={`text-4xl font-black mt-1 ${current.color}`}>
            {streak}
          </p>
          <p className="text-sm text-foreground-muted">days in a row</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-foreground-muted">Best Streak</p>
          <p className="text-2xl font-bold text-secondary">{bestStreak} 🏆</p>
        </div>
      </div>

      {/* Flame bar */}
      <div className="flex gap-1 mb-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className={`flex-1 h-8 rounded-lg flex items-center justify-center text-base transition-all ${
              i < flames
                ? "bg-gradient-to-b from-yellow-400 to-orange-500 shadow-sm"
                : "bg-muted"
            }`}
          >
            {i < flames ? "🔥" : "○"}
          </div>
        ))}
      </div>

      <p className={`text-sm font-medium text-center ${current.color}`}>
        {current.msg}
      </p>

      {streak === 0 && (
        <div className="mt-3 p-3 bg-destructive/5 border border-destructive/20 rounded-xl text-center">
          <p className="text-xs text-destructive font-medium">
            💔 No streak yet. Complete a habit today to start!
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
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
  const [xpData, setXpData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showHabitModal, setShowHabitModal] = useState(false);
  const [goalTitle, setGoalTitle] = useState("");
  const [habitName, setHabitName] = useState("");
  const [saving, setSaving] = useState(false);
  const [ringsData, setRingsData] = useState({
    goals: 0,
    habits: 0,
    learning: 0,
  });

  const quote = getDailyQuote();

  // Onboarding check
  useEffect(() => {
    if (!localStorage.getItem("onboarded")) navigate("/onboarding");
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const [dashRes, xpRes] = await Promise.all([
          api.get("/dashboard"),
          api.get("/xp/me").catch(() => ({ data: { data: null } })),
        ]);
        setData(dashRes.data.data);
        setXpData(xpRes.data.data);

        // Calculate progress rings from dashboard data
        const d = dashRes.data.data;
        const totalGoals = d?.activeGoals?.length || 0;
        const doneGoals =
          d?.activeGoals?.filter((g: any) => g.progress === 100).length || 0;
        const totalHDays = d?.habit?.days?.length || 21;
        const doneHDays = d?.habit?.days?.filter(Boolean).length || 0;

        setRingsData({
          goals:
            totalGoals > 0 ? Math.round((doneGoals / totalGoals) * 100) : 0,
          habits:
            totalHDays > 0 ? Math.round((doneHDays / totalHDays) * 100) : 0,
          learning:
            d?.stats?.skillsAssessed > 0
              ? Math.min(100, d.stats.skillsAssessed * 10)
              : 0,
        });
      } catch {
        toast.error("Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };
    load();
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
      toast.success("🎯 Goal created!");
      setGoalTitle("");
      setShowGoalModal(false);
    } catch {
      toast.error("Failed");
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
      toast.success("🔥 Habit started!");
      setHabitName("");
      setShowHabitModal(false);
    } catch {
      toast.error("Failed");
    } finally {
      setSaving(false);
    }
  };

  const streak = xpData?.streak || 0;
  const bestStreak = xpData?.bestStreak || 0;

  const allRingsFull =
    ringsData.goals >= 100 &&
    ringsData.habits >= 100 &&
    ringsData.learning >= 100;

  const stats = data
    ? [
        {
          icon: FaLightbulb,
          label: "Skills Assessed",
          value: data.stats.skillsAssessed,
          color: "bg-primary/10 text-primary",
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
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">
              Welcome back, {user?.name?.split(" ")[0]}! 👋
            </h1>
            <p className="text-foreground-muted mt-1">
              Here's your growth overview
            </p>
          </div>
          {xpData && (
            <div className="flex items-center gap-3 bg-card border border-border px-4 py-2 rounded-xl">
              <div className="text-center">
                <p className="text-xs text-foreground-muted">Level</p>
                <p className="font-bold text-sm">{xpData.levelName}</p>
              </div>
              <div className="w-px h-8 bg-border" />
              <div className="text-center">
                <p className="text-xs text-foreground-muted">XP</p>
                <p className="font-bold text-sm text-primary">
                  {xpData.totalXP.toLocaleString()}
                </p>
              </div>
              <div className="w-px h-8 bg-border" />
              <div className="text-center">
                <p className="text-xs text-foreground-muted">Streak</p>
                <p className="font-bold text-sm text-destructive">
                  {streak} 🔥
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Quote of the Day */}
        <div className="card-elevated bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/10">
          <div className="flex gap-3">
            <FaQuoteLeft className="text-primary/40 text-2xl shrink-0 mt-0.5" />
            <div>
              <p className="text-sm md:text-base font-medium italic text-foreground leading-relaxed">
                "{quote.text}"
              </p>
              <p className="text-xs text-foreground-muted mt-2">
                — {quote.author}
              </p>
            </div>
          </div>
        </div>

        {loading && (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && (
          <>
            {/* ── Progress Rings + Streak Row ─────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Progress Rings */}
              <div className="card-elevated">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold">Today's Progress</h3>
                    <p className="text-xs text-foreground-muted mt-0.5">
                      Fill all three rings for bonus XP
                    </p>
                  </div>
                  {allRingsFull && (
                    <span className="text-xs bg-success text-white px-2 py-1 rounded-full font-bold animate-pulse">
                      +50 XP! 🔥
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-around py-2">
                  <ProgressRing
                    pct={ringsData.goals}
                    color="#6366f1"
                    label="Goals"
                    emoji="🎯"
                    size={90}
                  />
                  <ProgressRing
                    pct={ringsData.habits}
                    color="#ef4444"
                    label="Habits"
                    emoji="🔥"
                    size={90}
                  />
                  <ProgressRing
                    pct={ringsData.learning}
                    color="#22c55e"
                    label="Learning"
                    emoji="📚"
                    size={90}
                  />
                </div>
                {allRingsFull && (
                  <p className="text-center text-sm font-bold text-success mt-2">
                    🎉 All rings complete! You're AMAZING today!
                  </p>
                )}
                {!allRingsFull && (
                  <p className="text-center text-xs text-foreground-muted mt-2">
                    {[
                      ringsData.goals < 100 && "Complete a goal",
                      ringsData.habits < 100 && "check a habit",
                      ringsData.learning < 100 && "learn a skill",
                    ]
                      .filter(Boolean)
                      .join(" · ")}{" "}
                    to fill your rings
                  </p>
                )}
              </div>

              {/* Streak */}
              <StreakWidget streak={streak} bestStreak={bestStreak} />
            </div>

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
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold">Active Goals</h2>
                  <button
                    onClick={() => navigate("/goals")}
                    className="text-xs text-primary hover:underline"
                  >
                    View all →
                  </button>
                </div>
                <div className="space-y-3">
                  {data.activeGoals.slice(0, 4).map((goal) => (
                    <div key={goal._id}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium truncate flex-1 mr-3">
                          {goal.title}
                        </span>
                        <span className="text-xs text-foreground-muted shrink-0">
                          {goal.progress}%
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${goal.progress === 100 ? "bg-success" : goal.progress >= 75 ? "bg-primary" : "bg-secondary"}`}
                          style={{ width: `${goal.progress}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Radar Chart */}
            {data?.radarData && data.radarData.length > 0 && (
              <div className="card-elevated">
                <h2 className="font-semibold mb-4">Skill Overview</h2>
                <ResponsiveContainer width="100%" height={260}>
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
                  {saving ? "Adding..." : "🎯 Add Goal"}
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
                  {saving ? "Starting..." : "🔥 Start Habit"}
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
