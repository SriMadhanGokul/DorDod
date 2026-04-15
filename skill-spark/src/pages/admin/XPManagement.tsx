import { useState, useEffect } from "react";
import { api } from "@/utils/api";
import toast from "react-hot-toast";
import {
  FaTrophy,
  FaMedal,
  FaFire,
  FaUsers,
  FaStar,
  FaChartBar,
} from "react-icons/fa";

interface TopScorer {
  _id: string;
  user: { _id: string; name: string; email: string; avatar?: string };
  totalXP: number;
  level: number;
  levelName: string;
  streak: number;
  bestStreak: number;
  history: { type: string; points: number }[];
}

const LEVEL_COLORS: Record<number, string> = {
  1: "text-orange-500 bg-orange-50",
  2: "text-gray-500 bg-gray-50",
  3: "text-yellow-600 bg-yellow-50",
  4: "text-blue-500 bg-blue-50",
  5: "text-purple-600 bg-purple-50",
};
const RANK_BG = [
  "bg-yellow-400 text-yellow-900",
  "bg-gray-300 text-gray-700",
  "bg-orange-400 text-orange-900",
];

export default function XPManagement() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api
      .get("/admin/xp-overview")
      .then((r) => setData(r.data.data))
      .catch(() => toast.error("Failed to load XP data"))
      .finally(() => setLoading(false));
  }, []);

  const filtered =
    data?.topScorers?.filter(
      (s: TopScorer) =>
        !search ||
        s.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
        s.user?.email?.toLowerCase().includes(search.toLowerCase()),
    ) || [];

  if (loading)
    return (
      <div className="flex justify-center py-24">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );

  const levelDist = [1, 2, 3, 4, 5].map((level) => ({
    level,
    count:
      data?.topScorers?.filter((s: TopScorer) => s.level === level).length || 0,
  }));

  const levelNames: Record<number, string> = {
    1: "🥉 Bronze",
    2: "🥈 Silver",
    3: "🥇 Gold",
    4: "💎 Platinum",
    5: "👑 Diamond",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FaTrophy className="text-yellow-500" /> XP & Gamification Overview
        </h1>
        <p className="text-foreground-muted mt-1">
          Track user engagement and XP performance across the platform
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            icon: FaUsers,
            val: data?.total || 0,
            label: "Users with XP",
            color: "text-primary bg-primary/10",
          },
          {
            icon: FaStar,
            val: (data?.totalXP || 0).toLocaleString(),
            label: "Total XP Earned",
            color: "text-yellow-500 bg-yellow-50",
          },
          {
            icon: FaChartBar,
            val: (data?.avgXP || 0).toLocaleString(),
            label: "Avg XP per User",
            color: "text-secondary bg-secondary/10",
          },
          {
            icon: FaMedal,
            val:
              data?.topScorers?.filter((s: TopScorer) => s.level >= 4).length ||
              0,
            label: "Platinum+ Users",
            color: "text-blue-500 bg-blue-50",
          },
        ].map((s, i) => (
          <div key={i} className="card-elevated text-center">
            <div
              className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center mx-auto mb-2`}
            >
              <s.icon className="text-lg" />
            </div>
            <p className="text-2xl font-bold">{s.val}</p>
            <p className="text-xs text-foreground-muted">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Level distribution */}
      <div className="card-elevated">
        <h2 className="font-semibold mb-4">User Level Distribution</h2>
        <div className="space-y-3">
          {levelDist.map((l) => {
            const pct =
              data?.total > 0 ? Math.round((l.count / data.total) * 100) : 0;
            const cls = LEVEL_COLORS[l.level] || "text-foreground bg-muted";
            const [textCls, bgCls] = cls.split(" ");
            return (
              <div key={l.level} className="flex items-center gap-3">
                <span className={`text-sm font-bold w-28 shrink-0 ${textCls}`}>
                  {levelNames[l.level]}
                </span>
                <div className="flex-1 bg-muted rounded-full h-4">
                  <div
                    className={`h-4 rounded-full transition-all duration-700 ${bgCls} border ${textCls.replace("text-", "border-")}`}
                    style={{ width: `${Math.max(pct, 2)}%` }}
                  />
                </div>
                <span className="text-sm font-medium w-16 text-right">
                  {l.count} ({pct}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Scorers Table */}
      <div className="card-elevated">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Top Scorers</h2>
          <input
            placeholder="Search user..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field text-sm w-48"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-3 text-foreground-muted font-medium text-xs">
                  Rank
                </th>
                <th className="text-left py-2 px-3 text-foreground-muted font-medium text-xs">
                  User
                </th>
                <th className="text-left py-2 px-3 text-foreground-muted font-medium text-xs">
                  Level
                </th>
                <th className="text-right py-2 px-3 text-foreground-muted font-medium text-xs">
                  Total XP
                </th>
                <th className="text-right py-2 px-3 text-foreground-muted font-medium text-xs">
                  Streak
                </th>
                <th className="text-right py-2 px-3 text-foreground-muted font-medium text-xs">
                  Best Streak
                </th>
                <th className="text-right py-2 px-3 text-foreground-muted font-medium text-xs">
                  Events
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="text-center py-8 text-foreground-muted"
                  >
                    No users found
                  </td>
                </tr>
              ) : (
                filtered.map((s: TopScorer, i: number) => {
                  const cls =
                    LEVEL_COLORS[s.level] || "text-foreground bg-muted";
                  const [textCls, bgCls] = cls.split(" ");
                  return (
                    <tr
                      key={s._id}
                      className="hover:bg-muted/50 transition-colors"
                    >
                      <td className="py-3 px-3">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${RANK_BG[i] || "bg-muted text-foreground-muted"}`}
                        >
                          {i === 0
                            ? "🥇"
                            : i === 1
                              ? "🥈"
                              : i === 2
                                ? "🥉"
                                : `#${i + 1}`}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          {s.user?.avatar ? (
                            <img
                              src={s.user.avatar}
                              className="w-7 h-7 rounded-full object-cover"
                              alt=""
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full gradient-hero flex items-center justify-center text-white font-bold text-xs">
                              {s.user?.name?.charAt(0).toUpperCase() || "?"}
                            </div>
                          )}
                          <div>
                            <p className="font-medium">
                              {s.user?.name || "Unknown"}
                            </p>
                            <p className="text-xs text-foreground-muted">
                              {s.user?.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-medium ${bgCls} ${textCls}`}
                        >
                          {s.levelName}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-black text-primary">
                        {s.totalXP.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className="font-bold text-destructive">
                          {s.streak} 🔥
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right text-foreground-muted">
                        {s.bestStreak}
                      </td>
                      <td className="py-3 px-3 text-right text-foreground-muted">
                        {s.history?.length || 0}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* XP Earning Guide for Admin */}
      <div className="card-elevated">
        <h2 className="font-semibold mb-4">📋 XP System Configuration</h2>
        <p className="text-sm text-foreground-muted mb-4">
          Current XP values used by the platform:
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: "🎯", label: "Goal Complete", xp: 50 },
            { icon: "🔥", label: "Goal at 75%", xp: 15 },
            { icon: "✅", label: "Habit Day", xp: 10 },
            { icon: "⚡", label: "Activity Done", xp: 20 },
            { icon: "🎓", label: "Course Complete", xp: 100 },
            { icon: "📚", label: "Course at 50%", xp: 25 },
            { icon: "🏆", label: "Achievement", xp: 30 },
            { icon: "😊", label: "Mood Log", xp: 5 },
            { icon: "🧠", label: "Skill Learned", xp: 40 },
            { icon: "🌅", label: "Comeback Bonus", xp: 30 },
            { icon: "🔥🔥", label: "7-Day Streak", xp: 50 },
            { icon: "💥", label: "14-Day Streak", xp: 100 },
            { icon: "👑", label: "21-Day Streak", xp: 200 },
            { icon: "💍", label: "All 3 Rings", xp: 50 },
          ].map((item, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 bg-muted rounded-xl"
            >
              <div className="flex items-center gap-2">
                <span className="text-base">{item.icon}</span>
                <span className="text-xs font-medium">{item.label}</span>
              </div>
              <span className="text-xs font-black text-primary">
                +{item.xp}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
