import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getGrades, createGrade, updateGrade, deleteGrade,
  getSubjects, createSubject, updateSubject, deleteSubject,
  getClassrooms, createClassroom, updateClassroom, deleteClassroom,
} from "../api/client";
import {
  Building2, GraduationCap, BookMarked, Plus, X, Edit3, Trash2,
  AlertCircle, Check, Loader2, School, Layers,
} from "lucide-react";

// ─── TABS ──────────────────────────────────────────────────────────────────────

const TABS = [
  { id: "grades", label: "Grades", icon: GraduationCap, color: "#7C3AED" },
  { id: "subjects", label: "Subjects", icon: BookMarked, color: "#0891B2" },
  { id: "classrooms", label: "Classrooms", icon: School, color: "#D97706" },
];

// ─── MODAL COMPONENT ───────────────────────────────────────────────────────────

function ItemModal({ type, item, grades, onClose, onSave }) {
  const isEdit = !!item;
  const [form, setForm] = useState(
    isEdit ? { ...item } : (
      type === "grades" ? { name: "", order: 1 } :
      type === "subjects" ? { name: "", code: "" } :
      { name: "", grade_id: "" }
    )
  );
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const labels = {
    grades: { title: isEdit ? "Edit Grade" : "Add New Grade", nameLabel: "Grade Name", namePlaceholder: "e.g. Grade 8" },
    subjects: { title: isEdit ? "Edit Subject" : "Add New Subject", nameLabel: "Subject Name", namePlaceholder: "e.g. Mathematics" },
    classrooms: { title: isEdit ? "Edit Classroom" : "Add New Classroom", nameLabel: "Classroom Name", namePlaceholder: "e.g. 8A" },
  };

  const config = labels[type];

  function validate() {
    const errs = {};
    if (!form.name?.trim()) errs.name = "Name is required";
    if (type === "classrooms" && !form.grade_id) errs.grade_id = "Grade is required";
    return errs;
  }

  async function handleSave() {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      const data = { name: form.name.trim() };
      if (type === "grades") data.order = form.order || 1;
      if (type === "subjects") data.code = form.code?.trim() || "";
      if (type === "classrooms") data.grade_id = form.grade_id;

      if (isEdit) {
        if (type === "grades") await updateGrade(item.id, data);
        else if (type === "subjects") await updateSubject(item.id, data);
        else await updateClassroom(item.id, data);
      } else {
        if (type === "grades") await createGrade(data);
        else if (type === "subjects") await createSubject(data);
        else await createClassroom(data);
      }
      onSave();
      onClose();
    } catch (err) {
      console.error("Save failed:", err);
      setErrors({ general: err.response?.data?.error || "Failed to save" });
    } finally {
      setSaving(false);
    }
  }

  const tabColor = TABS.find(t => t.id === type)?.color || "#7C3AED";

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
      onClick={onClose}>
      <div style={{ width: 480, background: "#FFF", borderRadius: 16, overflow: "hidden", boxShadow: "0 24px 64px rgba(0,0,0,0.15)" }}
        onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 600, color: "var(--color-navy)" }}>
            {config.title}
          </h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8" }}><X size={20} /></button>
        </div>

        {errors.general && (
          <div style={{ padding: "10px 24px", background: "#FEE2E2", borderBottom: "1px solid #FECACA", display: "flex", alignItems: "center", gap: 8, color: "#DC2626", fontSize: 13 }}>
            <AlertCircle size={15} /> {errors.general}
          </div>
        )}

        {/* Form */}
        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={lbl}>{config.nameLabel} *</label>
            <input style={{ ...inp, borderColor: errors.name ? "#DC2626" : "#E2E8F0" }}
              value={form.name || ""}
              onChange={(e) => { setForm({ ...form, name: e.target.value }); setErrors({ ...errors, name: "" }); }}
              placeholder={config.namePlaceholder} />
            {errors.name && <p style={err}>{errors.name}</p>}
          </div>

          {type === "grades" && (
            <div>
              <label style={lbl}>Display Order</label>
              <input type="number" min="1" style={inp}
                value={form.order || 1}
                onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 1 })}
                placeholder="1" />
            </div>
          )}

          {type === "subjects" && (
            <div>
              <label style={lbl}>Subject Code</label>
              <input style={inp}
                value={form.code || ""}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="e.g. MATH, ENG" />
            </div>
          )}

          {type === "classrooms" && (
            <div>
              <label style={lbl}>Grade *</label>
              <select style={{ ...inp, borderColor: errors.grade_id ? "#DC2626" : "#E2E8F0" }}
                value={form.grade_id || ""}
                onChange={(e) => { setForm({ ...form, grade_id: parseInt(e.target.value) }); setErrors({ ...errors, grade_id: "" }); }}>
                <option value="">Select a grade...</option>
                {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
              {errors.grade_id && <p style={err}>{errors.grade_id}</p>}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 24px", borderTop: "1px solid #E2E8F0", display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={onClose} style={{ padding: "10px 20px", border: "1px solid #E2E8F0", borderRadius: 8, background: "#FFF", fontSize: 13, fontWeight: 600, color: "#64748B", cursor: "pointer" }}>Cancel</button>
          <button onClick={handleSave} disabled={saving}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 24px", border: "none", borderRadius: 8, background: tabColor, color: "#FFF", fontSize: 13, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
            {saving ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : (isEdit ? <Check size={14} /> : <Plus size={14} />)}
            {saving ? "Saving..." : (isEdit ? "Save Changes" : "Create")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── DELETE CONFIRMATION MODAL ─────────────────────────────────────────────────

function DeleteModal({ type, item, onClose, onConfirm }) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      if (type === "grades") await deleteGrade(item.id);
      else if (type === "subjects") await deleteSubject(item.id);
      else await deleteClassroom(item.id);
      onConfirm();
      onClose();
    } catch (err) {
      console.error("Delete failed:", err);
      alert(err.response?.data?.error || "Failed to delete");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
      onClick={onClose}>
      <div style={{ width: 400, background: "#FFF", borderRadius: 16, overflow: "hidden", boxShadow: "0 24px 64px rgba(0,0,0,0.15)" }}
        onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: 24, textAlign: "center" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#FEE2E2", margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Trash2 size={24} color="#DC2626" />
          </div>
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 600, color: "var(--color-navy)", marginBottom: 8 }}>
            Delete {type === "grades" ? "Grade" : type === "subjects" ? "Subject" : "Classroom"}?
          </h3>
          <p style={{ fontSize: 14, color: "#64748B", marginBottom: 20 }}>
            Are you sure you want to delete <strong>{item.name}</strong>? This action cannot be undone.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <button onClick={onClose} style={{ padding: "10px 20px", border: "1px solid #E2E8F0", borderRadius: 8, background: "#FFF", fontSize: 13, fontWeight: 600, color: "#64748B", cursor: "pointer" }}>Cancel</button>
            <button onClick={handleDelete} disabled={deleting}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 24px", border: "none", borderRadius: 8, background: "#DC2626", color: "#FFF", fontSize: 13, fontWeight: 600, cursor: deleting ? "not-allowed" : "pointer", opacity: deleting ? 0.7 : 1 }}>
              {deleting ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Trash2 size={14} />}
              {deleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────────

export default function SchoolManagementPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("grades");
  const [loading, setLoading] = useState(true);

  const [grades, setGrades] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classrooms, setClassrooms] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingItem, setDeletingItem] = useState(null);

  const isAdmin = ["admin", "deputy", "principal", "hod"].includes(user?.role);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [gradesRes, subjectsRes, classroomsRes] = await Promise.all([
        getGrades(),
        getSubjects(),
        getClassrooms(),
      ]);
      setGrades(gradesRes.data || []);
      setSubjects(subjectsRes.data || []);
      setClassrooms(classroomsRes.data || []);
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setLoading(false);
    }
  }

  function getCurrentData() {
    if (activeTab === "grades") return grades;
    if (activeTab === "subjects") return subjects;
    return classrooms;
  }

  const tabConfig = TABS.find(t => t.id === activeTab);
  const data = getCurrentData();

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", flexDirection: "column", gap: 12 }}>
        <Loader2 size={32} color="#7C3AED" style={{ animation: "spin 1s linear infinite" }} />
        <span style={{ color: "#64748B" }}>Loading school data...</span>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 1000 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 10, background: "#FEF3C7", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Building2 size={22} color="#D97706" />
          </div>
          <div>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 600 }}>School Management</h1>
            <p style={{ fontSize: 14, color: "var(--color-slate)" }}>Manage grades, subjects, and classrooms</p>
          </div>
        </div>
        {isAdmin && (
          <button onClick={() => { setEditingItem(null); setShowModal(true); }}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 20px", border: "none", borderRadius: 8, background: tabConfig.color, color: "#FFF", cursor: "pointer", fontSize: 14, fontWeight: 600, fontFamily: "var(--font-body)" }}>
            <Plus size={16} /> Add {activeTab === "grades" ? "Grade" : activeTab === "subjects" ? "Subject" : "Classroom"}
          </button>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        {[
          { lb: "Grades", val: grades.length, c: "#7C3AED" },
          { lb: "Subjects", val: subjects.length, c: "#0891B2" },
          { lb: "Classrooms", val: classrooms.length, c: "#D97706" },
        ].map((s, i) => (
          <div key={i} style={{ flex: 1, padding: "12px 16px", background: "#FFF", border: "1px solid #E2E8F0", borderRadius: 10, textAlign: "center" }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700, color: s.c }}>{s.val}</div>
            <div style={{ fontSize: 11, color: "#94A3B8" }}>{s.lb}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "#F8FAFC", padding: 4, borderRadius: 10 }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1, padding: "10px 16px", border: "none", borderRadius: 8,
              background: activeTab === tab.id ? "#FFF" : "transparent",
              boxShadow: activeTab === tab.id ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
              cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 14,
              fontWeight: activeTab === tab.id ? 600 : 400,
              color: activeTab === tab.id ? tab.color : "#64748B",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              transition: "all 0.15s",
            }}>
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ background: "#FFF", border: "1px solid #E2E8F0", borderRadius: 12, overflow: "hidden" }}>
        {/* Grades Tab */}
        {activeTab === "grades" && (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ background: "#F8FAFC" }}>
                {["Grade Name", "Order", "Classrooms", "Actions"].map((h, i) => (
                  <th key={i} style={{ textAlign: "left", padding: "12px 14px", fontSize: 11, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {grades.map(g => {
                const classCount = classrooms.filter(c => c.grade === g.id || c.grade?.id === g.id).length;
                return (
                  <tr key={g.id} style={{ borderBottom: "1px solid #F1F5F9" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "#FAFAFA"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                    <td style={{ padding: "13px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 8, background: "#EDE9FE", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <GraduationCap size={18} color="#7C3AED" />
                        </div>
                        <span style={{ fontWeight: 600, color: "var(--color-navy)" }}>{g.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: "13px 14px", color: "#64748B" }}>{g.order || "-"}</td>
                    <td style={{ padding: "13px 14px" }}>
                      <span style={{ padding: "4px 10px", borderRadius: 99, fontSize: 12, fontWeight: 600, background: "#F1F5F9", color: "#64748B" }}>
                        {classCount} class{classCount !== 1 ? "es" : ""}
                      </span>
                    </td>
                    <td style={{ padding: "13px 14px" }}>
                      {isAdmin && (
                        <div style={{ display: "flex", gap: 6 }}>
                          <button onClick={() => { setEditingItem(g); setShowModal(true); }}
                            style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", border: "1.5px solid #E2E8F0", borderRadius: 6, background: "#FFF", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#64748B" }}>
                            <Edit3 size={11} /> Edit
                          </button>
                          <button onClick={() => { setDeletingItem(g); setShowDeleteModal(true); }}
                            style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", border: "1.5px solid #FECACA", borderRadius: 6, background: "#FFF", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#DC2626" }}>
                            <Trash2 size={11} /> Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {grades.length === 0 && (
                <tr><td colSpan={4} style={{ padding: 48, textAlign: "center", color: "#94A3B8" }}>
                  <GraduationCap size={32} color="#E2E8F0" style={{ display: "block", margin: "0 auto 8px" }} />
                  No grades found. Add your first grade to get started.
                </td></tr>
              )}
            </tbody>
          </table>
        )}

        {/* Subjects Tab */}
        {activeTab === "subjects" && (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ background: "#F8FAFC" }}>
                {["Subject Name", "Code", "Actions"].map((h, i) => (
                  <th key={i} style={{ textAlign: "left", padding: "12px 14px", fontSize: 11, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {subjects.map(s => (
                <tr key={s.id} style={{ borderBottom: "1px solid #F1F5F9" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "#FAFAFA"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "13px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: "#E0F2FE", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <BookMarked size={18} color="#0891B2" />
                      </div>
                      <span style={{ fontWeight: 600, color: "var(--color-navy)" }}>{s.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: "13px 14px" }}>
                    {s.code ? (
                      <code style={{ fontSize: 12, background: "#F8FAFC", padding: "3px 8px", borderRadius: 6, color: "#475569", border: "1px solid #E2E8F0" }}>{s.code}</code>
                    ) : (
                      <span style={{ color: "#CBD5E1" }}>-</span>
                    )}
                  </td>
                  <td style={{ padding: "13px 14px" }}>
                    {isAdmin && (
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => { setEditingItem(s); setShowModal(true); }}
                          style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", border: "1.5px solid #E2E8F0", borderRadius: 6, background: "#FFF", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#64748B" }}>
                          <Edit3 size={11} /> Edit
                        </button>
                        <button onClick={() => { setDeletingItem(s); setShowDeleteModal(true); }}
                          style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", border: "1.5px solid #FECACA", borderRadius: 6, background: "#FFF", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#DC2626" }}>
                          <Trash2 size={11} /> Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {subjects.length === 0 && (
                <tr><td colSpan={3} style={{ padding: 48, textAlign: "center", color: "#94A3B8" }}>
                  <BookMarked size={32} color="#E2E8F0" style={{ display: "block", margin: "0 auto 8px" }} />
                  No subjects found. Add your first subject to get started.
                </td></tr>
              )}
            </tbody>
          </table>
        )}

        {/* Classrooms Tab */}
        {activeTab === "classrooms" && (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ background: "#F8FAFC" }}>
                {["Classroom", "Grade", "Learners", "Actions"].map((h, i) => (
                  <th key={i} style={{ textAlign: "left", padding: "12px 14px", fontSize: 11, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {classrooms.map(c => {
                const gradeName = typeof c.grade === "object" ? c.grade?.name : grades.find(g => g.id === c.grade)?.name;
                return (
                  <tr key={c.id} style={{ borderBottom: "1px solid #F1F5F9" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "#FAFAFA"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                    <td style={{ padding: "13px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 8, background: "#FEF3C7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <School size={18} color="#D97706" />
                        </div>
                        <span style={{ fontWeight: 600, color: "var(--color-navy)" }}>{c.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: "13px 14px" }}>
                      <span style={{ padding: "4px 10px", borderRadius: 99, fontSize: 12, fontWeight: 600, background: "#EDE9FE", color: "#7C3AED" }}>
                        {gradeName || "-"}
                      </span>
                    </td>
                    <td style={{ padding: "13px 14px", color: "#64748B" }}>
                      {c.learner_count !== undefined ? `${c.learner_count} learners` : "-"}
                    </td>
                    <td style={{ padding: "13px 14px" }}>
                      {isAdmin && (
                        <div style={{ display: "flex", gap: 6 }}>
                          <button onClick={() => { setEditingItem({ ...c, grade_id: typeof c.grade === "object" ? c.grade?.id : c.grade }); setShowModal(true); }}
                            style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", border: "1.5px solid #E2E8F0", borderRadius: 6, background: "#FFF", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#64748B" }}>
                            <Edit3 size={11} /> Edit
                          </button>
                          <button onClick={() => { setDeletingItem(c); setShowDeleteModal(true); }}
                            style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", border: "1.5px solid #FECACA", borderRadius: 6, background: "#FFF", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#DC2626" }}>
                            <Trash2 size={11} /> Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {classrooms.length === 0 && (
                <tr><td colSpan={4} style={{ padding: 48, textAlign: "center", color: "#94A3B8" }}>
                  <School size={32} color="#E2E8F0" style={{ display: "block", margin: "0 auto 8px" }} />
                  No classrooms found. Add grades first, then create classrooms.
                </td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <div style={{ padding: "10px 0", fontSize: 13, color: "#94A3B8", textAlign: "right" }}>
        {data.length} {activeTab} shown
      </div>

      {/* Item Modal */}
      {showModal && (
        <ItemModal
          type={activeTab}
          item={editingItem}
          grades={grades}
          onClose={() => { setShowModal(false); setEditingItem(null); }}
          onSave={loadData}
        />
      )}

      {/* Delete Modal */}
      {showDeleteModal && deletingItem && (
        <DeleteModal
          type={activeTab}
          item={deletingItem}
          onClose={() => { setShowDeleteModal(false); setDeletingItem(null); }}
          onConfirm={loadData}
        />
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
      `}</style>
    </div>
  );
}

// ─── STYLE HELPERS ─────────────────────────────────────────────────────────────

const lbl = { fontSize: 12, fontWeight: 600, color: "#64748B", display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" };
const inp = { width: "100%", padding: "10px 14px", border: "1.5px solid #E2E8F0", borderRadius: 8, fontFamily: "var(--font-body)", fontSize: 14, color: "var(--color-navy)", outline: "none", boxSizing: "border-box" };
const err = { fontSize: 11, color: "#DC2626", marginTop: 3 };
