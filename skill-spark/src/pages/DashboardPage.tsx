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
  FaPlus,
  FaTimes,
  FaLock,
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

// States for check-in
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

const SLOT_CONFIG = {
  Morning: {
    emoji: "🌅",
    label: "Morning",
    time: "Before 12 PM",
    color: "text-amber-600",
    bg: "bg-amber-50 border-amber-200",
  },
  Midday: {
    emoji: "☀️",
    label: "Midday",
    time: "12 PM – 5 PM",
    color: "text-orange-600",
    bg: "bg-orange-50 border-orange-200",
  },
  Evening: {
    emoji: "🌙",
    label: "Evening",
    time: "After 5 PM",
    color: "text-indigo-600",
    bg: "bg-indigo-50 border-indigo-200",
  },
};

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

function AlignmentRing({ score, label }: { score: number; label: string }) {
  const size = 130;
  const r = 50;
  const circ = 2 * Math.PI * r;
  const off = circ - (Math.min(score, 100) / 100) * circ;
  const color = score >= 70 ? "#22c55e" : score >= 40 ? "#f59e0b" : "#ef4444";
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
            strokeWidth={12}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={12}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={off}
            style={{ transition: "stroke-dashoffset 1s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-3xl font-black" style={{ color }}>
            {score}
          </p>
          <p className="text-xs text-gray-400">/100</p>
        </div>
      </div>
      <span
        className={`mt-2 text-xs font-bold px-3 py-1 rounded-full ${score >= 70 ? "bg-green-100 text-green-700" : score >= 40 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-600"}`}
      >
        {label}
      </span>
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
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
          {icon} {label}
        </span>
        <span
          className="text-sm font-black"
          style={{ color: isNeg ? "#ef4444" : color }}
        >
          {isNeg ? score : score}/{isNeg ? -max : max}
        </span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div
          className="h-2 rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: isNeg ? "#ef4444" : color }}
        />
      </div>
      <p className="text-xs text-gray-400 mt-1">{detail}</p>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const quote = getDailyQuote();
  const realRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── SLOT STATE ────────────────────────────────────────────────────────────
  const [slots, setSlots] = useState<
    { slot: string; state: string; note: string; time: string }[]
  >([]);
  const [usedSlots, setUsedSlots] = useState<string[]>([]);
  const [currentSlot, setCurrentSlot] = useState<string>("Morning");
  const [canCheckIn, setCanCheckIn] = useState(true);
  const [selectedState, setSelectedState] = useState("");
  const [noteText, setNoteText] = useState("");
  const [showCheckInForm, setShowCheckInForm] = useState(false);
  const [saving, setSaving] = useState(false);

  // ── SCORE STATE ───────────────────────────────────────────────────────────
  const [alignScore, setAlignScore] = useState(0);
  const [alignLabel, setAlignLabel] = useState("Misaligned");
  const [awareness, setAwareness] = useState(0);
  const [execution, setExecution] = useState(0);
  const [penalty, setPenalty] = useState(0);
  const [breakdown, setBreakdown] = useState<any>(null);

  // ── OTHER STATE ───────────────────────────────────────────────────────────
  const [weeklyLoops, setWeeklyLoops] = useState<any[]>([]);
  const [awarenessStreak, setStreak] = useState(0);
  const [realization, setRealization] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [realizationSaved, setRealSaved] = useState(false);
  const [savingReal, setSavingReal] = useState(false);
  const [insight, setInsight] = useState<string | null>(null);
  const [suggestedAction, setSuggested] = useState<{ text: string } | null>(
    null,
  );
  const [loopType, setLoopType] = useState("None");
  const [todayActivity, setTodayActivity] = useState<any>(null);
  const [guidanceDone, setGuidanceDone] = useState(false);
  const [loading, setLoading] = useState(true);
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
    load();
  }, []);

  const load = async () => {
    try {
      const [dashRes, slotRes, goalRes] = await Promise.all([
        api.get("/checkin/dashboard"),
        api.get("/checkin/slot-status"),
        api.get("/goals"),
      ]);

      // Dashboard data
      const d = dashRes.data.data;
      setStreak(d.awarenessStreak || 0);
      setWeeklyLoops(d.weeklyLoops || []);
      if (d.alignmentScore) {
        setAlignScore(d.alignmentScore.score || 0);
        setAlignLabel(d.alignmentScore.label?.label || "Misaligned");
        setAwareness(d.alignmentScore.awareness || 0);
        setExecution(d.alignmentScore.execution || 0);
        setPenalty(d.alignmentScore.penalty || 0);
        setBreakdown(d.alignmentScore.detail || null);
      }
      if (d.todayCheckIn) {
        const ci = d.todayCheckIn;
        setSlots(ci.slots || []);
        setRealization(ci.realization || "");
        setSelectedTags(ci.realizationTags || []);
        setGuidanceDone(ci.guidanceSessionDone || false);
        if (ci.realization) setRealSaved(true);
        if (ci.loopType && ci.loopType !== "None") setLoopType(ci.loopType);
      }

      // Slot status
      const s = slotRes.data.data;
      setUsedSlots(s.usedSlots || []);
      setCurrentSlot(s.currentSlot || "Morning");
      setCanCheckIn(s.canCheckIn);

      // Today's goal activity
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
    } catch {
      toast.error("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!selectedState) return toast.error("Select your current state first");
    setSaving(true);
    try {
      const res = await api.post("/checkin", {
        dailyState: selectedState,
        note: noteText,
        avoidingText: noteText,
      });
      const d = res.data.data;

      // Update slots display
      setSlots((prev) => [
        ...prev,
        {
          slot: d.currentSlot || currentSlot,
          state: selectedState,
          note: noteText,
          time: new Date().toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
      setUsedSlots((prev) => [...prev, d.currentSlot || currentSlot]);

      // Update score
      if (d.alignmentBreakdown) {
        setAlignScore(d.alignmentBreakdown.score || 0);
        setAlignLabel(d.alignmentLabel?.label || "Misaligned");
        setAwareness(d.alignmentBreakdown.awareness || 0);
        setExecution(d.alignmentBreakdown.execution || 0);
        setPenalty(d.alignmentBreakdown.penalty || 0);
        setBreakdown(d.alignmentBreakdown.detail || null);
      }
      if (d.insight) setInsight(d.insight);
      if (d.suggestedAction) setSuggested(d.suggestedAction);
      if (d.checkIn?.loopType) setLoopType(d.checkIn.loopType);

      // Refresh slot status
      const slotRes = await api.get("/checkin/slot-status");
      const s = slotRes.data.data;
      setUsedSlots(s.usedSlots || []);
      setCurrentSlot(s.currentSlot || "Morning");
      setCanCheckIn(s.canCheckIn);

      setSelectedState("");
      setNoteText("");
      setShowCheckInForm(false);

      // Refresh streak
      const dashRes = await api.get("/checkin/dashboard");
      setStreak(dashRes.data.data.awarenessStreak || 0);
      setWeeklyLoops(dashRes.data.data.weeklyLoops || []);

      toast.success(`✅ ${d.currentSlot || currentSlot} check-in saved!`);
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to save check-in");
    } finally {
      setSaving(false);
    }
  };

  const handleRealizationChange = (val: string) => {
    setRealization(val);
    setRealSaved(false);
    if (realRef.current) clearTimeout(realRef.current);
    if (val.trim().length > 5 && slots.length > 0) {
      realRef.current = setTimeout(
        () => doSaveRealization(val, selectedTags),
        2000,
      );
    }
  };

  const doSaveRealization = async (text: string, tags: string[]) => {
    if (!text.trim() || slots.length === 0) return;
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
      await api.patch(
        `/goals/${todayActivity.goal._id}/day/${todayActivity.day.dayNumber}/complete`,
      );
      setTodayActivity((p: any) =>
        p ? { ...p, day: { ...p.day, status: "Completed" } } : p,
      );
      // Refresh score
      const dashRes = await api.get("/checkin/dashboard");
      const scoreData = dashRes.data.data.alignmentScore;
      if (scoreData) {
        setAlignScore(scoreData.score || 0);
        setExecution(scoreData.execution || 0);
        setPenalty(scoreData.penalty || 0);
        setBreakdown(scoreData.detail || null);
      }
      toast.success("✅ Activity completed! Score updated.");
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed");
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
    const text = `"${realization || insight}" — Alignment: ${alignScore}/100 #DoRDoD`;
    if (navigator.share) navigator.share({ text }).catch(() => {});
    else {
      navigator.clipboard.writeText(text);
      toast.success("Copied!");
    }
  };

  const allSlotsUsed = usedSlots.length >= 3;
  const hasDoneAnyCheckIn = slots.length > 0;

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
      <div className="space-y-5 animate-fade-in max-w-3xl mx-auto">
        {/* Greeting */}
        <div className="flex items-center justify-between">
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
          {awarenessStreak > 0 && (
            <div className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-full">
              <FaFire className="text-orange-500 w-3.5 h-3.5" />
              <span className="text-sm font-bold text-orange-600">
                {awarenessStreak}d streak
              </span>
            </div>
          )}
        </div>

        {/* ── ALIGNMENT SCORE ─────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-gray-900 text-lg">
                Alignment Score
              </h2>
              <p className="text-xs text-gray-400">
                Based on what you repeat daily
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <AlignmentRing score={alignScore} label={alignLabel} />
            <div className="flex-1 space-y-2.5 w-full">
              <ScoreBar
                label="Awareness"
                score={awareness}
                max={30}
                color="#3b82f6"
                icon="🧠"
                detail={
                  breakdown?.checkInDone
                    ? `✓ Check-in done${breakdown?.reflectionDone ? " · ✓ Reflection added" : " · Add reflection for +10"}`
                    : "Check in to earn +20"
                }
              />
              <ScoreBar
                label="Execution"
                score={execution}
                max={70}
                color="#22c55e"
                icon="⚡"
                detail={`${breakdown?.completed || 0} of ${breakdown?.totalActivities || 21} activities completed on time`}
              />
              <ScoreBar
                label="Penalty"
                score={Math.abs(penalty)}
                max={30}
                color="#ef4444"
                icon="⚠️"
                detail={
                  penalty < 0
                    ? `${penalty} applied — ${!breakdown?.reflectionDone ? "No reflection (-10)" : ""}${breakdown?.missedToday ? " Missed today (-5)" : ""}`
                    : "No penalties today 🎉"
                }
              />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-center gap-2 flex-wrap text-xs text-gray-500">
            <span className="font-bold text-blue-500 bg-blue-50 px-2 py-1 rounded-lg">
              Awareness {awareness}/30
            </span>
            <span>+</span>
            <span className="font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">
              Execution {execution}/70
            </span>
            <span>−</span>
            <span className="font-bold text-red-500 bg-red-50 px-2 py-1 rounded-lg">
              Penalty {Math.abs(penalty)}/30
            </span>
            <span>=</span>
            <span className="font-bold text-gray-800 bg-gray-100 px-2 py-1 rounded-lg">
              {alignScore}/100
            </span>
          </div>
        </div>

        {/* ── DAILY CHECK-IN — 3 SLOTS ─────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-gray-900">Daily Check-In</h2>
              <p className="text-xs text-gray-400">
                Up to 3 times per day — Morning, Midday, Evening
              </p>
            </div>
            <span
              className={`text-xs font-bold px-3 py-1.5 rounded-full ${allSlotsUsed ? "bg-green-100 text-green-700" : "bg-indigo-100 text-indigo-700"}`}
            >
              {slots.length}/3 done
            </span>
          </div>

          {/* Slots display — show all 3 slots with status */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {(["Morning", "Midday", "Evening"] as const).map((slotName) => {
              const cfg = SLOT_CONFIG[slotName];
              const doneSlot = slots.find((s) => s.slot === slotName);
              const isUsed = usedSlots.includes(slotName);
              const isCurrent = currentSlot === slotName && !isUsed;

              return (
                <div
                  key={slotName}
                  className={`rounded-xl p-3 border-2 text-center transition-all ${
                    isUsed
                      ? "bg-green-50 border-green-300"
                      : isCurrent
                        ? `${cfg.bg} border-current`
                        : "bg-gray-50 border-gray-100 opacity-60"
                  }`}
                >
                  <p className="text-xl mb-1">{cfg.emoji}</p>
                  <p
                    className={`text-xs font-bold ${isUsed ? "text-green-700" : cfg.color}`}
                  >
                    {cfg.label}
                  </p>
                  <p className="text-xs text-gray-400">{cfg.time}</p>
                  {isUsed && doneSlot ? (
                    <div className="mt-2">
                      <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-1">
                        <FaCheck className="text-white w-2.5 h-2.5" />
                      </div>
                      <p className="text-xs font-semibold text-green-700">
                        {doneSlot.state}
                      </p>
                      {doneSlot.time && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {doneSlot.time}
                        </p>
                      )}
                    </div>
                  ) : isCurrent ? (
                    <div className="mt-2">
                      <div className="w-5 h-5 border-2 border-current rounded-full mx-auto flex items-center justify-center">
                        <FaPlus className="w-2 h-2" />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Available</p>
                    </div>
                  ) : isUsed ? null : (
                    <div className="mt-2">
                      <FaLock className="w-4 h-4 text-gray-300 mx-auto" />
                      <p className="text-xs text-gray-300 mt-1">Not yet</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Show today's check-in notes */}
          {slots.length > 0 && (
            <div className="mb-4 p-3 bg-gray-50 rounded-xl">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Today's Check-ins
              </p>
              <div className="space-y-1.5">
                {slots.map((s, i) => {
                  const cfg = SLOT_CONFIG[s.slot as keyof typeof SLOT_CONFIG];
                  return (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <span>{cfg?.emoji}</span>
                      <span className="font-medium text-gray-700">
                        {s.slot}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          ["Calm", "Focused", "Energized"].includes(s.state)
                            ? "bg-green-100 text-green-700"
                            : ["Stressed", "Distracted"].includes(s.state)
                              ? "bg-red-100 text-red-700"
                              : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {s.state}
                      </span>
                      {s.time && (
                        <span className="text-xs text-gray-400">{s.time}</span>
                      )}
                      {s.note && (
                        <span className="text-xs text-gray-400 italic truncate">
                          — "{s.note}"
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Check-in Form — show only if current slot available */}
          {!allSlotsUsed && canCheckIn && (
            <>
              {!showCheckInForm ? (
                <button
                  onClick={() => setShowCheckInForm(true)}
                  className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                >
                  <FaPlus className="w-3 h-3" />
                  Check in for {currentSlot}
                  <span className="text-xs opacity-80">
                    (
                    {SLOT_CONFIG[currentSlot as keyof typeof SLOT_CONFIG]?.time}
                    )
                  </span>
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-700">
                      {
                        SLOT_CONFIG[currentSlot as keyof typeof SLOT_CONFIG]
                          ?.emoji
                      }{" "}
                      {currentSlot} — How are you feeling?
                    </p>
                    <button
                      onClick={() => {
                        setShowCheckInForm(false);
                        setSelectedState("");
                        setNoteText("");
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <FaTimes className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {STATES.map((s) => (
                      <button
                        key={s.value}
                        onClick={() => setSelectedState(s.value)}
                        className={`px-4 py-2 rounded-full border-2 font-medium text-sm transition-all hover:scale-105 ${selectedState === s.value ? s.active : s.bg}`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                  {selectedState && (
                    <input
                      placeholder="Add a note (optional)"
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    />
                  )}
                  <button
                    onClick={handleCheckIn}
                    disabled={saving || !selectedState}
                    className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-indigo-700 disabled:opacity-50 transition-all"
                  >
                    {saving ? "Saving..." : "Save Check-in"}
                  </button>
                </div>
              )}
            </>
          )}

          {/* All slots used */}
          {allSlotsUsed && (
            <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shrink-0">
                <FaCheck className="text-white w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-green-800">
                  All 3 check-ins completed today! 🎉
                </p>
                <p className="text-xs text-green-600">
                  Come back tomorrow for your next check-in.
                </p>
              </div>
            </div>
          )}

          {/* Current slot not available yet */}
          {!allSlotsUsed && !canCheckIn && (
            <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <FaLock className="text-amber-500 w-4 h-4 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-amber-800">
                  {usedSlots.includes("Morning") &&
                  !usedSlots.includes("Midday")
                    ? "Midday check-in opens at 12 PM"
                    : usedSlots.includes("Midday") &&
                        !usedSlots.includes("Evening")
                      ? "Evening check-in opens at 5 PM"
                      : "No check-in slot available right now"}
                </p>
                <p className="text-xs text-amber-600">
                  Missed slots cannot be filled later.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── TODAY'S ACTIONS ──────────────────────────────────────────────── */}
        {hasDoneAnyCheckIn && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-bold text-gray-900 mb-4">Today's Actions</h2>
            <div className="space-y-2">
              {/* Check-in status */}
              <div
                className={`flex items-center justify-between p-3 rounded-xl ${hasDoneAnyCheckIn ? "bg-green-50 border border-green-100" : "bg-gray-50"}`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${hasDoneAnyCheckIn ? "bg-green-500" : "bg-gray-200"}`}
                  >
                    {hasDoneAnyCheckIn ? (
                      <FaCheck className="text-white w-3.5 h-3.5" />
                    ) : (
                      <span>📋</span>
                    )}
                  </div>
                  <span className="text-sm font-medium text-gray-800">
                    Daily Check-In ({slots.length}/3 slots)
                  </span>
                </div>
                <span className="text-xs text-green-600 font-semibold">
                  {slots.length} done
                </span>
              </div>

              {/* Reflection */}
              <div
                className={`flex items-center justify-between p-3 rounded-xl ${realizationSaved ? "bg-green-50 border border-green-100" : "bg-gray-50"}`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${realizationSaved ? "bg-green-500" : "bg-gray-200"}`}
                  >
                    {realizationSaved ? (
                      <FaCheck className="text-white w-3.5 h-3.5" />
                    ) : (
                      <span>📝</span>
                    )}
                  </div>
                  <span
                    className={`text-sm font-medium ${realizationSaved ? "line-through text-gray-400" : "text-gray-800"}`}
                  >
                    Daily Reflection
                  </span>
                </div>
                {!realizationSaved ? (
                  <button
                    onClick={() =>
                      document.getElementById("reflection-box")?.focus()
                    }
                    className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg"
                  >
                    Write reflection
                  </button>
                ) : (
                  <span className="text-xs text-green-600 font-semibold">
                    ✓ Completed
                  </span>
                )}
              </div>

              {/* Today's activity */}
              {todayActivity && (
                <div
                  className={`flex items-center justify-between p-3 rounded-xl ${todayActivity.day.status === "Completed" ? "bg-green-50 border border-green-100" : "bg-gray-50"}`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${todayActivity.day.status === "Completed" ? "bg-green-500" : "bg-gray-200"}`}
                    >
                      {todayActivity.day.status === "Completed" ? (
                        <FaCheck className="text-white w-3.5 h-3.5" />
                      ) : (
                        <span>⚡</span>
                      )}
                    </div>
                    <div>
                      <span
                        className={`text-sm font-medium ${todayActivity.day.status === "Completed" ? "line-through text-gray-400" : "text-gray-800"}`}
                      >
                        {todayActivity.day.title}
                      </span>
                      <p className="text-xs text-gray-400">
                        {todayActivity.goal.title} — Day{" "}
                        {todayActivity.day.dayNumber}/21
                      </p>
                    </div>
                  </div>
                  {todayActivity.day.status === "Completed" ? (
                    <span className="text-xs text-green-600 font-semibold">
                      ✓ Done
                    </span>
                  ) : (
                    <button
                      onClick={handleCompleteActivity}
                      className="text-xs font-semibold text-white bg-green-500 hover:bg-green-600 px-3 py-1.5 rounded-lg transition-all"
                    >
                      ✓ Mark Done
                    </button>
                  )}
                </div>
              )}
            </div>
            <p className="text-sm text-center text-gray-400 italic mt-4">
              {alignScore >= 70
                ? "🌟 You're aligned! Keep going!"
                : alignScore >= 40
                  ? "👍 You're improving. Keep it up!"
                  : "💪 Every action counts. Start with one step."}
            </p>
          </div>
        )}

        {/* ── INSIGHT ─────────────────────────────────────────────────────── */}
        {hasDoneAnyCheckIn && insight && (
          <div className="bg-white rounded-2xl border-l-4 border-indigo-400 shadow-sm p-5">
            <p className="text-xs font-bold text-indigo-400 uppercase tracking-wide mb-2">
              💡 Today's Insight
            </p>
            <p className="text-sm text-gray-700 leading-relaxed">{insight}</p>
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

        {/* ── REFLECTION ──────────────────────────────────────────────────── */}
        {hasDoneAnyCheckIn && (
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
                  <span className="text-green-600">✓ Saved to Insights</span>
                ) : (
                  "Auto-saves as you type"
                )}
              </div>
            </div>
            {!realizationSaved && !breakdown?.reflectionDone && (
              <div className="flex items-center gap-2 mb-3 p-2.5 bg-amber-50 border border-amber-100 rounded-xl">
                <span>⚠️</span>
                <p className="text-xs text-amber-700">
                  No reflection added yet. Adding one removes the −10 penalty
                  and adds +10 awareness.
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
                  <FaTag className="w-3 h-3" /> Tag:
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
                  📝 Had a Guidance session? →
                </button>
                <button
                  onClick={handleShare}
                  className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 border border-indigo-200 hover:bg-indigo-50 px-3 py-1.5 rounded-lg"
                >
                  <FaShareAlt className="w-3 h-3" /> Share
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── POST-GUIDANCE ─────────────────────────────────────────────── */}
        {showPostGuidance && !guidanceDone && hasDoneAnyCheckIn && (
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
                className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-indigo-700"
              >
                ✅ Record Update
              </button>
            </div>
          </div>
        )}

        {/* ── WEEKLY PATTERNS ──────────────────────────────────────────────── */}
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

        {/* ── QUOTE ───────────────────────────────────────────────────────── */}
        <div className="bg-indigo-600 rounded-2xl p-6 text-center">
          <p className="text-white font-semibold text-base leading-relaxed">
            "{quote}"
          </p>
        </div>

        {/* Quick nav — only when no check-in done */}
        {!hasDoneAnyCheckIn && (
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
