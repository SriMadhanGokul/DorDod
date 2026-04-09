import { useState, useEffect } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import { api } from "@/utils/api";
import toast from "react-hot-toast";
import { FaPlus, FaTimes, FaFire, FaTrash, FaTrophy } from "react-icons/fa";

interface Habit {
  _id: string;
  name: string;
  days: boolean[];
}

function getStreaks(days: boolean[]) {
  let current = 0,
    best = 0,
    temp = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i]) {
      current++;
    } else break;
  }
  for (const d of days) {
    if (d) {
      temp++;
      best = Math.max(best, temp);
    } else temp = 0;
  }
  return { current, best };
}

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get("/habits")
      .then((r) => setHabits(r.data.data))
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
      toast.success("Habit created!");
    } catch {
      toast.error("Failed");
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (habitId: string, dayIdx: number) => {
    const prev = habits;
    setHabits((h) =>
      h.map((x) =>
        x._id === habitId
          ? { ...x, days: x.days.map((d, i) => (i === dayIdx ? !d : d)) }
          : x,
      ),
    );
    try {
      await api.patch(`/habits/${habitId}/toggle`, { dayIndex: dayIdx });
    } catch {
      setHabits(prev);
      toast.error("Failed");
    }
  };

  const del = async (id: string) => {
    try {
      await api.delete(`/habits/${id}`);
      setHabits((p) => p.filter((h) => h._id !== id));
      toast.success("Habit deleted!");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const totalCompleted = habits.reduce(
    (s, h) => s + h.days.filter(Boolean).length,
    0,
  );
  const totalDays = habits.reduce((s, h) => s + h.days.length, 0);
  const overallRate =
    totalDays > 0 ? Math.round((totalCompleted / totalDays) * 100) : 0;
  const bestOverallStreak = Math.max(
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
            <h1 className="text-2xl md:text-3xl font-bold">21-Day Habits</h1>
            <p className="text-foreground-muted mt-1">
              Build lasting habits with daily consistency
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <FaPlus /> New Habit
          </button>
        </div>

        {/* Global stats */}
        {habits.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                val: habits.length,
                label: "Active Habits",
                color: "text-primary",
              },
              {
                val: `${overallRate}%`,
                label: "Completion Rate",
                color: "text-success",
              },
              {
                val: totalCompleted,
                label: "Days Completed",
                color: "text-secondary",
              },
              {
                val: `${bestOverallStreak}🔥`,
                label: "Best Streak",
                color: "text-destructive",
              },
            ].map((s, i) => (
              <div key={i} className="stat-card text-center">
                <p className={`text-2xl font-bold ${s.color}`}>{s.val}</p>
                <p className="text-xs text-foreground-muted mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {habits.length === 0 && !loading && (
          <div className="text-center py-16 text-foreground-muted">
            <FaFire className="text-5xl mx-auto mb-3 opacity-20" />
            <p className="text-lg font-medium">No habits yet</p>
            <p className="text-sm mt-1">
              Start your first 21-day habit challenge!
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary mt-4 flex items-center gap-2 mx-auto"
            >
              <FaPlus /> Create First Habit
            </button>
          </div>
        )}

        {/* Habit cards */}
        <div className="space-y-4">
          {habits.map((habit) => {
            const done = habit.days.filter(Boolean).length;
            const pct = Math.round((done / 21) * 100);
            const { current, best } = getStreaks(habit.days);
            const completed = done === 21;

            return (
              <div
                key={habit._id}
                className={`card-elevated ${completed ? "border-2 border-success/50 bg-success/5" : ""}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold">{habit.name}</h3>
                      {completed && (
                        <span className="text-xs bg-success text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                          <FaTrophy className="w-2.5 h-2.5" /> Completed!
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-xs text-foreground-muted">
                        {done}/21 days
                      </span>
                      {current > 0 && (
                        <span
                          className={`text-xs flex items-center gap-1 font-medium ${current >= 7 ? "text-destructive" : "text-secondary"}`}
                        >
                          <FaFire
                            className={current >= 7 ? "animate-pulse" : ""}
                          />{" "}
                          {current} day streak
                        </span>
                      )}
                      {best > 0 && (
                        <span className="text-xs text-foreground-muted">
                          Best: {best} days
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => del(habit._id)}
                    className="text-foreground-muted hover:text-destructive p-1"
                  >
                    <FaTrash className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-muted rounded-full h-2 mb-3">
                  <div
                    className={`rounded-full h-2 transition-all duration-500 ${completed ? "bg-success" : pct > 60 ? "bg-primary" : "bg-secondary"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                {/* Day grid */}
                <div className="grid grid-cols-7 gap-1.5">
                  {habit.days.map((done, i) => (
                    <button
                      key={i}
                      onClick={() => toggle(habit._id, i)}
                      title={`Day ${i + 1}`}
                      className={`aspect-square rounded-lg text-xs font-bold transition-all hover:scale-110 active:scale-95 ${
                        done
                          ? "bg-success text-white shadow-sm shadow-success/30"
                          : "bg-muted text-foreground-muted hover:bg-accent"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>

                {/* Milestone messages */}
                {current > 0 && (
                  <p className="text-xs text-center mt-3 font-medium">
                    {current >= 21
                      ? "🏆 Perfect! 21 days done!"
                      : current >= 14
                        ? "🌟 14+ days! You're unstoppable!"
                        : current >= 7
                          ? "🔥 7-day streak! Keep it burning!"
                          : current >= 3
                            ? "✨ 3 days in! Great start!"
                            : "💪 Keep going! Every day counts!"}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Add Habit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-foreground/50 flex items-start justify-center z-50 p-4 pt-8 overflow-y-auto">
            <div className="bg-card rounded-2xl p-6 w-full max-w-md animate-fade-in my-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <FaFire className="text-secondary" /> New 21-Day Habit
                </h2>
                <button onClick={() => setShowModal(false)}>
                  <FaTimes />
                </button>
              </div>
              <div className="space-y-3">
                <input
                  placeholder="e.g. Practice coding for 1 hour"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && create()}
                  className="input-field"
                />
                <div className="grid grid-cols-2 gap-2">
                  {[
                    "Practice coding daily",
                    "Read 30 minutes",
                    "Exercise for 20 mins",
                    "Learn 5 new things",
                  ].map((s) => (
                    <button
                      key={s}
                      onClick={() => setName(s)}
                      className="text-xs bg-muted hover:bg-accent px-3 py-2 rounded-lg text-left transition-all"
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <button
                  onClick={create}
                  disabled={saving || !name.trim()}
                  className="btn-primary w-full disabled:opacity-50"
                >
                  {saving ? "Creating..." : "Start 21-Day Challenge 🔥"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
