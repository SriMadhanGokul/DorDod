import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { api } from "@/utils/api";
import toast from "react-hot-toast";
import {
  FaPlus,
  FaTimes,
  FaFire,
  FaTrash,
  FaTrophy,
  FaCheck,
} from "react-icons/fa";

interface Habit {
  _id: string;
  name: string;
  days: boolean[];
  fromGoal?: string;
}

function getStreaks(days: boolean[]) {
  let current = 0,
    best = 0,
    temp = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i]) current++;
    else break;
  }
  for (const d of days) {
    if (d) {
      temp++;
      best = Math.max(best, temp);
    } else temp = 0;
  }
  return { current, best };
}

const STREAK_MSG = (streak: number, missed: boolean) => {
  if (missed)
    return {
      msg: "💔 You missed today... but tomorrow is YOUR comeback story. Rise again!",
      color: "text-destructive",
    };
  if (streak === 0)
    return {
      msg: "💪 Start today! The hardest step is always the first.",
      color: "text-foreground-muted",
    };
  if (streak === 1)
    return {
      msg: "✨ Day 1 done! Every legend started exactly here.",
      color: "text-yellow-500",
    };
  if (streak < 3)
    return {
      msg: "🌱 Growing strong! Keep this momentum going!",
      color: "text-yellow-500",
    };
  if (streak < 7)
    return {
      msg: "🔥 On a roll! You're building something real.",
      color: "text-orange-500",
    };
  if (streak === 7)
    return {
      msg: "🔥🔥 7-DAY STREAK! You just earned 50 bonus XP! You're unstoppable!",
      color: "text-red-500",
    };
  if (streak < 14)
    return {
      msg: "💥 Over a week strong! Most people quit by now. NOT YOU.",
      color: "text-red-500",
    };
  if (streak === 14)
    return {
      msg: "💥💥 14 DAYS! You're in the top 5% of people. 100 XP bonus! 🏆",
      color: "text-purple-500",
    };
  if (streak < 21)
    return {
      msg: "👑 Almost there... 21-day legend incoming!",
      color: "text-purple-500",
    };
  return {
    msg: "👑 21 DAYS! You didn't just build a habit — you built CHARACTER! 200 XP! 🎊",
    color: "text-primary",
  };
};

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get("/habits")
      .then((r) => setHabits(r.data.data || []))
      .catch(() => toast.error("Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  const create = async () => {
    if (!name.trim()) return toast.error("Enter a habit name");
    setSaving(true);
    try {
      const res = await api.post("/habits", {
        name,
        days: Array(21).fill(false),
      });
      setHabits((p) => [res.data.data, ...p]);
      setName("");
      setShowModal(false);
      toast.success("🔥 Habit created! Day 1 starts NOW!");
    } catch {
      toast.error("Failed");
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (habitId: string, dayIdx: number) => {
    const prev = habits;
    const updated = habits.map((h) =>
      h._id === habitId
        ? { ...h, days: h.days.map((d, i) => (i === dayIdx ? !d : d)) }
        : h,
    );
    setHabits(updated);

    const habit = updated.find((h) => h._id === habitId)!;
    const isDone = habit.days[dayIdx];
    const { current } = getStreaks(habit.days);

    try {
      await api.patch(`/habits/${habitId}/toggle`, { dayIndex: dayIdx });
      if (isDone) {
        const msg = STREAK_MSG(current, false);
        toast.success(msg.msg, { duration: 4000, icon: "🔥" });
      } else {
        toast("💔 Unchecked. Don't give up — every day matters!", {
          icon: "😢",
          duration: 3000,
        });
      }
    } catch {
      setHabits(prev);
      toast.error("Failed to update");
    }
  };

  const del = async (id: string) => {
    try {
      await api.delete(`/habits/${id}`);
      setHabits((p) => p.filter((h) => h._id !== id));
      toast.success("Habit deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const totalDone = habits.reduce(
    (s, h) => s + h.days.filter(Boolean).length,
    0,
  );
  const totalDays = habits.reduce((s, h) => s + h.days.length, 0);
  const overallPct =
    totalDays > 0 ? Math.round((totalDone / totalDays) * 100) : 0;
  const bestOverall = Math.max(
    0,
    ...habits.map((h) => getStreaks(h.days).best),
  );

  if (loading)
    return (
      <DashboardLayout>
        <div className="flex justify-center py-24">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">21-Day Habits 🔥</h1>
            <p className="text-foreground-muted mt-1">
              Build the person you want to become — one day at a time
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <FaPlus /> New Habit
          </button>
        </div>

        {/* Stats */}
        {habits.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                val: habits.length,
                label: "🔥 Active Habits",
                color: "text-primary",
              },
              {
                val: `${overallPct}%`,
                label: "✅ Completion Rate",
                color: "text-success",
              },
              {
                val: totalDone,
                label: "📅 Days Completed",
                color: "text-secondary",
              },
              {
                val: `${bestOverall}🔥`,
                label: "🏆 Best Streak",
                color: "text-destructive",
              },
            ].map((s, i) => (
              <div key={i} className="stat-card text-center">
                <p className={`text-2xl font-black ${s.color}`}>{s.val}</p>
                <p className="text-xs text-foreground-muted mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {habits.length === 0 && (
          <div className="text-center py-16 text-foreground-muted">
            <FaFire className="text-5xl mx-auto mb-3 opacity-20" />
            <p className="text-lg font-medium">No habits yet</p>
            <p className="text-sm mt-1 max-w-sm mx-auto">
              It takes 21 days to build a habit. Start today and your future
              self will thank you.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary mt-4 mx-auto flex items-center gap-2"
            >
              <FaPlus /> Start Your First Habit
            </button>
          </div>
        )}

        {/* Habit cards */}
        <div className="space-y-5">
          {habits.map((habit) => {
            const done = habit.days.filter(Boolean).length;
            const pct = Math.round((done / 21) * 100);
            const { current, best } = getStreaks(habit.days);
            const completed = done === 21;
            const streakInfo = STREAK_MSG(current, false);
            const todayIdx = Math.min(done, 20); // approximate "today" as next unchecked
            const lastChecked = habit.days.lastIndexOf(true);
            const missedToday =
              lastChecked < habit.days.filter(Boolean).length - 1;

            return (
              <div
                key={habit._id}
                className={`card-elevated ${completed ? "border-2 border-yellow-400 bg-gradient-to-r from-yellow-50/30 to-orange-50/30" : ""}`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold">{habit.name}</h3>
                      {completed && (
                        <span className="text-xs bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                          <FaTrophy className="w-2.5 h-2.5" /> Legend!
                        </span>
                      )}
                      {habit.fromGoal && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          🎯 {habit.fromGoal}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span
                        className={`text-sm font-bold flex items-center gap-1 ${streakInfo.color}`}
                      >
                        <FaFire
                          className={current >= 7 ? "animate-pulse" : ""}
                        />{" "}
                        {current} day streak
                      </span>
                      <span className="text-xs text-foreground-muted">
                        Best: {best} 🏆
                      </span>
                      <span className="text-xs text-foreground-muted">
                        {done}/21 done
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => del(habit._id)}
                    className="text-foreground-muted hover:text-destructive p-1 shrink-0"
                  >
                    <FaTrash className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Progress bar */}
                <div className="mb-3">
                  <div className="w-full bg-muted rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all duration-700 ${
                        completed
                          ? "bg-gradient-to-r from-yellow-400 to-orange-400"
                          : pct > 60
                            ? "bg-gradient-to-r from-primary to-secondary"
                            : "bg-primary"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-foreground-muted">
                      {pct}% complete
                    </span>
                    <span className="text-xs text-foreground-muted">
                      {21 - done} days left
                    </span>
                  </div>
                </div>

                {/* 21-day grid */}
                <div className="grid grid-cols-7 gap-1.5 mb-3">
                  {habit.days.map((isDone, i) => (
                    <button
                      key={i}
                      onClick={() => toggle(habit._id, i)}
                      title={`Day ${i + 1}`}
                      className={`aspect-square rounded-lg text-xs font-bold transition-all hover:scale-110 active:scale-95 relative ${
                        isDone
                          ? "bg-gradient-to-b from-yellow-400 to-orange-500 text-white shadow-sm"
                          : "bg-muted text-foreground-muted hover:bg-accent"
                      }`}
                    >
                      {isDone ? <FaCheck className="mx-auto w-3 h-3" /> : i + 1}
                    </button>
                  ))}
                </div>

                {/* Emotional message */}
                <div
                  className={`text-sm font-medium text-center py-2 px-3 rounded-xl ${
                    current >= 21
                      ? "bg-yellow-50 text-yellow-700"
                      : current >= 7
                        ? "bg-red-50 text-red-600"
                        : current > 0
                          ? "bg-orange-50 text-orange-600"
                          : "bg-muted text-foreground-muted"
                  }`}
                >
                  {streakInfo.msg}
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Habit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-foreground/50 flex items-start justify-center z-50 p-4 pt-8 overflow-y-auto">
            <div className="bg-card rounded-2xl p-6 w-full max-w-md my-auto animate-fade-in">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <FaFire className="text-destructive" /> New 21-Day Habit
                  </h2>
                  <p className="text-xs text-foreground-muted mt-0.5">
                    21 days. That's all it takes to change your life.
                  </p>
                </div>
                <button onClick={() => setShowModal(false)}>
                  <FaTimes />
                </button>
              </div>
              <div className="space-y-3">
                <input
                  placeholder="What habit will you build?"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && create()}
                  className="input-field"
                  autoFocus
                />
                <div className="grid grid-cols-2 gap-2">
                  {[
                    "Practice coding daily",
                    "Read 30 minutes",
                    "Exercise 20 mins",
                    "Learn something new",
                    "Meditate 10 mins",
                    "Drink 8 glasses water",
                  ].map((s) => (
                    <button
                      key={s}
                      onClick={() => setName(s)}
                      className={`text-xs px-3 py-2.5 rounded-xl border text-left transition-all ${name === s ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/40"}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <button
                  onClick={create}
                  disabled={saving || !name.trim()}
                  className="btn-primary w-full disabled:opacity-50 py-3"
                >
                  {saving ? "Creating..." : "🔥 Start 21-Day Challenge"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
