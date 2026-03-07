import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  ClipboardCheck, Check, X, Clock, Search,
  ChevronDown, Save, Loader2, AlertCircle,
} from "lucide-react";

// Demo data - replace with API calls when backend is connected
const DEMO_CLASSES = [
  { id: 1, name: "10A", subject: "Mathematics", period: "P1", time: "07:45 – 08:30" },
  { id: 2, name: "10B", subject: "Mathematics", period: "P2", time: "08:30 – 09:15" },
  { id: 3, name: "10C", subject: "Mathematics", period: "P3", time: "09:15 – 10:00" },
  { id: 4, name: "11A", subject: "Mathematics", period: "P4", time: "10:20 – 11:05" },
  { id: 5, name: "11B", subject: "Mathematics", period: "P5", time: "11:05 – 11:50" },
];

const DEMO_LEARNERS = [
  "Lerato Mokoena", "Ethan Van der Merwe", "Thandi Naidoo", "Sipho Dlamini",
  "Priya Williams", "Kagiso Botha", "Zanele Pillay", "Bongani Zulu",
  "Emma Maharaj", "Neo September", "Aisha Smith", "Tshepo Fourie",
  "Naledi Govender", "Mandla Mahlangu", "Chloe Khoza", "David Louw",
  "Palesa Jordaan", "Rajan Erasmus", "Lindiwe Cloete", "Ahmed Patel",
  "Kefilwe Ngcobo", "Jason Venter", "Sarah Modise", "Michael Adams",
  "Ava Petersen", "Luke Khumalo", "Lisa Sithole", "Liam Mthembu",
  "Nomsa Ndlovu", "Thabo Cele",
];

export default function AttendancePage() {
  const { user } = useAuth();
  const [selectedClass, setSelectedClass] = useState(DEMO_CLASSES[0]);
  const [showClassPicker, setShowClassPicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [search, setSearch] = useState("");
  const [records, setRecords] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Initialize all learners as "present"
  useEffect(() => {
    const defaults = {};
    DEMO_LEARNERS.forEach((name, i) => {
      defaults[i] = { name, status: "present", reason: "" };
    });
    setRecords(defaults);
    setSaved(false);
  }, [selectedClass]);

  const setStatus = (id, status) => {
    setRecords((prev) => ({
      ...prev,
      [id]: { ...prev[id], status },
    }));
    setSaved(false);
  };

  const setReason = (id, reason) => {
    setRecords((prev) => ({
      ...prev,
      [id]: { ...prev[id], reason },
    }));
  };

  const markAllPresent = () => {
    const updated = {};
    Object.entries(records).forEach(([id, rec]) => {
      updated[id] = { ...rec, status: "present", reason: "" };
    });
    setRecords(updated);
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    // Simulate API call
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    setSaved(true);
  };

  const filteredLearners = Object.entries(records).filter(([_, rec]) =>
    rec.name.toLowerCase().includes(search.toLowerCase())
  );

  const counts = {
    present: Object.values(records).filter((r) => r.status === "present").length,
    absent: Object.values(records).filter((r) => r.status === "absent").length,
    late: Object.values(records).filter((r) => r.status === "late").length,
  };

  return (
    <div style={styles.page}>
      {/* Page Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.headerIcon}>
            <ClipboardCheck size={22} color="var(--color-success)" />
          </div>
          <div>
            <h1 style={styles.title}>Attendance Register</h1>
            <p style={styles.subtitle}>
              {selectedDate === new Date().toISOString().split("T")[0]
                ? "Today"
                : new Date(selectedDate).toLocaleDateString("en-ZA", {
                    weekday: "long", day: "numeric", month: "long",
                  })}
            </p>
          </div>
        </div>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          style={styles.datePicker}
        />
      </div>

      {/* Class Selector */}
      <div style={styles.classSelectorWrap}>
        <button
          onClick={() => setShowClassPicker(!showClassPicker)}
          style={styles.classSelector}
        >
          <div>
            <span style={styles.classLabel}>
              {selectedClass.subject} — {selectedClass.name}
            </span>
            <span style={styles.classMeta}>
              {selectedClass.period} · {selectedClass.time}
            </span>
          </div>
          <ChevronDown size={18} color="var(--color-slate-light)" />
        </button>

        {showClassPicker && (
          <div style={styles.classPicker}>
            {DEMO_CLASSES.map((cls) => (
              <button
                key={cls.id}
                onClick={() => {
                  setSelectedClass(cls);
                  setShowClassPicker(false);
                }}
                style={{
                  ...styles.classOption,
                  background: cls.id === selectedClass.id ? "var(--color-accent-light)" : "transparent",
                }}
              >
                <span style={styles.classOptLabel}>{cls.name}</span>
                <span style={styles.classOptMeta}>
                  {cls.period} · {cls.time}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Stats bar */}
      <div style={styles.statsBar}>
        <div style={styles.statPill}>
          <div style={{ ...styles.statDot, background: "var(--color-present)" }} />
          Present: <strong>{counts.present}</strong>
        </div>
        <div style={styles.statPill}>
          <div style={{ ...styles.statDot, background: "var(--color-absent)" }} />
          Absent: <strong>{counts.absent}</strong>
        </div>
        <div style={styles.statPill}>
          <div style={{ ...styles.statDot, background: "var(--color-late)" }} />
          Late: <strong>{counts.late}</strong>
        </div>
        <div style={{ flex: 1 }} />
        <button onClick={markAllPresent} style={styles.markAllBtn}>
          Mark all present
        </button>
      </div>

      {/* Search */}
      <div style={styles.searchWrap}>
        <Search size={16} color="var(--color-slate-light)" style={{ position: "absolute", left: 12, top: 12 }} />
        <input
          type="text"
          placeholder="Search learners..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={styles.searchInput}
        />
      </div>

      {/* Learner List */}
      <div style={styles.listContainer}>
        {filteredLearners.map(([id, rec], i) => (
          <div
            key={id}
            style={{
              ...styles.learnerRow,
              background: i % 2 === 0 ? "var(--color-surface)" : "var(--color-surface-alt)",
              animationDelay: `${i * 0.02}s`,
            }}
            className="animate-in"
          >
            <div style={styles.learnerNum}>{parseInt(id) + 1}</div>
            <div style={styles.learnerName}>{rec.name}</div>

            <div style={styles.statusBtns}>
              {[
                { key: "present", label: "Present", icon: Check, color: "var(--color-present)", bg: "var(--color-present-bg)" },
                { key: "absent", label: "Absent", icon: X, color: "var(--color-absent)", bg: "var(--color-absent-bg)" },
                { key: "late", label: "Late", icon: Clock, color: "var(--color-late)", bg: "var(--color-late-bg)" },
              ].map((s) => (
                <button
                  key={s.key}
                  onClick={() => setStatus(id, s.key)}
                  style={{
                    ...styles.statusBtn,
                    background: rec.status === s.key ? s.bg : "transparent",
                    color: rec.status === s.key ? s.color : "var(--color-slate-light)",
                    borderColor: rec.status === s.key ? s.color : "var(--color-border)",
                    fontWeight: rec.status === s.key ? 600 : 400,
                  }}
                >
                  <s.icon size={14} />
                  {s.label}
                </button>
              ))}
            </div>

            {rec.status === "absent" && (
              <input
                type="text"
                placeholder="Reason for absence..."
                value={rec.reason}
                onChange={(e) => setReason(id, e.target.value)}
                style={styles.reasonInput}
              />
            )}
          </div>
        ))}
      </div>

      {/* Save Button */}
      <div style={styles.saveBar}>
        {saved && (
          <div style={styles.savedMsg}>
            <Check size={16} />
            Attendance saved successfully
          </div>
        )}
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            ...styles.saveBtn,
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? (
            <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
          ) : (
            <Save size={18} />
          )}
          {saving ? "Saving..." : "Save Attendance"}
        </button>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input[type="date"]:focus, .search-input:focus { outline: none; border-color: var(--color-accent); box-shadow: var(--shadow-glow); }
      `}</style>
    </div>
  );
}

const styles = {
  page: {
    padding: "var(--space-xl)",
    maxWidth: 900,
    paddingBottom: 100,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "var(--space-lg)",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "var(--space-md)",
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: "var(--radius-md)",
    background: "var(--color-success-light)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: "var(--font-display)",
    fontSize: 24,
    fontWeight: 600,
    color: "var(--color-navy)",
    letterSpacing: "-0.02em",
  },
  subtitle: {
    fontSize: 14,
    color: "var(--color-slate)",
  },
  datePicker: {
    padding: "10px 14px",
    fontSize: 14,
    fontFamily: "var(--font-body)",
    border: "1.5px solid var(--color-border)",
    borderRadius: "var(--radius-md)",
    background: "var(--color-surface)",
    color: "var(--color-navy)",
    cursor: "pointer",
  },
  classSelectorWrap: {
    position: "relative",
    marginBottom: "var(--space-md)",
  },
  classSelector: {
    width: "100%",
    padding: "14px 16px",
    background: "var(--color-surface)",
    border: "1.5px solid var(--color-border)",
    borderRadius: "var(--radius-md)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    cursor: "pointer",
    fontFamily: "var(--font-body)",
    fontSize: 15,
    textAlign: "left",
  },
  classLabel: {
    fontWeight: 600,
    color: "var(--color-navy)",
    display: "block",
  },
  classMeta: {
    fontSize: 13,
    color: "var(--color-slate-light)",
  },
  classPicker: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    background: "var(--color-surface)",
    border: "1.5px solid var(--color-border)",
    borderRadius: "var(--radius-md)",
    marginTop: 4,
    zIndex: 50,
    boxShadow: "var(--shadow-lg)",
    overflow: "hidden",
  },
  classOption: {
    width: "100%",
    padding: "12px 16px",
    border: "none",
    borderBottom: "1px solid var(--color-border-light)",
    cursor: "pointer",
    fontFamily: "var(--font-body)",
    fontSize: 14,
    textAlign: "left",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  classOptLabel: {
    fontWeight: 600,
    color: "var(--color-navy)",
  },
  classOptMeta: {
    fontSize: 12,
    color: "var(--color-slate-light)",
  },
  statsBar: {
    display: "flex",
    alignItems: "center",
    gap: "var(--space-md)",
    marginBottom: "var(--space-md)",
    padding: "var(--space-sm) 0",
  },
  statPill: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 13,
    color: "var(--color-slate)",
  },
  statDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
  },
  markAllBtn: {
    padding: "8px 14px",
    fontSize: 13,
    fontFamily: "var(--font-body)",
    fontWeight: 500,
    background: "var(--color-success-light)",
    color: "var(--color-success)",
    border: "1px solid rgba(5, 150, 105, 0.2)",
    borderRadius: "var(--radius-sm)",
    cursor: "pointer",
  },
  searchWrap: {
    position: "relative",
    marginBottom: "var(--space-md)",
  },
  searchInput: {
    width: "100%",
    padding: "10px 14px 10px 36px",
    fontSize: 14,
    fontFamily: "var(--font-body)",
    border: "1.5px solid var(--color-border)",
    borderRadius: "var(--radius-md)",
    background: "var(--color-surface)",
    color: "var(--color-navy)",
  },
  listContainer: {
    border: "1px solid var(--color-border-light)",
    borderRadius: "var(--radius-md)",
    overflow: "hidden",
  },
  learnerRow: {
    display: "flex",
    alignItems: "center",
    gap: "var(--space-md)",
    padding: "10px 16px",
    flexWrap: "wrap",
    opacity: 0,
  },
  learnerNum: {
    width: 28,
    fontSize: 12,
    color: "var(--color-slate-light)",
    textAlign: "center",
    fontVariantNumeric: "tabular-nums",
  },
  learnerName: {
    flex: 1,
    fontSize: 14,
    fontWeight: 500,
    color: "var(--color-navy)",
    minWidth: 160,
  },
  statusBtns: {
    display: "flex",
    gap: 6,
  },
  statusBtn: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    padding: "6px 12px",
    fontSize: 13,
    fontFamily: "var(--font-body)",
    border: "1.5px solid var(--color-border)",
    borderRadius: "var(--radius-sm)",
    cursor: "pointer",
    background: "transparent",
    transition: "all 0.15s ease",
  },
  reasonInput: {
    width: "100%",
    marginTop: 6,
    marginLeft: 44,
    padding: "8px 12px",
    fontSize: 13,
    fontFamily: "var(--font-body)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-sm)",
    background: "var(--color-surface)",
    color: "var(--color-navy)",
  },
  saveBar: {
    position: "fixed",
    bottom: 0,
    left: 240,
    right: 0,
    padding: "var(--space-md) var(--space-xl)",
    background: "var(--color-surface)",
    borderTop: "1px solid var(--color-border-light)",
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: "var(--space-md)",
    zIndex: 50,
  },
  savedMsg: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 14,
    color: "var(--color-success)",
    fontWeight: 500,
  },
  saveBtn: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "12px 24px",
    fontSize: 15,
    fontWeight: 600,
    fontFamily: "var(--font-body)",
    background: "var(--color-accent)",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "var(--radius-md)",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
};
