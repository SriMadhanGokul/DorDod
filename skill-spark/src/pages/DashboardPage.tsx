import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/utils/api";
import toast from "react-hot-toast";
import {
  FaBullseye,
  FaLightbulb,
  FaCalendarCheck,
  FaTrophy,
} from "react-icons/fa";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";

interface DashboardData {
  stats: {
    skillsAssessed: number;
    activeGoals: number;
    habitsTracked: number;
    achievements: number;
  };
  radarData: { skill: string; current: number; desired: number }[];
  activeGoals: {
    _id: string;
    title: string;
    progress: number;
    priority: string;
  }[];
  habit: { name: string; days: boolean[]; streak: number } | null;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/dashboard")
      .then((r) => setData(r.data.data))
      .catch(() => toast.error("Failed to load dashboard"))
      .finally(() => setLoading(false));
  }, []);

  const stats = data
    ? [
        {
          icon: FaLightbulb,
          label: "Skills Assessed",
          value: data.stats.skillsAssessed,
          color: "bg-primary-light text-primary",
        },
        {
          icon: FaBullseye,
          label: "Active Goals",
          value: data.stats.activeGoals,
          color: "bg-secondary/20 text-secondary",
        },
        {
          icon: FaCalendarCheck,
          label: "Habits Tracked",
          value: data.stats.habitsTracked,
          color: "bg-success/20 text-success",
        },
        {
          icon: FaTrophy,
          label: "Achievements",
          value: data.stats.achievements,
          color: "bg-destructive/10 text-destructive",
        },
      ]
    : [];

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">
            Welcome back, {user?.name?.split(" ")[0]}! 👋
          </h1>
          <p className="text-foreground-muted mt-1">
            Here's your growth overview
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && data && (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.map((s, i) => (
                <div key={i} className="stat-card flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-xl ${s.color} flex items-center justify-center`}
                  >
                    <s.icon className="text-lg" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{s.value}</p>
                    <p className="text-xs text-foreground-muted">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Skill Radar */}
              <div className="card-elevated">
                <h2 className="text-lg font-semibold mb-4">Skill Overview</h2>
                {data.radarData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <RadarChart data={data.radarData}>
                      <PolarGrid stroke="hsl(var(--border))" />
                      <PolarAngleAxis
                        dataKey="skill"
                        tick={{
                          fill: "hsl(var(--foreground-muted))",
                          fontSize: 12,
                        }}
                      />
                      <PolarRadiusAxis
                        angle={30}
                        domain={[0, 5]}
                        tick={{
                          fill: "hsl(var(--foreground-muted))",
                          fontSize: 10,
                        }}
                      />
                      <Radar
                        name="Current"
                        dataKey="current"
                        stroke="hsl(var(--primary))"
                        fill="hsl(var(--primary))"
                        fillOpacity={0.3}
                      />
                      <Radar
                        name="Desired"
                        dataKey="desired"
                        stroke="hsl(var(--secondary))"
                        fill="hsl(var(--secondary))"
                        fillOpacity={0.2}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[280px] text-foreground-muted text-sm">
                    Complete your skill assessment to see the radar chart
                  </div>
                )}
              </div>

              {/* Active Goals */}
              <div className="card-elevated">
                <h2 className="text-lg font-semibold mb-4">Active Goals</h2>
                {data.activeGoals.length > 0 ? (
                  <div className="space-y-4">
                    {data.activeGoals.map((g) => (
                      <div key={g._id}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium">{g.title}</span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              g.priority === "High"
                                ? "bg-destructive/10 text-destructive"
                                : g.priority === "Medium"
                                  ? "bg-secondary/20 text-secondary-foreground"
                                  : "bg-muted text-foreground-muted"
                            }`}
                          >
                            {g.priority}
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-primary rounded-full h-2 transition-all"
                            style={{ width: `${g.progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-foreground-muted">
                          {g.progress}%
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[200px] text-foreground-muted text-sm">
                    No active goals yet — create one in Goals!
                  </div>
                )}
              </div>
            </div>

            {/* Habit Grid */}
            {data.habit ? (
              <div className="card-elevated">
                <h2 className="text-lg font-semibold mb-4">
                  21-Day Habit: {data.habit.name}
                </h2>
                <div className="flex flex-wrap gap-2">
                  {data.habit.days.map((done, i) => (
                    <div
                      key={i}
                      className={`habit-day ${done ? "habit-day-complete" : "habit-day-incomplete"}`}
                    >
                      {i + 1}
                    </div>
                  ))}
                </div>
                <p className="text-sm text-foreground-muted mt-3">
                  🔥 Current streak: {data.habit.streak} day
                  {data.habit.streak !== 1 ? "s" : ""}
                </p>
              </div>
            ) : (
              <div className="card-elevated text-center py-8 text-foreground-muted">
                <p className="font-medium">No habits tracked yet</p>
                <p className="text-sm mt-1">
                  Start a 21-day habit challenge in the Habits section!
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
