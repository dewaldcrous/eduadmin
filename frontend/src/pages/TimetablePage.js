import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getTimetables, getTimetableDetail, createTimetable, updateTimetableStatus,
  createTimetableSlot, updateTimetableSlot, deleteTimetableSlot,
  getTeachers, getClassrooms, getSubjects,
  getTimetableConfig, updateTimetableConfig,
} from "../api/client";
import {
  Calendar, Plus, X, Edit3, Trash2,
  AlertCircle, Save, Loader2, Users, Clock,
  GraduationCap, CheckCircle2, AlertTriangle,
  Settings, RotateCcw,
} from "lucide-react";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const WEEK_DAYS = [
  { id: "MON", label: "Monday", short: "Mon" },
  { id: "TUE", label: "Tuesday", short: "Tue" },
  { id: "WED", label: "Wednesday", short: "Wed" },
  { id: "THU", label: "Thursday", short: "Thu" },
  { id: "FRI", label: "Friday", short: "Fri" },
  { id: "SAT", label: "Saturday", short: "Sat" },
  { id: "SUN", label: "Sunday", short: "Sun" },
];

const CYCLE_DAYS = [
  { id: "D1", label: "Day 1", short: "D1" },
  { id: "D2", label: "Day 2", short: "D2" },
  { id: "D3", label: "Day 3", short: "D3" },
  { id: "D4", label: "Day 4", short: "D4" },
  { id: "D5", label: "Day 5", short: "D5" },
  { id: "D6", label: "Day 6", short: "D6" },
  { id: "D7", label: "Day 7", short: "D7" },
  { id: "D8", label: "Day 8", short: "D8" },
];

const DEFAULT_PERIODS = [
  { period: 1, start_time: "07:45", end_time: "08:30" },
  { period: 2, start_time: "08:30", end_time: "09:15" },
  { period: 3, start_time: "09:15", end_time: "10:00" },
  { period: 4, start_time: "10:20", end_time: "11:05" },
  { period: 5, start_time: "11:05", end_time: "11:50" },
  { period: 6, start_time: "11:50", end_time: "12:35" },
  { period: 7, start_time: "13:00", end_time: "13:45" },
];

const TEACHER_COLORS = [
  "#7C3AED", "#0891B2", "#059669", "#D97706", "#DC2626",
  "#0284C7", "#16A34A", "#CA8A04", "#B91C1C", "#7C3AED",
];

function teacherColor(teacherId) {
  return TEACHER_COLORS[(teacherId - 1) % TEACHER_COLORS.length];
}

// ─── CONFLICT DETECTION ───────────────────────────────────────────────────────

function detectConflicts(slots) {
  const conflicts = new Set();
  for (let i = 0; i < slots.length; i++) {
    for (let j = i + 1; j < slots.length; j++) {
      const a = slots[i];
      const b = slots[j];
      if (a.day !== b.day || a.period !== b.period) continue;
      if (a.teacher_id === b.teacher_id && a.teacher_id) {
        conflicts.add(a.id);
        conflicts.add(b.id);
      }
      if (a.classroom_id === b.classroom_id) {
        conflicts.add(a.id);
        conflicts.add(b.id);
      }
    }
  }
  return conflicts;
}

// ─── CONFIG MODAL ─────────────────────────────────────────────────────────────

function ConfigModal({ config, onClose, onSave, saving }) {
  const [form, setForm] = useState({
    cycle_type: config?.cycle_type || "week",
    days_count: config?.days_count || 5,
    periods: config?.periods || DEFAULT_PERIODS,
  });

  const availableDays = form.cycle_type === "week" ? WEEK_DAYS : CYCLE_DAYS;
  const selectedDays = availableDays.slice(0, form.days_count);

  function addPeriod() {
    const lastPeriod = form.periods[form.periods.length - 1];
    const newPeriod = form.periods.length + 1;
    let startTime = "14:00";
    let endTime = "14:45";
    if (lastPeriod) {
      const [h, m] = lastPeriod.end_time.split(":").map(Number);
      const startH = h + Math.floor((m + 15) / 60);
      const startM = (m + 15) % 60;
      const endH = startH + Math.floor((startM + 45) / 60);
      const endM = (startM + 45) % 60;
      startTime = `${String(startH).padStart(2, "0")}:${String(startM).padStart(2, "0")}`;
      endTime = `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
    }
    setForm({
      ...form,
      periods: [...form.periods, { period: newPeriod, start_time: startTime, end_time: endTime }],
    });
  }

  function removePeriod(idx) {
    if (form.periods.length <= 1) return;
    const newPeriods = form.periods.filter((_, i) => i !== idx).map((p, i) => ({ ...p, period: i + 1 }));
    setForm({ ...form, periods: newPeriods });
  }

  function updatePeriodTime(idx, field, value) {
    const newPeriods = form.periods.map((p, i) => i === idx ? { ...p, [field]: value } : p);
    setForm({ ...form, periods: newPeriods });
  }

  function handleSave() {
    onSave(form);
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
      onClick={onClose}>
      <div style={{ width: 560, maxHeight: "90vh", background: "#FFF", borderRadius: 16, overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 24px 64px rgba(0,0,0,0.15)" }}
        onClick={(e) => e.stopPropagation()}>

        <div style={{ padding: "20px 24px", borderBottom: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Settings size={20} color="#7C3AED" />
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 600 }}>Timetable Configuration</h3>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8" }}><X size={20} /></button>
        </div>

        <div style={{ padding: 24, overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Cycle Type */}
          <div>
            <label style={lbl}>Schedule Type</label>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setForm({ ...form, cycle_type: "week", days_count: Math.min(form.days_count, 7) })}
                style={{ flex: 1, padding: "14px", border: "2px solid " + (form.cycle_type === "week" ? "#7C3AED" : "#E2E8F0"), borderRadius: 10, background: form.cycle_type === "week" ? "#EDE9FE" : "#FFF", cursor: "pointer", textAlign: "left" }}>
                <div style={{ fontWeight: 600, color: form.cycle_type === "week" ? "#7C3AED" : "#475569", marginBottom: 4 }}>Standard Week</div>
                <div style={{ fontSize: 12, color: "#94A3B8" }}>Mon-Fri (or include weekends)</div>
              </button>
              <button onClick={() => setForm({ ...form, cycle_type: "cycle", days_count: Math.min(form.days_count, 8) })}
                style={{ flex: 1, padding: "14px", border: "2px solid " + (form.cycle_type === "cycle" ? "#7C3AED" : "#E2E8F0"), borderRadius: 10, background: form.cycle_type === "cycle" ? "#EDE9FE" : "#FFF", cursor: "pointer", textAlign: "left" }}>
                <div style={{ fontWeight: 600, color: form.cycle_type === "cycle" ? "#7C3AED" : "#475569", marginBottom: 4 }}>Cycle Days</div>
                <div style={{ fontSize: 12, color: "#94A3B8" }}>Day 1 to Day 8 rotation</div>
              </button>
            </div>
          </div>

          {/* Days Count */}
          <div>
            <label style={lbl}>Number of Days</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {(form.cycle_type === "week" ? [5, 6, 7] : [5, 6, 7, 8]).map((n) => (
                <button key={n} onClick={() => setForm({ ...form, days_count: n })}
                  style={{ padding: "8px 20px", border: "2px solid " + (form.days_count === n ? "#7C3AED" : "#E2E8F0"), borderRadius: 8, background: form.days_count === n ? "#EDE9FE" : "#FFF", cursor: "pointer", fontWeight: form.days_count === n ? 700 : 400, color: form.days_count === n ? "#7C3AED" : "#64748B", fontSize: 14 }}>
                  {n} days
                </button>
              ))}
            </div>
            <div style={{ marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap" }}>
              {selectedDays.map((d) => (
                <span key={d.id} style={{ padding: "4px 10px", borderRadius: 6, background: "#F1F5F9", fontSize: 12, color: "#64748B" }}>{d.label}</span>
              ))}
            </div>
          </div>

          {/* Periods */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <label style={{ ...lbl, marginBottom: 0 }}>Periods ({form.periods.length})</label>
              <button onClick={addPeriod}
                style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", border: "1.5px solid #E2E8F0", borderRadius: 6, background: "#FFF", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#7C3AED" }}>
                <Plus size={12} /> Add Period
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 280, overflowY: "auto", padding: 2 }}>
              {form.periods.map((p, idx) => (
                <div key={idx} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "#F8FAFC", borderRadius: 8 }}>
                  <div style={{ width: 40, fontWeight: 700, color: "#7C3AED", fontSize: 14 }}>P{p.period}</div>
                  <input type="time" value={p.start_time} onChange={(e) => updatePeriodTime(idx, "start_time", e.target.value)}
                    style={{ padding: "6px 10px", border: "1.5px solid #E2E8F0", borderRadius: 6, fontSize: 13, fontFamily: "var(--font-body)" }} />
                  <span style={{ color: "#94A3B8" }}>to</span>
                  <input type="time" value={p.end_time} onChange={(e) => updatePeriodTime(idx, "end_time", e.target.value)}
                    style={{ padding: "6px 10px", border: "1.5px solid #E2E8F0", borderRadius: 6, fontSize: 13, fontFamily: "var(--font-body)" }} />
                  <button onClick={() => removePeriod(idx)} disabled={form.periods.length <= 1}
                    style={{ marginLeft: "auto", padding: 6, border: "none", borderRadius: 6, background: form.periods.length > 1 ? "#FEE2E2" : "#F1F5F9", cursor: form.periods.length > 1 ? "pointer" : "not-allowed", color: form.periods.length > 1 ? "#DC2626" : "#CBD5E1" }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ padding: "16px 24px", borderTop: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button onClick={() => setForm({ cycle_type: "week", days_count: 5, periods: DEFAULT_PERIODS })}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 16px", border: "1px solid #E2E8F0", borderRadius: 8, background: "#FFF", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#64748B" }}>
            <RotateCcw size={14} /> Reset to Default
          </button>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onClose} style={{ padding: "10px 20px", border: "1px solid #E2E8F0", borderRadius: 8, background: "#FFF", fontSize: 13, fontWeight: 600, color: "#64748B", cursor: "pointer" }}>Cancel</button>
            <button onClick={handleSave} disabled={saving}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 20px", border: "none", borderRadius: 8, background: "#7C3AED", color: "#FFF", fontSize: 13, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
              {saving ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Save size={14} />}
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SLOT MODAL ───────────────────────────────────────────────────────────────

function SlotModal({ slot, onClose, onSave, existingSlots, teachers, classrooms, subjects, config, saving }) {
  const days = config?.cycle_type === "cycle"
    ? CYCLE_DAYS.slice(0, config?.days_count || 6)
    : WEEK_DAYS.slice(0, config?.days_count || 5);
  const periods = config?.periods || DEFAULT_PERIODS;

  const [form, setForm] = useState(slot ? {
    day: slot.day,
    period: slot.period,
    teacher_id: slot.teacher_id || "",
    classroom_id: slot.classroom_id || "",
    subject_id: slot.subject_id || "",
  } : {
    day: days[0]?.id || "MON",
    period: 1,
    teacher_id: "",
    classroom_id: "",
    subject_id: "",
  });
  const [error, setError] = useState("");

  function getDayLabel(dayId) {
    return [...WEEK_DAYS, ...CYCLE_DAYS].find(d => d.id === dayId)?.label || dayId;
  }

  function validate() {
    if (!form.teacher_id) return "Please select a teacher.";
    if (!form.classroom_id) return "Please select a classroom.";
    if (!form.subject_id) return "Please select a subject.";

    const others = existingSlots.filter((s) => !slot || s.id !== slot.id);
    const teacherConflict = others.find((s) =>
      s.day === form.day && s.period === Number(form.period) && s.teacher_id === Number(form.teacher_id)
    );
    if (teacherConflict) {
      const t = teachers.find((t) => t.id === Number(form.teacher_id));
      return `${t?.name || "Teacher"} already has a slot on ${getDayLabel(form.day)} P${form.period}.`;
    }

    const classConflict = others.find((s) =>
      s.day === form.day && s.period === Number(form.period) && s.classroom_id === Number(form.classroom_id)
    );
    if (classConflict) {
      const c = classrooms.find((c) => c.id === Number(form.classroom_id));
      return `${c?.name || "Classroom"} already has a slot on ${getDayLabel(form.day)} P${form.period}.`;
    }

    return null;
  }

  function handleSave() {
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    const pt = periods.find((p) => p.period === Number(form.period));
    onSave({
      id: slot ? slot.id : null,
      day: form.day,
      period: Number(form.period),
      teacher_id: Number(form.teacher_id),
      classroom_id: Number(form.classroom_id),
      subject_id: Number(form.subject_id),
      start_time: pt?.start_time || "07:45",
      end_time: pt?.end_time || "08:30",
    });
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={onClose}>
      <div style={{ width: 520, background: "#FFF", borderRadius: 16, overflow: "hidden", boxShadow: "0 24px 64px rgba(0,0,0,0.15)" }}
        onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 600 }}>{slot ? "Edit Slot" : "Add Timetable Slot"}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8" }}><X size={20} /></button>
        </div>

        {error && (
          <div style={{ padding: "10px 24px", background: "#FEE2E2", borderBottom: "1px solid #FECACA", display: "flex", alignItems: "center", gap: 8, color: "#DC2626", fontSize: 13 }}>
            <AlertCircle size={15} /> {error}
          </div>
        )}

        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={lbl}>Day</label>
              <select value={form.day} onChange={(e) => { setForm({ ...form, day: e.target.value }); setError(""); }}
                style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #E2E8F0", borderRadius: 8, fontFamily: "var(--font-body)", fontSize: 14, color: "var(--color-navy)", cursor: "pointer" }}>
                {days.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Period</label>
              <select value={form.period} onChange={(e) => { setForm({ ...form, period: e.target.value }); setError(""); }}
                style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #E2E8F0", borderRadius: 8, fontFamily: "var(--font-body)", fontSize: 14, color: "var(--color-navy)", cursor: "pointer" }}>
                {periods.map((pt) => <option key={pt.period} value={pt.period}>P{pt.period} ({pt.start_time}–{pt.end_time})</option>)}
              </select>
            </div>
          </div>

          <div>
            <label style={lbl}>Teacher *</label>
            <select value={form.teacher_id} onChange={(e) => { setForm({ ...form, teacher_id: e.target.value }); setError(""); }}
              style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #E2E8F0", borderRadius: 8, fontFamily: "var(--font-body)", fontSize: 14, color: "var(--color-navy)", cursor: "pointer" }}>
              <option value="">— Select teacher —</option>
              {teachers.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.subjects?.join(", ") || t.role})</option>)}
            </select>
          </div>

          <div>
            <label style={lbl}>Classroom *</label>
            <select value={form.classroom_id} onChange={(e) => { setForm({ ...form, classroom_id: e.target.value }); setError(""); }}
              style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #E2E8F0", borderRadius: 8, fontFamily: "var(--font-body)", fontSize: 14, color: "var(--color-navy)", cursor: "pointer" }}>
              <option value="">— Select class —</option>
              {classrooms.map((c) => <option key={c.id} value={c.id}>{c.name} ({typeof c.grade === "object" ? c.grade?.name : c.grade})</option>)}
            </select>
          </div>

          <div>
            <label style={lbl}>Subject *</label>
            <select value={form.subject_id} onChange={(e) => { setForm({ ...form, subject_id: e.target.value }); setError(""); }}
              style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #E2E8F0", borderRadius: 8, fontFamily: "var(--font-body)", fontSize: 14, color: "var(--color-navy)", cursor: "pointer" }}>
              <option value="">— Select subject —</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>

        <div style={{ padding: "16px 24px", borderTop: "1px solid #E2E8F0", display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={onClose} style={{ padding: "10px 20px", border: "1px solid #E2E8F0", borderRadius: 8, background: "#FFF", fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600, color: "#64748B", cursor: "pointer" }}>Cancel</button>
          <button onClick={handleSave} disabled={saving}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 20px", border: "none", borderRadius: 8, background: "#7C3AED", color: "#FFF", fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
            {saving ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Save size={14} />}
            {slot ? "Update Slot" : "Add Slot"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── NEW TIMETABLE MODAL ──────────────────────────────────────────────────────

function NewTimetableModal({ onClose, onSave, saving }) {
  const [form, setForm] = useState({ name: "", term: "1", year: "2026" });
  const [error, setError] = useState("");

  function handleSave() {
    if (!form.name.trim()) {
      setError("Name is required.");
      return;
    }
    onSave({
      name: form.name.trim(),
      term: Number(form.term),
      year: Number(form.year),
    });
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={onClose}>
      <div style={{ width: 420, background: "#FFF", borderRadius: 16, overflow: "hidden" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 600 }}>New Timetable</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8" }}><X size={20} /></button>
        </div>
        {error && <div style={{ padding: "10px 24px", background: "#FEE2E2", color: "#DC2626", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}><AlertCircle size={14} />{error}</div>}
        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={lbl}>Timetable Name *</label>
            <input type="text" value={form.name} onChange={(e) => { setForm({ ...form, name: e.target.value }); setError(""); }}
              placeholder="e.g. Term 2 2026"
              style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #E2E8F0", borderRadius: 8, fontFamily: "var(--font-body)", fontSize: 14, color: "var(--color-navy)", outline: "none", boxSizing: "border-box" }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={lbl}>Term</label>
              <select value={form.term} onChange={(e) => setForm({ ...form, term: e.target.value })}
                style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #E2E8F0", borderRadius: 8, fontFamily: "var(--font-body)", fontSize: 14, cursor: "pointer" }}>
                {[1, 2, 3, 4].map((t) => <option key={t} value={t}>Term {t}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Year</label>
              <select value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })}
                style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #E2E8F0", borderRadius: 8, fontFamily: "var(--font-body)", fontSize: 14, cursor: "pointer" }}>
                {[2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div style={{ padding: "16px 24px", borderTop: "1px solid #E2E8F0", display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={onClose} style={{ padding: "10px 20px", border: "1px solid #E2E8F0", borderRadius: 8, background: "#FFF", fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600, color: "#64748B", cursor: "pointer" }}>Cancel</button>
          <button onClick={handleSave} disabled={saving}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 20px", border: "none", borderRadius: 8, background: "#7C3AED", color: "#FFF", fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
            {saving ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Plus size={14} />}
            Create Timetable
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function TimetablePage() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [timetables, setTimetables] = useState([]);
  const [selTimetableId, setSelTimetableId] = useState(null);
  const [timetableDetail, setTimetableDetail] = useState(null);
  const [timetableConfig, setTimetableConfig] = useState(null);

  const [teachers, setTeachers] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [subjects, setSubjects] = useState([]);

  const [viewMode, setViewMode] = useState("grid");
  const [selDay, setSelDay] = useState(null);
  const [showNewTimetable, setShowNewTimetable] = useState(false);
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [showConfigModal, setShowConfigModal] = useState(false);

  // Get current days and periods based on config
  const cycleType = timetableConfig?.cycle_type || "week";
  const daysCount = timetableConfig?.days_count || 5;
  const periods = timetableConfig?.periods || DEFAULT_PERIODS;
  const activeDays = cycleType === "cycle"
    ? CYCLE_DAYS.slice(0, daysCount)
    : WEEK_DAYS.slice(0, daysCount);

  // ── Load data on mount ──
  useEffect(() => {
    loadInitialData();
  }, []);

  // ── Load timetable detail when selection changes ──
  useEffect(() => {
    if (selTimetableId) {
      loadTimetableDetail(selTimetableId);
      loadTimetableConfig(selTimetableId);
    }
  }, [selTimetableId]);

  // ── Set default selected day when config loads ──
  useEffect(() => {
    if (activeDays.length > 0 && !selDay) {
      setSelDay(activeDays[0].id);
    }
  }, [activeDays, selDay]);

  async function loadInitialData() {
    setLoading(true);
    setError(null);
    try {
      const [ttRes, teacherRes, classRes, subRes] = await Promise.all([
        getTimetables(),
        getTeachers(),
        getClassrooms(),
        getSubjects(),
      ]);

      setTimetables(ttRes.data || []);
      setTeachers(teacherRes.data || []);
      setClassrooms(classRes.data || []);
      setSubjects(subRes.data || []);

      // Select first timetable by default (prefer active)
      const active = (ttRes.data || []).find((t) => t.status === "active");
      const first = active || (ttRes.data || [])[0];
      if (first) {
        setSelTimetableId(first.id);
      }
    } catch (err) {
      console.error("Failed to load data:", err);
      setError("Failed to load timetable data. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function loadTimetableDetail(id) {
    try {
      const res = await getTimetableDetail(id);
      setTimetableDetail(res.data);
    } catch (err) {
      console.error("Failed to load timetable detail:", err);
    }
  }

  async function loadTimetableConfig(id) {
    try {
      const res = await getTimetableConfig(id);
      setTimetableConfig(res.data);
      // Update selected day if current selection is invalid
      const cfg = res.data;
      const days = cfg?.cycle_type === "cycle"
        ? CYCLE_DAYS.slice(0, cfg?.days_count || 6)
        : WEEK_DAYS.slice(0, cfg?.days_count || 5);
      if (days.length > 0 && !days.find(d => d.id === selDay)) {
        setSelDay(days[0].id);
      }
    } catch (err) {
      console.error("Failed to load timetable config:", err);
      // Use defaults if config doesn't exist
      setTimetableConfig({ cycle_type: "week", days_count: 5, periods: DEFAULT_PERIODS });
    }
  }

  const slots = timetableDetail?.slots || [];
  const conflicts = detectConflicts(slots);

  // ── Create timetable ──
  async function handleCreateTimetable(data) {
    setSaving(true);
    try {
      const res = await createTimetable(data);
      setTimetables((prev) => [...prev, res.data]);
      setSelTimetableId(res.data.id);
      setShowNewTimetable(false);
    } catch (err) {
      console.error("Failed to create timetable:", err);
      alert(err.response?.data?.error || "Failed to create timetable");
    } finally {
      setSaving(false);
    }
  }

  // ── Save config ──
  async function handleSaveConfig(configData) {
    setSaving(true);
    try {
      await updateTimetableConfig(selTimetableId, configData);
      setTimetableConfig(configData);
      setShowConfigModal(false);
      // Update selected day if needed
      const days = configData.cycle_type === "cycle"
        ? CYCLE_DAYS.slice(0, configData.days_count)
        : WEEK_DAYS.slice(0, configData.days_count);
      if (!days.find(d => d.id === selDay)) {
        setSelDay(days[0]?.id);
      }
    } catch (err) {
      console.error("Failed to save config:", err);
      alert(err.response?.data?.error || "Failed to save configuration");
    } finally {
      setSaving(false);
    }
  }

  // ── Activate timetable ──
  async function handleActivate() {
    setSaving(true);
    try {
      await updateTimetableStatus(selTimetableId, "active");
      setTimetables((prev) => prev.map((tt) => ({
        ...tt,
        status: tt.id === selTimetableId ? "active" : (tt.status === "active" ? "archived" : tt.status),
      })));
      setTimetableDetail((prev) => prev ? { ...prev, status: "active" } : prev);
    } catch (err) {
      console.error("Failed to activate timetable:", err);
      alert(err.response?.data?.error || "Failed to activate timetable");
    } finally {
      setSaving(false);
    }
  }

  // ── Save slot (create or update) ──
  async function handleSlotSave(slotData) {
    setSaving(true);
    try {
      if (slotData.id) {
        await updateTimetableSlot(selTimetableId, slotData.id, slotData);
      } else {
        await createTimetableSlot(selTimetableId, slotData);
      }
      await loadTimetableDetail(selTimetableId);
      setShowSlotModal(false);
      setEditingSlot(null);
    } catch (err) {
      console.error("Failed to save slot:", err);
      alert(err.response?.data?.error || "Failed to save slot");
    } finally {
      setSaving(false);
    }
  }

  // ── Delete slot ──
  async function handleDeleteSlot(slotId) {
    if (!window.confirm("Delete this slot?")) return;
    try {
      await deleteTimetableSlot(selTimetableId, slotId);
      await loadTimetableDetail(selTimetableId);
    } catch (err) {
      console.error("Failed to delete slot:", err);
      alert(err.response?.data?.error || "Failed to delete slot");
    }
  }

  function getDayLabel(dayId) {
    return [...WEEK_DAYS, ...CYCLE_DAYS].find(d => d.id === dayId)?.label || dayId;
  }

  // ── Grid view ──
  function renderGrid() {
    const daySlots = slots.filter((s) => s.day === selDay);
    const isAdmin = ["admin", "deputy", "principal"].includes(user?.role);

    return (
      <div>
        <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "#F8FAFC", padding: 4, borderRadius: 12, border: "1px solid #E2E8F0" }}>
          {activeDays.map((d) => {
            const cnt = slots.filter((s) => s.day === d.id).length;
            const active = selDay === d.id;
            return (
              <button key={d.id} onClick={() => setSelDay(d.id)}
                style={{ flex: 1, padding: "10px 8px", border: "none", borderRadius: 10, cursor: "pointer", background: active ? "#FFF" : "transparent", boxShadow: active ? "0 1px 4px rgba(0,0,0,0.08)" : "none", fontFamily: "var(--font-body)", transition: "all 0.15s" }}>
                <div style={{ fontSize: 13, fontWeight: active ? 700 : 500, color: active ? "#7C3AED" : "#64748B" }}>{d.label}</div>
                <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>{cnt} slot{cnt !== 1 ? "s" : ""}</div>
              </button>
            );
          })}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {periods.map((pt) => {
            const periodSlots = daySlots.filter((s) => s.period === pt.period);
            return (
              <div key={pt.period} style={{ display: "grid", gridTemplateColumns: "80px 1fr", gap: 12, alignItems: "flex-start" }}>
                <div style={{ paddingTop: 12, textAlign: "right" }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#7C3AED" }}>P{pt.period}</div>
                  <div style={{ fontSize: 11, color: "#94A3B8" }}>{pt.start_time}</div>
                  <div style={{ fontSize: 11, color: "#94A3B8" }}>{pt.end_time}</div>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", minHeight: 64 }}>
                  {periodSlots.length === 0 ? (
                    isAdmin ? (
                      <div style={{ flex: 1, height: 56, border: "2px dashed #E2E8F0", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#94A3B8", fontSize: 13 }}
                        onClick={() => { setEditingSlot(null); setShowSlotModal(true); }}>
                        <Plus size={14} style={{ marginRight: 4 }} /> Add slot
                      </div>
                    ) : (
                      <div style={{ flex: 1, height: 56, background: "#F8FAFC", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", color: "#CBD5E1", fontSize: 13 }}>
                        No class
                      </div>
                    )
                  ) : (
                    <>
                      {periodSlots.map((slot) => {
                        const color = teacherColor(slot.teacher_id || 1);
                        const hasConflict = conflicts.has(slot.id);
                        return (
                          <div key={slot.id}
                            style={{ padding: "10px 14px", borderRadius: 10, background: hasConflict ? "#FEE2E2" : "#F8FAFC", border: "1.5px solid " + (hasConflict ? "#DC2626" : color + "44"), minWidth: 200, flex: 1, position: "relative" }}>
                            {hasConflict && (
                              <div style={{ position: "absolute", top: 8, right: 8 }}>
                                <AlertTriangle size={14} color="#DC2626" title="Conflict detected" />
                              </div>
                            )}
                            <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 2 }}>{slot.subject_name || slot.subject_code}</div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-navy)" }}>{slot.classroom_name}</div>
                            <div style={{ fontSize: 12, color: "#64748B" }}>{slot.teacher_name || "Unassigned"}</div>
                            {isAdmin && (
                              <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                                <button onClick={() => { setEditingSlot(slot); setShowSlotModal(true); }}
                                  style={{ display: "flex", alignItems: "center", gap: 3, padding: "3px 8px", border: "1px solid #E2E8F0", borderRadius: 5, background: "#FFF", cursor: "pointer", fontSize: 11, fontWeight: 600, color: "#64748B", fontFamily: "var(--font-body)" }}>
                                  <Edit3 size={10} /> Edit
                                </button>
                                <button onClick={() => handleDeleteSlot(slot.id)}
                                  style={{ display: "flex", alignItems: "center", gap: 3, padding: "3px 8px", border: "1px solid #FECACA", borderRadius: 5, background: "#FFF", cursor: "pointer", fontSize: 11, fontWeight: 600, color: "#DC2626", fontFamily: "var(--font-body)" }}>
                                  <Trash2 size={10} /> Del
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {isAdmin && (
                        <button onClick={() => { setEditingSlot(null); setShowSlotModal(true); }}
                          style={{ width: 40, height: 40, border: "2px dashed #E2E8F0", borderRadius: 10, background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#94A3B8", flexShrink: 0 }}>
                          <Plus size={16} />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Teacher view ──
  function renderTeacherView() {
    const teachersWithSlots = teachers.filter((t) => slots.some((s) => s.teacher_id === t.id));

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {teachersWithSlots.map((teacher) => {
          const teacherSlots = slots.filter((s) => s.teacher_id === teacher.id);
          const color = teacherColor(teacher.id);
          const slotsByDay = {};
          activeDays.forEach((d) => { slotsByDay[d.id] = teacherSlots.filter((s) => s.day === d.id).sort((a, b) => a.period - b.period); });

          return (
            <div key={teacher.id} style={{ background: "#FFF", border: "1px solid #E2E8F0", borderRadius: 12, overflow: "hidden" }}>
              <div style={{ padding: "12px 18px", background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: color + "22", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Users size={16} color={color} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "var(--color-navy)" }}>{teacher.name}</div>
                  <div style={{ fontSize: 12, color: "#94A3B8" }}>{teacher.subjects?.join(", ") || teacher.role} · {teacherSlots.length} period{teacherSlots.length !== 1 ? "s" : ""}/cycle</div>
                </div>
              </div>
              <div style={{ padding: "12px 18px", display: "flex", gap: 16, flexWrap: "wrap" }}>
                {activeDays.map((d) => {
                  const ds = slotsByDay[d.id];
                  if (!ds || ds.length === 0) return null;
                  return (
                    <div key={d.id}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{d.label}</div>
                      {ds.map((slot) => {
                        const hasConflict = conflicts.has(slot.id);
                        return (
                          <div key={slot.id} style={{ padding: "6px 10px", borderRadius: 8, background: hasConflict ? "#FEE2E2" : color + "11", border: "1px solid " + (hasConflict ? "#DC2626" : color + "33"), marginBottom: 4, minWidth: 120 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color }}>P{slot.period} · {slot.classroom_name}</div>
                            <div style={{ fontSize: 11, color: "#64748B" }}>{slot.subject_name} · {slot.start_time}</div>
                            {hasConflict && <div style={{ fontSize: 10, color: "#DC2626", fontWeight: 600 }}>Conflict</div>}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        {teachersWithSlots.length === 0 && (
          <div style={{ padding: 40, textAlign: "center", color: "#94A3B8" }}>No teachers assigned to this timetable yet</div>
        )}
      </div>
    );
  }

  // ── Loading state ──
  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", flexDirection: "column", gap: 12 }}>
        <Loader2 size={32} color="#7C3AED" style={{ animation: "spin 1s linear infinite" }} />
        <span style={{ color: "#64748B" }}>Loading timetable...</span>
      </div>
    );
  }

  // ── Error state ──
  if (error) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", flexDirection: "column", gap: 12 }}>
        <AlertCircle size={32} color="#DC2626" />
        <span style={{ color: "#DC2626" }}>{error}</span>
        <button onClick={loadInitialData} style={{ padding: "8px 16px", background: "#7C3AED", color: "#FFF", border: "none", borderRadius: 6, cursor: "pointer" }}>Retry</button>
      </div>
    );
  }

  const isAdmin = ["admin", "deputy", "principal"].includes(user?.role);

  return (
    <div style={{ padding: 24, maxWidth: 1200 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 10, background: "#EDE9FE", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Calendar size={22} color="#7C3AED" />
          </div>
          <div>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 600 }}>Timetable Manager</h1>
            <p style={{ fontSize: 14, color: "var(--color-slate)" }}>
              {cycleType === "cycle" ? `${daysCount}-day cycle` : `${daysCount}-day week`} · {periods.length} periods
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {conflicts.size > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "#FEE2E2", borderRadius: 8, color: "#DC2626", fontSize: 13, fontWeight: 600 }}>
              <AlertTriangle size={15} /> {Math.floor(conflicts.size / 2)} conflict{Math.floor(conflicts.size / 2) !== 1 ? "s" : ""}
            </div>
          )}
          {isAdmin && (
            <button onClick={() => setShowNewTimetable(true)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 18px", border: "none", borderRadius: 8, background: "#7C3AED", color: "#FFF", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "var(--font-body)" }}>
              <Plus size={15} /> New Timetable
            </button>
          )}
        </div>
      </div>

      {/* Timetable selector */}
      {timetables.length > 0 && (
        <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {timetables.map((tt) => (
              <button key={tt.id} onClick={() => setSelTimetableId(tt.id)}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 16px", border: "2px solid " + (selTimetableId === tt.id ? "#7C3AED" : "#E2E8F0"), borderRadius: 10, cursor: "pointer", background: selTimetableId === tt.id ? "#EDE9FE" : "#FFF", fontFamily: "var(--font-body)", fontSize: 13, fontWeight: selTimetableId === tt.id ? 700 : 400, color: selTimetableId === tt.id ? "#7C3AED" : "#64748B", transition: "all 0.15s" }}>
                <Calendar size={14} />
                {tt.name}
                <span style={{ padding: "2px 8px", borderRadius: 99, fontSize: 11, fontWeight: 600, background: tt.status === "active" ? "#D1FAE5" : tt.status === "draft" ? "#F1F5F9" : "#FEF3C7", color: tt.status === "active" ? "#059669" : tt.status === "draft" ? "#64748B" : "#D97706" }}>
                  {tt.status.charAt(0).toUpperCase() + tt.status.slice(1)}
                </span>
              </button>
            ))}
          </div>

          <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
            {isAdmin && (
              <button onClick={() => setShowConfigModal(true)}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", border: "1.5px solid #E2E8F0", borderRadius: 8, background: "#FFF", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#64748B", fontFamily: "var(--font-body)" }}>
                <Settings size={14} /> Configure
              </button>
            )}

            <div style={{ display: "flex", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, overflow: "hidden" }}>
              {[{ k: "grid", lb: "Grid" }, { k: "teacher", lb: "By Teacher" }].map((v) => (
                <button key={v.k} onClick={() => setViewMode(v.k)}
                  style={{ padding: "8px 14px", border: "none", borderRight: v.k === "grid" ? "1px solid #E2E8F0" : "none", cursor: "pointer", background: viewMode === v.k ? "#FFF" : "transparent", color: viewMode === v.k ? "#7C3AED" : "#64748B", fontFamily: "var(--font-body)", fontSize: 13, fontWeight: viewMode === v.k ? 600 : 400, transition: "all 0.15s" }}>
                  {v.lb}
                </button>
              ))}
            </div>

            {isAdmin && (
              <button onClick={() => { setEditingSlot(null); setShowSlotModal(true); }}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", border: "1.5px solid #E2E8F0", borderRadius: 8, background: "#FFF", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#64748B", fontFamily: "var(--font-body)" }}>
                <Plus size={14} /> Add Slot
              </button>
            )}

            {isAdmin && timetableDetail?.status !== "active" && (
              <button onClick={handleActivate} disabled={saving}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", border: "none", borderRadius: 8, background: "#059669", color: "#FFF", cursor: saving ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 600, fontFamily: "var(--font-body)", opacity: saving ? 0.7 : 1 }}>
                {saving ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <CheckCircle2 size={14} />}
                {saving ? "Activating..." : "Activate"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Stats */}
      {timetableDetail && (
        <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
          {[
            { lb: "Total Slots", val: timetableDetail.stats?.total_slots || slots.length, icon: Clock, c: "#7C3AED" },
            { lb: "Teachers", val: timetableDetail.stats?.teachers || new Set(slots.map((s) => s.teacher_id)).size, icon: Users, c: "#0891B2" },
            { lb: "Classes", val: timetableDetail.stats?.classrooms || new Set(slots.map((s) => s.classroom_id)).size, icon: GraduationCap, c: "#059669" },
            { lb: "Conflicts", val: Math.floor(conflicts.size / 2), icon: AlertTriangle, c: conflicts.size > 0 ? "#DC2626" : "#059669" },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} style={{ flex: 1, padding: "14px 16px", background: "#FFF", border: "1px solid #E2E8F0", borderRadius: 10, display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: s.c + "15", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon size={18} color={s.c} />
                </div>
                <div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700, color: s.c }}>{s.val}</div>
                  <div style={{ fontSize: 11, color: "#94A3B8" }}>{s.lb}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Content */}
      {timetables.length === 0 ? (
        <div style={{ padding: 60, textAlign: "center", background: "#F8FAFC", borderRadius: 12, border: "2px dashed #E2E8F0" }}>
          <Calendar size={48} color="#CBD5E1" style={{ marginBottom: 16 }} />
          <h3 style={{ color: "#64748B", fontWeight: 600, marginBottom: 8 }}>No Timetables Yet</h3>
          <p style={{ color: "#94A3B8", marginBottom: 16 }}>Create your first timetable to get started</p>
          {isAdmin && (
            <button onClick={() => setShowNewTimetable(true)}
              style={{ padding: "10px 20px", background: "#7C3AED", color: "#FFF", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}>
              <Plus size={14} style={{ marginRight: 6, verticalAlign: "middle" }} /> Create Timetable
            </button>
          )}
        </div>
      ) : (
        <>
          {viewMode === "grid" && renderGrid()}
          {viewMode === "teacher" && renderTeacherView()}
        </>
      )}

      {/* Modals */}
      {showNewTimetable && (
        <NewTimetableModal
          onClose={() => setShowNewTimetable(false)}
          onSave={handleCreateTimetable}
          saving={saving}
        />
      )}

      {showSlotModal && (
        <SlotModal
          slot={editingSlot}
          onClose={() => { setShowSlotModal(false); setEditingSlot(null); }}
          onSave={handleSlotSave}
          existingSlots={slots}
          teachers={teachers}
          classrooms={classrooms}
          subjects={subjects}
          config={timetableConfig}
          saving={saving}
        />
      )}

      {showConfigModal && (
        <ConfigModal
          config={timetableConfig}
          onClose={() => setShowConfigModal(false)}
          onSave={handleSaveConfig}
          saving={saving}
        />
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
      `}</style>
    </div>
  );
}

// ─── STYLE HELPERS ────────────────────────────────────────────────────────────

const lbl = { fontSize: 12, fontWeight: 600, color: "#64748B", display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" };
