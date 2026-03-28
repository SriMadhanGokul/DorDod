import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { api } from "@/utils/api";
import toast from "react-hot-toast";
import { FaPlus, FaTimes, FaFire, FaTrash } from "react-icons/fa";

interface Habit {
  _id: string;
  name: string;
  days: boolean[];
}

function getStreak(days: boolean[]): number {
  let streak = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i]) streak++;
    else break;
  }
  return streak;
}

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);

  // ─── Fetch habits ─────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchHabits = async () => {
      try {
        const res = await api.get("/habits");
        setHabits(res.data.data);
      } catch {
        toast.error("Failed to load habits");
      } finally {
        setLoading(false);
      }
    };
    fetchHabits();
  }, []);

  // ─── Toggle day ───────────────────────────────────────────────────────────
  const toggleDay = async (habitId: string, dayIdx: number) => {
    // Optimistic update
    setHabits((prev) =>
      prev.map((h) =>
        h._id === habitId
          ? { ...h, days: h.days.map((d, i) => (i === dayIdx ? !d : d)) }
          : h,
      ),
    );
    try {
      const res = await api.patch(`/habits/${habitId}/toggle/${dayIdx}`);
      setHabits((prev) =>
        prev.map((h) => (h._id === habitId ? res.data.data : h)),
      );
    } catch {
      // revert optimistic update on failure
      setHabits((prev) =>
        prev.map((h) =>
          h._id === habitId
            ? { ...h, days: h.days.map((d, i) => (i === dayIdx ? !d : d)) }
            : h,
        ),
      );
      toast.error("Failed to update day");
    }
  };

  // ─── Create habit ─────────────────────────────────────────────────────────
  const addHabit = async () => {
    if (!newName.trim()) return toast.error("Please enter a habit name");
    setSaving(true);
    try {
      const res = await api.post("/habits", { name: newName });
      setHabits((prev) => [...prev, res.data.data]);
      setNewName("");
      setShowModal(false);
      toast.success("Habit created!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create habit");
    } finally {
      setSaving(false);
    }
  };

  // ─── Delete habit ─────────────────────────────────────────────────────────
  const deleteHabit = async (id: string) => {
    try {
      await api.delete(`/habits/${id}`);
      setHabits((prev) => prev.filter((h) => h._id !== id));
      toast.success("Habit deleted!");
    } catch {
      toast.error("Failed to delete habit");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">
              21-Day Habit Tracker
            </h1>
            <p className="text-foreground-muted mt-1">
              Build lasting habits one day at a time
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <FaPlus /> New Habit
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Empty state */}
        {!loading && habits.length === 0 && (
          <div className="text-center py-16 text-foreground-muted">
            <p className="text-lg font-medium">No habits yet</p>
            <p className="text-sm mt-1">Start your 21-day challenge!</p>
          </div>
        )}

        {/* Habit cards */}
        {habits.map((habit) => {
          const completed = habit.days.filter(Boolean).length;
          const rate = Math.round((completed / 21) * 100);
          const streak = getStreak(habit.days);

          return (
            <div key={habit._id} className="card-elevated">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold">{habit.name}</h3>
                <div className="flex items-center gap-3 text-sm text-foreground-muted">
                  <span className="flex items-center gap-1">
                    <FaFire className="text-secondary" /> {streak} day streak
                  </span>
                  <span>{rate}% complete</span>
                  <button
                    onClick={() => deleteHabit(habit._id)}
                    className="text-foreground-muted hover:text-destructive transition-colors ml-1"
                  >
                    <FaTrash className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {habit.days.map((done, i) => (
                  <button
                    key={i}
                    onClick={() => toggleDay(habit._id, i)}
                    className={`habit-day ${done ? "habit-day-complete" : "habit-day-incomplete"}`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
          );
        })}

        {/* Create Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-2xl p-6 w-full max-w-md animate-fade-in">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">New Habit</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-foreground-muted hover:text-foreground"
                >
                  <FaTimes />
                </button>
              </div>
              <input
                placeholder="e.g. Read for 30 minutes"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addHabit()}
                className="input-field mb-4"
              />
              <button
                onClick={addHabit}
                disabled={saving}
                className="btn-primary w-full disabled:opacity-50"
              >
                {saving ? "Creating..." : "Create Habit"}
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
