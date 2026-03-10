import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useLocation } from "react-router-dom";
import {
  ClipboardCheck, Check, X, Clock, Search,
  ChevronDown, Save, Loader2, ArrowLeft, AlertTriangle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getMySlots, getClassRoster, getAttendance, saveAttendance } from "../api/client";

export default function AttendancePage() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const incomingState = location.state;

  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [showClassPicker, setShowClassPicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [search, setSearch] = useState("");
  const [records, setRecords] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showFromDashboard, setShowFromDashboard] = useState(!!incomingState?.slotId);
  const [loading, setLoading] = useState(true);
  const [loadingLearners, setLoadingLearners] = useState(false);
  const [error, setError] = useState(null);

  // Load classes from API
  useEffect(() => {
    async function loadClasses() {
      try {
        setLoading(true);
        setError(null);
        const res = await getMySlots();

        // Transform slots to class format, filter out breaks
        const slots = (res.data.slots || [])
          .filter(slot => !slot.is_break && slot.classroom)
          .map(slot => ({
            id: slot.id,
            name: slot.classroom,
            subject: slot.subject || "Class",
            period: `P${slot.period}`,
            time: `${slot.start_time?.slice(0, 5) || ""} – ${slot.end_time?.slice(0, 5) || ""}`,
            classroom_id: slot.classroom_id,
          }));

        setClasses(slots);

        // Set initial class from navigation state or first available
        if (incomingState?.slotId) {
          const match = slots.find(c => c.id === incomingState.slotId);
          if (match) {
            setSelectedClass(match);
            setShowFromDashboard(true);
          } else if (slots.length > 0) {
            setSelectedClass(slots[0]);
          }
        } else if (slots.length > 0) {
          setSelectedClass(slots[0]);
        }
      } catch (err) {
        console.error("Failed to load classes:", err);
        setError("Failed to load your timetable. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    loadClasses();
  }, []);

  // Load learners when class is selected
  useEffect(() => {
    async function loadLearners() {
      if (!selectedClass?.classroom_id) return;

      try {
        setLoadingLearners(true);
        setSaved(false);

        // Get roster for the classroom
        const rosterRes = await getClassRoster(selectedClass.classroom_id);
        const learners = rosterRes.data.learners || [];

        // Initialize records with learners
        const defaults = {};
        learners.forEach((learner, i) => {
          defaults[learner.id] = {
            learnerId: learner.id,
            name: `${learner.first_name} ${learner.last_name}`,
            status: "present",
            reason: "",
          };
        });

        // Try to load existing attendance for this slot and date
        if (selectedClass.id && selectedDate) {
          try {
            const attRes = await getAttendance(selectedClass.id, selectedDate);
            const existing = attRes.data || [];
            existing.forEach(rec => {
              if (defaults[rec.learner]) {
                defaults[rec.learner].status = rec.status;
                defaults[rec.learner].reason = rec.absence_reason || "";
              }
            });
          } catch (e) {
            // No existing attendance, that's fine
          }
        }

        setRecords(defaults);
      } catch (err) {
        console.error("Failed to load learners:", err);
        setRecords({});
      } finally {
        setLoadingLearners(false);
      }
    }
    loadLearners();
  }, [selectedClass, selectedDate]);

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
    if (!selectedClass) return;

    setSaving(true);
    try {
      const data = {
        timetable_slot: selectedClass.id,
        date: selectedDate,
        records: Object.entries(records).map(([id, rec]) => ({
          learner: rec.learnerId,
          status: rec.status,
          absence_reason: rec.reason || "",
        })),
      };
      await saveAttendance(data);
      setSaved(true);
    } catch (err) {
      console.error("Failed to save attendance:", err);
      alert("Failed to save attendance. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const filteredLearners = Object.entries(records).filter(([_, rec]) =>
    rec.name.toLowerCase().includes(search.toLowerCase())
  );

  const counts = {
    present: Object.values(records).filter((r) => r.status === "present").length,
    absent: Object.values(records).filter((r) => r.status === "absent").length,
    late: Object.values(records).filter((r) => r.status === "late").length,
  };

  // Loading state
  if (loading) {
    return (
      <div style={{ ...styles.page, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
        <div style={{ textAlign: "center" }}>
          <Loader2 size={32} color="var(--color-success)" style={{ animation: "spin 1s linear infinite" }} />
          <p style={{ marginTop: 16, color: "var(--color-slate)" }}>Loading attendance...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={{ ...styles.page, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
        <div style={{ textAlign: "center", padding: 32, background: "var(--color-danger-light)", borderRadius: 12 }}>
          <AlertTriangle size={32} color="var(--color-danger)" />
          <p style={{ marginTop: 12, color: "var(--color-danger)", fontWeight: 500 }}>{error}</p>
          <button onClick={() => window.location.reload()} style={{ marginTop: 16, padding: "8px 16px", background: "var(--color-danger)", color: "#FFF", border: "none", borderRadius: 6, cursor: "pointer" }}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  // No classes available
  if (classes.length === 0) {
    return (
      <div style={{ ...styles.page, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
        <div style={{ textAlign: "center", padding: 32 }}>
          <ClipboardCheck size={48} color="var(--color-border)" />
          <p style={{ marginTop: 16, color: "var(--color-slate)", fontSize: 16 }}>No classes found in your timetable</p>
          <button onClick={() => navigate("/")} style={{ marginTop: 16, padding: "10px 20px", background: "var(--color-accent)", color: "#FFF", border: "none", borderRadius: 6, cursor: "pointer" }}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {/* Back to dashboard link when navigated from there */}
      {showFromDashboard && (
        <button onClick={() => navigate("/")} style={styles.backBtn}>
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>
      )}

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

      {/* Pre-selected banner when coming from dashboard */}
      {showFromDashboard && incomingState && (
        <div style={styles.preSelectedBanner}>
          <div style={styles.bannerContent}>
            <div style={styles.bannerLabel}>Selected from dashboard</div>
            <div style={styles.bannerTitle}>
              {incomingState.subject} — {incomingState.className}
            </div>
            <div style={styles.bannerMeta}>
              {incomingState.period} · {incomingState.time}
            </div>
          </div>
          <button
            onClick={() => setShowFromDashboard(false)}
            style={styles.bannerDismiss}
          >
            Change class
          </button>
        </div>
      )}

      {/* Class Selector */}
      <div style={styles.classSelectorWrap}>
        <button
          onClick={() => setShowClassPicker(!showClassPicker)}
          style={{
            ...styles.classSelector,
            borderColor: showClassPicker ? "var(--color-accent)" : "var(--color-border)",
          }}
        >
          <div>
            <span style={styles.classLabel}>
              {selectedClass?.subject || "Select Class"} — {selectedClass?.name || ""}
            </span>
            <span style={styles.classMeta}>
              {selectedClass?.period || ""} · {selectedClass?.time || ""}
            </span>
          </div>
          <ChevronDown
            size={18}
            color="var(--color-slate-light)"
            style={{
              transform: showClassPicker ? "rotate(180deg)" : "none",
              transition: "transform 0.2s",
            }}
          />
        </button>

        {showClassPicker && (
          <div style={styles.classPicker}>
            {classes.map((cls) => (
              <button
                key={cls.id}
                onClick={() => {
                  setSelectedClass(cls);
                  setShowClassPicker(false);
                  setShowFromDashboard(false);
                }}
                style={{
                  ...styles.classOption,
                  background: cls.id === selectedClass?.id ? "var(--color-accent-light)" : "transparent",
                  borderLeft: cls.id === selectedClass?.id ? "3px solid var(--color-accent)" : "3px solid transparent",
                }}
              >
                <div>
                  <span style={styles.classOptLabel}>{cls.subject} — {cls.name}</span>
                  <span style={styles.classOptMeta}>{cls.period} · {cls.time}</span>
                </div>
                {cls.id === selectedClass?.id && <Check size={16} color="var(--color-accent)" />}
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
        {loadingLearners ? (
          <div style={{ padding: 48, textAlign: "center" }}>
            <Loader2 size={24} color="var(--color-success)" style={{ animation: "spin 1s linear infinite" }} />
            <p style={{ marginTop: 12, color: "var(--color-slate)" }}>Loading learners...</p>
          </div>
        ) : filteredLearners.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center", color: "var(--color-slate-light)" }}>
            No learners found for this class
          </div>
        ) : filteredLearners.map(([id, rec], i) => (
          <div
            key={id}
            style={{
              ...styles.learnerRow,
              background: i % 2 === 0 ? "var(--color-surface)" : "var(--color-surface-alt)",
              animationDelay: `${i * 0.02}s`,
            }}
            className="animate-in"
          >
            <div style={styles.learnerNum}>{i + 1}</div>
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
            Attendance saved for {selectedClass?.name || "class"}
          </div>
        )}
        <button
          onClick={handleSave}
          disabled={saving || !selectedClass || loadingLearners}
          style={{
            ...styles.saveBtn,
            opacity: (saving || !selectedClass || loadingLearners) ? 0.7 : 1,
          }}
        >
          {saving ? (
            <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
          ) : (
            <Save size={18} />
          )}
          {saving ? "Saving..." : `Save Attendance — ${selectedClass?.name || ""}`}
        </button>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input:focus { outline: none; border-color: var(--color-accent) !important; box-shadow: var(--shadow-glow) !important; }
      `}</style>
    </div>
  );
}

const styles = {
  page: { padding: "var(--space-xl)", maxWidth: 900, paddingBottom: 100 },
  backBtn: {
    display: "flex", alignItems: "center", gap: 6,
    padding: "8px 14px", marginBottom: "var(--space-md)",
    fontSize: 13, fontWeight: 500, fontFamily: "var(--font-body)",
    background: "transparent", color: "var(--color-slate)",
    border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)",
    cursor: "pointer", transition: "all 0.15s",
  },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-lg)" },
  headerLeft: { display: "flex", alignItems: "center", gap: "var(--space-md)" },
  headerIcon: { width: 48, height: 48, borderRadius: "var(--radius-md)", background: "var(--color-success-light)", display: "flex", alignItems: "center", justifyContent: "center" },
  title: { fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 600, color: "var(--color-navy)", letterSpacing: "-0.02em" },
  subtitle: { fontSize: 14, color: "var(--color-slate)" },
  datePicker: { padding: "10px 14px", fontSize: 14, fontFamily: "var(--font-body)", border: "1.5px solid var(--color-border)", borderRadius: "var(--radius-md)", background: "var(--color-surface)", color: "var(--color-navy)", cursor: "pointer" },

  preSelectedBanner: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "var(--space-md) var(--space-lg)",
    background: "var(--color-accent-light)", border: "1px solid rgba(217,119,6,0.2)",
    borderRadius: "var(--radius-md)", marginBottom: "var(--space-md)",
  },
  bannerContent: {},
  bannerLabel: { fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: "var(--color-accent-dark)", marginBottom: 2, textTransform: "uppercase" },
  bannerTitle: { fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 600, color: "var(--color-navy)" },
  bannerMeta: { fontSize: 13, color: "var(--color-slate)" },
  bannerDismiss: {
    padding: "8px 14px", fontSize: 13, fontWeight: 500, fontFamily: "var(--font-body)",
    background: "var(--color-surface)", color: "var(--color-slate)",
    border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)",
    cursor: "pointer",
  },

  classSelectorWrap: { position: "relative", marginBottom: "var(--space-md)" },
  classSelector: { width: "100%", padding: "14px 16px", background: "var(--color-surface)", border: "1.5px solid var(--color-border)", borderRadius: "var(--radius-md)", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 15, textAlign: "left", transition: "border-color 0.2s" },
  classLabel: { fontWeight: 600, color: "var(--color-navy)", display: "block" },
  classMeta: { fontSize: 13, color: "var(--color-slate-light)" },
  classPicker: { position: "absolute", top: "100%", left: 0, right: 0, background: "var(--color-surface)", border: "1.5px solid var(--color-border)", borderRadius: "var(--radius-md)", marginTop: 4, zIndex: 50, boxShadow: "var(--shadow-lg)", overflow: "hidden" },
  classOption: { width: "100%", padding: "12px 16px", border: "none", borderBottom: "1px solid var(--color-border-light)", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 14, textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center", transition: "background 0.15s" },
  classOptLabel: { fontWeight: 600, color: "var(--color-navy)", display: "block" },
  classOptMeta: { fontSize: 12, color: "var(--color-slate-light)", display: "block" },

  statsBar: { display: "flex", alignItems: "center", gap: "var(--space-md)", marginBottom: "var(--space-md)", padding: "var(--space-sm) 0" },
  statPill: { display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--color-slate)" },
  statDot: { width: 8, height: 8, borderRadius: "50%" },
  markAllBtn: { padding: "8px 14px", fontSize: 13, fontFamily: "var(--font-body)", fontWeight: 500, background: "var(--color-success-light)", color: "var(--color-success)", border: "1px solid rgba(5, 150, 105, 0.2)", borderRadius: "var(--radius-sm)", cursor: "pointer" },

  searchWrap: { position: "relative", marginBottom: "var(--space-md)" },
  searchInput: { width: "100%", padding: "10px 14px 10px 36px", fontSize: 14, fontFamily: "var(--font-body)", border: "1.5px solid var(--color-border)", borderRadius: "var(--radius-md)", background: "var(--color-surface)", color: "var(--color-navy)" },

  listContainer: { border: "1px solid var(--color-border-light)", borderRadius: "var(--radius-md)", overflow: "hidden" },
  learnerRow: { display: "flex", alignItems: "center", gap: "var(--space-md)", padding: "10px 16px", flexWrap: "wrap", opacity: 0 },
  learnerNum: { width: 28, fontSize: 12, color: "var(--color-slate-light)", textAlign: "center", fontVariantNumeric: "tabular-nums" },
  learnerName: { flex: 1, fontSize: 14, fontWeight: 500, color: "var(--color-navy)", minWidth: 160 },
  statusBtns: { display: "flex", gap: 6 },
  statusBtn: { display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", fontSize: 13, fontFamily: "var(--font-body)", border: "1.5px solid var(--color-border)", borderRadius: "var(--radius-sm)", cursor: "pointer", background: "transparent", transition: "all 0.15s ease" },
  reasonInput: { width: "100%", marginTop: 6, marginLeft: 44, padding: "8px 12px", fontSize: 13, fontFamily: "var(--font-body)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", background: "var(--color-surface)", color: "var(--color-navy)" },

  saveBar: { position: "fixed", bottom: 0, left: 240, right: 0, padding: "var(--space-md) var(--space-xl)", background: "var(--color-surface)", borderTop: "1px solid var(--color-border-light)", display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "var(--space-md)", zIndex: 50 },
  savedMsg: { display: "flex", alignItems: "center", gap: 6, fontSize: 14, color: "var(--color-success)", fontWeight: 500 },
  saveBtn: { display: "flex", alignItems: "center", gap: 8, padding: "12px 24px", fontSize: 15, fontWeight: 600, fontFamily: "var(--font-body)", background: "var(--color-accent)", color: "#FFFFFF", border: "none", borderRadius: "var(--radius-md)", cursor: "pointer", transition: "all 0.2s ease" },
};
