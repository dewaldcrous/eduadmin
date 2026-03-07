import React from "react";
import { useAuth } from "../context/AuthContext";
import DashboardPage from "./DashboardPage";
import HODDashboardPage from "./HODDashboardPage";
import ManagementDashboardPage from "./ManagementDashboardPage";

export default function DashboardRouter() {
  const { user } = useAuth();

  switch (user?.role) {
    case "principal":
    case "deputy":
    case "admin":
      return <ManagementDashboardPage />;
    case "hod":
    case "grade_head":
      return <HODDashboardPage />;
    default:
      return <DashboardPage />;
  }
}
