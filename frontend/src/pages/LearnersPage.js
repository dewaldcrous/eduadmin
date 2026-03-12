import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getLearners, getClassrooms, getGrades,
  createLearner, bulkImportLearners, enrollLearner, unenrollLearner,
} from "../api/client";
import {
  Users, Search, X, ChevronDown, Shield,
  Plus, AlertTriangle, Check, LayoutGrid, List,
  UserPlus, UserMinus, GraduationCap, Upload, Download,
  Loader2,
} from "lucide-react";

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function attColor(r) {
  if (r === null || r === undefined) return { c: "#475569", bg: "#F1F5F9" };
  if (r >= 90) return { c: "#059669", bg: "#D1FAE5" };
  if (r >= 80) return { c: "#D97706", bg: "#FEF3C7" };
  return { c: "#DC2626", bg: "#FEE2E2" };
}

function riskBadge(r) {
  if (!r) return null;
  var m = { high: { c: "#DC2626", bg: "#FEE2E2", lb: "High Risk" }, medium: { c: "#D97706", bg: "#FEF3C7", lb: "Medium Risk" } };
  return m[r] || null;
}

// ─── ADD LEARNER MODAL ────────────────────────────────────────────────────────

function AddLearnerModal({ onClose, onSave, classrooms }) {
  const [form, setForm] = useState({
    first_name: "", last_name: "", home_language: "", classroom_id: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    if (!form.first_name.trim() || !form.last_name.trim()) {
      setError("First and last name are required");
      return;
    }
    setSaving(true);
    try {
      await createLearner(form);
      onSave();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create learner");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", animation: "fadeIn 0.15s" }}
      onClick={onClose}>
      <div style={{ width: 500, background: "#FFF", borderRadius: 16, overflow: "hidden", boxShadow: "0 24px 64px rgba(0,0,0,0.15)" }}
        onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 600 }}>Add New Learner</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8" }}><X size={20} /></button>
        </div>

        {error && (
          <div style={{ padding: "10px 24px", background: "#FEE2E2", color: "#DC2626", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
            <AlertTriangle size={14} /> {error}
          </div>
        )}

        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={lbl}>First Name *</label>
              <input style={inp} value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                placeholder="e.g. Lerato" />
            </div>
            <div>
              <label style={lbl}>Last Name *</label>
              <input style={inp} value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                placeholder="e.g. Mokoena" />
            </div>
          </div>

          <div>
            <label style={lbl}>Home Language</label>
            <input style={inp} value={form.home_language}
              onChange={(e) => setForm({ ...form, home_language: e.target.value })}
              placeholder="e.g. Sesotho, English, isiZulu" />
          </div>

          <div>
            <label style={lbl}>Assign to Class</label>
            <select style={{ ...inp, cursor: "pointer" }} value={form.classroom_id}
              onChange={(e) => setForm({ ...form, classroom_id: e.target.value })}>
              <option value="">- Select Class (optional) -</option>
              {classrooms.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.grade})</option>)}
            </select>
          </div>
        </div>

        <div style={{ padding: "16px 24px", borderTop: "1px solid #E2E8F0", display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={onClose} style={{ padding: "10px 20px", border: "1px solid #E2E8F0", borderRadius: 8, background: "#FFF", fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600, color: "#64748B", cursor: "pointer" }}>Cancel</button>
          <button onClick={handleSave} disabled={saving}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 20px", border: "none", borderRadius: 8, background: "#7C3AED", color: "#FFF", fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
            {saving ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Plus size={14} />}
            {saving ? "Creating..." : "Create Learner"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── BULK IMPORT MODAL ────────────────────────────────────────────────────────

function BulkImportModal({ onClose, onSave }) {
  const fileRef = useRef(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);

  async function handleImport(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setResult(null);
    try {
      const res = await bulkImportLearners(file);
      setResult(res.data);
      if (res.data.created > 0) {
        onSave();
      }
    } catch (err) {
      setResult({ created: 0, skipped: 0, errors: [err.response?.data?.error || "Import failed"] });
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  }

  function downloadTemplate() {
    const csv = "first_name,last_name,language,class\nLerato,Mokoena,Sesotho,10A\nSipho,Dlamini,isiZulu,10A\n";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "learner_import_template.csv";
    a.click();
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", animation: "fadeIn 0.15s" }}
      onClick={onClose}>
      <div style={{ width: 520, background: "#FFF", borderRadius: 16, overflow: "hidden", boxShadow: "0 24px 64px rgba(0,0,0,0.15)" }}
        onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 600 }}>Bulk Import Learners</h3>
            <p style={{ fontSize: 13, color: "#64748B", marginTop: 2 }}>Upload CSV file with learner data</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8" }}><X size={20} /></button>
        </div>

        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          <input type="file" ref={fileRef} accept=".csv" onChange={handleImport} style={{ display: "none" }} />

          <button onClick={() => fileRef.current?.click()} disabled={importing}
            style={{ padding: 32, border: "2px dashed #E2E8F0", borderRadius: 12, background: "#F8FAFC", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            {importing ? (
              <>
                <Loader2 size={32} color="#7C3AED" style={{ animation: "spin 1s linear infinite" }} />
                <span style={{ fontWeight: 600, color: "#7C3AED" }}>Importing...</span>
              </>
            ) : (
              <>
                <Upload size={32} color="#94A3B8" />
                <span style={{ fontWeight: 600, color: "#64748B" }}>Click to upload CSV file</span>
                <span style={{ fontSize: 12, color: "#94A3B8" }}>Columns: first_name, last_name, language, class</span>
              </>
            )}
          </button>

          {result && (
            <div style={{ padding: 16, background: result.created > 0 ? "#D1FAE5" : "#FEE2E2", borderRadius: 10, border: "1px solid " + (result.created > 0 ? "#059669" : "#DC2626") + "33" }}>
              <div style={{ fontWeight: 600, color: result.created > 0 ? "#059669" : "#DC2626", marginBottom: 4 }}>
                {result.created > 0 ? `Successfully imported ${result.created} learners` : "Import failed"}
              </div>
              {result.skipped > 0 && <div style={{ fontSize: 13, color: "#D97706" }}>{result.skipped} rows skipped</div>}
              {result.errors?.length > 0 && (
                <div style={{ marginTop: 8, fontSize: 12, color: "#DC2626" }}>
                  {result.errors.slice(0, 5).map((e, i) => <div key={i}>{e}</div>)}
                </div>
              )}
            </div>
          )}

          <div style={{ borderTop: "1px solid #E2E8F0", paddingTop: 16 }}>
            <button onClick={downloadTemplate}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 16px", border: "1px solid #E2E8F0", borderRadius: 8, background: "#FFF", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600, color: "#64748B" }}>
              <Download size={14} /> Download Template
            </button>
          </div>
        </div>

        <div style={{ padding: "16px 24px", borderTop: "1px solid #E2E8F0", display: "flex", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "10px 20px", border: "1px solid #E2E8F0", borderRadius: 8, background: "#FFF", fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600, color: "#64748B", cursor: "pointer" }}>Close</button>
        </div>
      </div>
    </div>
  );
}

// ─── ENROLL MODAL ─────────────────────────────────────────────────────────────

function EnrollModal({ learner, classrooms, onClose, onSave }) {
  const [selCls, setSelCls] = useState("");
  const [mode, setMode] = useState("move");
  const [saving, setSaving] = useState(false);

  if (!learner) return null;

  const currentClass = typeof learner.classroom === "object" ? learner.classroom?.name : learner.classroom;

  async function handleSave() {
    setSaving(true);
    try {
      if (mode === "remove") {
        await unenrollLearner(learner.id);
      } else if (selCls) {
        await enrollLearner(learner.id, selCls);
      }
      onSave();
      onClose();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to update enrollment");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", animation: "fadeIn 0.15s" }}
      onClick={onClose}>
      <div style={{ width: 500, background: "#FFF", borderRadius: 16, overflow: "hidden", boxShadow: "0 24px 64px rgba(0,0,0,0.15)" }}
        onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "#7C3AED", textTransform: "uppercase", marginBottom: 2 }}>Class Enrollment</div>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 600 }}>
              {learner.first_name} {learner.last_name}
            </h3>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8" }}><X size={20} /></button>
        </div>

        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          {currentClass && (
            <div style={{ padding: "12px 16px", background: "#F8FAFC", borderRadius: 10, border: "1px solid #E2E8F0", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#7C3AED" }} />
              <span style={{ fontSize: 13, color: "#64748B" }}>Currently enrolled in</span>
              <span style={{ fontWeight: 700, fontSize: 14, color: "var(--color-navy)" }}>{currentClass}</span>
            </div>
          )}

          <div style={{ display: "flex", gap: 8 }}>
            {[{ k: "move", lb: "Assign to class", icon: UserPlus }, { k: "remove", lb: "Remove from class", icon: UserMinus }].map((m) => {
              const Icon = m.icon;
              const active = mode === m.k;
              return (
                <button key={m.k} onClick={() => setMode(m.k)}
                  style={{ flex: 1, padding: "10px 12px", border: "2px solid " + (active ? (m.k === "remove" ? "#DC2626" : "#7C3AED") : "#E2E8F0"), borderRadius: 10, cursor: "pointer", background: active ? (m.k === "remove" ? "#FEE2E2" : "#EDE9FE") : "#FFF", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontFamily: "var(--font-body)", fontSize: 13, fontWeight: active ? 600 : 400, color: active ? (m.k === "remove" ? "#DC2626" : "#7C3AED") : "#64748B" }}>
                  <Icon size={15} /> {m.lb}
                </button>
              );
            })}
          </div>

          {mode === "move" && (
            <div>
              <label style={lbl}>Select class</label>
              <select style={{ ...inp, cursor: "pointer" }} value={selCls} onChange={(e) => setSelCls(e.target.value)}>
                <option value="">- Select Class -</option>
                {classrooms.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.grade})</option>)}
              </select>
            </div>
          )}

          {mode === "remove" && (
            <div style={{ padding: 16, background: "#FEF2F2", borderRadius: 10, border: "1px solid #FECACA" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#DC2626", fontWeight: 600, fontSize: 14 }}>
                <AlertTriangle size={16} /> This will unenroll {learner.first_name} from their class
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: "16px 24px", borderTop: "1px solid #E2E8F0", display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={onClose} style={{ padding: "10px 20px", border: "1px solid #E2E8F0", borderRadius: 8, background: "#FFF", fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600, color: "#64748B", cursor: "pointer" }}>Cancel</button>
          <button onClick={handleSave} disabled={saving || (mode === "move" && !selCls)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 20px", border: "none", borderRadius: 8, background: mode === "remove" ? "#DC2626" : "#7C3AED", color: "#FFF", fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: (saving || (mode === "move" && !selCls)) ? 0.6 : 1 }}>
            {saving ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : (mode === "remove" ? <UserMinus size={14} /> : <Check size={14} />)}
            {mode === "remove" ? "Remove" : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function LearnersPage() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [learners, setLearners] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [grades, setGrades] = useState([]);

  const [viewMode, setViewMode] = useState("list");
  const [selClass, setSelClass] = useState("all");
  const [selGrade, setSelGrade] = useState("all");
  const [search, setSearch] = useState("");
  const [showClassDrop, setShowClassDrop] = useState(false);
  const [showGradeDrop, setShowGradeDrop] = useState(false);

  const [selLearner, setSelLearner] = useState(null);
  const [enrollLearnerModal, setEnrollLearnerModal] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [learnersRes, classroomsRes, gradesRes] = await Promise.all([
        getLearners(),
        getClassrooms(),
        getGrades(),
      ]);
      // Handle paginated response (results array) or plain array
      const learnersData = learnersRes.data?.results || learnersRes.data || [];
      const classroomsData = classroomsRes.data?.results || classroomsRes.data || [];
      const gradesData = gradesRes.data?.results || gradesRes.data || [];
      setLearners(Array.isArray(learnersData) ? learnersData : []);
      setClassrooms(Array.isArray(classroomsData) ? classroomsData : []);
      setGrades(Array.isArray(gradesData) ? gradesData : []);
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setLoading(false);
    }
  }

  const filtered = learners.filter((l) => {
    const classroomName = typeof l.classroom === "object" ? l.classroom?.name : l.classroom;
    const gradeName = typeof l.grade === "object" ? l.grade?.name : l.grade;
    if (selClass !== "all" && classroomName !== selClass) return false;
    if (selGrade !== "all" && gradeName !== selGrade) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!`${l.first_name} ${l.last_name}`.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const tot = filtered.length;
  const atRisk = filtered.filter((l) => l.risk_level).length;
  const avgAtt = tot > 0 ? Math.round(filtered.reduce((s, l) => s + (l.attendance_rate || 0), 0) / tot) : 0;

  const isAdmin = ["admin", "deputy", "principal", "hod", "grade_head"].includes(user?.role);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", flexDirection: "column", gap: 12 }}>
        <Loader2 size={32} color="#7C3AED" style={{ animation: "spin 1s linear infinite" }} />
        <span style={{ color: "#64748B" }}>Loading learners...</span>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 1200 }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 10, background: "#EDE9FE", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Users size={22} color="#7C3AED" />
          </div>
          <div>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 600 }}>Learner Management</h1>
            <p style={{ fontSize: 14, color: "var(--color-slate)" }}>View and manage learner profiles</p>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {[
            { lb: "Learners", val: tot, c: "var(--color-navy)" },
            { lb: "Avg Attendance", val: avgAtt + "%", c: attColor(avgAtt).c },
            { lb: "At-Risk", val: atRisk, c: atRisk > 0 ? "#DC2626" : "#059669" },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: "center", padding: "8px 14px", background: "#FFF", border: "1px solid #E2E8F0", borderRadius: 8 }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, color: s.c }}>{s.val}</div>
              <div style={{ fontSize: 10, color: "#94A3B8" }}>{s.lb}</div>
            </div>
          ))}

          {isAdmin && (
            <>
              <button onClick={() => setShowImportModal(true)}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", border: "1px solid #E2E8F0", borderRadius: 8, background: "#FFF", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#64748B", fontFamily: "var(--font-body)" }}>
                <Upload size={14} /> Import
              </button>
              <button onClick={() => setShowAddModal(true)}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", border: "none", borderRadius: 8, background: "#7C3AED", color: "#FFF", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "var(--font-body)" }}>
                <Plus size={14} /> Add Learner
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        {/* Grade filter */}
        <div style={{ position: "relative" }}>
          <button onClick={() => { setShowGradeDrop(!showGradeDrop); setShowClassDrop(false); }}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", background: selGrade !== "all" ? "#EDE9FE" : "#FFF", border: "1.5px solid " + (selGrade !== "all" ? "#7C3AED" : "#E2E8F0"), borderRadius: 8, cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 13, fontWeight: selGrade !== "all" ? 600 : 400, color: selGrade !== "all" ? "#7C3AED" : "#64748B", minWidth: 140 }}>
            <GraduationCap size={14} />
            <span style={{ flex: 1, textAlign: "left" }}>{selGrade === "all" ? "All Grades" : selGrade}</span>
            <ChevronDown size={14} />
          </button>
          {showGradeDrop && (
            <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, minWidth: "100%", background: "#FFF", border: "1.5px solid #E2E8F0", borderRadius: 10, boxShadow: "0 12px 32px rgba(0,0,0,0.1)", zIndex: 50, overflow: "hidden" }}>
              <button onClick={() => { setSelGrade("all"); setShowGradeDrop(false); }}
                style={{ width: "100%", padding: "10px 14px", border: "none", borderBottom: "1px solid #F1F5F9", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 13, textAlign: "left", background: selGrade === "all" ? "#EDE9FE" : "transparent" }}>All Grades</button>
              {grades.map((g) => (
                <button key={g.id} onClick={() => { setSelGrade(g.name); setShowGradeDrop(false); }}
                  style={{ width: "100%", padding: "10px 14px", border: "none", borderBottom: "1px solid #F1F5F9", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 13, textAlign: "left", background: selGrade === g.name ? "#EDE9FE" : "transparent", fontWeight: selGrade === g.name ? 600 : 400 }}>
                  {g.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Class filter */}
        <div style={{ position: "relative" }}>
          <button onClick={() => { setShowClassDrop(!showClassDrop); setShowGradeDrop(false); }}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", background: selClass !== "all" ? "#EDE9FE" : "#FFF", border: "1.5px solid " + (selClass !== "all" ? "#7C3AED" : "#E2E8F0"), borderRadius: 8, cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 13, fontWeight: selClass !== "all" ? 600 : 400, color: selClass !== "all" ? "#7C3AED" : "#64748B", minWidth: 140 }}>
            <Users size={14} />
            <span style={{ flex: 1, textAlign: "left" }}>{selClass === "all" ? "All Classes" : selClass}</span>
            <ChevronDown size={14} />
          </button>
          {showClassDrop && (
            <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, minWidth: 180, background: "#FFF", border: "1.5px solid #E2E8F0", borderRadius: 10, boxShadow: "0 12px 32px rgba(0,0,0,0.1)", zIndex: 50, overflow: "hidden", maxHeight: 280, overflowY: "auto" }}>
              <button onClick={() => { setSelClass("all"); setShowClassDrop(false); }}
                style={{ width: "100%", padding: "10px 14px", border: "none", borderBottom: "1px solid #F1F5F9", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 13, textAlign: "left", background: selClass === "all" ? "#EDE9FE" : "transparent" }}>All Classes</button>
              {classrooms.map((c) => (
                <button key={c.id} onClick={() => { setSelClass(c.name); setShowClassDrop(false); }}
                  style={{ width: "100%", padding: "10px 14px", border: "none", borderBottom: "1px solid #F1F5F9", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 13, textAlign: "left", display: "flex", justifyContent: "space-between", background: selClass === c.name ? "#EDE9FE" : "transparent", fontWeight: selClass === c.name ? 600 : 400 }}>
                  <span>{c.name}</span>
                  <span style={{ fontSize: 11, color: "#94A3B8" }}>{c.grade}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Search */}
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Search size={15} color="#94A3B8" style={{ position: "absolute", left: 12, top: 11 }} />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search learners..."
            style={{ width: "100%", padding: "9px 14px 9px 36px", fontSize: 13, fontFamily: "var(--font-body)", border: "1.5px solid #E2E8F0", borderRadius: 8, color: "var(--color-navy)", outline: "none", boxSizing: "border-box" }} />
          {search && <button onClick={() => setSearch("")} style={{ position: "absolute", right: 10, top: 9, background: "none", border: "none", cursor: "pointer", color: "#94A3B8" }}><X size={15} /></button>}
        </div>

        {/* View toggle */}
        <div style={{ display: "flex", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, overflow: "hidden" }}>
          {[{ k: "list", icon: List }, { k: "grid", icon: LayoutGrid }].map((v) => {
            const Icon = v.icon;
            return (
              <button key={v.k} onClick={() => setViewMode(v.k)}
                style={{ padding: "9px 12px", border: "none", cursor: "pointer", background: viewMode === v.k ? "#FFF" : "transparent", color: viewMode === v.k ? "#7C3AED" : "#94A3B8", borderRight: v.k === "list" ? "1px solid #E2E8F0" : "none" }}>
                <Icon size={16} />
              </button>
            );
          })}
        </div>
      </div>

      {/* Learner List */}
      {viewMode === "list" && (
        <div style={{ background: "#FFF", border: "1px solid #E2E8F0", borderRadius: 12, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ background: "#F8FAFC" }}>
                {["#", "Name", "Class", "Grade", "Language", "Attendance", "Status", "Actions"].map((h, i) => (
                  <th key={i} style={{ textAlign: i <= 1 ? "left" : "center", padding: "12px 14px", fontSize: 11, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((l, i) => {
                const ac = attColor(l.attendance_rate);
                const rb = riskBadge(l.risk_level);
                const classroomName = typeof l.classroom === "object" ? l.classroom?.name : l.classroom;
                const gradeName = typeof l.grade === "object" ? l.grade?.name : l.grade;
                return (
                  <tr key={l.id}
                    style={{ borderBottom: "1px solid #F1F5F9", cursor: "pointer" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "#FAFAFA"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                    onClick={() => setSelLearner(l)}>
                    <td style={{ padding: "13px 14px", fontSize: 12, color: "#94A3B8" }}>{i + 1}</td>
                    <td style={{ padding: "13px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: "50%", background: rb ? rb.bg : "#EDE9FE", color: rb ? rb.c : "#7C3AED", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                          {l.first_name?.[0]}{l.last_name?.[0]}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: "var(--color-navy)" }}>{l.first_name} {l.last_name}</div>
                          {l.special_needs && <div style={{ fontSize: 11, color: "#7C3AED", marginTop: 1 }}><Shield size={9} style={{ display: "inline", marginRight: 2 }} />{l.special_needs}</div>}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "13px 14px", textAlign: "center" }}>
                      <span style={{ padding: "3px 10px", background: "#F1F5F9", borderRadius: 99, fontSize: 12, fontWeight: 700, color: "var(--color-navy)" }}>{classroomName || "-"}</span>
                    </td>
                    <td style={{ padding: "13px 14px", textAlign: "center", color: "#64748B", fontSize: 13 }}>{gradeName || "-"}</td>
                    <td style={{ padding: "13px 14px", textAlign: "center", color: "#64748B", fontSize: 13 }}>{l.home_language || "-"}</td>
                    <td style={{ padding: "13px 14px", textAlign: "center" }}>
                      <span style={{ padding: "4px 12px", borderRadius: 99, fontSize: 13, fontWeight: 600, background: ac.bg, color: ac.c }}>{l.attendance_rate != null ? l.attendance_rate + "%" : "-"}</span>
                    </td>
                    <td style={{ padding: "13px 14px", textAlign: "center" }}>
                      {rb
                        ? <span style={{ padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 600, background: rb.bg, color: rb.c }}>{rb.lb}</span>
                        : <span style={{ fontSize: 12, color: "#059669" }}>OK</span>}
                    </td>
                    <td style={{ padding: "13px 14px", textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
                      {isAdmin && (
                        <button onClick={() => setEnrollLearnerModal(l)}
                          style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 11px", border: "1.5px solid #E2E8F0", borderRadius: 7, background: "#FFF", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#64748B", fontFamily: "var(--font-body)" }}>
                          <Users size={12} /> Enroll
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={8} style={{ padding: 48, textAlign: "center", color: "#94A3B8" }}>
                  <Users size={32} color="#E2E8F0" style={{ display: "block", margin: "0 auto 8px" }} />
                  No learners match your filters
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Grid View */}
      {viewMode === "grid" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {filtered.map((l) => {
            const ac = attColor(l.attendance_rate);
            const rb = riskBadge(l.risk_level);
            const classroomName = typeof l.classroom === "object" ? l.classroom?.name : l.classroom;
            const gradeName = typeof l.grade === "object" ? l.grade?.name : l.grade;
            return (
              <div key={l.id} onClick={() => setSelLearner(l)}
                style={{ background: "#FFF", border: "1px solid #E2E8F0", borderRadius: 12, padding: 16, cursor: "pointer", transition: "box-shadow 0.2s" }}
                onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)"}
                onMouseLeave={(e) => e.currentTarget.style.boxShadow = "none"}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: rb ? rb.bg : "#EDE9FE", color: rb ? rb.c : "#7C3AED", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700 }}>
                    {l.first_name?.[0]}{l.last_name?.[0]}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: "var(--color-navy)" }}>{l.first_name} {l.last_name}</div>
                    <div style={{ fontSize: 12, color: "#94A3B8" }}>{classroomName || "No class"} - {gradeName || "-"}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <span style={{ padding: "4px 10px", borderRadius: 99, fontSize: 12, fontWeight: 600, background: ac.bg, color: ac.c }}>{l.attendance_rate != null ? l.attendance_rate + "%" : "-"}</span>
                  {rb && <span style={{ padding: "4px 10px", borderRadius: 99, fontSize: 11, fontWeight: 600, background: rb.bg, color: rb.c }}>{rb.lb}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ padding: "10px 0", fontSize: 13, color: "#94A3B8", textAlign: "right" }}>
        {filtered.length} learner{filtered.length !== 1 ? "s" : ""} shown
      </div>

      {/* Modals */}
      {showAddModal && (
        <AddLearnerModal
          classrooms={classrooms}
          onClose={() => setShowAddModal(false)}
          onSave={loadData}
        />
      )}

      {showImportModal && (
        <BulkImportModal
          onClose={() => setShowImportModal(false)}
          onSave={loadData}
        />
      )}

      {enrollLearnerModal && (
        <EnrollModal
          learner={enrollLearnerModal}
          classrooms={classrooms}
          onClose={() => setEnrollLearnerModal(null)}
          onSave={loadData}
        />
      )}

      {/* Detail Panel */}
      {selLearner && (() => {
        const selClassroomName = typeof selLearner.classroom === "object" ? selLearner.classroom?.name : selLearner.classroom;
        const selGradeName = typeof selLearner.grade === "object" ? selLearner.grade?.name : selLearner.grade;
        return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.4)", zIndex: 200, display: "flex", justifyContent: "flex-end", animation: "fadeIn 0.2s" }}
          onClick={() => setSelLearner(null)}>
          <div style={{ width: 500, height: "100%", background: "#FFF", overflowY: "auto", animation: "slideIn 0.25s ease-out", boxShadow: "0 12px 32px rgba(0,0,0,0.1)" }}
            onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: 24, background: "#EDE9FE", borderBottom: "1px solid #C4B5FD" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#7C3AED", color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700 }}>
                    {selLearner.first_name?.[0]}{selLearner.last_name?.[0]}
                  </div>
                  <div>
                    <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 600, color: "var(--color-navy)" }}>{selLearner.first_name} {selLearner.last_name}</h2>
                    <div style={{ fontSize: 14, color: "var(--color-slate)" }}>{selClassroomName || "No class"} - {selGradeName || "-"}</div>
                  </div>
                </div>
                <button onClick={() => setSelLearner(null)} style={{ background: "none", border: "none", color: "var(--color-slate)", cursor: "pointer" }}><X size={20} /></button>
              </div>

              <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                {[
                  { lb: "Attendance", val: (selLearner.attendance_rate || 0) + "%", c: attColor(selLearner.attendance_rate) },
                  { lb: "Absences", val: selLearner.absent_count || 0, c: (selLearner.absent_count || 0) > 5 ? { c: "#DC2626", bg: "#FEE2E2" } : { c: "#059669", bg: "#D1FAE5" } },
                ].map((s, i) => (
                  <div key={i} style={{ flex: 1, padding: "10px 14px", background: "#FFF", borderRadius: 8, textAlign: "center" }}>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700, color: s.c.c }}>{s.val}</div>
                    <div style={{ fontSize: 11, color: "#94A3B8" }}>{s.lb}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ padding: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>Learner Information</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {[
                  { lb: "Full Name", val: `${selLearner.first_name} ${selLearner.last_name}` },
                  { lb: "Class", val: selClassroomName || "Not enrolled" },
                  { lb: "Grade", val: selGradeName || "-" },
                  { lb: "Home Language", val: selLearner.home_language || "-" },
                  { lb: "Special Needs", val: selLearner.special_needs || "None recorded" },
                ].map((f, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "12px 16px", background: i % 2 === 0 ? "#FAFAFA" : "#FFF", borderRadius: 8 }}>
                    <span style={{ fontSize: 13, color: "#64748B" }}>{f.lb}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-navy)" }}>{f.val}</span>
                  </div>
                ))}
              </div>

              {isAdmin && (
                <div style={{ marginTop: 20 }}>
                  <button onClick={() => { setEnrollLearnerModal(selLearner); setSelLearner(null); }}
                    style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 16px", border: "1.5px solid #7C3AED", borderRadius: 8, background: "#EDE9FE", color: "#7C3AED", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600 }}>
                    <Users size={14} /> Change Class Enrollment
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        );
      })()}

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideIn { from { transform: translateX(100%) } to { transform: translateX(0) } }
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
      `}</style>
    </div>
  );
}

// ─── STYLE HELPERS ────────────────────────────────────────────────────────────

const lbl = { fontSize: 12, fontWeight: 600, color: "#64748B", display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" };
const inp = { width: "100%", padding: "10px 14px", border: "1.5px solid #E2E8F0", borderRadius: 8, fontFamily: "var(--font-body)", fontSize: 14, color: "var(--color-navy)", outline: "none", boxSizing: "border-box" };
