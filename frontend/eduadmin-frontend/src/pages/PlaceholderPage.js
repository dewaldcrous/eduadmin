import React from "react";
import { Construction } from "lucide-react";

export default function PlaceholderPage({ title }) {
  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <Construction size={48} color="var(--color-accent)" />
        <h2 style={styles.title}>{title}</h2>
        <p style={styles.text}>
          This module is coming in Phase 2–3. The backend models and API
          endpoints are ready — this screen will be built next.
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    padding: "var(--space-xl)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "60vh",
  },
  card: {
    background: "var(--color-surface)",
    border: "1px solid var(--color-border-light)",
    borderRadius: "var(--radius-lg)",
    padding: "var(--space-3xl)",
    textAlign: "center",
    maxWidth: 420,
  },
  title: {
    fontFamily: "var(--font-display)",
    fontSize: 22,
    fontWeight: 600,
    color: "var(--color-navy)",
    margin: "var(--space-md) 0 var(--space-sm)",
  },
  text: {
    fontSize: 14,
    color: "var(--color-slate)",
    lineHeight: 1.6,
  },
};
