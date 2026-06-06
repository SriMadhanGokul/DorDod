import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { api } from "@/utils/api";
import toast from "react-hot-toast";
import { FaFire, FaBullseye, FaLink, FaArrowUp } from "react-icons/fa";

interface GrowthData {
  growthScore: number;
  level: string;
  alignmentScore: number;
  habitConsistency: number;
  weeklyCompleted: number;
  weeklyScheduled: number;
  goalLinkedRoutines: number;
  totalRoutines: number;
  inProgressGoals: number;
}

function ScoreGauge({
  score,
  label,
  color,
}: {
  score: number;
  label: string;
  color: string;
}) {
  const size = 120;
  const r = 45;
  const circ = 2 * Math.PI * r;
  const off = circ - (score / 100) * circ;
  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={12}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={12}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={off}
            style={{ transition: "stroke-dashoffset 1s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-black" style={{ color }}>
            {score}
          </span>
          <span className="text-xs text-gray-400">%</span>
        </div>
      </div>
      <span className="mt-2 text-sm font-semibold text-gray-600 dark:text-gray-300">
        {label}
      </span>
    </div>
  );
}

const getLevelBg = (level: string) => {
  if (level === "Excellent") return "bg-green-100 text-green-700";
  if (level === "Good") return "bg-blue-100 text-blue-700";
  if (level === "Fair") return "bg-amber-100 text-amber-700";
  return "bg-red-100 text-red-600";
};

// ─── Embeddable section (NO DashboardLayout wrapper, NO page heading) ─────────
// Used inside the combined dashboard page.
export function GrowthScoreSection() {
  const [growthData, setGrowthData] = useState<GrowthData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/growth-score")
      .then((res) => setGrowthData(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!growthData) return null;

  return (
    <div className="space-y-6">
      {/* Section heading */}
      <div className="pt-2">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Growth Score
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Track your personal growth combining goals & habits
        </p>
      </div>

      {/* Main Growth Score Card */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm opacity-90">Your Overall Growth Score</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-5xl font-black">
                {growthData.growthScore}
              </span>
              <span className="text-2xl opacity-75">/100</span>
            </div>
          </div>
          <span
            className={`px-4 py-2 rounded-xl font-bold text-lg ${getLevelBg(growthData.level)}`}
          >
            {growthData.level}
          </span>
        </div>
        <p className="text-sm opacity-90">
          {growthData.growthScore >= 80
            ? "🎉 Excellent progress! Keep maintaining this momentum."
            : growthData.growthScore >= 60
              ? "👍 Good work! You're on the right track."
              : growthData.growthScore >= 40
                ? "💪 Keep pushing! Small improvements lead to big results."
                : "🚀 Start with small habits and watch your score grow."}
        </p>
      </div>

      {/* Three Score Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ScoreGauge
          score={growthData.growthScore}
          label="Overall Growth"
          color="#6366f1"
        />
        <ScoreGauge
          score={growthData.alignmentScore}
          label="Alignment"
          color="#3b82f6"
        />
        <ScoreGauge
          score={growthData.habitConsistency}
          label="Habit Consistency"
          color="#f59e0b"
        />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <FaBullseye className="text-blue-600 dark:text-blue-400 w-5 h-5" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white">
              Goal Alignment
            </h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Active Goals
              </span>
              <span className="text-lg font-bold text-blue-600">
                {growthData.inProgressGoals}
              </span>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Alignment Score
                </span>
                <span className="text-lg font-bold text-blue-600">
                  {growthData.alignmentScore}%
                </span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-blue-600 transition-all"
                  style={{ width: `${growthData.alignmentScore}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
              <FaFire className="text-amber-600 dark:text-amber-400 w-5 h-5" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white">
              Habit Consistency
            </h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                This Week
              </span>
              <span className="text-lg font-bold text-amber-600">
                {growthData.weeklyCompleted}/{growthData.weeklyScheduled}
              </span>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Consistency Score
                </span>
                <span className="text-lg font-bold text-amber-600">
                  {growthData.habitConsistency}%
                </span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-amber-600 transition-all"
                  style={{ width: `${growthData.habitConsistency}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Goal-Linked Habits Card */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
            <FaLink className="text-purple-600 dark:text-purple-400 w-5 h-5" />
          </div>
          <h3 className="font-bold text-gray-900 dark:text-white">
            Goal-Linked Habits
          </h3>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Habits Linked to Goals
            </p>
            <p className="text-3xl font-bold text-purple-600">
              {growthData.goalLinkedRoutines}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Total Habits
            </p>
            <p className="text-3xl font-bold text-gray-600">
              {growthData.totalRoutines}
            </p>
          </div>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <FaArrowUp className="text-purple-600 dark:text-purple-400 mt-1 flex-shrink-0 w-4 h-4" />
            <div className="text-sm">
              <p className="font-semibold text-purple-900 dark:text-purple-200">
                Boost Your Score
              </p>
              <p className="text-purple-800 dark:text-purple-300 mt-1">
                Link your habits to active goals to get a 1.5x weight
                multiplier. This directly connects your daily actions to your
                long-term growth.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Score Formula */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
        <h3 className="font-bold text-gray-900 dark:text-white mb-3">
          How Your Score Is Calculated
        </h3>
        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 font-mono">
          <div>
            Growth Score = (Alignment × 60%) + (Habit Consistency × 40%)
          </div>
          <div>
            Habit Weight = 1x (normal) | 1.5x (if linked to active goal)
          </div>
          <div>Updated Weekly</div>
        </div>
      </div>
    </div>
  );
}

// ─── Standalone page (kept for /growth-score if ever needed) ──────────────────
export default function GrowthScorePage() {
  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl">
        <GrowthScoreSection />
      </div>
    </DashboardLayout>
  );
}
