import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { api } from "@/utils/api";
import toast from "react-hot-toast";
import {
  FaTrophy,
  FaFire,
  FaSearch,
  FaUserPlus,
  FaCheck,
  FaTimes,
  FaBell,
  FaLink,
  FaCopy,
  FaHistory,
} from "react-icons/fa";
import { useAuth } from "@/contexts/AuthContext";

interface LeaderEntry {
  _id: string;
  user: { _id: string; name: string; avatar?: string; email: string };
  totalXP: number;
  periodXP: number;
  level: number;
  levelName: string;
  streak: number;
}
interface FriendReq {
  _id: string;
  requester: { _id: string; name: string; email: string; avatar?: string };
}
interface SearchUser {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  friendStatus: "none" | "sent" | "received" | "friends";
}

const RANK_COLORS = [
  "bg-yellow-400 text-yellow-900",
  "bg-gray-300 text-gray-700",
  "bg-orange-400 text-orange-900",
];
const LEVEL_COLORS: Record<number, string> = {
  1: "text-orange-500",
  2: "text-gray-500",
  3: "text-yellow-500",
  4: "text-blue-400",
  5: "text-purple-500",
};

const PERIOD_LABELS: Record<string, string> = {
  week: "This Week",
  month: "This Month",
  year: "This Year",
  all: "All Time",
};

export default function LeaderboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState<"friends" | "global">("friends");
  const [period, setPeriod] = useState("all");
  const [global, setGlobal] = useState<LeaderEntry[]>([]);
  const [friends, setFriends] = useState<LeaderEntry[]>([]);
  const [requests, setRequests] = useState<FriendReq[]>([]);
  const [myScore, setMyScore] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchRes, setSearchRes] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [copied, setCopied] = useState(false);

  const loadLeaderboard = async (p = period) => {
    setLoading(true);
    try {
      const [lbRes, myRes, reqRes] = await Promise.all([
        api.get(`/xp/leaderboard?period=${p}`),
        api.get("/xp/me"),
        api.get("/friends/requests"),
      ]);
      setGlobal(lbRes.data.data.global || []);
      setFriends(lbRes.data.data.friends || []);
      setMyScore(myRes.data.data);
      setRequests(reqRes.data.data || []);
    } catch {
      toast.error("Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaderboard("all");
  }, []);

  const changePeriod = (p: string) => {
    setPeriod(p);
    loadLeaderboard(p);
  };

  useEffect(() => {
    if (!search.trim() || search.length < 2) {
      setSearchRes([]);
      return;
    }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const r = await api.get(
          `/friends/search?q=${encodeURIComponent(search)}`,
        );
        setSearchRes(r.data.data || []);
      } catch {
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const getInviteLink = async () => {
    try {
      const r = await api.get("/friends/invite-link");
      setInviteLink(r.data.data.link);
    } catch {
      toast.error("Failed to generate link");
    }
  };
  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink).then(() => {
      setCopied(true);
      toast.success("Invite link copied! 🎉");
      setTimeout(() => setCopied(false), 3000);
    });
  };
  const sendRequest = async (id: string) => {
    try {
      await api.post("/friends/request", { recipientId: id });
      setSearchRes((p) =>
        p.map((u) => (u._id === id ? { ...u, friendStatus: "sent" } : u)),
      );
      toast.success("Friend request sent! 🤝");
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed");
    }
  };
  const accept = async (reqId: string, name: string) => {
    try {
      const r = await api.patch(`/friends/${reqId}/accept`);
      setRequests((p) => p.filter((x) => x._id !== reqId));
      toast.success(r.data.message || `You and ${name} are now friends! 🎉`);
      loadLeaderboard(period);
    } catch {
      toast.error("Failed");
    }
  };
  const reject = async (reqId: string) => {
    try {
      await api.delete(`/friends/${reqId}`);
      setRequests((p) => p.filter((x) => x._id !== reqId));
    } catch {}
  };

  const myId = (user as any)?.id || "";
  const list = tab === "global" ? global : friends;
  const myEntry = list.find((e) => e.user?._id === myId);
  const myRank = list.findIndex((e) => e.user?._id === myId) + 1;

  const xpKey = period === "all" ? "totalXP" : "periodXP";

  const prog = (() => {
    if (!myScore) return { pct: 0, xpToNext: 0 };
    const T = [0, 500, 1500, 3500, 7500, 99999];
    const next = T[myScore.level] || 99999;
    const prev = T[myScore.level - 1] || 0;
    const pct = Math.min(
      100,
      Math.round(((myScore.totalXP - prev) / (next - prev)) * 100),
    );
    return { pct, xpToNext: next - myScore.totalXP };
  })();

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              Leaderboard 🏆
            </h1>
            <p className="text-foreground-muted mt-1">
              Compete, grow, and celebrate with your circle
            </p>
          </div>
          <button
            onClick={() => navigate("/xp-history")}
            className="btn-secondary text-sm flex items-center gap-2 self-start sm:self-auto"
          >
            <FaHistory /> My XP History
          </button>
        </div>

        {/* My Score Banner */}
        {myScore && (
          <div className="card-elevated bg-gradient-to-r from-primary/10 via-background to-secondary/10 border-primary/20">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs text-foreground-muted uppercase tracking-wide">
                  Your Level
                </p>
                <p
                  className={`text-2xl font-black ${LEVEL_COLORS[myScore.level] || "text-foreground"}`}
                >
                  {myScore.levelName}
                </p>
                <p className="text-sm text-foreground-muted">
                  {myScore.totalXP.toLocaleString()} XP total
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-foreground-muted">Streak</p>
                <p className="text-3xl font-black text-destructive">
                  {myScore.streak} 🔥
                </p>
                <p className="text-xs text-foreground-muted">
                  Best: {myScore.bestStreak}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-foreground-muted">Your Rank</p>
                <p className="text-3xl font-black text-secondary">
                  {myRank > 0 ? `#${myRank}` : "—"}
                </p>
                <p className="text-xs text-foreground-muted capitalize">
                  {tab}
                </p>
              </div>
              <div className="min-w-[150px]">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-foreground-muted">Next level</span>
                  <span className="font-medium">{prog.pct}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-primary to-secondary h-3 rounded-full transition-all duration-700"
                    style={{ width: `${prog.pct}%` }}
                  />
                </div>
                <p className="text-xs text-foreground-muted mt-1">
                  {prog.xpToNext > 0
                    ? `${prog.xpToNext.toLocaleString()} XP to go`
                    : "👑 Max level!"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Friend Requests */}
        {requests.length > 0 && (
          <div className="card-elevated border-l-4 border-l-primary">
            <h3 className="font-semibold flex items-center gap-2 mb-3">
              <FaBell className="text-primary" /> Friend Requests
              <span className="bg-primary text-white text-xs px-2 py-0.5 rounded-full">
                {requests.length}
              </span>
            </h3>
            <div className="space-y-2">
              {requests.map((r) => (
                <div
                  key={r._id}
                  className="flex items-center justify-between gap-3 p-3 bg-muted rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    {r.requester.avatar ? (
                      <img
                        src={r.requester.avatar}
                        className="w-9 h-9 rounded-full object-cover"
                        alt=""
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full gradient-hero flex items-center justify-center text-white font-bold text-sm">
                        {r.requester.name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold">
                        {r.requester.name}
                      </p>
                      <p className="text-xs text-foreground-muted">
                        {r.requester.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => accept(r._id, r.requester.name)}
                      className="text-xs bg-success/10 text-success hover:bg-success hover:text-white border border-success/30 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 font-medium"
                    >
                      <FaCheck className="w-2.5 h-2.5" /> Accept
                    </button>
                    <button
                      onClick={() => reject(r._id)}
                      className="text-xs bg-muted hover:bg-destructive/10 hover:text-destructive border border-border px-2.5 py-1.5 rounded-lg transition-all"
                    >
                      <FaTimes className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Find Friends */}
        <div className="card-elevated">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <FaUserPlus className="text-secondary" /> Find & Add Friends
          </h3>
          <div className="relative mb-3">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground-muted w-3.5 h-3.5" />
            <input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-11"
            />
          </div>
          {searching && (
            <p className="text-xs text-foreground-muted mb-2">Searching...</p>
          )}
          {searchRes.length > 0 && (
            <div className="space-y-2 mb-4">
              {searchRes.map((u) => (
                <div
                  key={u._id}
                  className="flex items-center justify-between p-3 bg-muted rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    {u.avatar ? (
                      <img
                        src={u.avatar}
                        className="w-8 h-8 rounded-full object-cover"
                        alt=""
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full gradient-hero flex items-center justify-center text-white font-bold text-sm">
                        {u.name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium">{u.name}</p>
                      <p className="text-xs text-foreground-muted">{u.email}</p>
                    </div>
                  </div>
                  <button
                    disabled={u.friendStatus !== "none"}
                    onClick={() => sendRequest(u._id)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                      u.friendStatus === "friends"
                        ? "bg-success/10 text-success"
                        : u.friendStatus === "sent"
                          ? "bg-muted text-foreground-muted cursor-default"
                          : "bg-primary text-primary-foreground hover:opacity-90"
                    }`}
                  >
                    {u.friendStatus === "friends"
                      ? "✓ Friends"
                      : u.friendStatus === "sent"
                        ? "✓ Sent"
                        : "+ Add"}
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="border-t border-border pt-3">
            <p className="text-xs text-foreground-muted mb-2">
              Or share your invite link:
            </p>
            {!inviteLink ? (
              <button
                onClick={getInviteLink}
                className="text-sm flex items-center gap-2 text-primary hover:underline"
              >
                <FaLink className="w-3 h-3" /> Generate invite link
              </button>
            ) : (
              <div className="flex gap-2">
                <input
                  readOnly
                  value={inviteLink}
                  className="input-field text-xs flex-1"
                />
                <button
                  onClick={copyLink}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 shrink-0 ${copied ? "bg-success text-white" : "btn-secondary"}`}
                >
                  {copied ? (
                    <FaCheck className="w-3 h-3" />
                  ) : (
                    <FaCopy className="w-3 h-3" />
                  )}
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Period selector + Tab switcher */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex gap-2">
            {(["friends", "global"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === t ? "bg-primary text-primary-foreground shadow-md" : "bg-muted text-foreground-muted hover:bg-accent"}`}
              >
                {t === "friends" ? "👥 Friend Circle" : "🌍 Global Top 20"}
              </button>
            ))}
          </div>
          <div className="flex gap-2 flex-wrap">
            {Object.entries(PERIOD_LABELS).map(([key, label]) => (
              <button
                key={key}
                onClick={() => changePeriod(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${period === key ? "bg-secondary text-secondary-foreground" : "bg-muted text-foreground-muted hover:bg-accent"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Period banner */}
        {period !== "all" && (
          <div className="flex items-center gap-2 p-3 bg-secondary/10 border border-secondary/20 rounded-xl text-secondary text-sm font-medium">
            📅 Showing XP earned: <strong>{PERIOD_LABELS[period]}</strong>
          </div>
        )}

        {/* Leaderboard */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : list.length === 0 ? (
          <div className="text-center py-12 text-foreground-muted">
            <FaTrophy className="text-5xl mx-auto mb-3 opacity-20" />
            <p className="font-medium text-lg">
              {tab === "friends" ? "Add friends to compete!" : "No entries yet"}
            </p>
            <p className="text-sm mt-1">
              {tab === "friends"
                ? "Search above or share your invite link"
                : "Complete goals and habits to earn XP"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {list.map((entry, i) => {
              const isMe = entry.user?._id === myId;
              const xp = (entry as any)[xpKey] ?? entry.totalXP;
              return (
                <div
                  key={entry._id || i}
                  className={`card-elevated flex items-center gap-4 transition-all ${isMe ? "border-2 border-primary bg-primary/5 shadow-md" : ""} ${i === 0 ? "border-yellow-400/50" : ""}`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm shrink-0 ${RANK_COLORS[i] || "bg-muted text-foreground-muted"}`}
                  >
                    {i === 0
                      ? "🥇"
                      : i === 1
                        ? "🥈"
                        : i === 2
                          ? "🥉"
                          : `#${i + 1}`}
                  </div>
                  {entry.user?.avatar ? (
                    <img
                      src={entry.user.avatar}
                      className="w-10 h-10 rounded-full object-cover shrink-0"
                      alt=""
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full gradient-hero flex items-center justify-center text-white font-bold shrink-0">
                      {entry.user?.name?.charAt(0).toUpperCase() || "?"}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm truncate">
                        {entry.user?.name || "Unknown"}
                      </p>
                      {isMe && (
                        <span className="text-xs text-primary font-bold">
                          (You)
                        </span>
                      )}
                      <span
                        className={`text-xs font-medium shrink-0 ${LEVEL_COLORS[entry.level] || ""}`}
                      >
                        {entry.levelName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-destructive font-medium">
                        <FaFire className="inline mr-0.5" /> {entry.streak} day
                        streak
                      </span>
                      {period !== "all" && (
                        <span className="text-xs text-foreground-muted">
                          All time: {entry.totalXP.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-black text-xl text-primary">
                      {xp.toLocaleString()}
                    </p>
                    <p className="text-xs text-foreground-muted">
                      {period === "all"
                        ? "Total XP"
                        : `${PERIOD_LABELS[period]} XP`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Level guide */}
        <div className="card-elevated">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            🏅 Level Guide
            <button
              onClick={() => navigate("/xp-history")}
              className="text-xs text-primary hover:underline ml-auto font-normal"
            >
              See how to earn XP →
            </button>
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {[
              {
                name: "🥉 Bronze",
                xp: "0 – 499",
                color: "text-orange-500",
                bg: "bg-orange-50",
              },
              {
                name: "🥈 Silver",
                xp: "500 – 1,499",
                color: "text-gray-500",
                bg: "bg-gray-50",
              },
              {
                name: "🥇 Gold",
                xp: "1,500 – 3,499",
                color: "text-yellow-500",
                bg: "bg-yellow-50",
              },
              {
                name: "💎 Platinum",
                xp: "3,500 – 7,499",
                color: "text-blue-400",
                bg: "bg-blue-50",
              },
              {
                name: "👑 Diamond",
                xp: "7,500+",
                color: "text-purple-500",
                bg: "bg-purple-50",
              },
            ].map((l, i) => (
              <div key={i} className={`${l.bg} rounded-xl p-3 text-center`}>
                <p className={`font-bold text-sm ${l.color}`}>{l.name}</p>
                <p className="text-xs text-foreground-muted mt-0.5">
                  {l.xp} XP
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
