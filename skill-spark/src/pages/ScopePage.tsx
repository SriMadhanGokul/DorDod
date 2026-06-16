import { useState, useEffect } from "react";
import { api } from "@/utils/api";
import toast from "react-hot-toast";
import {
  FaCompass,
  FaCheck,
  FaLightbulb,
  FaEdit,
  FaArrowRight,
  FaCheckCircle,
  FaHistory,
  FaDownload,
  FaTrash,
  FaPlus,
} from "react-icons/fa";

interface ScopData {
  _id?: string;
  strengths: string;
  constraints: string;
  opportunities: string;
  patterns: string;
  keyInsight: string;
  myFocus: string;
  myNextStep: string;
  lastUpdated?: string;
  createdAt?: string;
  title?: string;
}

interface HistoryEntry {
  date: string;
  strengths: string;
  constraints: string;
  opportunities: string;
  patterns: string;
  keyInsight: string;
  myFocus: string;
  myNextStep: string;
  reason: "reset" | "update";
}

const EMPTY_SCOP: ScopData = {
  strengths: "",
  constraints: "",
  opportunities: "",
  patterns: "",
  keyInsight: "",
  myFocus: "",
  myNextStep: "",
};

export default function ScopePage() {
  const [scop, setScop] = useState<ScopData>(EMPTY_SCOP);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [view, setView] = useState<"form" | "result" | "history">("form");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [creatingNew, setCreatingNew] = useState(false);

  useEffect(() => {
    load();
  }, []);

  // ✅ Load both SCOP and history on mount
  const load = async () => {
    try {
      // Load SCOP
      const res = await api.get("/scop");
      if (res.data.data) {
        setScop(res.data.data);
        // Show result view only if SCOP has content
        if (res.data.data.strengths && res.data.data.constraints) {
          setShowResult(true);
          setView("result");
        } else {
          setView("form");
        }
      } else {
        setView("form");
      }
    } catch (err) {
      console.error("Failed to load SCOP", err);
      setView("form");
    } finally {
      // Always load history, regardless of SCOP result
      await loadHistory();
      setLoading(false);
    }
  };

  // ✅ Load history - works even if no SCOP exists
  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await api.get("/scop/history");
      const historyData = res.data.data || [];
      setHistory(historyData);
      console.log("✅ History loaded:", historyData.length, "entries");
    } catch (err) {
      console.error("Failed to load history", err);
      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSave = async () => {
    if (
      !scop.strengths.trim() ||
      !scop.constraints.trim() ||
      !scop.opportunities.trim() ||
      !scop.patterns.trim()
    ) {
      return toast.error("Please fill in all 4 SCOP sections");
    }
    setSaving(true);
    try {
      const res = await api.post("/scop", scop);
      setScop(res.data.data);
      setIsEditing(false);
      setShowResult(true);
      setView("result");
      toast.success("✅ SCOP saved! Your action plan is ready.");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save SCOP");
    } finally {
      setSaving(false);
    }
  };

  const handleResetScop = async () => {
    if (
      !confirm(
        "Reset your SCOP? This will save your current work to History and clear the form.",
      )
    )
      return;
    try {
      await api.delete("/scop");
      setScop(EMPTY_SCOP);
      setView("form");
      setShowResult(false);
      // ✅ Reload history after reset
      await loadHistory();
      toast.success("✅ SCOP reset and saved to History!");
    } catch (err) {
      toast.error("Failed to reset");
    }
  };

  const handleCreateNewScop = async () => {
    setCreatingNew(true);
    try {
      const res = await api.post("/scop/create");
      setScop(res.data.data);
      setView("form");
      setShowResult(false);
      // ✅ Reload history after creating new
      await loadHistory();
      toast.success("✅ New SCOP created! Previous one archived.");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create new SCOP");
    } finally {
      setCreatingNew(false);
    }
  };

  const exportAsText = () => {
    const text = `SCOP Analysis — ${new Date().toLocaleDateString()}

💪 STRENGTHS
${scop.strengths}

🚧 CONSTRAINTS
${scop.constraints}

🌟 OPPORTUNITIES
${scop.opportunities}

🔄 PATTERNS
${scop.patterns}

────────────────────────────────────

FROM AWARENESS TO ACTION

💡 KEY INSIGHT
${scop.keyInsight}

🎯 MY FOCUS
${scop.myFocus}

⚡ MY NEXT STEP
${scop.myNextStep}`;

    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SCOP-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("SCOP exported");
  };

  if (loading)
    return (
      <div className="flex justify-center py-24">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FaCompass className="text-indigo-600" /> SCOP
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            System Awareness Framework — Strengths, Constraints, Opportunities,
            Patterns
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {showResult && !isEditing && (
            <>
              <button
                onClick={exportAsText}
                className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium transition-all"
              >
                <FaDownload className="w-3.5 h-3.5" /> Export
              </button>
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 bg-indigo-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-all"
              >
                <FaEdit className="w-3.5 h-3.5" /> Edit
              </button>
              <button
                onClick={handleCreateNewScop}
                disabled={creatingNew}
                className="flex items-center gap-2 bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-all disabled:opacity-60"
              >
                <FaPlus className="w-3.5 h-3.5" />{" "}
                {creatingNew ? "Creating..." : "New"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* ✅ TAB NAVIGATION - Always show if not editing (whether has result or history) */}
      {!isEditing && (
        <div className="flex gap-2 flex-wrap border-b border-gray-100 pb-0">
          {/* Your Plan Tab - Show if SCOP has content */}
          {showResult && (
            <button
              onClick={() => setView("result")}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
                view === "result"
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              📋 Your Plan
            </button>
          )}

          {/* History Tab - Always show if history exists */}
          {history.length > 0 && (
            <button
              onClick={() => {
                setView("history");
              }}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
                view === "history"
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              📅 History {history.length > 0 && `(${history.length})`}
            </button>
          )}

          {/* Form Tab - Show when editing or no content yet */}
          {(!showResult || isEditing) && (
            <button
              onClick={() => setView("form")}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
                view === "form"
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              ✏️ {showResult ? "Edit SCOP" : "Create SCOP"}
            </button>
          )}
        </div>
      )}

      {/* FORM / EDIT MODE */}
      {(isEditing || view === "form") && (
        <div className="space-y-4">
          {/* Info Box - Show if history exists and not editing */}
          {history.length > 0 && !isEditing && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-800">
                📅 <strong>View History:</strong> You have {history.length}{" "}
                saved SCOP {history.length === 1 ? "entry" : "entries"}. Click
                the <strong>History tab</strong> above to review your past work.
              </p>
            </div>
          )}

          {/* SCOP Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Strengths */}
            <div className="bg-white border-l-4 border-green-500 rounded-2xl border border-gray-100 shadow-sm p-5">
              <label className="text-xs font-bold text-green-600 uppercase tracking-wide flex items-center gap-2 mb-3">
                💪 Strengths
              </label>
              <textarea
                value={scop.strengths}
                onChange={(e) =>
                  setScop((p) => ({ ...p, strengths: e.target.value }))
                }
                placeholder="What are you good at? What comes naturally to you?"
                rows={4}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-200"
              />
            </div>

            {/* Constraints */}
            <div className="bg-white border-l-4 border-red-500 rounded-2xl border border-gray-100 shadow-sm p-5">
              <label className="text-xs font-bold text-red-600 uppercase tracking-wide flex items-center gap-2 mb-3">
                🚧 Constraints
              </label>
              <textarea
                value={scop.constraints}
                onChange={(e) =>
                  setScop((p) => ({ ...p, constraints: e.target.value }))
                }
                placeholder="What limits you? What challenges do you face?"
                rows={4}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-200"
              />
            </div>

            {/* Opportunities */}
            <div className="bg-white border-l-4 border-amber-500 rounded-2xl border border-gray-100 shadow-sm p-5">
              <label className="text-xs font-bold text-amber-600 uppercase tracking-wide flex items-center gap-2 mb-3">
                🌟 Opportunities
              </label>
              <textarea
                value={scop.opportunities}
                onChange={(e) =>
                  setScop((p) => ({ ...p, opportunities: e.target.value }))
                }
                placeholder="What possibilities exist? What can you leverage?"
                rows={4}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-200"
              />
            </div>

            {/* Patterns */}
            <div className="bg-white border-l-4 border-indigo-500 rounded-2xl border border-gray-100 shadow-sm p-5">
              <label className="text-xs font-bold text-indigo-600 uppercase tracking-wide flex items-center gap-2 mb-3">
                🔄 Patterns
              </label>
              <textarea
                value={scop.patterns}
                onChange={(e) =>
                  setScop((p) => ({ ...p, patterns: e.target.value }))
                }
                placeholder="What patterns repeat? What cycles do you notice?"
                rows={4}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>
          </div>

          {/* From Awareness to Action */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border border-purple-100 shadow-sm p-6">
            <h2 className="font-bold text-gray-900 mb-5 flex items-center gap-2">
              <FaArrowRight className="text-purple-600" /> From Awareness to
              Action
            </h2>
            <div className="space-y-4">
              {/* Key Insight */}
              <div>
                <label className="text-xs font-bold text-purple-600 uppercase tracking-wide block mb-2">
                  💡 Key Insight — What did you realize?
                </label>
                <textarea
                  value={scop.keyInsight}
                  onChange={(e) =>
                    setScop((p) => ({ ...p, keyInsight: e.target.value }))
                  }
                  placeholder="The most important thing you realized about yourself..."
                  rows={2}
                  className="w-full border border-purple-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-200"
                />
              </div>

              {/* My Focus */}
              <div>
                <label className="text-xs font-bold text-purple-600 uppercase tracking-wide block mb-2">
                  🎯 My Focus — What will you focus on?
                </label>
                <input
                  type="text"
                  value={scop.myFocus}
                  onChange={(e) =>
                    setScop((p) => ({ ...p, myFocus: e.target.value }))
                  }
                  placeholder="One clear focus area for the next 7 days..."
                  className="w-full border border-purple-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200"
                />
              </div>

              {/* My Next Step */}
              <div>
                <label className="text-xs font-bold text-purple-600 uppercase tracking-wide block mb-2">
                  ⚡ My Next Step — What's the first action?
                </label>
                <input
                  type="text"
                  value={scop.myNextStep}
                  onChange={(e) =>
                    setScop((p) => ({ ...p, myNextStep: e.target.value }))
                  }
                  placeholder="One concrete action you'll take today or tomorrow..."
                  className="w-full border border-purple-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200"
                />
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            {scop._id && (
              <button
                onClick={() => {
                  setIsEditing(false);
                  setView("result");
                }}
                className="flex-1 border border-gray-200 text-gray-600 px-4 py-3 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-indigo-600 text-white px-4 py-3 rounded-xl font-semibold text-sm hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              <FaCheck className="w-3.5 h-3.5" />
              {saving ? "Saving..." : "Save SCOP & Generate Plan"}
            </button>
          </div>
        </div>
      )}

      {/* RESULT VIEW */}
      {view === "result" && showResult && !isEditing && (
        <div className="space-y-5">
          {/* Your Action Plan Card */}
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl border-2 border-indigo-200 shadow-sm p-6 md:p-8">
            <div className="flex items-start gap-3 mb-5">
              <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center shrink-0">
                <FaCheckCircle className="text-white w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Your Action Plan
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Based on your SCOP analysis, here's your path forward
                </p>
              </div>
            </div>

            {/* Key Insight Highlight */}
            {scop.keyInsight && (
              <div className="bg-white rounded-xl p-5 mb-5 border-l-4 border-purple-600">
                <p className="text-xs font-bold text-purple-600 uppercase tracking-wide mb-2 flex items-center gap-2">
                  <FaLightbulb className="w-3.5 h-3.5" /> Your Key Insight
                </p>
                <p className="text-lg text-gray-900 font-semibold italic">
                  "{scop.keyInsight}"
                </p>
              </div>
            )}

            {/* Focus & Next Step */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
              {scop.myFocus && (
                <div className="bg-white rounded-xl p-4 border-l-4 border-amber-500">
                  <p className="text-xs font-bold text-amber-600 uppercase tracking-wide mb-2 flex items-center gap-2">
                    🎯 Your Focus (Next 7 Days)
                  </p>
                  <p className="text-base text-gray-800 font-medium">
                    {scop.myFocus}
                  </p>
                </div>
              )}
              {scop.myNextStep && (
                <div className="bg-white rounded-xl p-4 border-l-4 border-green-500">
                  <p className="text-xs font-bold text-green-600 uppercase tracking-wide mb-2 flex items-center gap-2">
                    ⚡ First Action (Today/Tomorrow)
                  </p>
                  <p className="text-base text-gray-800 font-medium">
                    {scop.myNextStep}
                  </p>
                </div>
              )}
            </div>

            {/* SCOP Details */}
            {scop.strengths && (
              <div className="bg-white rounded-xl p-4 border-l-4 border-green-500 mb-4">
                <p className="text-xs font-bold text-green-600 uppercase tracking-wide mb-2">
                  💪 Strengths to Leverage
                </p>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {scop.strengths}
                </p>
              </div>
            )}
            {scop.constraints && (
              <div className="bg-white rounded-xl p-4 border-l-4 border-red-500 mb-4">
                <p className="text-xs font-bold text-red-600 uppercase tracking-wide mb-2">
                  🚧 Constraints to Navigate
                </p>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {scop.constraints}
                </p>
              </div>
            )}
            {scop.opportunities && (
              <div className="bg-white rounded-xl p-4 border-l-4 border-amber-500 mb-4">
                <p className="text-xs font-bold text-amber-600 uppercase tracking-wide mb-2">
                  🌟 Opportunities to Pursue
                </p>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {scop.opportunities}
                </p>
              </div>
            )}
            {scop.patterns && (
              <div className="bg-white rounded-xl p-4 border-l-4 border-indigo-500">
                <p className="text-xs font-bold text-indigo-600 uppercase tracking-wide mb-2">
                  🔄 Patterns to Break
                </p>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {scop.patterns}
                </p>
              </div>
            )}

            {/* Next Steps */}
            <div className="mt-6 pt-6 border-t border-indigo-200">
              <p className="text-sm font-semibold text-gray-800 mb-3">
                What happens next?
              </p>
              <div className="flex flex-col gap-2 text-sm text-gray-700">
                <div className="flex items-start gap-3">
                  <span className="text-base">1️⃣</span>
                  <span>
                    <strong>Today:</strong> Start your first action (
                    {scop.myNextStep || "your next step"})
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-base">2️⃣</span>
                  <span>
                    <strong>This week:</strong> Focus on{" "}
                    {scop.myFocus || "your focus area"}
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-base">3️⃣</span>
                  <span>
                    <strong>Track progress:</strong> Check in daily on Habits
                    and Execution
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-base">4️⃣</span>
                  <span>
                    <strong>Reflect:</strong> Use Guidance when you need clarity
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">
                Status
              </p>
              <p className="text-2xl font-bold text-green-600">✓ Complete</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">
                Last Updated
              </p>
              <p className="text-sm font-bold text-gray-800">
                {scop.createdAt
                  ? new Date(scop.createdAt).toLocaleDateString()
                  : "Today"}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">
                Focus Area
              </p>
              <p className="text-sm font-bold text-gray-800 line-clamp-2">
                {scop.myFocus || "Not set"}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">
                Total History
              </p>
              <p className="text-2xl font-bold text-indigo-600">
                {history.length}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ✅ HISTORY TAB - Accessible even before first submission */}
      {view === "history" && (
        <div className="space-y-4">
          {loadingHistory ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <FaHistory className="text-4xl text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-semibold">No history yet</p>
              <p className="text-sm text-gray-400 mt-2">
                When you save, update, or reset your SCOP, changes will be saved
                here.
              </p>
              <button
                onClick={() => setView("form")}
                className="mt-4 text-indigo-600 hover:text-indigo-700 font-semibold text-sm"
              >
                Create your first SCOP →
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-800">
                  📝 <strong>{history.length} entries</strong> — Review your
                  journey. Watch how your awareness evolves over time.
                </p>
              </div>
              {history.map((h, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {new Date(h.date).toLocaleDateString("en-IN", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(h.date).toLocaleTimeString()}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-3 py-1 rounded-full font-medium ${
                        h.reason === "reset"
                          ? "bg-red-100 text-red-600"
                          : "bg-blue-100 text-blue-600"
                      }`}
                    >
                      {h.reason === "reset" ? "🔄 Reset" : "✏️ Updated"}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm border-t border-gray-100 pt-3">
                    {h.strengths && (
                      <div>
                        <strong className="text-green-700">Strengths:</strong>
                        <p className="text-gray-600 text-xs mt-0.5">
                          {h.strengths}
                        </p>
                      </div>
                    )}
                    {h.constraints && (
                      <div>
                        <strong className="text-red-700">Constraints:</strong>
                        <p className="text-gray-600 text-xs mt-0.5">
                          {h.constraints}
                        </p>
                      </div>
                    )}
                    {h.keyInsight && (
                      <div>
                        <strong className="text-purple-700">💡 Insight:</strong>
                        <p className="text-gray-600 text-xs mt-0.5">
                          "{h.keyInsight}"
                        </p>
                      </div>
                    )}
                    {h.myFocus && (
                      <div>
                        <strong className="text-amber-700">🎯 Focus:</strong>
                        <p className="text-gray-600 text-xs mt-0.5">
                          {h.myFocus}
                        </p>
                      </div>
                    )}
                    {h.myNextStep && (
                      <div>
                        <strong className="text-green-700">
                          ⚡ Next Step:
                        </strong>
                        <p className="text-gray-600 text-xs mt-0.5">
                          {h.myNextStep}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Danger Zone */}
      {showResult && !isEditing && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mt-8">
          <p className="text-sm font-semibold text-red-800 mb-3">
            ⚠️ Danger Zone
          </p>
          <button
            onClick={handleResetScop}
            className="flex items-center gap-2 text-red-600 hover:text-red-700 text-sm font-medium"
          >
            <FaTrash className="w-3.5 h-3.5" /> Reset Current SCOP
          </button>
          <p className="text-xs text-red-600 mt-2">
            Your current work will be saved to History before clearing.
          </p>
        </div>
      )}
    </div>
  );
}
