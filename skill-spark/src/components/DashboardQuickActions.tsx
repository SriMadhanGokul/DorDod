import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/utils/api";
import toast from "react-hot-toast";
import {
  FaBullseye,
  FaSmile,
  FaFire,
  FaBook,
  FaTimes,
  FaPlus,
} from "react-icons/fa";

export default function DashboardQuickActions() {
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showHabitModal, setShowHabitModal] = useState(false);
  const [goalTitle, setGoalTitle] = useState("");
  const [habitName, setHabitName] = useState("");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

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

  const actions = [
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
        "bg-secondary/10 text-secondary hover:bg-secondary hover:text-white",
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
    <>
      <div>
        <h2 className="font-semibold text-sm text-foreground-muted mb-3 uppercase tracking-wide">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {actions.map((a, i) => (
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
            />
            <div className="flex gap-2">
              <button
                onClick={quickAddGoal}
                disabled={saving}
                className="btn-primary flex-1 disabled:opacity-50"
              >
                {saving ? "Adding..." : "🎯 Add Goal"}
              </button>
              <button
                onClick={() => navigate("/goals")}
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
            />
            <div className="flex gap-2">
              <button
                onClick={quickAddHabit}
                disabled={saving}
                className="btn-primary flex-1 disabled:opacity-50"
              >
                {saving ? "Starting..." : "🔥 Start Habit"}
              </button>
              <button
                onClick={() => navigate("/habits")}
                className="btn-secondary text-sm px-4"
              >
                Full Page →
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
