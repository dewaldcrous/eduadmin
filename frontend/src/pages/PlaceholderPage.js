import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Construction, ArrowLeft, BookCopy, AlertTriangle, ClipboardCheck } from "lucide-react";

export default function PlaceholderPage({ title }) {
  const location = useLocation();
  const navigate = useNavigate();
  const incomingState = location.state;

  return (
    <div style={styles.page}>
      {incomingState?.slotId && (
        <button onClick={() => navigate("/")} style={styles.backBtn}>
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>
      )}

      <div style={styles.card}>
        <Construction size={48} color="var(--color-accent)" />
        <h2 style={styles.title}>{title}</h2>

        {incomingState?.slotId && (
          <div style={styles.selectedInfo}>
            <div style={styles.selectedLabel}>SELECTED FROM DASHBOARD</div>
            <div style={styles.selectedTitle}>
              {incomingState.subject} — {incomingState.className}
            </div>
            <div style={styles.selectedMeta}>
              {incomingState.period} · {incomingState.time}
            </div>
          </div>
        )}

        <p style={styles.text}>
          This module is coming in Phase 2–3. The backend models and API
          endpoints are ready — this screen will be built next.
        </p>

        {incomingState?.slotId && (
          <p style={styles.textSmall}>
            When this page is built, it will automatically load the {title.toLowerCase()} for{" "}
            <strong>{incomingState.className}</strong> ({incomingState.period}).
          </p>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    padding: "var(--space-xl)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "60vh",
  },
  backBtn: {
    display: "flex", alignItems: "center", gap: 6,
    padding: "8px 14px", marginBottom: "var(--space-md)",
    fontSize: 13, fontWeight: 500, fontFamily: "var(--font-body)",
    background: "transparent", color: "var(--color-slate)",
    border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)",
    cursor: "pointer", alignSelf: "flex-start",
  },
  card: {
    background: "var(--color-surface)",
    border: "1px solid var(--color-border-light)",
    borderRadius: "var(--radius-lg)",
    padding: "var(--space-3xl)",
    textAlign: "center",
    maxWidth: 460,
  },
  title: {
    fontFamily: "var(--font-display)",
    fontSize: 22,
    fontWeight: 600,
    color: "var(--color-navy)",
    margin: "var(--space-md) 0 var(--space-sm)",
  },
  selectedInfo: {
    background: "var(--color-accent-light)",
    border: "1px solid rgba(217,119,6,0.2)",
    borderRadius: "var(--radius-md)",
    padding: "var(--space-md)",
    margin: "var(--space-md) 0",
  },
  selectedLabel: {
    fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
    color: "var(--color-accent-dark)", marginBottom: 4,
  },
  selectedTitle: {
    fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 600,
    color: "var(--color-navy)",
  },
  selectedMeta: {
    fontSize: 13, color: "var(--color-slate)", marginTop: 2,
  },
  text: {
    fontSize: 14,
    color: "var(--color-slate)",
    lineHeight: 1.6,
  },
  textSmall: {
    fontSize: 13,
    color: "var(--color-slate-light)",
    lineHeight: 1.5,
    marginTop: "var(--space-sm)",
  },
};
