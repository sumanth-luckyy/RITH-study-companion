import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

import { AdminRoute } from "@/components/layout/AdminRoute";
import { OfflineBanner } from "@/components/common/OfflineBanner";

// Pages
import Login from "@/pages/Login";
import Home from "@/pages/Home";
import Subjects from "@/pages/Subjects";
import SubjectDetail from "@/pages/SubjectDetail";
import Assignments from "@/pages/Assignments";
import Timetable from "@/pages/Timetable";
import Resources from "@/pages/Resources";
import PreviousPapers from "@/pages/PreviousPapers";
import Announcements from "@/pages/Announcements";
import Classmates from "@/pages/Classmates";
import Downloads from "@/pages/Downloads";
import Profile from "@/pages/Profile";
import Settings from "@/pages/Settings";
import AdminPanel from "@/pages/AdminPanel";
import AboutUs from "@/pages/AboutUs";
import RateUs from "@/pages/RateUs";
import ReportProblem from "@/pages/ReportProblem";
import NotFound from "@/pages/NotFound";

import { useCapacitorBackButton } from "@/hooks/useCapacitorBackButton";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
    },
  },
});

function NativeAppBridge() {
  useCapacitorBackButton();
  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <NativeAppBridge />
            <OfflineBanner />
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login defaultMode="login" />} />
              <Route path="/signup" element={<Login defaultMode="signup" />} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />

              {/* Student Academic Companion Layout */}
              <Route element={<DashboardLayout />}>
                <Route path="/dashboard" element={<Home />} />
                <Route path="/subjects" element={<Subjects />} />
                <Route path="/subjects/:id" element={<SubjectDetail />} />
                <Route path="/assignments" element={<Assignments />} />
                <Route path="/timetable" element={<Timetable />} />
                <Route path="/resources" element={<Resources />} />
                <Route path="/previous-papers" element={<PreviousPapers />} />
                <Route path="/announcements" element={<Announcements />} />
                <Route path="/classmates" element={<Classmates />} />
                <Route path="/downloads" element={<Downloads />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/report" element={<ReportProblem />} />
                <Route path="/rate" element={<RateUs />} />
                <Route path="/about" element={<AboutUs />} />

                {/* Admin Routes (Secured) */}
                <Route element={<AdminRoute />}>
                  <Route path="/admin" element={<AdminPanel />} />
                  <Route path="/admin-panel" element={<Navigate to="/admin" replace />} />
                  <Route path="/admin/*" element={<AdminPanel />} />
                </Route>
              </Route>

              {/* 404 Catch-All */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
