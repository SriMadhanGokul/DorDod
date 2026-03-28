import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { api } from "@/utils/api";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FaCheck,
  FaRocket,
  FaClock,
  FaBook,
  FaBullseye,
  FaLightbulb,
  FaCalendar,
  FaUser,
  FaSync,
} from "react-icons/fa";

const iconMap: Record<string, React.ElementType> = {
  FaBook,
  FaRocket,
  FaClock,
  FaBullseye,
  FaLightbulb,
  FaCalendar,
  FaUser,
  FaBookOpen: FaBook,
  FaSync,
};

const priorityConfig = {
  high: {
    label: "High Priority",
    color: "border-l-destructive",
    badge: "bg-destructive/10 text-destructive",
  },
  medium: {
    label: "Medium Priority",
    color: "border-l-primary",
    badge: "bg-primary/10 text-primary",
  },
  low: {
    label: "Low Priority",
    color: "border-l-muted",
    badge: "bg-muted text-foreground-muted",
  },
};

interface Recommendation {
  _id: string;
  title: string;
  type: string;
  duration: string;
  completed: boolean;
  icon: string;
  priority: string;
  reason: string;
}
interface Milestone {
  _id: string;
  title: string;
  desc: string;
  done: boolean;
}

export default function DevPlanPage() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  const fetchPlan = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await api.get("/devplan");
      setRecommendations(res.data.data.recommendations);
      setMilestones(res.data.data.milestones);
    } catch {
      toast.error("Failed to load plan");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPlan();
  }, []);

  const toggleRec = async (recId: string) => {
    setRecommendations((prev) =>
      prev.map((r) =>
        r._id === recId ? { ...r, completed: !r.completed } : r,
      ),
    );
    try {
      const res = await api.patch(`/devplan/recommendations/${recId}/toggle`);
      setRecommendations(res.data.data.recommendations);
      toast.success("Progress updated!");
    } catch {
      setRecommendations((prev) =>
        prev.map((r) =>
          r._id === recId ? { ...r, completed: !r.completed } : r,
        ),
      );
      toast.error("Failed to update");
    }
  };

  const toggleMilestone = async (milestoneId: string) => {
    setMilestones((prev) =>
      prev.map((m) => (m._id === milestoneId ? { ...m, done: !m.done } : m)),
    );
    try {
      const res = await api.patch(`/devplan/milestones/${milestoneId}/toggle`);
      setMilestones(res.data.data.milestones);
    } catch {
      setMilestones((prev) =>
        prev.map((m) => (m._id === milestoneId ? { ...m, done: !m.done } : m)),
      );
      toast.error("Failed to update");
    }
  };

  const completedCount = recommendations.filter((r) => r.completed).length;
  const total = recommendations.length;
  const pct = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  // Group by priority
  const highRecs = recommendations.filter((r) => r.priority === "high");
  const mediumRecs = recommendations.filter((r) => r.priority === "medium");
  const lowRecs = recommendations.filter((r) => r.priority === "low");

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
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">
              My Development Plan
            </h1>
            <p className="text-foreground-muted mt-1">
              Personalized plan built from your goals, skills & courses
            </p>
          </div>
          <button
            onClick={() => fetchPlan(false)}
            disabled={refreshing}
            className="btn-secondary text-sm flex items-center gap-2 disabled:opacity-50"
          >
            <FaSync className={refreshing ? "animate-spin" : ""} /> Refresh Plan
          </button>
        </div>

        {/* Overall progress */}
        <div className="card-elevated">
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold">Overall Progress</span>
            <span className="text-sm text-foreground-muted">
              {completedCount}/{total} completed
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-3">
            <div
              className="bg-primary rounded-full h-3 transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-xs text-foreground-muted mt-2">
            {pct}% of your plan done this week
          </p>
        </div>

        {/* Quick action buttons */}
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              label: "Update Goals",
              icon: FaBullseye,
              path: "/goals",
              color: "bg-primary/10 text-primary hover:bg-primary/20",
            },
            {
              label: "Track Skills",
              icon: FaLightbulb,
              path: "/skills",
              color: "bg-secondary/10 text-secondary hover:bg-secondary/20",
            },
            {
              label: "View Courses",
              icon: FaBook,
              path: "/learning",
              color: "bg-success/10 text-success hover:bg-success/20",
            },
          ].map((btn, i) => (
            <button
              key={i}
              onClick={() => navigate(btn.path)}
              className={`${btn.color} rounded-xl p-3 text-center text-xs font-medium transition-all flex flex-col items-center gap-1.5`}
            >
              <btn.icon className="text-lg" />
              {btn.label}
            </button>
          ))}
        </div>

        {/* Recommendations by priority */}
        {[
          {
            label: "🔴 High Priority — Do These First",
            recs: highRecs,
            cfg: priorityConfig.high,
          },
          {
            label: "🟡 Medium Priority",
            recs: mediumRecs,
            cfg: priorityConfig.medium,
          },
          { label: "🟢 Nice to Have", recs: lowRecs, cfg: priorityConfig.low },
        ]
          .filter((group) => group.recs.length > 0)
          .map((group, gi) => (
            <div key={gi} className="space-y-3">
              <h2 className="font-semibold text-sm text-foreground-muted uppercase tracking-wide">
                {group.label}
              </h2>
              <div className="grid md:grid-cols-2 gap-3">
                {group.recs.map((item) => {
                  const Icon = iconMap[item.icon] || FaBook;
                  return (
                    <div
                      key={item._id}
                      className={`card-elevated border-l-4 ${group.cfg.color} ${item.completed ? "opacity-60" : ""} transition-all`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                            item.completed
                              ? "bg-success/20 text-success"
                              : "bg-primary-light text-primary"
                          }`}
                        >
                          <Icon className="text-base" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3
                            className={`font-semibold text-sm ${item.completed ? "line-through" : ""}`}
                          >
                            {item.title}
                          </h3>
                          <p className="text-xs text-foreground-muted mt-0.5">
                            {item.type} · {item.duration}
                          </p>
                          {item.reason && (
                            <p className="text-xs text-foreground-muted mt-1 italic">
                              💡 {item.reason}
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => toggleRec(item._id)}
                        className={`mt-3 w-full py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2 ${
                          item.completed
                            ? "bg-success/10 text-success"
                            : "bg-primary-light text-primary hover:bg-primary hover:text-primary-foreground"
                        }`}
                      >
                        <FaCheck className="text-xs" />
                        {item.completed ? "Completed ✓" : "Mark as Done"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

        {/* Empty plan */}
        {recommendations.length === 0 && (
          <div className="text-center py-12 text-foreground-muted">
            <FaRocket className="text-4xl mx-auto mb-3 opacity-30" />
            <p className="font-medium">Your plan is being generated...</p>
            <p className="text-sm mt-1">
              Add goals, choose a skill path, or enroll in courses to get
              started
            </p>
            <div className="flex gap-3 justify-center mt-4">
              <button
                onClick={() => navigate("/goals")}
                className="btn-primary text-sm"
              >
                Add Goals
              </button>
              <button
                onClick={() => navigate("/skills")}
                className="btn-secondary text-sm"
              >
                Choose Skill Path
              </button>
            </div>
          </div>
        )}

        {/* Timeline milestones */}
        <div className="card-elevated">
          <h2 className="text-lg font-semibold mb-6">📅 12-Week Roadmap</h2>
          <div className="space-y-6">
            {milestones.map((m, i) => (
              <div
                key={m._id}
                className="flex gap-4 cursor-pointer"
                onClick={() => toggleMilestone(m._id)}
              >
                <div className="flex flex-col items-center">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      m.done
                        ? "bg-success text-success-foreground shadow-md shadow-success/30"
                        : "bg-muted text-foreground-muted hover:bg-primary/20"
                    }`}
                  >
                    {m.done ? <FaCheck /> : i + 1}
                  </div>
                  {i < milestones.length - 1 && (
                    <div
                      className={`w-0.5 flex-1 mt-2 ${m.done ? "bg-success" : "bg-border"}`}
                    />
                  )}
                </div>
                <div className="pb-6 flex-1">
                  <h4
                    className={`font-semibold text-sm ${m.done ? "text-success" : ""}`}
                  >
                    {m.title}
                  </h4>
                  <p className="text-sm text-foreground-muted mt-1">{m.desc}</p>
                  {m.done && (
                    <p className="text-xs text-success mt-1">✅ Completed!</p>
                  )}
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-foreground-muted mt-2">
            Click a milestone to mark it done
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
