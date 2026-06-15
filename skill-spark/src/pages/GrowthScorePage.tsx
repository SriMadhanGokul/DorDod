import { useState, useEffect } from "react";
import { api } from "@/utils/api";
import { FaArrowUp } from "react-icons/fa";

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

// Small circular gauge — minimal, muted
function Gauge({
  score,
  label,
  color,
}: {
  score: number;
  label: string;
  color: string;
}) {
  const size = 92;
  const r = 38;
  const circ = 2 * Math.PI * r;
  const off = circ - (Math.min(score, 100) / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="#eef0f3"
            strokeWidth={8}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={8}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={off}
            style={{ transition: "stroke-dashoffset 1s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-semibold text-gray-900 dark:text-white">
            {score}
          </span>
          <span className="text-[10px] text-gray-400">%</span>
        </div>
      </div>
      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
        {label}
      </span>
    </div>
  );
}

const levelTone = (level: string) =>
  level === "Excellent"
    ? "text-emerald-600 bg-emerald-50 border-emerald-100"
    : level === "Good"
      ? "text-blue-600 bg-blue-50 border-blue-100"
      : level === "Fair"
        ? "text-amber-600 bg-amber-50 border-amber-100"
        : "text-rose-600 bg-rose-50 border-rose-100";

// ─── Embeddable section (no layout wrapper) ───────────────────────────────────
export function GrowthScoreSection() {
  const [g, setG] = useState<GrowthData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/growth-score")
      .then((res) => setG(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-7 h-7 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
      </div>
    );
  }
  if (!g) return null;

  return (
    <section className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200/70 dark:border-gray-800 p-6">
      {/* Header — matched to Alignment card header height */}
      <header className="mb-5">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white tracking-tight">
          Growth Score
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">Goals & habits combined</p>
      </header>

      {/* Headline number */}
      <div className="flex items-end justify-between pb-5 mb-5 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-baseline gap-1.5">
          <span className="text-4xl font-semibold text-gray-900 dark:text-white tabular-nums">
            {g.growthScore}
          </span>
          <span className="text-sm text-gray-400">/100</span>
        </div>
        <span
          className={`text-xs font-medium px-2.5 py-1 rounded-full border ${levelTone(g.level)}`}
        >
          {g.level}
        </span>
      </div>

      {/* Three gauges */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        <Gauge score={g.growthScore} label="Overall" color="#4f46e5" />
        <Gauge score={g.alignmentScore} label="Alignment" color="#2563eb" />
        <Gauge score={g.habitConsistency} label="Consistency" color="#d97706" />
      </div>

      {/* Stat rows */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Active goals</span>
          <span className="font-medium text-gray-900 dark:text-white tabular-nums">
            {g.inProgressGoals}
          </span>
        </div>
        <div>
          <div className="flex items-center justify-between text-sm mb-1.5">
            <span className="text-gray-500 dark:text-gray-400">Alignment</span>
            <span className="font-medium text-gray-900 dark:text-white tabular-nums">
              {g.alignmentScore}%
            </span>
          </div>
          <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5">
            <div
              className="h-1.5 rounded-full bg-blue-500 transition-all"
              style={{ width: `${g.alignmentScore}%` }}
            />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between text-sm mb-1.5">
            <span className="text-gray-500 dark:text-gray-400">
              Habit consistency · {g.weeklyCompleted}/{g.weeklyScheduled} this
              week
            </span>
            <span className="font-medium text-gray-900 dark:text-white tabular-nums">
              {g.habitConsistency}%
            </span>
          </div>
          <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5">
            <div
              className="h-1.5 rounded-full bg-amber-500 transition-all"
              style={{ width: `${g.habitConsistency}%` }}
            />
          </div>
        </div>
      </div>

      {/* Goal-linked habits */}
      <div className="rounded-lg border border-gray-100 dark:border-gray-800 p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Goal-linked habits
          </span>
          <span className="text-xs text-gray-400">
            {g.goalLinkedRoutines} of {g.totalRoutines} linked
          </span>
        </div>
        <div className="flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400">
          <FaArrowUp className="w-3 h-3 mt-0.5 text-gray-400 shrink-0" />
          <p>
            Link habits to active goals for a 1.5× weight multiplier, connecting
            daily actions to long-term growth.
          </p>
        </div>
      </div>
    </section>
  );
}

// ─── Standalone page ──────────────────────────────────────────────────────────
export default function GrowthScorePage() {
  return (
    <div className="max-w-3xl mx-auto">
      <GrowthScoreSection />
    </div>
  );
}
