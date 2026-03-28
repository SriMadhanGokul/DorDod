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
  },
  {
    label: "Excited",
    emoji: "🤩",
    color: "bg-orange-100 border-orange-300 text-orange-700",
  },
  {
    label: "Motivated",
    emoji: "💪",
    color: "bg-green-100 border-green-300 text-green-700",
  },
  {
    label: "Neutral",
    emoji: "😐",
    color: "bg-gray-100 border-gray-300 text-gray-700",
  },
  {
    label: "Tired",
    emoji: "😴",
    color: "bg-blue-100 border-blue-300 text-blue-700",
  },
  {
    label: "Anxious",
    emoji: "😰",
    color: "bg-purple-100 border-purple-300 text-purple-700",
  },
  {
    label: "Stressed",
    emoji: "😤",
    color: "bg-red-100 border-red-300 text-red-700",
  },
  {
    label: "Sad",
    emoji: "😢",
    color: "bg-indigo-100 border-indigo-300 text-indigo-700",
  },
];

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

        {/* Today's mood */}
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
              ✅ Today's mood: {today.emoji} {today.mood}
            </p>
          )}
        </div>

        {/* Mood stats */}
        {entries.length > 0 && (
          <div className="card-elevated">
            <h2 className="font-semibold mb-4">Mood Insights</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-muted rounded-xl p-4 text-center">
                <p className="text-3xl mb-1">
                  {dominantMood
                    ? MOODS.find((m) => m.label === dominantMood[0])?.emoji
                    : "😊"}
                </p>
                <p className="text-sm font-medium">
                  {dominantMood?.[0] || "—"}
                </p>
                <p className="text-xs text-foreground-muted">Most frequent</p>
              </div>
              <div className="bg-muted rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-primary">
                  {entries.length}
                </p>
                <p className="text-xs text-foreground-muted mt-1">
                  Days tracked
                </p>
              </div>
            </div>
            {/* Mood frequency bars */}
            <div className="space-y-2">
              {Object.entries(moodCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([mood, count]) => {
                  const moodInfo = MOODS.find((m) => m.label === mood);
                  const pct = Math.round((count / entries.length) * 100);
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
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* History */}
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
                    <p className="text-sm font-medium">{e.mood}</p>
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
      </div>
    </DashboardLayout>
  );
}
