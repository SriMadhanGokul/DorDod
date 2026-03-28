import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { api } from "@/utils/api";
import toast from "react-hot-toast";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  FaTrophy,
  FaChartLine,
  FaCalendarCheck,
  FaStar,
  FaBook,
} from "react-icons/fa";

const COLORS = [
  "hsl(232,65%,30%)",
  "hsl(43,95%,56%)",
  "hsl(160,64%,40%)",
  "hsl(0,84%,60%)",
  "hsl(280,60%,50%)",
  "hsl(200,70%,45%)",
];

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/analytics")
      .then((r) => setData(r.data.data))
      .catch(() => toast.error("Failed to load analytics"))
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <DashboardLayout>
        <div className="flex justify-center py-24">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );

  const s = data?.stats || {};

  const statCards = [
    {
      icon: FaChartLine,
      label: "Skills Mastered",
      value: s.skillsAssessed ?? 0,
      sub: `${s.skillsLearned ?? 0} learned · ${s.skillsLearning ?? 0} in progress`,
      color: "text-primary",
    },
    {
      icon: FaTrophy,
      label: "Goals Completed",
      value: s.goalsCompleted ?? 0,
      sub: `${s.goalsInProgress ?? 0} in progress`,
      color: "text-secondary",
    },
    {
      icon: FaCalendarCheck,
      label: "Habit Completion",
      value: `${s.habitCompletionRate ?? 0}%`,
      sub: `${s.totalHabits ?? 0} habits · ${s.bestStreak ?? 0}-day streak`,
      color: "text-success",
    },
    {
      icon: FaBook,
      label: "Courses Enrolled",
      value: s.coursesEnrolled ?? 0,
      sub: `${s.coursesCompleted ?? 0} completed · avg ${s.avgLearningProgress ?? 0}%`,
      color: "text-destructive",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Analytics</h1>
          <p className="text-foreground-muted mt-1">Your real growth data</p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card, i) => (
            <div key={i} className="stat-card">
              <card.icon className={`${card.color} text-lg mb-2`} />
              <p className="text-2xl font-bold">{card.value}</p>
              <p className="text-xs text-foreground-muted">{card.label}</p>
              <p className="text-xs text-success mt-1">{card.sub}</p>
            </div>
          ))}
        </div>

        {/* Nearly done courses — encouragement banner */}
        {s.nearlyDoneCourses?.length > 0 && (
          <div className="card-elevated border-l-4 border-l-secondary bg-secondary/5">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              🏁 Almost There! Finish these courses
            </h3>
            <div className="space-y-3">
              {s.nearlyDoneCourses.map((c: any, i: number) => (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{c.title}</span>
                    <span className="text-secondary font-bold">
                      {c.progress}% done
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2.5">
                    <div
                      className="bg-secondary rounded-full h-2.5 transition-all"
                      style={{ width: `${c.progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-foreground-muted mt-1">
                    {c.progress >= 90
                      ? "🔥 So close! Just a little more!"
                      : c.progress >= 80
                        ? "💪 Great progress! Don't stop now!"
                        : "⚡ You're 75% there — keep pushing!"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills progress */}
        {s.skillsAssessed > 0 && (
          <div className="card-elevated">
            <h3 className="font-semibold mb-4">My Skills Progress</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-success/10 rounded-xl">
                <p className="text-2xl font-bold text-success">
                  {s.skillsLearned}
                </p>
                <p className="text-xs text-foreground-muted mt-1">✅ Learned</p>
              </div>
              <div className="p-3 bg-primary/10 rounded-xl">
                <p className="text-2xl font-bold text-primary">
                  {s.skillsLearning}
                </p>
                <p className="text-xs text-foreground-muted mt-1">
                  📖 Learning
                </p>
              </div>
              <div className="p-3 bg-muted rounded-xl">
                <p className="text-2xl font-bold text-foreground-muted">
                  {s.skillsAssessed - s.skillsLearned - s.skillsLearning}
                </p>
                <p className="text-xs text-foreground-muted mt-1">
                  ⏳ To Learn
                </p>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-xs text-foreground-muted mb-1">
                <span>Mastery Progress</span>
                <span>
                  {s.skillsAssessed > 0
                    ? Math.round((s.skillsLearned / s.skillsAssessed) * 100)
                    : 0}
                  %
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-success rounded-full h-2 transition-all"
                  style={{
                    width: `${s.skillsAssessed > 0 ? Math.round((s.skillsLearned / s.skillsAssessed) * 100) : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Goals over time */}
          <div className="card-elevated">
            <h3 className="font-semibold mb-4">Goals Created Over Time</h3>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={data?.monthlyData || []}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "hsl(var(--foreground-muted))", fontSize: 12 }}
                />
                <YAxis
                  tick={{ fill: "hsl(var(--foreground-muted))", fontSize: 12 }}
                />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="goals"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Goals completed */}
          <div className="card-elevated">
            <h3 className="font-semibold mb-4">Goals Completed Per Month</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data?.monthlyData || []}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "hsl(var(--foreground-muted))", fontSize: 12 }}
                />
                <YAxis
                  tick={{ fill: "hsl(var(--foreground-muted))", fontSize: 12 }}
                />
                <Tooltip />
                <Bar
                  dataKey="completed"
                  fill="hsl(var(--secondary))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Habit completion */}
          <div className="card-elevated">
            <h3 className="font-semibold mb-4">Habit Completion Rate</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={data?.monthlyData || []}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "hsl(var(--foreground-muted))", fontSize: 12 }}
                />
                <YAxis
                  tick={{ fill: "hsl(var(--foreground-muted))", fontSize: 12 }}
                />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="habits"
                  stroke="hsl(var(--success))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--success))" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Goals by category */}
          <div className="card-elevated">
            <h3 className="font-semibold mb-4">Goals by Category</h3>
            {data?.categoryData?.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={data.categoryData}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {data.categoryData.map((_: any, i: number) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-foreground-muted text-sm">
                Create goals to see category breakdown
              </div>
            )}
          </div>
        </div>

        {/* Key achievements */}
        <div className="card-elevated">
          <h3 className="font-semibold mb-4">
            🏆 Key Achievements & Encouragements
          </h3>
          <div className="grid md:grid-cols-2 gap-3">
            {(data?.achievements || []).map((a: string, i: number) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted"
              >
                <span className="text-lg shrink-0">{a.slice(0, 2)}</span>
                <span className="text-sm">{a.slice(2)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="card-elevated">
          <h3 className="font-semibold mb-4">Progress Summary</h3>
          <div className="grid md:grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-muted rounded-xl">
              <p className="text-3xl font-bold text-primary">
                {s.goalsTotal ?? 0}
              </p>
              <p className="text-sm text-foreground-muted mt-1">Total Goals</p>
            </div>
            <div className="p-4 bg-muted rounded-xl">
              <p className="text-3xl font-bold text-success">
                {s.totalHabits ?? 0}
              </p>
              <p className="text-sm text-foreground-muted mt-1">
                Active Habits
              </p>
            </div>
            <div className="p-4 bg-muted rounded-xl">
              <p className="text-3xl font-bold text-secondary">
                {s.avgLearningProgress ?? 0}%
              </p>
              <p className="text-sm text-foreground-muted mt-1">
                Avg Course Progress
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
