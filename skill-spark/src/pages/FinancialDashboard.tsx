import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { api } from "@/utils/api";
import toast from "react-hot-toast";
import {
  FaWallet,
  FaChartPie,
  FaBullseye,
  FaChartLine,
  FaPlus,
  FaTrash,
  FaTimes,
  FaChevronDown,
  FaChevronUp,
  FaRedo,
  FaPiggyBank,
} from "react-icons/fa";

// ─── Types ───────────────────────────────────────────────────────────────────
interface Expense {
  _id: string;
  category: string;
  salaryCategory: string;
  amount: number;
  description: string;
  date: string;
}
interface SalaryCategory {
  key: string;
  label: string;
  percentage: number;
  targetAmount: number;
  expensesAmount: number;
  remainingAmount: number;
  color: string;
  icon: string;
}
interface FinancialGoal {
  _id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
}

const CATEGORY_INFO: Record<
  string,
  { label: string; color: string; icon: string }
> = {
  essentials: {
    label: "Essentials (Rent, Food, Bills)",
    color: "#ef4444",
    icon: "🏠",
  },
  savings: { label: "Savings", color: "#3b82f6", icon: "💾" },
  emergencyFund: { label: "Emergency Fund", color: "#f59e0b", icon: "🛡️" },
  lifestyle: { label: "Lifestyle & Fun", color: "#8b5cf6", icon: "🎉" },
  investments: { label: "Investments", color: "#10b981", icon: "📈" },
  debt: { label: "Debt Repayment", color: "#ef5350", icon: "💳" },
};

const PREDEFINED_PLANS = [
  {
    id: "plan1",
    name: "50/30/20 Classic",
    description: "Balanced approach for most budgets",
    allocation: {
      essentials: 50,
      savings: 10,
      emergencyFund: 10,
      lifestyle: 10,
      investments: 15,
      debt: 5,
    },
  },
  {
    id: "plan2",
    name: "Aggressive Savings",
    description: "Build wealth quickly",
    allocation: {
      essentials: 40,
      savings: 15,
      emergencyFund: 15,
      lifestyle: 5,
      investments: 20,
      debt: 5,
    },
  },
  {
    id: "plan3",
    name: "Debt Focused",
    description: "Priority on debt repayment",
    allocation: {
      essentials: 45,
      savings: 5,
      emergencyFund: 10,
      lifestyle: 5,
      investments: 5,
      debt: 30,
    },
  },
  {
    id: "plan4",
    name: "Lifestyle Balance",
    description: "More freedom for spending",
    allocation: {
      essentials: 40,
      savings: 10,
      emergencyFund: 10,
      lifestyle: 20,
      investments: 15,
      debt: 5,
    },
  },
];

const TABS = [
  { id: "overview", label: "📊 Overview", icon: FaChartLine },
  { id: "salary", label: "💰 Salary Plan", icon: FaWallet },
  { id: "savings", label: "🏦 Savings", icon: FaPiggyBank },
  { id: "expenses", label: "💳 Expenses", icon: FaChartPie },
  { id: "goals", label: "🎯 Goals", icon: FaBullseye },
];

function buildCategories(
  monthlySalary: number,
  allocation: Record<string, number>,
): SalaryCategory[] {
  return Object.entries(allocation).map(([key, percentage]) => {
    const target = Math.round((monthlySalary * percentage) / 100);
    return {
      key,
      label: CATEGORY_INFO[key]?.label || key,
      percentage,
      targetAmount: target,
      expensesAmount: 0,
      remainingAmount: target,
      color: CATEGORY_INFO[key]?.color || "#6b7280",
      icon: CATEGORY_INFO[key]?.icon || "📌",
    };
  });
}

function applyExpenses(
  categories: SalaryCategory[],
  expenses: Expense[],
): SalaryCategory[] {
  return categories.map((cat) => {
    const spent = expenses
      .filter((e) => e.salaryCategory === cat.key)
      .reduce((s, e) => s + e.amount, 0);
    return {
      ...cat,
      expensesAmount: spent,
      remainingAmount: cat.targetAmount - spent,
    };
  });
}

// ─── Overview Tab ──────────────────────────────────────────────────────────────
function OverviewTab({
  monthlySalary,
  categories,
  emergencyFundBalance,
  goals,
}: {
  monthlySalary: number;
  categories: SalaryCategory[];
  emergencyFundBalance: number;
  goals: FinancialGoal[];
}) {
  const totalAllocated = categories.reduce((s, c) => s + c.targetAmount, 0);
  const totalExpenses = categories.reduce((s, c) => s + c.expensesAmount, 0);
  const remainingSalary = monthlySalary - totalAllocated;
  const completionPct =
    monthlySalary > 0 ? Math.round((totalExpenses / monthlySalary) * 100) : 0;
  const totalSavings =
    categories.find((c) => c.key === "savings")?.targetAmount || 0;
  const totalInvestments =
    categories.find((c) => c.key === "investments")?.targetAmount || 0;
  const goalsCompleted = goals.filter(
    (g) => g.currentAmount >= g.targetAmount,
  ).length;
  const goalProgress =
    goals.length > 0 ? Math.round((goalsCompleted / goals.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl shadow-lg p-8">
        <h2 className="text-3xl font-bold mb-2">Financial Overview</h2>
        <p className="text-sm opacity-90">
          Your complete financial snapshot at a glance
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
          <p className="text-xs text-gray-600 dark:text-gray-400 uppercase">
            Monthly Salary
          </p>
          <p className="text-3xl font-black text-gray-900 dark:text-white mt-2">
            ₹{monthlySalary.toLocaleString()}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
          <p className="text-xs text-gray-600 dark:text-gray-400 uppercase">
            Total Allocated
          </p>
          <p className="text-3xl font-black text-indigo-600 mt-2">
            ₹{totalAllocated.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {monthlySalary > 0
              ? Math.round((totalAllocated / monthlySalary) * 100)
              : 0}
            % of salary
          </p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
          <p className="text-xs text-gray-600 dark:text-gray-400 uppercase">
            Remaining
          </p>
          <p
            className={`text-3xl font-black mt-2 ${remainingSalary >= 0 ? "text-green-600" : "text-red-600"}`}
          >
            ₹{remainingSalary.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {remainingSalary >= 0 ? "Available" : "Over budget"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-200 dark:border-blue-800 p-4">
          <p className="text-xs text-blue-700 dark:text-blue-400 uppercase font-semibold">
            Total Expenses
          </p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-2">
            ₹{totalExpenses.toLocaleString()}
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
            {completionPct}% of salary
          </p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl border border-green-200 dark:border-green-800 p-4">
          <p className="text-xs text-green-700 dark:text-green-400 uppercase font-semibold">
            Total Savings
          </p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-2">
            ₹{totalSavings.toLocaleString()}
          </p>
          <p className="text-xs text-green-600 dark:text-green-400 mt-1">
            Allocated monthly
          </p>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-200 dark:border-emerald-800 p-4">
          <p className="text-xs text-emerald-700 dark:text-emerald-400 uppercase font-semibold">
            Investments
          </p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
            ₹{totalInvestments.toLocaleString()}
          </p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
            Growth potential
          </p>
        </div>
        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-2xl border border-orange-200 dark:border-orange-800 p-4">
          <p className="text-xs text-orange-700 dark:text-orange-400 uppercase font-semibold">
            Emergency Fund
          </p>
          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-2">
            ₹{emergencyFundBalance.toLocaleString()}
          </p>
          <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
            Safety net
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
          <p className="text-sm font-bold text-gray-900 dark:text-white mb-3">
            Monthly Progress
          </p>
          <div className="flex justify-between mb-2 text-xs">
            <span className="text-gray-600 dark:text-gray-400">
              Expenses vs Salary
            </span>
            <span className="font-bold text-gray-900 dark:text-white">
              {completionPct}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div
              className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all"
              style={{ width: `${Math.min(completionPct, 100)}%` }}
            />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
          <p className="text-sm font-bold text-gray-900 dark:text-white mb-3">
            Goal Progress
          </p>
          <div className="flex justify-between mb-2 text-xs">
            <span className="text-gray-600 dark:text-gray-400">
              {goalsCompleted} of {goals.length} completed
            </span>
            <span className="font-bold text-gray-900 dark:text-white">
              {goalProgress}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div
              className="h-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 transition-all"
              style={{ width: `${goalProgress}%` }}
            />
          </div>
        </div>
      </div>

      {categories.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
          <p className="text-sm font-bold text-gray-900 dark:text-white mb-4">
            Allocation Breakdown
          </p>
          <div className="space-y-3">
            {categories.map((cat) => (
              <div key={cat.key}>
                <div className="flex justify-between mb-1 text-xs">
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {cat.label}
                  </span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    ₹{cat.expensesAmount.toLocaleString()} / ₹
                    {cat.targetAmount.toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{
                      width: `${cat.targetAmount > 0 ? Math.min((cat.expensesAmount / cat.targetAmount) * 100, 100) : 0}%`,
                      background: cat.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Salary Plan Tab ─────────────────────────────────────────────────────────
function SalaryTab({
  monthlySalary,
  categories,
  selectedPlan,
  onSetSalary,
  onSelectPlan,
  onChangePlan,
  onChangeSalary,
}: {
  monthlySalary: number;
  categories: SalaryCategory[];
  selectedPlan: string | null;
  onSetSalary: (salary: number) => void;
  onSelectPlan: (planId: string, allocation: Record<string, number>) => void;
  onChangePlan: () => void;
  onChangeSalary: () => void;
}) {
  const [salaryInput, setSalaryInput] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showCustom, setShowCustom] = useState(false);
  const [custom, setCustom] = useState({
    essentials: 50,
    savings: 10,
    emergencyFund: 10,
    lifestyle: 10,
    investments: 15,
    debt: 5,
  });
  const customTotal = Object.values(custom).reduce((a, b) => a + b, 0);

  if (monthlySalary === 0) {
    return (
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl p-8">
        <h2 className="text-2xl font-bold mb-4">
          💰 Step 1: Enter Your Salary
        </h2>
        <p className="mb-6 text-sm opacity-90">
          Enter your monthly salary to start planning
        </p>
        <div className="flex gap-3">
          <input
            type="number"
            value={salaryInput}
            onChange={(e) => setSalaryInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                const s = Number(salaryInput);
                if (s > 0) onSetSalary(s);
                else toast.error("Enter a valid salary");
              }
            }}
            placeholder="Enter monthly salary"
            className="flex-1 px-4 py-3 rounded-lg text-black"
          />
          <button
            onClick={() => {
              const s = Number(salaryInput);
              if (s > 0) onSetSalary(s);
              else toast.error("Enter a valid salary");
            }}
            className="bg-white text-indigo-600 px-6 py-3 rounded-lg font-bold hover:bg-gray-100"
          >
            Set Salary
          </button>
        </div>
      </div>
    );
  }

  if (selectedPlan === null) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Choose Salary Plan
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Salary:{" "}
          <span className="font-bold text-indigo-600">
            ₹{monthlySalary.toLocaleString()}
          </span>
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PREDEFINED_PLANS.map((plan) => (
            <div
              key={plan.id}
              onClick={() => onSelectPlan(plan.id, plan.allocation)}
              className="p-5 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 cursor-pointer hover:border-indigo-300 transition-all"
            >
              <h4 className="font-bold text-gray-900 dark:text-white mb-1">
                {plan.name}
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                {plan.description}
              </p>
              <div className="text-xs space-y-1">
                {Object.entries(plan.allocation)
                  .slice(0, 3)
                  .map(([k, p]) => (
                    <div key={k} className="flex justify-between">
                      <span>{k}:</span>
                      <span className="font-semibold">{p}%</span>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => setShowCustom(!showCustom)}
          className="mt-6 flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-semibold"
        >
          {showCustom ? <FaChevronUp /> : <FaChevronDown />} Create Custom Plan
        </button>

        {showCustom && (
          <div className="mt-6 p-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-200 dark:border-indigo-800">
            <p className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
              Adjust percentages (Total:{" "}
              <span
                className={
                  customTotal === 100 ? "text-green-600" : "text-red-600"
                }
              >
                {customTotal}%
              </span>
              )
            </p>
            <div className="space-y-4">
              {Object.entries(custom).map(([key, value]) => (
                <div key={key}>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                      {CATEGORY_INFO[key]?.label.split(" ")[0]}
                    </label>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      {value}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={value}
                    onChange={(e) =>
                      setCustom((p) => ({
                        ...p,
                        [key]: Number(e.target.value),
                      }))
                    }
                    className="w-full"
                  />
                </div>
              ))}
            </div>
            <button
              onClick={() => {
                if (customTotal === 100) onSelectPlan("custom", custom);
                else
                  toast.error(`Total must be 100% (currently ${customTotal}%)`);
              }}
              disabled={customTotal !== 100}
              className="w-full mt-6 bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50"
            >
              {customTotal === 100
                ? "Apply Custom Plan"
                : `Total must be 100% (${customTotal}%)`}
            </button>
          </div>
        )}

        <button
          onClick={onChangeSalary}
          className="mt-6 text-indigo-600 text-sm font-semibold hover:text-indigo-700"
        >
          ← Change Salary
        </button>
      </div>
    );
  }

  const totalAllocated = categories.reduce((s, c) => s + c.targetAmount, 0);
  const totalSpent = categories.reduce((s, c) => s + c.expensesAmount, 0);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Salary Tracker
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {PREDEFINED_PLANS.find((p) => p.id === selectedPlan)?.name ||
                "Custom Plan"}
            </p>
          </div>
          <button
            onClick={onChangePlan}
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm hover:bg-gray-200"
          >
            <FaRedo className="w-3 h-3" /> Change Plan
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4">
            <p className="text-xs text-indigo-700 dark:text-indigo-400">
              Salary
            </p>
            <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
              ₹{monthlySalary.toLocaleString()}
            </p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
            <p className="text-xs text-blue-700 dark:text-blue-400">
              Allocated
            </p>
            <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
              ₹{totalAllocated.toLocaleString()}
            </p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
            <p className="text-xs text-green-700 dark:text-green-400">Spent</p>
            <p className="text-lg font-bold text-green-600 dark:text-green-400">
              ₹{totalSpent.toLocaleString()}
            </p>
          </div>
          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4">
            <p className="text-xs text-orange-700 dark:text-orange-400">
              Remaining
            </p>
            <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
              ₹{(monthlySalary - totalAllocated).toLocaleString()}
            </p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4">
            <p className="text-xs text-purple-700 dark:text-purple-400">
              Spent %
            </p>
            <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
              {monthlySalary > 0
                ? Math.round((totalSpent / monthlySalary) * 100)
                : 0}
              %
            </p>
          </div>
        </div>

        <div className="flex justify-between mb-2 text-sm">
          <span className="font-medium">Overall Progress</span>
          <span className="font-bold">
            {monthlySalary > 0
              ? Math.round((totalSpent / monthlySalary) * 100)
              : 0}
            %
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
          <div
            className="h-4 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600"
            style={{
              width: `${monthlySalary > 0 ? Math.min((totalSpent / monthlySalary) * 100, 100) : 0}%`,
            }}
          />
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="font-bold text-gray-900 dark:text-white">Categories</h3>
        {categories.map((category) => {
          const progress =
            category.targetAmount > 0
              ? (category.expensesAmount / category.targetAmount) * 100
              : 0;
          const remaining = category.targetAmount - category.expensesAmount;
          return (
            <div
              key={category.key}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden"
            >
              <button
                onClick={() =>
                  setExpanded(expanded === category.key ? null : category.key)
                }
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ background: category.color }}
                  />
                  <span className="text-lg">{category.icon}</span>
                  <div className="text-left">
                    <p className="font-bold text-gray-900 dark:text-white">
                      {category.label}
                    </p>
                    <p className="text-xs text-gray-500">
                      {category.percentage}%
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right text-sm">
                    <p className="font-bold text-gray-900 dark:text-white">
                      ₹{category.expensesAmount.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      / ₹{category.targetAmount.toLocaleString()}
                    </p>
                  </div>
                  {expanded === category.key ? (
                    <FaChevronUp />
                  ) : (
                    <FaChevronDown />
                  )}
                </div>
              </button>
              {expanded === category.key && (
                <div className="border-t p-4 bg-gray-50 dark:bg-gray-800/50">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-4">
                    <div
                      className="h-3 rounded-full"
                      style={{
                        width: `${Math.min(progress, 100)}%`,
                        background: category.color,
                      }}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div className="bg-white dark:bg-gray-900 rounded p-2">
                      <p className="text-xs text-gray-600">Target</p>
                      <p className="font-bold">
                        ₹{category.targetAmount.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-white dark:bg-gray-900 rounded p-2">
                      <p className="text-xs text-gray-600">Spent</p>
                      <p className="font-bold text-green-600">
                        ₹{category.expensesAmount.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-white dark:bg-gray-900 rounded p-2">
                      <p className="text-xs text-gray-600">Remaining</p>
                      <p
                        className={`font-bold ${remaining >= 0 ? "text-orange-600" : "text-red-600"}`}
                      >
                        ₹{remaining.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Expenses Tab ────────────────────────────────────────────────────────────
function ExpensesTab({
  expenses,
  categories,
  onAdded,
}: {
  expenses: Expense[];
  categories: SalaryCategory[];
  onAdded: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    category: "",
    salaryCategory: categories[0]?.key || "essentials",
    amount: "",
    description: "",
    date: new Date().toISOString().slice(0, 10),
  });

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

  const handleAdd = async () => {
    if (!form.category.trim())
      return toast.error("Expense description is required");
    if (!form.salaryCategory) return toast.error("Please select a category");
    if (!form.amount || Number(form.amount) <= 0)
      return toast.error("Enter a valid amount");
    if (!form.date) return toast.error("Date is required");
    setSaving(true);
    try {
      await api.post("/financial/expenses", {
        category: form.category,
        salaryCategory: form.salaryCategory,
        amount: Number(form.amount),
        description: form.description,
        date: form.date,
      });
      toast.success("Expense added!");
      setForm({
        category: "",
        salaryCategory: categories[0]?.key || "essentials",
        amount: "",
        description: "",
        date: new Date().toISOString().slice(0, 10),
      });
      setShowForm(false);
      onAdded();
    } catch (err) {
      console.error("addExpense failed", err);
      toast.error("Failed to add expense");
    } finally {
      setSaving(false);
    }
  };

  if (categories.length === 0) {
    return (
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-6 text-center">
        <p className="text-sm text-amber-800 dark:text-amber-300">
          Set your salary and choose a plan first — expenses are assigned to
          salary categories.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl shadow-lg p-6">
        <p className="text-sm opacity-90">Total Spending (This Month)</p>
        <p className="text-4xl font-black mt-2">
          ₹{totalExpenses.toLocaleString()}
        </p>
      </div>

      <button
        onClick={() => setShowForm(!showForm)}
        className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700"
      >
        <FaPlus className="w-3 h-3" /> Add Expense
      </button>

      {showForm && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 space-y-4">
          <h3 className="font-bold text-gray-900 dark:text-white">
            Add New Expense
          </h3>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Expense Description <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g., Groceries, Fuel, Movie tickets"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg px-4 py-2 mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Assign to Category <span className="text-red-500">*</span>
            </label>
            <select
              value={form.salaryCategory}
              onChange={(e) =>
                setForm({ ...form, salaryCategory: e.target.value })
              }
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg px-4 py-2 mt-1"
            >
              {categories.map((cat) => (
                <option key={cat.key} value={cat.key}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Amount <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                placeholder="₹0"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg px-4 py-2 mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg px-4 py-2 mt-1"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="Add notes..."
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg px-4 py-2 mt-1"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowForm(false)}
              className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg py-2 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={saving}
              className="flex-1 bg-indigo-600 text-white rounded-lg py-2 font-semibold hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Add Expense"}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        {expenses.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No expenses yet</div>
        ) : (
          expenses.map((exp) => {
            const sc = categories.find((c) => c.key === exp.salaryCategory);
            return (
              <div
                key={exp._id}
                className="p-4 border-b dark:border-gray-800 flex justify-between items-start"
              >
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {exp.category}
                  </p>
                  <p className="text-xs text-gray-500">
                    {sc?.label || exp.salaryCategory} •{" "}
                    {new Date(exp.date).toLocaleDateString()}
                  </p>
                  {exp.description && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {exp.description}
                    </p>
                  )}
                </div>
                <span className="font-bold text-gray-900 dark:text-white">
                  ₹{exp.amount.toLocaleString()}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── Savings Tab ─────────────────────────────────────────────────────────────
function SavingsTab({
  categories,
  emergencyFundBalance,
  emergencyTarget,
  onAddFunds,
  onSetTarget,
}: {
  categories: SalaryCategory[];
  emergencyFundBalance: number;
  emergencyTarget: number;
  onAddFunds: (amount: number) => void;
  onSetTarget: (target: number) => void;
}) {
  const [addAmount, setAddAmount] = useState("");
  const savings = categories.find((c) => c.key === "savings");
  const investments = categories.find((c) => c.key === "investments");
  const emergency = categories.find((c) => c.key === "emergencyFund");
  const emergencyProgress =
    emergencyTarget > 0 ? (emergencyFundBalance / emergencyTarget) * 100 : 0;

  if (categories.length === 0) {
    return (
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-6 text-center">
        <p className="text-sm text-amber-800 dark:text-amber-300">
          Set your salary and choose a plan first to see savings breakdown.
        </p>
      </div>
    );
  }

  const Card = ({ cat, gradient, border, text }: any) =>
    cat ? (
      <div
        className={`bg-gradient-to-br ${gradient} rounded-2xl border-2 ${border} p-6`}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className={`text-sm font-semibold ${text}`}>
              {cat.icon} {cat.label.split(" (")[0]}
            </p>
            <p className={`text-3xl font-black ${text} mt-1`}>
              ₹{cat.targetAmount.toLocaleString()}
            </p>
            <p className={`text-xs ${text} mt-1`}>
              {cat.percentage}% of monthly salary
            </p>
          </div>
          <div className="text-6xl opacity-20">{cat.icon}</div>
        </div>
      </div>
    ) : null;

  return (
    <div className="space-y-6">
      <Card
        cat={savings}
        gradient="from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/30"
        border="border-blue-200 dark:border-blue-800"
        text="text-blue-600 dark:text-blue-400"
      />
      <Card
        cat={investments}
        gradient="from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-900/30"
        border="border-emerald-200 dark:border-emerald-800"
        text="text-emerald-600 dark:text-emerald-400"
      />

      {emergency && (
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-900/30 rounded-2xl border-2 border-orange-200 dark:border-orange-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-semibold text-orange-700 dark:text-orange-400">
                🛡️ Emergency Fund
              </p>
              <p className="text-3xl font-black text-orange-600 dark:text-orange-400 mt-1">
                ₹{emergencyFundBalance.toLocaleString()}
              </p>
              <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                Target: ₹{emergencyTarget.toLocaleString()}
              </p>
            </div>
            <div className="text-6xl opacity-20">🛡️</div>
          </div>
          <div className="w-full bg-orange-200 dark:bg-orange-900 rounded-full h-4 mb-4">
            <div
              className="h-4 rounded-full bg-gradient-to-r from-orange-500 to-orange-600"
              style={{ width: `${Math.min(emergencyProgress, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-orange-600 dark:text-orange-400 mb-4">
            <span>₹{emergencyFundBalance.toLocaleString()} saved</span>
            <span className="font-bold">{Math.round(emergencyProgress)}%</span>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-lg p-3 mb-4">
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-2">
              Add Funds
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Amount"
                value={addAmount}
                onChange={(e) => setAddAmount(e.target.value)}
                className="flex-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded px-3 py-1.5 text-sm"
              />
              <button
                onClick={() => {
                  const a = Number(addAmount);
                  if (a > 0) {
                    onAddFunds(a);
                    setAddAmount("");
                  } else toast.error("Enter valid amount");
                }}
                className="px-4 py-1.5 bg-orange-600 text-white rounded font-semibold text-sm hover:bg-orange-700"
              >
                <FaPlus className="w-3 h-3" />
              </button>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-lg p-3">
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-2">
              Target: ₹{emergencyTarget.toLocaleString()}
            </label>
            <input
              type="range"
              min="50000"
              max="1000000"
              step="50000"
              value={emergencyTarget}
              onChange={(e) => onSetTarget(Number(e.target.value))}
              className="w-full"
            />
          </div>
          {emergencyFundBalance < emergencyTarget ? (
            <div className="mt-4 p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <p className="text-xs text-orange-800 dark:text-orange-200">
                Need ₹
                {(emergencyTarget - emergencyFundBalance).toLocaleString()} more
              </p>
            </div>
          ) : (
            <div className="mt-4 p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <p className="text-xs text-green-800 dark:text-green-200">
                ✅ Emergency fund complete!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Goals Tab ───────────────────────────────────────────────────────────────
function GoalsTab({
  goals,
  onChanged,
}: {
  goals: FinancialGoal[];
  onChanged: () => void;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    name: "",
    targetAmount: "",
    deadline: "",
  });

  const addGoal = async () => {
    if (!form.name || !form.targetAmount || !form.deadline)
      return toast.error("Fill all fields");
    try {
      await api.post("/financial/goals", {
        name: form.name,
        targetAmount: Number(form.targetAmount),
        deadline: form.deadline,
      });
      toast.success("Goal added!");
      setForm({ name: "", targetAmount: "", deadline: "" });
      setShowAdd(false);
      onChanged();
    } catch (err) {
      console.error("addGoal failed", err);
      toast.error("Failed to add goal");
    }
  };

  const delGoal = async (id: string) => {
    try {
      await api.delete(`/financial/goals/${id}`);
      toast.success("Goal deleted");
      onChanged();
    } catch (err) {
      console.error("delGoal failed", err);
      toast.error("Failed to delete goal");
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={() => setShowAdd(true)}
        className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700"
      >
        <FaPlus className="w-3 h-3" /> Add Goal
      </button>

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Create Goal
              </h3>
              <button
                onClick={() => setShowAdd(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            </div>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Goal name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg px-4 py-2"
              />
              <input
                type="number"
                placeholder="Target amount"
                value={form.targetAmount}
                onChange={(e) =>
                  setForm({ ...form, targetAmount: e.target.value })
                }
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg px-4 py-2"
              />
              <input
                type="date"
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg px-4 py-2"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAdd(false)}
                  className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg py-2 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={addGoal}
                  className="flex-1 bg-indigo-600 text-white rounded-lg py-2 font-semibold hover:bg-indigo-700"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {goals.length === 0 && (
        <div className="text-center py-8 text-gray-500">No goals yet</div>
      )}
      {goals.map((goal) => {
        const progress =
          goal.targetAmount > 0
            ? (goal.currentAmount / goal.targetAmount) * 100
            : 0;
        return (
          <div
            key={goal._id}
            className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6"
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white">
                  {goal.name}
                </h4>
                <p className="text-xs text-gray-500">
                  Target:{" "}
                  {goal.deadline
                    ? new Date(goal.deadline).toLocaleDateString()
                    : "—"}
                </p>
              </div>
              <button
                onClick={() => delGoal(goal._id)}
                className="text-red-600 hover:text-red-700"
              >
                <FaTrash />
              </button>
            </div>
            <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-3 mb-2">
              <div
                className="h-3 rounded-full bg-indigo-600"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
              <span>₹{goal.currentAmount.toLocaleString()}</span>
              <span className="font-bold">{Math.round(progress)}%</span>
              <span>₹{goal.targetAmount.toLocaleString()}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function FinancialDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [monthlySalary, setMonthlySalary] = useState(0);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [categories, setCategories] = useState<SalaryCategory[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [emergencyFundBalance, setEmergencyFundBalance] = useState(0);
  const [emergencyTarget, setEmergencyTarget] = useState(300000);
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [salaryRes, expRes, emgRes, goalsRes] = await Promise.all([
        api.get("/financial/salary-allocation").catch((e) => {
          console.error("load salary-allocation failed", e);
          return { data: { data: null } };
        }),
        api.get("/financial/expenses").catch((e) => {
          console.error("load expenses failed", e);
          return { data: { data: [] } };
        }),
        api.get("/financial/emergency-fund").catch((e) => {
          console.error("load emergency-fund failed", e);
          return { data: { data: { balance: 0, target: 300000 } } };
        }),
        api.get("/financial/goals").catch((e) => {
          console.error("load goals failed", e);
          return { data: { data: [] } };
        }),
      ]);

      const loadedExpenses: Expense[] = expRes.data.data || [];
      setExpenses(loadedExpenses);

      const alloc = salaryRes.data.data;
      if (alloc && alloc.monthlySalary > 0) {
        // Restore salary + plan EVEN IF categories is empty
        setMonthlySalary(alloc.monthlySalary);
        setSelectedPlan(alloc.selectedPlan || null);

        if (Array.isArray(alloc.categories) && alloc.categories.length > 0) {
          const cats: SalaryCategory[] = alloc.categories.map((c: any) => ({
            key: c.key,
            label: c.label || CATEGORY_INFO[c.key]?.label || c.key,
            percentage: c.percentage,
            targetAmount: c.targetAmount,
            expensesAmount: 0,
            remainingAmount: c.targetAmount,
            color: c.color || CATEGORY_INFO[c.key]?.color || "#6b7280",
            icon: c.icon || CATEGORY_INFO[c.key]?.icon || "📌",
          }));
          setCategories(applyExpenses(cats, loadedExpenses));
        }
      }

      setEmergencyFundBalance(emgRes.data.data?.balance || 0);
      setEmergencyTarget(emgRes.data.data?.target || 300000);
      setGoals(goalsRes.data.data || []);
    } catch (e) {
      console.error("Error loading financial data", e);
    } finally {
      setLoading(false);
    }
  };

  const persistAllocation = async (
    salary: number,
    planId: string | null,
    cats: SalaryCategory[],
  ) => {
    try {
      await api.post("/financial/salary-allocation", {
        monthlySalary: salary,
        selectedPlan: planId,
        categories: cats.map((c) => ({
          key: c.key,
          label: c.label,
          percentage: c.percentage,
          targetAmount: c.targetAmount,
          color: c.color,
          icon: c.icon,
        })),
      });
    } catch (err) {
      console.error("persistAllocation failed", err);
      toast.error("Failed to save salary plan");
    }
  };

  const handleSetSalary = (salary: number) => {
    setMonthlySalary(salary);
    toast.success(`Salary set to ₹${salary.toLocaleString()}`);
    persistAllocation(salary, null, []);
  };

  const handleSelectPlan = (
    planId: string,
    allocation: Record<string, number>,
  ) => {
    const cats = applyExpenses(
      buildCategories(monthlySalary, allocation),
      expenses,
    );
    setCategories(cats);
    setSelectedPlan(planId);
    toast.success("Plan applied!");
    persistAllocation(monthlySalary, planId, cats);
  };

  const handleChangePlan = () => {
    setSelectedPlan(null);
    setCategories([]);
    persistAllocation(monthlySalary, null, []);
  };

  const handleChangeSalary = () => {
    setMonthlySalary(0);
    setSelectedPlan(null);
    setCategories([]);
    persistAllocation(0, null, []);
  };

  const handleAddFunds = async (amount: number) => {
    const newBalance = emergencyFundBalance + amount;
    setEmergencyFundBalance(newBalance);
    try {
      await api.post("/financial/emergency-fund", {
        balance: newBalance,
        target: emergencyTarget,
      });
      toast.success(`₹${amount.toLocaleString()} added!`);
    } catch (err) {
      console.error("addFunds failed", err);
      toast.error("Failed to save funds");
    }
  };

  const handleSetTarget = async (target: number) => {
    setEmergencyTarget(target);
    try {
      await api.post("/financial/emergency-fund", {
        balance: emergencyFundBalance,
        target,
      });
    } catch (err) {
      console.error("setTarget failed", err);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-24">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Financial Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your money with complete control
          </p>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? "bg-indigo-600 text-white"
                    : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:border-indigo-300"
                }`}
              >
                <Icon className="w-4 h-4" /> {tab.label}
              </button>
            );
          })}
        </div>

        <div>
          {activeTab === "overview" && (
            <OverviewTab
              monthlySalary={monthlySalary}
              categories={categories}
              emergencyFundBalance={emergencyFundBalance}
              goals={goals}
            />
          )}
          {activeTab === "salary" && (
            <SalaryTab
              monthlySalary={monthlySalary}
              categories={categories}
              selectedPlan={selectedPlan}
              onSetSalary={handleSetSalary}
              onSelectPlan={handleSelectPlan}
              onChangePlan={handleChangePlan}
              onChangeSalary={handleChangeSalary}
            />
          )}
          {activeTab === "savings" && (
            <SavingsTab
              categories={categories}
              emergencyFundBalance={emergencyFundBalance}
              emergencyTarget={emergencyTarget}
              onAddFunds={handleAddFunds}
              onSetTarget={handleSetTarget}
            />
          )}
          {activeTab === "expenses" && (
            <ExpensesTab
              expenses={expenses}
              categories={categories}
              onAdded={loadData}
            />
          )}
          {activeTab === "goals" && (
            <GoalsTab goals={goals} onChanged={loadData} />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
