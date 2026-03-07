import React, { useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";
import {
  BookCopy, Plus, Check, Clock, X, Send,
  Edit3, AlertCircle, CheckCircle2, FileText,
  Save, Loader2, Upload, Download, Paperclip, File,
  ChevronLeft, ChevronRight, Calendar,
} from "lucide-react";

var DAYS = [
  { key: "MON", label: "Monday" },
  { key: "TUE", label: "Tuesday" },
  { key: "WED", label: "Wednesday" },
  { key: "THU", label: "Thursday" },
  { key: "FRI", label: "Friday" },
];

var PERIOD_TIMES = [
  { period: 1, start: "07:45", end: "08:30" },
  { period: 2, start: "08:30", end: "09:15" },
  { period: 3, start: "09:15", end: "10:00" },
  { period: 4, start: "10:20", end: "11:05" },
  { period: 5, start: "11:05", end: "11:50" },
  { period: 6, start: "11:50", end: "12:35" },
  { period: 7, start: "13:00", end: "13:45" },
];

var DEMO = {
  MON: [
    { period: 1, subject: "Mathematics", class: "10A", plan: { id: 1, title: "Number Patterns", status: "approved", objectives: "Identify and extend number patterns", activities: "Group work, worksheet", delivered: true, attachments: [{ id: 1, name: "Worksheet.pdf", type: "pdf", size: 245000 }, { id: 2, name: "Slides.pptx", type: "pptx", size: 1200000 }] } },
    { period: 2, subject: "Mathematics", class: "10B", plan: { id: 2, title: "Number Patterns", status: "approved", objectives: "Identify number patterns", activities: "Group work", delivered: true, attachments: [] } },
    { period: 3, subject: "Mathematics", class: "10C", plan: null },
    { period: 4, subject: "Mathematics", class: "11A", plan: { id: 4, title: "Quadratic Equations", status: "pending", objectives: "Solve by factoring", activities: "Demo, practice", attachments: [{ id: 3, name: "Notes.docx", type: "docx", size: 89000 }] } },
    { period: 5, subject: "Mathematics", class: "11B", plan: null },
  ],
  TUE: [
    { period: 1, subject: "Mathematics", class: "10A", plan: { id: 5, title: "Algebraic Expressions", status: "approved", objectives: "Simplify expressions", activities: "Demo, practice", attachments: [] } },
    { period: 2, subject: "Mathematics", class: "10B", plan: { id: 6, title: "Algebraic Expressions", status: "draft", objectives: "Simplify expressions", activities: "Demo, practice", attachments: [] } },
    { period: 4, subject: "Mathematics", class: "11A", plan: null },
    { period: 5, subject: "Mathematics", class: "11B", plan: { id: 8, title: "Trig Ratios", status: "rejected", objectives: "Calculate trig ratios", activities: "Discovery", feedback: "Needs differentiation.", attachments: [] } },
  ],
  WED: [
    { period: 1, subject: "Mathematics", class: "10A", plan: { id: 9, title: "Exponents", status: "approved", objectives: "Apply exponent laws", activities: "Examples, exit ticket", attachments: [{ id: 4, name: "Exponents.xlsx", type: "xlsx", size: 56000 }] } },
    { period: 3, subject: "Mathematics", class: "10C", plan: null },
    { period: 5, subject: "Mathematics", class: "11B", plan: null },
    { period: 7, subject: "Mathematics", class: "12A", plan: { id: 11, title: "Calculus Limits", status: "approved", objectives: "Understand limits", activities: "GeoGebra", attachments: [] } },
  ],
  THU: [
    { period: 2, subject: "Mathematics", class: "10B", plan: null },
    { period: 3, subject: "Mathematics", class: "10C", plan: null },
    { period: 4, subject: "Mathematics", class: "11A", plan: { id: 13, title: "Quadratic Formula", status: "draft", objectives: "Derive formula", activities: "Guided derivation", attachments: [] } },
    { period: 7, subject: "Mathematics", class: "12A", plan: null },
  ],
  FRI: [
    { period: 1, subject: "Mathematics", class: "10A", plan: { id: 15, title: "Exponents Practice", status: "approved", objectives: "Consolidate laws", activities: "Worksheet, peer marking", attachments: [] } },
    { period: 2, subject: "Mathematics", class: "10B", plan: null },
    { period: 3, subject: "Mathematics", class: "10C", plan: null },
    { period: 5, subject: "Mathematics", class: "11B", plan: null },
    { period: 7, subject: "Mathematics", class: "12A", plan: null },
  ],
};

var SC = {
  approved: { label: "Approved", color: "var(--color-success)", bg: "var(--color-success-light)", icon: CheckCircle2 },
  pending: { label: "Pending", color: "var(--color-accent)", bg: "var(--color-accent-light)", icon: Clock },
  draft: { label: "Draft", color: "var(--color-slate)", bg: "var(--color-surface-alt)", icon: Edit3 },
  rejected: { label: "Rejected", color: "var(--color-danger)", bg: "var(--color-danger-light)", icon: X },
};

function fmtSize(b) {
  if (b < 1024) return b + " B";
  if (b < 1048576) return (b / 1024).toFixed(1) + " KB";
  return (b / 1048576).toFixed(1) + " MB";
}

function getMonday(d) {
  var dt = new Date(d);
  var day = dt.getDay();
  var diff = dt.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(dt.setDate(diff));
}

function getWeekNum(d) {
  var dt = new Date(d);
  dt.setHours(0, 0, 0, 0);
  dt.setDate(dt.getDate() + 3 - (dt.getDay() + 6) % 7);
  var w1 = new Date(dt.getFullYear(), 0, 4);
  return 1 + Math.round(((dt.getTime() - w1.getTime()) / 86400000 - 3 + (w1.getDay() + 6) % 7) / 7);
}

function fmtDate(d) {
  return d.toLocaleDateString("en-ZA", { day: "numeric", month: "short" });
}

export default function WeeklyPlannerPage() {
  var auth = useAuth();
  var user = auth.user;
  var fileRef = useRef(null);
  var panelFileRef = useRef(null);
  var importRef = useRef(null);
  var today = new Date();
  var monday0 = getMonday(today);

  var s1 = useState(0); var weekOff = s1[0]; var setWeekOff = s1[1];
  var s2 = useState(null); var selPlan = s2[0]; var setSelPlan = s2[1];
  var s3 = useState(false); var showCreate = s3[0]; var setShowCreate = s3[1];
  var s4 = useState(null); var target = s4[0]; var setTarget = s4[1];
  var s5 = useState(false); var showImport = s5[0]; var setShowImport = s5[1];
  var s6 = useState(null); var impResult = s6[0]; var setImpResult = s6[1];
  var s7 = useState({ title: "", objectives: "", activities: "", differentiation: "", resources_note: "" }); var form = s7[0]; var setForm = s7[1];
  var s8 = useState([]); var pending = s8[0]; var setPending = s8[1];
  var s9 = useState(false); var saving = s9[0]; var setSaving = s9[1];

  var curMon = new Date(monday0); curMon.setDate(curMon.getDate() + weekOff * 7);
  var curFri = new Date(curMon); curFri.setDate(curFri.getDate() + 4);
  var wn = getWeekNum(curMon);
  var isCur = weekOff === 0;
  var wDates = [];
  for (var i = 0; i < 5; i++) { var dd = new Date(curMon); dd.setDate(dd.getDate() + i); wDates.push(dd); }

  var tot = Object.values(DEMO).reduce(function(a, b) { return a + b.length; }, 0);
  var made = Object.values(DEMO).reduce(function(a, b) { return a + b.filter(function(x) { return x.plan; }).length; }, 0);
  var miss = tot - made;
  var appd = Object.values(DEMO).reduce(function(a, b) { return a + b.filter(function(x) { return x.plan && x.plan.status === "approved"; }).length; }, 0);

  function openC(day, sl) {
    setTarget({ period: sl.period, day: day, subject: sl.subject, class: sl.class });
    setForm({ title: "", objectives: "", activities: "", differentiation: "", resources_note: "" });
    setPending([]);
    setShowCreate(true);
  }

  async function doSave() { setSaving(true); await new Promise(function(r) { setTimeout(r, 800); }); setSaving(false); setShowCreate(false); }

  function onFiles(e) { setPending(function(p) { return p.concat(Array.from(e.target.files)); }); e.target.value = ""; }

  function onPanelFiles(e) {
    var fs = Array.from(e.target.files).map(function(f, idx) {
      return { id: Date.now() + idx, name: f.name, type: f.name.split(".").pop(), size: f.size, url: URL.createObjectURL(f) };
    });
    if (selPlan) {
      var atts = (selPlan.attachments || []).concat(fs);
      setSelPlan(Object.assign({}, selPlan, { attachments: atts }));
    }
    e.target.value = "";
  }

  function dlFile(att) {
    var a = document.createElement("a");
    a.href = att.url || "#";
    a.download = att.name;
    if (att.url) { document.body.appendChild(a); a.click(); document.body.removeChild(a); }
    else { alert("Download: " + att.name + "\nConnects to server in production."); }
  }

  function rmFile(idx) { setPending(function(p) { return p.filter(function(_, j) { return j !== idx; }); }); }

  async function doImport(e) {
    if (!e.target.files[0]) return;
    setImpResult({ loading: true });
    await new Promise(function(r) { setTimeout(r, 1500); });
    setImpResult({ loading: false, created: 3, skipped: 1, errors: ["Row 5: Already exists"], total_rows: 4 });
    e.target.value = "";
  }

  function doExport(f) { alert("Export " + f.toUpperCase() + "\n/api/v1/planning/export/?format=" + f); }

  function dlTemplate() {
    var csv = "day,period,title,objectives,activities,differentiation,resources\nMonday,1,Example,Learners will...,Activity 1,Support,Textbook";
    var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = "lesson_plan_template.csv"; document.body.appendChild(a); a.click(); document.body.removeChild(a);
  }

  var S = styles;

  return (
    <div style={S.page}>
      <div style={S.header}>
        <div style={S.headerLeft}>
          <div style={S.headerIcon}><BookCopy size={22} color="var(--color-info)" /></div>
          <div><h1 style={S.title}>Weekly Lesson Planner</h1><p style={S.subtitle}>Term 1, 2026 · Mathematics</p></div>
        </div>
        <div style={S.headerActs}>
          <button onClick={function() { setShowImport(true); }} style={S.impBtn}><Upload size={15} /> Import Excel</button>
          <button onClick={function() { doExport("xlsx"); }} style={S.expBtn}><Download size={15} /> Export</button>
        </div>
      </div>

      <div style={S.weekNav}>
        <button onClick={function() { setWeekOff(weekOff - 1); }} style={S.wBtn}><ChevronLeft size={18} /></button>
        <div style={S.weekInfo}>
          <div style={S.weekLabel}><Calendar size={15} color="var(--color-accent)" /><span style={S.weekTitle}>Week {wn}</span>{isCur && <span style={S.curBadge}>Current</span>}</div>
          <div style={S.weekDates}>{fmtDate(curMon)} — {fmtDate(curFri)}, {curMon.getFullYear()}</div>
        </div>
        <button onClick={function() { setWeekOff(weekOff + 1); }} style={S.wBtn}><ChevronRight size={18} /></button>
        {!isCur && <button onClick={function() { setWeekOff(0); }} style={S.todayBtn}>Today</button>}
      </div>

      <div style={S.statsBar}>
        <div style={S.hStat}><span style={S.hVal}>{made}/{tot}</span><span style={S.hLbl}>Created</span></div>
        <div style={S.hStat}><span style={Object.assign({}, S.hVal, { color: "var(--color-success)" })}>{appd}</span><span style={S.hLbl}>Approved</span></div>
        <div style={S.hStat}><span style={Object.assign({}, S.hVal, { color: miss > 0 ? "var(--color-danger)" : "var(--color-success)" })}>{miss}</span><span style={S.hLbl}>Missing</span></div>
        <div style={{ flex: 1 }} />
        <div style={S.compWrap}><div style={S.compBar}><div style={Object.assign({}, S.compFill, { width: Math.round(made / tot * 100) + "%" })} /></div><span style={S.compLbl}>{Math.round(made / tot * 100)}%</span></div>
      </div>

      <div style={S.gridWrap}><div style={S.grid}>
        <div style={S.corner}>Period</div>
        {DAYS.map(function(day, idx) {
          var isT = isCur && wDates[idx].toDateString() === today.toDateString();
          return <div key={day.key} style={Object.assign({}, S.dayH, isT ? { background: "var(--color-accent-light)", borderColor: "var(--color-accent)" } : {})}><div style={S.dayN}>{day.label}</div><div style={Object.assign({}, S.dayD, isT ? { color: "var(--color-accent)", fontWeight: 700 } : {})}>{fmtDate(wDates[idx])}</div></div>;
        })}
        {PERIOD_TIMES.map(function(pt) {
          return <React.Fragment key={pt.period}>
            <div style={S.pLabel}><div style={S.pNum}>P{pt.period}</div><div style={S.pTime}>{pt.start}–{pt.end}</div></div>
            {DAYS.map(function(day) {
              var sl = (DEMO[day.key] || []).find(function(s) { return s.period === pt.period; });
              if (!sl) return <div key={day.key} style={S.cellE}><span style={S.cellET}>—</span></div>;
              var pl = sl.plan; var sc = pl ? SC[pl.status] : null; var Icon = sc ? sc.icon : null;
              return <div key={day.key} style={Object.assign({}, S.cell, { borderTop: pl ? "3px solid " + sc.color : "3px solid var(--color-border-light)" })} onClick={function() { pl ? setSelPlan(Object.assign({}, pl, { slot: sl, day: day.key })) : openC(day.key, sl); }}>
                <div style={S.cCls}>{sl.class}</div>
                {pl ? <div><div style={S.cTitle}>{pl.title}</div><div style={S.cBot}><div style={Object.assign({}, S.cStat, { background: sc.bg, color: sc.color })}><Icon size={11} /> {sc.label}</div>{pl.attachments && pl.attachments.length > 0 && <div style={S.cAtt}><Paperclip size={10} /> {pl.attachments.length}</div>}</div>{pl.delivered && <div style={S.cDel}><Check size={11} /> Delivered</div>}</div>
                : <button style={S.addBtn} onClick={function(e) { e.stopPropagation(); openC(day.key, sl); }}><Plus size={14} /> Add Plan</button>}
              </div>;
            })}
          </React.Fragment>;
        })}
      </div></div>

      <div style={S.legend}>{Object.entries(SC).map(function(e) { return <div key={e[0]} style={S.legItem}><div style={Object.assign({}, S.legDot, { background: e[1].color })} />{e[1].label}</div>; })}<div style={S.legItem}><Paperclip size={12} /> Files</div></div>

      {selPlan && <div style={S.overlay} onClick={function() { setSelPlan(null); }}><div style={S.panel} onClick={function(e) { e.stopPropagation(); }}>
        <div style={S.panelH}><div><div style={S.panelCls}>{selPlan.slot.class} · P{selPlan.slot.period} · {DAYS.find(function(d) { return d.key === selPlan.day; }).label}</div><h2 style={S.panelT}>{selPlan.title}</h2></div><button onClick={function() { setSelPlan(null); }} style={S.closeBtn}><X size={20} /></button></div>
        <div style={Object.assign({}, S.badge, { background: SC[selPlan.status].bg, color: SC[selPlan.status].color })}>{React.createElement(SC[selPlan.status].icon, { size: 14 })} {SC[selPlan.status].label}{selPlan.feedback && <span style={{ fontWeight: 400, fontStyle: "italic" }}> — "{selPlan.feedback}"</span>}</div>
        <div style={S.sec}><div style={S.secL}>Objectives</div><div style={S.secT}>{selPlan.objectives}</div></div>
        <div style={S.sec}><div style={S.secL}>Activities</div><div style={S.secT}>{selPlan.activities}</div></div>
        <div style={S.sec}>
          <div style={S.secL}>Attachments ({selPlan.attachments ? selPlan.attachments.length : 0})</div>
          {selPlan.attachments && selPlan.attachments.length > 0 ? <div style={S.attList}>{selPlan.attachments.map(function(a) {
            return <div key={a.id} style={S.attItem}><FileText size={16} color="var(--color-info)" /><div style={{ flex: 1, minWidth: 0 }}><div style={S.attN}>{a.name}</div><div style={S.attS}>{fmtSize(a.size)}</div></div><button onClick={function() { dlFile(a); }} style={S.dlBtn}><Download size={14} /> Download</button></div>;
          })}</div> : <div style={{ fontSize: 13, color: "var(--color-slate-light)", fontStyle: "italic", padding: "8px 0" }}>No files attached</div>}
          <input ref={panelFileRef} type="file" multiple accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.png,.jpg,.jpeg" onChange={onPanelFiles} style={{ display: "none" }} />
          <button onClick={function() { panelFileRef.current.click(); }} style={S.upBtn}><Upload size={14} /> Upload Files</button>
        </div>
        <div style={S.panelActs}>
          {selPlan.status === "draft" && <button style={S.submitBtn}><Send size={14} /> Submit</button>}
          {selPlan.status === "rejected" && <button style={S.editBtn}><Edit3 size={14} /> Edit</button>}
          {selPlan.status === "approved" && !selPlan.delivered && <button style={S.delivBtn}><Check size={14} /> Delivered</button>}
        </div>
      </div></div>}

      {showCreate && target && <div style={S.overlay} onClick={function() { setShowCreate(false); }}><div style={S.modal} onClick={function(e) { e.stopPropagation(); }}>
        <div style={S.modH}><div><div style={S.modMeta}>{target.subject} · {target.class} · P{target.period}</div><h2 style={S.modTitle}>New Lesson Plan</h2></div><button onClick={function() { setShowCreate(false); }} style={S.closeBtn}><X size={20} /></button></div>
        <div style={S.modBody}>
          <div style={S.fg}><label style={S.lb}>Title *</label><input type="text" value={form.title} onChange={function(e) { setForm(Object.assign({}, form, { title: e.target.value })); }} placeholder="e.g. Algebraic Expressions" style={S.inp} /></div>
          <div style={S.fg}><label style={S.lb}>Objectives *</label><textarea value={form.objectives} onChange={function(e) { setForm(Object.assign({}, form, { objectives: e.target.value })); }} placeholder="What will learners do?" style={S.ta} rows={3} /></div>
          <div style={S.fg}><label style={S.lb}>Activities *</label><textarea value={form.activities} onChange={function(e) { setForm(Object.assign({}, form, { activities: e.target.value })); }} placeholder="Describe activities" style={S.ta} rows={4} /></div>
          <div style={S.fr}>
            <div style={Object.assign({}, S.fg, { flex: 1 })}><label style={S.lb}>Differentiation</label><textarea value={form.differentiation} onChange={function(e) { setForm(Object.assign({}, form, { differentiation: e.target.value })); }} placeholder="Support / extension" style={S.ta} rows={2} /></div>
            <div style={Object.assign({}, S.fg, { flex: 1 })}><label style={S.lb}>Resources</label><textarea value={form.resources_note} onChange={function(e) { setForm(Object.assign({}, form, { resources_note: e.target.value })); }} placeholder="Textbooks, worksheets" style={S.ta} rows={2} /></div>
          </div>
          <div style={S.fg}><label style={S.lb}>Attachments</label>
            <div style={S.drop} onClick={function() { fileRef.current.click(); }}><Upload size={20} color="var(--color-slate-light)" /><span style={{ fontSize: 14, fontWeight: 500, color: "var(--color-slate)" }}>Click to upload files</span><span style={{ fontSize: 12, color: "var(--color-slate-light)" }}>PDF, Word, PowerPoint, Excel, Images</span><input ref={fileRef} type="file" multiple accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.png,.jpg,.jpeg" onChange={onFiles} style={{ display: "none" }} /></div>
            {pending.length > 0 && <div style={S.pfList}>{pending.map(function(f, i) { return <div key={i} style={S.pf}><File size={14} color="var(--color-info)" /><span style={S.pfN}>{f.name}</span><span style={S.pfS}>{fmtSize(f.size)}</span><button onClick={function() { rmFile(i); }} style={S.rmBtn}><X size={14} /></button></div>; })}</div>}
          </div>
        </div>
        <div style={S.modFt}>
          <button onClick={function() { setShowCreate(false); }} style={S.canBtn}>Cancel</button>
          <button onClick={doSave} disabled={saving || !form.title || !form.objectives} style={Object.assign({}, S.savBtn, { opacity: saving || !form.title ? 0.6 : 1 })}>{saving ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Save size={16} />} Save Draft</button>
          <button onClick={doSave} disabled={saving || !form.title || !form.objectives || !form.activities} style={Object.assign({}, S.subBtn, { opacity: saving || !form.activities ? 0.6 : 1 })}><Send size={16} /> Save & Submit</button>
        </div>
      </div></div>}

      {showImport && <div style={S.overlay} onClick={function() { setShowImport(false); setImpResult(null); }}><div style={Object.assign({}, S.modal, { width: 520 })} onClick={function(e) { e.stopPropagation(); }}>
        <div style={S.modH}><div><h2 style={S.modTitle}>Import Lesson Plans</h2><p style={{ fontSize: 13, color: "var(--color-slate)", marginTop: 4 }}>Upload CSV or Excel</p></div><button onClick={function() { setShowImport(false); setImpResult(null); }} style={S.closeBtn}><X size={20} /></button></div>
        <div style={S.modBody}>
          <div style={S.tplBox}><div style={{ display: "flex", alignItems: "center", gap: 10 }}><File size={18} color="var(--color-success)" /><div><div style={{ fontWeight: 600, fontSize: 14 }}>Download Template</div><div style={{ fontSize: 12, color: "var(--color-slate)" }}>CSV with correct headers</div></div></div><button onClick={dlTemplate} style={S.tplBtn}><Download size={14} /> Download</button></div>
          <div style={{ padding: "var(--space-sm) 0" }}><div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-slate-light)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Expected columns</div><div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>{["day", "period", "title*", "objectives*", "activities", "differentiation", "resources"].map(function(c) { return <span key={c} style={S.chip}>{c}</span>; })}</div></div>
          <div style={S.drop} onClick={function() { importRef.current.click(); }}><Upload size={24} color="var(--color-slate-light)" /><span style={{ fontSize: 14, fontWeight: 500, color: "var(--color-slate)" }}>Click to select file</span><span style={{ fontSize: 12, color: "var(--color-slate-light)" }}>.csv or .xlsx</span><input ref={importRef} type="file" accept=".csv,.xlsx,.xls" onChange={doImport} style={{ display: "none" }} /></div>
          {impResult && <div style={S.impRes}>{impResult.loading ? <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center", padding: "var(--space-md)", fontSize: 14 }}><Loader2 size={20} style={{ animation: "spin 1s linear infinite" }} /> Importing...</div> : <div><div style={{ display: "flex", gap: "var(--space-lg)", marginBottom: 8 }}><div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 14, fontWeight: 600 }}><CheckCircle2 size={16} color="var(--color-success)" /> {impResult.created} created</div><div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 14, fontWeight: 600 }}><AlertCircle size={16} color="var(--color-warning)" /> {impResult.skipped} skipped</div></div>{impResult.errors.map(function(err, i) { return <div key={i} style={{ fontSize: 13, color: "var(--color-warning)", padding: "2px 0" }}>{err}</div>; })}</div>}</div>}
        </div>
        <div style={S.modFt}><button onClick={function() { setShowImport(false); setImpResult(null); }} style={S.canBtn}>{impResult && !impResult.loading ? "Done" : "Cancel"}</button></div>
      </div></div>}

      <style dangerouslySetInnerHTML={{ __html: "@keyframes spin{to{transform:rotate(360deg)}}@keyframes slideIn{from{transform:translateX(100%)}to{transform:translateX(0)}}@keyframes fadeIn{from{opacity:0}to{opacity:1}}input:focus,textarea:focus{outline:none;border-color:var(--color-accent)!important;box-shadow:var(--shadow-glow)!important}" }} />
    </div>
  );
}

var styles = {
  page:{padding:"var(--space-xl)",maxWidth:1200},
  header:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"var(--space-md)"},
  headerLeft:{display:"flex",alignItems:"center",gap:"var(--space-md)"},
  headerIcon:{width:48,height:48,borderRadius:"var(--radius-md)",background:"var(--color-info-light)",display:"flex",alignItems:"center",justifyContent:"center"},
  title:{fontFamily:"var(--font-display)",fontSize:24,fontWeight:600,color:"var(--color-navy)",letterSpacing:"-0.02em"},
  subtitle:{fontSize:14,color:"var(--color-slate)"},
  headerActs:{display:"flex",gap:8},
  impBtn:{display:"flex",alignItems:"center",gap:6,padding:"10px 16px",fontSize:13,fontWeight:600,fontFamily:"var(--font-body)",background:"var(--color-surface)",color:"var(--color-navy)",border:"1px solid var(--color-border)",borderRadius:"var(--radius-sm)",cursor:"pointer"},
  expBtn:{display:"flex",alignItems:"center",gap:6,padding:"10px 16px",fontSize:13,fontWeight:600,fontFamily:"var(--font-body)",background:"var(--color-navy)",color:"#FEF3C7",border:"none",borderRadius:"var(--radius-sm)",cursor:"pointer"},
  weekNav:{display:"flex",alignItems:"center",gap:"var(--space-md)",marginBottom:"var(--space-md)",padding:"var(--space-md)",background:"var(--color-surface)",borderRadius:"var(--radius-md)",border:"1px solid var(--color-border-light)"},
  wBtn:{width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",background:"var(--color-surface-alt)",border:"1px solid var(--color-border-light)",borderRadius:"var(--radius-sm)",cursor:"pointer",color:"var(--color-navy)"},
  weekInfo:{flex:1,textAlign:"center"},
  weekLabel:{display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:2},
  weekTitle:{fontFamily:"var(--font-display)",fontSize:18,fontWeight:700,color:"var(--color-navy)"},
  curBadge:{fontSize:10,fontWeight:700,color:"#FFF",background:"var(--color-accent)",padding:"2px 8px",borderRadius:99,letterSpacing:"0.05em"},
  weekDates:{fontSize:13,color:"var(--color-slate)"},
  todayBtn:{padding:"8px 16px",fontSize:13,fontWeight:600,fontFamily:"var(--font-body)",background:"var(--color-accent-light)",color:"var(--color-accent)",border:"1px solid rgba(217,119,6,0.2)",borderRadius:"var(--radius-sm)",cursor:"pointer"},
  statsBar:{display:"flex",alignItems:"center",gap:"var(--space-lg)",marginBottom:"var(--space-md)",padding:"var(--space-sm) var(--space-md)"},
  hStat:{textAlign:"center"},hVal:{fontFamily:"var(--font-display)",fontSize:20,fontWeight:700,color:"var(--color-navy)",display:"block"},hLbl:{fontSize:11,color:"var(--color-slate-light)"},
  compWrap:{display:"flex",alignItems:"center",gap:8,flex:1,maxWidth:200},compBar:{flex:1,height:6,background:"var(--color-surface-alt)",borderRadius:3},compFill:{height:"100%",background:"var(--color-success)",borderRadius:3},compLbl:{fontSize:13,fontWeight:600,color:"var(--color-slate)"},
  gridWrap:{overflowX:"auto",marginBottom:"var(--space-md)"},grid:{display:"grid",gridTemplateColumns:"80px repeat(5, 1fr)",gap:2,minWidth:880},
  corner:{padding:10,fontSize:11,fontWeight:600,color:"var(--color-slate-light)",textTransform:"uppercase"},
  dayH:{padding:"10px 8px",background:"var(--color-surface)",borderRadius:"var(--radius-sm) var(--radius-sm) 0 0",textAlign:"center",border:"1px solid var(--color-border-light)"},
  dayN:{fontSize:13,fontWeight:700,color:"var(--color-navy)"},dayD:{fontSize:11,color:"var(--color-slate-light)",marginTop:2},
  pLabel:{padding:"10px 6px",textAlign:"center"},pNum:{fontWeight:700,fontSize:13,color:"var(--color-navy)"},pTime:{fontSize:9,color:"var(--color-slate-light)",marginTop:2},
  cell:{background:"var(--color-surface)",border:"1px solid var(--color-border-light)",borderRadius:"var(--radius-sm)",padding:8,minHeight:90,cursor:"pointer"},
  cellE:{background:"var(--color-surface-alt)",border:"1px solid var(--color-border-light)",borderRadius:"var(--radius-sm)",padding:8,minHeight:90,display:"flex",alignItems:"center",justifyContent:"center"},cellET:{color:"var(--color-border)",fontSize:16},
  cCls:{fontSize:10,fontWeight:700,color:"var(--color-accent)",marginBottom:3},cTitle:{fontSize:11,fontWeight:600,color:"var(--color-navy)",lineHeight:1.3,marginBottom:4},
  cBot:{display:"flex",alignItems:"center",gap:4,flexWrap:"wrap"},cStat:{display:"inline-flex",alignItems:"center",gap:2,padding:"2px 6px",borderRadius:99,fontSize:9,fontWeight:600},cAtt:{display:"inline-flex",alignItems:"center",gap:2,fontSize:9,color:"var(--color-slate-light)"},cDel:{display:"inline-flex",alignItems:"center",gap:2,marginTop:3,fontSize:9,color:"var(--color-success)",fontWeight:600},
  addBtn:{display:"flex",alignItems:"center",gap:3,width:"100%",marginTop:6,padding:6,fontSize:11,fontWeight:500,fontFamily:"var(--font-body)",background:"var(--color-surface-alt)",color:"var(--color-slate)",border:"1px dashed var(--color-border)",borderRadius:"var(--radius-sm)",cursor:"pointer",justifyContent:"center"},
  legend:{display:"flex",gap:"var(--space-md)",justifyContent:"center",padding:"var(--space-sm) 0",fontSize:12,color:"var(--color-slate)"},legItem:{display:"flex",alignItems:"center",gap:5},legDot:{width:8,height:8,borderRadius:2},
  overlay:{position:"fixed",inset:0,background:"rgba(15,23,42,0.4)",zIndex:200,display:"flex",justifyContent:"flex-end",animation:"fadeIn 0.2s"},
  panel:{width:500,height:"100%",background:"var(--color-surface)",overflowY:"auto",padding:"var(--space-xl)",animation:"slideIn 0.25s ease-out",boxShadow:"var(--shadow-lg)"},
  panelH:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"var(--space-lg)"},panelCls:{fontSize:13,color:"var(--color-accent)",fontWeight:600,marginBottom:4},panelT:{fontFamily:"var(--font-display)",fontSize:22,fontWeight:600,color:"var(--color-navy)"},
  closeBtn:{background:"none",border:"none",color:"var(--color-slate-light)",cursor:"pointer",padding:4},
  badge:{display:"inline-flex",alignItems:"center",gap:6,padding:"8px 14px",borderRadius:"var(--radius-sm)",fontSize:13,fontWeight:600,marginBottom:"var(--space-lg)"},
  sec:{marginBottom:"var(--space-lg)"},secL:{fontSize:12,fontWeight:600,color:"var(--color-slate-light)",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:8},secT:{fontSize:15,color:"var(--color-navy)",lineHeight:1.6},
  panelActs:{display:"flex",gap:8,paddingTop:"var(--space-lg)",borderTop:"1px solid var(--color-border-light)"},
  submitBtn:{display:"flex",alignItems:"center",gap:6,padding:"10px 18px",fontSize:14,fontWeight:600,fontFamily:"var(--font-body)",background:"var(--color-accent)",color:"#FFF",border:"none",borderRadius:"var(--radius-sm)",cursor:"pointer"},
  editBtn:{display:"flex",alignItems:"center",gap:6,padding:"10px 18px",fontSize:14,fontWeight:600,fontFamily:"var(--font-body)",background:"var(--color-info-light)",color:"var(--color-info)",border:"none",borderRadius:"var(--radius-sm)",cursor:"pointer"},
  delivBtn:{display:"flex",alignItems:"center",gap:6,padding:"10px 18px",fontSize:14,fontWeight:600,fontFamily:"var(--font-body)",background:"var(--color-success-light)",color:"var(--color-success)",border:"none",borderRadius:"var(--radius-sm)",cursor:"pointer"},
  attList:{display:"flex",flexDirection:"column",gap:6},attItem:{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:"var(--color-surface-alt)",borderRadius:"var(--radius-sm)",border:"1px solid var(--color-border-light)"},attN:{fontSize:13,fontWeight:600,color:"var(--color-navy)"},attS:{fontSize:11,color:"var(--color-slate-light)"},
  dlBtn:{display:"flex",alignItems:"center",gap:4,padding:"6px 12px",fontSize:12,fontWeight:600,fontFamily:"var(--font-body)",background:"var(--color-info-light)",color:"var(--color-info)",border:"none",borderRadius:"var(--radius-sm)",cursor:"pointer",flexShrink:0},
  upBtn:{display:"flex",alignItems:"center",gap:6,marginTop:10,padding:"10px 16px",fontSize:13,fontWeight:600,fontFamily:"var(--font-body)",background:"var(--color-info-light)",color:"var(--color-info)",border:"1px solid rgba(37,99,235,0.15)",borderRadius:"var(--radius-sm)",cursor:"pointer"},
  modal:{width:700,maxHeight:"92vh",background:"var(--color-surface)",borderRadius:"var(--radius-lg)",overflow:"hidden",display:"flex",flexDirection:"column",margin:"auto",animation:"fadeIn 0.2s"},
  modH:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",padding:"var(--space-lg)",borderBottom:"1px solid var(--color-border-light)"},modMeta:{fontSize:13,color:"var(--color-accent)",fontWeight:600,marginBottom:4},modTitle:{fontFamily:"var(--font-display)",fontSize:20,fontWeight:600,color:"var(--color-navy)"},
  modBody:{padding:"var(--space-lg)",overflowY:"auto",flex:1,display:"flex",flexDirection:"column",gap:"var(--space-md)"},
  fg:{display:"flex",flexDirection:"column",gap:"var(--space-xs)"},fr:{display:"flex",gap:"var(--space-md)"},lb:{fontSize:13,fontWeight:600,color:"var(--color-slate)"},
  inp:{width:"100%",padding:"10px 14px",fontSize:14,fontFamily:"var(--font-body)",border:"1.5px solid var(--color-border)",borderRadius:"var(--radius-sm)",background:"var(--color-surface)",color:"var(--color-navy)"},
  ta:{width:"100%",padding:"10px 14px",fontSize:14,fontFamily:"var(--font-body)",border:"1.5px solid var(--color-border)",borderRadius:"var(--radius-sm)",background:"var(--color-surface)",color:"var(--color-navy)",resize:"vertical",lineHeight:1.5},
  drop:{display:"flex",flexDirection:"column",alignItems:"center",gap:6,padding:"var(--space-lg)",border:"2px dashed var(--color-border)",borderRadius:"var(--radius-md)",cursor:"pointer"},
  pfList:{display:"flex",flexDirection:"column",gap:4,marginTop:8},pf:{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",background:"var(--color-surface-alt)",borderRadius:"var(--radius-sm)",border:"1px solid var(--color-border-light)"},pfN:{flex:1,fontSize:13,fontWeight:500,color:"var(--color-navy)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"},pfS:{fontSize:11,color:"var(--color-slate-light)",flexShrink:0},rmBtn:{background:"none",border:"none",color:"var(--color-danger)",cursor:"pointer",padding:4},
  modFt:{display:"flex",justifyContent:"flex-end",gap:8,padding:"var(--space-md) var(--space-lg)",borderTop:"1px solid var(--color-border-light)",background:"var(--color-surface-alt)"},
  canBtn:{padding:"10px 18px",fontSize:14,fontWeight:500,fontFamily:"var(--font-body)",background:"transparent",color:"var(--color-slate)",border:"1px solid var(--color-border)",borderRadius:"var(--radius-sm)",cursor:"pointer"},
  savBtn:{display:"flex",alignItems:"center",gap:6,padding:"10px 18px",fontSize:14,fontWeight:600,fontFamily:"var(--font-body)",background:"var(--color-surface)",color:"var(--color-navy)",border:"1px solid var(--color-border)",borderRadius:"var(--radius-sm)",cursor:"pointer"},
  subBtn:{display:"flex",alignItems:"center",gap:6,padding:"10px 18px",fontSize:14,fontWeight:600,fontFamily:"var(--font-body)",background:"var(--color-accent)",color:"#FFF",border:"none",borderRadius:"var(--radius-sm)",cursor:"pointer"},
  tplBox:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"var(--space-md)",background:"var(--color-success-light)",borderRadius:"var(--radius-md)",border:"1px solid rgba(5,150,105,0.15)"},
  tplBtn:{display:"flex",alignItems:"center",gap:6,padding:"8px 14px",fontSize:13,fontWeight:600,fontFamily:"var(--font-body)",background:"var(--color-surface)",color:"var(--color-success)",border:"1px solid rgba(5,150,105,0.3)",borderRadius:"var(--radius-sm)",cursor:"pointer"},
  chip:{padding:"3px 10px",background:"var(--color-surface-alt)",borderRadius:99,fontSize:12,fontWeight:500,color:"var(--color-slate)",border:"1px solid var(--color-border-light)"},
  impRes:{padding:"var(--space-md)",background:"var(--color-surface-alt)",borderRadius:"var(--radius-md)",border:"1px solid var(--color-border-light)"},
};
