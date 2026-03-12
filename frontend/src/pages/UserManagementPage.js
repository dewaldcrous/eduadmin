import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getStaff, createStaff, updateStaff, toggleStaffStatus, getSubjects,
} from "../api/client";
import {
  Users, Plus, X, Search, Edit3, UserX, UserCheck,
  Eye, EyeOff, AlertCircle, Check, ChevronDown, Shield,
  Phone, Mail, Loader2,
} from "lucide-react";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const ROLES = [
  { id: "teacher",    label: "Teacher",           color: "#7C3AED", bg: "#EDE9FE" },
  { id: "hod",        label: "Head of Department", color: "#0891B2", bg: "#E0F2FE" },
  { id: "grade_head", label: "Grade Head",         color: "#0284C7", bg: "#DBEAFE" },
  { id: "deputy",     label: "Deputy Principal",   color: "#D97706", bg: "#FEF3C7" },
  { id: "principal",  label: "Principal",          color: "#DC2626", bg: "#FEE2E2" },
  { id: "admin",      label: "Administrator",      color: "#475569", bg: "#F1F5F9" },
];

function roleInfo(roleId) { return ROLES.find((r) => r.id === roleId) || { label: roleId, color: "#64748B", bg: "#F1F5F9" }; }

function generateUsername(firstName, lastName, role) {
  const first = firstName.trim().toLowerCase().replace(/\s+/g, "");
  const last = lastName.trim().toLowerCase().replace(/\s+/g, "");
  if (["principal","deputy","admin","hod"].includes(role)) return `${role}.${last}`;
  return `t.${last}`;
}

const EMPTY_FORM = {
  username: "", firstName: "", lastName: "", email: "",
  phone: "", role: "teacher", subjects: [],
  password: "", confirmPassword: "",
};

// ─── USER FORM MODAL ──────────────────────────────────────────────────────────

function UserFormModal({ user, onClose, onSave, subjectsList }) {
  const isEdit = !!user;
  const [form, setForm] = useState(isEdit ? {
    username: user.username, firstName: user.first_name, lastName: user.last_name,
    email: user.email, phone: user.phone, role: user.role,
    subjects: user.subjects || [],
    password: "", confirmPassword: "",
  } : { ...EMPTY_FORM });
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  function autoUsername() {
    if (!isEdit && form.firstName && form.lastName) {
      setForm((f) => ({ ...f, username: generateUsername(f.firstName, f.lastName, f.role) }));
    }
  }

  function validate() {
    const errs = {};
    if (!form.firstName.trim()) errs.firstName = "Required";
    if (!form.lastName.trim()) errs.lastName = "Required";
    if (!form.username.trim()) errs.username = "Required";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Invalid email";
    if (!isEdit) {
      if (!form.password) errs.password = "Required for new user";
      else if (form.password.length < 8) errs.password = "Min 8 characters";
      if (form.password !== form.confirmPassword) errs.confirmPassword = "Passwords don't match";
    } else if (form.password && form.password !== form.confirmPassword) {
      errs.confirmPassword = "Passwords don't match";
    }
    return errs;
  }

  async function handleSave() {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      const data = {
        username: form.username.trim(),
        first_name: form.firstName.trim(),
        last_name: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        role: form.role,
      };
      if (form.password) data.password = form.password;

      if (isEdit) {
        await updateStaff(user.id, data);
      } else {
        await createStaff(data);
      }
      onSave();
      onClose();
    } catch (err) {
      console.error("Failed to save user:", err);
      setErrors({ general: err.response?.data?.error || "Failed to save user" });
    } finally {
      setSaving(false);
    }
  }

  const ri = roleInfo(form.role);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, animation: "fadeIn 0.15s" }}
      onClick={onClose}>
      <div style={{ width: 620, maxHeight: "90vh", background: "#FFF", borderRadius: 16, overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 24px 64px rgba(0,0,0,0.15)" }}
        onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 600, color: "var(--color-navy)" }}>
              {isEdit ? `Edit Staff — ${user.first_name} ${user.last_name}` : "Add New Staff Member"}
            </h3>
            <p style={{ fontSize: 13, color: "#64748B", marginTop: 2 }}>
              {isEdit ? "Update account details" : "Create a new staff account"}
            </p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8" }}><X size={20} /></button>
        </div>

        {errors.general && (
          <div style={{ padding: "10px 24px", background: "#FEE2E2", borderBottom: "1px solid #FECACA", display: "flex", alignItems: "center", gap: 8, color: "#DC2626", fontSize: 13 }}>
            <AlertCircle size={15} /> {errors.general}
          </div>
        )}

        {/* Form */}
        <div style={{ padding: 24, overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Role */}
          <div>
            <label style={lbl}>Role *</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {ROLES.map((r) => (
                <button key={r.id} onClick={() => setForm({ ...form, role: r.id })}
                  style={{ padding: "6px 14px", borderRadius: 99, border: "2px solid " + (form.role === r.id ? r.color : "#E2E8F0"), background: form.role === r.id ? r.bg : "#FFF", color: form.role === r.id ? r.color : "#64748B", fontFamily: "var(--font-body)", fontSize: 13, fontWeight: form.role === r.id ? 700 : 400, cursor: "pointer", transition: "all 0.12s" }}>
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Name row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={lbl}>First Name *</label>
              <input style={{ ...inp, borderColor: errors.firstName ? "#DC2626" : "#E2E8F0" }} value={form.firstName}
                onChange={(e) => { setForm({ ...form, firstName: e.target.value }); setErrors({ ...errors, firstName: "" }); }}
                onBlur={autoUsername} placeholder="e.g. Sarah" />
              {errors.firstName && <p style={err}>{errors.firstName}</p>}
            </div>
            <div>
              <label style={lbl}>Last Name *</label>
              <input style={{ ...inp, borderColor: errors.lastName ? "#DC2626" : "#E2E8F0" }} value={form.lastName}
                onChange={(e) => { setForm({ ...form, lastName: e.target.value }); setErrors({ ...errors, lastName: "" }); }}
                onBlur={autoUsername} placeholder="e.g. Williams" />
              {errors.lastName && <p style={err}>{errors.lastName}</p>}
            </div>
          </div>

          {/* Username */}
          <div>
            <label style={lbl}>Username *</label>
            <input style={{ ...inp, borderColor: errors.username ? "#DC2626" : "#E2E8F0" }} value={form.username}
              onChange={(e) => { setForm({ ...form, username: e.target.value }); setErrors({ ...errors, username: "" }); }}
              placeholder="e.g. t.williams" />
            {errors.username && <p style={err}>{errors.username}</p>}
            {!isEdit && form.firstName && form.lastName && (
              <p style={{ fontSize: 11, color: "#94A3B8", marginTop: 3 }}>Auto-generated — click to customise</p>
            )}
          </div>

          {/* Email + Phone */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={lbl}>Email</label>
              <input type="email" style={{ ...inp, borderColor: errors.email ? "#DC2626" : "#E2E8F0" }} value={form.email}
                onChange={(e) => { setForm({ ...form, email: e.target.value }); setErrors({ ...errors, email: "" }); }}
                placeholder="email@school.edu.za" />
              {errors.email && <p style={err}>{errors.email}</p>}
            </div>
            <div>
              <label style={lbl}>Phone</label>
              <input style={inp} value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="082-000-0000" />
            </div>
          </div>

          {/* Password */}
          <div style={{ paddingTop: 8, borderTop: "1px solid #F1F5F9" }}>
            <label style={lbl}>{isEdit ? "New Password (leave blank to keep current)" : "Password *"}</label>
            <div style={{ position: "relative" }}>
              <input type={showPw ? "text" : "password"} style={{ ...inp, paddingRight: 40, borderColor: errors.password ? "#DC2626" : "#E2E8F0" }}
                value={form.password} onChange={(e) => { setForm({ ...form, password: e.target.value }); setErrors({ ...errors, password: "" }); }}
                placeholder={isEdit ? "Leave blank to keep current" : "Min 8 characters"} />
              <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: "absolute", right: 12, top: 11, background: "none", border: "none", cursor: "pointer", color: "#94A3B8" }}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <p style={err}>{errors.password}</p>}
          </div>

          {(form.password || !isEdit) && (
            <div>
              <label style={lbl}>Confirm Password {!isEdit && "*"}</label>
              <input type={showPw ? "text" : "password"} style={{ ...inp, borderColor: errors.confirmPassword ? "#DC2626" : "#E2E8F0" }}
                value={form.confirmPassword} onChange={(e) => { setForm({ ...form, confirmPassword: e.target.value }); setErrors({ ...errors, confirmPassword: "" }); }}
                placeholder="Repeat password" />
              {errors.confirmPassword && <p style={err}>{errors.confirmPassword}</p>}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 24px", borderTop: "1px solid #E2E8F0", display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={onClose} style={{ padding: "10px 20px", border: "1px solid #E2E8F0", borderRadius: 8, background: "#FFF", fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600, color: "#64748B", cursor: "pointer" }}>Cancel</button>
          <button onClick={handleSave} disabled={saving}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 24px", border: "none", borderRadius: 8, background: ri.color, color: "#FFF", fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
            {saving ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : (isEdit ? <Check size={14} /> : <Plus size={14} />)}
            {saving ? "Saving..." : (isEdit ? "Save Changes" : "Create Staff")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function UserManagementPage() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [subjectsList, setSubjectsList] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showRoleDrop, setShowRoleDrop] = useState(false);

  // ── Load data ──
  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [staffRes, subjectsRes] = await Promise.all([
        getStaff(),
        getSubjects(),
      ]);
      setUsers(staffRes.data || []);
      setSubjectsList(subjectsRes.data || []);
    } catch (err) {
      console.error("Failed to load staff:", err);
    } finally {
      setLoading(false);
    }
  }

  // ── Filters ──
  const filtered = users.filter((u) => {
    if (roleFilter !== "all" && u.role !== roleFilter) return false;
    if (statusFilter === "active" && !u.is_active) return false;
    if (statusFilter === "inactive" && u.is_active) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!`${u.first_name} ${u.last_name} ${u.username} ${u.email}`.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  // ── Toggle active ──
  async function toggleActive(userId, currentStatus) {
    try {
      await toggleStaffStatus(userId, !currentStatus);
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, is_active: !currentStatus } : u));
    } catch (err) {
      console.error("Failed to toggle status:", err);
      alert(err.response?.data?.error || "Failed to update status");
    }
  }

  // ── Stats ──
  const totalStaff = users.length;
  const teachers = users.filter((u) => u.role === "teacher").length;
  const management = users.filter((u) => ["deputy", "principal", "admin"].includes(u.role)).length;
  const inactive = users.filter((u) => !u.is_active).length;

  const isAdmin = ["admin", "deputy", "principal"].includes(user?.role);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", flexDirection: "column", gap: 12 }}>
        <Loader2 size={32} color="#7C3AED" style={{ animation: "spin 1s linear infinite" }} />
        <span style={{ color: "#64748B" }}>Loading staff...</span>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 1100 }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 10, background: "#EDE9FE", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Users size={22} color="#7C3AED" />
          </div>
          <div>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 600 }}>Staff Management</h1>
            <p style={{ fontSize: 14, color: "var(--color-slate)" }}>Manage faculty and administrative staff</p>
          </div>
        </div>
        {isAdmin && (
          <button onClick={() => { setEditingUser(null); setShowModal(true); }}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 20px", border: "none", borderRadius: 8, background: "#7C3AED", color: "#FFF", cursor: "pointer", fontSize: 14, fontWeight: 600, fontFamily: "var(--font-body)" }}>
            <Plus size={16} /> Add Staff
          </button>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        {[
          { lb: "Total Staff",   val: totalStaff,   c: "#7C3AED" },
          { lb: "Teachers",      val: teachers,     c: "#0891B2" },
          { lb: "Management",    val: management,   c: "#D97706" },
          { lb: "Inactive",      val: inactive,     c: inactive > 0 ? "#DC2626" : "#64748B" },
        ].map((s, i) => (
          <div key={i} style={{ flex: 1, padding: "12px 16px", background: "#FFF", border: "1px solid #E2E8F0", borderRadius: 10, textAlign: "center" }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700, color: s.c }}>{s.val}</div>
            <div style={{ fontSize: 11, color: "#94A3B8" }}>{s.lb}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        {/* Role filter */}
        <div style={{ position: "relative" }}>
          <button onClick={() => setShowRoleDrop(!showRoleDrop)}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", background: roleFilter !== "all" ? "#EDE9FE" : "#FFF", border: "1.5px solid " + (roleFilter !== "all" ? "#7C3AED" : "#E2E8F0"), borderRadius: 8, cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 13, fontWeight: roleFilter !== "all" ? 600 : 400, color: roleFilter !== "all" ? "#7C3AED" : "#64748B", minWidth: 150 }}>
            <Shield size={14} />
            <span style={{ flex: 1, textAlign: "left" }}>{roleFilter === "all" ? "All Roles" : roleInfo(roleFilter).label}</span>
            <ChevronDown size={13} style={{ transform: showRoleDrop ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
          </button>
          {showRoleDrop && (
            <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, minWidth: 180, background: "#FFF", border: "1.5px solid #E2E8F0", borderRadius: 10, boxShadow: "0 12px 32px rgba(0,0,0,0.1)", zIndex: 50, overflow: "hidden" }}>
              <button onClick={() => { setRoleFilter("all"); setShowRoleDrop(false); }}
                style={{ width: "100%", padding: "10px 14px", border: "none", borderBottom: "1px solid #F1F5F9", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 13, textAlign: "left", background: roleFilter === "all" ? "#EDE9FE" : "transparent", color: roleFilter === "all" ? "#7C3AED" : "inherit" }}>
                All Roles
              </button>
              {ROLES.map((r) => (
                <button key={r.id} onClick={() => { setRoleFilter(r.id); setShowRoleDrop(false); }}
                  style={{ width: "100%", padding: "10px 14px", border: "none", borderBottom: "1px solid #F1F5F9", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 13, textAlign: "left", background: roleFilter === r.id ? r.bg : "transparent", color: roleFilter === r.id ? r.color : "inherit", fontWeight: roleFilter === r.id ? 600 : 400 }}>
                  {r.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Status filter */}
        <div style={{ display: "flex", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, overflow: "hidden" }}>
          {[{ k: "all", lb: "All" }, { k: "active", lb: "Active" }, { k: "inactive", lb: "Inactive" }].map((v) => (
            <button key={v.k} onClick={() => setStatusFilter(v.k)}
              style={{ padding: "9px 14px", border: "none", borderRight: v.k !== "inactive" ? "1px solid #E2E8F0" : "none", cursor: "pointer", background: statusFilter === v.k ? "#FFF" : "transparent", color: statusFilter === v.k ? "#7C3AED" : "#64748B", fontFamily: "var(--font-body)", fontSize: 13, fontWeight: statusFilter === v.k ? 600 : 400 }}>
              {v.lb}
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Search size={15} color="#94A3B8" style={{ position: "absolute", left: 12, top: 11 }} />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, username, email..."
            style={{ width: "100%", padding: "9px 14px 9px 36px", fontSize: 13, fontFamily: "var(--font-body)", border: "1.5px solid #E2E8F0", borderRadius: 8, color: "var(--color-navy)", outline: "none", boxSizing: "border-box" }} />
          {search && <button onClick={() => setSearch("")} style={{ position: "absolute", right: 10, top: 9, background: "none", border: "none", cursor: "pointer", color: "#94A3B8" }}><X size={15} /></button>}
        </div>
      </div>

      {/* User table */}
      <div style={{ background: "#FFF", border: "1px solid #E2E8F0", borderRadius: 12, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ background: "#F8FAFC" }}>
              {["Staff Member","Username","Role","Contact","Subjects","Status","Actions"].map((h, i) => (
                <th key={i} style={{ textAlign: "left", padding: "12px 14px", fontSize: 11, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => {
              const ri = roleInfo(u.role);
              return (
                <tr key={u.id}
                  style={{ borderBottom: "1px solid #F1F5F9", opacity: u.is_active ? 1 : 0.55, transition: "opacity 0.2s" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "#FAFAFA"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "13px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: "50%", background: ri.bg, color: ri.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                        {u.first_name?.[0]}{u.last_name?.[0]}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: "var(--color-navy)" }}>{u.first_name} {u.last_name}</div>
                        {u.email && <div style={{ fontSize: 12, color: "#94A3B8" }}>{u.email}</div>}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "13px 14px" }}>
                    <code style={{ fontSize: 12, background: "#F8FAFC", padding: "3px 8px", borderRadius: 6, color: "#475569", border: "1px solid #E2E8F0" }}>{u.username}</code>
                  </td>
                  <td style={{ padding: "13px 14px" }}>
                    <span style={{ padding: "4px 10px", borderRadius: 99, fontSize: 12, fontWeight: 600, background: ri.bg, color: ri.color }}>{ri.label}</span>
                  </td>
                  <td style={{ padding: "13px 14px", color: "#64748B", fontSize: 13 }}>
                    {u.phone && <div style={{ display: "flex", alignItems: "center", gap: 4 }}><Phone size={11} />{u.phone}</div>}
                    {!u.phone && !u.email && <span style={{ color: "#CBD5E1" }}>-</span>}
                  </td>
                  <td style={{ padding: "13px 14px" }}>
                    {u.subjects?.length > 0 ? (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {u.subjects.slice(0, 3).map((s) => <span key={s} style={{ fontSize: 11, padding: "2px 7px", background: "#EDE9FE", color: "#7C3AED", borderRadius: 99, fontWeight: 600 }}>{s}</span>)}
                        {u.subjects.length > 3 && <span style={{ fontSize: 11, color: "#94A3B8" }}>+{u.subjects.length - 3}</span>}
                      </div>
                    ) : (
                      <span style={{ color: "#CBD5E1", fontSize: 13 }}>-</span>
                    )}
                  </td>
                  <td style={{ padding: "13px 14px" }}>
                    <span style={{ padding: "4px 10px", borderRadius: 99, fontSize: 12, fontWeight: 600, background: u.is_active ? "#D1FAE5" : "#FEE2E2", color: u.is_active ? "#059669" : "#DC2626" }}>
                      {u.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td style={{ padding: "13px 14px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      {isAdmin && (
                        <>
                          <button onClick={() => { setEditingUser(u); setShowModal(true); }}
                            title="Edit staff"
                            style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", border: "1.5px solid #E2E8F0", borderRadius: 6, background: "#FFF", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#64748B", fontFamily: "var(--font-body)" }}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#7C3AED"; e.currentTarget.style.color = "#7C3AED"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#E2E8F0"; e.currentTarget.style.color = "#64748B"; }}>
                            <Edit3 size={11} /> Edit
                          </button>
                          <button onClick={() => toggleActive(u.id, u.is_active)}
                            title={u.is_active ? "Deactivate" : "Activate"}
                            style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", border: "1.5px solid " + (u.is_active ? "#FECACA" : "#D1FAE5"), borderRadius: 6, background: "#FFF", cursor: "pointer", fontSize: 12, fontWeight: 600, color: u.is_active ? "#DC2626" : "#059669", fontFamily: "var(--font-body)" }}>
                            {u.is_active ? <><UserX size={11} /> Deactivate</> : <><UserCheck size={11} /> Activate</>}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={7} style={{ padding: 48, textAlign: "center", color: "#94A3B8" }}>
                <Users size={32} color="#E2E8F0" style={{ display: "block", margin: "0 auto 8px" }} />
                No staff members match your filters
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={{ padding: "10px 0", fontSize: 13, color: "#94A3B8", textAlign: "right" }}>
        {filtered.length} of {users.length} staff shown
      </div>

      {/* Modal */}
      {showModal && (
        <UserFormModal
          user={editingUser}
          subjectsList={subjectsList}
          onClose={() => { setShowModal(false); setEditingUser(null); }}
          onSave={loadData}
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

const lbl = { fontSize: 12, fontWeight: 600, color: "#64748B", display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" };
const inp = { width: "100%", padding: "10px 14px", border: "1.5px solid #E2E8F0", borderRadius: 8, fontFamily: "var(--font-body)", fontSize: 14, color: "var(--color-navy)", outline: "none", boxSizing: "border-box" };
const err = { fontSize: 11, color: "#DC2626", marginTop: 3 };
