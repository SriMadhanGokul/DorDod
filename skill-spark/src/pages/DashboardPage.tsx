import { useState, useEffect, useRef } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/utils/api";
import toast from "react-hot-toast";
import {
  FaCheck,
  FaFire,
  FaArrowUp,
  FaArrowDown,
  FaTag,
  FaShareAlt,
  FaArrowRight,
} from "react-icons/fa";

const QUOTES = [
  "We don't become what we want. We become what we REPEAT.",
  "Awareness first, then action.",
  "Small daily actions done consistently create change.",
  "What gets measured gets repeated.",
  "Consistency over intensity.",
];
const getDailyQuote = () =>
  QUOTES[Math.floor(Date.now() / 86400000) % QUOTES.length];

const STATES = [
  {
    value: "Calm",
    label: "Calm",
    bg: "bg-green-100  text-green-700  border-green-300",
    active: "bg-green-500  text-white border-green-500",
  },
  {
    value: "Focused",
    label: "Focused",
    bg: "bg-blue-100   text-blue-700   border-blue-300",
    active: "bg-blue-600   text-white border-blue-600",
  },
  {
    value: "Stressed",
    label: "Stressed",
    bg: "bg-red-100    text-red-700    border-red-300",
    active: "bg-red-500    text-white border-red-500",
  },
  {
    value: "Distracted",
    label: "Distracted",
    bg: "bg-yellow-100 text-yellow-700 border-yellow-300",
    active: "bg-yellow-500 text-white border-yellow-500",
  },
  {
    value: "Energized",
    label: "Energized",
    bg: "bg-purple-100 text-purple-700 border-purple-300",
    active: "bg-purple-500 text-white border-purple-500",
  },
];

const REALIZATION_TAGS = [
  "Avoidance",
  "Clarity",
  "Fear",
  "Progress",
  "Insight",
  "Breakthrough",
  "Pattern",
  "Gratitude",
];

function AlignmentRing({
  score,
  label,
  delta,
}: {
  score: number;
  label: string;
  delta?: number;
}) {
  const size = 140;
  const r = 54;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(score, 100) / 100;
  const off = circ - pct * circ;
  const color = score >= 70 ? "#22c55e" : score >= 40 ? "#f59e0b" : "#ef4444";
  const labelColor =
    score >= 70
      ? "text-green-600"
      : score >= 40
        ? "text-amber-500"
        : "text-red-500";
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
            strokeWidth={14}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={14}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={off}
            style={{ transition: "stroke-dashoffset 1s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-4xl font-black" style={{ color }}>
            {score}
          </p>
          <p className="text-xs text-gray-400 font-medium">/100</p>
        </div>
      </div>
      <div className="mt-2 text-center">
        <span
          className={`text-sm font-bold px-3 py-1 rounded-full ${score >= 70 ? "bg-green-100 text-green-700" : score >= 40 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-600"}`}
        >
          {label}
        </span>
        {delta !== undefined && delta !== 0 && (
          <p
            className={`text-xs mt-1 flex items-center justify-center gap-0.5 font-semibold ${delta > 0 ? "text-green-600" : "text-red-500"}`}
          >
            {delta > 0 ? (
              <FaArrowUp className="w-2.5 h-2.5" />
            ) : (
              <FaArrowDown className="w-2.5 h-2.5" />
            )}
            {Math.abs(delta)} vs yesterday
          </p>
        )}
      </div>
    </div>
  );
}

function ScoreBar({
  label,
  score,
  max,
  color,
  icon,
  detail,
}: {
  label: string;
  score: number;
  max: number;
  color: string;
  icon: string;
  detail: string;
}) {
  const isNeg = score < 0;
  const pct = Math.round((Math.abs(score) / max) * 100);
  return (
    <div
      className={`rounded-xl p-3 border ${isNeg ? "bg-red-50 border-red-100" : "border-gray-100"}`}
      style={{ background: isNeg ? undefined : `${color}08` }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-base">{icon}</span>
          <p className="text-xs font-bold text-gray-700">{label}</p>
        </div>
        <span
          className="text-sm font-black"
          style={{ color: isNeg ? "#ef4444" : color }}
        >
          {isNeg ? score : score}/{isNeg ? -max : max}
        </span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2 mb-1.5">
        <div
          className="h-2 rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: isNeg ? "#ef4444" : color }}
        />
      </div>
      <p className="text-xs text-gray-400">{detail}</p>
    </div>
  );
}

function ActionRow({
  icon,
  label,
  done,
  action,
  actionLabel,
}: {
  icon: string;
  label: string;
  done: boolean;
  action?: () => void;
  actionLabel?: string;
}) {
  return (
    <div
      className={`flex items-center justify-between p-3 rounded-xl transition-all ${done ? "bg-green-50 border border-green-100" : "bg-gray-50 hover:bg-gray-100"}`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${done ? "bg-green-500" : "bg-gray-200"}`}
        >
          {done ? (
            <FaCheck className="text-white w-3.5 h-3.5" />
          ) : (
            <span>{icon}</span>
          )}
        </div>
        <span
          className={`text-sm font-medium ${done ? "text-gray-500 line-through" : " text-gray-800"}`}
        >
          {label}
        </span>
      </div>
      {done ? (
        <span className="text-xs text-green-600 font-semibold flex items-center gap-1">
          <FaCheck className="w-3 h-3" /> Completed
        </span>
      ) : action ? (
        <button
          onClick={action}
          className="text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-all"
        >
          {actionLabel || "Do it"}
        </button>
      ) : null}
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const quote = getDailyQuote();
  const realRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [selectedState, setSelectedState] = useState("");
  const [noteText, setNoteText] = useState("");
  const [checkInDone, setCheckInDone] = useState(false);
  const [saving, setSaving] = useState(false);

  const [alignScore, setAlignScore] = useState(0);
  const [alignLabel, setAlignLabel] = useState("Misaligned");
  const [yesterdayScore, setYesterdayScore] = useState(0);
  const [awareness, setAwareness] = useState(0);
  const [execution, setExecution] = useState(0);
  const [penalty, setPenalty] = useState(0);
  const [breakdown, setBreakdown] = useState<any>(null);

  const [weeklyLoops, setWeeklyLoops] = useState<any[]>([]);
  const [awarenessStreak, setStreak] = useState(0);
  const [realization, setRealization] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [realizationSaved, setRealSaved] = useState(false);
  const [savingReal, setSavingReal] = useState(false);
  const [insight, setInsight] = useState<string | null>(null);
  const [suggestedAction, setSuggested] = useState<{
    text: string;
    showGuidance: boolean;
  } | null>(null);
  const [loopType, setLoopType] = useState("None");
  const [loopSeverity, setLoopSeverity] = useState("None");
  const [showGuidanceCTA, setShowGuidance] = useState(false);
  const [guidanceDone, setGuidanceDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [todayActivity, setTodayActivity] = useState<any>(null);
  const [showPostGuidance, setShowPG] = useState(false);
  const [guidanceForm, setGuidanceForm] = useState({
    goalUpdate: "",
    behaviorSuggestion: "",
    insight: "",
  });

  useEffect(() => {
    if (!localStorage.getItem("onboarded")) {
      window.location.href = "/onboarding";
      return;
    }
    const load = async () => {
      try {
        const [dashRes, goalRes] = await Promise.all([
          api.get("/checkin/dashboard"),
          api.get("/goals"),
        ]);
        const d = dashRes.data.data;
        setStreak(d.awarenessStreak || 0);
        setWeeklyLoops(d.weeklyLoops || []);
        if (d.alignmentScore) {
          setAlignScore(d.alignmentScore.final || 0);
          setAlignLabel(d.alignmentScore.label?.label || "Misaligned");
          setAwareness(d.alignmentScore.awareness || 0);
          setExecution(d.alignmentScore.execution || 0);
          setPenalty(d.alignmentScore.penalty || 0);
          setBreakdown(d.alignmentScore.detail || null);
        }
        // Find today's activity from first active goal
        const activeGoals = (goalRes.data.data || []).filter(
          (g: any) => g.status === "In Progress",
        );
        if (activeGoals.length > 0) {
          const todayStr = new Date().toISOString().slice(0, 10);
          const firstGoal = activeGoals[0];
          const todayDay = firstGoal.dayActivities?.find(
            (d: any) => d.dueDate?.slice(0, 10) === todayStr,
          );
          if (todayDay) setTodayActivity({ goal: firstGoal, day: todayDay });
        }
        if (d.todayCheckIn) {
          const ci = d.todayCheckIn;
          setCheckInDone(true);
          setSelectedState(ci.dailyState || "");
          setLoopType(ci.loopType || "None");
          setLoopSeverity(ci.loopSeverity || "None");
          setRealization(ci.realization || "");
          setSelectedTags(ci.realizationTags || []);
          setGuidanceDone(ci.guidanceSessionDone || false);
          if (ci.realization) setRealSaved(true);
          if (
            ci.loopType !== "None" ||
            ["Stressed", "Distracted"].includes(ci.dailyState)
          )
            setShowGuidance(true);
        }
      } catch {
        toast.error("Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleCheckIn = async () => {
    if (!selectedState) return toast.error("Select your current state first");
    setSaving(true);
    try {
      const res = await api.post("/checkin", {
        dailyState: selectedState,
        avoidingText: noteText,
        mattersTodayText: "",
      });
      const d = res.data.data;
      setCheckInDone(true);
      if (d.alignmentBreakdown) {
        setAlignScore(d.alignmentBreakdown.score || 0);
        setAlignLabel(d.alignmentLabel?.label || "Misaligned");
        setAwareness(d.alignmentBreakdown.awareness || 0);
        setExecution(d.alignmentBreakdown.execution || 0);
        setPenalty(d.alignmentBreakdown.penalty || 0);
        setBreakdown(d.alignmentBreakdown.detail || null);
      }
      setInsight(d.insight || null);
      setSuggested(d.suggestedAction || null);
      setLoopType(d.checkIn?.loopType || "None");
      setLoopSeverity(d.checkIn?.loopSeverity || "None");
      setWeeklyLoops(d.weeklyLoops || []);
      if (
        d.checkIn?.loopType !== "None" ||
        ["Stressed", "Distracted"].includes(selectedState)
      )
        setShowGuidance(true);
      const dashRes = await api.get("/checkin/dashboard");
      setStreak(dashRes.data.data.awarenessStreak || 0);
      toast.success("✅ Check-in saved! Alignment Score updated.");
    } catch {
      toast.error("Failed to save check-in");
    } finally {
      setSaving(false);
    }
  };

  // Debounced realization save
  const handleRealizationChange = (val: string) => {
    setRealization(val);
    setRealSaved(false);
    if (realRef.current) clearTimeout(realRef.current);
    if (val.trim().length > 5 && checkInDone) {
      realRef.current = setTimeout(
        () => doSaveRealization(val, selectedTags),
        2000,
      );
    }
  };

  const doSaveRealization = async (text: string, tags: string[]) => {
    if (!text.trim() || !checkInDone) return;
    setSavingReal(true);
    try {
      const res = await api.patch("/checkin/realization", {
        realization: text,
        realizationTags: tags,
      });
      setRealSaved(true);
      if (res.data.newScore) {
        setAlignScore(res.data.newScore.score);
        setAlignLabel(res.data.newScore.label?.label || "");
        setAwareness(res.data.newScore.awareness);
        setExecution(res.data.newScore.execution);
        setPenalty(res.data.newScore.penalty);
      }
    } catch {
    } finally {
      setSavingReal(false);
    }
  };

  const handleCompleteActivity = async () => {
    if (!todayActivity) return;
    try {
      const res = await api.patch(
        `/goals/${todayActivity.goal._id}/day/${todayActivity.day.dayNumber}/complete`,
      );
      setTodayActivity((p: any) =>
        p ? { ...p, day: { ...p.day, status: "Completed" } } : p,
      );
      // Refresh alignment score
      const dashRes = await api.get("/checkin/dashboard");
      const d = dashRes.data.data;
      if (d.alignmentScore) {
        setAlignScore(d.alignmentScore.final || 0);
        setAlignLabel(d.alignmentScore.label?.label || "Misaligned");
        setExecution(d.alignmentScore.execution || 0);
        setPenalty(d.alignmentScore.penalty || 0);
        setBreakdown(d.alignmentScore.detail || null);
      }
      toast.success("✅ Activity completed! Score updated.");
    } catch {
      toast.error("Failed");
    }
  };

  const toggleTag = (tag: string) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag];
    setSelectedTags(newTags);
    if (realization.trim().length > 5) doSaveRealization(realization, newTags);
  };

  const handleShare = () => {
    const tags = selectedTags.length ? ` [${selectedTags.join(", ")}]` : "";
    const text = `"${realization || insight}"${tags} — Alignment: ${alignScore}/100 #DoRDoD`;
    if (navigator.share) navigator.share({ text }).catch(() => {});
    else {
      navigator.clipboard.writeText(text);
      toast.success("Copied!");
    }
  };

  if (loading)
    return (
      <DashboardLayout>
        <div className="flex justify-center py-24">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );

  const stateBtn = (s: (typeof STATES)[0]) =>
    selectedState === s.value ? s.active : s.bg;
  const delta = alignScore - yesterdayScore;

  return (
    <DashboardLayout>
      <div className="space-y-5 animate-fade-in max-w-3xl mx-auto">
        {/* Greeting */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Good{" "}
            {new Date().getHours() < 12
              ? "Morning"
              : new Date().getHours() < 17
                ? "Afternoon"
                : "Evening"}
            , {(user as any)?.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Here's your alignment overview
          </p>
        </div>

        {/* Alignment Score Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="font-bold text-gray-900 text-lg">
                Alignment Score
              </h2>
              <p className="text-xs text-gray-400">
                Based on what you repeat daily
              </p>
            </div>
            {awarenessStreak > 0 && (
              <div className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-full">
                <FaFire className="text-orange-500 w-3.5 h-3.5" />
                <span className="text-sm font-bold text-orange-600">
                  {awarenessStreak} day streak
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            <AlignmentRing
              score={alignScore}
              label={alignLabel}
              delta={delta !== 0 ? delta : undefined}
            />

            <div className="flex-1 space-y-3 w-full">
              <ScoreBar
                label="Awareness"
                score={awareness}
                max={30}
                color="#3b82f6"
                icon="🧠"
                detail={
                  breakdown?.checkInDone
                    ? `✓ Check-in completed${breakdown?.reflectionDone ? " · ✓ Reflection done" : " · Reflection missing (−10)"}`
                    : "Check in to earn +20 awareness"
                }
              />
              <ScoreBar
                label="Execution"
                score={execution}
                max={70}
                color="#22c55e"
                icon="⚡"
                detail={`${breakdown?.completed || 0} of ${breakdown?.total || 21} activities completed on time`}
              />
              <ScoreBar
                label="Penalty"
                score={Math.abs(penalty)}
                max={30}
                color="#ef4444"
                icon="⚠️"
                detail={
                  penalty < 0
                    ? `${penalty} applied${!breakdown?.reflectionDone ? " (no reflection)" : ""}${breakdown?.missedToday ? " (missed today)" : ""}`
                    : "No penalties today 🎉"
                }
              />
            </div>
          </div>

          {/* Formula */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-center gap-2 flex-wrap text-xs text-gray-500">
              <span className="font-bold text-blue-500 bg-blue-50 px-2 py-1 rounded-lg">
                Awareness {awareness}/30
              </span>
              <span className="font-bold text-gray-400">+</span>
              <span className="font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">
                Execution {execution}/70
              </span>
              <span className="font-bold text-gray-400">−</span>
              <span className="font-bold text-red-500 bg-red-50 px-2 py-1 rounded-lg">
                Penalty {Math.abs(penalty)}/30
              </span>
              <span className="font-bold text-gray-400">=</span>
              <span className="font-bold text-gray-800 bg-gray-100 px-2 py-1 rounded-lg">
                {alignScore}/100
              </span>
            </div>
          </div>
        </div>

        {/* Daily Check-In Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-bold text-gray-900 mb-1">Daily Check-In</h2>
          <p className="text-sm text-gray-400 mb-4">How are you feeling?</p>

          <div className="flex flex-wrap gap-2 mb-4">
            {STATES.map((s) => (
              <button
                key={s.value}
                onClick={() => !checkInDone && setSelectedState(s.value)}
                disabled={checkInDone}
                className={`px-4 py-2 rounded-full border-2 font-medium text-sm transition-all ${stateBtn(s)} ${checkInDone && selectedState !== s.value ? "opacity-30 cursor-default" : "hover:scale-105"}`}
              >
                {s.label}
                {s.value === selectedState && checkInDone && (
                  <span className="ml-1.5 bg-white/30 text-xs px-1.5 py-0.5 rounded-full">
                    +20
                  </span>
                )}
              </button>
            ))}
          </div>

          {!checkInDone && selectedState && (
            <textarea
              placeholder="Add a note (optional)"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              rows={2}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm mb-3 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          )}

          {!checkInDone ? (
            <button
              onClick={handleCheckIn}
              disabled={saving || !selectedState}
              className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-indigo-700 disabled:opacity-50 transition-all"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          ) : (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <FaCheck className="text-white w-3 h-3" />
              </div>
              <p className="text-sm text-green-700 font-medium">
                Checked in as <strong>{selectedState}</strong> today
              </p>
            </div>
          )}
        </div>

        {/* Today's Actions */}
        {checkInDone && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-bold text-gray-900 mb-4">Today's Actions</h2>
            <div className="space-y-2">
              <ActionRow icon="📋" label="Daily Check-In" done={checkInDone} />
              <ActionRow
                icon="📝"
                label="Reflection"
                done={realizationSaved}
                action={() =>
                  document.getElementById("reflection-box")?.focus()
                }
                actionLabel="Write your reflection"
              />
              {todayActivity && (
                <ActionRow
                  icon="⚡"
                  label={`Today's Activity — ${todayActivity.day.title}`}
                  done={todayActivity.day.status === "Completed"}
                  action={handleCompleteActivity}
                  actionLabel="✓ Mark Complete"
                />
              )}
            </div>

            {/* Motivational message */}
            <div className="mt-4 pt-3 border-t border-gray-100">
              <p className="text-sm text-center text-gray-500 italic">
                {alignScore >= 70
                  ? "🌟 You're on fire! Keep it up!"
                  : alignScore >= 40
                    ? "👍 You're on the right track. Keep improving!"
                    : "💪 Every action counts. Start with one step."}
              </p>
            </div>
          </div>
        )}

        {/* Insight card (after check-in with loop) */}
        {checkInDone && insight && loopType !== "None" && (
          <div
            className={`bg-white rounded-2xl border-l-4 shadow-sm p-5 ${loopSeverity === "High" ? "border-red-400" : loopSeverity === "Medium" ? "border-amber-400" : "border-yellow-300"}`}
          >
            <div className="flex items-start gap-3 mb-3">
              <span className="text-xl">💡</span>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
                  Insight · {loopType} Loop — {loopSeverity}
                </p>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {insight}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() =>
                  toast.success(
                    suggestedAction?.text || "Starting your small step!",
                  )
                }
                className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-indigo-700 transition-all"
              >
                ⚡ Start Small Step
              </button>
              {showGuidanceCTA && !guidanceDone && (
                <button
                  onClick={() => {
                    sessionStorage.setItem(
                      "guidanceContext",
                      JSON.stringify({
                        goal: "",
                        loopType,
                        mindState: selectedState,
                      }),
                    );
                    window.location.href = "/guidance";
                  }}
                  className="text-sm border border-indigo-300 text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-xl font-medium transition-all"
                >
                  🧭 Explore Guidance (Optional)
                </button>
              )}
            </div>
            {suggestedAction && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                <p className="text-xs text-blue-600 font-semibold mb-0.5">
                  ⚡ Suggested Action
                </p>
                <p className="text-sm text-blue-800">{suggestedAction.text}</p>
              </div>
            )}
          </div>
        )}

        {/* Reflection Box */}
        {checkInDone && (
          <div
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
            style={{ background: "linear-gradient(135deg,#faf5ff,#f0fdf4)" }}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-gray-900">📝 Daily Reflection</h2>
              <div className="text-xs text-gray-400">
                {savingReal ? (
                  "Saving..."
                ) : realizationSaved ? (
                  <span className="text-green-600 flex items-center gap-1">
                    <FaCheck className="w-3 h-3" /> Saved to Insights
                  </span>
                ) : (
                  "Auto-saves as you type"
                )}
              </div>
            </div>
            {!realizationSaved && (
              <div className="flex items-center gap-2 mb-3 p-2.5 bg-amber-50 border border-amber-100 rounded-xl">
                <span className="text-sm">⚠️</span>
                <p className="text-xs text-amber-700">
                  No reflection added today. Reflection removes −10 penalty and
                  brings clarity.
                </p>
              </div>
            )}
            <textarea
              id="reflection-box"
              placeholder="Write your realization... (auto-saves)"
              value={realization}
              onChange={(e) => handleRealizationChange(e.target.value)}
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-200 bg-white/80"
            />
            {realization.trim().length > 5 && (
              <div className="mt-3">
                <p className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
                  <FaTag className="w-3 h-3" /> Tag this realization:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {REALIZATION_TAGS.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`text-xs px-3 py-1 rounded-full border transition-all ${selectedTags.includes(tag) ? "bg-indigo-600 text-white border-indigo-600" : "bg-white border-gray-200 text-gray-500 hover:border-indigo-300"}`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {realization.trim() && (
              <div className="flex justify-between items-center mt-3">
                <button
                  onClick={() => setShowPG((p) => !p)}
                  className="text-xs text-indigo-500 hover:underline"
                >
                  📝 Had a Guidance session? Record update →
                </button>
                <button
                  onClick={handleShare}
                  className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 border border-indigo-200 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-all"
                >
                  <FaShareAlt className="w-3 h-3" /> Share Insight
                </button>
              </div>
            )}
          </div>
        )}

        {/* Post-guidance form */}
        {showPostGuidance && !guidanceDone && checkInDone && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-bold mb-3 text-gray-900">
              After Guidance — Update Your System
            </h3>
            <div className="space-y-3">
              <input
                placeholder="🎯 Intent update"
                value={guidanceForm.goalUpdate}
                onChange={(e) =>
                  setGuidanceForm((p) => ({ ...p, goalUpdate: e.target.value }))
                }
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none"
              />
              <input
                placeholder="🔥 Behavior to try"
                value={guidanceForm.behaviorSuggestion}
                onChange={(e) =>
                  setGuidanceForm((p) => ({
                    ...p,
                    behaviorSuggestion: e.target.value,
                  }))
                }
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none"
              />
              <textarea
                placeholder="💡 Key insight"
                value={guidanceForm.insight}
                onChange={(e) =>
                  setGuidanceForm((p) => ({ ...p, insight: e.target.value }))
                }
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm min-h-[60px] resize-none focus:outline-none"
              />
              <button
                onClick={async () => {
                  try {
                    await api.post("/checkin/guidance-update", guidanceForm);
                    setGuidanceDone(true);
                    setShowPG(false);
                    toast.success("✅ System updated!");
                  } catch {
                    toast.error("Failed");
                  }
                }}
                className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-all"
              >
                ✅ Record Guidance Update
              </button>
            </div>
          </div>
        )}

        {/* This Week's Patterns */}
        {weeklyLoops.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-bold text-gray-900 mb-3">
              This Week's Patterns
            </h2>
            <div className="space-y-2">
              {weeklyLoops.map((loop, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between p-3 rounded-xl border ${
                    loop.severity === "High"
                      ? "bg-red-50 border-red-100"
                      : loop.severity === "Medium"
                        ? "bg-amber-50 border-amber-100"
                        : "bg-yellow-50 border-yellow-100"
                  }`}
                >
                  <p
                    className={`text-sm font-medium ${loop.severity === "High" ? "text-red-700" : loop.severity === "Medium" ? "text-amber-700" : "text-yellow-700"}`}
                  >
                    {loop.pattern}
                  </p>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${loop.severity === "High" ? "bg-red-100 text-red-600" : loop.severity === "Medium" ? "bg-amber-100 text-amber-600" : "bg-yellow-100 text-yellow-600"}`}
                    >
                      {loop.severity}
                    </span>
                    <span className="text-xs font-bold text-gray-600">
                      {loop.count}×
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quote */}
        <div className="bg-indigo-600 rounded-2xl p-6 text-center">
          <span className="text-3xl mb-3 block">"</span>
          <p className="text-white font-semibold text-base leading-relaxed">
            {quote}
          </p>
          <div className="mt-4 flex items-center justify-center">
            <div className="w-16 h-0.5 bg-white/40 rounded" />
          </div>
        </div>

        {/* Quick nav */}
        {!checkInDone && !selectedState && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Intent", emoji: "🎯", path: "/goals" },
              { label: "Execution", emoji: "⚡", path: "/execution" },
              { label: "Knowledge", emoji: "📚", path: "/learning" },
              { label: "Growth Plan", emoji: "📈", path: "/development-plan" },
            ].map((a, i) => (
              <a
                key={i}
                href={a.path}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-200 font-medium text-sm transition-all text-gray-700"
              >
                <span className="text-2xl">{a.emoji}</span>
                <span>{a.label}</span>
              </a>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
