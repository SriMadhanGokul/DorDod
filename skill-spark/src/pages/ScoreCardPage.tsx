import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { api } from "@/utils/api";
import toast from "react-hot-toast";
import { FaStar, FaTrophy, FaUserCheck, FaPlus, FaTimes } from "react-icons/fa";

interface ScoreEntry {
  _id: string;
  from: { name: string } | string;
  score: number;
  comment: string;
  category: string;
  createdAt: string;
}
interface CardData {
  myScore: number;
  avgReceived: number;
  scoresReceived: ScoreEntry[];
  scoresGiven: ScoreEntry[];
}
interface User {
  _id: string;
  name: string;
  email: string;
}

export default function ScoreCardPage() {
  const [card, setCard] = useState<CardData | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [tab, setTab] = useState<"view" | "give">("view");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState("");
  const [score, setScore] = useState(50);
  const [comment, setComment] = useState("");
  const [category, setCategory] = useState("General");
  const [giving, setGiving] = useState(false);

  useEffect(() => {
    Promise.all([api.get("/scorecard"), api.get("/scorecard/users")])
      .then(([c, u]) => {
        setCard(c.data.data);
        setUsers(u.data.data);
      })
      .catch(() => toast.error("Failed to load score card"))
      .finally(() => setLoading(false));
  }, []);

  const giveScore = async () => {
    if (!selected) return toast.error("Select a user");
    setGiving(true);
    try {
      await api.post(`/scorecard/give/${selected}`, {
        score,
        comment,
        category,
      });
      toast.success("Score given!");
      setShowModal(false);
      setComment("");
      setScore(50);
      setSelected("");
      const res = await api.get("/scorecard");
      setCard(res.data.data);
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed");
    } finally {
      setGiving(false);
    }
  };

  const scoreColor = (s: number) =>
    s >= 80 ? "text-success" : s >= 50 ? "text-secondary" : "text-destructive";

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
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Score Card</h1>
            <p className="text-foreground-muted mt-1">Your performance score</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <FaPlus /> Give Score
          </button>
        </div>

        {/* Score display */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card-elevated text-center">
            <FaTrophy className="text-4xl text-secondary mx-auto mb-2" />
            <p
              className={`text-5xl font-bold ${scoreColor(card?.myScore || 0)}`}
            >
              {card?.myScore || 0}%
            </p>
            <p className="text-sm text-foreground-muted mt-2">My Score</p>
          </div>
          <div className="card-elevated text-center">
            <FaStar className="text-4xl text-primary mx-auto mb-2" />
            <p
              className={`text-5xl font-bold ${scoreColor(card?.avgReceived || 0)}`}
            >
              {card?.avgReceived || 0}%
            </p>
            <p className="text-sm text-foreground-muted mt-2">Avg Received</p>
          </div>
          <div className="card-elevated text-center">
            <FaUserCheck className="text-4xl text-success mx-auto mb-2" />
            <p className="text-5xl font-bold text-success">
              {card?.scoresGiven?.length || 0}
            </p>
            <p className="text-sm text-foreground-muted mt-2">Scores Given</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {(["view", "give"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${tab === t ? "bg-primary text-primary-foreground" : "bg-muted text-foreground-muted hover:bg-accent"}`}
            >
              {t === "view" ? "Scores Received" : "Scores Given"}
            </button>
          ))}
        </div>

        {/* Scores list */}
        <div className="space-y-3">
          {(tab === "view" ? card?.scoresReceived : card?.scoresGiven)
            ?.length === 0 && (
            <div className="text-center py-12 text-foreground-muted">
              No scores yet
            </div>
          )}
          {(tab === "view" ? card?.scoresReceived : card?.scoresGiven)?.map(
            (s, i) => (
              <div
                key={i}
                className="card-elevated flex items-center justify-between"
              >
                <div>
                  <p className="font-semibold text-sm">
                    {typeof s.from === "object" ? s.from.name : "User"}
                  </p>
                  <p className="text-xs text-foreground-muted">
                    {s.category} · {new Date(s.createdAt).toLocaleDateString()}
                  </p>
                  {s.comment && (
                    <p className="text-sm mt-1 text-foreground-muted">
                      "{s.comment}"
                    </p>
                  )}
                </div>
                <span className={`text-3xl font-bold ${scoreColor(s.score)}`}>
                  {s.score}%
                </span>
              </div>
            ),
          )}
        </div>

        {/* Give Score Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-2xl p-6 w-full max-w-md animate-fade-in">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">Give Score</h2>
                <button onClick={() => setShowModal(false)}>
                  <FaTimes />
                </button>
              </div>
              <div className="space-y-4">
                <select
                  value={selected}
                  onChange={(e) => setSelected(e.target.value)}
                  className="input-field"
                >
                  <option value="">Select a user *</option>
                  {users.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.name} ({u.email})
                    </option>
                  ))}
                </select>
                <div>
                  <label className="text-sm text-foreground-muted block mb-1">
                    Score: <strong>{score}%</strong>
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={100}
                    value={score}
                    onChange={(e) => setScore(+e.target.value)}
                    className="w-full accent-primary"
                  />
                  <div className="flex justify-between text-xs text-foreground-muted">
                    <span>1</span>
                    <span>50</span>
                    <span>100</span>
                  </div>
                </div>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="input-field"
                >
                  {[
                    "General",
                    "Technical",
                    "Leadership",
                    "Communication",
                    "Teamwork",
                    "Problem Solving",
                  ].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
                <textarea
                  placeholder="Comment (optional)"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="input-field min-h-[70px]"
                />
                <button
                  onClick={giveScore}
                  disabled={giving}
                  className="btn-primary w-full disabled:opacity-50"
                >
                  {giving ? "Submitting..." : "Give Score"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
