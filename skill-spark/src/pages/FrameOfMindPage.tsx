import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { api } from "@/utils/api";
import toast from "react-hot-toast";

interface MoodEntry {
  _id: string;
  mood: string;
  emoji: string;
  note: string;
  date: string;
}

const MOODS = [
  {
    label: "Happy",
    emoji: "😊",
    color: "bg-yellow-100 border-yellow-300 text-yellow-700",
    score: 8,
  },
  {
    label: "Excited",
    emoji: "🤩",
    color: "bg-orange-100 border-orange-300 text-orange-700",
    score: 9,
  },
  {
    label: "Motivated",
    emoji: "💪",
    color: "bg-green-100 border-green-300 text-green-700",
    score: 9,
  },
  {
    label: "Neutral",
    emoji: "😐",
    color: "bg-gray-100 border-gray-300 text-gray-700",
    score: 5,
  },
  {
    label: "Tired",
    emoji: "😴",
    color: "bg-blue-100 border-blue-300 text-blue-700",
    score: 4,
  },
  {
    label: "Anxious",
    emoji: "😰",
    color: "bg-purple-100 border-purple-300 text-purple-700",
    score: 3,
  },
  {
    label: "Stressed",
    emoji: "😤",
    color: "bg-red-100 border-red-300 text-red-700",
    score: 2,
  },
  {
    label: "Sad",
    emoji: "😢",
    color: "bg-indigo-100 border-indigo-300 text-indigo-700",
    score: 2,
  },
];

// Mood score out of 10 — used for average calculation
const MOOD_SCORE: Record<string, number> = Object.fromEntries(
  MOODS.map((m) => [m.label, m.score]),
);

const getAverageLabel = (avg: number) => {
  if (avg >= 8.5)
    return {
      label: "Excellent 🌟",
      color: "text-green-600",
      bg: "bg-green-50 border-green-200",
    };
  if (avg >= 7)
    return {
      label: "Good 😊",
      color: "text-blue-600",
      bg: "bg-blue-50 border-blue-200",
    };
  if (avg >= 5.5)
    return {
      label: "Okay 😐",
      color: "text-yellow-600",
      bg: "bg-yellow-50 border-yellow-200",
    };
  if (avg >= 4)
    return {
      label: "Low 😔",
      color: "text-orange-600",
      bg: "bg-orange-50 border-orange-200",
    };
  return {
    label: "Needs Care 💙",
    color: "text-red-600",
    bg: "bg-red-50 border-red-200",
  };
};

export default function FrameOfMindPage() {
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [today, setToday] = useState<MoodEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get("/frame-of-mind")
      .then((r) => {
        setEntries(r.data.data.entries);
        setToday(r.data.data.todayMood);
        if (r.data.data.todayMood) {
          setSelected(r.data.data.todayMood.mood);
          setNote(r.data.data.todayMood.note || "");
        }
      })
      .catch(() => toast.error("Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  const log = async () => {
    if (!selected) return toast.error("Please select a mood");
    setSaving(true);
    try {
      const res = await api.post("/frame-of-mind", { mood: selected, note });
      setToday(res.data.data);
      setEntries((p) => {
        const filtered = p.filter((e) => e._id !== res.data.data._id);
        return [res.data.data, ...filtered];
      });
      toast.success("Mood logged!");
    } catch {
      toast.error("Failed to log mood");
    } finally {
      setSaving(false);
    }
  };

  // ─── Calculate average mindset score ─────────────────────────────────────
  const avgScore =
    entries.length > 0
      ? Math.round(
          (entries.reduce((sum, e) => sum + (MOOD_SCORE[e.mood] || 5), 0) /
            entries.length) *
            10,
        ) / 10
      : 0;

  const avgPct = Math.round((avgScore / 10) * 100);
  const avgLabel = getAverageLabel(avgScore);

  const moodCounts = entries.reduce(
    (acc, e) => {
      acc[e.mood] = (acc[e.mood] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const dominantMood = Object.entries(moodCounts).sort(
    (a, b) => b[1] - a[1],
  )[0];

  // Weekly average (last 7 entries)
  const last7 = entries.slice(0, 7);
  const weekAvg =
    last7.length > 0
      ? Math.round(
          (last7.reduce((s, e) => s + (MOOD_SCORE[e.mood] || 5), 0) /
            last7.length) *
            10,
        ) / 10
      : 0;

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
      <div className="space-y-6 animate-fade-in max-w-2xl">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Frame of Mind</h1>
          <p className="text-foreground-muted mt-1">
            Track your daily emotional wellbeing
          </p>
        </div>

        {/* ─── Overall Mindset Score ─────────────────────────────────────── */}
        {entries.length > 0 && (
          <div className={`card-elevated border-2 ${avgLabel.bg}`}>
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              🧠 Overall Mindset Score
            </h2>
            <div className="grid grid-cols-3 gap-4 mb-4">
              {/* Overall avg */}
              <div className="text-center">
                <div className="relative w-20 h-20 mx-auto mb-2">
                  <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="stroke-muted fill-none"
                      strokeWidth="3"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className={`fill-none stroke-current ${avgLabel.color}`}
                      strokeWidth="3"
                      strokeDasharray={`${avgPct}, 100`}
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-lg font-bold ${avgLabel.color}`}>
                      {avgScore}
                    </span>
                  </div>
                </div>
                <p className={`text-sm font-bold ${avgLabel.color}`}>
                  {avgLabel.label}
                </p>
                <p className="text-xs text-foreground-muted">
                  Overall ({entries.length} days)
                </p>
              </div>

              {/* This week */}
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-2 rounded-full bg-primary/10 flex items-center justify-center">
                  <div>
                    <p className="text-2xl font-bold text-primary">{weekAvg}</p>
                    <p className="text-xs text-foreground-muted">/10</p>
                  </div>
                </div>
                <p className="text-sm font-medium text-primary">
                  {getAverageLabel(weekAvg).label}
                </p>
                <p className="text-xs text-foreground-muted">This week</p>
              </div>

              {/* Dominant mood */}
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-2 rounded-full bg-secondary/10 flex items-center justify-center">
                  <span className="text-4xl">
                    {dominantMood
                      ? MOODS.find((m) => m.label === dominantMood[0])?.emoji
                      : "😊"}
                  </span>
                </div>
                <p className="text-sm font-medium text-secondary">
                  {dominantMood?.[0] || "—"}
                </p>
                <p className="text-xs text-foreground-muted">Most frequent</p>
              </div>
            </div>

            {/* Score bar */}
            <div>
              <div className="flex justify-between text-xs text-foreground-muted mb-1">
                <span>😢 0 — Needs Care</span>
                <span>Overall: {avgScore}/10</span>
                <span>Excellent 🌟 10</span>
              </div>
              <div className="w-full bg-muted rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all duration-700 ${
                    avgScore >= 8
                      ? "bg-success"
                      : avgScore >= 6
                        ? "bg-primary"
                        : avgScore >= 4
                          ? "bg-secondary"
                          : "bg-destructive"
                  }`}
                  style={{ width: `${avgPct}%` }}
                />
              </div>
              <p className="text-xs text-foreground-muted mt-1 text-center">
                {avgScore >= 8
                  ? "🌟 You are in a great mental space! Keep it up!"
                  : avgScore >= 6
                    ? "😊 Your mindset is generally positive."
                    : avgScore >= 4
                      ? "😐 Mixed feelings lately. Try to focus on positive activities."
                      : "💙 You've been going through a tough time. Be kind to yourself."}
              </p>
            </div>
          </div>
        )}

        {/* ─── Log Today's Mood ──────────────────────────────────────────── */}
        <div className="card-elevated">
          <h2 className="font-semibold mb-4">How are you feeling today?</h2>
          <div className="grid grid-cols-4 gap-3 mb-4">
            {MOODS.map((m) => (
              <button
                key={m.label}
                onClick={() => setSelected(m.label)}
                className={`border-2 rounded-xl p-3 text-center transition-all ${
                  selected === m.label
                    ? m.color + " border-current scale-105 shadow-md"
                    : "border-border hover:border-primary/40"
                }`}
              >
                <div className="text-3xl mb-1">{m.emoji}</div>
                <div className="text-xs font-medium">{m.label}</div>
                <div className="text-xs opacity-60 mt-0.5">{m.score}/10</div>
              </button>
            ))}
          </div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note about how you're feeling... (optional)"
            className="input-field min-h-[70px] mb-3"
            maxLength={300}
          />
          <button
            onClick={log}
            disabled={saving || !selected}
            className="btn-primary disabled:opacity-50"
          >
            {saving ? "Logging..." : today ? "Update Today's Mood" : "Log Mood"}
          </button>
          {today && (
            <p className="text-sm text-success mt-2">
              ✅ Today: {today.emoji} {today.mood} (
              {MOOD_SCORE[today.mood] || 5}/10)
            </p>
          )}
        </div>

        {/* ─── Mood Frequency Bars ───────────────────────────────────────── */}
        {entries.length > 0 && (
          <div className="card-elevated">
            <h2 className="font-semibold mb-4">Mood Distribution</h2>
            <div className="space-y-2">
              {Object.entries(moodCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([mood, count]) => {
                  const moodInfo = MOODS.find((m) => m.label === mood);
                  const pct = Math.round((count / entries.length) * 100);
                  const score = MOOD_SCORE[mood] || 5;
                  return (
                    <div key={mood} className="flex items-center gap-3">
                      <span className="text-lg w-7">{moodInfo?.emoji}</span>
                      <span className="text-xs w-20 text-foreground-muted">
                        {mood}
                      </span>
                      <div className="flex-1 bg-muted rounded-full h-2">
                        <div
                          className="bg-primary rounded-full h-2 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-foreground-muted w-8">
                        {pct}%
                      </span>
                      <span
                        className={`text-xs font-medium w-10 ${score >= 7 ? "text-success" : score >= 5 ? "text-foreground-muted" : "text-destructive"}`}
                      >
                        {score}/10
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* ─── History ───────────────────────────────────────────────────── */}
        {entries.length > 0 && (
          <div className="card-elevated">
            <h2 className="font-semibold mb-4">Recent History</h2>
            <div className="space-y-2">
              {entries.slice(0, 10).map((e) => (
                <div
                  key={e._id}
                  className="flex items-center gap-3 p-3 bg-muted rounded-lg"
                >
                  <span className="text-2xl">{e.emoji}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{e.mood}</p>
                      <span
                        className={`text-xs font-bold ${(MOOD_SCORE[e.mood] || 5) >= 7 ? "text-success" : (MOOD_SCORE[e.mood] || 5) >= 5 ? "text-foreground-muted" : "text-destructive"}`}
                      >
                        {MOOD_SCORE[e.mood] || 5}/10
                      </span>
                    </div>
                    {e.note && (
                      <p className="text-xs text-foreground-muted">{e.note}</p>
                    )}
                  </div>
                  <span className="text-xs text-foreground-muted">
                    {new Date(e.date).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {entries.length === 0 && (
          <div className="text-center py-8 text-foreground-muted">
            <p className="text-lg">
              🧠 Start logging your mood to see your mindset score!
            </p>
            <p className="text-sm mt-1">
              Track daily to get accurate insights.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
