import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { api } from "@/utils/api";
import toast from "react-hot-toast";
import {
  FaTag,
  FaFilter,
  FaShareAlt,
  FaChevronDown,
  FaChevronUp,
  FaFire,
} from "react-icons/fa";

interface DayHistory {
  date: string;
  score: number;
  state: string;
  loopType: string;
  loopSeverity: string;
  realization: string;
  slotsCount: number;
  slots: { slot: string; state: string; time: string }[];
  awareness: number;
  hasReflection: boolean;
}

const STATE_COLORS: Record<string, string> = {
  Calm: "bg-green-100 text-green-700",
  Focused: "bg-blue-100 text-blue-700",
  Energized: "bg-purple-100 text-purple-700",
  Clear: "bg-teal-100 text-teal-700",
  Stressed: "bg-red-100 text-red-700",
  Distracted: "bg-yellow-100 text-yellow-700",
  Confused: "bg-yellow-100 text-yellow-700",
  Avoiding: "bg-red-100 text-red-700",
  Anxious: "bg-orange-100 text-orange-700",
};
const LOOP_COLORS: Record<string, string> = {
  Avoidance: "text-red-600 bg-red-50",
  Overthinking: "text-amber-600 bg-amber-50",
  Inconsistency: "text-orange-600 bg-orange-50",
  None: "",
};
const TAGS = [
  "All",
  "Avoidance",
  "Clarity",
  "Fear",
  "Progress",
  "Insight",
  "Breakthrough",
  "Pattern",
  "Gratitude",
];

const scoreLabel = (s: number) =>
  s >= 70
    ? { l: "Aligned", c: "text-green-600", bg: "bg-green-100" }
    : s >= 40
      ? { l: "Improving", c: "text-amber-600", bg: "bg-amber-100" }
      : { l: "Misaligned", c: "text-red-500", bg: "bg-red-100" };
const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
const fmtShort = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

function MiniBar({
  value,
  max,
  color,
}: {
  value: number;
  max: number;
  color: string;
}) {
  return (
    <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
      <div
        className="h-1.5 rounded-full transition-all"
        style={{
          width: `${Math.min(100, (Math.abs(value) / max) * 100)}%`,
          background: color,
        }}
      />
    </div>
  );
}

export default function InsightsPage() {
  const [history, setHistory] = useState<DayHistory[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [tag, setTag] = useState("All");
  const [expandedDay, setExpanded] = useState<string | null>(null);
  const [view, setView] = useState<"timeline" | "calendar">("timeline");

  useEffect(() => {
    load();
  }, [days, tag]);

  const load = async () => {
    setLoading(true);
    try {
      const [histRes, realRes] = await Promise.all([
        api.get(`/checkin/history?days=${days}`),
        tag !== "All"
          ? api.get(`/checkin/realizations?tag=${tag}`)
          : Promise.resolve(null),
      ]);
      const d = histRes.data.data;
      setHistory(d.history || []);
      setSummary({
        avgScore: d.avgScore,
        bestScore: d.bestScore,
        streakDays: d.streakDays,
        mostCommonState: d.mostCommonState,
        stateCounts: d.stateCounts,
      });
    } catch {
      toast.error("Failed to load insights");
    } finally {
      setLoading(false);
    }
  };

  const withRealizations = history.filter((h) => h.realization);

  // Calendar data — last 7 weeks
  const calendarWeeks = () => {
    const weeks: (DayHistory | null)[][] = [];
    const map = Object.fromEntries(history.map((h) => [h.date, h]));
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - 41);
    start.setDate(start.getDate() - start.getDay()); // align to Sunday
    for (let w = 0; w < 6; w++) {
      const week: (DayHistory | null)[] = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(start);
        date.setDate(start.getDate() + w * 7 + d);
        const ds = date.toISOString().slice(0, 10);
        week.push(map[ds] || null);
      }
      weeks.push(week);
    }
    return weeks;
  };

  const scoreBg = (s: number) =>
    s >= 70 ? "#dcfce7" : s >= 40 ? "#fef9c3" : s > 0 ? "#fee2e2" : "#f3f4f6";
  const scoreC = (s: number) =>
    s >= 70 ? "#16a34a" : s >= 40 ? "#d97706" : s > 0 ? "#dc2626" : "#9ca3af";

  if (loading)
    return (
      <DashboardLayout>
        <div className="flex justify-center py-24">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Insights</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Your daily alignment history and patterns
            </p>
          </div>
          <div className="flex gap-2">
            {[7, 14, 30].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${days === d ? "bg-indigo-600 text-white border-indigo-600" : "border-gray-200 text-gray-600 hover:border-indigo-300"}`}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: "Avg Score",
              val: summary.avgScore || 0,
              suffix: "/100",
              color: "text-indigo-600",
              bg: "bg-indigo-50",
            },
            {
              label: "Best Score",
              val: summary.bestScore || 0,
              suffix: "/100",
              color: "text-green-600",
              bg: "bg-green-50",
            },
            {
              label: "Active Days",
              val: summary.streakDays || 0,
              suffix: ` of ${days}`,
              color: "text-amber-600",
              bg: "bg-amber-50",
            },
            {
              label: "Top State",
              val: summary.mostCommonState || "—",
              suffix: "",
              color: "text-purple-600",
              bg: "bg-purple-50",
            },
          ].map((s, i) => (
            <div
              key={i}
              className={`${s.bg} rounded-2xl p-4 text-center border border-white shadow-sm`}
            >
              <p className={`text-2xl font-black ${s.color}`}>
                {s.val}
                <span className="text-sm font-normal">{s.suffix}</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Score Heatmap Calendar */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-bold text-gray-900 mb-4">
            Alignment Score Heatmap
          </h2>
          <div className="overflow-x-auto">
            <div className="flex gap-1 min-w-max">
              {/* Day labels */}
              <div className="flex flex-col gap-1 mr-2 pt-6">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                  <div
                    key={d}
                    className="text-xs text-gray-400 h-7 flex items-center"
                  >
                    {d}
                  </div>
                ))}
              </div>
              {calendarWeeks().map((week, wi) => (
                <div key={wi} className="flex flex-col gap-1">
                  {wi === 0 && (
                    <div className="text-xs text-gray-400 text-center mb-1 h-5" />
                  )}
                  {week.map((day, di) => (
                    <div
                      key={di}
                      title={
                        day
                          ? `${fmtShort(day.date)}: ${day.score}/100 (${day.state || "—"})`
                          : ""
                      }
                      className="w-7 h-7 rounded-md cursor-default transition-all hover:ring-2 hover:ring-indigo-300 hover:scale-110"
                      style={{
                        background: day ? scoreBg(day.score) : "#f3f4f6",
                        border: `1px solid ${day?.score > 0 ? scoreC(day.score) + "30" : "#e5e7eb"}`,
                      }}
                    >
                      {day?.score > 0 && (
                        <div className="w-full h-full flex items-center justify-center">
                          <span
                            className="text-xs font-bold"
                            style={{
                              color: scoreC(day.score),
                              fontSize: "9px",
                            }}
                          >
                            {day.score}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
          {/* Legend */}
          <div className="flex items-center gap-3 mt-4 text-xs text-gray-400">
            <span>Less</span>
            {[0, 35, 55, 70, 85].map((s) => (
              <div
                key={s}
                className="w-4 h-4 rounded-sm border border-gray-200"
                style={{ background: scoreBg(s) }}
              />
            ))}
            <span>More</span>
            <span className="ml-2 text-gray-300">|</span>
            <span className="ml-2">Score each day</span>
          </div>
        </div>

        {/* Daily Timeline */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-gray-900">Daily Score Details</h2>
            <div className="flex gap-2">
              <FaFilter className="text-gray-400 w-3.5 h-3.5 mt-1" />
              {TAGS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTag(t)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${tag === t ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-500 hover:bg-indigo-50"}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {history.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-lg font-medium">No data yet</p>
              <p className="text-sm mt-1">
                Complete your daily check-ins to see your history here
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {[...history].reverse().map((day, i) => {
                const sl = scoreLabel(day.score);
                const isExpanded = expandedDay === day.date;
                const filtered =
                  tag !== "All" && day.realization
                    ? day.realization
                    : day.realization;
                if (tag !== "All" && !day.realization) return null;
                return (
                  <div
                    key={day.date}
                    className={`rounded-xl border transition-all ${day.score > 0 ? "border-gray-100 bg-gray-50" : "border-dashed border-gray-200 bg-gray-50/50"}`}
                  >
                    {/* Row header */}
                    <button
                      className="w-full text-left p-4"
                      onClick={() => setExpanded(isExpanded ? null : day.date)}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {/* Score circle */}
                          <div
                            className="w-12 h-12 rounded-full flex flex-col items-center justify-center shrink-0 border-2"
                            style={{
                              borderColor: scoreC(day.score),
                              background: scoreBg(day.score),
                            }}
                          >
                            <span
                              className="text-sm font-black"
                              style={{ color: scoreC(day.score) }}
                            >
                              {day.score || "—"}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800">
                              {fmtDate(day.date)}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              {day.score > 0 && (
                                <span
                                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${sl.bg} ${sl.c}`}
                                >
                                  {sl.l}
                                </span>
                              )}
                              {day.state && (
                                <span
                                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATE_COLORS[day.state] || "bg-gray-100 text-gray-600"}`}
                                >
                                  {day.state}
                                </span>
                              )}
                              {day.loopType !== "None" && day.loopType && (
                                <span
                                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${LOOP_COLORS[day.loopType]}`}
                                >
                                  {day.loopType}
                                </span>
                              )}
                              {day.slotsCount === 0 && (
                                <span className="text-xs text-gray-400">
                                  No check-in
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {/* Mini score bars */}
                        {day.score > 0 && (
                          <div className="hidden sm:flex gap-3 shrink-0 text-xs text-gray-400">
                            <div className="text-center">
                              <p className="font-bold text-blue-600">
                                {day.awareness}
                              </p>
                              <p>Awareness</p>
                            </div>
                            <div className="text-center">
                              <p className="font-bold text-green-600">
                                {day.score - day.awareness > 0
                                  ? day.score - day.awareness
                                  : 0}
                              </p>
                              <p>Exec</p>
                            </div>
                          </div>
                        )}
                        {isExpanded ? (
                          <FaChevronUp className="text-gray-400 w-3 h-3 shrink-0" />
                        ) : (
                          <FaChevronDown className="text-gray-400 w-3 h-3 shrink-0" />
                        )}
                      </div>
                    </button>

                    {/* Expanded detail */}
                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-3">
                        {/* Score breakdown */}
                        {day.score > 0 && (
                          <div className="grid grid-cols-3 gap-3">
                            <div className="bg-blue-50 rounded-xl p-3 text-center">
                              <p className="text-xs text-blue-500 font-medium">
                                Awareness
                              </p>
                              <p className="text-xl font-black text-blue-600">
                                {day.awareness}
                                <span className="text-xs text-blue-400">
                                  /30
                                </span>
                              </p>
                              <MiniBar
                                value={day.awareness}
                                max={30}
                                color="#3b82f6"
                              />
                              <p className="text-xs text-blue-400 mt-1">
                                {day.slotsCount} check-in
                                {day.slotsCount !== 1 ? "s" : ""} +{" "}
                                {day.hasReflection
                                  ? "reflection"
                                  : "no reflection"}
                              </p>
                            </div>
                            <div className="bg-green-50 rounded-xl p-3 text-center">
                              <p className="text-xs text-green-500 font-medium">
                                Execution
                              </p>
                              <p className="text-xl font-black text-green-600">
                                {Math.max(0, day.score - day.awareness)}
                                <span className="text-xs text-green-400">
                                  /70
                                </span>
                              </p>
                              <MiniBar
                                value={Math.max(0, day.score - day.awareness)}
                                max={70}
                                color="#22c55e"
                              />
                              <p className="text-xs text-green-400 mt-1">
                                Activities completed on time
                              </p>
                            </div>
                            <div className="bg-red-50 rounded-xl p-3 text-center">
                              <p className="text-xs text-red-500 font-medium">
                                Penalty
                              </p>
                              <p className="text-xl font-black text-red-500">
                                {day.hasReflection ? "0" : "−10"}
                                <span className="text-xs text-red-400">
                                  /−30
                                </span>
                              </p>
                              <MiniBar
                                value={day.hasReflection ? 0 : 10}
                                max={30}
                                color="#ef4444"
                              />
                              <p className="text-xs text-red-400 mt-1">
                                {day.hasReflection
                                  ? "No penalties"
                                  : "No reflection (−10)"}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Check-in slots */}
                        {day.slots && day.slots.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                              Check-ins
                            </p>
                            <div className="flex gap-2 flex-wrap">
                              {day.slots.map((s, j) => (
                                <div
                                  key={j}
                                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${STATE_COLORS[s.state] || "bg-gray-100 text-gray-600"}`}
                                >
                                  {s.slot === "Morning"
                                    ? "🌅"
                                    : s.slot === "Midday"
                                      ? "☀️"
                                      : "🌙"}{" "}
                                  {s.slot} — {s.state}
                                  {s.time && (
                                    <span className="opacity-60 ml-1">
                                      {s.time}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Realization */}
                        {day.realization && (
                          <div className="bg-purple-50 rounded-xl p-3">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide">
                                Reflection
                              </p>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(
                                    day.realization,
                                  );
                                  toast.success("Copied!");
                                }}
                                className="text-purple-400 hover:text-purple-600"
                              >
                                <FaShareAlt className="w-3 h-3" />
                              </button>
                            </div>
                            <p className="text-sm text-gray-700 italic leading-relaxed">
                              "{day.realization}"
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* State frequency */}
        {summary.stateCounts && Object.keys(summary.stateCounts).length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-bold text-gray-900 mb-4">
              Mind State Frequency
            </h2>
            <div className="space-y-2">
              {Object.entries(summary.stateCounts as Record<string, number>)
                .sort((a, b) => b[1] - a[1])
                .map(([state, count]) => {
                  const pct = Math.round((count / days) * 100);
                  return (
                    <div key={state} className="flex items-center gap-3">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-medium w-24 text-center shrink-0 ${STATE_COLORS[state] || "bg-gray-100 text-gray-600"}`}
                      >
                        {state}
                      </span>
                      <div className="flex-1 bg-gray-100 rounded-full h-2.5">
                        <div
                          className="h-2.5 rounded-full transition-all duration-700 bg-indigo-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 w-12 text-right">
                        {count} day{count !== 1 ? "s" : ""}
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
