import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import SetupPasswordPage from "./pages/SetupPasswordPage";
import PricingPage from "./pages/PricingPage";
import NotFound from "./pages/NotFound";

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
import PendingCoursesPage from "./pages/admin/PendingCoursesPage";
import UserSkillsPage from "./pages/admin/UserSkillsPage";
import OnboardingPage from "./pages/OnboardingPage";

const queryClient = new QueryClient();

const Protected = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>{children}</ProtectedRoute>
);

// ✅ Fixed: !== not ! ==
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
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route
              path="/setup-password"
              element={
                <Protected>
                  <SetupPasswordPage />
                </Protected>
              }
            />
            <Route
              path="/dashboard"
              element={
                <Protected>
                  <DashboardPage />
                </Protected>
              }
            />
            <Route
              path="/skills"
              element={
                <Protected>
                  <SkillsPage />
                </Protected>
              }
            />
            <Route
              path="/goals"
              element={
                <Protected>
                  <GoalsPage />
                </Protected>
              }
            />
            <Route
              path="/development-plan"
              element={
                <Protected>
                  <DevPlanPage />
                </Protected>
              }
            />
            <Route
              path="/habits"
              element={
                <Protected>
                  <HabitsPage />
                </Protected>
              }
            />
            <Route
              path="/learning"
              element={
                <Protected>
                  <LearningPage />
                </Protected>
              }
            />
            <Route
              path="/analytics"
              element={
                <Protected>
                  <AnalyticsPage />
                </Protected>
              }
            />
            <Route
              path="/community"
              element={
                <Protected>
                  <CommunityPage />
                </Protected>
              }
            />
            <Route
              path="/profile"
              element={
                <Protected>
                  <ProfilePage />
                </Protected>
              }
            />
            <Route
              path="/scorecard"
              element={
                <Protected>
                  <ScoreCardPage />
                </Protected>
              }
            />
            <Route
              path="/achievements"
              element={
                <Protected>
                  <AchievementsPage />
                </Protected>
              }
            />
            <Route
              path="/activities"
              element={
                <Protected>
                  <ActivitiesPage />
                </Protected>
              }
            />
            <Route
              path="/documents"
              element={
                <Protected>
                  <DocumentsPage />
                </Protected>
              }
            />
            <Route
              path="/frame-of-mind"
              element={
                <Protected>
                  <FrameOfMindPage />
                </Protected>
              }
            />
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
            <Route
              path="/admin/pending-courses"
              element={
                <AdminRoute>
                  <PendingCoursesPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/user-skills"
              element={
                <AdminRoute>
                  <UserSkillsPage />
                </AdminRoute>
              }
            />
            <Route
              path="/onboarding"
              element={
                <Protected>
                  <OnboardingPage />
                </Protected>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
