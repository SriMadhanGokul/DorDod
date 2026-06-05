import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { api } from "@/utils/api";
import toast from "react-hot-toast";
import {
  FaWallet,
  FaChartPie,
  FaBullseye,
  FaChartLine,
  FaShieldAlt,
  FaRobot,
  FaPlus,
  FaTrash,
  FaTimes,
  FaCheck,
  FaChevronDown,
  FaChevronUp,
  FaRedo,
  FaPiggyBank,
  FaCoins,
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
  isCompleted: boolean;
  color: string;
  icon: string;
}

interface FinancialGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
}

interface FinancialHealth {
  score: number;
  level: string;
  emergencyFundStatus: number;
  savingsRate: number;
  debtRatio: number;
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
  { id: "coach", label: "🤖 Coach", icon: FaRobot },
];

// ─── Overview Tab (ENHANCED) ─────────────────────────────────────────────────
function OverviewTab({
  monthlySalary,
  categories,
  totalExpenses,
  emergencyFundBalance,
  goals,
}: {
  monthlySalary: number;
  categories: SalaryCategory[];
  totalExpenses: number;
  emergencyFundBalance: number;
  goals: FinancialGoal[];
}) {
  const totalAllocated = categories.reduce(
    (sum, cat) => sum + cat.targetAmount,
    0,
  );
  const totalExpensesAmount = categories.reduce(
    (sum, cat) => sum + cat.expensesAmount,
    0,
  );
  const remainingSalary = monthlySalary - totalAllocated;
  const completionPercentage =
    monthlySalary > 0
      ? Math.round((totalExpensesAmount / monthlySalary) * 100)
      : 0;

  const totalSavings =
    categories.find((c) => c.key === "savings")?.targetAmount || 0;
  const totalInvestments =
    categories.find((c) => c.key === "investments")?.targetAmount || 0;

  const goalsCompleted = goals.filter(
    (g) => g.currentAmount >= g.targetAmount,
  ).length;
  const totalGoalProgress =
    goals.length > 0 ? Math.round((goalsCompleted / goals.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl shadow-lg p-8">
        <h2 className="text-3xl font-bold mb-2">Financial Overview</h2>
        <p className="text-sm opacity-90">
          Your complete financial snapshot at a glance
        </p>
      </div>

      {/* Primary Metrics - 3 Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400 uppercase">
                Monthly Salary
              </p>
              <p className="text-3xl font-black text-gray-900 dark:text-white mt-2">
                ₹{monthlySalary.toLocaleString()}
              </p>
            </div>
            <div className="text-4xl opacity-20">💰</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400 uppercase">
                Total Allocated
              </p>
              <p className="text-3xl font-black text-indigo-600 mt-2">
                ₹{totalAllocated.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {Math.round((totalAllocated / monthlySalary) * 100)}% of salary
              </p>
            </div>
            <div className="text-4xl opacity-20">📊</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
          <div className="flex items-center justify-between">
            <div>
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
            <div className="text-4xl opacity-20">✨</div>
          </div>
        </div>
      </div>

      {/* Secondary Metrics - 4 Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-200 dark:border-blue-800 p-4">
          <p className="text-xs text-blue-700 dark:text-blue-400 uppercase font-semibold">
            Total Expenses
          </p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-2">
            ₹{totalExpensesAmount.toLocaleString()}
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
            {completionPercentage}% of salary
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

      {/* Progress Bars - 2 Columns */}
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
              {completionPercentage}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div
              className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all"
              style={{ width: `${Math.min(completionPercentage, 100)}%` }}
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
              {totalGoalProgress}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div
              className="h-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 transition-all"
              style={{ width: `${totalGoalProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
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
                    width: `${Math.min((cat.expensesAmount / cat.targetAmount) * 100, 100)}%`,
                    background: cat.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Financial Tips */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl border border-indigo-200 dark:border-indigo-800 p-6">
        <h3 className="font-bold text-indigo-900 dark:text-indigo-200 mb-3">
          💡 Financial Insights
        </h3>
        <ul className="space-y-2 text-sm text-indigo-800 dark:text-indigo-300">
          <li>
            ✓ Your spending is at {completionPercentage}% of monthly salary
          </li>
          <li>
            ✓ You have ₹{remainingSalary.toLocaleString()} remaining unallocated
          </li>
          <li>
            ✓ Emergency fund covers{" "}
            {emergencyFundBalance > 0
              ? Math.round(emergencyFundBalance / (monthlySalary / 30))
              : 0}{" "}
            days of expenses
          </li>
          <li>
            ✓{" "}
            {goalsCompleted === goals.length
              ? "All financial goals on track! 🎉"
              : `${goals.length - goalsCompleted} goal(s) in progress`}
          </li>
        </ul>
      </div>
    </div>
  );
}

// ─── Salary Plan Tab ─────────────────────────────────────────────────────────
function SalaryTab({
  monthlySalary,
  setMonthlySalary,
  categories,
  setCategories,
  selectedPlan,
  setSelectedPlan,
}: {
  monthlySalary: number;
  setMonthlySalary: (val: number) => void;
  categories: SalaryCategory[];
  setCategories: (val: SalaryCategory[]) => void;
  selectedPlan: string | null;
  setSelectedPlan: (val: string | null) => void;
}) {
  const [salaryInput, setSalaryInput] = useState<string>("");
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [showCustomPlan, setShowCustomPlan] = useState(false);
  const [customAllocation, setCustomAllocation] = useState({
    essentials: 50,
    savings: 10,
    emergencyFund: 10,
    lifestyle: 10,
    investments: 15,
    debt: 5,
  });

  const handleSetSalary = () => {
    const salary = Number(salaryInput);
    if (salary <= 0) {
      toast.error("Please enter a valid salary");
      return;
    }
    setMonthlySalary(salary);
    toast.success(`Salary set to ₹${salary.toLocaleString()}`);
  };

  const handleSelectPlan = (plan: (typeof PREDEFINED_PLANS)[0]) => {
    if (monthlySalary === 0) {
      toast.error("Enter salary first");
      return;
    }

    const newCategories: SalaryCategory[] = Object.entries(plan.allocation).map(
      ([key, percentage]) => ({
        key,
        label: CATEGORY_INFO[key]?.label || key,
        percentage,
        targetAmount: Math.round((monthlySalary * percentage) / 100),
        expensesAmount: 0,
        remainingAmount: Math.round((monthlySalary * percentage) / 100),
        isCompleted: false,
        color: CATEGORY_INFO[key]?.color || "#6b7280",
        icon: CATEGORY_INFO[key]?.icon || "📌",
      }),
    );

    setCategories(newCategories);
    setSelectedPlan(plan.id);
    toast.success(`${plan.name} selected!`);
  };

  const customTotal = Object.values(customAllocation).reduce(
    (a, b) => a + b,
    0,
  );

  const handleCustomChange = (key: string, value: number) => {
    setCustomAllocation((prev) => ({ ...prev, [key]: value }));
  };

  const handleApplyCustom = () => {
    if (customTotal !== 100) {
      toast.error(`Total must be 100% (currently ${customTotal}%)`);
      return;
    }

    const newCategories: SalaryCategory[] = Object.entries(
      customAllocation,
    ).map(([key, percentage]) => ({
      key,
      label: CATEGORY_INFO[key]?.label || key,
      percentage,
      targetAmount: Math.round((monthlySalary * percentage) / 100),
      expensesAmount: 0,
      remainingAmount: Math.round((monthlySalary * percentage) / 100),
      isCompleted: false,
      color: CATEGORY_INFO[key]?.color || "#6b7280",
      icon: CATEGORY_INFO[key]?.icon || "📌",
    }));

    setCategories(newCategories);
    setSelectedPlan("custom");
    toast.success("Custom plan applied!");
    setShowCustomPlan(false);
  };

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
            onKeyPress={(e) => e.key === "Enter" && handleSetSalary()}
            placeholder="Enter monthly salary"
            className="flex-1 px-4 py-3 rounded-lg text-black"
          />
          <button
            onClick={handleSetSalary}
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
      <div className="space-y-6">
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
                onClick={() => handleSelectPlan(plan)}
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
                    .map(([key, pct]) => (
                      <div key={key} className="flex justify-between">
                        <span>{key}:</span>
                        <span className="font-semibold">{pct}%</span>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>

          {/* Custom Plan Button */}
          <button
            onClick={() => setShowCustomPlan(!showCustomPlan)}
            className="mt-6 flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-semibold"
          >
            {showCustomPlan ? <FaChevronUp /> : <FaChevronDown />}
            Create Custom Plan
          </button>

          {/* Custom Plan Form */}
          {showCustomPlan && (
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
                {Object.entries(customAllocation).map(([key, value]) => (
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
                        handleCustomChange(key, Number(e.target.value))
                      }
                      className="w-full"
                    />
                  </div>
                ))}
              </div>

              <button
                onClick={handleApplyCustom}
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
            onClick={() => setMonthlySalary(0)}
            className="mt-6 text-indigo-600 text-sm font-semibold hover:text-indigo-700"
          >
            ← Change Salary
          </button>
        </div>
      </div>
    );
  }

  const totalAllocated = categories.reduce(
    (sum, cat) => sum + cat.targetAmount,
    0,
  );
  const totalExpenses = categories.reduce(
    (sum, cat) => sum + cat.expensesAmount,
    0,
  );

  return (
    <div className="space-y-6">
      {/* Dashboard */}
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
            onClick={() => {
              setSelectedPlan(null);
              setCategories([]);
            }}
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm hover:bg-gray-200"
          >
            <FaRedo className="w-3 h-3" /> Change Plan
          </button>
        </div>

        {/* Summary Cards */}
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
              ₹{totalExpenses.toLocaleString()}
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
                ? Math.round((totalExpenses / monthlySalary) * 100)
                : 0}
              %
            </p>
          </div>
        </div>

        {/* Progress */}
        <div>
          <div className="flex justify-between mb-2 text-sm">
            <span className="font-medium">Overall Progress</span>
            <span className="font-bold">
              {monthlySalary > 0
                ? Math.round((totalExpenses / monthlySalary) * 100)
                : 0}
              %
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
            <div
              className="h-4 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600"
              style={{
                width: `${Math.min((totalExpenses / monthlySalary) * 100, 100)}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-3">
        <h3 className="font-bold text-gray-900 dark:text-white">Categories</h3>
        {categories.map((category) => {
          const progress =
            (category.expensesAmount / category.targetAmount) * 100;
          const remaining = category.targetAmount - category.expensesAmount;

          return (
            <div
              key={category.key}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden"
            >
              {/* Header */}
              <button
                onClick={() =>
                  setExpandedCategory(
                    expandedCategory === category.key ? null : category.key,
                  )
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
                  {expandedCategory === category.key ? (
                    <FaChevronUp />
                  ) : (
                    <FaChevronDown />
                  )}
                </div>
              </button>

              {/* Details */}
              {expandedCategory === category.key && (
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

// ─── Expenses Tab (UPDATED - Links to Salary Categories) ────────────────────
function ExpensesTab({
  expenses,
  categories,
  onAddExpense,
}: {
  expenses: Expense[];
  categories: SalaryCategory[];
  onAddExpense: (expense: Expense) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    category: "Groceries",
    salaryCategory: categories[0]?.key || "essentials",
    amount: "",
    description: "",
    date: new Date().toISOString().slice(0, 10),
  });
  const [saving, setSaving] = useState(false);

  const handleAddExpense = async () => {
    if (!form.amount) {
      toast.error("Enter amount");
      return;
    }

    setSaving(true);
    try {
      const newExpense: Expense = {
        _id: Date.now().toString(),
        category: form.category,
        salaryCategory: form.salaryCategory,
        amount: Number(form.amount),
        description: form.description,
        date: form.date,
      };

      // Save to backend
      await api.post("/expenses", newExpense);

      onAddExpense(newExpense);
      setForm({
        category: "Groceries",
        salaryCategory: categories[0]?.key || "essentials",
        amount: "",
        description: "",
        date: new Date().toISOString().slice(0, 10),
      });
      setShowForm(false);
      toast.success("Expense added!");
    } catch (error) {
      toast.error("Failed to add expense");
    } finally {
      setSaving(false);
    }
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6">
      {/* Total */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl shadow-lg p-6">
        <p className="text-sm opacity-90">Total Spending (This Month)</p>
        <p className="text-4xl font-black mt-2">
          ₹{totalExpenses.toLocaleString()}
        </p>
      </div>

      {/* Add Button */}
      <button
        onClick={() => setShowForm(!showForm)}
        className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700"
      >
        <FaPlus className="w-3 h-3" /> Add Expense
      </button>

      {/* Form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
          <h3 className="font-bold text-gray-900 dark:text-white mb-4">
            Add New Expense
          </h3>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Expense Description
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
                Assign to Category
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
                  Amount
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
                  Date
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
                onClick={handleAddExpense}
                disabled={saving}
                className="flex-1 bg-indigo-600 text-white rounded-lg py-2 font-semibold hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Add Expense"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Expenses List */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        {expenses.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No expenses yet</div>
        ) : (
          expenses.map((exp) => {
            const salaryCategory = categories.find(
              (c) => c.key === exp.salaryCategory,
            );
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
                    {salaryCategory?.label} •{" "}
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

// ─── Savings Tab (NEW) ───────────────────────────────────────────────────────
function SavingsTab({
  categories,
  emergencyFundBalance,
  setEmergencyFundBalance,
}: {
  categories: SalaryCategory[];
  emergencyFundBalance: number;
  setEmergencyFundBalance: (val: number) => void;
}) {
  const [addAmount, setAddAmount] = useState("");
  const [targetAmount, setTargetAmount] = useState(300000);

  const savingsCategory = categories.find((c) => c.key === "savings");
  const investmentsCategory = categories.find((c) => c.key === "investments");
  const emergencyCategory = categories.find((c) => c.key === "emergencyFund");

  const emergencyProgress = (emergencyFundBalance / targetAmount) * 100;

  const handleAddFunds = () => {
    const amount = Number(addAmount);
    if (amount > 0) {
      setEmergencyFundBalance(emergencyFundBalance + amount);
      toast.success(`₹${amount.toLocaleString()} added!`);
      setAddAmount("");
    } else {
      toast.error("Enter valid amount");
    }
  };

  return (
    <div className="space-y-6">
      {/* Savings Card */}
      {savingsCategory && (
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/30 rounded-2xl border-2 border-blue-200 dark:border-blue-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">
                💾 Savings
              </p>
              <p className="text-3xl font-black text-blue-600 dark:text-blue-400 mt-1">
                ₹{savingsCategory.targetAmount.toLocaleString()}
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                {savingsCategory.percentage}% of monthly salary
              </p>
            </div>
            <div className="text-6xl opacity-20">💾</div>
          </div>

          <div className="w-full bg-blue-200 dark:bg-blue-900 rounded-full h-4">
            <div
              className="h-4 rounded-full bg-gradient-to-r from-blue-500 to-blue-600"
              style={{
                width: `${Math.min((savingsCategory.expensesAmount / savingsCategory.targetAmount) * 100, 100)}%`,
              }}
            />
          </div>

          <div className="flex justify-between text-xs text-blue-600 dark:text-blue-400 mt-2">
            <span>
              ₹{savingsCategory.expensesAmount.toLocaleString()} allocated
            </span>
            <span className="font-bold">
              {savingsCategory.targetAmount > 0
                ? Math.round(
                    (savingsCategory.expensesAmount /
                      savingsCategory.targetAmount) *
                      100,
                  )
                : 0}
              %
            </span>
          </div>
        </div>
      )}

      {/* Investments Card */}
      {investmentsCategory && (
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-900/30 rounded-2xl border-2 border-emerald-200 dark:border-emerald-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                📈 Investments
              </p>
              <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                ₹{investmentsCategory.targetAmount.toLocaleString()}
              </p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                {investmentsCategory.percentage}% of monthly salary
              </p>
            </div>
            <div className="text-6xl opacity-20">📈</div>
          </div>

          <div className="w-full bg-emerald-200 dark:bg-emerald-900 rounded-full h-4">
            <div
              className="h-4 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600"
              style={{
                width: `${Math.min((investmentsCategory.expensesAmount / investmentsCategory.targetAmount) * 100, 100)}%`,
              }}
            />
          </div>

          <div className="flex justify-between text-xs text-emerald-600 dark:text-emerald-400 mt-2">
            <span>
              ₹{investmentsCategory.expensesAmount.toLocaleString()} allocated
            </span>
            <span className="font-bold">
              {investmentsCategory.targetAmount > 0
                ? Math.round(
                    (investmentsCategory.expensesAmount /
                      investmentsCategory.targetAmount) *
                      100,
                  )
                : 0}
              %
            </span>
          </div>
        </div>
      )}

      {/* Emergency Fund Card */}
      {emergencyCategory && (
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
                Target: ₹{targetAmount.toLocaleString()}
              </p>
            </div>
            <div className="text-6xl opacity-20">🛡️</div>
          </div>

          <div className="w-full bg-orange-200 dark:bg-orange-900 rounded-full h-4 mb-4">
            <div
              className="h-4 rounded-full bg-gradient-to-r from-orange-500 to-orange-600"
              style={{
                width: `${Math.min(emergencyProgress, 100)}%`,
              }}
            />
          </div>

          <div className="flex justify-between text-xs text-orange-600 dark:text-orange-400 mb-4">
            <span>₹{emergencyFundBalance.toLocaleString()} saved</span>
            <span className="font-bold">{Math.round(emergencyProgress)}%</span>
          </div>

          {/* Add Funds */}
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
                onClick={handleAddFunds}
                className="px-4 py-1.5 bg-orange-600 text-white rounded font-semibold text-sm hover:bg-orange-700"
              >
                <FaPlus className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Target Slider */}
          <div className="bg-white dark:bg-gray-900 rounded-lg p-3">
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-2">
              Target: ₹{targetAmount.toLocaleString()}
            </label>
            <input
              type="range"
              min="50000"
              max="1000000"
              step="50000"
              value={targetAmount}
              onChange={(e) => setTargetAmount(Number(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Messages */}
          {emergencyFundBalance < targetAmount && (
            <div className="mt-4 p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <p className="text-xs text-orange-800 dark:text-orange-200">
                Need ₹{(targetAmount - emergencyFundBalance).toLocaleString()}{" "}
                more
              </p>
            </div>
          )}
          {emergencyFundBalance >= targetAmount && (
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

// ─── Goals Tab ──────────────────────────────────────────────────────────────
function GoalsTab() {
  const [goals, setGoals] = useState<FinancialGoal[]>([
    {
      id: "1",
      name: "Buy Car",
      targetAmount: 1000000,
      currentAmount: 300000,
      deadline: "2026-12-31",
    },
    {
      id: "2",
      name: "Home Downpayment",
      targetAmount: 2500000,
      currentAmount: 800000,
      deadline: "2028-06-30",
    },
    {
      id: "3",
      name: "Vacation",
      targetAmount: 200000,
      currentAmount: 50000,
      deadline: "2026-12-25",
    },
  ]);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    targetAmount: "",
    deadline: "",
  });

  const handleAddGoal = () => {
    if (!formData.name || !formData.targetAmount || !formData.deadline) {
      toast.error("Fill all fields");
      return;
    }

    const newGoal: FinancialGoal = {
      id: Date.now().toString(),
      name: formData.name,
      targetAmount: Number(formData.targetAmount),
      currentAmount: 0,
      deadline: formData.deadline,
    };

    setGoals([...goals, newGoal]);
    toast.success("Goal added!");
    setFormData({ name: "", targetAmount: "", deadline: "" });
    setShowAddGoal(false);
  };

  const handleDeleteGoal = (id: string) => {
    setGoals(goals.filter((g) => g.id !== id));
    toast.success("Goal deleted");
  };

  return (
    <div className="space-y-4">
      <button
        onClick={() => setShowAddGoal(true)}
        className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700"
      >
        <FaPlus className="w-3 h-3" /> Add Goal
      </button>

      {/* Modal */}
      {showAddGoal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Create Goal
              </h3>
              <button
                onClick={() => setShowAddGoal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            </div>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Goal name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg px-4 py-2"
              />

              <input
                type="number"
                placeholder="Target amount"
                value={formData.targetAmount}
                onChange={(e) =>
                  setFormData({ ...formData, targetAmount: e.target.value })
                }
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg px-4 py-2"
              />

              <input
                type="date"
                value={formData.deadline}
                onChange={(e) =>
                  setFormData({ ...formData, deadline: e.target.value })
                }
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg px-4 py-2"
              />

              <div className="flex gap-2">
                <button
                  onClick={() => setShowAddGoal(false)}
                  className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg py-2 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddGoal}
                  className="flex-1 bg-indigo-600 text-white rounded-lg py-2 font-semibold hover:bg-indigo-700"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Goals List */}
      {goals.map((goal) => {
        const progress = (goal.currentAmount / goal.targetAmount) * 100;
        return (
          <div
            key={goal.id}
            className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6"
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white">
                  {goal.name}
                </h4>
                <p className="text-xs text-gray-500">
                  Target: {new Date(goal.deadline).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => handleDeleteGoal(goal.id)}
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

// ─── AI Coach Tab ───────────────────────────────────────────────────────────
function CoachTab() {
  const [query, setQuery] = useState("");
  const [advice, setAdvice] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAsk = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await api.post("/financial/ai-coach", { query });
      setAdvice(res.data.data.advice);
      setQuery("");
    } catch {
      toast.error("Failed to get advice");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
        <h3 className="font-bold text-gray-900 dark:text-white mb-4">
          💬 Ask Your Coach
        </h3>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleAsk()}
            placeholder="Ask financial questions..."
            className="flex-1 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl px-4 py-2.5 text-sm"
          />
          <button
            onClick={handleAsk}
            disabled={loading}
            className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-indigo-700"
          >
            {loading ? "..." : "Ask"}
          </button>
        </div>

        {advice && (
          <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl p-4">
            <p className="text-sm text-indigo-900 dark:text-indigo-200">
              {advice}
            </p>
          </div>
        )}
      </div>

      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-2xl p-6">
        <h4 className="font-bold text-yellow-900 dark:text-yellow-200 mb-3">
          📚 Tips
        </h4>
        <ul className="space-y-2 text-sm text-yellow-800 dark:text-yellow-300">
          <li>✓ Save 20-30% of income</li>
          <li>✓ Build 6-12 months emergency fund</li>
          <li>✓ Diversify investments</li>
          <li>✓ Review finances monthly</li>
        </ul>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function FinancialDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [monthlySalary, setMonthlySalary] = useState(0);
  const [categories, setCategories] = useState<SalaryCategory[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [emergencyFundBalance, setEmergencyFundBalance] = useState(0);
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [loading, setLoading] = useState(true);

  // Load data from backend
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [expRes, salaryRes, emergencyRes] = await Promise.all([
        api.get("/expenses").catch(() => ({ data: { data: [] } })),
        api
          .get("/financial/salary-allocation")
          .catch(() => ({ data: { data: null } })),
        api
          .get("/financial/emergency-fund")
          .catch(() => ({ data: { data: { balance: 0 } } })),
      ]);

      const loadedExpenses = expRes.data.data || [];
      setExpenses(loadedExpenses);

      // Update categories with expense amounts
      if (salaryRes.data.data) {
        const updatedCategories = categories.map((cat) => ({
          ...cat,
          expensesAmount: loadedExpenses
            .filter((e: Expense) => e.salaryCategory === cat.key)
            .reduce((sum: number, e: Expense) => sum + e.amount, 0),
          remainingAmount:
            cat.targetAmount -
            loadedExpenses
              .filter((e: Expense) => e.salaryCategory === cat.key)
              .reduce((sum: number, e: Expense) => sum + e.amount, 0),
        }));
        setCategories(updatedCategories);
      }

      setEmergencyFundBalance(emergencyRes.data.data?.balance || 0);
    } catch (error) {
      console.log("Error loading data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = (expense: Expense) => {
    setExpenses([...expenses, expense]);

    // Update category expenses
    setCategories(
      categories.map((cat) =>
        cat.key === expense.salaryCategory
          ? {
              ...cat,
              expensesAmount: cat.expensesAmount + expense.amount,
              remainingAmount: cat.remainingAmount - expense.amount,
            }
          : cat,
      ),
    );
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
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Financial Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your money with complete control
          </p>
        </div>

        {/* Tabs */}
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
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === "overview" && (
            <OverviewTab
              monthlySalary={monthlySalary}
              categories={categories}
              totalExpenses={expenses.reduce((sum, e) => sum + e.amount, 0)}
              emergencyFundBalance={emergencyFundBalance}
              goals={goals}
            />
          )}

          {activeTab === "salary" && (
            <SalaryTab
              monthlySalary={monthlySalary}
              setMonthlySalary={setMonthlySalary}
              categories={categories}
              setCategories={setCategories}
              selectedPlan={selectedPlan}
              setSelectedPlan={setSelectedPlan}
            />
          )}

          {activeTab === "savings" && (
            <SavingsTab
              categories={categories}
              emergencyFundBalance={emergencyFundBalance}
              setEmergencyFundBalance={setEmergencyFundBalance}
            />
          )}

          {activeTab === "expenses" && (
            <ExpensesTab
              expenses={expenses}
              categories={categories}
              onAddExpense={handleAddExpense}
            />
          )}

          {activeTab === "goals" && <GoalsTab />}

          {activeTab === "coach" && <CoachTab />}
        </div>
      </div>
    </DashboardLayout>
  );
}
