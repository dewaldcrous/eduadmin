import React, { useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";
import {
  BookCopy, Plus, Check, Clock, X, Send, Eye,
  Edit3, AlertCircle, CheckCircle2, FileText,
  Save, Loader2, Upload, Download, Paperclip, File,
} from "lucide-react";

const DAYS = [
  { key: "MON", label: "Monday" },
  { key: "TUE", label: "Tuesday" },
  { key: "WED", label: "Wednesday" },
  { key: "THU", label: "Thursday" },
  { key: "FRI", label: "Friday" },
];

const PERIOD_TIMES = [
  { period: 1, start: "07:45", end: "08:30" },
  { period: 2, start: "08:30", end: "09:15" },
  { period: 3, start: "09:15", end: "10:00" },
  { period: 4, start: "10:20", end: "11:05" },
  { period: 5, start: "11:05", end: "11:50" },
  { period: 6, start: "11:50", end: "12:35" },
  { period: 7, start: "13:00", end: "13:45" },
];

const DEMO_WEEKLY = {
  MON: [
    { period: 1, subject: "Mathematics", class: "10A", plan: { id: 1, title: "Number Patterns — Intro", status: "approved", objectives: "Identify and extend number patterns", activities: "Group work with pattern cards, worksheet", delivered: true, attachments: [{ id: 1, name: "Pattern_Worksheet.pdf", type: "pdf", size: 245000 }, { id: 2, name: "Lesson_Slides.pptx", type: "pptx", size: 1200000 }] } },
    { period: 2, subject: "Mathematics", class: "10B", plan: { id: 2, title: "Number Patterns — Intro", status: "approved", objectives: "Identify and extend number patterns", activities: "Group work with pattern cards, worksheet", delivered: true, attachments: [] } },
    { period: 3, subject: "Mathematics", class: "10C", plan: null },
    { period: 4, subject: "Mathematics", class: "11A", plan: { id: 4, title: "Quadratic Equations", status: "pending", objectives: "Solve quadratic equations by factoring", activities: "Demo, paired practice, worksheet", attachments: [{ id: 3, name: "Quadratics_Notes.docx", type: "docx", size: 89000 }] } },
    { period: 5, subject: "Mathematics", class: "11B", plan: null },
  ],
  TUE: [
    { period: 1, subject: "Mathematics", class: "10A", plan: { id: 5, title: "Algebraic Expressions", status: "approved", objectives: "Simplify algebraic expressions", activities: "Teacher demo, paired practice", attachments: [] } },
    { period: 2, subject: "Mathematics", class: "10B", plan: { id: 6, title: "Algebraic Expressions", status: "draft", objectives: "Simplify algebraic expressions", activities: "Teacher demo, paired practice", attachments: [] } },
    { period: 4, subject: "Mathematics", class: "11A", plan: null },
    { period: 5, subject: "Mathematics", class: "11B", plan: { id: 8, title: "Trig Ratios", status: "rejected", objectives: "Calculate trig ratios", activities: "Discovery with triangles", feedback: "Needs more differentiation.", attachments: [] } },
  ],
  WED: [
    { period: 1, subject: "Mathematics", class: "10A", plan: { id: 9, title: "Exponents — Laws", status: "approved", objectives: "Apply exponent laws", activities: "Interactive examples, exit ticket", attachments: [{ id: 4, name: "Exponents_Worksheet.xlsx", type: "xlsx", size: 56000 }] } },
    { period: 3, subject: "Mathematics", class: "10C", plan: null },
    { period: 5, subject: "Mathematics", class: "11B", plan: null },
    { period: 7, subject: "Mathematics", class: "12A", plan: { id: 11, title: "Calculus — Limits", status: "approved", objectives: "Understand limits", activities: "GeoGebra demo", attachments: [] } },
  ],
  THU: [
    { period: 2, subject: "Mathematics", class: "10B", plan: null },
    { period: 3, subject: "Mathematics", class: "10C", plan: null },
    { period: 4, subject: "Mathematics", class: "11A", plan: { id: 13, title: "Quadratic Formula", status: "draft", objectives: "Derive quadratic formula", activities: "Guided derivation", attachments: [] } },
    { period: 7, subject: "Mathematics", class: "12A", plan: null },
  ],
  FRI: [
    { period: 1, subject: "Mathematics", class: "10A", plan: { id: 15, title: "Exponents — Practice", status: "approved", objectives: "Consolidate exponent laws", activities: "Differentiated worksheet, peer marking", attachments: [] } },
    { period: 2, subject: "Mathematics", class: "10B", plan: null },
    { period: 3, subject: "Mathematics", class: "10C", plan: null },
    { period: 5, subject: "Mathematics", class: "11B", plan: null },
    { period: 7, subject: "Mathematics", class: "12A", plan: null },
  ],
};

const STATUS_CONFIG = {
  approved: { label: "Approved", color: "var(--color-success)", bg: "var(--color-success-light)", icon: CheckCircle2 },
  pending: { label: "Pending", color: "var(--color-accent)", bg: "var(--color-accent-light)", icon: Clock },
  draft: { label: "Draft", color: "var(--color-slate)", bg: "var(--color-surface-alt)", icon: Edit3 },
  rejected: { label: "Rejected", color: "var(--color-danger)", bg: "var(--color-danger-light)", icon: X },
};

function formatSize(b) {
  if (b < 1024) return b + " B";
  if (b < 1048576) return (b / 1024).toFixed(1) + " KB";
  return (b / 1048576).toFixed(1) + " MB";
}

export default function WeeklyPlannerPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef(null);
  const importInputRef = useRef(null);

  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createTarget, setCreateTarget] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [formData, setFormData] = useState({ title: "", objectives: "", activities: "", differentiation: "", resources_note: "" });
  const [pendingFiles, setPendingFiles] = useState([]);
  const [saving, setSaving] = useState(false);

  const totalSlots = Object.values(DEMO_WEEKLY).reduce((s, d) => s + d.length, 0);
  const plansCreated = Object.values(DEMO_WEEKLY).reduce((s, d) => s + d.filter(p => p.plan).length, 0);
  const plansMissing = totalSlots - plansCreated;
  const plansApproved = Object.values(DEMO_WEEKLY).reduce((s, d) => s + d.filter(p => p.plan && p.plan.status === "approved").length, 0);

  const openCreate = (day, slot) => {
    setCreateTarget({ period: slot.period, day: day, subject: slot.subject, class: slot.class });
    setFormData({ title: "", objectives: "", activities: "", differentiation: "", resources_note: "" });
    setPendingFiles([]);
    setShowCreateModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise(function(r) { setTimeout(r, 800); });
    setSaving(false);
    setShowCreateModal(false);
  };

  const handleFileSelect = function(e) {
    setPendingFiles(function(prev) { return prev.concat(Array.from(e.target.files)); });
    e.target.value = "";
  };

  const removePendingFile = function(idx) {
    setPendingFiles(function(prev) { return prev.filter(function(_, i) { return i !== idx; }); });
  };

  const handleImport = async function(e) {
    var file = e.target.files[0];
    if (!file) return;
    setImportResult({ loading: true });
    await new Promise(function(r) { setTimeout(r, 1500); });
    setImportResult({ loading: false, created: 3, skipped: 1, errors: ["Row 5: Plan already exists for MON P1"], total_rows: 4 });
    e.target.value = "";
  };

  const handleExport = function(fmt) {
    alert("Export as " + fmt.toUpperCase() + " — connects to API when backend runs");
  };

  const downloadTemplate = function() {
    var csv = "day,period,title,objectives,activities,differentiation,resources\nMonday,1,Example,Learners will...,Activity 1,Support for weaker learners,Textbook Ch.1";
    var blob = new Blob([csv], { type: "text/csv" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "lesson_plan_template.csv";
    a.click();
  };

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.headerIcon}><BookCopy size={22} color="var(--color-info)" /></div>
          <div>
            <h1 style={styles.title}>Weekly Lesson Planner</h1>
            <p style={styles.subtitle}>Term 1, 2026 · Mathematics</p>
          </div>
        </div>
        <div style={styles.headerActions}>
          <button onClick={function() { setShowImportModal(true); }} style={styles.importBtn}><Upload size={15} /> Import Excel</button>
          <button onClick={function() { handleExport("xlsx"); }} style={styles.exportBtn}><Download size={15} /> Export</button>
        </div>
      </div>

      {/* Stats */}
      <div style={styles.statsBar}>
        <div style={styles.hStat}><span style={styles.hStatValue}>{plansCreated}/{totalSlots}</span><span style={styles.hStatLabel}>Created</span></div>
        <div style={styles.hStat}><span style={Object.assign({}, styles.hStatValue, { color: "var(--color-success)" })}>{plansApproved}</span><span style={styles.hStatLabel}>Approved</span></div>
        <div style={styles.hStat}><span style={Object.assign({}, styles.hStatValue, { color: plansMissing > 0 ? "var(--color-danger)" : "var(--color-success)" })}>{plansMissing}</span><span style={styles.hStatLabel}>Missing</span></div>
        <div style={{ flex: 1 }} />
        <div style={styles.completionWrap}>
          <div style={styles.completionBar}><div style={Object.assign({}, styles.completionFill, { width: Math.round((plansCreated / totalSlots) * 100) + "%" })} /></div>
          <span style={styles.completionLabel}>{Math.round((plansCreated / totalSlots) * 100)}%</span>
        </div>
      </div>

      {/* Weekly Grid */}
      <div style={styles.gridContainer}>
        <div style={styles.grid}>
          <div style={styles.gridCorner}>Period</div>
          {DAYS.map(function(day) { return <div key={day.key} style={styles.gridDayHeader}>{day.label}</div>; })}

          {PERIOD_TIMES.map(function(pt) {
            return (
              <React.Fragment key={pt.period}>
                <div style={styles.gridPeriodLabel}>
                  <div style={styles.periodNum}>P{pt.period}</div>
                  <div style={styles.periodTime}>{pt.start}–{pt.end}</div>
                </div>
                {DAYS.map(function(day) {
                  var daySlots = DEMO_WEEKLY[day.key] || [];
                  var slot = daySlots.find(function(s) { return s.period === pt.period; });

                  if (!slot) {
                    return <div key={day.key} style={styles.gridCellEmpty}><span style={styles.emptyCellText}>—</span></div>;
                  }

                  var plan = slot.plan;
                  var sc = plan ? STATUS_CONFIG[plan.status] : null;
                  var StatusIcon = sc ? sc.icon : null;

                  return (
                    <div
                      key={day.key}
                      style={Object.assign({}, styles.gridCell, { borderTop: plan ? "3px solid " + sc.color : "3px solid var(--color-border-light)" })}
                      onClick={function() { plan ? setSelectedPlan(Object.assign({}, plan, { slot: slot, day: day.key })) : openCreate(day.key, slot); }}
                    >
                      <div style={styles.cellClass}>{slot.class}</div>
                      {plan ? (
                        <div>
                          <div style={styles.cellTitle}>{plan.title}</div>
                          <div style={styles.cellBottom}>
                            <div style={Object.assign({}, styles.cellStatus, { background: sc.bg, color: sc.color })}>
                              <StatusIcon size={11} /> {sc.label}
                            </div>
                            {plan.attachments && plan.attachments.length > 0 && (
                              <div style={styles.cellAttachCount}><Paperclip size={10} /> {plan.attachments.length}</div>
                            )}
                          </div>
                          {plan.delivered && <div style={styles.cellDelivered}><Check size={11} /> Delivered</div>}
                        </div>
                      ) : (
                        <button style={styles.addPlanBtn} onClick={function(e) { e.stopPropagation(); openCreate(day.key, slot); }}>
                          <Plus size={14} /> Add Plan
                        </button>
                      )}
                    </div>
                  );
                })}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div style={styles.legend}>
        {Object.entries(STATUS_CONFIG).map(function(entry) {
          return <div key={entry[0]} style={styles.legendItem}><div style={Object.assign({}, styles.legendDot, { background: entry[1].color })} />{entry[1].label}</div>;
        })}
        <div style={styles.legendItem}><Paperclip size={12} /> Has files</div>
      </div>

      {/* ─── PLAN DETAIL PANEL ──────────────────────────────────────── */}
      {selectedPlan && (
        <div style={styles.overlay} onClick={function() { setSelectedPlan(null); }}>
          <div style={styles.panel} onClick={function(e) { e.stopPropagation(); }}>
            <div style={styles.panelHeader}>
              <div>
                <div style={styles.panelClass}>{selectedPlan.slot.class} · P{selectedPlan.slot.period} · {DAYS.find(function(d) { return d.key === selectedPlan.day; }).label}</div>
                <h2 style={styles.panelTitle}>{selectedPlan.title}</h2>
              </div>
              <button onClick={function() { setSelectedPlan(null); }} style={styles.closeBtn}><X size={20} /></button>
            </div>

            <div style={Object.assign({}, styles.panelStatusBadge, { background: STATUS_CONFIG[selectedPlan.status].bg, color: STATUS_CONFIG[selectedPlan.status].color })}>
              {React.createElement(STATUS_CONFIG[selectedPlan.status].icon, { size: 14 })} {STATUS_CONFIG[selectedPlan.status].label}
              {selectedPlan.feedback && <span style={{ fontWeight: 400, fontStyle: "italic" }}> — "{selectedPlan.feedback}"</span>}
            </div>

            <div style={styles.panelSection}><div style={styles.panelLabel}>Objectives</div><div style={styles.panelText}>{selectedPlan.objectives}</div></div>
            <div style={styles.panelSection}><div style={styles.panelLabel}>Activities</div><div style={styles.panelText}>{selectedPlan.activities}</div></div>

            {/* Attachments */}
            <div style={styles.panelSection}>
              <div style={styles.panelLabel}>Attachments ({selectedPlan.attachments ? selectedPlan.attachments.length : 0})</div>
              {selectedPlan.attachments && selectedPlan.attachments.length > 0 ? (
                <div style={styles.attachList}>
                  {selectedPlan.attachments.map(function(att) {
                    return (
                      <div key={att.id} style={styles.attachItem}>
                        <FileText size={16} color="var(--color-info)" />
                        <div style={{ flex: 1 }}>
                          <div style={styles.attachName}>{att.name}</div>
                          <div style={styles.attachSize}>{formatSize(att.size)}</div>
                        </div>
                        <button style={styles.attachDownload}><Download size={14} /></button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ fontSize: 13, color: "var(--color-slate-light)", fontStyle: "italic" }}>No files attached</div>
              )}
              <button style={styles.addFileBtn}><Paperclip size={14} /> Add File</button>
            </div>

            <div style={styles.panelActions}>
              {selectedPlan.status === "draft" && <button style={styles.panelSubmitBtn}><Send size={14} /> Submit for Approval</button>}
              {selectedPlan.status === "rejected" && <button style={styles.panelEditBtn}><Edit3 size={14} /> Edit & Resubmit</button>}
              {selectedPlan.status === "approved" && !selectedPlan.delivered && <button style={styles.panelDeliverBtn}><Check size={14} /> Mark Delivered</button>}
            </div>
          </div>
        </div>
      )}

      {/* ─── CREATE PLAN MODAL ──────────────────────────────────────── */}
      {showCreateModal && createTarget && (
        <div style={styles.overlay} onClick={function() { setShowCreateModal(false); }}>
          <div style={styles.modal} onClick={function(e) { e.stopPropagation(); }}>
            <div style={styles.modalHeader}>
              <div>
                <div style={styles.modalMeta}>{createTarget.subject} · {createTarget.class} · P{createTarget.period}</div>
                <h2 style={styles.modalTitle}>New Lesson Plan</h2>
              </div>
              <button onClick={function() { setShowCreateModal(false); }} style={styles.closeBtn}><X size={20} /></button>
            </div>

            <div style={styles.modalBody}>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Title *</label>
                <input type="text" value={formData.title} onChange={function(e) { setFormData(Object.assign({}, formData, { title: e.target.value })); }} placeholder="e.g. Algebraic Expressions — Introduction" style={styles.input} />
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Objectives *</label>
                <textarea value={formData.objectives} onChange={function(e) { setFormData(Object.assign({}, formData, { objectives: e.target.value })); }} placeholder="What will learners be able to do?" style={styles.textarea} rows={3} />
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Activities *</label>
                <textarea value={formData.activities} onChange={function(e) { setFormData(Object.assign({}, formData, { activities: e.target.value })); }} placeholder="Describe lesson activities" style={styles.textarea} rows={4} />
              </div>
              <div style={styles.fieldRow}>
                <div style={Object.assign({}, styles.fieldGroup, { flex: 1 })}>
                  <label style={styles.label}>Differentiation</label>
                  <textarea value={formData.differentiation} onChange={function(e) { setFormData(Object.assign({}, formData, { differentiation: e.target.value })); }} placeholder="Support for struggling / extension" style={styles.textarea} rows={2} />
                </div>
                <div style={Object.assign({}, styles.fieldGroup, { flex: 1 })}>
                  <label style={styles.label}>Resources</label>
                  <textarea value={formData.resources_note} onChange={function(e) { setFormData(Object.assign({}, formData, { resources_note: e.target.value })); }} placeholder="Textbooks, worksheets, equipment" style={styles.textarea} rows={2} />
                </div>
              </div>

              {/* File Upload */}
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Attachments</label>
                <div style={styles.dropZone} onClick={function() { fileInputRef.current && fileInputRef.current.click(); }}>
                  <Upload size={20} color="var(--color-slate-light)" />
                  <span style={{ fontSize: 14, fontWeight: 500, color: "var(--color-slate)" }}>Click to upload files</span>
                  <span style={{ fontSize: 12, color: "var(--color-slate-light)" }}>PDF, Word, PowerPoint, Excel, Images</span>
                  <input ref={fileInputRef} type="file" multiple accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.png,.jpg,.jpeg" onChange={handleFileSelect} style={{ display: "none" }} />
                </div>
                {pendingFiles.length > 0 && (
                  <div style={styles.pendingFileList}>
                    {pendingFiles.map(function(file, i) {
                      return (
                        <div key={i} style={styles.pendingFile}>
                          <File size={14} color="var(--color-info)" />
                          <span style={styles.pendingFileName}>{file.name}</span>
                          <span style={styles.pendingFileSize}>{formatSize(file.size)}</span>
                          <button onClick={function() { removePendingFile(i); }} style={styles.removeFileBtn}><X size={14} /></button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div style={styles.modalFooter}>
              <button onClick={function() { setShowCreateModal(false); }} style={styles.cancelBtn}>Cancel</button>
              <button onClick={handleSave} disabled={saving || !formData.title || !formData.objectives} style={Object.assign({}, styles.saveBtn, { opacity: (saving || !formData.title) ? 0.6 : 1 })}>
                {saving ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Save size={16} />}
                Save as Draft
              </button>
              <button onClick={handleSave} disabled={saving || !formData.title || !formData.objectives || !formData.activities} style={Object.assign({}, styles.submitSaveBtn, { opacity: (saving || !formData.title || !formData.activities) ? 0.6 : 1 })}>
                <Send size={16} /> Save & Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── IMPORT MODAL ───────────────────────────────────────────── */}
      {showImportModal && (
        <div style={styles.overlay} onClick={function() { setShowImportModal(false); setImportResult(null); }}>
          <div style={Object.assign({}, styles.modal, { width: 520 })} onClick={function(e) { e.stopPropagation(); }}>
            <div style={styles.modalHeader}>
              <div>
                <h2 style={styles.modalTitle}>Import Lesson Plans</h2>
                <p style={{ fontSize: 13, color: "var(--color-slate)", marginTop: 4 }}>Upload CSV or Excel with your plans</p>
              </div>
              <button onClick={function() { setShowImportModal(false); setImportResult(null); }} style={styles.closeBtn}><X size={20} /></button>
            </div>
            <div style={styles.modalBody}>
              {/* Template download */}
              <div style={styles.templateBox}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <File size={18} color="var(--color-success)" />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>Download Template</div>
                    <div style={{ fontSize: 12, color: "var(--color-slate)" }}>CSV with correct column headers</div>
                  </div>
                </div>
                <button onClick={downloadTemplate} style={styles.templateBtn}><Download size={14} /> Download</button>
              </div>

              {/* Expected columns */}
              <div style={{ padding: "var(--space-sm) 0" }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-slate-light)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Expected columns</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {["day", "period", "title*", "objectives*", "activities", "differentiation", "resources"].map(function(c) {
                    return <span key={c} style={styles.columnChip}>{c}</span>;
                  })}
                </div>
              </div>

              {/* Upload */}
              <div style={styles.dropZone} onClick={function() { importInputRef.current && importInputRef.current.click(); }}>
                <Upload size={24} color="var(--color-slate-light)" />
                <span style={{ fontSize: 14, fontWeight: 500, color: "var(--color-slate)" }}>Click to select your file</span>
                <span style={{ fontSize: 12, color: "var(--color-slate-light)" }}>.csv or .xlsx</span>
                <input ref={importInputRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleImport} style={{ display: "none" }} />
              </div>

              {/* Results */}
              {importResult && (
                <div style={styles.importResults}>
                  {importResult.loading ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center", padding: "var(--space-md)", fontSize: 14, color: "var(--color-slate)" }}>
                      <Loader2 size={20} style={{ animation: "spin 1s linear infinite" }} /> Importing...
                    </div>
                  ) : (
                    <div>
                      <div style={{ display: "flex", gap: "var(--space-lg)", marginBottom: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 14, fontWeight: 600 }}><CheckCircle2 size={16} color="var(--color-success)" /> {importResult.created} created</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 14, fontWeight: 600 }}><AlertCircle size={16} color="var(--color-warning)" /> {importResult.skipped} skipped</div>
                      </div>
                      {importResult.errors.map(function(err, i) {
                        return <div key={i} style={{ fontSize: 13, color: "var(--color-warning)", padding: "2px 0" }}>{err}</div>;
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div style={styles.modalFooter}>
              <button onClick={function() { setShowImportModal(false); setImportResult(null); }} style={styles.cancelBtn}>
                {importResult && !importResult.loading ? "Done" : "Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: "@keyframes spin { to { transform: rotate(360deg); } } @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } } @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } } input:focus, textarea:focus { outline: none; border-color: var(--color-accent) !important; box-shadow: var(--shadow-glow) !important; }" }} />
    </div>
  );
}

var styles = {
  page: { padding: "var(--space-xl)", maxWidth: 1200 },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--space-md)" },
  headerLeft: { display: "flex", alignItems: "center", gap: "var(--space-md)" },
  headerIcon: { width: 48, height: 48, borderRadius: "var(--radius-md)", background: "var(--color-info-light)", display: "flex", alignItems: "center", justifyContent: "center" },
  title: { fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 600, color: "var(--color-navy)", letterSpacing: "-0.02em" },
  subtitle: { fontSize: 14, color: "var(--color-slate)" },
  headerActions: { display: "flex", gap: 8 },
  importBtn: { display: "flex", alignItems: "center", gap: 6, padding: "10px 16px", fontSize: 13, fontWeight: 600, fontFamily: "var(--font-body)", background: "var(--color-surface)", color: "var(--color-navy)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", cursor: "pointer" },
  exportBtn: { display: "flex", alignItems: "center", gap: 6, padding: "10px 16px", fontSize: 13, fontWeight: 600, fontFamily: "var(--font-body)", background: "var(--color-navy)", color: "#FEF3C7", border: "none", borderRadius: "var(--radius-sm)", cursor: "pointer" },

  statsBar: { display: "flex", alignItems: "center", gap: "var(--space-lg)", marginBottom: "var(--space-lg)", padding: "var(--space-md)", background: "var(--color-surface)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border-light)" },
  hStat: { textAlign: "center" },
  hStatValue: { fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700, color: "var(--color-navy)", display: "block" },
  hStatLabel: { fontSize: 11, color: "var(--color-slate-light)" },
  completionWrap: { display: "flex", alignItems: "center", gap: 8, flex: 1, maxWidth: 200 },
  completionBar: { flex: 1, height: 6, background: "var(--color-surface-alt)", borderRadius: 3 },
  completionFill: { height: "100%", background: "var(--color-success)", borderRadius: 3 },
  completionLabel: { fontSize: 13, fontWeight: 600, color: "var(--color-slate)" },

  gridContainer: { overflowX: "auto", marginBottom: "var(--space-md)" },
  grid: { display: "grid", gridTemplateColumns: "80px repeat(5, 1fr)", gap: 2, minWidth: 880 },
  gridCorner: { padding: 10, fontSize: 11, fontWeight: 600, color: "var(--color-slate-light)", textTransform: "uppercase" },
  gridDayHeader: { padding: "10px 8px", fontSize: 13, fontWeight: 700, color: "var(--color-navy)", background: "var(--color-surface)", borderRadius: "var(--radius-sm) var(--radius-sm) 0 0", textAlign: "center", border: "1px solid var(--color-border-light)" },
  gridPeriodLabel: { padding: "10px 6px", textAlign: "center" },
  periodNum: { fontWeight: 700, fontSize: 13, color: "var(--color-navy)" },
  periodTime: { fontSize: 9, color: "var(--color-slate-light)", marginTop: 2 },
  gridCell: { background: "var(--color-surface)", border: "1px solid var(--color-border-light)", borderRadius: "var(--radius-sm)", padding: 8, minHeight: 90, cursor: "pointer" },
  gridCellEmpty: { background: "var(--color-surface-alt)", border: "1px solid var(--color-border-light)", borderRadius: "var(--radius-sm)", padding: 8, minHeight: 90, display: "flex", alignItems: "center", justifyContent: "center" },
  emptyCellText: { color: "var(--color-border)", fontSize: 16 },
  cellClass: { fontSize: 10, fontWeight: 700, color: "var(--color-accent)", marginBottom: 3 },
  cellTitle: { fontSize: 11, fontWeight: 600, color: "var(--color-navy)", lineHeight: 1.3, marginBottom: 4 },
  cellBottom: { display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" },
  cellStatus: { display: "inline-flex", alignItems: "center", gap: 2, padding: "2px 6px", borderRadius: 99, fontSize: 9, fontWeight: 600 },
  cellAttachCount: { display: "inline-flex", alignItems: "center", gap: 2, fontSize: 9, color: "var(--color-slate-light)" },
  cellDelivered: { display: "inline-flex", alignItems: "center", gap: 2, marginTop: 3, fontSize: 9, color: "var(--color-success)", fontWeight: 600 },
  addPlanBtn: { display: "flex", alignItems: "center", gap: 3, width: "100%", marginTop: 6, padding: 6, fontSize: 11, fontWeight: 500, fontFamily: "var(--font-body)", background: "var(--color-surface-alt)", color: "var(--color-slate)", border: "1px dashed var(--color-border)", borderRadius: "var(--radius-sm)", cursor: "pointer", justifyContent: "center" },

  legend: { display: "flex", gap: "var(--space-md)", justifyContent: "center", padding: "var(--space-sm) 0", fontSize: 12, color: "var(--color-slate)" },
  legendItem: { display: "flex", alignItems: "center", gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 2 },

  overlay: { position: "fixed", inset: 0, background: "rgba(15,23,42,0.4)", zIndex: 200, display: "flex", justifyContent: "flex-end", animation: "fadeIn 0.2s" },
  panel: { width: 500, height: "100%", background: "var(--color-surface)", overflowY: "auto", padding: "var(--space-xl)", animation: "slideIn 0.25s ease-out", boxShadow: "var(--shadow-lg)" },
  panelHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--space-lg)" },
  panelClass: { fontSize: 13, color: "var(--color-accent)", fontWeight: 600, marginBottom: 4 },
  panelTitle: { fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 600, color: "var(--color-navy)" },
  closeBtn: { background: "none", border: "none", color: "var(--color-slate-light)", cursor: "pointer", padding: 4 },
  panelStatusBadge: { display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: "var(--radius-sm)", fontSize: 13, fontWeight: 600, marginBottom: "var(--space-lg)" },
  panelSection: { marginBottom: "var(--space-lg)" },
  panelLabel: { fontSize: 12, fontWeight: 600, color: "var(--color-slate-light)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 },
  panelText: { fontSize: 15, color: "var(--color-navy)", lineHeight: 1.6 },
  panelActions: { display: "flex", gap: 8, paddingTop: "var(--space-lg)", borderTop: "1px solid var(--color-border-light)" },
  panelSubmitBtn: { display: "flex", alignItems: "center", gap: 6, padding: "10px 18px", fontSize: 14, fontWeight: 600, fontFamily: "var(--font-body)", background: "var(--color-accent)", color: "#FFF", border: "none", borderRadius: "var(--radius-sm)", cursor: "pointer" },
  panelEditBtn: { display: "flex", alignItems: "center", gap: 6, padding: "10px 18px", fontSize: 14, fontWeight: 600, fontFamily: "var(--font-body)", background: "var(--color-info-light)", color: "var(--color-info)", border: "none", borderRadius: "var(--radius-sm)", cursor: "pointer" },
  panelDeliverBtn: { display: "flex", alignItems: "center", gap: 6, padding: "10px 18px", fontSize: 14, fontWeight: 600, fontFamily: "var(--font-body)", background: "var(--color-success-light)", color: "var(--color-success)", border: "none", borderRadius: "var(--radius-sm)", cursor: "pointer" },

  attachList: { display: "flex", flexDirection: "column", gap: 6 },
  attachItem: { display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "var(--color-surface-alt)", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border-light)" },
  attachName: { fontSize: 13, fontWeight: 600, color: "var(--color-navy)" },
  attachSize: { fontSize: 11, color: "var(--color-slate-light)" },
  attachDownload: { background: "none", border: "none", color: "var(--color-info)", cursor: "pointer", padding: 6 },
  addFileBtn: { display: "flex", alignItems: "center", gap: 6, marginTop: 8, padding: "8px 14px", fontSize: 13, fontWeight: 500, fontFamily: "var(--font-body)", background: "transparent", color: "var(--color-info)", border: "1px dashed var(--color-border)", borderRadius: "var(--radius-sm)", cursor: "pointer" },

  modal: { width: 700, maxHeight: "92vh", background: "var(--color-surface)", borderRadius: "var(--radius-lg)", overflow: "hidden", display: "flex", flexDirection: "column", margin: "auto", animation: "fadeIn 0.2s" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "var(--space-lg)", borderBottom: "1px solid var(--color-border-light)" },
  modalMeta: { fontSize: 13, color: "var(--color-accent)", fontWeight: 600, marginBottom: 4 },
  modalTitle: { fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 600, color: "var(--color-navy)" },
  modalBody: { padding: "var(--space-lg)", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "var(--space-md)" },
  fieldGroup: { display: "flex", flexDirection: "column", gap: "var(--space-xs)" },
  fieldRow: { display: "flex", gap: "var(--space-md)" },
  label: { fontSize: 13, fontWeight: 600, color: "var(--color-slate)" },
  input: { width: "100%", padding: "10px 14px", fontSize: 14, fontFamily: "var(--font-body)", border: "1.5px solid var(--color-border)", borderRadius: "var(--radius-sm)", background: "var(--color-surface)", color: "var(--color-navy)" },
  textarea: { width: "100%", padding: "10px 14px", fontSize: 14, fontFamily: "var(--font-body)", border: "1.5px solid var(--color-border)", borderRadius: "var(--radius-sm)", background: "var(--color-surface)", color: "var(--color-navy)", resize: "vertical", lineHeight: 1.5 },
  dropZone: { display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "var(--space-lg)", border: "2px dashed var(--color-border)", borderRadius: "var(--radius-md)", cursor: "pointer" },
  pendingFileList: { display: "flex", flexDirection: "column", gap: 4, marginTop: 8 },
  pendingFile: { display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: "var(--color-surface-alt)", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border-light)" },
  pendingFileName: { flex: 1, fontSize: 13, fontWeight: 500, color: "var(--color-navy)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  pendingFileSize: { fontSize: 11, color: "var(--color-slate-light)", flexShrink: 0 },
  removeFileBtn: { background: "none", border: "none", color: "var(--color-danger)", cursor: "pointer", padding: 4 },
  modalFooter: { display: "flex", justifyContent: "flex-end", gap: 8, padding: "var(--space-md) var(--space-lg)", borderTop: "1px solid var(--color-border-light)", background: "var(--color-surface-alt)" },
  cancelBtn: { padding: "10px 18px", fontSize: 14, fontWeight: 500, fontFamily: "var(--font-body)", background: "transparent", color: "var(--color-slate)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", cursor: "pointer" },
  saveBtn: { display: "flex", alignItems: "center", gap: 6, padding: "10px 18px", fontSize: 14, fontWeight: 600, fontFamily: "var(--font-body)", background: "var(--color-surface)", color: "var(--color-navy)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", cursor: "pointer" },
  submitSaveBtn: { display: "flex", alignItems: "center", gap: 6, padding: "10px 18px", fontSize: 14, fontWeight: 600, fontFamily: "var(--font-body)", background: "var(--color-accent)", color: "#FFF", border: "none", borderRadius: "var(--radius-sm)", cursor: "pointer" },

  templateBox: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "var(--space-md)", background: "var(--color-success-light)", borderRadius: "var(--radius-md)", border: "1px solid rgba(5,150,105,0.15)" },
  templateBtn: { display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", fontSize: 13, fontWeight: 600, fontFamily: "var(--font-body)", background: "var(--color-surface)", color: "var(--color-success)", border: "1px solid rgba(5,150,105,0.3)", borderRadius: "var(--radius-sm)", cursor: "pointer" },
  columnChip: { padding: "3px 10px", background: "var(--color-surface-alt)", borderRadius: 99, fontSize: 12, fontWeight: 500, color: "var(--color-slate)", border: "1px solid var(--color-border-light)" },
  importResults: { padding: "var(--space-md)", background: "var(--color-surface-alt)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border-light)" },
};
