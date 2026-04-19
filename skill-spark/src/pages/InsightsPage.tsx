import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/utils/api";
import toast from "react-hot-toast";
import {
  FaShareAlt,
  FaFire,
  FaQuoteLeft,
  FaArrowRight,
  FaLightbulb,
  FaTag,
  FaBrain,
  FaTimes,
  FaCheckCircle,
} from "react-icons/fa";

// ── Daily quotes ──────────────────────────────────────────────────────────────
const QUOTES = [
  { text: "You are not lazy. You are in a loop. Break it.", author: "DoR-DoD" },
  { text: "Awareness is the first step. You took it.", author: "DoR-DoD" },
  {
    text: "The gap between intention and action is where growth happens.",
    author: "DoR-DoD",
  },
  { text: "Self-awareness is the beginning of all change.", author: "DoR-DoD" },
  {
    text: "The secret of getting ahead is getting started.",
    author: "Mark Twain",
  },
  {
    text: "It always seems impossible until it's done.",
    author: "Nelson Mandela",
  },
  {
    text: "The future depends on what you do today.",
    author: "Mahatma Gandhi",
  },
  { text: "We become what we repeatedly do.", author: "Aristotle" },
  {
    text: "Do something today that your future self will thank you for.",
    author: "Sean Patrick Flanery",
  },
  {
    text: "Discipline is the bridge between goals and accomplishment.",
    author: "Jim Rohn",
  },
  { text: "One day or day one. You decide.", author: "Unknown" },
  {
    text: "You are not lacking clarity. You might be avoiding.",
    author: "DoR-DoD",
  },
];
const getDailyQuote = () =>
  QUOTES[Math.floor(Date.now() / 86400000) % QUOTES.length];

// ── State config ──────────────────────────────────────────────────────────────
const STATES = [
  {
    value: "Clear",
    label: "Clear",
    base: "bg-green-100  text-green-700  border-green-300",
    active: "bg-green-500  text-white border-green-500",
  },
  {
    value: "Confused",
    label: "Confused",
    base: "bg-yellow-100 text-yellow-700 border-yellow-300",
    active: "bg-yellow-500 text-white border-yellow-500",
  },
  {
    value: "Avoiding",
    label: "Avoiding",
    base: "bg-red-100    text-red-700    border-red-300",
    active: "bg-red-500    text-white border-red-500",
  },
  {
    value: "Focused",
    label: "Focused",
    base: "bg-blue-100   text-blue-700   border-blue-300",
    active: "bg-blue-500   text-white border-blue-500",
  },
  {
    value: "Anxious",
    label: "Anxious",
    base: "bg-purple-100 text-purple-700 border-purple-300",
    active: "bg-purple-500 text-white border-purple-500",
  },
];

// ── Clarity label config ──────────────────────────────────────────────────────
const CLARITY_LABEL: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  High: {
    bg: "bg-success/10",
    text: "text-success",
    border: "border-success/40",
  },
  Moderate: {
    bg: "bg-secondary/10",
    text: "text-secondary",
    border: "border-secondary/40",
  },
  Low: {
    bg: "bg-destructive/10",
    text: "text-destructive",
    border: "border-destructive/40",
  },
};

// ── Severity config ───────────────────────────────────────────────────────────
const SEVERITY: Record<string, { bg: string; text: string; border: string }> = {
  High: { bg: "bg-red-50", text: "text-red-600", border: "border-red-200" },
  Medium: {
    bg: "bg-orange-50",
    text: "text-orange-600",
    border: "border-orange-200",
  },
  Low: {
    bg: "bg-yellow-50",
    text: "text-yellow-600",
    border: "border-yellow-200",
  },
  None: {
    bg: "bg-muted",
    text: "text-foreground-muted",
    border: "border-border",
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

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const quote = getDailyQuote();

  // Check-in
  const [selectedState, setSelectedState] = useState("");
  const [avoidingText, setAvoidingText] = useState("");
  const [mattersText, setMattersText] = useState("");
  const [checkInDone, setCheckInDone] = useState(false);
  const [saving, setSaving] = useState(false);

  // Post check-in data — all from API
  const [confirmation, setConfirmation] = useState("");
  const [clarityScore, setClarityScore] = useState(0);
  const [clarityLabel, setClarityLabel] = useState<{
    label: string;
    color: string;
    bg: string;
  } | null>(null);
  const [clarityBreakdown, setBreakdown] = useState<{
    awareness: number;
    alignment: number;
    loopPenalty: number;
  } | null>(null);
  const [insight, setInsight] = useState<string | null>(null);
  const [suggestedAction, setSuggested] = useState<{
    text: string;
    type: string;
    showGuidance: boolean;
  } | null>(null);
  const [loopType, setLoopType] = useState("None");
  const [loopSeverity, setLoopSeverity] = useState("None");
  const [weeklyLoops, setWeeklyLoops] = useState<
    { pattern: string; count: number; severity: string }[]
  >([]);
  const [external, setExternal] = useState({
    execution: 0,
    behavior: 0,
    growth: 0,
  });
  const [awarenessStreak, setStreak] = useState(0);
  const [xpData, setXpData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showGuidanceCTA, setShowGuidanceCTA] = useState(false);
  const [guidanceDone, setGuidanceDone] = useState(false);

  // Realization
  const [realization, setRealization] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [realizationSaved, setRealSaved] = useState(false);
  const [savingReal, setSavingReal] = useState(false);

  // Post-guidance
  const [showPostGuidance, setShowPostGuidance] = useState(false);
  const [guidanceForm, setGuidanceForm] = useState({
    goalUpdate: "",
    behaviorSuggestion: "",
    insight: "",
  });
  const [savingGuidance, setSavingGuidance] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("onboarded")) {
      navigate("/onboarding");
      return;
    }
    const load = async () => {
      try {
        const [dashRes, xpRes] = await Promise.all([
          api.get("/checkin/dashboard"),
          api.get("/xp/me").catch(() => ({ data: { data: null } })),
        ]);
        const d = dashRes.data.data;
        setStreak(d.awarenessStreak || 0);
        setExternal(
          d.externalSystem || { execution: 0, behavior: 0, growth: 0 },
        );
        setWeeklyLoops(d.weeklyLoops || []);
        setXpData(xpRes.data.data);

        if (d.todayCheckIn) {
          const ci = d.todayCheckIn;
          setCheckInDone(true);
          setSelectedState(ci.dailyState || "");
          setClarityScore(ci.clarityScore || 0);
          setLoopType(ci.loopType || "None");
          setLoopSeverity(ci.loopSeverity || "None");
          setRealization(ci.realization || "");
          setSelectedTags(ci.realizationTags || []);
          setGuidanceDone(ci.guidanceSessionDone || false);
          if (ci.realization) setRealSaved(true);
          // Restore CTA visibility
          if (
            ci.loopType !== "None" ||
            ["Avoiding", "Confused", "Anxious"].includes(ci.dailyState)
          ) {
            setShowGuidanceCTA(true);
          }
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
        avoidingText,
        mattersTodayText: mattersText,
      });
      const d = res.data.data;
      setCheckInDone(true);
      setConfirmation(d.confirmation || "");
      setClarityScore(
        d.clarityBreakdown?.score || d.checkIn?.clarityScore || 0,
      );
      setClarityLabel(d.clarityLabel || null);
      setBreakdown(d.clarityBreakdown || null);
      setInsight(d.insight || null);
      setSuggested(d.suggestedAction || null);
      setLoopType(d.checkIn?.loopType || "None");
      setLoopSeverity(d.checkIn?.loopSeverity || "None");
      setWeeklyLoops(d.weeklyLoops || []);
      setExternal(d.externalSystem || external);
      if (
        d.checkIn?.loopType !== "None" ||
        ["Avoiding", "Confused", "Anxious"].includes(selectedState)
      ) {
        setShowGuidanceCTA(true);
      }
      // Refresh streak
      const dash = await api.get("/checkin/dashboard");
      setStreak(dash.data.data.awarenessStreak || 0);
      toast.success("✅ Check-in saved!");
    } catch {
      toast.error("Failed to save check-in");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveRealization = async () => {
    if (!realization.trim()) return;
    setSavingReal(true);
    try {
      await api.patch("/checkin/realization", {
        realization,
        realizationTags: selectedTags,
      });
      setRealSaved(true);
      toast.success("Saved to Insights! 🌟");
    } catch {
      toast.error("Failed to save");
    } finally {
      setSavingReal(false);
    }
  };

  const handleShare = () => {
    const tags = selectedTags.length ? ` [${selectedTags.join(", ")}]` : "";
    const text = `Today's realization: "${realization || insight}"${tags} | Mind State: ${selectedState} | Clarity: ${clarityScore}/100 #DoRDoD`;
    if (navigator.share)
      navigator.share({ title: "My DoR-DoD Insight", text }).catch(() => {});
    else {
      navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard!");
    }
  };

  const handleGetGuidance = () => {
    sessionStorage.setItem(
      "guidanceContext",
      JSON.stringify({
        goal: mattersText || avoidingText || "",
        loopType,
        mindState: selectedState,
      }),
    );
    navigate("/guidance");
  };

  const handleSaveGuidanceUpdate = async () => {
    setSavingGuidance(true);
    try {
      await api.post("/checkin/guidance-update", guidanceForm);
      setGuidanceDone(true);
      setShowPostGuidance(false);
      toast.success("✅ System updated from Guidance session!");
    } catch {
      toast.error("Failed");
    } finally {
      setSavingGuidance(false);
    }
  };

  const toggleTag = (tag: string) =>
    setSelectedTags((p) =>
      p.includes(tag) ? p.filter((t) => t !== tag) : [...p, tag],
    );

  const stateBtn = (s: (typeof STATES)[0]) =>
    selectedState === s.value ? s.active : s.base;

  const labelCfg = clarityLabel
    ? CLARITY_LABEL[clarityLabel.label] || CLARITY_LABEL.Low
    : null;
  const severityCfg = SEVERITY[loopSeverity] || SEVERITY.None;

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
      <div className="space-y-5 animate-fade-in max-w-3xl mx-auto">
        {/* Quote of the Day */}
        <div className="card-elevated bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/10">
          <div className="flex gap-3">
            <FaQuoteLeft className="text-primary/40 text-2xl shrink-0 mt-0.5" />
            <div>
              <p className="text-sm md:text-base italic font-medium leading-relaxed">
                "{quote.text}"
              </p>
              <p className="text-xs text-foreground-muted mt-1.5">
                — {quote.author}
              </p>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            1. DAILY CHECK-IN — first interaction, once per day
        ══════════════════════════════════════════════════════════════════ */}
        <div className="card-elevated">
          <div className="flex items-center gap-2 mb-1">
            <FaBrain className="text-primary w-4 h-4" />
            <h2 className="text-xl font-bold">
              Hi {(user as any)?.name?.split(" ")[0]}, how are you right now?
            </h2>
          </div>
          <p className="text-sm text-foreground-muted mb-4">
            Your current state is the starting point for everything today.
          </p>

          {/* State selector */}
          <div className="flex flex-wrap gap-2 mb-4">
            {STATES.map((s) => (
              <button
                key={s.value}
                onClick={() => !checkInDone && setSelectedState(s.value)}
                disabled={checkInDone}
                className={`px-4 py-2 rounded-full border-2 font-medium text-sm transition-all ${stateBtn(s)} ${checkInDone && selectedState !== s.value ? "opacity-35 cursor-default" : "hover:scale-105"}`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* 2. Follow-up questions */}
          {!checkInDone && selectedState && (
            <div className="space-y-2.5 mb-4">
              <input
                placeholder="What are you avoiding?"
                value={avoidingText}
                onChange={(e) => setAvoidingText(e.target.value)}
                className="input-field text-sm"
              />
              <input
                placeholder="What matters today?"
                value={mattersText}
                onChange={(e) => setMattersText(e.target.value)}
                className="input-field text-sm"
              />
            </div>
          )}

          {!checkInDone ? (
            <button
              onClick={handleCheckIn}
              disabled={saving || !selectedState}
              className="btn-primary w-full disabled:opacity-50 flex items-center justify-center gap-2 py-3"
            >
              {saving ? "Saving..." : "Check In for Today"}
              {!saving && <FaArrowRight className="w-3 h-3" />}
            </button>
          ) : (
            /* 3. CHECK-IN CONFIRMATION — reinforce behavior */
            <div className="flex items-start gap-3 p-3 bg-success/10 border border-success/30 rounded-xl">
              <FaCheckCircle className="text-success mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-success">
                  Checked in as <strong>{selectedState}</strong>
                </p>
                {confirmation && (
                  <p className="text-sm text-foreground-muted mt-0.5">
                    {confirmation}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            POST CHECK-IN — full connected system
        ══════════════════════════════════════════════════════════════════ */}
        {checkInDone && (
          <>
            {/* ── 2. INTERNAL SYSTEM ─────────────────────────────────────── */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="card-elevated space-y-4">
                <h3 className="font-bold text-base">Internal System</h3>

                {/* Clarity Score + Label */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-foreground-muted uppercase tracking-wide">
                      Clarity Score
                    </p>
                    {/* Clarity Label — Low/Moderate/High */}
                    {clarityLabel && labelCfg && (
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full border ${labelCfg.bg} ${labelCfg.text} ${labelCfg.border}`}
                      >
                        {clarityLabel.label} Clarity
                      </span>
                    )}
                  </div>
                  <p className="text-5xl font-black text-primary leading-none">
                    {clarityScore}
                  </p>
                  <p className="text-xs text-foreground-muted">out of 100</p>
                  <div className="w-full bg-muted rounded-full h-2.5 mt-2">
                    <div
                      className={`h-2.5 rounded-full transition-all duration-700 ${
                        clarityScore >= 70
                          ? "bg-success"
                          : clarityScore >= 40
                            ? "bg-primary"
                            : "bg-destructive"
                      }`}
                      style={{ width: `${clarityScore}%` }}
                    />
                  </div>
                  {/* Formula breakdown tooltip */}
                  {clarityBreakdown && (
                    <div className="mt-2 grid grid-cols-3 gap-1 text-center">
                      <div className="bg-muted rounded-lg p-1.5">
                        <p className="text-xs font-bold text-success">
                          +{clarityBreakdown.awareness}
                        </p>
                        <p className="text-xs text-foreground-muted">
                          Awareness
                        </p>
                      </div>
                      <div className="bg-muted rounded-lg p-1.5">
                        <p className="text-xs font-bold text-primary">
                          +{clarityBreakdown.alignment}
                        </p>
                        <p className="text-xs text-foreground-muted">
                          Alignment
                        </p>
                      </div>
                      <div className="bg-muted rounded-lg p-1.5">
                        <p className="text-xs font-bold text-destructive">
                          −{clarityBreakdown.loopPenalty}
                        </p>
                        <p className="text-xs text-foreground-muted">
                          Loop Penalty
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Insight Card — rule-based */}
                {insight && (
                  <div
                    className={`rounded-xl border p-3 ${
                      loopType !== "None"
                        ? `${severityCfg.bg} ${severityCfg.border}`
                        : "bg-muted border-border"
                    }`}
                  >
                    {loopType !== "None" && (
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-bold uppercase tracking-wide flex items-center gap-1.5">
                          <FaLightbulb
                            className={`w-3 h-3 ${severityCfg.text}`}
                          />
                          Loop: {loopType}
                        </p>
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full border ${severityCfg.bg} ${severityCfg.text} ${severityCfg.border}`}
                        >
                          {loopSeverity} Severity
                        </span>
                      </div>
                    )}
                    <p className="text-sm leading-relaxed">{insight}</p>

                    {/* ACTION BUTTONS — Primary always + Secondary only when applicable */}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {/* PRIMARY CTA — always present */}
                      <button
                        onClick={() => {
                          toast.success(
                            suggestedAction?.text ||
                              "Starting your small step!",
                          );
                        }}
                        className="text-sm bg-primary text-primary-foreground px-4 py-2 rounded-xl font-semibold hover:opacity-90 transition-all flex items-center gap-1.5"
                      >
                        ⚡ Start Small Step
                      </button>
                      {/* SECONDARY CTA — only when applicable (loop/low clarity/negative state) */}
                      {showGuidanceCTA && !guidanceDone && (
                        <button
                          onClick={handleGetGuidance}
                          className="text-sm border border-secondary/40 text-secondary hover:bg-secondary/10 px-4 py-2 rounded-xl font-medium transition-all"
                        >
                          🧭 Explore Guidance (Optional)
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* No loop — clean positive state */}
                {!insight && loopType === "None" && (
                  <div className="bg-success/10 border border-success/20 rounded-xl p-3">
                    <p className="text-sm text-success font-medium">
                      {selectedState === "Clear" &&
                        "✨ Clear state. Move forward with intention."}
                      {selectedState === "Focused" &&
                        "🎯 Focused. Protect this time and go deep."}
                      {!["Clear", "Focused"].includes(selectedState) &&
                        "✅ No patterns detected today. Keep going."}
                    </p>
                    <button
                      onClick={() => toast.success("Starting your small step!")}
                      className="text-sm bg-primary text-primary-foreground px-4 py-2 rounded-xl font-semibold hover:opacity-90 transition-all flex items-center gap-1.5 mt-2"
                    >
                      ⚡ Start Small Step
                    </button>
                  </div>
                )}

                {/* 5. Suggested Action — based on state + loop */}
                {suggestedAction && (
                  <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-xl p-3">
                    <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">
                      ⚡ Suggested Action
                    </p>
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                      {suggestedAction.text}
                    </p>
                  </div>
                )}
              </div>

              {/* ── 3. EXTERNAL SYSTEM ───────────────────────────────────── */}
              <div className="card-elevated space-y-4">
                <h3 className="font-bold text-base">External System</h3>
                <div className="space-y-3">
                  {[
                    {
                      label: "Execution (Intent / Goals)",
                      val: external.execution,
                      color: "#6366f1",
                      note: "Based on goals completion",
                    },
                    {
                      label: "Behavior (Habits)",
                      val: external.behavior,
                      color: "#ef4444",
                      note: "Based on tracked habits",
                    },
                    {
                      label: "Growth (Knowledge)",
                      val: external.growth,
                      color: "#22c55e",
                      note: "Based on learning progress",
                    },
                  ].map((item, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-foreground-muted font-medium">
                          {item.label}
                        </span>
                        <span
                          className="font-bold"
                          style={{ color: item.color }}
                        >
                          {item.val}%
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all duration-700"
                          style={{
                            width: `${item.val}%`,
                            background: item.color,
                          }}
                        />
                      </div>
                      <p className="text-xs text-foreground-muted/60 mt-0.5">
                        {item.note}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Awareness Streak with meaning */}
                <div className="pt-3 border-t border-border">
                  <div className="flex items-center gap-2 mb-1">
                    <FaFire className="text-destructive" />
                    <p className="text-xs text-foreground-muted uppercase tracking-wide">
                      Awareness Streak
                    </p>
                  </div>
                  <p className="text-2xl font-black text-destructive">
                    {awarenessStreak}{" "}
                    <span className="text-sm font-normal">
                      {awarenessStreak === 1 ? "day" : "days"}
                    </span>
                  </p>
                  <p className="text-xs text-foreground-muted mt-0.5">
                    {awarenessStreak === 0 &&
                      "Start your reflection streak today 🌱"}
                    {awarenessStreak === 1 &&
                      "You reflected today — day 1 begins 🌱"}
                    {awarenessStreak >= 2 &&
                      awarenessStreak < 7 &&
                      `You reflected ${awarenessStreak} days — awareness building 🔥`}
                    {awarenessStreak >= 7 &&
                      awarenessStreak < 14 &&
                      `You reflected ${awarenessStreak} days — strong pattern 💪`}
                    {awarenessStreak >= 14 &&
                      `You reflected ${awarenessStreak} days — self-awareness mastery 👑`}
                  </p>
                </div>

                {/* XP summary */}
                {xpData && (
                  <div className="pt-3 border-t border-border flex items-center justify-between">
                    <div className="flex gap-4">
                      <div>
                        <p className="text-xs text-foreground-muted">Level</p>
                        <p className="text-sm font-bold">{xpData.levelName}</p>
                      </div>
                      <div>
                        <p className="text-xs text-foreground-muted">XP</p>
                        <p className="text-sm font-bold text-primary">
                          {xpData.totalXP?.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate("/leaderboard")}
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      Progress Board <FaArrowRight className="w-2.5 h-2.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* ── 4. LOOP TRACKER — "This Week's Patterns" ───────────────── */}
            {weeklyLoops.length > 0 && (
              <div className="card-elevated">
                <h3 className="font-bold text-base mb-3">
                  This Week's Patterns
                </h3>
                <div className="space-y-2">
                  {weeklyLoops.map((loop, i) => {
                    const sc = SEVERITY[loop.severity] || SEVERITY.Low;
                    return (
                      <div
                        key={i}
                        className={`flex items-center justify-between rounded-xl px-4 py-3 border ${sc.bg} ${sc.border}`}
                      >
                        <p className={`text-sm font-medium ${sc.text}`}>
                          {loop.pattern}
                        </p>
                        <div className="flex items-center gap-2 shrink-0 ml-3">
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded-full border ${sc.bg} ${sc.text} ${sc.border}`}
                          >
                            {loop.severity}
                          </span>
                          <span className={`text-xs font-bold ${sc.text}`}>
                            {loop.count}×
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-foreground-muted mt-3 italic">
                  Loops aren't failures — they're patterns waiting to be
                  understood.
                </p>
              </div>
            )}

            {/* Non-intrusive Guidance suggestion */}
            {showGuidanceCTA && !guidanceDone && (
              <div className="flex items-center justify-between p-3.5 bg-muted/60 rounded-xl border border-border">
                <p className="text-sm text-foreground-muted">
                  🧭 Guidance is available if you want to explore this pattern
                  deeper.
                </p>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <button
                    onClick={handleGetGuidance}
                    className="text-xs text-secondary font-semibold hover:underline whitespace-nowrap"
                  >
                    Explore →
                  </button>
                  <button
                    onClick={() => setShowGuidanceCTA(false)}
                    className="text-foreground-muted hover:text-foreground p-1"
                  >
                    <FaTimes className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}

            {/* ── 8. TODAY'S REALIZATION ─────────────────────────────────── */}
            <div
              className="card-elevated"
              style={{
                background: "linear-gradient(135deg,#f5f3ff 0%,#faf5ff 100%)",
              }}
            >
              <h3 className="font-bold text-base mb-2">Today's Realization</h3>
              <textarea
                placeholder="Write your realization..."
                value={realization}
                onChange={(e) => {
                  setRealization(e.target.value);
                  setRealSaved(false);
                }}
                className="w-full bg-white dark:bg-card border border-border rounded-xl p-3 text-sm resize-none outline-none focus:ring-2 focus:ring-primary/30 min-h-[80px]"
              />

              {/* Tags */}
              {realization.trim().length > 5 && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-foreground-muted mb-2 flex items-center gap-1">
                    <FaTag className="w-3 h-3" /> Tag this realization:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {REALIZATION_TAGS.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`text-xs px-3 py-1 rounded-full border transition-all ${
                          selectedTags.includes(tag)
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-white border-border text-foreground-muted hover:border-primary/50"
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between mt-3">
                <div className="flex gap-2 items-center">
                  {realization.trim() && (
                    <button
                      onClick={handleSaveRealization}
                      disabled={savingReal || realizationSaved}
                      className={`text-xs px-3 py-2 rounded-lg font-medium transition-all flex items-center gap-1 ${
                        realizationSaved
                          ? "bg-success/10 text-success border border-success/30"
                          : "btn-secondary"
                      }`}
                    >
                      {realizationSaved
                        ? "✅ Saved to Insights"
                        : savingReal
                          ? "Saving..."
                          : "💾 Save to Insights"}
                    </button>
                  )}
                </div>
                {realization.trim() && (
                  <button
                    onClick={handleShare}
                    className="flex items-center gap-2 text-sm font-medium text-primary hover:bg-primary/10 px-3 py-2 rounded-xl transition-all border border-primary/20"
                  >
                    <FaShareAlt className="w-3 h-3" /> Share Insight
                  </button>
                )}
              </div>

              {/* Link to post-guidance update */}
              {!guidanceDone && (
                <div className="mt-3 pt-3 border-t border-purple-200/50">
                  <button
                    onClick={() => setShowPostGuidance((p) => !p)}
                    className="text-xs text-secondary hover:underline"
                  >
                    📝 Had a Guidance session today? Record the update →
                  </button>
                </div>
              )}

              {guidanceDone && (
                <div className="mt-3 pt-3 border-t border-purple-200/50">
                  <p className="text-xs text-success flex items-center gap-1">
                    <FaCheckCircle className="w-3 h-3" /> Guidance session
                    recorded — system updated
                  </p>
                </div>
              )}
            </div>

            {/* Post-guidance update form */}
            {showPostGuidance && !guidanceDone && (
              <div className="card-elevated">
                <h3 className="font-bold mb-3">
                  After Guidance — Update Your System
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-foreground-muted">
                      🎯 Intent update
                    </label>
                    <input
                      placeholder="What will you focus on differently?"
                      value={guidanceForm.goalUpdate}
                      onChange={(e) =>
                        setGuidanceForm((p) => ({
                          ...p,
                          goalUpdate: e.target.value,
                        }))
                      }
                      className="input-field mt-1 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground-muted">
                      🔥 Behavior to try
                    </label>
                    <input
                      placeholder="What will you do differently?"
                      value={guidanceForm.behaviorSuggestion}
                      onChange={(e) =>
                        setGuidanceForm((p) => ({
                          ...p,
                          behaviorSuggestion: e.target.value,
                        }))
                      }
                      className="input-field mt-1 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground-muted">
                      💡 Key insight
                    </label>
                    <textarea
                      placeholder="What did you realize?"
                      value={guidanceForm.insight}
                      onChange={(e) =>
                        setGuidanceForm((p) => ({
                          ...p,
                          insight: e.target.value,
                        }))
                      }
                      className="input-field min-h-[60px] mt-1 text-sm"
                    />
                  </div>
                  <button
                    onClick={handleSaveGuidanceUpdate}
                    disabled={savingGuidance}
                    className="btn-primary w-full disabled:opacity-50"
                  >
                    {savingGuidance ? "Saving..." : "✅ Record Guidance Update"}
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Pre-check-in quick nav */}
        {!checkInDone && !selectedState && (
          <div className="card-elevated">
            <h3 className="font-semibold mb-3 text-sm text-foreground-muted uppercase tracking-wide">
              Quick Navigation
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Intent", emoji: "🎯", path: "/goals" },
                { label: "Behavior", emoji: "🔥", path: "/habits" },
                { label: "Knowledge", emoji: "📚", path: "/learning" },
                { label: "Execution", emoji: "⚡", path: "/activities" },
              ].map((a, i) => (
                <button
                  key={i}
                  onClick={() => navigate(a.path)}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted hover:bg-accent font-medium text-sm transition-all"
                >
                  <span className="text-2xl">{a.emoji}</span>
                  <span>{a.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
