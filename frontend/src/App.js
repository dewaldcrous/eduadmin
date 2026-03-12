import React from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Sidebar from "./components/Sidebar";
import LoginPage from "./pages/LoginPage";
import DashboardRouter from "./pages/DashboardRouter";
import AttendancePage from "./pages/AttendancePage";
import WeeklyPlannerPage from "./pages/WeeklyPlannerPage";
import LearnersPage from "./pages/LearnersPage";
import HODDashboardPage from "./pages/HODDashboardPage";
import ManagementDashboardPage from "./pages/ManagementDashboardPage";
import TimetablePage from "./pages/TimetablePage";
import UserManagementPage from "./pages/UserManagementPage";
import SchoolManagementPage from "./pages/SchoolManagementPage";
import PlaceholderPage from "./pages/PlaceholderPage";

function ProtectedLayout() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "var(--font-display)", fontSize: 18, color: "var(--color-slate-light)" }}>
        Loading...
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <main style={{ marginLeft: 240, flex: 1, minHeight: "100vh" }}>
        <Outlet />
      </main>
    </div>
  );
}

function LoginRoute() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return <LoginPage />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginRoute />} />
          <Route element={<ProtectedLayout />}>
            <Route path="/" element={<DashboardRouter />} />
            <Route path="/attendance" element={<AttendancePage />} />
            <Route path="/planning" element={<WeeklyPlannerPage />} />
            <Route path="/learners" element={<LearnersPage />} />
            <Route path="/timetable" element={<TimetablePage />} />
            <Route path="/school" element={<SchoolManagementPage />} />
            <Route path="/users" element={<UserManagementPage />} />
            <Route path="/behaviour" element={<PlaceholderPage title="Behaviour Tracking" />} />
            <Route path="/assessments" element={<PlaceholderPage title="Assessments & Marks" />} />
            <Route path="/calendar" element={<PlaceholderPage title="School Calendar" />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
