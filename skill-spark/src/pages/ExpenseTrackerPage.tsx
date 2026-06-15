import { useState, useEffect } from "react";
import { api } from "@/utils/api";
import toast from "react-hot-toast";
import {
  FaPlus,
  FaTimes,
  FaTrash,
  FaEdit,
  FaCheck,
  FaCalendarAlt,
  FaChartPie,
  FaDownload,
} from "react-icons/fa";

interface Expense {
  _id: string;
  category: string;
  amount: number;
  description: string;
  date: string;
  paymentMethod: string;
}

interface Summary {
  _id: string;
  total: number;
  count: number;
}

const CATEGORIES = [
  "Food",
  "Transport",
  "Entertainment",
  "Healthcare",
  "Shopping",
  "Utilities",
  "Education",
  "Personal Care",
  "Other",
];
const CATEGORY_COLORS: Record<string, string> = {
  Food: "#f97316",
  Transport: "#3b82f6",
  Entertainment: "#8b5cf6",
  Healthcare: "#ef4444",
  Shopping: "#ec4899",
  Utilities: "#6366f1",
  Education: "#06b6d4",
  "Personal Care": "#84cc16",
  Other: "#6b7280",
};

const fmtDate = (d?: string) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";

export default function ExpenseTrackerPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<Summary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [filter, setFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("");

  const [form, setForm] = useState({
    category: "Food",
    amount: "",
    description: "",
    paymentMethod: "Cash",
    date: new Date().toISOString().slice(0, 10),
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    setLoading(true);
    try {
      const res = await api.get("/expenses");
      setExpenses(res.data.data || []);
      const summaryRes = await api.get("/expenses/summary");
      setSummary(summaryRes.data.data?.summary || []);
    } catch {
      toast.error("Failed to load expenses");
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async () => {
    if (!form.amount) return toast.error("Amount is required");
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/expenses/${editing._id}`, form);
        setExpenses((exp) =>
          exp.map((e) => (e._id === editing._id ? { ...e, ...form } : e)),
        );
        toast.success("Expense updated!");
        setEditing(null);
      } else {
        const res = await api.post("/expenses", form);
        setExpenses((exp) => [res.data.data, ...exp]);
        toast.success("Expense added!");
      }
      setForm({
        category: "Food",
        amount: "",
        description: "",
        paymentMethod: "Cash",
        date: new Date().toISOString().slice(0, 10),
      });
      setShowForm(false);
      loadExpenses();
    } catch {
      toast.error("Failed to save expense");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this expense?")) return;
    try {
      await api.delete(`/expenses/${id}`);
      setExpenses((exp) => exp.filter((e) => e._id !== id));
      toast.success("Deleted!");
      loadExpenses();
    } catch {
      toast.error("Failed to delete");
    }
  };

  const totalExpense = summary.reduce((sum, item) => sum + item.total, 0);
  const filteredExpenses =
    filter === "All" ? expenses : expenses.filter((e) => e.category === filter);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Expense Tracker
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Track and manage your spending
          </p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditing(null);
          }}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all"
        >
          <FaPlus className="w-3 h-3" /> Add Expense
        </button>
      </div>

      {/* Total Stats */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl shadow-lg p-6">
        <p className="text-sm opacity-90">Total Spending (All Time)</p>
        <p className="text-4xl font-black mt-2">
          ₹{totalExpense.toLocaleString("en-IN")}
        </p>
      </div>

      {/* Category Breakdown */}
      {summary.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <FaChartPie className="text-indigo-600" /> Spending by Category
          </h3>
          <div className="space-y-3">
            {summary.map((cat) => (
              <div key={cat._id}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {cat._id}
                  </span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    ₹{cat.total.toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{
                      width: `${(cat.total / totalExpense) * 100}%`,
                      background: CATEGORY_COLORS[cat._id] || "#6366f1",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-900 dark:text-white">
              {editing ? "Edit Expense" : "Add Expense"}
            </h3>
            <button
              onClick={() => {
                setShowForm(false);
                setEditing(null);
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <FaTimes />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
                Category
              </label>
              <select
                value={form.category}
                onChange={(e) =>
                  setForm((p) => ({ ...p, category: e.target.value }))
                }
                className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
                Amount (₹)
              </label>
              <input
                type="number"
                value={form.amount}
                onChange={(e) =>
                  setForm((p) => ({ ...p, amount: e.target.value }))
                }
                placeholder="0"
                className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
                Date
              </label>
              <input
                type="date"
                value={form.date}
                onChange={(e) =>
                  setForm((p) => ({ ...p, date: e.target.value }))
                }
                className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
                Payment Method
              </label>
              <select
                value={form.paymentMethod}
                onChange={(e) =>
                  setForm((p) => ({ ...p, paymentMethod: e.target.value }))
                }
                className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none"
              >
                <option>Cash</option>
                <option>Card</option>
                <option>UPI</option>
                <option>Bank Transfer</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
                Description
              </label>
              <input
                type="text"
                value={form.description}
                onChange={(e) =>
                  setForm((p) => ({ ...p, description: e.target.value }))
                }
                placeholder="Optional notes..."
                className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none"
              />
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={handleAddExpense}
              disabled={saving}
              className="flex-1 bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <FaCheck className="w-3 h-3" /> {saving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                setEditing(null);
              }}
              className="flex-1 border border-gray-200 text-gray-600 px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {["All", ...CATEGORIES].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              filter === cat
                ? "bg-indigo-600 text-white"
                : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-indigo-300"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Expenses List */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm divide-y divide-gray-100 dark:divide-gray-800 overflow-hidden">
        {filteredExpenses.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No expenses yet</div>
        ) : (
          filteredExpenses.map((expense) => (
            <div
              key={expense._id}
              className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0"
                  style={{
                    background: CATEGORY_COLORS[expense.category] || "#6366f1",
                  }}
                >
                  {expense.category[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {expense.category}
                  </p>
                  <p className="text-xs text-gray-500">
                    {expense.description || "No description"}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    <FaCalendarAlt className="w-2.5 h-2.5 inline mr-1" />
                    {fmtDate(expense.date)} • {expense.paymentMethod}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-gray-900 dark:text-white shrink-0">
                  ₹{expense.amount.toLocaleString()}
                </span>
                <button
                  onClick={() => {
                    setEditing(expense);
                    setForm({
                      category: expense.category,
                      amount: String(expense.amount),
                      description: expense.description,
                      paymentMethod: expense.paymentMethod,
                      date: expense.date.slice(0, 10),
                    });
                    setShowForm(true);
                  }}
                  className="text-indigo-600 hover:text-indigo-700 p-1.5 hover:bg-indigo-50 rounded-lg"
                >
                  <FaEdit className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(expense._id)}
                  className="text-red-600 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-lg"
                >
                  <FaTrash className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
