import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ClipboardCheck, Check, X, Clock, Search,
  ChevronDown, Save, Loader2, ArrowLeft, Home, BookOpen,
} from "lucide-react";
import {
  getMySlots, getClassRoster, getAttendance, saveAttendance,
  getHomeroomClasses,
} from "../api/client";

// ─── ATTENDANCE MODES ─────────────────────────────────────────────────────────

const MODES = {
  PERIOD: "period",
  HOMEROOM: "homeroom",
};

export default function AttendancePage() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const incomingState = location.state;

  // State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  const [mode, setMode] = useState(MODES.PERIOD);
  const [slots, setSlots] = useState([]);
  const [homeroomClasses, setHomeroomClasses] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedHomeroom, setSelectedHomeroom] = useState(null);
  const [showPicker, setShowPicker] = useState(false);

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [search, setSearch] = useState("");
  const [learners, setLearners] = useState([]);
  const [records, setRecords] = useState({});
  const [loadingLearners, setLoadingLearners] = useState(false);

  const [showFromDashboard] = useState(!!incomingState?.slotId);

  // Get current day of week
  const getDayCode = (dateStr) => {
    const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
    const date = new Date(dateStr + "T00:00:00");
    return days[date.getDay()];
  };

  // ── Load initial data ──
  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
    setLoading(true);
    setError(null);
    try {
      const [slotsRes, homeroomRes] = await Promise.all([
        getMySlots(),
        getHomeroomClasses().catch(() => ({ data: [] })),
      ]);

      const slotsData = slotsRes.data?.slots || slotsRes.data || [];
      const homeroomData = homeroomRes.data || [];

      setSlots(slotsData);
      setHomeroomClasses(homeroomData);

      // If navigated from dashboard with a specific slot
      if (incomingState?.slotId) {
        const match = slotsData.find((s) => s.id === incomingState.slotId);
        if (match) {
          setSelectedSlot(match);
          setMode(MODES.PERIOD);
        }
      } else if (slotsData.length > 0) {
        // Select first slot for today's day
        const today = getDayCode(new Date().toISOString().split("T")[0]);
        const todaySlots = slotsData.filter((s) => s.day === today);
        setSelectedSlot(todaySlots[0] || slotsData[0]);
      }

      // Check if user is a homeroom teacher
      if (homeroomData.length > 0) {
        setSelectedHomeroom(homeroomData[0]);
      }
    } catch (err) {
      console.error("Failed to load data:", err);
      setError("Failed to load timetable data. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // ── Load learners when slot/homeroom/date changes ──
  useEffect(() => {
    if (mode === MODES.PERIOD && selectedSlot) {
      loadLearnersForSlot(selectedSlot.classroom_id, selectedSlot.id);
    } else if (mode === MODES.HOMEROOM && selectedHomeroom) {
      loadLearnersForHomeroom(selectedHomeroom.id);
    }
  }, [selectedSlot, selectedHomeroom, selectedDate, mode]);

  async function loadLearnersForSlot(classroomId, slotId) {
    if (!classroomId) return;
    setLoadingLearners(true);
    try {
      const [rosterRes, attendanceRes] = await Promise.all([
        getClassRoster(classroomId),
        getAttendance(slotId, selectedDate).catch(() => ({ data: [] })),
      ]);

      const learnersList = rosterRes.data?.learners || rosterRes.data || [];
      setLearners(learnersList);

      // Build records from existing attendance or default to present
      const existingRecords = {};
      const attendanceData = attendanceRes.data || [];

      learnersList.forEach((learner) => {
        const existing = attendanceData.find((a) => a.learner_id === learner.id);
        existingRecords[learner.id] = {
          learner_id: learner.id,
          name: learner.name || `${learner.first_name} ${learner.last_name}`,
          status: existing?.status || "present",
          reason: existing?.absence_reason || "",
        };
      });
      setRecords(existingRecords);
      setSaved(false);
    } catch (err) {
      console.error("Failed to load learners:", err);
      setLearners([]);
      setRecords({});
    } finally {
      setLoadingLearners(false);
    }
  }

  async function loadLearnersForHomeroom(classroomId) {
    if (!classroomId) return;
    setLoadingLearners(true);
    try {
      const rosterRes = await getClassRoster(classroomId);
      const learnersList = rosterRes.data?.learners || rosterRes.data || [];
      setLearners(learnersList);

      // For homeroom, check if there's existing homeroom attendance for the day
      // Default to present for all
      const defaultRecords = {};
      learnersList.forEach((learner) => {
        defaultRecords[learner.id] = {
          learner_id: learner.id,
          name: learner.name || `${learner.first_name} ${learner.last_name}`,
          status: "present",
          reason: "",
        };
      });
      setRecords(defaultRecords);
      setSaved(false);
    } catch (err) {
      console.error("Failed to load learners:", err);
      setLearners([]);
      setRecords({});
    } finally {
      setLoadingLearners(false);
    }
  }

  // ── Filter slots by selected date's day ──
  const dayCode = getDayCode(selectedDate);
  const filteredSlots = slots.filter((s) => s.day === dayCode);

  const setStatus = (id, status) => {
    setRecords((prev) => ({ ...prev, [id]: { ...prev[id], status } }));
    setSaved(false);
  };

  const setReason = (id, reason) => {
    setRecords((prev) => ({ ...prev, [id]: { ...prev[id], reason } }));
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
    try {
      const attendanceRecords = Object.values(records).map((rec) => ({
        learner_id: rec.learner_id,
        status: rec.status,
        absence_reason: rec.reason || "",
      }));

      await saveAttendance({
        timetable_slot: mode === MODES.PERIOD ? selectedSlot?.id : null,
        classroom_id: mode === MODES.HOMEROOM ? selectedHomeroom?.id : null,
        date: selectedDate,
        attendance_type: mode,
        records: attendanceRecords,
      });

      setSaved(true);
    } catch (err) {
      console.error("Failed to save attendance:", err);
      alert(err.response?.data?.error || "Failed to save attendance");
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

  const totalLearners = Object.keys(records).length;

  // Current selection label
  const getCurrentLabel = () => {
    if (mode === MODES.PERIOD && selectedSlot) {
      return `${selectedSlot.subject_name} — ${selectedSlot.classroom_name}`;
    }
    if (mode === MODES.HOMEROOM && selectedHomeroom) {
      return `Homeroom — ${selectedHomeroom.name}`;
    }
    return "Select a class";
  };

  const getCurrentMeta = () => {
    if (mode === MODES.PERIOD && selectedSlot) {
      return `P${selectedSlot.period} · ${selectedSlot.start_time}–${selectedSlot.end_time} · ${totalLearners} learners`;
    }
    if (mode === MODES.HOMEROOM && selectedHomeroom) {
      return `Daily Register · ${totalLearners} learners`;
    }
    return "";
  };

  // ── Loading state ──
  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", flexDirection: "column", gap: 12 }}>
        <Loader2 size={32} color="#059669" style={{ animation: "spin 1s linear infinite" }} />
        <span style={{ color: "#64748B" }}>Loading attendance...</span>
      </div>
    );
  }

  // ── Error state ──
  if (error) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", flexDirection: "column", gap: 12 }}>
        <X size={32} color="#DC2626" />
        <span style={{ color: "#DC2626" }}>{error}</span>
        <button onClick={loadInitialData} style={{ padding: "8px 16px", background: "#059669", color: "#FFF", border: "none", borderRadius: 6, cursor: "pointer" }}>Retry</button>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {showFromDashboard && (
        <button onClick={() => navigate("/")} style={styles.backBtn}>
          <ArrowLeft size={16} /> Back to Dashboard
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
                : new Date(selectedDate + "T00:00:00").toLocaleDateString("en-ZA", {
                    weekday: "long", day: "numeric", month: "long",
                  })}
              {" — "}{getCurrentLabel()}
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

      {/* Mode Toggle - Only show if user has homeroom classes */}
      {homeroomClasses.length > 0 && (
        <div style={styles.modeToggle}>
          <button
            onClick={() => setMode(MODES.PERIOD)}
            style={{
              ...styles.modeBtn,
              background: mode === MODES.PERIOD ? "#059669" : "transparent",
              color: mode === MODES.PERIOD ? "#FFF" : "#64748B",
            }}
          >
            <BookOpen size={14} /> Period Attendance
          </button>
          <button
            onClick={() => setMode(MODES.HOMEROOM)}
            style={{
              ...styles.modeBtn,
              background: mode === MODES.HOMEROOM ? "#059669" : "transparent",
              color: mode === MODES.HOMEROOM ? "#FFF" : "#64748B",
            }}
          >
            <Home size={14} /> Homeroom Register
          </button>
        </div>
      )}

      {/* Class/Slot Selector */}
      <div style={styles.classSelectorWrap}>
        <button
          onClick={() => setShowPicker(!showPicker)}
          style={styles.classSelector}
        >
          <div>
            <span style={styles.classLabel}>{getCurrentLabel()}</span>
            <span style={styles.classMeta}>{getCurrentMeta()}</span>
          </div>
          <ChevronDown size={18} color="var(--color-slate-light)"
            style={{ transform: showPicker ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
        </button>

        {showPicker && (
          <div style={styles.classPicker}>
            {mode === MODES.PERIOD ? (
              filteredSlots.length === 0 ? (
                <div style={{ padding: 16, textAlign: "center", color: "#94A3B8" }}>
                  No classes scheduled for {dayCode}
                </div>
              ) : (
                filteredSlots.map((slot) => (
                  <button
                    key={slot.id}
                    onClick={() => { setSelectedSlot(slot); setShowPicker(false); }}
                    style={{
                      ...styles.classOption,
                      background: slot.id === selectedSlot?.id ? "var(--color-accent-light)" : "transparent",
                      borderLeft: slot.id === selectedSlot?.id ? "3px solid var(--color-accent)" : "3px solid transparent",
                    }}
                  >
                    <div>
                      <span style={styles.classOptLabel}>{slot.subject_name} — {slot.classroom_name}</span>
                      <span style={styles.classOptMeta}>
                        P{slot.period} · {slot.start_time}–{slot.end_time}
                      </span>
                    </div>
                    {slot.id === selectedSlot?.id && <Check size={16} color="var(--color-accent)" />}
                  </button>
                ))
              )
            ) : (
              homeroomClasses.map((cls) => (
                <button
                  key={cls.id}
                  onClick={() => { setSelectedHomeroom(cls); setShowPicker(false); }}
                  style={{
                    ...styles.classOption,
                    background: cls.id === selectedHomeroom?.id ? "var(--color-accent-light)" : "transparent",
                    borderLeft: cls.id === selectedHomeroom?.id ? "3px solid var(--color-accent)" : "3px solid transparent",
                  }}
                >
                  <div>
                    <span style={styles.classOptLabel}>Homeroom — {cls.name}</span>
                    <span style={styles.classOptMeta}>
                      {cls.grade_name} · Daily Register
                    </span>
                  </div>
                  {cls.id === selectedHomeroom?.id && <Check size={16} color="var(--color-accent)" />}
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Stats bar */}
      <div style={styles.statsBar}>
        <div style={{ ...styles.statPill, background: "#D1FAE5" }}>
          <div style={{ ...styles.statDot, background: "var(--color-present)" }} />
          Present: <strong>{counts.present}</strong>
        </div>
        <div style={{ ...styles.statPill, background: "#FEE2E2" }}>
          <div style={{ ...styles.statDot, background: "var(--color-absent)" }} />
          Absent: <strong>{counts.absent}</strong>
        </div>
        <div style={{ ...styles.statPill, background: "#FEF3C7" }}>
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
          placeholder={`Search ${totalLearners} learners...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={styles.searchInput}
        />
        {search && (
          <button onClick={() => setSearch("")}
            style={{ position: "absolute", right: 12, top: 10, background: "none", border: "none", cursor: "pointer", color: "#94A3B8" }}>
            <X size={15} />
          </button>
        )}
      </div>

      {/* Learner List */}
      <div style={styles.listContainer}>
        {loadingLearners ? (
          <div style={{ padding: 40, textAlign: "center", color: "#64748B", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
            <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> Loading learners...
          </div>
        ) : filteredLearners.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#94A3B8" }}>
            {totalLearners === 0 ? "No learners enrolled in this class" : "No learners match your search"}
          </div>
        ) : (
          filteredLearners.map(([id, rec], i) => (
            <div
              key={id}
              style={{
                ...styles.learnerRow,
                background: i % 2 === 0 ? "var(--color-surface)" : "var(--color-surface-alt)",
              }}
            >
              <div style={styles.learnerNum}>{i + 1}</div>
              <div style={styles.learnerName}>{rec.name}</div>

              <div style={styles.statusBtns}>
                {[
                  { key: "present", label: "Present", icon: Check, color: "var(--color-present)", bg: "var(--color-present-bg)" },
                  { key: "absent", label: "Absent", icon: X, color: "var(--color-absent)", bg: "var(--color-absent-bg)" },
                  { key: "late", label: "Late", icon: Clock, color: "var(--color-late)", bg: "var(--color-late-bg)" },
                ].map((s) => {
                  const Icon = s.icon;
                  return (
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
                      <Icon size={13} />
                      {s.label}
                    </button>
                  );
                })}
              </div>

              {/* Reason input — only shown when absent */}
              {rec.status === "absent" && (
                <input
                  type="text"
                  placeholder="Reason (optional)"
                  value={rec.reason}
                  onChange={(e) => setReason(id, e.target.value)}
                  style={styles.reasonInput}
                  onClick={(e) => e.stopPropagation()}
                />
              )}
            </div>
          ))
        )}
      </div>

      {/* Save footer */}
      <div style={styles.saveFooter}>
        <div style={styles.saveInfo}>
          {totalLearners} learners · {counts.absent} absent · {counts.late} late
        </div>
        <button
          onClick={handleSave}
          disabled={saving || saved || totalLearners === 0}
          style={{
            ...styles.saveBtn,
            background: saved ? "#059669" : "var(--color-accent)",
            opacity: saving || totalLearners === 0 ? 0.7 : 1,
            cursor: saving || totalLearners === 0 ? "not-allowed" : "pointer",
          }}
        >
          {saving ? (
            <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Saving…</>
          ) : saved ? (
            <><Check size={16} /> Saved</>
          ) : (
            <><Save size={16} /> Save Register</>
          )}
        </button>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

const styles = {
  page: { padding: "var(--space-xl)", maxWidth: 900, margin: "0 auto" },
  backBtn: {
    display: "flex", alignItems: "center", gap: 6,
    padding: "8px 14px", marginBottom: "var(--space-md)",
    fontSize: 13, fontWeight: 500, fontFamily: "var(--font-body)",
    background: "transparent", color: "var(--color-slate)",
    border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)",
    cursor: "pointer", alignSelf: "flex-start",
  },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-lg)" },
  headerLeft: { display: "flex", alignItems: "center", gap: "var(--space-md)" },
  headerIcon: { width: 48, height: 48, borderRadius: "var(--radius-md)", background: "var(--color-success-light)", display: "flex", alignItems: "center", justifyContent: "center" },
  title: { fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 600, color: "var(--color-navy)", margin: 0 },
  subtitle: { fontSize: 14, color: "var(--color-slate-light)", marginTop: 2 },
  datePicker: { padding: "10px 14px", border: "1.5px solid var(--color-border)", borderRadius: "var(--radius-md)", fontFamily: "var(--font-body)", fontSize: 14, color: "var(--color-navy)", cursor: "pointer" },
  modeToggle: { display: "flex", gap: 8, marginBottom: "var(--space-md)", background: "#F1F5F9", padding: 4, borderRadius: "var(--radius-md)" },
  modeBtn: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px 16px", border: "none", borderRadius: "var(--radius-sm)", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600, transition: "all 0.15s" },
  classSelectorWrap: { position: "relative", marginBottom: "var(--space-md)" },
  classSelector: { width: "100%", padding: "14px 16px", background: "var(--color-surface)", border: "1.5px solid var(--color-border)", borderRadius: "var(--radius-md)", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 15, textAlign: "left" },
  classLabel: { fontWeight: 600, color: "var(--color-navy)", display: "block" },
  classMeta: { fontSize: 13, color: "var(--color-slate-light)" },
  classPicker: { position: "absolute", top: "100%", left: 0, right: 0, background: "var(--color-surface)", border: "1.5px solid var(--color-border)", borderRadius: "var(--radius-md)", marginTop: 4, zIndex: 50, boxShadow: "var(--shadow-lg)", overflow: "hidden", maxHeight: 320, overflowY: "auto" },
  classOption: { width: "100%", padding: "12px 16px", border: "none", borderBottom: "1px solid var(--color-border-light)", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 14, textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center" },
  classOptLabel: { fontWeight: 600, color: "var(--color-navy)", display: "block" },
  classOptMeta: { fontSize: 12, color: "var(--color-slate-light)" },
  statsBar: { display: "flex", alignItems: "center", gap: "var(--space-md)", marginBottom: "var(--space-md)", flexWrap: "wrap" },
  statPill: { display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: "var(--radius-md)", fontSize: 14, fontFamily: "var(--font-body)" },
  statDot: { width: 8, height: 8, borderRadius: "50%" },
  markAllBtn: { padding: "8px 16px", background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 13, color: "var(--color-slate)", fontWeight: 500 },
  searchWrap: { position: "relative", marginBottom: "var(--space-md)" },
  searchInput: { width: "100%", padding: "11px 14px 11px 38px", fontSize: 14, fontFamily: "var(--font-body)", border: "1.5px solid var(--color-border)", borderRadius: "var(--radius-md)", color: "var(--color-navy)", outline: "none", boxSizing: "border-box" },
  listContainer: { background: "var(--color-surface)", border: "1px solid var(--color-border-light)", borderRadius: "var(--radius-lg)", overflow: "hidden", marginBottom: 80 },
  learnerRow: { display: "flex", alignItems: "center", gap: "var(--space-md)", padding: "12px 16px", borderBottom: "1px solid var(--color-border-light)", flexWrap: "wrap" },
  learnerNum: { fontSize: 12, color: "var(--color-slate-light)", width: 24, textAlign: "right", flexShrink: 0 },
  learnerName: { flex: 1, fontWeight: 500, color: "var(--color-navy)", fontSize: 14, minWidth: 160 },
  statusBtns: { display: "flex", gap: 6 },
  statusBtn: { display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", border: "1.5px solid", borderRadius: "var(--radius-md)", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 13, transition: "all 0.12s" },
  reasonInput: { flex: 1, padding: "6px 10px", border: "1px solid #FECACA", borderRadius: "var(--radius-sm)", fontSize: 13, fontFamily: "var(--font-body)", color: "#991B1B", background: "#FFF5F5", outline: "none", minWidth: 180 },
  saveFooter: { position: "fixed", bottom: 0, left: 240, right: 0, padding: "16px 32px", background: "var(--color-surface)", borderTop: "1px solid var(--color-border-light)", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 100 },
  saveInfo: { fontSize: 14, color: "var(--color-slate)", fontFamily: "var(--font-body)" },
  saveBtn: { display: "flex", alignItems: "center", gap: 8, padding: "12px 28px", border: "none", borderRadius: "var(--radius-md)", color: "#FFF", fontFamily: "var(--font-body)", fontSize: 15, fontWeight: 600, transition: "all 0.2s" },
};
