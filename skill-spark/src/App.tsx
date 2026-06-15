import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";

// ─── Public Pages ─────────────────────────────────────────────────────────────
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import SetupPasswordPage from "./pages/SetupPasswordPage";
import PricingPage from "./pages/PricingPage";
import NotFound from "./pages/NotFound";

// ─── User Pages ───────────────────────────────────────────────────────────────
import DashboardPage from "./pages/DashboardPage";
import SkillsPage from "./pages/SkillsPage";
import GoalsPage from "./pages/GoalsPage";
import DevPlanPage from "./pages/DevPlanPage";
import HabitsPage from "./pages/HabitsPage";
import LearningPage from "./pages/LearningPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import CommunityPage from "./pages/CommunityPage";
import ProfilePage from "./pages/ProfilePage";
import ScoreCardPage from "./pages/ScoreCardPage";
import AchievementsPage from "./pages/AchievementsPage";
import ActivitiesPage from "./pages/ActivitiesPage";
import DocumentsPage from "./pages/DocumentsPage";
import FrameOfMindPage from "./pages/FrameOfMindPage";
import ExecutionPage from "./pages/ExecutionPage";
import NetworkPage from "./pages/Networkpage";
import ResourcesPage from "./pages/Resourcespage";
import InsightsPage from "./pages/InsightsPage";
import GuidancePage from "./pages/GuidancePage";
import OnboardingPage from "./pages/OnboardingPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import XPHistoryPage from "./pages/XPHistoryPage";
import GrowthScorePage from "./pages/GrowthScorePage";
import ExpenseTrackerPage from "./pages/ExpenseTrackerPage";
import FinancialDashboard from "./pages/FinancialDashboard";
import ScopePage from "./pages/ScopePage";

// ─── Admin Pages ──────────────────────────────────────────────────────────────
import AdminDashboard from "./pages/admin/AdminDashboard";
import UsersPage from "./pages/admin/UsersPage";
import UserDetailsPage from "./pages/admin/UserDetailsPage";
import GoalsManagement from "./pages/admin/GoalsManagement";
import HabitsManagement from "./pages/admin/HabitsManagement";
import CoursesManagement from "./pages/admin/CoursesManagement";
import CommunityModeration from "./pages/admin/CommunityModeration";
import AchievementsManagement from "./pages/admin/AchievementsManagement";
import NotificationsPage from "./pages/admin/NotificationsPage";
import SettingsPage from "./pages/admin/SettingsPage";

const queryClient = new QueryClient();

// ─── Route Guards ─────────────────────────────────────────────────────────────
const Protected = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>{children}</ProtectedRoute>
);

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  if (!user) return <Navigate to="/login" replace />;
  if ((user as any).role !== "admin")
    return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

// ─── Helper Component ─────────────────────────────────────────────────────────
const ProtectedWithLayout = ({ children }: { children: React.ReactNode }) => (
  <Protected>
    <DashboardLayout>{children}</DashboardLayout>
  </Protected>
);

// ─── App ──────────────────────────────────────────────────────────────────────
const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              borderRadius: "0.75rem",
              padding: "12px 16px",
              fontSize: "14px",
            },
          }}
        />
        <BrowserRouter>
          <Routes>
            {/* ─── Public Routes ──────────────────────────────────────────── */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/pricing" element={<PricingPage />} />

            {/* ─── Semi-Protected (needs login) ───────────────────────────── */}
            <Route
              path="/setup-password"
              element={
                <ProtectedWithLayout>
                  <SetupPasswordPage />
                </ProtectedWithLayout>
              }
            />

            {/* ─── User Protected Routes WITH LAYOUT ────────────────────────── */}
            {/* ✅ ALL PROTECTED ROUTES NOW HAVE DASHBOARDLAYOUT */}

            <Route
              path="/dashboard"
              element={
                <ProtectedWithLayout>
                  <DashboardPage />
                </ProtectedWithLayout>
              }
            />
            <Route
              path="/goals"
              element={
                <ProtectedWithLayout>
                  <GoalsPage />
                </ProtectedWithLayout>
              }
            />
            <Route
              path="/habits"
              element={
                <ProtectedWithLayout>
                  <HabitsPage />
                </ProtectedWithLayout>
              }
            />
            <Route
              path="/skills"
              element={
                <ProtectedWithLayout>
                  <SkillsPage />
                </ProtectedWithLayout>
              }
            />
            <Route
              path="/development-plan"
              element={
                <ProtectedWithLayout>
                  <DevPlanPage />
                </ProtectedWithLayout>
              }
            />
            <Route
              path="/learning"
              element={
                <ProtectedWithLayout>
                  <LearningPage />
                </ProtectedWithLayout>
              }
            />
            <Route
              path="/analytics"
              element={
                <ProtectedWithLayout>
                  <AnalyticsPage />
                </ProtectedWithLayout>
              }
            />
            <Route
              path="/insights"
              element={
                <ProtectedWithLayout>
                  <InsightsPage />
                </ProtectedWithLayout>
              }
            />
            <Route
              path="/community"
              element={
                <ProtectedWithLayout>
                  <NetworkPage />
                </ProtectedWithLayout>
              }
            />
            <Route
              path="/network"
              element={
                <ProtectedWithLayout>
                  <NetworkPage />
                </ProtectedWithLayout>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedWithLayout>
                  <ProfilePage />
                </ProtectedWithLayout>
              }
            />
            <Route
              path="/scorecard"
              element={
                <ProtectedWithLayout>
                  <ScoreCardPage />
                </ProtectedWithLayout>
              }
            />
            <Route
              path="/achievements"
              element={
                <ProtectedWithLayout>
                  <AchievementsPage />
                </ProtectedWithLayout>
              }
            />
            <Route
              path="/execution"
              element={
                <ProtectedWithLayout>
                  <ExecutionPage />
                </ProtectedWithLayout>
              }
            />
            <Route
              path="/activities"
              element={
                <ProtectedWithLayout>
                  <ActivitiesPage />
                </ProtectedWithLayout>
              }
            />
            <Route
              path="/growth-score"
              element={
                <ProtectedWithLayout>
                  <GrowthScorePage />
                </ProtectedWithLayout>
              }
            />
            <Route
              path="/scop"
              element={
                <ProtectedWithLayout>
                  <ScopePage />
                </ProtectedWithLayout>
              }
            />
            <Route
              path="/expenses"
              element={
                <ProtectedWithLayout>
                  <ExpenseTrackerPage />
                </ProtectedWithLayout>
              }
            />
            <Route
              path="/financial"
              element={
                <ProtectedWithLayout>
                  <FinancialDashboard />
                </ProtectedWithLayout>
              }
            />
            <Route
              path="/documents"
              element={
                <ProtectedWithLayout>
                  <ResourcesPage />
                </ProtectedWithLayout>
              }
            />
            <Route
              path="/resources"
              element={
                <ProtectedWithLayout>
                  <ResourcesPage />
                </ProtectedWithLayout>
              }
            />
            <Route
              path="/frame-of-mind"
              element={
                <ProtectedWithLayout>
                  <FrameOfMindPage />
                </ProtectedWithLayout>
              }
            />
            <Route
              path="/guidance"
              element={
                <ProtectedWithLayout>
                  <GuidancePage />
                </ProtectedWithLayout>
              }
            />
            <Route
              path="/onboarding"
              element={
                <ProtectedWithLayout>
                  <OnboardingPage />
                </ProtectedWithLayout>
              }
            />
            <Route path="/execution/:goalId" element={<ExecutionPage />} />
            <Route
              path="/leaderboard"
              element={
                <ProtectedWithLayout>
                  <LeaderboardPage />
                </ProtectedWithLayout>
              }
            />
            <Route
              path="/xp-history"
              element={
                <ProtectedWithLayout>
                  <XPHistoryPage />
                </ProtectedWithLayout>
              }
            />

            {/* ─── Admin Routes ───────────────────────────────────────────── */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <AdminRoute>
                  <UsersPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/users/:id"
              element={
                <AdminRoute>
                  <UserDetailsPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/goals"
              element={
                <AdminRoute>
                  <GoalsManagement />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/habits"
              element={
                <AdminRoute>
                  <HabitsManagement />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/courses"
              element={
                <AdminRoute>
                  <CoursesManagement />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/community"
              element={
                <AdminRoute>
                  <CommunityModeration />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/achievements"
              element={
                <AdminRoute>
                  <AchievementsManagement />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/notifications"
              element={
                <AdminRoute>
                  <NotificationsPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <AdminRoute>
                  <SettingsPage />
                </AdminRoute>
              }
            />

            {/* ─── 404 ────────────────────────────────────────────────────── */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
