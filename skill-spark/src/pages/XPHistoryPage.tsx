import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { api } from "@/utils/api";
import toast from "react-hot-toast";
import {
  FaTrophy,
  FaFire,
  FaStar,
  FaArrowLeft,
  FaChartBar,
  FaHistory,
  FaInfoCircle,
} from "react-icons/fa";

interface XPEvent {
  type: string;
  points: number;
  description: string;
  createdAt: string;
}
interface Breakdown {
  type: string;
  count: number;
  total: number;
  icon: string;
  label: string;
}

const LEVEL_INFO = [
  {
    level: 1,
    name: "🥉 Bronze",
    min: 0,
    max: 499,
    color: "text-orange-500",
    bg: "bg-orange-50 border-orange-200",
    tip: "Starting your journey!",
  },
  {
    level: 2,
    name: "🥈 Silver",
    min: 500,
    max: 1499,
    color: "text-gray-500",
    bg: "bg-gray-50 border-gray-200",
    tip: "Building consistency!",
  },
  {
    level: 3,
    name: "🥇 Gold",
    min: 1500,
    max: 3499,
    color: "text-yellow-500",
    bg: "bg-yellow-50 border-yellow-200",
    tip: "Serious commitment!",
  },
  {
    level: 4,
    name: "💎 Platinum",
    min: 3500,
    max: 7499,
    color: "text-blue-500",
    bg: "bg-blue-50 border-blue-200",
    tip: "Elite performer!",
  },
  {
    level: 5,
    name: "👑 Diamond",
    min: 7500,
    max: 99999,
    color: "text-purple-500",
    bg: "bg-purple-50 border-purple-200",
    tip: "Legendary status!",
  },
];

const XP_GUIDE = [
  {
    icon: "🎯",
    action: "Complete a Goal",
    xp: "+50 XP",
    color: "text-primary",
    desc: "Mark any goal as 100% complete",
  },
  {
    icon: "🔥",
    action: "Reach 75% on a Goal",
    xp: "+15 XP",
    color: "text-orange-500",
    desc: "Hit 75% progress on any goal",
  },
  {
    icon: "✅",
    action: "Complete a Habit Day",
    xp: "+10 XP",
    color: "text-success",
    desc: "Check off any habit day on your 21-day tracker",
  },
  {
    icon: "🔥🔥",
    action: "7-Day Streak Bonus",
    xp: "+50 XP",
    color: "text-red-500",
    desc: "Maintain a 7-day consecutive habit streak",
  },
  {
    icon: "💥",
    action: "14-Day Streak Bonus",
    xp: "+100 XP",
    color: "text-red-600",
    desc: "Maintain a 14-day consecutive habit streak",
  },
  {
    icon: "👑",
    action: "21-Day Streak Bonus",
    xp: "+200 XP",
    color: "text-purple-600",
    desc: "Complete the full 21-day habit challenge",
  },
  {
    icon: "⚡",
    action: "Complete an Activity",
    xp: "+20 XP",
    color: "text-secondary",
    desc: "Mark any activity as Done",
  },
  {
    icon: "🎓",
    action: "Complete a Course",
    xp: "+100 XP",
    color: "text-blue-500",
    desc: "Reach 100% progress on any course",
  },
  {
    icon: "📚",
    action: "Reach 50% on a Course",
    xp: "+25 XP",
    color: "text-blue-400",
    desc: "Hit halfway on any enrolled course",
  },
  {
    icon: "🏆",
    action: "Unlock an Achievement",
    xp: "+30 XP",
    color: "text-yellow-500",
    desc: "Add or earn any achievement",
  },
  {
    icon: "😊",
    action: "Log Frame of Mind",
    xp: "+5 XP",
    color: "text-pink-500",
    desc: "Log your daily mood/mindset",
  },
  {
    icon: "🧠",
    action: "Mark Skill as Learned",
    xp: "+40 XP",
    color: "text-indigo-500",
    desc: "Update a skill status to Learned",
  },
  {
    icon: "🌅",
    action: "Comeback Bonus",
    xp: "+30 XP",
    color: "text-teal-500",
    desc: "Return after missing a day — never give up!",
  },
  {
    icon: "💍",
    action: "All 3 Progress Rings",
    xp: "+50 XP",
    color: "text-primary",
    desc: "Complete Goals + Habits + Learning rings in one day",
  },
];

const TYPE_COLOR: Record<string, string> = {
  goal_complete: "bg-primary/10 text-primary border-primary/20",
  goal_75pct: "bg-orange-50 text-orange-600 border-orange-200",
  habit_day: "bg-success/10 text-success border-success/20",
  habit_streak_7: "bg-red-50 text-red-600 border-red-200",
  habit_streak_14: "bg-red-100 text-red-700 border-red-300",
  habit_streak_21: "bg-purple-50 text-purple-700 border-purple-200",
  activity_done: "bg-secondary/10 text-secondary border-secondary/20",
  course_complete: "bg-blue-50 text-blue-600 border-blue-200",
  course_50pct: "bg-blue-50 text-blue-500 border-blue-100",
  achievement: "bg-yellow-50 text-yellow-600 border-yellow-200",
  mood_log: "bg-pink-50 text-pink-500 border-pink-200",
  skill_learned: "bg-indigo-50 text-indigo-600 border-indigo-200",
  comeback_bonus: "bg-teal-50 text-teal-600 border-teal-200",
  weekly_challenge: "bg-yellow-50 text-yellow-700 border-yellow-300",
  progress_rings: "bg-primary/10 text-primary border-primary/20",
};

export default function XPHistoryPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"history" | "breakdown" | "guide">("history");
  const [scoreData, setScoreData] = useState<any>(null);
  const [history, setHistory] = useState<XPEvent[]>([]);
  const [breakdown, setBreakdown] = useState<Breakdown[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 20;

  const load = async (p = 1) => {
    try {
      const res = await api.get(`/xp/history?page=${p}&limit=${LIMIT}`);
      const d = res.data.data;
      setScoreData(d.score);
      setHistory(d.history);
      setBreakdown(d.breakdown);
      setTotal(d.total);
      setPage(p);
    } catch {
      toast.error("Failed to load XP history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const currentLevel =
    LEVEL_INFO.find((l) => l.level === scoreData?.level) || LEVEL_INFO[0];
  const nextLevel = LEVEL_INFO.find(
    (l) => l.level === (scoreData?.level || 1) + 1,
  );
  const xpToNext = nextLevel ? nextLevel.min - (scoreData?.totalXP || 0) : 0;
  const pct = nextLevel
    ? Math.min(
        100,
        Math.round(
          ((scoreData?.totalXP - currentLevel.min) /
            (nextLevel.min - currentLevel.min)) *
            100,
        ),
      )
    : 100;

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="text-foreground-muted hover:text-foreground p-2 hover:bg-muted rounded-xl transition-all"
          >
            <FaArrowLeft />
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              XP & Score Details ⭐
            </h1>
            <p className="text-foreground-muted mt-1">
              Every point you earned tells a story of your growth
            </p>
          </div>
        </div>

        {/* Score Overview Card */}
        {scoreData && (
          <div className={`rounded-2xl border-2 p-6 ${currentLevel.bg}`}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide opacity-70 mb-1">
                  Your Level
                </p>
                <p className={`text-3xl font-black ${currentLevel.color}`}>
                  {scoreData.levelName}
                </p>
                <p className="text-sm opacity-70 mt-1">{currentLevel.tip}</p>
              </div>
              <div className="text-center">
                <p className="text-xs opacity-70">Total XP</p>
                <p className={`text-4xl font-black ${currentLevel.color}`}>
                  {scoreData.totalXP.toLocaleString()}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs opacity-70">Streak</p>
                <p className="text-3xl font-black text-destructive">
                  {scoreData.streak} 🔥
                </p>
                <p className="text-xs opacity-70">
                  Best: {scoreData.bestStreak}
                </p>
              </div>
              <div className="min-w-[160px]">
                <div className="flex justify-between text-xs opacity-70 mb-1">
                  <span>{currentLevel.name}</span>
                  {nextLevel && <span>{nextLevel.name}</span>}
                </div>
                <div className="w-full bg-white/40 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-700 ${currentLevel.color.replace("text-", "bg-")}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-xs opacity-70 mt-1">
                  {nextLevel
                    ? `${xpToNext.toLocaleString()} XP to ${nextLevel.name}`
                    : "👑 Maximum level reached!"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 flex-wrap">
          {[
            { key: "history", label: "📋 History", icon: FaHistory },
            { key: "breakdown", label: "📊 Breakdown", icon: FaChartBar },
            { key: "guide", label: "ℹ️ How XP Works", icon: FaInfoCircle },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as any)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                tab === t.key
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-muted text-foreground-muted hover:bg-accent"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* ── HISTORY TAB ──────────────────────────────────────────────── */}
            {tab === "history" && (
              <div className="space-y-3">
                {history.length === 0 ? (
                  <div className="text-center py-12 text-foreground-muted">
                    <FaHistory className="text-4xl mx-auto mb-3 opacity-20" />
                    <p className="font-medium">No XP earned yet</p>
                    <p className="text-sm mt-1">
                      Complete goals, habits, and activities to earn XP!
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-foreground-muted">
                      {total} total XP events
                    </p>
                    {history.map((h, i) => {
                      const colorCls =
                        TYPE_COLOR[h.type] ||
                        "bg-muted text-foreground-muted border-border";
                      const guide = XP_GUIDE.find((g) =>
                        g.action
                          .toLowerCase()
                          .includes(h.type.replace(/_/g, " ")),
                      );
                      return (
                        <div
                          key={i}
                          className={`flex items-center gap-4 p-4 rounded-xl border transition-all hover:shadow-sm ${colorCls}`}
                        >
                          <div className="text-2xl shrink-0">
                            {guide?.icon || "⚡"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm line-clamp-1">
                              {h.description}
                            </p>
                            <p className="text-xs opacity-70 mt-0.5">
                              {h.type.replace(/_/g, " ")} ·{" "}
                              {new Date(h.createdAt).toLocaleDateString(
                                "en-IN",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )}
                            </p>
                          </div>
                          <div className="shrink-0 text-right">
                            <span className="text-lg font-black">
                              +{h.points}
                            </span>
                            <p className="text-xs opacity-70">XP</p>
                          </div>
                        </div>
                      );
                    })}

                    {/* Pagination */}
                    <div className="flex items-center justify-between pt-2">
                      <button
                        onClick={() => load(page - 1)}
                        disabled={page <= 1}
                        className="btn-secondary text-sm disabled:opacity-40"
                      >
                        ← Previous
                      </button>
                      <p className="text-sm text-foreground-muted">
                        Page {page} of {Math.ceil(total / LIMIT)}
                      </p>
                      <button
                        onClick={() => load(page + 1)}
                        disabled={page >= Math.ceil(total / LIMIT)}
                        className="btn-secondary text-sm disabled:opacity-40"
                      >
                        Next →
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── BREAKDOWN TAB ────────────────────────────────────────────── */}
            {tab === "breakdown" && (
              <div className="space-y-4">
                <p className="text-sm text-foreground-muted">
                  Where your XP comes from — sorted by total earned
                </p>
                {breakdown.length === 0 ? (
                  <div className="text-center py-12 text-foreground-muted">
                    <FaChartBar className="text-4xl mx-auto mb-3 opacity-20" />
                    <p className="font-medium">No data yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {breakdown.map((b, i) => {
                      const colorCls =
                        TYPE_COLOR[b.type] ||
                        "bg-muted text-foreground-muted border-border";
                      const maxTotal = breakdown[0].total;
                      const barPct = Math.round((b.total / maxTotal) * 100);
                      return (
                        <div
                          key={i}
                          className={`p-4 rounded-xl border ${colorCls}`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{b.icon}</span>
                              <div>
                                <p className="font-semibold text-sm">
                                  {b.label}
                                </p>
                                <p className="text-xs opacity-70">
                                  {b.count} times completed
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-black text-lg">+{b.total}</p>
                              <p className="text-xs opacity-70">total XP</p>
                            </div>
                          </div>
                          <div className="w-full bg-white/40 rounded-full h-2">
                            <div
                              className="h-2 rounded-full transition-all duration-700 bg-current opacity-60"
                              style={{ width: `${barPct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── GUIDE TAB ────────────────────────────────────────────────── */}
            {tab === "guide" && (
              <div className="space-y-4">
                <div className="card-elevated bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/10">
                  <h3 className="font-bold mb-2 flex items-center gap-2">
                    <FaInfoCircle className="text-primary" /> How the XP System
                    Works
                  </h3>
                  <p className="text-sm text-foreground-muted leading-relaxed">
                    Every action you take on DoR-DoD earns you XP (Experience
                    Points). XP builds your level, which shows on the
                    leaderboard. Consistent daily actions — especially habits —
                    give the most XP over time through streak bonuses. The more
                    you show up, the higher you climb.
                  </p>
                </div>

                {/* XP earning guide */}
                <h3 className="font-bold">💰 How to Earn XP</h3>
                <div className="grid md:grid-cols-2 gap-3">
                  {XP_GUIDE.map((g, i) => (
                    <div
                      key={i}
                      className="card-elevated hover:shadow-md transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl shrink-0">{g.icon}</span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-sm">{g.action}</p>
                            <span className={`text-sm font-black ${g.color}`}>
                              {g.xp}
                            </span>
                          </div>
                          <p className="text-xs text-foreground-muted mt-0.5">
                            {g.desc}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Level thresholds */}
                <h3 className="font-bold mt-2">🏅 Level Thresholds</h3>
                <div className="space-y-2">
                  {LEVEL_INFO.map((l, i) => {
                    const isCurrentLevel = scoreData?.level === l.level;
                    return (
                      <div
                        key={i}
                        className={`p-4 rounded-xl border-2 transition-all ${l.bg} ${isCurrentLevel ? "shadow-md scale-[1.02]" : ""}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className={`text-xl font-black ${l.color}`}>
                              {l.name}
                            </span>
                            {isCurrentLevel && (
                              <span className="text-xs bg-primary text-white px-2 py-0.5 rounded-full font-bold">
                                YOU ARE HERE
                              </span>
                            )}
                          </div>
                          <div className="text-right">
                            <p className={`font-bold ${l.color}`}>
                              {l.min.toLocaleString()} –{" "}
                              {l.max === 99999 ? "∞" : l.max.toLocaleString()}{" "}
                              XP
                            </p>
                            <p className="text-xs opacity-70">{l.tip}</p>
                          </div>
                        </div>
                        {isCurrentLevel && nextLevel && (
                          <div className="mt-2">
                            <div className="w-full bg-white/40 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${l.color.replace("text-", "bg-")}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <p className="text-xs opacity-70 mt-1">
                              {xpToNext.toLocaleString()} more XP to reach{" "}
                              {nextLevel.name}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Tips */}
                <div className="card-elevated border-l-4 border-l-success">
                  <h3 className="font-bold mb-3 text-success">
                    💡 Pro Tips to Earn More XP
                  </h3>
                  <ul className="space-y-2 text-sm text-foreground-muted">
                    {[
                      "🔥 Build a daily habit — 21-day streak gives 200 bonus XP on top of daily XP",
                      "🎯 Focus on completing goals, not just starting them — +50 XP on completion",
                      "📚 Enroll in courses and push to 100% — biggest single XP reward at +100",
                      "😊 Log your Frame of Mind daily — easy +5 XP every day",
                      "🌅 Never skip 2 days in a row — you get a comeback bonus (+30 XP) if you return",
                      "💍 Try to fill all 3 progress rings in one day for a +50 XP bonus",
                      "🏆 Create achievements for things you've accomplished — +30 XP each",
                    ].map((tip, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="shrink-0 mt-0.5">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
