import React from "react";
import { useAuth } from "../context/AuthContext";
import {
  Users, ClipboardCheck, BookCopy, AlertTriangle,
  TrendingUp, Clock, CheckCircle2, ArrowRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const QUICK_STATS = [
  {
    label: "Today's Classes",
    value: "6",
    sub: "2 completed",
    icon: Clock,
    color: "var(--color-info)",
    bg: "var(--color-info-light)",
  },
  {
    label: "Attendance Rate",
    value: "94%",
    sub: "This week",
    icon: ClipboardCheck,
    color: "var(--color-success)",
    bg: "var(--color-success-light)",
  },
  {
    label: "Pending Plans",
    value: "3",
    sub: "Awaiting approval",
    icon: BookCopy,
    color: "var(--color-accent)",
    bg: "var(--color-accent-light)",
  },
  {
    label: "Behaviour Alerts",
    value: "2",
    sub: "Escalations active",
    icon: AlertTriangle,
    color: "var(--color-danger)",
    bg: "var(--color-danger-light)",
  },
];

const TODAY_SCHEDULE = [
  { period: "P1", time: "07:45 – 08:30", subject: "Mathematics", class: "10A", status: "done" },
  { period: "P2", time: "08:30 – 09:15", subject: "Mathematics", class: "10B", status: "done" },
  { period: "P3", time: "09:15 – 10:00", subject: "Mathematics", class: "10C", status: "current" },
  { period: "—", time: "10:00 – 10:20", subject: "Break", class: "", status: "break" },
  { period: "P4", time: "10:20 – 11:05", subject: "Mathematics", class: "11A", status: "upcoming" },
  { period: "P5", time: "11:05 – 11:50", subject: "Mathematics", class: "11B", status: "upcoming" },
  { period: "P6", time: "11:50 – 12:35", subject: "Free Period", class: "", status: "free" },
  { period: "P7", time: "13:00 – 13:45", subject: "Mathematics", class: "12A", status: "upcoming" },
];

const RECENT_ACTIVITY = [
  { text: "Attendance saved for 10A (P1)", time: "08:32", type: "attendance" },
  { text: "Lesson plan approved: Algebraic Expressions", time: "Yesterday", type: "plan" },
  { text: "Behaviour escalation: L. Dlamini (Level 2)", time: "Yesterday", type: "behaviour" },
  { text: "Assessment marks captured: Term 1 Test 1", time: "2 days ago", type: "assessment" },
  { text: "Reflection submitted: Number Patterns", time: "3 days ago", type: "reflection" },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.greeting}>
            {greeting()}, {user?.first_name}
          </h1>
          <p style={styles.subtitle}>
            Here's what's happening today at Greenfield High.
          </p>
        </div>
        <div style={styles.dateBox}>
          <div style={styles.dateDay}>
            {new Date().toLocaleDateString("en-ZA", { weekday: "long" })}
          </div>
          <div style={styles.dateFull}>
            {new Date().toLocaleDateString("en-ZA", {
              day: "numeric", month: "long", year: "numeric",
            })}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div style={styles.statsGrid}>
        {QUICK_STATS.map((stat, i) => (
          <div key={i} style={{ ...styles.statCard, animationDelay: `${i * 0.08}s` }} className="animate-in">
            <div style={{ ...styles.statIcon, background: stat.bg }}>
              <stat.icon size={20} color={stat.color} />
            </div>
            <div>
              <div style={styles.statValue}>{stat.value}</div>
              <div style={styles.statLabel}>{stat.label}</div>
              <div style={styles.statSub}>{stat.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div style={styles.contentGrid}>
        {/* Today's Schedule */}
        <div style={styles.card} className="animate-in">
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>Today's Schedule</h2>
          </div>
          <div style={styles.scheduleList}>
            {TODAY_SCHEDULE.map((item, i) => (
              <div
                key={i}
                style={{
                  ...styles.scheduleItem,
                  background: item.status === "current" ? "var(--color-accent-light)" : "transparent",
                  borderLeft: item.status === "current" ? "3px solid var(--color-accent)" : "3px solid transparent",
                  opacity: item.status === "done" ? 0.5 : 1,
                }}
              >
                <div style={styles.schedulePeriod}>{item.period}</div>
                <div style={styles.scheduleTime}>{item.time}</div>
                <div style={styles.scheduleSubject}>
                  {item.subject}
                  {item.class && <span style={styles.scheduleClass}>{item.class}</span>}
                </div>
                <div style={styles.scheduleStatus}>
                  {item.status === "done" && <CheckCircle2 size={16} color="var(--color-success)" />}
                  {item.status === "current" && (
                    <span style={styles.liveBadge}>NOW</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div style={styles.rightColumn}>
          {/* Quick Actions */}
          <div style={styles.card} className="animate-in">
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>Quick Actions</h2>
            </div>
            <div style={styles.actionGrid}>
              {[
                { label: "Take Attendance", icon: ClipboardCheck, path: "/attendance", color: "var(--color-success)" },
                { label: "New Lesson Plan", icon: BookCopy, path: "/planning", color: "var(--color-info)" },
                { label: "Log Behaviour", icon: AlertTriangle, path: "/behaviour", color: "var(--color-warning)" },
                { label: "View Learners", icon: Users, path: "/learners", color: "var(--color-slate)" },
              ].map((action, i) => (
                <button
                  key={i}
                  onClick={() => navigate(action.path)}
                  style={styles.actionBtn}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = action.color}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--color-border)"}
                >
                  <action.icon size={20} color={action.color} />
                  <span style={styles.actionLabel}>{action.label}</span>
                  <ArrowRight size={14} color="var(--color-slate-light)" />
                </button>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div style={styles.card} className="animate-in">
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>Recent Activity</h2>
            </div>
            <div style={styles.activityList}>
              {RECENT_ACTIVITY.map((item, i) => (
                <div key={i} style={styles.activityItem}>
                  <div style={{
                    ...styles.activityDot,
                    background: item.type === "behaviour" ? "var(--color-danger)"
                      : item.type === "attendance" ? "var(--color-success)"
                      : "var(--color-info)",
                  }} />
                  <div style={styles.activityText}>{item.text}</div>
                  <div style={styles.activityTime}>{item.time}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    padding: "var(--space-xl)",
    maxWidth: 1100,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "var(--space-xl)",
  },
  greeting: {
    fontFamily: "var(--font-display)",
    fontSize: 28,
    fontWeight: 600,
    color: "var(--color-navy)",
    letterSpacing: "-0.02em",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: "var(--color-slate)",
  },
  dateBox: {
    textAlign: "right",
  },
  dateDay: {
    fontSize: 14,
    fontWeight: 600,
    color: "var(--color-accent)",
  },
  dateFull: {
    fontSize: 13,
    color: "var(--color-slate-light)",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "var(--space-md)",
    marginBottom: "var(--space-xl)",
  },
  statCard: {
    background: "var(--color-surface)",
    border: "1px solid var(--color-border-light)",
    borderRadius: "var(--radius-md)",
    padding: "var(--space-md)",
    display: "flex",
    alignItems: "flex-start",
    gap: "var(--space-md)",
    opacity: 0,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: "var(--radius-sm)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  statValue: {
    fontFamily: "var(--font-display)",
    fontSize: 24,
    fontWeight: 700,
    color: "var(--color-navy)",
    lineHeight: 1,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: 500,
    color: "var(--color-slate)",
    marginBottom: 1,
  },
  statSub: {
    fontSize: 12,
    color: "var(--color-slate-light)",
  },
  contentGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "var(--space-md)",
  },
  rightColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "var(--space-md)",
  },
  card: {
    background: "var(--color-surface)",
    border: "1px solid var(--color-border-light)",
    borderRadius: "var(--radius-md)",
    padding: "var(--space-lg)",
    opacity: 0,
  },
  cardHeader: {
    marginBottom: "var(--space-md)",
  },
  cardTitle: {
    fontFamily: "var(--font-display)",
    fontSize: 17,
    fontWeight: 600,
    color: "var(--color-navy)",
    letterSpacing: "-0.01em",
  },
  scheduleList: {
    display: "flex",
    flexDirection: "column",
    gap: 1,
  },
  scheduleItem: {
    display: "grid",
    gridTemplateColumns: "36px 110px 1fr 30px",
    alignItems: "center",
    padding: "10px 12px",
    borderRadius: "var(--radius-sm)",
    fontSize: 14,
    gap: 8,
  },
  schedulePeriod: {
    fontWeight: 600,
    fontSize: 13,
    color: "var(--color-slate)",
  },
  scheduleTime: {
    fontSize: 12,
    color: "var(--color-slate-light)",
    fontVariantNumeric: "tabular-nums",
  },
  scheduleSubject: {
    fontWeight: 500,
    color: "var(--color-navy)",
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  scheduleClass: {
    fontSize: 11,
    fontWeight: 600,
    color: "var(--color-accent)",
    background: "var(--color-accent-light)",
    padding: "2px 8px",
    borderRadius: 99,
  },
  scheduleStatus: {
    display: "flex",
    justifyContent: "flex-end",
  },
  liveBadge: {
    fontSize: 10,
    fontWeight: 700,
    color: "#FFFFFF",
    background: "var(--color-accent)",
    padding: "2px 8px",
    borderRadius: 99,
    letterSpacing: "0.05em",
  },
  actionGrid: {
    display: "flex",
    flexDirection: "column",
    gap: "var(--space-sm)",
  },
  actionBtn: {
    display: "flex",
    alignItems: "center",
    gap: "var(--space-sm)",
    padding: "12px 14px",
    background: "var(--color-surface)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-sm)",
    cursor: "pointer",
    fontSize: 14,
    fontFamily: "var(--font-body)",
    color: "var(--color-navy)",
    transition: "border-color 0.2s",
    width: "100%",
    textAlign: "left",
  },
  actionLabel: {
    flex: 1,
    fontWeight: 500,
  },
  activityList: {
    display: "flex",
    flexDirection: "column",
    gap: "var(--space-md)",
  },
  activityItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: "var(--space-sm)",
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    marginTop: 6,
    flexShrink: 0,
  },
  activityText: {
    flex: 1,
    fontSize: 13,
    color: "var(--color-navy)",
    lineHeight: 1.4,
  },
  activityTime: {
    fontSize: 12,
    color: "var(--color-slate-light)",
    whiteSpace: "nowrap",
  },
};
