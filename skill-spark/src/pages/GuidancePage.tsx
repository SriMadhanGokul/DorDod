import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { api } from "@/utils/api";
import toast from "react-hot-toast";
import {
  FaArrowRight,
  FaArrowLeft,
  FaCheck,
  FaHistory,
  FaCompass,
  FaTimes,
  FaLightbulb,
} from "react-icons/fa";

interface Message {
  role: "seeker" | "guide";
  content: string;
  timestamp?: string;
}
interface Session {
  _id: string;
  date: string;
  context: { goal: string; loopType: string; mindState: string };
  messages: Message[];
  completed: boolean;
  intentUpdate?: string;
  behaviorSuggestion?: string;
  sessionInsight?: string;
}
interface HistoryItem {
  _id: string;
  date: string;
  completed: boolean;
  context: { loopType: string; mindState: string };
  intentUpdate?: string;
  sessionInsight?: string;
}

const LOOP_COLORS: Record<string, string> = {
  Avoidance: "bg-red-50    border-red-200    text-red-700",
  Overthinking: "bg-yellow-50 border-yellow-200 text-yellow-700",
  Inconsistency: "bg-orange-50 border-orange-200 text-orange-700",
  None: "bg-blue-50   border-blue-200   text-blue-700",
};

const COMPLETION_PROMPTS = [
  "What is one thing you will do differently tomorrow because of this session?",
  "What did you realize about yourself today?",
  "What pattern did you notice that you want to break?",
];

export default function GuidancePage() {
  const navigate = useNavigate();

  // Context from Dashboard (passed via sessionStorage)
  const [context, setContext] = useState<{
    goal: string;
    loopType: string;
    mindState: string;
  }>({ goal: "", loopType: "None", mindState: "" });
  const [session, setSession] = useState<Session | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"start" | "chat" | "complete" | "history">(
    "start",
  );
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [starting, setStarting] = useState(false);

  // Completion form
  const [intentUpdate, setIntentUpdate] = useState("");
  const [behaviorSuggestion, setBehaviorSugg] = useState("");
  const [sessionInsight, setSessionInsight] = useState("");
  const [completionPrompt] = useState(
    COMPLETION_PROMPTS[
      Math.floor(Date.now() / 86400000) % COMPLETION_PROMPTS.length
    ],
  );
  const [completing, setCompleting] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Get context from Dashboard (item #11)
    const raw = sessionStorage.getItem("guidanceContext");
    if (raw) {
      try {
        setContext(JSON.parse(raw));
      } catch {}
      sessionStorage.removeItem("guidanceContext");
    }
    const load = async () => {
      try {
        const [todayRes, historyRes] = await Promise.all([
          api.get("/guidance/today"),
          api.get("/guidance/history"),
        ]);
        if (todayRes.data.data) {
          setSession(todayRes.data.data);
          setView(todayRes.data.data.completed ? "complete" : "chat");
          if (todayRes.data.data.intentUpdate)
            setIntentUpdate(todayRes.data.data.intentUpdate);
          if (todayRes.data.data.behaviorSuggestion)
            setBehaviorSugg(todayRes.data.data.behaviorSuggestion);
          if (todayRes.data.data.sessionInsight)
            setSessionInsight(todayRes.data.data.sessionInsight);
        }
        setHistory(historyRes.data.data || []);
      } catch {
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [session?.messages]);

  const startSession = async () => {
    setStarting(true);
    try {
      const res = await api.post("/guidance/start", { context });
      setSession(res.data.data);
      setView("chat");
      setTimeout(() => inputRef.current?.focus(), 200);
    } catch {
      toast.error("Failed to start session");
    } finally {
      setStarting(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || sending) return;
    const msg = input.trim();
    setInput("");
    setSending(true);
    // Optimistic update
    setSession((prev) =>
      prev
        ? {
            ...prev,
            messages: [...prev.messages, { role: "seeker", content: msg }],
          }
        : prev,
    );
    try {
      const res = await api.post("/guidance/message", { content: msg });
      setSession(res.data.data);
    } catch {
      toast.error("Failed to send");
    } finally {
      setSending(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const completeSession = async () => {
    setCompleting(true);
    try {
      await api.post("/guidance/complete", {
        intentUpdate,
        behaviorSuggestion,
        sessionInsight,
      });
      setSession((prev) => (prev ? { ...prev, completed: true } : prev));
      setView("complete");
      toast.success("✅ Session complete — system updated!");
    } catch {
      toast.error("Failed to complete session");
    } finally {
      setCompleting(false);
    }
  };

  const loopColor = LOOP_COLORS[context.loopType] || LOOP_COLORS.None;

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
      <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/dashboard")}
              className="text-foreground-muted hover:text-foreground p-2 hover:bg-muted rounded-xl transition-all"
            >
              <FaArrowLeft />
            </button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <FaCompass className="text-secondary" /> Guidance
              </h1>
              <p className="text-xs text-foreground-muted mt-0.5">
                Optional · Self-directed · Non-intrusive
              </p>
            </div>
          </div>
          <button
            onClick={() =>
              setView(
                view === "history" ? (session ? "chat" : "start") : "history",
              )
            }
            className="btn-secondary text-sm flex items-center gap-2"
          >
            <FaHistory className="w-3 h-3" />
            {view === "history" ? "Back" : "History"}
          </button>
        </div>

        {/* Non-intrusive notice */}
        <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-xl border border-border">
          <FaLightbulb className="text-secondary w-4 h-4 mt-0.5 shrink-0" />
          <p className="text-sm text-foreground-muted">
            <strong className="text-foreground">Guidance is optional.</strong>{" "}
            The system works fully without it. Use it when you want to explore a
            pattern deeper — not because you need to.
          </p>
        </div>

        {/* ── HISTORY VIEW ──────────────────────────────────────────────────── */}
        {view === "history" && (
          <div className="space-y-3">
            <h2 className="font-semibold">Past Sessions</h2>
            {history.length === 0 ? (
              <div className="text-center py-12 text-foreground-muted card-elevated">
                <FaCompass className="text-4xl mx-auto mb-3 opacity-20" />
                <p className="font-medium">No past sessions</p>
                <p className="text-sm mt-1">
                  Your first Guidance session will appear here
                </p>
              </div>
            ) : (
              history.map((h) => (
                <div key={h._id} className="card-elevated">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-sm">
                      {new Date(h.date).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                    <div className="flex items-center gap-2">
                      {h.context.loopType !== "None" && (
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full border ${LOOP_COLORS[h.context.loopType] || LOOP_COLORS.None}`}
                        >
                          {h.context.loopType}
                        </span>
                      )}
                      <span
                        className={`text-xs font-medium ${h.completed ? "text-success" : "text-foreground-muted"}`}
                      >
                        {h.completed ? "✅ Completed" : "● Incomplete"}
                      </span>
                    </div>
                  </div>
                  {h.sessionInsight && (
                    <p className="text-sm text-foreground-muted italic">
                      "{h.sessionInsight}"
                    </p>
                  )}
                  {h.intentUpdate && (
                    <p className="text-xs text-primary mt-1">
                      Intent: {h.intentUpdate}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* ── START VIEW ────────────────────────────────────────────────────── */}
        {view === "start" && (
          <div className="space-y-4">
            {/* Context card from Dashboard */}
            {(context.loopType !== "None" || context.mindState) && (
              <div className={`p-4 rounded-xl border ${loopColor}`}>
                <p className="text-xs font-semibold uppercase tracking-wide mb-2">
                  Context from your check-in
                </p>
                <div className="flex flex-wrap gap-2">
                  {context.mindState && (
                    <span className="text-xs bg-white/60 px-3 py-1 rounded-full">
                      Mind State: <strong>{context.mindState}</strong>
                    </span>
                  )}
                  {context.loopType !== "None" && (
                    <span className="text-xs bg-white/60 px-3 py-1 rounded-full">
                      Loop: <strong>{context.loopType}</strong>
                    </span>
                  )}
                  {context.goal && (
                    <span className="text-xs bg-white/60 px-3 py-1 rounded-full">
                      Focus: <strong>{context.goal}</strong>
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* What Guidance is */}
            <div className="card-elevated">
              <h2 className="font-bold text-lg mb-3">What is Guidance?</h2>
              <div className="space-y-3 text-sm text-foreground-muted">
                <div className="flex items-start gap-3">
                  <span className="text-xl shrink-0">🪞</span>
                  <p>
                    <strong className="text-foreground">
                      A mirror, not a solution.
                    </strong>{" "}
                    Guidance asks questions — you provide the answers. You
                    already know what you need to do.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-xl shrink-0">🔍</span>
                  <p>
                    <strong className="text-foreground">
                      Pattern exploration.
                    </strong>{" "}
                    Based on your{" "}
                    {context.loopType !== "None"
                      ? context.loopType + " loop"
                      : "current state"}
                    , the Guide will help you explore what's underneath.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-xl shrink-0">🔄</span>
                  <p>
                    <strong className="text-foreground">
                      Closes the system loop.
                    </strong>{" "}
                    After the session, your Intent, Behavior, and Insights will
                    be updated — so the conversation becomes action.
                  </p>
                </div>
              </div>
            </div>

            {/* Role explanation */}
            <div className="grid grid-cols-2 gap-3">
              <div className="card-elevated text-center p-4">
                <p className="text-2xl mb-2">🙋</p>
                <p className="font-bold text-sm">You — Seeker</p>
                <p className="text-xs text-foreground-muted mt-1">
                  Share what's on your mind. Be honest. No judgment here.
                </p>
              </div>
              <div className="card-elevated text-center p-4">
                <p className="text-2xl mb-2">🧭</p>
                <p className="font-bold text-sm">Guide</p>
                <p className="text-xs text-foreground-muted mt-1">
                  Asks powerful questions. Reflects patterns. Never tells you
                  what to do.
                </p>
              </div>
            </div>

            <button
              onClick={startSession}
              disabled={starting}
              className="btn-primary w-full py-4 text-base flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {starting ? "Opening session..." : "Start Guidance Session"}
              {!starting && <FaArrowRight className="w-4 h-4" />}
            </button>

            <button
              onClick={() => navigate("/dashboard")}
              className="w-full text-sm text-foreground-muted hover:text-foreground text-center py-2 transition-all"
            >
              Not now — go back to Dashboard
            </button>
          </div>
        )}

        {/* ── CHAT VIEW ─────────────────────────────────────────────────────── */}
        {view === "chat" && session && (
          <div className="space-y-4">
            {/* Session context pill */}
            {session.context?.loopType !== "None" && (
              <div
                className={`px-3 py-2 rounded-xl border text-xs font-medium flex items-center gap-2 ${loopColor}`}
              >
                <span>Session focus:</span>
                <strong>
                  {session.context.loopType} loop · {session.context.mindState}{" "}
                  state
                </strong>
              </div>
            )}

            {/* Messages */}
            <div className="card-elevated space-y-4 max-h-[420px] overflow-y-auto">
              {session.messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "seeker" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "guide" && (
                    <div className="w-7 h-7 rounded-full bg-secondary/20 flex items-center justify-center text-sm shrink-0 mr-2 mt-0.5">
                      🧭
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === "guide"
                        ? "bg-muted text-foreground rounded-tl-sm"
                        : "bg-primary text-primary-foreground rounded-tr-sm"
                    }`}
                  >
                    {msg.content}
                  </div>
                  {msg.role === "seeker" && (
                    <div className="w-7 h-7 rounded-full gradient-hero flex items-center justify-center text-white text-xs shrink-0 ml-2 mt-0.5">
                      🙋
                    </div>
                  )}
                </div>
              ))}
              {sending && (
                <div className="flex justify-start">
                  <div className="w-7 h-7 rounded-full bg-secondary/20 flex items-center justify-center text-sm mr-2">
                    🧭
                  </div>
                  <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
                    <div className="flex gap-1">
                      <div
                        className="w-2 h-2 bg-foreground-muted rounded-full animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      />
                      <div
                        className="w-2 h-2 bg-foreground-muted rounded-full animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      />
                      <div
                        className="w-2 h-2 bg-foreground-muted rounded-full animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            {!session.completed && (
              <div className="card-elevated p-3">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Share what's on your mind... (Enter to send, Shift+Enter for new line)"
                  rows={3}
                  className="w-full bg-transparent outline-none text-sm resize-none placeholder:text-foreground-muted/60"
                />
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
                  <p className="text-xs text-foreground-muted">
                    {session.messages.filter((m) => m.role === "seeker").length}{" "}
                    messages sent
                  </p>
                  <div className="flex gap-2">
                    {session.messages.length >= 4 && (
                      <button
                        onClick={() => setView("complete")}
                        className="text-xs text-foreground-muted hover:text-foreground px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-all"
                      >
                        Wrap up session
                      </button>
                    )}
                    <button
                      onClick={sendMessage}
                      disabled={!input.trim() || sending}
                      className="btn-primary text-sm px-4 py-1.5 disabled:opacity-50 flex items-center gap-1.5"
                    >
                      Send <FaArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {session.completed && (
              <div className="card-elevated border-success/30 bg-success/5 text-center py-4">
                <p className="text-success font-semibold">
                  ✅ Session completed
                </p>
                <p className="text-sm text-foreground-muted mt-1">
                  Your system has been updated
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── COMPLETE VIEW ─────────────────────────────────────────────────── */}
        {view === "complete" && (
          <div className="space-y-4">
            {!session?.completed ? (
              <>
                <div className="card-elevated">
                  <h2 className="font-bold text-lg mb-1">
                    Wrap Up — Update Your System
                  </h2>
                  <p className="text-sm text-foreground-muted mb-4">
                    This is how the conversation becomes action. Fill in what
                    shifted for you.
                  </p>

                  {/* Completion prompt */}
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 mb-4">
                    <p className="text-sm font-medium text-primary">
                      💭 Reflection prompt:
                    </p>
                    <p className="text-sm text-foreground-muted mt-1 italic">
                      "{completionPrompt}"
                    </p>
                  </div>

                  <div className="space-y-4">
                    {/* Intent update */}
                    <div>
                      <label className="text-xs font-semibold text-foreground-muted uppercase tracking-wide flex items-center gap-1.5 mb-2">
                        🎯 Intent Update
                        <span className="text-xs font-normal normal-case opacity-60">
                          — What will you focus on?
                        </span>
                      </label>
                      <input
                        placeholder="e.g. Focus on one goal this week instead of five"
                        value={intentUpdate}
                        onChange={(e) => setIntentUpdate(e.target.value)}
                        className="input-field text-sm"
                      />
                    </div>

                    {/* Behavior suggestion */}
                    <div>
                      <label className="text-xs font-semibold text-foreground-muted uppercase tracking-wide flex items-center gap-1.5 mb-2">
                        🔥 Behavior Change
                        <span className="text-xs font-normal normal-case opacity-60">
                          — What will you do differently?
                        </span>
                      </label>
                      <input
                        placeholder="e.g. Start tasks within 2 minutes of thinking about them"
                        value={behaviorSuggestion}
                        onChange={(e) => setBehaviorSugg(e.target.value)}
                        className="input-field text-sm"
                      />
                    </div>

                    {/* Session insight */}
                    <div>
                      <label className="text-xs font-semibold text-foreground-muted uppercase tracking-wide flex items-center gap-1.5 mb-2">
                        💡 Key Insight
                        <span className="text-xs font-normal normal-case opacity-60">
                          — What did you realize?
                        </span>
                      </label>
                      <textarea
                        placeholder="e.g. I'm not lazy — I'm afraid of what happens if it doesn't work"
                        value={sessionInsight}
                        onChange={(e) => setSessionInsight(e.target.value)}
                        className="input-field min-h-[70px] text-sm"
                      />
                    </div>

                    <button
                      onClick={completeSession}
                      disabled={completing}
                      className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {completing
                        ? "Updating system..."
                        : "✅ Complete Session & Update System"}
                    </button>

                    <button
                      onClick={() => setView("chat")}
                      className="w-full text-xs text-foreground-muted hover:text-foreground text-center py-2 transition-all"
                    >
                      ← Continue the conversation
                    </button>
                  </div>
                </div>
              </>
            ) : (
              /* Completed state */
              <div className="space-y-4">
                <div className="card-elevated border-success/30 bg-success/5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-success rounded-full flex items-center justify-center text-white">
                      <FaCheck />
                    </div>
                    <div>
                      <h3 className="font-bold">Session Complete</h3>
                      <p className="text-sm text-foreground-muted">
                        Your system has been updated
                      </p>
                    </div>
                  </div>

                  {/* Show what was updated */}
                  <div className="space-y-3">
                    {intentUpdate && (
                      <div className="bg-primary/10 border border-primary/20 rounded-xl p-3">
                        <p className="text-xs font-semibold text-primary mb-1">
                          🎯 Intent Updated
                        </p>
                        <p className="text-sm">{intentUpdate}</p>
                      </div>
                    )}
                    {behaviorSuggestion && (
                      <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3">
                        <p className="text-xs font-semibold text-destructive mb-1">
                          🔥 Behavior to Try
                        </p>
                        <p className="text-sm">{behaviorSuggestion}</p>
                      </div>
                    )}
                    {sessionInsight && (
                      <div className="bg-secondary/10 border border-secondary/20 rounded-xl p-3">
                        <p className="text-xs font-semibold text-secondary mb-1">
                          💡 Saved to Insights
                        </p>
                        <p className="text-sm italic">"{sessionInsight}"</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => navigate("/dashboard")}
                    className="btn-primary flex-1"
                  >
                    ← Back to Overview
                  </button>
                  <button
                    onClick={() => navigate("/goals")}
                    className="btn-secondary flex-1"
                  >
                    Update Intent →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
