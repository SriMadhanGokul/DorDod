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
  FaLightbulb,
  FaArrowRight,
  FaExclamationTriangle,
  FaCheckCircle,
  FaTag,
  FaBrain,
} from "react-icons/fa";

// ── Daily quotes ─────────────────────────────────────────────────────────────
const QUOTES = [
  { text: "You are not lazy. You are in a loop. Break it.", author: "DoR-DoD" },
  {
    text: "Awareness is the first step. You took it by opening this app.",
    author: "DoR-DoD",
  },
  {
    text: "The gap between intention and action is where growth happens.",
    author: "DoR-DoD",
  },
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
  { text: "Little by little, one travels far.", author: "J.R.R. Tolkien" },
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
    text: "Don't watch the clock; do what it does. Keep going.",
    author: "Sam Levenson",
  },
  {
    text: "Act as if what you do makes a difference. It does.",
    author: "William James",
  },
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
    color: "bg-green-100  text-green-700  border-green-300",
    active: "bg-green-500  text-white border-green-500",
  },
  {
    value: "Confused",
    label: "Confused",
    color: "bg-yellow-100 text-yellow-700 border-yellow-300",
    active: "bg-yellow-500 text-white border-yellow-500",
  },
  {
    value: "Avoiding",
    label: "Avoiding",
    color: "bg-red-100    text-red-700    border-red-300",
    active: "bg-red-500    text-white border-red-500",
  },
  {
    value: "Focused",
    label: "Focused",
    color: "bg-blue-100   text-blue-700   border-blue-300",
    active: "bg-blue-500   text-white border-blue-500",
  },
  {
    value: "Anxious",
    label: "Anxious",
    color: "bg-purple-100 text-purple-700 border-purple-300",
    active: "bg-purple-500 text-white border-purple-500",
  },
];

// ── Severity badge ────────────────────────────────────────────────────────────
const SEVERITY_CFG: Record<string, { color: string; icon: any; bg: string }> = {
  Low: {
    color: "text-yellow-600",
    icon: FaExclamationTriangle,
    bg: "bg-yellow-50 border-yellow-200",
  },
  Medium: {
    color: "text-orange-600",
    icon: FaExclamationTriangle,
    bg: "bg-orange-50 border-orange-200",
  },
  High: {
    color: "text-red-600",
    icon: FaExclamationTriangle,
    bg: "bg-red-50    border-red-200",
  },
  None: {
    color: "text-success",
    icon: FaCheckCircle,
    bg: "bg-success/10 border-success/20",
  },
};

// ── Realization tags ──────────────────────────────────────────────────────────
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

  // Check-in state
  const [selectedState, setSelectedState] = useState("");
  const [avoidingText, setAvoidingText] = useState("");
  const [mattersText, setMattersText] = useState("");
  const [checkInDone, setCheckInDone] = useState(false);
  const [savingCheckIn, setSavingCheckIn] = useState(false);

  // Post check-in data
  const [insight, setInsight] = useState<string | null>(null);
  const [suggestedAction, setSuggested] = useState<{
    text: string;
    type: string;
    showGuidance: boolean;
  } | null>(null);
  const [weeklyLoops, setWeeklyLoops] = useState<
    { pattern: string; count: number; severity: string }[]
  >([]);
  const [clarityScore, setClarityScore] = useState(0);
  const [loopType, setLoopType] = useState("None");
  const [loopSeverity, setLoopSeverity] = useState("None");
  const [awarenessStreak, setAwarenessStreak] = useState(0);
  const [external, setExternal] = useState({
    execution: 0,
    behavior: 0,
    growth: 0,
  });
  const [xpData, setXpData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Realization with tags
  const [realization, setRealization] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [savingReal, setSavingReal] = useState(false);
  const [realizationSaved, setRealizationSaved] = useState(false);

  // Guidance context (items #10, #11, #12)
  const [showGuidanceCTA, setShowGuidanceCTA] = useState(false);
  const [guidanceDone, setGuidanceDone] = useState(false);
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
        const [insightRes, xpRes] = await Promise.all([
          api.get("/checkin/dashboard"),
          api.get("/xp/me").catch(() => ({ data: { data: null } })),
        ]);
        const d = insightRes.data.data;
        setAwarenessStreak(d.awarenessStreak || 0);
        setExternal(
          d.externalSystem || { execution: 0, behavior: 0, growth: 0 },
        );
        setWeeklyLoops(d.weeklyLoops || []);
        setXpData(xpRes.data.data);

        if (d.todayCheckIn) {
          setCheckInDone(true);
          setClarityScore(d.todayCheckIn.clarityScore || 0);
          setLoopType(d.todayCheckIn.loopType || "None");
          setLoopSeverity(d.todayCheckIn.loopSeverity || "None");
          setSelectedState(d.todayCheckIn.dailyState || "");
          setRealization(d.todayCheckIn.realization || "");
          setSelectedTags(d.todayCheckIn.realizationTags || []);
          setGuidanceDone(d.todayCheckIn.guidanceSessionDone || false);
          if (d.todayCheckIn.realization) setRealizationSaved(true);
          // Restore suggested action
          setSuggested(
            buildSuggestedAction(
              d.todayCheckIn.dailyState,
              d.todayCheckIn.loopType,
            ),
          );
          // Restore insight
          setInsight(
            buildInsight(d.todayCheckIn.loopType, d.todayCheckIn.dailyState),
          );
          // Show Guidance CTA if loop detected
          if (
            d.todayCheckIn.loopType !== "None" ||
            ["Avoiding", "Confused", "Anxious"].includes(
              d.todayCheckIn.dailyState,
            )
          ) {
            setShowGuidanceCTA(true);
          }
        }
      } catch {
        toast.error("Failed to load");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const buildSuggestedAction = (state: string, loop: string) => {
    if (loop === "Avoidance" || state === "Avoiding")
      return {
        text: "Start with 1 small step (5 minutes)",
        type: "micro-action",
        showGuidance: true,
      };
    if (loop === "Overthinking" || state === "Confused")
      return {
        text: "Define 1 priority for today only",
        type: "clarity",
        showGuidance: true,
      };
    if (loop === "Inconsistency")
      return {
        text: "Pick 1 behavior to repeat today — just once",
        type: "consistency",
        showGuidance: false,
      };
    if (state === "Anxious")
      return {
        text: "Write down what worries you most — then set it aside",
        type: "grounding",
        showGuidance: true,
      };
    if (state === "Focused")
      return {
        text: "Protect this focused time — go deep on your top intent",
        type: "protect",
        showGuidance: false,
      };
    return {
      text: "Check in on your top intent today",
      type: "general",
      showGuidance: false,
    };
  };

  const buildInsight = (loop: string, state: string) => {
    if (loop === "Avoidance")
      return "You planned tasks but didn't start. This is avoidance, not laziness.";
    if (loop === "Overthinking")
      return "You are not lacking clarity. You are overthinking before acting.";
    if (loop === "Inconsistency")
      return "Inconsistency is information — something is misaligned, not wrong with you.";
    if (state === "Clear")
      return "You are clear. Move forward with intention today.";
    if (state === "Focused")
      return "You are focused. Protect this state — go deep.";
    return null;
  };

  const handleCheckIn = async () => {
    if (!selectedState) return toast.error("Select your current state first");
    setSavingCheckIn(true);
    try {
      const res = await api.post("/checkin", {
        dailyState: selectedState,
        avoidingText,
        mattersTodayText: mattersText,
      });
      const d = res.data.data;
      setCheckInDone(true);
      setClarityScore(d.checkIn.clarityScore);
      setLoopType(d.checkIn.loopType);
      setLoopSeverity(d.checkIn.loopSeverity);
      setInsight(d.insight);
      setSuggested(d.suggestedAction);
      setWeeklyLoops(d.weeklyLoops);
      // Show Guidance CTA if loop or negative state
      if (
        d.checkIn.loopType !== "None" ||
        ["Avoiding", "Confused", "Anxious"].includes(selectedState)
      ) {
        setShowGuidanceCTA(true);
      }
      const iRes = await api.get("/checkin/dashboard");
      setAwarenessStreak(iRes.data.data.awarenessStreak);
      toast.success("✅ Check-in saved!");
    } catch {
      toast.error("Failed to save check-in");
    } finally {
      setSavingCheckIn(false);
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
      setRealizationSaved(true);
      toast.success("Realization saved to your Insights! 🌟");
    } catch {
      toast.error("Failed to save");
    } finally {
      setSavingReal(false);
    }
  };

  const handleShare = () => {
    const sc = STATES.find((s) => s.value === selectedState);
    const tags = selectedTags.length > 0 ? ` [${selectedTags.join(", ")}]` : "";
    const text = `Today's realization: "${realization || insight || "Checked in on DoR-DoD"}"${tags} | Mind State: ${sc?.label || selectedState} | Clarity: ${clarityScore}/100 #DoRDoD #SelfAwareness`;
    if (navigator.share) {
      navigator.share({ title: "My DoR-DoD Insight", text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      toast.success("Insight copied to clipboard!");
    }
  };

  // Navigate to Guidance with context (#10, #11)
  const handleGetGuidance = () => {
    const context = {
      goal: mattersText || "Improve focus",
      loopType,
      mindState: selectedState,
    };
    sessionStorage.setItem("guidanceContext", JSON.stringify(context));
    navigate("/guidance");
  };

  // Handle post-guidance update (#12)
  const handleSaveGuidanceUpdate = async () => {
    setSavingGuidance(true);
    try {
      await api.post("/checkin/guidance-update", guidanceForm);
      setGuidanceDone(true);
      setShowPostGuidance(false);
      toast.success("✅ Guidance session recorded!");
    } catch {
      toast.error("Failed to save");
    } finally {
      setSavingGuidance(false);
    }
  };

  const toggleTag = (tag: string) =>
    setSelectedTags((p) =>
      p.includes(tag) ? p.filter((t) => t !== tag) : [...p, tag],
    );

  const sevCfg = SEVERITY_CFG[loopSeverity] || SEVERITY_CFG.None;
  const stateStyle = (s: (typeof STATES)[0]) =>
    selectedState === s.value ? s.active : s.color;

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
              <p className="text-sm md:text-base font-medium italic leading-relaxed">
                "{quote.text}"
              </p>
              <p className="text-xs text-foreground-muted mt-1.5">
                — {quote.author}
              </p>
            </div>
          </div>
        </div>

        {/* ── 1. DAILY CHECK-IN (first interaction on dashboard) ─────────── */}
        <div className="card-elevated">
          <div className="flex items-center gap-2 mb-1">
            <FaBrain className="text-primary" />
            <h2 className="text-xl font-bold">
              Hi {user?.name?.split(" ")[0]}, how are you right now?
            </h2>
          </div>
          <p className="text-sm text-foreground-muted mb-4">
            Your current state shapes everything. Be honest — this is just for
            you.
          </p>

          {/* State selector */}
          <div className="flex flex-wrap gap-2 mb-4">
            {STATES.map((s) => (
              <button
                key={s.value}
                onClick={() => !checkInDone && setSelectedState(s.value)}
                disabled={checkInDone}
                className={`px-4 py-2 rounded-full border-2 font-medium text-sm transition-all ${stateStyle(s)} ${checkInDone && selectedState !== s.value ? "opacity-40" : ""}`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* 2. Follow-up questions */}
          {!checkInDone && selectedState && (
            <div className="space-y-3 mb-4">
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
              disabled={savingCheckIn || !selectedState}
              className="btn-primary w-full disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {savingCheckIn ? "Saving..." : "Check In for Today"}
              {!savingCheckIn && <FaArrowRight className="w-3 h-3" />}
            </button>
          ) : (
            <div className="flex items-center gap-2 text-success text-sm font-medium">
              <span className="w-5 h-5 bg-success rounded-full flex items-center justify-center text-white text-xs">
                ✓
              </span>
              Checked in today as <strong>{selectedState}</strong>
            </div>
          )}
        </div>

        {/* ── After check-in ──────────────────────────────────────────────── */}
        {checkInDone && (
          <>
            {/* Internal + External System */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Internal System */}
              <div className="card-elevated">
                <h3 className="font-bold text-base mb-3">Internal System</h3>

                {/* 8. Clarity Score with formula explanation */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-foreground-muted uppercase tracking-wide">
                      Clarity Score
                    </p>
                    <div className="group relative">
                      <FaLightbulb className="text-foreground-muted w-3.5 h-3.5 cursor-help" />
                      <div className="absolute right-0 top-5 w-52 bg-card border border-border rounded-xl p-3 text-xs shadow-lg z-10 hidden group-hover:block">
                        <p className="font-semibold mb-1">
                          How it's calculated:
                        </p>
                        <p>+ Check-in consistency (up to 30)</p>
                        <p>+ Execution alignment (up to 40)</p>
                        <p>− Loop frequency (up to −30)</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-5xl font-black text-primary leading-none">
                    {clarityScore}
                  </p>
                  <p className="text-xs text-foreground-muted mt-1">
                    out of 100
                  </p>
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
                </div>

                {/* 6. Loop Tracker with Severity */}
                {loopType !== "None" ? (
                  <div className={`rounded-xl border p-3 mb-3 ${sevCfg.bg}`}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold uppercase tracking-wide flex items-center gap-1.5">
                        <FaExclamationTriangle
                          className={`w-3 h-3 ${sevCfg.color}`}
                        />
                        Loop Detected
                      </p>
                      {/* 6. Severity Level badge */}
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full border ${sevCfg.bg} ${sevCfg.color}`}
                      >
                        {loopSeverity} Severity
                      </span>
                    </div>
                    <p className="text-sm font-medium mb-2">
                      {loopType === "Avoidance" && "Avoiding important task"}
                      {loopType === "Overthinking" &&
                        "Overthinking before starting"}
                      {loopType === "Inconsistency" &&
                        "Inconsistent follow-through"}
                    </p>
                    {/* 3. Insight Card with Action Buttons */}
                    {insight && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mt-2">
                        <p className="text-xs font-semibold text-yellow-700 mb-1 flex items-center gap-1">
                          <FaLightbulb className="w-3 h-3" /> Insight:
                        </p>
                        <p className="text-sm text-yellow-800 mb-3">
                          {insight}
                        </p>
                        {/* Action Buttons — Primary + Optional Guidance */}
                        <div className="flex gap-2 flex-wrap">
                          {/* PRIMARY CTA — always shown */}
                          {suggestedAction && (
                            <button
                              onClick={() =>
                                toast.success(
                                  `✅ Starting: ${suggestedAction.text}`,
                                )
                              }
                              className="text-xs bg-primary text-white px-3 py-1.5 rounded-lg font-medium hover:opacity-90 transition-all flex items-center gap-1"
                            >
                              ⚡ Start Small Step
                            </button>
                          )}
                          {/* SECONDARY CTA — optional, contextual, non-intrusive */}
                          {showGuidanceCTA && !guidanceDone && (
                            <button
                              onClick={handleGetGuidance}
                              className="text-xs border border-secondary/40 text-secondary hover:bg-secondary/10 px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1"
                            >
                              🧭 Explore Guidance (Optional)
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-success/10 border border-success/20 rounded-xl p-3 mb-3">
                    <p className="text-sm text-success font-medium">
                      {selectedState === "Clear" &&
                        "✨ You are clear. Move forward with intention."}
                      {selectedState === "Focused" &&
                        "🎯 Focused state. Protect this time."}
                      {selectedState === "Anxious" &&
                        "🌱 Awareness is the first step. You showed up."}
                      {!["Clear", "Focused", "Anxious"].includes(
                        selectedState,
                      ) && "✅ Check-in complete. No loops detected today."}
                    </p>
                  </div>
                )}

                {/* 7. Suggested Action — based on Mind State + Loop Type */}
                {suggestedAction && (
                  <div className="bg-blue-50 border border-blue-200 dark:bg-blue-950/20 dark:border-blue-900 rounded-xl p-3">
                    <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1">
                      Suggested Action
                    </p>
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                      {suggestedAction.text}
                    </p>
                  </div>
                )}
              </div>

              {/* External System */}
              <div className="card-elevated">
                <h3 className="font-bold text-base mb-3">External System</h3>
                <div className="space-y-3 mb-4">
                  {[
                    {
                      label: "Execution (Intent / Goals)",
                      val: external.execution,
                      color: "#6366f1",
                      emoji: "🎯",
                    },
                    {
                      label: "Behavior (Habits)",
                      val: external.behavior,
                      color: "#ef4444",
                      emoji: "🔥",
                    },
                    {
                      label: "Growth (Knowledge)",
                      val: external.growth,
                      color: "#22c55e",
                      emoji: "📚",
                    },
                  ].map((item, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-foreground-muted">
                          {item.emoji} {item.label}
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
                          className="h-2 rounded-full transition-all"
                          style={{
                            width: `${item.val}%`,
                            background: item.color,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                {/* 5. Awareness Streak with meaning (#5) */}
                <div className="pt-3 border-t border-border">
                  <div className="flex items-center gap-2 mb-1">
                    <FaFire className="text-destructive" />
                    <p className="text-xs text-foreground-muted uppercase tracking-wide">
                      Awareness Streak
                    </p>
                  </div>
                  <p className="font-black text-2xl text-destructive">
                    {awarenessStreak}{" "}
                    <span className="text-base font-normal">
                      {awarenessStreak === 1 ? "day" : "days"}
                    </span>
                  </p>
                  {/* Show meaning not just number */}
                  <p className="text-xs text-foreground-muted mt-0.5">
                    {awarenessStreak === 0 &&
                      "Start your reflection streak today"}
                    {awarenessStreak === 1 &&
                      "You reflected today — day 1 begins 🌱"}
                    {awarenessStreak >= 2 &&
                      awarenessStreak < 7 &&
                      `You reflected ${awarenessStreak} days — building awareness 🔥`}
                    {awarenessStreak >= 7 &&
                      awarenessStreak < 14 &&
                      `You reflected ${awarenessStreak} days — strong pattern forming 💪`}
                    {awarenessStreak >= 14 &&
                      `You reflected ${awarenessStreak} days — self-awareness mastery 👑`}
                  </p>
                </div>
              </div>
            </div>

            {/* 6. This Week's Loops with Severity */}
            {weeklyLoops.length > 0 && (
              <div className="card-elevated">
                <h3 className="font-bold text-base mb-3">This Week's Loops</h3>
                <div className="space-y-2">
                  {weeklyLoops.map((loop, i) => {
                    const sc = SEVERITY_CFG[loop.severity] || SEVERITY_CFG.Low;
                    return (
                      <div
                        key={i}
                        className={`flex items-center justify-between rounded-xl px-4 py-3 border ${sc.bg}`}
                      >
                        <p className="text-sm font-medium">{loop.pattern}</p>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded-full border ${sc.bg} ${sc.color}`}
                          >
                            {loop.severity}
                          </span>
                          <span className={`text-xs font-bold ${sc.color}`}>
                            {loop.count}×
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-foreground-muted mt-3 italic">
                  Loops aren't failures. They're patterns waiting to be
                  understood.
                </p>
              </div>
            )}

            {/* Guidance CTA Card (item #10) — when loop detected */}
            {showGuidanceCTA && !guidanceDone && (
              <div className="card-elevated bg-gradient-to-r from-secondary/10 to-primary/10 border-secondary/30">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">🧭</span>
                  <div className="flex-1">
                    <h3 className="font-bold">You may need Guidance</h3>
                    <p className="text-sm text-foreground-muted mt-0.5 mb-3">
                      {loopType === "Avoidance" &&
                        "A pattern of avoidance was detected. Guidance can help you identify what's holding you back."}
                      {loopType === "Overthinking" &&
                        "You seem to be overthinking. Guidance can help you gain clarity and take action."}
                      {loopType === "Inconsistency" &&
                        "Inconsistency spotted. Guidance can help realign your behaviors with your intent."}
                      {loopType === "None" &&
                        "Your current state suggests you'd benefit from a quick Guidance session."}
                    </p>
                    <button
                      onClick={handleGetGuidance}
                      className="btn-primary flex items-center gap-2"
                    >
                      🧭 Get Guidance
                      <FaArrowRight className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => setShowGuidanceCTA(false)}
                      className="text-xs text-foreground-muted hover:text-foreground ml-4"
                    >
                      Maybe later
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Post-Guidance Update (item #12) */}
            {guidanceDone ? (
              <div className="card-elevated border-success/30 bg-success/5">
                <div className="flex items-center gap-2 text-success text-sm font-medium">
                  <FaCheckCircle /> Guidance session recorded for today
                </div>
              </div>
            ) : (
              showPostGuidance && (
                <div className="card-elevated">
                  <h3 className="font-bold mb-3">
                    After Guidance — Update your system
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-foreground-muted">
                        Intent update (what changed?)
                      </label>
                      <input
                        placeholder="e.g. Focus on one goal this week"
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
                        Behavior to try
                      </label>
                      <input
                        placeholder="e.g. Start tasks within 2 minutes of opening them"
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
                        Key insight from session
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
                      {savingGuidance ? "Saving..." : "Record Guidance Update"}
                    </button>
                  </div>
                </div>
              )
            )}

            {/* 9. Today's Realization — with Tags + Save to Insights */}
            <div
              className="card-elevated"
              style={{
                background: "linear-gradient(135deg, #f5f3ff 0%, #faf5ff 100%)",
              }}
            >
              <h3 className="font-bold text-base mb-2">Today's Realization</h3>
              <textarea
                placeholder="Write your realization..."
                value={realization}
                onChange={(e) => {
                  setRealization(e.target.value);
                  setRealizationSaved(false);
                }}
                className="w-full bg-white dark:bg-card border border-border rounded-xl p-3 text-sm resize-none outline-none focus:ring-2 focus:ring-primary/30 min-h-[80px]"
              />

              {/* Tag selector */}
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
                <div className="flex gap-2">
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

              {/* Trigger post-guidance update */}
              {!guidanceDone && checkInDone && (
                <div className="mt-3 pt-3 border-t border-purple-200/50">
                  <button
                    onClick={() => setShowPostGuidance((p) => !p)}
                    className="text-xs text-secondary hover:underline"
                  >
                    📝 Had a Guidance session today? Record the update →
                  </button>
                </div>
              )}
            </div>

            {/* XP summary */}
            {xpData && (
              <div className="card-elevated">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-xs text-foreground-muted">Level</p>
                      <p className="font-bold">{xpData.levelName}</p>
                    </div>
                    <div className="w-px h-8 bg-border" />
                    <div>
                      <p className="text-xs text-foreground-muted">Total XP</p>
                      <p className="font-bold text-primary">
                        {xpData.totalXP?.toLocaleString()}
                      </p>
                    </div>
                    <div className="w-px h-8 bg-border" />
                    <div>
                      <p className="text-xs text-foreground-muted">Streak</p>
                      <p className="font-bold text-destructive">
                        {xpData.streak} 🔥
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
              </div>
            )}
          </>
        )}

        {/* If not checked in — quick navigation */}
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
