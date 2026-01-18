import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import { MainLayout } from "./components/layout/MainLayout";
import { AdminLayout } from "./components/admin/AdminLayout";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import JobsPage from "./pages/JobsPage";
import JobDetailPage from "./pages/JobDetailPage";
import JobPortalPage from "./pages/JobPortalPage";
import PricingPage from "./pages/PricingPage";
import DashboardPage from "./pages/DashboardPage";
import OverviewPage from "./pages/dashboard/OverviewPage";
import ProfilePage from "./pages/dashboard/ProfilePage";
import ResumePage from "./pages/dashboard/ResumePage";
import SkillsPage from "./pages/dashboard/SkillsPage";
import ApplicationsPage from "./pages/dashboard/ApplicationsPage";
import NotificationsPage from "./pages/dashboard/NotificationsPage";
import SettingsPage from "./pages/dashboard/SettingsPage";
import MatchedJobs from "./pages/dashboard/MatchedJobs";
import UserPreferences from "./pages/dashboard/UserPreferences";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminJobs from "./pages/admin/AdminJobs";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminRoleManagement from "./pages/admin/AdminRoleManagement";
import AdminUsersManagement from "./pages/admin/AdminUsersManagement";
import AdminScraperConfig from "./pages/admin/AdminScraperConfig";
import AdminCompanies from "./pages/admin/AdminCompanies";
import CompanyVerification from "./pages/admin/CompanyVerification";
import CompanyAnalytics from "./pages/admin/CompanyAnalytics";
import AdminNotifications from "./pages/admin/AdminNotifications";
import AdminReferrals from "./pages/admin/AdminReferrals";
import AdminCrawlers from "./pages/admin/AdminCrawlers";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminRevenue from "./pages/admin/AdminRevenue";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminSkills from "./pages/admin/AdminSkills";
import AdminProfileFields from "./pages/admin/AdminProfileFields";
import AnalyticsDashboard from "./pages/admin/AnalyticsDashboard";
import UserEngagementAnalytics from "./pages/admin/UserEngagementAnalytics";
import CompanyPerformanceAnalytics from "./pages/admin/CompanyPerformanceAnalytics";
import RecommendationInsights from "./pages/admin/RecommendationInsights";
import AdminScraperManager from "./pages/admin/AdminScraperManager";
import AdminJobStats from "./pages/admin/AdminJobStats";
import NotFound from "./pages/NotFound";
// Removed: AdminJobMatching, MatchingProfiles, MatchingAnalytics (Phase 7 uses user-based matching instead)

const queryClient = new QueryClient();

const AppContent = () => {
  useEffect(() => {
    // Initialize auth from localStorage on app load
    const { initializeFromStorage } = useAuthStore.getState();
    initializeFromStorage();
  }, []);

  return (
    <Routes>
      {/* Auth pages without layout */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      
      {/* Main pages with layout - for regular users */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/jobs" element={<JobsPage />} />
        <Route path="/jobs/:id" element={<JobDetailPage />} />
        <Route path="/job-portal" element={<JobPortalPage />} />
        <Route path="/pricing" element={<PricingPage />} />
      </Route>

      {/* Dashboard pages with professional sidebar layout */}
      <Route 
        element={
          <ProtectedRoute requiredRole="user">
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<OverviewPage />} />
        <Route path="/dashboard/overview" element={<OverviewPage />} />
        <Route path="/dashboard/profile" element={<ProfilePage />} />
        <Route path="/dashboard/resume" element={<ResumePage />} />
        <Route path="/dashboard/skills" element={<SkillsPage />} />
        <Route path="/dashboard/applications" element={<ApplicationsPage />} />
        <Route path="/dashboard/notifications" element={<NotificationsPage />} />
        <Route path="/dashboard/settings" element={<SettingsPage />} />
        <Route path="/dashboard/matched-jobs" element={<MatchedJobs />} />
        <Route path="/dashboard/preferences" element={<UserPreferences />} />
        <Route path="/dashboard/legacy" element={<DashboardPage />} />
      </Route>

      {/* Admin pages with admin layout - for admin users only */}
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="jobs" element={<AdminJobs />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="role-management" element={<AdminRoleManagement />} />
        <Route path="users-management" element={<AdminUsersManagement />} />
        <Route path="scraper-config" element={<AdminScraperConfig />} />
        <Route path="job-scraping" element={<AdminScraperManager />} />
        <Route path="job-stats" element={<AdminJobStats />} />
        <Route path="companies" element={<AdminCompanies />} />
        <Route path="company-verification" element={<CompanyVerification />} />
        <Route path="company-analytics" element={<CompanyAnalytics />} />
        {/* Phase 7: Job Matching moved to user dashboard (MatchedJobs.tsx) */}
        <Route path="analytics/platform" element={<AnalyticsDashboard />} />
        <Route path="analytics/users" element={<UserEngagementAnalytics />} />
        <Route path="analytics/companies" element={<CompanyPerformanceAnalytics />} />
        <Route path="recommendations/insights" element={<RecommendationInsights />} />
        <Route path="profile-fields" element={<AdminProfileFields />} />
        <Route path="skills" element={<AdminSkills />} />
        <Route path="notifications" element={<AdminNotifications />} />
        <Route path="referrals" element={<AdminReferrals />} />
        <Route path="crawlers" element={<AdminCrawlers />} />
        <Route path="analytics" element={<AdminAnalytics />} />
        <Route path="revenue" element={<AdminRevenue />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
