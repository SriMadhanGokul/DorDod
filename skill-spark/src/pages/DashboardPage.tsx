import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaChartLine,
  FaFire,
  FaPen,
  FaClipboardList,
  FaRedo,
} from "react-icons/fa";
import { api } from "@/utils/api";
import toast from "react-hot-toast";
import AlignmentScoreCard from "@/components/AlignmentScoreCard";
import AlignmentTrendCard from "@/components/AlignmentTrendCard";
import GrowthScoreCard from "@/components/GrowthScoreCard";
import RiskIndicatorCard from "@/components/RiskIndicatorCard";

interface DashboardMetrics {
  alignmentScore: number;
  alignmentStatus?: string;
  alignmentTrend: number;
  growthScore: number;
  riskIndicator: number;
  goalProgress: { completed: number; total: number };
  habitCompletion: { completed: number; total: number };
  habitCompletionRate: number;
  reflectionCount: number;
  capabilities: { completed: number; total: number };
  achievements: { completed: number; total: number };
  stats: {
    activeGoals: number;
    completedGoals: number;
    totalGoals: number;
    linkedHabits: number;
    totalHabits: number;
    completedHabitsToday: number;
  };
  checks: {
    hasCheckedInToday: boolean;
    hasReflectedToday: boolean;
  };
  trend?: Array<{ date: string; score: number }>;
}

interface DailyCheckIn {
  _id?: string;
  date: string;
  mood: string;
  energy: number;
  focus: number;
  completed: boolean;
}

interface DailyReflection {
  _id?: string;
  date: string;
  title: string;
  content: string;
  completed: boolean;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [dailyCheckIn, setDailyCheckIn] = useState<DailyCheckIn | null>(null);
  const [dailyReflection, setDailyReflection] =
    useState<DailyReflection | null>(null);

  const [showCheckInForm, setShowCheckInForm] = useState(false);
  const [checkInForm, setCheckInForm] = useState({
    mood: "neutral",
    energy: 5,
    focus: 5,
  });

  const [showReflectionForm, setShowReflectionForm] = useState(false);
  const [reflectionForm, setReflectionForm] = useState({
    title: "",
    content: "",
  });
  const [submittingCheckIn, setSubmittingCheckIn] = useState(false);
  const [submittingReflection, setSubmittingReflection] = useState(false);

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      const [metricsRes, checkInRes, reflectionRes] = await Promise.all([
        api
          .get("/dashboard/metrics")
          .catch(() => ({ data: { success: false, data: null } })),
        api
          .get("/daily-check-in/today")
          .catch(() => ({ data: { success: false, data: null } })),
        api
          .get("/daily-reflection/today")
          .catch(() => ({ data: { success: false, data: null } })),
      ]);

      if (metricsRes?.data?.data) {
        setMetrics(metricsRes.data.data);
      }
      if (checkInRes?.data?.data) {
        setDailyCheckIn(checkInRes.data.data);
      }
      if (reflectionRes?.data?.data) {
        setDailyReflection(reflectionRes.data.data);
      }
    } catch (err: any) {
      console.error("Dashboard error:", err);
    } finally {
      setLoading(false);
    }
  };

  const submitCheckIn = async () => {
    setSubmittingCheckIn(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const payload = {
        date: today,
        mood: checkInForm.mood,
        energy: checkInForm.energy,
        focus: checkInForm.focus,
      };
      const res = await api.post("/daily-check-in", payload);
      if (res.data.success || res.data.data) {
        setDailyCheckIn(res.data.data);
        setShowCheckInForm(false);
        await loadDashboardData();
        toast.success("Check-in saved! 📊");
      }
    } catch (err: any) {
      console.error("Check-in error:", err);
      toast.error(err.response?.data?.message || "Failed to save check-in");
    } finally {
      setSubmittingCheckIn(false);
    }
  };

  const submitReflection = async () => {
    if (!reflectionForm.title.trim() || !reflectionForm.content.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    setSubmittingReflection(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const payload = {
        date: today,
        title: reflectionForm.title,
        content: reflectionForm.content,
      };
      const res = await api.post("/daily-reflection", payload);
      if (res.data.success || res.data.data) {
        setDailyReflection(res.data.data);
        setShowReflectionForm(false);
        setReflectionForm({ title: "", content: "" });
        toast.success("Reflection saved! 📝");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save reflection");
    } finally {
      setSubmittingReflection(false);
    }
  };

  const getMoodEmoji = (mood: string) => {
    const moodMap: Record<string, string> = {
      great: "😄",
      good: "🙂",
      neutral: "😐",
      bad: "😟",
      terrible: "😞",
    };
    return moodMap[mood] || "😐";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  const goalProgressPts =
    (metrics?.goalProgress.completed || 0) *
    (70 / Math.max(metrics?.goalProgress.total || 1, 1));
  const habitCompletionPts =
    (metrics?.habitCompletion.completed || 0) *
    (20 / Math.max(metrics?.habitCompletion.total || 1, 1));

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Who Am I Becoming?
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Track your daily alignment and long-term growth
          </p>
        </div>
        <button
          onClick={loadDashboardData}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <FaRedo className="text-sm" />
          Refresh
        </button>
      </div>

      {/* Daily Check-In & Reflection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Daily Check-In */}
        <div
          className={`rounded-2xl border p-6 ${
            dailyCheckIn?.completed
              ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
              : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
          }`}
        >
          <div className="flex items-center gap-2 mb-4">
            <FaClipboardList
              className={
                dailyCheckIn?.completed ? "text-green-600" : "text-blue-600"
              }
            />
            <h2 className="font-bold text-gray-900 dark:text-white">
              Daily Check-In
            </h2>
          </div>

          {!dailyCheckIn?.completed && !showCheckInForm ? (
            <button
              onClick={() => setShowCheckInForm(true)}
              className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              Start Check-In
            </button>
          ) : showCheckInForm ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  How's your mood today? {getMoodEmoji(checkInForm.mood)}
                </label>
                <select
                  value={checkInForm.mood}
                  onChange={(e) =>
                    setCheckInForm({ ...checkInForm, mood: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="great">Great 😄</option>
                  <option value="good">Good 🙂</option>
                  <option value="neutral">Neutral 😐</option>
                  <option value="bad">Bad 😟</option>
                  <option value="terrible">Terrible 😞</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Energy Level
                  </label>
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                    {checkInForm.energy}/10
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={checkInForm.energy}
                  onChange={(e) =>
                    setCheckInForm({
                      ...checkInForm,
                      energy: parseInt(e.target.value),
                    })
                  }
                  className="w-full h-2 bg-gray-300 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Focus Level
                  </label>
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                    {checkInForm.focus}/10
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={checkInForm.focus}
                  onChange={(e) =>
                    setCheckInForm({
                      ...checkInForm,
                      focus: parseInt(e.target.value),
                    })
                  }
                  className="w-full h-2 bg-gray-300 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={submitCheckIn}
                  disabled={submittingCheckIn}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors text-sm disabled:opacity-60"
                >
                  {submittingCheckIn ? "Saving..." : "Save Check-In"}
                </button>
                <button
                  onClick={() => setShowCheckInForm(false)}
                  className="flex-1 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-semibold transition-colors text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Mood
                </span>
                <span className="text-2xl">
                  {getMoodEmoji(dailyCheckIn?.mood || "neutral")}
                </span>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Energy
                  </span>
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                    {dailyCheckIn?.energy}/10
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600"
                    style={{
                      width: `${((dailyCheckIn?.energy || 0) / 10) * 100}%`,
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Focus
                  </span>
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                    {dailyCheckIn?.focus}/10
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600"
                    style={{
                      width: `${((dailyCheckIn?.focus || 0) / 10) * 100}%`,
                    }}
                  />
                </div>
              </div>
              <button
                onClick={() => setShowCheckInForm(true)}
                className="w-full py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg font-semibold transition-colors text-sm"
              >
                Edit Check-In
              </button>
            </div>
          )}
        </div>

        {/* Daily Reflection */}
        <div
          className={`rounded-2xl border p-6 ${
            dailyReflection?.completed
              ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
              : "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800"
          }`}
        >
          <div className="flex items-center gap-2 mb-4">
            <FaPen
              className={
                dailyReflection?.completed
                  ? "text-green-600"
                  : "text-purple-600"
              }
            />
            <h2 className="font-bold text-gray-900 dark:text-white">
              Daily Reflection
            </h2>
          </div>

          {!dailyReflection?.completed && !showReflectionForm ? (
            <button
              onClick={() => setShowReflectionForm(true)}
              className="w-full py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors"
            >
              Write Reflection
            </button>
          ) : showReflectionForm ? (
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Reflection title..."
                value={reflectionForm.title}
                onChange={(e) =>
                  setReflectionForm({
                    ...reflectionForm,
                    title: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <textarea
                placeholder="What did you learn today? What went well? What could improve?..."
                value={reflectionForm.content}
                onChange={(e) =>
                  setReflectionForm({
                    ...reflectionForm,
                    content: e.target.value,
                  })
                }
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={submitReflection}
                  disabled={submittingReflection}
                  className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors text-sm disabled:opacity-60"
                >
                  {submittingReflection ? "Saving..." : "Save Reflection"}
                </button>
                <button
                  onClick={() => {
                    setShowReflectionForm(false);
                    setReflectionForm({ title: "", content: "" });
                  }}
                  className="flex-1 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-semibold transition-colors text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-3">
              <div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                  {dailyReflection?.title}
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 line-clamp-3">
                  {dailyReflection?.content}
                </p>
              </div>
              <button
                onClick={() => setShowReflectionForm(true)}
                className="w-full py-2 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg font-semibold transition-colors text-sm"
              >
                Edit Reflection
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 4-COLUMN METRIC CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Alignment Score Card */}
        <AlignmentScoreCard
          score={metrics?.alignmentScore || 0}
          goalProgress={Math.round(goalProgressPts)}
          habitCompletion={Math.round(habitCompletionPts)}
          hasCheckedInToday={metrics?.checks.hasCheckedInToday || false}
        />

        {/* Alignment Trend Card */}
        <AlignmentTrendCard
          score={metrics?.alignmentTrend || 0}
          trendData={metrics?.trend || []}
        />

        {/* Growth Score Card */}
        <GrowthScoreCard
          score={metrics?.growthScore || 0}
          capabilities={metrics?.capabilities.completed || 0}
          achievements={metrics?.achievements.completed || 0}
        />

        {/* Risk Indicator Card */}
        <RiskIndicatorCard riskScore={metrics?.riskIndicator || 0} />
      </div>

      {/* Score Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left: Score Breakdown */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
          <h3 className="font-bold text-gray-900 dark:text-white mb-4">
            📊 Score Breakdown
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Goal Progress
                </span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {metrics?.goalProgress.completed || 0}/
                  {metrics?.goalProgress.total || 0}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${
                      metrics?.goalProgress.total
                        ? (metrics.goalProgress.completed /
                            metrics.goalProgress.total) *
                          100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Habit Completion
                </span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {metrics?.habitCompletion.completed || 0}/
                  {metrics?.habitCompletion.total || 0}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${
                      metrics?.habitCompletion.total
                        ? (metrics.habitCompletion.completed /
                            metrics.habitCompletion.total) *
                          100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Habit Rate (7-day)
                </span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {metrics?.habitCompletionRate || 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${metrics?.habitCompletionRate || 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Growth Breakdown */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
          <h3 className="font-bold text-gray-900 dark:text-white mb-4">
            🏆 Growth Breakdown
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Capabilities
                </span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {metrics?.capabilities.completed || 0}/
                  {metrics?.capabilities.total || 0}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-amber-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${
                      metrics?.capabilities.total
                        ? (metrics.capabilities.completed /
                            metrics.capabilities.total) *
                          100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Achievements
                </span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {metrics?.achievements.completed || 0}/
                  {metrics?.achievements.total || 0}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-pink-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${
                      metrics?.achievements.total
                        ? (metrics.achievements.completed /
                            metrics.achievements.total) *
                          100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                <strong>💡 Tip:</strong> Complete more goals and habits to boost
                your growth score!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Access Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button
          onClick={() => navigate("/goals")}
          className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4 border border-blue-200 dark:border-blue-800 hover:shadow-lg transition-all text-left hover:scale-105"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-blue-700 dark:text-blue-300">
              Goals
            </span>
            <span className="text-lg">🎯</span>
          </div>
          <p className="text-2xl font-black text-blue-600 dark:text-blue-400">
            {metrics?.stats.activeGoals || 0}
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
            active • {metrics?.stats.completedGoals || 0} completed
          </p>
        </button>

        <button
          onClick={() => navigate("/habits")}
          className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-4 border border-green-200 dark:border-green-800 hover:shadow-lg transition-all text-left hover:scale-105"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-green-700 dark:text-green-300">
              Habits
            </span>
            <FaFire className="text-green-600 text-lg" />
          </div>
          <p className="text-2xl font-black text-green-600 dark:text-green-400">
            {metrics?.stats.completedHabitsToday || 0}
          </p>
          <p className="text-xs text-green-600 dark:text-green-400 mt-2">
            today • {metrics?.stats.linkedHabits || 0} linked
          </p>
        </button>

        <button
          onClick={() => navigate("/execution")}
          className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-4 border border-amber-200 dark:border-amber-800 hover:shadow-lg transition-all text-left hover:scale-105"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-amber-700 dark:text-amber-300">
              Execution
            </span>
            <span className="text-lg">🔥</span>
          </div>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400">
            {metrics?.stats.activeGoals || 0}
          </p>
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
            in progress
          </p>
        </button>

        <button
          onClick={() => navigate("/analytics")}
          className="bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-4 border border-purple-200 dark:border-purple-800 hover:shadow-lg transition-all text-left hover:scale-105"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-purple-700 dark:text-purple-300">
              Analytics
            </span>
            <FaChartLine className="text-purple-600 text-lg" />
          </div>
          <p className="text-2xl font-black text-purple-600 dark:text-purple-400">
            →
          </p>
          <p className="text-xs text-purple-600 dark:text-purple-400 mt-2">
            view insights
          </p>
        </button>
      </div>

      {/* Info Box */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-2xl p-6 border border-blue-100 dark:border-blue-900/50">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">
          📈 Understanding Your Metrics
        </h3>
        <div className="space-y-2 text-xs text-gray-700 dark:text-gray-300">
          <div>
            <strong>Alignment Score:</strong> Daily execution quality combining
            goals, habits, and check-in
          </div>
          <div>
            <strong>Alignment Trend:</strong> Your 30-day consistency pattern
            showing daily progress
          </div>
          <div>
            <strong>Growth Score:</strong> Cumulative long-term development from
            capabilities and achievements
          </div>
          <div>
            <strong>Risk Indicator:</strong> Early warning system flagging
            misalignment before it's critical
          </div>
        </div>
      </div>
    </div>
  );
}
