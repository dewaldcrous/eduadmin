import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  BookCopy, ClipboardCheck, Users, AlertTriangle, CheckCircle2,
  XCircle, Clock, ChevronRight, FileText, TrendingUp, TrendingDown,
  Eye, Filter, BarChart3, Loader2,
} from "lucide-react";
import { getPendingApprovals, approvePlan } from "../api/client";

// Helper to format relative time
function timeAgo(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;
  return date.toLocaleDateString();
}

export default function HODDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("approvals");
  const [pendingPlans, setPendingPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  // Fetch pending approvals on mount
  useEffect(() => {
    loadPendingPlans();
  }, []);

  async function loadPendingPlans() {
    setLoading(true);
    try {
      const res = await getPendingApprovals();
      // Handle paginated response (res.data.results) or direct array (res.data)
      const data = res.data?.results || res.data || [];
      setPendingPlans(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load pending plans:", err);
      setPendingPlans([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(planId) {
    setActionLoading(planId);
    try {
      await approvePlan(planId, "approved");
      setPendingPlans(pendingPlans.filter(p => p.id !== planId));
    } catch (err) {
      alert(err.response?.data?.error || "Failed to approve plan");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReturn(planId) {
    const feedback = prompt("Enter feedback for the teacher (optional):");
    if (feedback === null) return; // User cancelled
    setActionLoading(planId);
    try {
      await approvePlan(planId, "returned", feedback);
      setPendingPlans(pendingPlans.filter(p => p.id !== planId));
    } catch (err) {
      alert(err.response?.data?.error || "Failed to return plan");
    } finally {
      setActionLoading(null);
    }
  }

  // Stats from real data
  const pendingCount = pendingPlans.length;

  // Placeholder stats (these would come from additional API endpoints)
  const TEACHERS = [];
  const CLASS_PERFORMANCE = [];
  const OUTSTANDING = [];
  const overdueCount = 0;
  const avgAttendance = 0;

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.greeting}>Mathematics Department</h1>
          <p style={styles.subtitle}>Head of Department overview — {user?.first_name} {user?.last_name}</p>
        </div>
        <div style={styles.termBadge}>Term 1 · 2026</div>
      </div>

      {/* Top Stats */}
      <div style={styles.statsGrid}>
        {[
          { label: "Teachers", value: TEACHERS.length, sub: `${CLASS_PERFORMANCE.length} classes`, icon: Users, color: "var(--color-info)", bg: "var(--color-info-light)" },
          { label: "Plans Pending", value: pendingCount, sub: `${overdueCount} overdue`, icon: BookCopy, color: pendingCount > 0 ? "var(--color-accent)" : "var(--color-success)", bg: pendingCount > 0 ? "var(--color-accent-light)" : "var(--color-success-light)" },
          { label: "Avg Attendance", value: `${avgAttendance}%`, sub: "Across all classes", icon: ClipboardCheck, color: avgAttendance >= 90 ? "var(--color-success)" : "var(--color-warning)", bg: avgAttendance >= 90 ? "var(--color-success-light)" : "var(--color-warning-light)" },
          { label: "At-Risk Learners", value: CLASS_PERFORMANCE.reduce((s, c) => s + c.atRisk, 0), sub: "Need intervention", icon: AlertTriangle, color: "var(--color-danger)", bg: "var(--color-danger-light)" },
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
          { key: "overview", label: "Class Overview" },
          { key: "approvals", label: `Plan Approvals (${pendingCount})` },
          { key: "teachers", label: "Teacher Performance" },
          { key: "outstanding", label: `Outstanding (${OUTSTANDING.length})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              ...styles.tab,
              borderBottom: activeTab === tab.key ? "2px solid var(--color-accent)" : "2px solid transparent",
              color: activeTab === tab.key ? "var(--color-navy)" : "var(--color-slate-light)",
              fontWeight: activeTab === tab.key ? 600 : 400,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={styles.tabContent}>
        {/* ─── CLASS OVERVIEW ──────────────────────────────────────────── */}
        {activeTab === "overview" && (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Class</th>
                  <th style={styles.th}>Teacher</th>
                  <th style={styles.th}>Attendance</th>
                  <th style={styles.th}>Avg Mark</th>
                  <th style={styles.th}>Behaviour</th>
                  <th style={styles.th}>At-Risk</th>
                  <th style={styles.th}>Plans</th>
                </tr>
              </thead>
              <tbody>
                {CLASS_PERFORMANCE.map((cls, i) => (
                  <tr key={i} style={styles.tr}>
                    <td style={styles.td}><span style={styles.classBadge}>{cls.class}</span></td>
                    <td style={styles.td}>{cls.teacher}</td>
                    <td style={styles.td}>
                      <span style={{ ...styles.metricPill, background: cls.attendance >= 90 ? "var(--color-success-light)" : "var(--color-danger-light)", color: cls.attendance >= 90 ? "var(--color-success)" : "var(--color-danger)" }}>
                        {cls.attendance}%
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={{ ...styles.metricPill, background: cls.avgMark >= 50 ? "var(--color-info-light)" : "var(--color-danger-light)", color: cls.avgMark >= 50 ? "var(--color-info)" : "var(--color-danger)" }}>
                        {cls.avgMark}%
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={{ color: cls.behaviour >= 3.5 ? "var(--color-success)" : cls.behaviour >= 2.5 ? "var(--color-warning)" : "var(--color-danger)", fontWeight: 600 }}>
                        {cls.behaviour.toFixed(1)} / 5
                      </span>
                    </td>
                    <td style={styles.td}>
                      {cls.atRisk > 0 ? (
                        <span style={styles.riskBadge}>{cls.atRisk} learner{cls.atRisk > 1 ? "s" : ""}</span>
                      ) : (
                        <span style={{ color: "var(--color-success)", fontSize: 13 }}>None</span>
                      )}
                    </td>
                    <td style={styles.td}>
                      {cls.plansComplete ? (
                        <CheckCircle2 size={18} color="var(--color-success)" />
                      ) : (
                        <Clock size={18} color="var(--color-warning)" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ─── PLAN APPROVALS ─────────────────────────────────────────── */}
        {activeTab === "approvals" && (
          <div style={styles.approvalList}>
            {loading ? (
              <div style={styles.emptyState}>
                <Loader2 size={40} color="var(--color-accent)" style={{ animation: "spin 1s linear infinite" }} />
                <p>Loading pending plans...</p>
              </div>
            ) : pendingPlans.length === 0 ? (
              <div style={styles.emptyState}>
                <CheckCircle2 size={40} color="var(--color-success)" />
                <p>All plans are approved. Nothing pending.</p>
              </div>
            ) : (
              pendingPlans.map((plan) => (
                <div key={plan.id} style={styles.approvalCard}>
                  <div style={styles.approvalLeft}>
                    <div style={styles.approvalIcon}><FileText size={18} color="var(--color-accent)" /></div>
                    <div>
                      <div style={styles.approvalTitle}>{plan.title}</div>
                      <div style={styles.approvalMeta}>
                        {plan.teacher_name || "Unknown"} · {plan.classroom_name || ""} · P{plan.slot_period || "?"} · Submitted {timeAgo(plan.created_at)}
                      </div>
                    </div>
                  </div>
                  <div style={styles.approvalActions}>
                    <button
                      style={styles.approveBtn}
                      onClick={() => handleApprove(plan.id)}
                      disabled={actionLoading === plan.id}
                    >
                      {actionLoading === plan.id ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <CheckCircle2 size={14} />} Approve
                    </button>
                    <button
                      style={styles.returnBtn}
                      onClick={() => handleReturn(plan.id)}
                      disabled={actionLoading === plan.id}
                    >
                      <XCircle size={14} /> Return
                    </button>
                    <button
                      style={styles.viewBtn}
                      onClick={() => navigate("/planning")}
                    >
                      <Eye size={14} /> View
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ─── TEACHER PERFORMANCE ────────────────────────────────────── */}
        {activeTab === "teachers" && (
          <div style={styles.teacherGrid}>
            {TEACHERS.map((teacher) => (
              <div key={teacher.id} style={styles.teacherCard}>
                <div style={styles.teacherHeader}>
                  <div style={styles.teacherAvatar}>{teacher.name.split(" ").map(n => n[0]).join("")}</div>
                  <div>
                    <div style={styles.teacherName}>{teacher.name}</div>
                    <div style={styles.teacherClasses}>{teacher.classes.join(", ")}</div>
                  </div>
                </div>

                <div style={styles.teacherStats}>
                  <div style={styles.teacherStat}>
                    <div style={styles.teacherStatLabel}>Lessons Delivered</div>
                    <div style={styles.teacherStatValue}>
                      {teacher.lessonsDelivered}/{teacher.lessonsTotal}
                      <div style={styles.progressBar}>
                        <div style={{ ...styles.progressFill, width: `${(teacher.lessonsDelivered / teacher.lessonsTotal) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                  <div style={styles.teacherStat}>
                    <div style={styles.teacherStatLabel}>Plans</div>
                    <div style={styles.teacherStatValue}>
                      <span style={{ color: "var(--color-success)" }}>{teacher.plansApproved} approved</span>
                      {teacher.plansPending > 0 && <span style={{ color: "var(--color-accent)" }}> · {teacher.plansPending} pending</span>}
                      {teacher.plansOverdue > 0 && <span style={{ color: "var(--color-danger)" }}> · {teacher.plansOverdue} overdue</span>}
                    </div>
                  </div>
                  <div style={styles.teacherStat}>
                    <div style={styles.teacherStatLabel}>Avg Attendance</div>
                    <div style={{ ...styles.teacherStatValue, color: teacher.avgAttendance >= 90 ? "var(--color-success)" : "var(--color-warning)" }}>
                      {teacher.avgAttendance}%
                    </div>
                  </div>
                  <div style={styles.teacherStat}>
                    <div style={styles.teacherStatLabel}>Avg Marks</div>
                    <div style={{ ...styles.teacherStatValue, color: teacher.avgMarks >= 50 ? "var(--color-info)" : "var(--color-danger)" }}>
                      {teacher.avgMarks}%
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ─── OUTSTANDING ────────────────────────────────────────────── */}
        {activeTab === "outstanding" && (
          <div style={styles.outstandingList}>
            {OUTSTANDING.map((item, i) => (
              <div key={i} style={{
                ...styles.outstandingItem,
                borderLeft: `3px solid ${item.severity === "high" ? "var(--color-danger)" : item.severity === "medium" ? "var(--color-warning)" : "var(--color-info)"}`,
              }}>
                <div style={{
                  ...styles.outstandingSeverity,
                  background: item.severity === "high" ? "var(--color-danger-light)" : item.severity === "medium" ? "var(--color-warning-light)" : "var(--color-info-light)",
                  color: item.severity === "high" ? "var(--color-danger)" : item.severity === "medium" ? "var(--color-warning)" : "var(--color-info)",
                }}>
                  {item.severity.toUpperCase()}
                </div>
                <div style={styles.outstandingContent}>
                  <div style={styles.outstandingDetail}>{item.detail}</div>
                  <div style={styles.outstandingTeacher}>{item.teacher}</div>
                </div>
                <button style={styles.followUpBtn}>Follow up <ChevronRight size={14} /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: { padding: "var(--space-xl)", maxWidth: 1100 },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--space-xl)" },
  greeting: { fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 600, color: "var(--color-navy)", letterSpacing: "-0.02em", marginBottom: 4 },
  subtitle: { fontSize: 15, color: "var(--color-slate)" },
  termBadge: { padding: "8px 16px", background: "var(--color-navy)", color: "var(--color-accent)", fontSize: 13, fontWeight: 600, borderRadius: "var(--radius-sm)" },

  statsGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--space-md)", marginBottom: "var(--space-xl)" },
  statCard: { background: "var(--color-surface)", border: "1px solid var(--color-border-light)", borderRadius: "var(--radius-md)", padding: "var(--space-md)", display: "flex", alignItems: "flex-start", gap: "var(--space-md)" },
  statIcon: { width: 44, height: 44, borderRadius: "var(--radius-sm)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  statValue: { fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 700, color: "var(--color-navy)", lineHeight: 1, marginBottom: 2 },
  statLabel: { fontSize: 13, fontWeight: 500, color: "var(--color-slate)", marginBottom: 1 },
  statSub: { fontSize: 12, color: "var(--color-slate-light)" },

  tabBar: { display: "flex", gap: 0, borderBottom: "1px solid var(--color-border-light)", marginBottom: "var(--space-lg)" },
  tab: { padding: "12px 20px", fontSize: 14, fontFamily: "var(--font-body)", background: "none", border: "none", cursor: "pointer", transition: "all 0.2s" },
  tabContent: {},

  // Table
  tableWrap: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 14 },
  th: { textAlign: "left", padding: "12px 16px", fontSize: 12, fontWeight: 600, color: "var(--color-slate-light)", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid var(--color-border-light)", background: "var(--color-surface-alt)" },
  tr: { borderBottom: "1px solid var(--color-border-light)" },
  td: { padding: "14px 16px", verticalAlign: "middle" },
  classBadge: { fontWeight: 700, color: "var(--color-navy)", background: "var(--color-surface-alt)", padding: "4px 10px", borderRadius: "var(--radius-sm)", fontSize: 13 },
  metricPill: { padding: "4px 10px", borderRadius: 99, fontSize: 13, fontWeight: 600 },
  riskBadge: { background: "var(--color-danger-light)", color: "var(--color-danger)", padding: "4px 10px", borderRadius: 99, fontSize: 12, fontWeight: 600 },

  // Approvals
  approvalList: { display: "flex", flexDirection: "column", gap: "var(--space-sm)" },
  approvalCard: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "var(--space-md)", background: "var(--color-surface)", border: "1px solid var(--color-border-light)", borderRadius: "var(--radius-md)" },
  approvalLeft: { display: "flex", alignItems: "center", gap: "var(--space-md)" },
  approvalIcon: { width: 40, height: 40, borderRadius: "var(--radius-sm)", background: "var(--color-accent-light)", display: "flex", alignItems: "center", justifyContent: "center" },
  approvalTitle: { fontWeight: 600, fontSize: 15, color: "var(--color-navy)", marginBottom: 2 },
  approvalMeta: { fontSize: 13, color: "var(--color-slate-light)" },
  approvalActions: { display: "flex", gap: 6 },
  approveBtn: { display: "flex", alignItems: "center", gap: 4, padding: "8px 14px", fontSize: 13, fontWeight: 600, fontFamily: "var(--font-body)", background: "var(--color-success-light)", color: "var(--color-success)", border: "1px solid rgba(5,150,105,0.2)", borderRadius: "var(--radius-sm)", cursor: "pointer" },
  returnBtn: { display: "flex", alignItems: "center", gap: 4, padding: "8px 14px", fontSize: 13, fontWeight: 500, fontFamily: "var(--font-body)", background: "var(--color-surface-alt)", color: "var(--color-slate)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", cursor: "pointer" },
  viewBtn: { display: "flex", alignItems: "center", gap: 4, padding: "8px 14px", fontSize: 13, fontWeight: 500, fontFamily: "var(--font-body)", background: "transparent", color: "var(--color-info)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", cursor: "pointer" },
  emptyState: { textAlign: "center", padding: "var(--space-3xl)", color: "var(--color-slate)" },

  // Teacher cards
  teacherGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-md)" },
  teacherCard: { background: "var(--color-surface)", border: "1px solid var(--color-border-light)", borderRadius: "var(--radius-md)", padding: "var(--space-lg)" },
  teacherHeader: { display: "flex", alignItems: "center", gap: "var(--space-md)", marginBottom: "var(--space-lg)" },
  teacherAvatar: { width: 44, height: 44, borderRadius: "50%", background: "var(--color-navy)", color: "#FEF3C7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700 },
  teacherName: { fontWeight: 600, fontSize: 16, color: "var(--color-navy)" },
  teacherClasses: { fontSize: 13, color: "var(--color-slate-light)" },
  teacherStats: { display: "flex", flexDirection: "column", gap: "var(--space-md)" },
  teacherStat: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  teacherStatLabel: { fontSize: 13, color: "var(--color-slate)" },
  teacherStatValue: { fontSize: 14, fontWeight: 600, color: "var(--color-navy)", textAlign: "right" },
  progressBar: { width: 80, height: 4, background: "var(--color-surface-alt)", borderRadius: 2, marginTop: 4 },
  progressFill: { height: "100%", background: "var(--color-success)", borderRadius: 2, transition: "width 0.3s" },

  // Outstanding
  outstandingList: { display: "flex", flexDirection: "column", gap: "var(--space-sm)" },
  outstandingItem: { display: "flex", alignItems: "center", gap: "var(--space-md)", padding: "var(--space-md)", background: "var(--color-surface)", border: "1px solid var(--color-border-light)", borderRadius: "var(--radius-md)" },
  outstandingSeverity: { padding: "4px 10px", borderRadius: 99, fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", flexShrink: 0 },
  outstandingContent: { flex: 1 },
  outstandingDetail: { fontSize: 14, fontWeight: 500, color: "var(--color-navy)", marginBottom: 2 },
  outstandingTeacher: { fontSize: 13, color: "var(--color-slate-light)" },
  followUpBtn: { display: "flex", alignItems: "center", gap: 4, padding: "8px 14px", fontSize: 13, fontWeight: 500, fontFamily: "var(--font-body)", background: "transparent", color: "var(--color-accent)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", cursor: "pointer" },
};
