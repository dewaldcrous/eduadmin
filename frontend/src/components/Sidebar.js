import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  BookOpen, LayoutDashboard, ClipboardCheck, BookCopy,
  Users, BarChart3, AlertTriangle, Calendar, Clock,
  Settings, LogOut, User,
} from "lucide-react";

const NAV_ITEMS = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/attendance", icon: ClipboardCheck, label: "Attendance" },
  { to: "/planning", icon: BookCopy, label: "Lesson Plans" },
  { to: "/learners", icon: Users, label: "Learners" },
  { to: "/timetable", icon: Clock, label: "Timetable" },
  { to: "/behaviour", icon: AlertTriangle, label: "Behaviour" },
  { to: "/assessments", icon: BarChart3, label: "Assessments" },
  { to: "/calendar", icon: Calendar, label: "Calendar" },
  { to: "/users", icon: Settings, label: "User Management" },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const roleLabel = {
    teacher: "Teacher",
    hod: "Head of Department",
    grade_head: "Grade Head",
    deputy: "Deputy Principal",
    principal: "Principal",
    admin: "Administrator",
  };

  return (
    <aside style={styles.sidebar}>
      {/* Logo */}
      <div style={styles.logoSection}>
        <div style={styles.logoIcon}>
          <BookOpen size={20} color="#FEF3C7" />
        </div>
        <span style={styles.logoText}>EduAdmin</span>
      </div>

      {/* Navigation */}
      <nav style={styles.nav}>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            style={({ isActive }) => ({
              ...styles.navItem,
              background: isActive ? "rgba(217, 119, 6, 0.12)" : "transparent",
              color: isActive ? "var(--color-accent)" : "var(--color-slate)",
              fontWeight: isActive ? 600 : 400,
            })}
          >
            <item.icon size={18} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User info */}
      <div style={styles.userSection}>
        <div style={styles.userInfo}>
          <div style={styles.avatar}>
            <User size={16} color="var(--color-slate-light)" />
          </div>
          <div style={styles.userDetails}>
            <div style={styles.userName}>
              {user?.first_name} {user?.last_name}
            </div>
            <div style={styles.userRole}>
              {roleLabel[user?.role] || user?.role}
            </div>
          </div>
        </div>
        <button onClick={handleLogout} style={styles.logoutBtn} title="Sign out">
          <LogOut size={16} />
        </button>
      </div>

      <style>{`
        aside a { text-decoration: none; }
        aside a:hover { background: var(--color-surface-alt) !important; }
      `}</style>
    </aside>
  );
}

const styles = {
  sidebar: {
    width: 240,
    height: "100vh",
    background: "var(--color-surface)",
    borderRight: "1px solid var(--color-border-light)",
    display: "flex",
    flexDirection: "column",
    position: "fixed",
    left: 0,
    top: 0,
    zIndex: 100,
  },
  logoSection: {
    display: "flex",
    alignItems: "center",
    gap: "var(--space-sm)",
    padding: "var(--space-lg) var(--space-md)",
    borderBottom: "1px solid var(--color-border-light)",
  },
  logoIcon: {
    width: 36,
    height: 36,
    borderRadius: "var(--radius-sm)",
    background: "var(--color-navy)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontFamily: "var(--font-display)",
    fontSize: 18,
    fontWeight: 700,
    color: "var(--color-navy)",
    letterSpacing: "-0.02em",
  },
  nav: {
    flex: 1,
    padding: "var(--space-sm)",
    display: "flex",
    flexDirection: "column",
    gap: 2,
    overflowY: "auto",
  },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: "var(--space-sm)",
    padding: "10px 12px",
    borderRadius: "var(--radius-sm)",
    fontSize: 14,
    transition: "all 0.15s ease",
    cursor: "pointer",
  },
  userSection: {
    padding: "var(--space-md)",
    borderTop: "1px solid var(--color-border-light)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  userInfo: {
    display: "flex",
    alignItems: "center",
    gap: "var(--space-sm)",
    flex: 1,
    minWidth: 0,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    background: "var(--color-surface-alt)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  userDetails: {
    minWidth: 0,
  },
  userName: {
    fontSize: 13,
    fontWeight: 600,
    color: "var(--color-navy)",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  userRole: {
    fontSize: 11,
    color: "var(--color-slate-light)",
  },
  logoutBtn: {
    background: "none",
    border: "none",
    color: "var(--color-slate-light)",
    cursor: "pointer",
    padding: 6,
    borderRadius: "var(--radius-sm)",
    display: "flex",
    alignItems: "center",
  },
};
