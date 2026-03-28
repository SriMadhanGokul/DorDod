import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import SetupPasswordPage from "./pages/SetupPasswordPage";
import PricingPage from "./pages/PricingPage";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();
const Protected = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>{children}</ProtectedRoute>
);

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
            {/* Public */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/pricing" element={<PricingPage />} />

            {/* Semi-protected (needs JWT but not full auth check) */}
            <Route
              path="/setup-password"
              element={
                <Protected>
                  <SetupPasswordPage />
                </Protected>
              }
            />

            {/* Protected */}
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
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
