import { useState, useEffect } from "react";
import { api } from "../utils/api";
import toast from "react-hot-toast";
import DashboardLayout from "../components/layout/DashboardLayout";
import {
  FaTrophy,
  FaMedal,
  FaFire,
  FaStar,
  FaCrown,
  FaArrowUp,
  FaArrowDown,
  FaSync,
} from "react-icons/fa";

interface LeaderEntry {
  rank: number;
  userId: string;
  name: string;
  avatar?: string;
  level: number;
  totalPoints: number;
  weeklyPoints: number;
  totalGained: number;
  totalLost: number;
  isCurrentUser: boolean;
}

function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) return <FaCrown className="text-yellow-400 text-xl" />;
  if (rank === 2) return <FaMedal className="text-slate-400 text-xl" />;
  if (rank === 3) return <FaMedal className="text-amber-600 text-xl" />;
  return (
    <span className="text-sm font-bold text-gray-400 w-6 text-center">
      #{rank}
    </span>
  );
}

function Avatar({
  name,
  avatar,
  size = "md",
}: {
  name: string;
  avatar?: string;
  size?: "sm" | "md" | "lg";
}) {
  const sz = {
    sm: "w-9 h-9 text-xs",
    md: "w-11 h-11 text-sm",
    lg: "w-16 h-16 text-xl",
  }[size];
  const initials =
    name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?";
  if (avatar)
    return (
      <img
        src={avatar}
        alt={name}
        className={`${sz} rounded-full object-cover flex-shrink-0`}
      />
    );
  return (
    <div
      className={`${sz} rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold flex-shrink-0`}
    >
      {initials}
    </div>
  );
}

function LeaderboardContent() {
  const [leaderboard, setLeaderboard] = useState<LeaderEntry[]>([]);
  const [myRank, setMyRank] = useState<LeaderEntry | null>(null);
  const [tab, setTab] = useState<"all" | "weekly">("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await api.get("/routines/leaderboard");
      setLeaderboard(res.data.leaderboard);
      setMyRank(res.data.myRank);
    } catch {
      toast.error("Failed to load leaderboard.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const sorted = [...leaderboard]
    .sort((a, b) =>
      tab === "weekly"
        ? b.weeklyPoints - a.weeklyPoints
        : b.totalPoints - a.totalPoints,
    )
    .map((e, i) => ({ ...e, rank: i + 1 }));

  const pts = (e: LeaderEntry) =>
    tab === "weekly" ? e.weeklyPoints : e.totalPoints;

  const top3 = sorted.slice(0, 3);
  const rest = sorted.slice(3);

  const me = sorted.find((e) => e.isCurrentUser) || myRank;

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Leaderboard
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Ranked by habit points across all users
          </p>
        </div>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          className="p-2.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-indigo-600 hover:border-indigo-300 transition-colors"
        >
          <FaSync className={`text-sm ${refreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* My stats banner (if we have data) */}
      {me && (
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-4 text-white">
          <div className="flex items-center gap-3">
            <Avatar name={me.name} avatar={me.avatar} size="md" />
            <div className="flex-1">
              <p className="font-bold">
                {me.name} <span className="text-indigo-200 text-sm">(you)</span>
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <FaStar className="text-yellow-300 text-xs" />
                <span className="text-xs text-indigo-200">
                  Level {me.level}
                </span>
                <span className="text-indigo-300 mx-1">·</span>
                <span className="text-xs text-indigo-200">Rank #{me.rank}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{pts(me)}</div>
              <div className="text-xs text-indigo-200">
                {tab === "weekly" ? "this week" : "all time"}
              </div>
            </div>
          </div>
          {/* My gains / losses */}
          <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-white/20">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
                <FaArrowUp className="text-green-300 text-xs" />
              </div>
              <div>
                <div className="text-sm font-bold">+{me.totalGained}</div>
                <div className="text-xs text-indigo-200">Total earned</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
                <FaArrowDown className="text-red-300 text-xs" />
              </div>
              <div>
                <div className="text-sm font-bold">-{me.totalLost}</div>
                <div className="text-xs text-indigo-200">Penalties paid</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab switcher */}
      <div className="flex bg-gray-100 dark:bg-gray-800 rounded-2xl p-1">
        {(["all", "weekly"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === t ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700"}`}
          >
            {t === "all" ? "All Time" : "This Week"}
          </button>
        ))}
      </div>

      {/* Podium top 3 */}
      {top3.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
          <div className="flex items-end justify-center gap-4">
            {/* 2nd */}
            {top3[1] && (
              <div
                className={`flex flex-col items-center gap-2 flex-1 pb-2 ${top3[1].isCurrentUser ? "ring-2 ring-indigo-500 rounded-2xl p-2" : ""}`}
              >
                <Avatar name={top3[1].name} avatar={top3[1].avatar} size="md" />
                <div className="text-center">
                  <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate max-w-[72px]">
                    {top3[1].name.split(" ")[0]}
                  </div>
                  <div className="text-sm font-bold text-slate-500">
                    {pts(top3[1])} pts
                  </div>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-t-xl h-14 flex items-center justify-center">
                  <FaMedal className="text-slate-400 text-2xl" />
                </div>
              </div>
            )}
            {/* 1st */}
            {top3[0] && (
              <div
                className={`flex flex-col items-center gap-2 flex-1 ${top3[0].isCurrentUser ? "ring-2 ring-indigo-500 rounded-2xl p-2" : ""}`}
              >
                <FaCrown className="text-yellow-400 text-xl" />
                <Avatar name={top3[0].name} avatar={top3[0].avatar} size="lg" />
                <div className="text-center">
                  <div className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-[80px]">
                    {top3[0].name.split(" ")[0]}
                  </div>
                  <div className="font-bold text-amber-500">
                    {pts(top3[0])} pts
                  </div>
                </div>
                <div className="w-full bg-gradient-to-t from-amber-400 to-yellow-300 rounded-t-xl h-24 flex items-center justify-center shadow-sm shadow-amber-200">
                  <FaTrophy className="text-white text-3xl drop-shadow" />
                </div>
              </div>
            )}
            {/* 3rd */}
            {top3[2] && (
              <div
                className={`flex flex-col items-center gap-2 flex-1 pb-2 ${top3[2].isCurrentUser ? "ring-2 ring-indigo-500 rounded-2xl p-2" : ""}`}
              >
                <Avatar name={top3[2].name} avatar={top3[2].avatar} size="md" />
                <div className="text-center">
                  <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate max-w-[72px]">
                    {top3[2].name.split(" ")[0]}
                  </div>
                  <div className="text-sm font-bold text-amber-600">
                    {pts(top3[2])} pts
                  </div>
                </div>
                <div className="w-full bg-amber-100 dark:bg-amber-900/30 rounded-t-xl h-8 flex items-center justify-center">
                  <FaMedal className="text-amber-600 text-xl" />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Remaining list */}
      {rest.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50 dark:border-gray-800 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Rankings
            </span>
            <span className="text-xs text-gray-400">{sorted.length} users</span>
          </div>
          {rest.map((entry, idx) => (
            <div
              key={entry.userId}
              className={`flex items-center gap-3 px-4 py-3.5 transition-colors ${entry.isCurrentUser ? "bg-indigo-50 dark:bg-indigo-950/30" : idx % 2 === 0 ? "" : "bg-gray-50/50 dark:bg-gray-800/20"} ${idx < rest.length - 1 ? "border-b border-gray-50 dark:border-gray-800/50" : ""}`}
            >
              <div className="w-7 flex items-center justify-center flex-shrink-0">
                <RankIcon rank={entry.rank} />
              </div>
              <Avatar name={entry.name} avatar={entry.avatar} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-sm font-semibold truncate ${entry.isCurrentUser ? "text-indigo-700 dark:text-indigo-300" : "text-gray-900 dark:text-white"}`}
                  >
                    {entry.name}
                    {entry.isCurrentUser && (
                      <span className="ml-1 text-xs text-indigo-400">
                        (you)
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="flex items-center gap-1">
                    <FaArrowUp className="text-green-400 text-xs" />
                    <span className="text-xs text-gray-400">
                      +{entry.totalGained}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FaArrowDown className="text-red-400 text-xs" />
                    <span className="text-xs text-gray-400">
                      -{entry.totalLost}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FaStar className="text-amber-400 text-xs" />
                    <span className="text-xs text-gray-400">
                      Lv.{entry.level}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div
                  className={`text-sm font-bold ${entry.isCurrentUser ? "text-indigo-600" : "text-gray-900 dark:text-white"}`}
                >
                  {pts(entry)}
                </div>
                <div className="text-xs text-gray-400">pts</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {sorted.length === 0 && (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🏆</div>
          <p className="text-gray-500 dark:text-gray-400 font-medium">
            No rankings yet
          </p>
          <p className="text-sm text-gray-400 mt-1">
            Complete habits to appear on the leaderboard!
          </p>
        </div>
      )}

      {/* My rank if outside top list */}
      {myRank && !leaderboard.find((e) => e.isCurrentUser) && (
        <div className="bg-indigo-50 dark:bg-indigo-950/30 rounded-2xl border border-indigo-200 dark:border-indigo-900 p-4">
          <p className="text-xs font-semibold text-indigo-500 mb-2 uppercase tracking-wide text-center">
            Your Position
          </p>
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-indigo-700 dark:text-indigo-300">
              #{myRank.rank}
            </span>
            <Avatar name={myRank.name} avatar={myRank.avatar} size="sm" />
            <div className="flex-1">
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {myRank.name}
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <FaArrowUp className="text-green-400 text-xs" />+
                  {myRank.totalGained}
                </span>
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <FaArrowDown className="text-red-400 text-xs" />-
                  {myRank.totalLost}
                </span>
              </div>
            </div>
            <span className="text-sm font-bold text-indigo-600">
              {pts(myRank)} pts
            </span>
          </div>
        </div>
      )}

      {/* Motivational footer */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-4 text-center text-white">
        <FaFire className="mx-auto text-2xl text-orange-300 mb-2" />
        <p className="text-sm font-semibold">Build streaks, climb the ranks!</p>
        <p className="text-xs text-indigo-200 mt-1">
          +5 per habit · +10 daily · +25 perfect week · −3 penalty
        </p>
      </div>
    </div>
  );
}

export default function LeaderboardPage() {
  return (
    <DashboardLayout>
      <LeaderboardContent />
    </DashboardLayout>
  );
}
