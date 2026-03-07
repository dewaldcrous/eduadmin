import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  Users, ClipboardCheck, BookCopy, AlertTriangle, CheckCircle2,
  Clock, ChevronRight, TrendingUp, TrendingDown, Building,
  BarChart3, Shield, Eye, Bell,
} from "lucide-react";

const DEPARTMENT_DATA = [
  { name: "Mathematics", hod: "Kavitha Naidoo", teachers: 2, classes: 6, attendance: 93, avgMark: 59, planRate: 85, pending: 3, atRisk: 8, escalations: 1 },
  { name: "Natural Sciences", hod: "Johan Botha", teachers: 2, classes: 5, attendance: 91, avgMark: 56, planRate: 90, pending: 1, atRisk: 6, escalations: 0 },
  { name: "Languages", hod: "Sipho Dlamini", teachers: 2, classes: 6, attendance: 95, avgMark: 63, planRate: 92, pending: 0, atRisk: 3, escalations: 0 },
  { name: "Social Sciences", hod: "Elana Fourie", teachers: 4, classes: 8, attendance: 90, avgMark: 55, planRate: 78, pending: 5, atRisk: 12, escalations: 2 },
];

const GRADE_DATA = [
  { grade: "Grade 8", head: "R. September", learners: 90, classes: 3, attendance: 94, avgMark: 61, atRisk: 4, escalations: 0 },
  { grade: "Grade 9", head: "K. Smith", learners: 90, classes: 3, attendance: 92, avgMark: 58, atRisk: 6, escalations: 1 },
  { grade: "Grade 10", head: "A. Maharaj", learners: 90, classes: 3, attendance: 91, avgMark: 56, atRisk: 8, escalations: 2 },
  { grade: "Grade 11", head: "P. Louw", learners: 90, classes: 3, attendance: 93, avgMark: 54, atRisk: 5, escalations: 0 },
  { grade: "Grade 12", head: "N. Ngcobo", learners: 90, classes: 3, attendance: 96, avgMark: 62, atRisk: 3, escalations: 0 },
];

const ESCALATIONS = [
  { learner: "Sipho Dlamini", class: "10A", level: 2, reason: "3+ low behaviour ratings in 2 weeks", date: "Today", teacher: "S. Williams" },
  { learner: "Bongani Zulu", class: "10C", level: 2, reason: "Attendance below 80%", date: "Yesterday", teacher: "K. Modise" },
  { learner: "Neo September", class: "10A", level: 1, reason: "2 consecutive low behaviour ratings", date: "2 days ago", teacher: "S. Williams" },
  { learner: "Ahmed Patel", class: "11B", level: 3, reason: "Critical behaviour flag — physical altercation", date: "3 days ago", teacher: "K. Modise" },
];

const STAFF_ALERTS = [
  { name: "Kagiso Modise", role: "Teacher", issues: ["1 overdue lesson plan", "Attendance not taken 2 days", "Marks not captured for Assignment 1"], severity: "high" },
  { name: "Francois Cloete", role: "Teacher", issues: ["3 reflections pending"], severity: "low" },
  { name: "Elana Fourie", role: "HOD", issues: ["5 plans awaiting approval"], severity: "medium" },
];

export default function ManagementDashboardPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("departments");

  const totalLearners = GRADE_DATA.reduce((s, g) => s + g.learners, 0);
  const totalStaff = DEPARTMENT_DATA.reduce((s, d) => s + d.teachers, 0) + DEPARTMENT_DATA.length;
  const avgAttendance = Math.round(GRADE_DATA.reduce((s, g) => s + g.attendance, 0) / GRADE_DATA.length);
  const totalAtRisk = GRADE_DATA.reduce((s, g) => s + g.atRisk, 0);
  const totalEscalations = ESCALATIONS.length;

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
          <p style={styles.subtitle}>Greenfield High School — {user?.role === "principal" ? "Principal" : "Deputy Principal"} Overview</p>
        </div>
        <div style={styles.headerRight}>
          <div style={styles.termBadge}>Term 1 · 2026</div>
          <div style={styles.dateFull}>{new Date().toLocaleDateString("en-ZA", { weekday: "long", day: "numeric", month: "long" })}</div>
        </div>
      </div>

      {/* School-wide Stats */}
      <div style={styles.statsGrid}>
        {[
          { label: "Total Learners", value: totalLearners, sub: `${GRADE_DATA.length} grades`, icon: Users, color: "var(--color-info)", bg: "var(--color-info-light)" },
          { label: "Staff", value: totalStaff, sub: `${DEPARTMENT_DATA.length} departments`, icon: Building, color: "var(--color-slate)", bg: "var(--color-surface-alt)" },
          { label: "Attendance", value: `${avgAttendance}%`, sub: "School average", icon: ClipboardCheck, color: avgAttendance >= 90 ? "var(--color-success)" : "var(--color-warning)", bg: avgAttendance >= 90 ? "var(--color-success-light)" : "var(--color-warning-light)" },
          { label: "At-Risk", value: totalAtRisk, sub: `${totalEscalations} escalations`, icon: AlertTriangle, color: "var(--color-danger)", bg: "var(--color-danger-light)" },
        ].map((stat, i) => (
          <div key={i} style={styles.statCard} className="animate-in">
            <div style={{ ...styles.statIcon, background: stat.bg }}><stat.icon size={20} color={stat.color} /></div>
            <div>
              <div style={styles.statValue}>{stat.value}</div>
              <div style={styles.statLabel}>{stat.label}</div>
              <div style={styles.statSub}>{stat.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={styles.tabBar}>
        {[
          { key: "departments", label: "Departments" },
          { key: "grades", label: "Grades" },
          { key: "escalations", label: `Escalations (${totalEscalations})` },
          { key: "staff", label: `Staff Alerts (${STAFF_ALERTS.length})` },
        ].map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
            ...styles.tab,
            borderBottom: activeTab === tab.key ? "2px solid var(--color-accent)" : "2px solid transparent",
            color: activeTab === tab.key ? "var(--color-navy)" : "var(--color-slate-light)",
            fontWeight: activeTab === tab.key ? 600 : 400,
          }}>
            {tab.label}
          </button>
        ))}
      </div>

      <div style={styles.tabContent}>
        {/* ─── DEPARTMENTS ────────────────────────────────────────────── */}
        {activeTab === "departments" && (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Department</th>
                  <th style={styles.th}>HOD</th>
                  <th style={styles.th}>Teachers</th>
                  <th style={styles.th}>Attendance</th>
                  <th style={styles.th}>Avg Mark</th>
                  <th style={styles.th}>Plan Rate</th>
                  <th style={styles.th}>Pending</th>
                  <th style={styles.th}>At-Risk</th>
                </tr>
              </thead>
              <tbody>
                {DEPARTMENT_DATA.map((dept, i) => (
                  <tr key={i} style={styles.tr}>
                    <td style={styles.td}><span style={styles.deptName}>{dept.name}</span></td>
                    <td style={styles.td}>{dept.hod}</td>
                    <td style={styles.td}><span style={styles.countBadge}>{dept.teachers}</span></td>
                    <td style={styles.td}>
                      <span style={{ ...styles.metricPill, background: dept.attendance >= 90 ? "var(--color-success-light)" : "var(--color-warning-light)", color: dept.attendance >= 90 ? "var(--color-success)" : "var(--color-warning)" }}>
                        {dept.attendance}%
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={{ ...styles.metricPill, background: dept.avgMark >= 50 ? "var(--color-info-light)" : "var(--color-danger-light)", color: dept.avgMark >= 50 ? "var(--color-info)" : "var(--color-danger)" }}>
                        {dept.avgMark}%
                      </span>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.planRateWrap}>
                        <div style={styles.planRateBar}><div style={{ ...styles.planRateFill, width: `${dept.planRate}%`, background: dept.planRate >= 85 ? "var(--color-success)" : "var(--color-warning)" }} /></div>
                        <span style={styles.planRateLabel}>{dept.planRate}%</span>
                      </div>
                    </td>
                    <td style={styles.td}>
                      {dept.pending > 0 ? (
                        <span style={{ ...styles.metricPill, background: "var(--color-accent-light)", color: "var(--color-accent)" }}>{dept.pending}</span>
                      ) : <CheckCircle2 size={16} color="var(--color-success)" />}
                    </td>
                    <td style={styles.td}>
                      {dept.atRisk > 0 ? <span style={styles.riskBadge}>{dept.atRisk}</span> : <span style={{ color: "var(--color-success)", fontSize: 13 }}>0</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ─── GRADES ─────────────────────────────────────────────────── */}
        {activeTab === "grades" && (
          <div style={styles.gradeGrid}>
            {GRADE_DATA.map((grade, i) => (
              <div key={i} style={styles.gradeCard}>
                <div style={styles.gradeHeader}>
                  <h3 style={styles.gradeName}>{grade.grade}</h3>
                  <span style={styles.gradeHead}>{grade.head}</span>
                </div>
                <div style={styles.gradeStats}>
                  <div style={styles.gradeStatRow}>
                    <span style={styles.gradeStatLabel}><Users size={14} /> Learners</span>
                    <span style={styles.gradeStatValue}>{grade.learners}</span>
                  </div>
                  <div style={styles.gradeStatRow}>
                    <span style={styles.gradeStatLabel}><ClipboardCheck size={14} /> Attendance</span>
                    <span style={{ ...styles.gradeStatValue, color: grade.attendance >= 90 ? "var(--color-success)" : "var(--color-warning)" }}>{grade.attendance}%</span>
                  </div>
                  <div style={styles.gradeStatRow}>
                    <span style={styles.gradeStatLabel}><BarChart3 size={14} /> Avg Mark</span>
                    <span style={{ ...styles.gradeStatValue, color: grade.avgMark >= 50 ? "var(--color-info)" : "var(--color-danger)" }}>{grade.avgMark}%</span>
                  </div>
                  <div style={styles.gradeStatRow}>
                    <span style={styles.gradeStatLabel}><AlertTriangle size={14} /> At-Risk</span>
                    <span style={{ ...styles.gradeStatValue, color: grade.atRisk > 5 ? "var(--color-danger)" : grade.atRisk > 0 ? "var(--color-warning)" : "var(--color-success)" }}>
                      {grade.atRisk} learner{grade.atRisk !== 1 ? "s" : ""}
                    </span>
                  </div>
                  {grade.escalations > 0 && (
                    <div style={styles.gradeStatRow}>
                      <span style={styles.gradeStatLabel}><Shield size={14} /> Escalations</span>
                      <span style={styles.escalationBadge}>{grade.escalations} active</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ─── ESCALATIONS ────────────────────────────────────────────── */}
        {activeTab === "escalations" && (
          <div style={styles.escalationList}>
            {ESCALATIONS.map((esc, i) => (
              <div key={i} style={{
                ...styles.escalationCard,
                borderLeft: `4px solid ${esc.level >= 3 ? "var(--color-danger)" : esc.level >= 2 ? "var(--color-warning)" : "var(--color-info)"}`,
              }}>
                <div style={styles.escalationTop}>
                  <div style={styles.escalationLearner}>
                    <span style={{ ...styles.levelBadge, background: esc.level >= 3 ? "var(--color-danger)" : esc.level >= 2 ? "var(--color-warning)" : "var(--color-info)" }}>
                      L{esc.level}
                    </span>
                    <div>
                      <div style={styles.escalationName}>{esc.learner}</div>
                      <div style={styles.escalationClass}>{esc.class} · Teacher: {esc.teacher}</div>
                    </div>
                  </div>
                  <div style={styles.escalationDate}>{esc.date}</div>
                </div>
                <div style={styles.escalationReason}>{esc.reason}</div>
                <div style={styles.escalationActions}>
                  <button style={styles.viewDetailBtn}><Eye size={13} /> View Details</button>
                  <button style={styles.contactBtn}><Bell size={13} /> Contact Parent</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ─── STAFF ALERTS ───────────────────────────────────────────── */}
        {activeTab === "staff" && (
          <div style={styles.staffAlertList}>
            {STAFF_ALERTS.map((staff, i) => (
              <div key={i} style={{
                ...styles.staffAlertCard,
                borderLeft: `3px solid ${staff.severity === "high" ? "var(--color-danger)" : staff.severity === "medium" ? "var(--color-warning)" : "var(--color-info)"}`,
              }}>
                <div style={styles.staffAlertHeader}>
                  <div>
                    <div style={styles.staffAlertName}>{staff.name}</div>
                    <div style={styles.staffAlertRole}>{staff.role}</div>
                  </div>
                  <span style={{
                    ...styles.severityBadge,
                    background: staff.severity === "high" ? "var(--color-danger-light)" : staff.severity === "medium" ? "var(--color-warning-light)" : "var(--color-info-light)",
                    color: staff.severity === "high" ? "var(--color-danger)" : staff.severity === "medium" ? "var(--color-warning)" : "var(--color-info)",
                  }}>
                    {staff.severity.toUpperCase()}
                  </span>
                </div>
                <ul style={styles.issueList}>
                  {staff.issues.map((issue, j) => (
                    <li key={j} style={styles.issueItem}>{issue}</li>
                  ))}
                </ul>
                <button style={styles.followUpBtn}><ChevronRight size={14} /> Follow up</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: { padding: "var(--space-xl)", maxWidth: 1200 },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--space-xl)" },
  greeting: { fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 600, color: "var(--color-navy)", letterSpacing: "-0.02em", marginBottom: 4 },
  subtitle: { fontSize: 15, color: "var(--color-slate)" },
  headerRight: { textAlign: "right" },
  termBadge: { padding: "8px 16px", background: "var(--color-navy)", color: "var(--color-accent)", fontSize: 13, fontWeight: 600, borderRadius: "var(--radius-sm)", display: "inline-block", marginBottom: 6 },
  dateFull: { fontSize: 13, color: "var(--color-slate-light)" },

  statsGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--space-md)", marginBottom: "var(--space-xl)" },
  statCard: { background: "var(--color-surface)", border: "1px solid var(--color-border-light)", borderRadius: "var(--radius-md)", padding: "var(--space-md)", display: "flex", alignItems: "flex-start", gap: "var(--space-md)" },
  statIcon: { width: 44, height: 44, borderRadius: "var(--radius-sm)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  statValue: { fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 700, color: "var(--color-navy)", lineHeight: 1, marginBottom: 2 },
  statLabel: { fontSize: 13, fontWeight: 500, color: "var(--color-slate)", marginBottom: 1 },
  statSub: { fontSize: 12, color: "var(--color-slate-light)" },

  tabBar: { display: "flex", gap: 0, borderBottom: "1px solid var(--color-border-light)", marginBottom: "var(--space-lg)" },
  tab: { padding: "12px 20px", fontSize: 14, fontFamily: "var(--font-body)", background: "none", border: "none", cursor: "pointer", transition: "all 0.2s" },
  tabContent: {},

  // Tables
  tableWrap: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 14 },
  th: { textAlign: "left", padding: "12px 14px", fontSize: 11, fontWeight: 600, color: "var(--color-slate-light)", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid var(--color-border-light)", background: "var(--color-surface-alt)" },
  tr: { borderBottom: "1px solid var(--color-border-light)" },
  td: { padding: "14px", verticalAlign: "middle" },
  deptName: { fontWeight: 600, color: "var(--color-navy)" },
  countBadge: { background: "var(--color-surface-alt)", padding: "3px 10px", borderRadius: 99, fontSize: 13, fontWeight: 600 },
  metricPill: { padding: "4px 10px", borderRadius: 99, fontSize: 13, fontWeight: 600 },
  riskBadge: { background: "var(--color-danger-light)", color: "var(--color-danger)", padding: "4px 10px", borderRadius: 99, fontSize: 12, fontWeight: 600 },
  planRateWrap: { display: "flex", alignItems: "center", gap: 8 },
  planRateBar: { width: 60, height: 6, background: "var(--color-surface-alt)", borderRadius: 3 },
  planRateFill: { height: "100%", borderRadius: 3, transition: "width 0.3s" },
  planRateLabel: { fontSize: 13, fontWeight: 600, color: "var(--color-navy)" },

  // Grades
  gradeGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "var(--space-md)" },
  gradeCard: { background: "var(--color-surface)", border: "1px solid var(--color-border-light)", borderRadius: "var(--radius-md)", padding: "var(--space-lg)" },
  gradeHeader: { marginBottom: "var(--space-md)", paddingBottom: "var(--space-md)", borderBottom: "1px solid var(--color-border-light)" },
  gradeName: { fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 600, color: "var(--color-navy)", marginBottom: 2 },
  gradeHead: { fontSize: 13, color: "var(--color-slate-light)" },
  gradeStats: { display: "flex", flexDirection: "column", gap: "var(--space-sm)" },
  gradeStatRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  gradeStatLabel: { display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--color-slate)" },
  gradeStatValue: { fontSize: 14, fontWeight: 600, color: "var(--color-navy)" },
  escalationBadge: { fontSize: 12, fontWeight: 600, color: "var(--color-danger)", background: "var(--color-danger-light)", padding: "3px 10px", borderRadius: 99 },

  // Escalations
  escalationList: { display: "flex", flexDirection: "column", gap: "var(--space-md)" },
  escalationCard: { background: "var(--color-surface)", border: "1px solid var(--color-border-light)", borderRadius: "var(--radius-md)", padding: "var(--space-lg)" },
  escalationTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--space-sm)" },
  escalationLearner: { display: "flex", alignItems: "center", gap: "var(--space-sm)" },
  levelBadge: { width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#FFF", fontSize: 12, fontWeight: 700, flexShrink: 0 },
  escalationName: { fontWeight: 600, fontSize: 15, color: "var(--color-navy)" },
  escalationClass: { fontSize: 13, color: "var(--color-slate-light)" },
  escalationDate: { fontSize: 13, color: "var(--color-slate-light)" },
  escalationReason: { fontSize: 14, color: "var(--color-slate)", marginBottom: "var(--space-md)", paddingLeft: 44 },
  escalationActions: { display: "flex", gap: 8, paddingLeft: 44 },
  viewDetailBtn: { display: "flex", alignItems: "center", gap: 4, padding: "8px 14px", fontSize: 13, fontWeight: 500, fontFamily: "var(--font-body)", background: "var(--color-info-light)", color: "var(--color-info)", border: "none", borderRadius: "var(--radius-sm)", cursor: "pointer" },
  contactBtn: { display: "flex", alignItems: "center", gap: 4, padding: "8px 14px", fontSize: 13, fontWeight: 500, fontFamily: "var(--font-body)", background: "var(--color-accent-light)", color: "var(--color-accent)", border: "none", borderRadius: "var(--radius-sm)", cursor: "pointer" },

  // Staff alerts
  staffAlertList: { display: "flex", flexDirection: "column", gap: "var(--space-md)" },
  staffAlertCard: { background: "var(--color-surface)", border: "1px solid var(--color-border-light)", borderRadius: "var(--radius-md)", padding: "var(--space-lg)" },
  staffAlertHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--space-md)" },
  staffAlertName: { fontWeight: 600, fontSize: 16, color: "var(--color-navy)" },
  staffAlertRole: { fontSize: 13, color: "var(--color-slate-light)" },
  severityBadge: { padding: "4px 12px", borderRadius: 99, fontSize: 10, fontWeight: 700, letterSpacing: "0.06em" },
  issueList: { listStyle: "none", padding: 0, margin: "0 0 var(--space-md) 0", display: "flex", flexDirection: "column", gap: 6 },
  issueItem: { fontSize: 14, color: "var(--color-slate)", paddingLeft: 16, position: "relative", lineHeight: 1.4 },
  followUpBtn: { display: "flex", alignItems: "center", gap: 4, padding: "8px 14px", fontSize: 13, fontWeight: 500, fontFamily: "var(--font-body)", background: "transparent", color: "var(--color-accent)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", cursor: "pointer" },
};
