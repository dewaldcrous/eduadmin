import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  Calendar, Plus, X, Check, ChevronDown, Edit3, Trash2,
  AlertCircle, Save, Loader2, Users, BookOpen, Clock,
  GraduationCap, CheckCircle2, AlertTriangle,
} from "lucide-react";

// ─── STATIC DATA ─────────────────────────────────────────────────────────────

const TEACHERS = [
  { id: 1, name: "S. Williams",  username: "t.williams",  subjects: ["MATH"] },
  { id: 2, name: "T. Jordaan",   username: "t.jordaan",   subjects: ["ENG"]  },
  { id: 3, name: "R. Erasmus",   username: "t.erasmus",   subjects: ["PHYS"] },
  { id: 4, name: "L. Mabaso",    username: "t.mabaso",    subjects: ["LIFE"] },
  { id: 5, name: "G. Venter",    username: "t.venter",    subjects: ["GEO"]  },
  { id: 6, name: "D. Mahlangu",  username: "t.mahlangu",  subjects: ["HIST"] },
  { id: 7, name: "B. Cloete",    username: "t.cloete",    subjects: ["LO"]   },
  { id: 8, name: "A. Patel",     username: "t.patel",     subjects: ["ACC"]  },
  { id: 9, name: "N. Govender",  username: "t.govender",  subjects: ["CAT"]  },
  { id: 10,name: "Z. Khoza",     username: "t.khoza",     subjects: ["EMS"]  },
];

const SUBJECTS = [
  { id: "MATH", name: "Mathematics" },
  { id: "ENG",  name: "English" },
  { id: "PHYS", name: "Physical Sciences" },
  { id: "LIFE", name: "Life Sciences" },
  { id: "GEO",  name: "Geography" },
  { id: "HIST", name: "History" },
  { id: "ACC",  name: "Accounting" },
  { id: "LO",   name: "Life Orientation" },
  { id: "CAT",  name: "Computer Applications" },
  { id: "EMS",  name: "Economic & Management Sciences" },
];

const CLASSROOMS = [
  { id: 1, name: "10A", grade: "Grade 10" },
  { id: 2, name: "10B", grade: "Grade 10" },
  { id: 3, name: "10C", grade: "Grade 10" },
  { id: 4, name: "11A", grade: "Grade 11" },
  { id: 5, name: "11B", grade: "Grade 11" },
  { id: 6, name: "12A", grade: "Grade 12" },
];

const DAYS = ["MON","TUE","WED","THU","FRI"];
const DAY_LABELS = { MON:"Monday",TUE:"Tuesday",WED:"Wednesday",THU:"Thursday",FRI:"Friday" };

const PERIOD_TIMES = [
  { p: 1, start: "07:45", end: "08:30" },
  { p: 2, start: "08:30", end: "09:15" },
  { p: 3, start: "09:15", end: "10:00" },
  { p: 4, start: "10:20", end: "11:05" },
  { p: 5, start: "11:05", end: "11:50" },
  { p: 6, start: "11:50", end: "12:35" },
  { p: 7, start: "13:00", end: "13:45" },
];

// Pre-seeded timetable
const INIT_TIMETABLES = [
  {
    id: 1,
    name: "Term 1 2026",
    term: 1,
    year: 2026,
    status: "active",
    slots: [
      { id: 1,  day:"MON", period:1, teacherId:1, classroomId:1, subjectId:"MATH" },
      { id: 2,  day:"MON", period:2, teacherId:1, classroomId:2, subjectId:"MATH" },
      { id: 3,  day:"MON", period:4, teacherId:2, classroomId:1, subjectId:"ENG"  },
      { id: 4,  day:"TUE", period:1, teacherId:1, classroomId:1, subjectId:"MATH" },
      { id: 5,  day:"TUE", period:3, teacherId:3, classroomId:1, subjectId:"PHYS" },
      { id: 6,  day:"WED", period:2, teacherId:1, classroomId:2, subjectId:"MATH" },
      { id: 7,  day:"WED", period:4, teacherId:1, classroomId:4, subjectId:"MATH" },
      { id: 8,  day:"THU", period:1, teacherId:1, classroomId:1, subjectId:"MATH" },
      { id: 9,  day:"FRI", period:2, teacherId:1, classroomId:2, subjectId:"MATH" },
      { id: 10, day:"FRI", period:7, teacherId:1, classroomId:6, subjectId:"MATH" },
    ],
  },
];

const TEACHER_COLORS = [
  "#7C3AED","#0891B2","#059669","#D97706","#DC2626",
  "#7C3AED","#0284C7","#16A34A","#CA8A04","#B91C1C",
];

let nextSlotId = 200;
let nextTimetableId = 10;

function teacherColor(teacherId) { return TEACHER_COLORS[(teacherId - 1) % TEACHER_COLORS.length]; }

const EMPTY_SLOT_FORM = { day: "MON", period: 1, teacherId: "", classroomId: "", subjectId: "" };

// ─── CONFLICT DETECTION ───────────────────────────────────────────────────────

function detectConflicts(slots) {
  const conflicts = new Set();
  for (let i = 0; i < slots.length; i++) {
    for (let j = i + 1; j < slots.length; j++) {
      const a = slots[i]; const b = slots[j];
      if (a.day !== b.day || a.period !== b.period) continue;
      // Same teacher double-booked
      if (a.teacherId === b.teacherId) { conflicts.add(a.id); conflicts.add(b.id); }
      // Same classroom double-booked
      if (a.classroomId === b.classroomId) { conflicts.add(a.id); conflicts.add(b.id); }
    }
  }
  return conflicts;
}

// ─── SLOT MODAL ───────────────────────────────────────────────────────────────

function SlotModal({ slot, onClose, onSave, existingSlots, timetableId }) {
  const [form, setForm] = useState(slot ? {
    day: slot.day, period: slot.period,
    teacherId: slot.teacherId, classroomId: slot.classroomId, subjectId: slot.subjectId,
  } : { ...EMPTY_SLOT_FORM });
  const [error, setError] = useState("");

  function validate() {
    if (!form.teacherId) return "Please select a teacher.";
    if (!form.classroomId) return "Please select a classroom.";
    if (!form.subjectId) return "Please select a subject.";
    // Check conflicts
    const others = existingSlots.filter((s) => !slot || s.id !== slot.id);
    const teacherConflict = others.find((s) => s.day === form.day && s.period === form.period && s.teacherId === Number(form.teacherId));
    if (teacherConflict) return `${TEACHERS.find((t) => t.id === Number(form.teacherId))?.name} already has a slot on ${DAY_LABELS[form.day]} P${form.period}.`;
    const classConflict = others.find((s) => s.day === form.day && s.period === form.period && s.classroomId === Number(form.classroomId));
    if (classConflict) return `${CLASSROOMS.find((c) => c.id === Number(form.classroomId))?.name} already has a slot on ${DAY_LABELS[form.day]} P${form.period}.`;
    return null;
  }

  function handleSave() {
    const err = validate();
    if (err) { setError(err); return; }
    onSave({
      id: slot ? slot.id : ++nextSlotId,
      day: form.day,
      period: Number(form.period),
      teacherId: Number(form.teacherId),
      classroomId: Number(form.classroomId),
      subjectId: form.subjectId,
    });
    onClose();
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={onClose}>
      <div style={{ width: 480, background: "#FFF", borderRadius: 16, overflow: "hidden", boxShadow: "0 24px 64px rgba(0,0,0,0.15)" }}
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
          {/* Day + Period row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#64748B", display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>Day</label>
              <select value={form.day} onChange={(e) => { setForm({ ...form, day: e.target.value }); setError(""); }}
                style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #E2E8F0", borderRadius: 8, fontFamily: "var(--font-body)", fontSize: 14, color: "var(--color-navy)", cursor: "pointer" }}>
                {DAYS.map((d) => <option key={d} value={d}>{DAY_LABELS[d]}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#64748B", display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>Period</label>
              <select value={form.period} onChange={(e) => { setForm({ ...form, period: Number(e.target.value) }); setError(""); }}
                style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #E2E8F0", borderRadius: 8, fontFamily: "var(--font-body)", fontSize: 14, color: "var(--color-navy)", cursor: "pointer" }}>
                {PERIOD_TIMES.map((pt) => <option key={pt.p} value={pt.p}>P{pt.p} ({pt.start}–{pt.end})</option>)}
              </select>
            </div>
          </div>

          {/* Teacher */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#64748B", display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>Teacher *</label>
            <select value={form.teacherId} onChange={(e) => { setForm({ ...form, teacherId: e.target.value }); setError(""); }}
              style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #E2E8F0", borderRadius: 8, fontFamily: "var(--font-body)", fontSize: 14, color: "var(--color-navy)", cursor: "pointer" }}>
              <option value="">— Select teacher —</option>
              {TEACHERS.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.subjects.join(", ")})</option>)}
            </select>
          </div>

          {/* Classroom */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#64748B", display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>Classroom *</label>
            <select value={form.classroomId} onChange={(e) => { setForm({ ...form, classroomId: e.target.value }); setError(""); }}
              style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #E2E8F0", borderRadius: 8, fontFamily: "var(--font-body)", fontSize: 14, color: "var(--color-navy)", cursor: "pointer" }}>
              <option value="">— Select class —</option>
              {CLASSROOMS.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.grade})</option>)}
            </select>
          </div>

          {/* Subject */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#64748B", display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>Subject *</label>
            <select value={form.subjectId} onChange={(e) => { setForm({ ...form, subjectId: e.target.value }); setError(""); }}
              style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #E2E8F0", borderRadius: 8, fontFamily: "var(--font-body)", fontSize: 14, color: "var(--color-navy)", cursor: "pointer" }}>
              <option value="">— Select subject —</option>
              {SUBJECTS.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>

        <div style={{ padding: "16px 24px", borderTop: "1px solid #E2E8F0", display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={onClose} style={{ padding: "10px 20px", border: "1px solid #E2E8F0", borderRadius: 8, background: "#FFF", fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600, color: "#64748B", cursor: "pointer" }}>Cancel</button>
          <button onClick={handleSave} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 20px", border: "none", borderRadius: 8, background: "#7C3AED", color: "#FFF", fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            <Save size={14} /> {slot ? "Update Slot" : "Add Slot"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── NEW TIMETABLE MODAL ──────────────────────────────────────────────────────

function NewTimetableModal({ onClose, onSave }) {
  const [form, setForm] = useState({ name: "", term: "1", year: "2026" });
  const [error, setError] = useState("");

  function handleSave() {
    if (!form.name.trim()) { setError("Name is required."); return; }
    onSave({ id: ++nextTimetableId, name: form.name.trim(), term: Number(form.term), year: Number(form.year), status: "draft", slots: [] });
    onClose();
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
            <label style={{ fontSize: 12, fontWeight: 600, color: "#64748B", display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>Timetable Name *</label>
            <input type="text" value={form.name} onChange={(e) => { setForm({ ...form, name: e.target.value }); setError(""); }}
              placeholder="e.g. Term 2 2026"
              style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #E2E8F0", borderRadius: 8, fontFamily: "var(--font-body)", fontSize: 14, color: "var(--color-navy)", outline: "none", boxSizing: "border-box" }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#64748B", display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>Term</label>
              <select value={form.term} onChange={(e) => setForm({ ...form, term: e.target.value })}
                style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #E2E8F0", borderRadius: 8, fontFamily: "var(--font-body)", fontSize: 14, cursor: "pointer" }}>
                {[1,2,3,4].map((t) => <option key={t} value={t}>Term {t}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#64748B", display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>Year</label>
              <select value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })}
                style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #E2E8F0", borderRadius: 8, fontFamily: "var(--font-body)", fontSize: 14, cursor: "pointer" }}>
                {[2025,2026,2027].map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div style={{ padding: "16px 24px", borderTop: "1px solid #E2E8F0", display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={onClose} style={{ padding: "10px 20px", border: "1px solid #E2E8F0", borderRadius: 8, background: "#FFF", fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600, color: "#64748B", cursor: "pointer" }}>Cancel</button>
          <button onClick={handleSave} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 20px", border: "none", borderRadius: 8, background: "#7C3AED", color: "#FFF", fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            <Plus size={14} /> Create Timetable
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function TimetablePage() {
  const { user } = useAuth();

  const [timetables, setTimetables] = useState(INIT_TIMETABLES);
  const [selTimetableId, setSelTimetableId] = useState(1);
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "teacher" | "list"
  const [selDay, setSelDay] = useState("MON");
  const [showNewTimetable, setShowNewTimetable] = useState(false);
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [activating, setActivating] = useState(false);

  const timetable = timetables.find((t) => t.id === selTimetableId);
  const slots = timetable?.slots || [];
  const conflicts = detectConflicts(slots);

  // ── Helpers ──
  function getTeacher(id) { return TEACHERS.find((t) => t.id === id); }
  function getClassroom(id) { return CLASSROOMS.find((c) => c.id === id); }
  function getSubject(id) { return SUBJECTS.find((s) => s.id === id); }
  function getPeriodTime(p) { return PERIOD_TIMES.find((pt) => pt.p === p); }

  // ── Add/update slot ──
  function handleSlotSave(newSlot) {
    setTimetables((prev) => prev.map((tt) => {
      if (tt.id !== selTimetableId) return tt;
      const existing = tt.slots.find((s) => s.id === newSlot.id);
      return {
        ...tt,
        slots: existing
          ? tt.slots.map((s) => s.id === newSlot.id ? newSlot : s)
          : [...tt.slots, newSlot],
      };
    }));
  }

  // ── Delete slot ──
  function handleDeleteSlot(slotId) {
    setTimetables((prev) => prev.map((tt) => {
      if (tt.id !== selTimetableId) return tt;
      return { ...tt, slots: tt.slots.filter((s) => s.id !== slotId) };
    }));
  }

  // ── Activate timetable ──
  async function handleActivate() {
    setActivating(true);
    await new Promise((r) => setTimeout(r, 800));
    setTimetables((prev) => prev.map((tt) => ({
      ...tt,
      status: tt.id === selTimetableId ? "active" : (tt.status === "active" ? "archived" : tt.status),
    })));
    setActivating(false);
  }

  // ── Create timetable ──
  function handleNewTimetable(tt) {
    setTimetables((prev) => [...prev, tt]);
    setSelTimetableId(tt.id);
  }

  // ── Grid view: day × period matrix ──
  function renderGrid() {
    const daySlots = slots.filter((s) => s.day === selDay);
    const usedPeriods = [...new Set(daySlots.map((s) => s.period))].sort((a, b) => a - b);
    const allPeriods = PERIOD_TIMES.map((p) => p.p);

    return (
      <div>
        {/* Day tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "#F8FAFC", padding: 4, borderRadius: 12, border: "1px solid #E2E8F0" }}>
          {DAYS.map((d) => {
            const cnt = slots.filter((s) => s.day === d).length;
            const active = selDay === d;
            return (
              <button key={d} onClick={() => setSelDay(d)}
                style={{ flex: 1, padding: "10px 8px", border: "none", borderRadius: 10, cursor: "pointer", background: active ? "#FFF" : "transparent", boxShadow: active ? "0 1px 4px rgba(0,0,0,0.08)" : "none", fontFamily: "var(--font-body)", transition: "all 0.15s" }}>
                <div style={{ fontSize: 13, fontWeight: active ? 700 : 500, color: active ? "#7C3AED" : "#64748B" }}>{DAY_LABELS[d]}</div>
                <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>{cnt} slot{cnt !== 1 ? "s" : ""}</div>
              </button>
            );
          })}
        </div>

        {/* Period rows */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {allPeriods.map((p) => {
            const pt = getPeriodTime(p);
            const periodSlots = daySlots.filter((s) => s.period === p);
            return (
              <div key={p} style={{ display: "grid", gridTemplateColumns: "80px 1fr", gap: 12, alignItems: "flex-start" }}>
                <div style={{ paddingTop: 12, textAlign: "right" }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#7C3AED" }}>P{p}</div>
                  <div style={{ fontSize: 11, color: "#94A3B8" }}>{pt?.start}</div>
                  <div style={{ fontSize: 11, color: "#94A3B8" }}>{pt?.end}</div>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", minHeight: 64 }}>
                  {periodSlots.length === 0 ? (
                    <div style={{ flex: 1, height: 56, border: "2px dashed #E2E8F0", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#94A3B8", fontSize: 13 }}
                      onClick={() => { setEditingSlot(null); setShowSlotModal(true); }}>
                      <Plus size={14} style={{ marginRight: 4 }} /> Add slot
                    </div>
                  ) : (
                    <>
                      {periodSlots.map((slot) => {
                        const teacher = getTeacher(slot.teacherId);
                        const classroom = getClassroom(slot.classroomId);
                        const subject = getSubject(slot.subjectId);
                        const color = teacherColor(slot.teacherId);
                        const hasConflict = conflicts.has(slot.id);
                        return (
                          <div key={slot.id}
                            style={{ padding: "10px 14px", borderRadius: 10, background: hasConflict ? "#FEE2E2" : "#F8FAFC", border: "1.5px solid " + (hasConflict ? "#DC2626" : color + "44"), minWidth: 200, flex: 1, position: "relative" }}>
                            {hasConflict && (
                              <div style={{ position: "absolute", top: 8, right: 8 }}>
                                <AlertTriangle size={14} color="#DC2626" title="Conflict detected" />
                              </div>
                            )}
                            <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 2 }}>{subject?.name || slot.subjectId}</div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-navy)" }}>{classroom?.name}</div>
                            <div style={{ fontSize: 12, color: "#64748B" }}>{teacher?.name}</div>
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
                          </div>
                        );
                      })}
                      <button onClick={() => { setEditingSlot(null); setShowSlotModal(true); }}
                        style={{ width: 40, height: 40, border: "2px dashed #E2E8F0", borderRadius: 10, background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#94A3B8", flexShrink: 0 }}>
                        <Plus size={16} />
                      </button>
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

  // ── Teacher view: teacher breakdown ──
  function renderTeacherView() {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {TEACHERS.map((teacher) => {
          const teacherSlots = slots.filter((s) => s.teacherId === teacher.id);
          if (teacherSlots.length === 0) return null;
          const color = teacherColor(teacher.id);
          const slotsByDay = {};
          DAYS.forEach((d) => { slotsByDay[d] = teacherSlots.filter((s) => s.day === d).sort((a, b) => a.period - b.period); });

          return (
            <div key={teacher.id} style={{ background: "#FFF", border: "1px solid #E2E8F0", borderRadius: 12, overflow: "hidden" }}>
              <div style={{ padding: "12px 18px", background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: color + "22", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Users size={16} color={color} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "var(--color-navy)" }}>{teacher.name}</div>
                  <div style={{ fontSize: 12, color: "#94A3B8" }}>{teacher.subjects.join(", ")} · {teacherSlots.length} period{teacherSlots.length !== 1 ? "s" : ""}/week</div>
                </div>
              </div>
              <div style={{ padding: "12px 18px", display: "flex", gap: 16, flexWrap: "wrap" }}>
                {DAYS.map((d) => {
                  const ds = slotsByDay[d];
                  if (ds.length === 0) return null;
                  return (
                    <div key={d}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{DAY_LABELS[d]}</div>
                      {ds.map((slot) => {
                        const cls = getClassroom(slot.classroomId);
                        const sub = getSubject(slot.subjectId);
                        const pt = getPeriodTime(slot.period);
                        const hasConflict = conflicts.has(slot.id);
                        return (
                          <div key={slot.id} style={{ padding: "6px 10px", borderRadius: 8, background: hasConflict ? "#FEE2E2" : color + "11", border: "1px solid " + (hasConflict ? "#DC2626" : color + "33"), marginBottom: 4, minWidth: 120 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color }}>P{slot.period} · {cls?.name}</div>
                            <div style={{ fontSize: 11, color: "#64748B" }}>{sub?.name} · {pt?.start}</div>
                            {hasConflict && <div style={{ fontSize: 10, color: "#DC2626", fontWeight: 600 }}>⚠ Conflict</div>}
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
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 1200 }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 10, background: "#EDE9FE", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Calendar size={22} color="#7C3AED" />
          </div>
          <div>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 600 }}>Timetable Manager</h1>
            <p style={{ fontSize: 14, color: "var(--color-slate)" }}>Create and assign teacher timetables</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {conflicts.size > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "#FEE2E2", borderRadius: 8, color: "#DC2626", fontSize: 13, fontWeight: 600 }}>
              <AlertTriangle size={15} /> {Math.floor(conflicts.size / 2)} conflict{Math.floor(conflicts.size / 2) !== 1 ? "s" : ""}
            </div>
          )}
          <button onClick={() => setShowNewTimetable(true)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 18px", border: "none", borderRadius: 8, background: "#7C3AED", color: "#FFF", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "var(--font-body)" }}>
            <Plus size={15} /> New Timetable
          </button>
        </div>
      </div>

      {/* ── Timetable selector ── */}
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
          {/* View mode */}
          <div style={{ display: "flex", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, overflow: "hidden" }}>
            {[{ k: "grid", lb: "Grid" }, { k: "teacher", lb: "By Teacher" }].map((v) => (
              <button key={v.k} onClick={() => setViewMode(v.k)}
                style={{ padding: "8px 14px", border: "none", borderRight: v.k === "grid" ? "1px solid #E2E8F0" : "none", cursor: "pointer", background: viewMode === v.k ? "#FFF" : "transparent", color: viewMode === v.k ? "#7C3AED" : "#64748B", fontFamily: "var(--font-body)", fontSize: 13, fontWeight: viewMode === v.k ? 600 : 400, transition: "all 0.15s" }}>
                {v.lb}
              </button>
            ))}
          </div>

          {/* Add slot button */}
          <button onClick={() => { setEditingSlot(null); setShowSlotModal(true); }}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", border: "1.5px solid #E2E8F0", borderRadius: 8, background: "#FFF", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#64748B", fontFamily: "var(--font-body)" }}>
            <Plus size={14} /> Add Slot
          </button>

          {/* Activate */}
          {timetable?.status !== "active" && (
            <button onClick={handleActivate} disabled={activating}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", border: "none", borderRadius: 8, background: "#059669", color: "#FFF", cursor: activating ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 600, fontFamily: "var(--font-body)", opacity: activating ? 0.7 : 1 }}>
              {activating ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <CheckCircle2 size={14} />}
              {activating ? "Activating…" : "Activate"}
            </button>
          )}
        </div>
      </div>

      {/* ── Timetable stats ── */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        {[
          { lb: "Total Slots",  val: slots.length,      icon: Clock,       c: "#7C3AED" },
          { lb: "Teachers",     val: new Set(slots.map((s) => s.teacherId)).size,  icon: Users,       c: "#0891B2" },
          { lb: "Classes",      val: new Set(slots.map((s) => s.classroomId)).size,icon: GraduationCap,c: "#059669" },
          { lb: "Conflicts",    val: Math.floor(conflicts.size / 2),               icon: AlertTriangle,c: conflicts.size > 0 ? "#DC2626" : "#059669" },
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

      {/* ── Content ── */}
      {viewMode === "grid" && renderGrid()}
      {viewMode === "teacher" && renderTeacherView()}

      {/* ── Modals ── */}
      {showNewTimetable && (
        <NewTimetableModal onClose={() => setShowNewTimetable(false)} onSave={handleNewTimetable} />
      )}

      {showSlotModal && (
        <SlotModal
          slot={editingSlot}
          onClose={() => { setShowSlotModal(false); setEditingSlot(null); }}
          onSave={handleSlotSave}
          existingSlots={slots}
          timetableId={selTimetableId}
        />
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
      `}</style>
    </div>
  );
}
