import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  Users, ClipboardCheck, BookCopy, AlertTriangle,
  Clock, CheckCircle2, ArrowRight,
  ChevronLeft, ChevronRight, Play,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const SCHEDULE = [
  { id: 1, period: "P1", start: "07:45", end: "08:30", subject: "Mathematics", class: "10A", type: "lesson" },
  { id: 2, period: "P2", start: "08:30", end: "09:15", subject: "Mathematics", class: "10B", type: "lesson" },
  { id: 3, period: "P3", start: "09:15", end: "10:00", subject: "Mathematics", class: "10C", type: "lesson" },
  { id: 0, period: "—",  start: "10:00", end: "10:20", subject: "Break", class: "", type: "break" },
  { id: 4, period: "P4", start: "10:20", end: "11:05", subject: "Mathematics", class: "11A", type: "lesson" },
  { id: 5, period: "P5", start: "11:05", end: "11:50", subject: "Mathematics", class: "11B", type: "lesson" },
  { id: 6, period: "P6", start: "11:50", end: "12:35", subject: "Free Period", class: "", type: "free" },
  { id: 0, period: "—",  start: "12:35", end: "13:00", subject: "Lunch", class: "", type: "break" },
  { id: 7, period: "P7", start: "13:00", end: "13:45", subject: "Mathematics", class: "12A", type: "lesson" },
];

function timeToMinutes(timeStr) {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

function getCurrentPeriodIndex() {
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  for (let i = 0; i < SCHEDULE.length; i++) {
    const start = timeToMinutes(SCHEDULE[i].start);
    const end = timeToMinutes(SCHEDULE[i].end);
    if (nowMin >= start && nowMin < end) return i;
  }
  if (nowMin < timeToMinutes(SCHEDULE[0].start)) return 0;
  return SCHEDULE.length - 1;
}

function getStatus(index, activePeriod) {
  if (index < activePeriod) return "done";
  if (index === activePeriod) return "current";
  if (SCHEDULE[index].type === "break") return "break";
  if (SCHEDULE[index].type === "free") return "free";
  return "upcoming";
}

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
  const [activePeriod, setActivePeriod] = useState(getCurrentPeriodIndex());
  const [useAutoTrack, setUseAutoTrack] = useState(true);
  const [hoveredPeriod, setHoveredPeriod] = useState(null);

  useEffect(() => {
    if (!useAutoTrack) return;
    const interval = setInterval(() => {
      setActivePeriod(getCurrentPeriodIndex());
    }, 60000);
    return () => clearInterval(interval);
  }, [useAutoTrack]);

  const goToPrevious = () => {
    setUseAutoTrack(false);
    setActivePeriod((prev) => Math.max(0, prev - 1));
  };

  const goToNext = () => {
    setUseAutoTrack(false);
    setActivePeriod((prev) => Math.min(SCHEDULE.length - 1, prev + 1));
  };

  const goToLive = () => {
    setUseAutoTrack(true);
    setActivePeriod(getCurrentPeriodIndex());
  };

  const navigateToAttendance = (lesson) => {
    navigate("/attendance", {
      state: {
        slotId: lesson.id,
        className: lesson.class,
        subject: lesson.subject,
        period: lesson.period,
        time: `${lesson.start} – ${lesson.end}`,
      },
    });
  };

  const navigateToPlanning = (lesson) => {
    navigate("/planning", {
      state: {
        slotId: lesson.id,
        className: lesson.class,
        subject: lesson.subject,
        period: lesson.period,
        time: `${lesson.start} – ${lesson.end}`,
      },
    });
  };

  const currentLesson = SCHEDULE[activePeriod];
  const completedCount = SCHEDULE.filter((_, i) => getStatus(i, activePeriod) === "done" && SCHEDULE[i].type === "lesson").length;
  const totalLessons = SCHEDULE.filter((s) => s.type === "lesson").length;

  const QUICK_STATS = [
    { label: "Today's Classes", value: `${totalLessons}`, sub: `${completedCount} completed`, icon: Clock, color: "var(--color-info)", bg: "var(--color-info-light)" },
    { label: "Attendance Rate", value: "94%", sub: "This week", icon: ClipboardCheck, color: "var(--color-success)", bg: "var(--color-success-light)" },
    { label: "Pending Plans", value: "3", sub: "Awaiting approval", icon: BookCopy, color: "var(--color-accent)", bg: "var(--color-accent-light)" },
    { label: "Behaviour Alerts", value: "2", sub: "Escalations active", icon: AlertTriangle, color: "var(--color-danger)", bg: "var(--color-danger-light)" },
  ];

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
          <h1 style={styles.greeting}>{greeting()}, {user?.first_name}</h1>
          <p style={styles.subtitle}>Here's what's happening today at Greenfield High.</p>
        </div>
        <div style={styles.dateBox}>
          <div style={styles.dateDay}>{new Date().toLocaleDateString("en-ZA", { weekday: "long" })}</div>
          <div style={styles.dateFull}>{new Date().toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })}</div>
        </div>
      </div>

      {/* Current Period Hero Card */}
      {currentLesson.type === "lesson" && (
        <div style={styles.heroCard} className="animate-in">
          <div style={styles.heroLeft}>
            <div style={styles.heroLabel}>{useAutoTrack ? "CURRENT PERIOD" : "VIEWING PERIOD"}</div>
            <h2 style={styles.heroTitle}>{currentLesson.subject} — {currentLesson.class}</h2>
            <div style={styles.heroMeta}>{currentLesson.period} · {currentLesson.start} – {currentLesson.end}</div>
          </div>
          <div style={styles.heroActions}>
            <button onClick={() => navigateToAttendance(currentLesson)} style={styles.heroBtn}>
              <ClipboardCheck size={16} /> Take Attendance
            </button>
            <button onClick={() => navigateToPlanning(currentLesson)} style={styles.heroBtnOutline}>
              <BookCopy size={16} /> Lesson Plan
            </button>
          </div>
        </div>
      )}

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
          <div style={styles.cardHeaderRow}>
            <h2 style={styles.cardTitle}>Today's Schedule</h2>
            <div style={styles.periodNav}>
              <button onClick={goToPrevious} disabled={activePeriod === 0} style={styles.navBtn}><ChevronLeft size={16} /></button>
              {!useAutoTrack && (
                <button onClick={goToLive} style={styles.liveBtn} title="Jump to current time"><Play size={12} /> LIVE</button>
              )}
              <button onClick={goToNext} disabled={activePeriod === SCHEDULE.length - 1} style={styles.navBtn}><ChevronRight size={16} /></button>
            </div>
          </div>

          <div style={styles.scheduleList}>
            {SCHEDULE.map((item, i) => {
              const status = getStatus(i, activePeriod);
              const isLesson = item.type === "lesson";
              const isHovered = hoveredPeriod === i && isLesson;

              return (
                <div key={i} style={{ position: "relative" }}>
                  <div
                    onClick={() => {
                      setUseAutoTrack(false);
                      setActivePeriod(i);
                    }}
                    onMouseEnter={() => isLesson && setHoveredPeriod(i)}
                    onMouseLeave={() => setHoveredPeriod(null)}
                    style={{
                      ...styles.scheduleItem,
                      background: status === "current" ? "var(--color-accent-light)"
                        : isHovered ? "var(--color-surface-alt)" : "transparent",
                      borderLeft: status === "current" ? "3px solid var(--color-accent)" : "3px solid transparent",
                      opacity: status === "done" ? 0.5 : 1,
                      cursor: isLesson ? "pointer" : "default",
                    }}
                  >
                    <div style={styles.schedulePeriod}>{item.period}</div>
                    <div style={styles.scheduleTime}>{item.start} – {item.end}</div>
                    <div style={styles.scheduleSubject}>
                      {item.subject}
                      {item.class && <span style={styles.scheduleClass}>{item.class}</span>}
                    </div>
                    <div style={styles.scheduleStatus}>
                      {status === "done" && <CheckCircle2 size={16} color="var(--color-success)" />}
                      {status === "current" && <span style={styles.liveBadge}>{useAutoTrack ? "NOW" : "VIEW"}</span>}
                    </div>
                  </div>

                  {/* Action buttons on hover */}
                  {isHovered && (
                    <div style={styles.hoverActions}>
                      <button
                        onClick={(e) => { e.stopPropagation(); navigateToAttendance(item); }}
                        style={styles.hoverBtn}
                        title="Take attendance for this period"
                      >
                        <ClipboardCheck size={13} />
                        Attendance
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); navigateToPlanning(item); }}
                        style={styles.hoverBtn}
                        title="View/create lesson plan for this period"
                      >
                        <BookCopy size={13} />
                        Plan
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate("/behaviour", {
                            state: { slotId: item.id, className: item.class, subject: item.subject, period: item.period },
                          });
                        }}
                        style={styles.hoverBtn}
                        title="Log behaviour for this period"
                      >
                        <AlertTriangle size={13} />
                        Behaviour
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right column */}
        <div style={styles.rightColumn}>
          {/* Quick Actions */}
          <div style={styles.card} className="animate-in">
            <div style={styles.cardHeaderRow}>
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
            <div style={styles.cardHeaderRow}>
              <h2 style={styles.cardTitle}>Recent Activity</h2>
            </div>
            <div style={styles.activityList}>
              {RECENT_ACTIVITY.map((item, i) => (
                <div key={i} style={styles.activityItem}>
                  <div style={{
                    ...styles.activityDot,
                    background: item.type === "behaviour" ? "var(--color-danger)"
                      : item.type === "attendance" ? "var(--color-success)" : "var(--color-info)",
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
  page: { padding: "var(--space-xl)", maxWidth: 1100 },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--space-lg)" },
  greeting: { fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 600, color: "var(--color-navy)", letterSpacing: "-0.02em", marginBottom: 4 },
  subtitle: { fontSize: 15, color: "var(--color-slate)" },
  dateBox: { textAlign: "right" },
  dateDay: { fontSize: 14, fontWeight: 600, color: "var(--color-accent)" },
  dateFull: { fontSize: 13, color: "var(--color-slate-light)" },

  heroCard: { background: "var(--color-navy)", borderRadius: "var(--radius-lg)", padding: "var(--space-lg) var(--space-xl)", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-xl)", opacity: 0 },
  heroLeft: {},
  heroLabel: { fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "var(--color-accent)", marginBottom: 6 },
  heroTitle: { fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 600, color: "#FFFFFF", letterSpacing: "-0.01em", marginBottom: 4 },
  heroMeta: { fontSize: 14, color: "rgba(255,255,255,0.5)" },
  heroActions: { display: "flex", gap: "var(--space-sm)" },
  heroBtn: { display: "flex", alignItems: "center", gap: 6, padding: "10px 18px", fontSize: 14, fontWeight: 600, fontFamily: "var(--font-body)", background: "var(--color-accent)", color: "#FFFFFF", border: "none", borderRadius: "var(--radius-sm)", cursor: "pointer" },
  heroBtnOutline: { display: "flex", alignItems: "center", gap: 6, padding: "10px 18px", fontSize: 14, fontWeight: 500, fontFamily: "var(--font-body)", background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.8)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "var(--radius-sm)", cursor: "pointer" },

  statsGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--space-md)", marginBottom: "var(--space-xl)" },
  statCard: { background: "var(--color-surface)", border: "1px solid var(--color-border-light)", borderRadius: "var(--radius-md)", padding: "var(--space-md)", display: "flex", alignItems: "flex-start", gap: "var(--space-md)", opacity: 0 },
  statIcon: { width: 44, height: 44, borderRadius: "var(--radius-sm)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  statValue: { fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 700, color: "var(--color-navy)", lineHeight: 1, marginBottom: 2 },
  statLabel: { fontSize: 13, fontWeight: 500, color: "var(--color-slate)", marginBottom: 1 },
  statSub: { fontSize: 12, color: "var(--color-slate-light)" },

  contentGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-md)" },
  rightColumn: { display: "flex", flexDirection: "column", gap: "var(--space-md)" },
  card: { background: "var(--color-surface)", border: "1px solid var(--color-border-light)", borderRadius: "var(--radius-md)", padding: "var(--space-lg)", opacity: 0 },
  cardHeaderRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-md)" },
  cardTitle: { fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 600, color: "var(--color-navy)", letterSpacing: "-0.01em" },

  periodNav: { display: "flex", alignItems: "center", gap: 4 },
  navBtn: { width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-surface-alt)", border: "1px solid var(--color-border-light)", borderRadius: "var(--radius-sm)", cursor: "pointer", color: "var(--color-slate)" },
  liveBtn: { display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", fontSize: 10, fontWeight: 700, fontFamily: "var(--font-body)", letterSpacing: "0.05em", background: "var(--color-danger)", color: "#FFFFFF", border: "none", borderRadius: 99, cursor: "pointer" },

  scheduleList: { display: "flex", flexDirection: "column", gap: 1 },
  scheduleItem: { display: "grid", gridTemplateColumns: "36px 110px 1fr 40px", alignItems: "center", padding: "10px 12px", borderRadius: "var(--radius-sm)", fontSize: 14, gap: 8, transition: "background 0.15s" },
  schedulePeriod: { fontWeight: 600, fontSize: 13, color: "var(--color-slate)" },
  scheduleTime: { fontSize: 12, color: "var(--color-slate-light)", fontVariantNumeric: "tabular-nums" },
  scheduleSubject: { fontWeight: 500, color: "var(--color-navy)", display: "flex", alignItems: "center", gap: 8 },
  scheduleClass: { fontSize: 11, fontWeight: 600, color: "var(--color-accent)", background: "var(--color-accent-light)", padding: "2px 8px", borderRadius: 99 },
  scheduleStatus: { display: "flex", justifyContent: "flex-end" },
  liveBadge: { fontSize: 10, fontWeight: 700, color: "#FFFFFF", background: "var(--color-accent)", padding: "2px 8px", borderRadius: 99, letterSpacing: "0.05em" },

  hoverActions: {
    position: "absolute",
    right: 12,
    top: "50%",
    transform: "translateY(-50%)",
    display: "flex",
    gap: 4,
    zIndex: 10,
    animation: "fadeIn 0.15s ease-out",
  },
  hoverBtn: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    padding: "5px 10px",
    fontSize: 11,
    fontWeight: 600,
    fontFamily: "var(--font-body)",
    background: "var(--color-surface)",
    color: "var(--color-navy)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-sm)",
    cursor: "pointer",
    whiteSpace: "nowrap",
    boxShadow: "var(--shadow-md)",
    transition: "all 0.15s",
  },

  actionGrid: { display: "flex", flexDirection: "column", gap: "var(--space-sm)" },
  actionBtn: { display: "flex", alignItems: "center", gap: "var(--space-sm)", padding: "12px 14px", background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", cursor: "pointer", fontSize: 14, fontFamily: "var(--font-body)", color: "var(--color-navy)", transition: "border-color 0.2s", width: "100%", textAlign: "left" },
  actionLabel: { flex: 1, fontWeight: 500 },

  activityList: { display: "flex", flexDirection: "column", gap: "var(--space-md)" },
  activityItem: { display: "flex", alignItems: "flex-start", gap: "var(--space-sm)" },
  activityDot: { width: 8, height: 8, borderRadius: "50%", marginTop: 6, flexShrink: 0 },
  activityText: { flex: 1, fontSize: 13, color: "var(--color-navy)", lineHeight: 1.4 },
  activityTime: { fontSize: 12, color: "var(--color-slate-light)", whiteSpace: "nowrap" },
};
