import React, { useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useLocation } from "react-router-dom";
import {
  BookCopy, Plus, Check, Clock, X, Send, Edit3, AlertCircle,
  CheckCircle2, FileText, Save, Loader2, Upload, Download,
  Paperclip, File, ChevronLeft, ChevronRight, Calendar,
  Palette, Circle, Square, Triangle, Diamond, Star, Hexagon, Trash2,
} from "lucide-react";

// ─── STATIC CONFIG ────────────────────────────────────────────────────────────

var DAYS = [
  { key: "MON", label: "Monday"    },
  { key: "TUE", label: "Tuesday"   },
  { key: "WED", label: "Wednesday" },
  { key: "THU", label: "Thursday"  },
  { key: "FRI", label: "Friday"    },
];

var PT = [
  { p: 1, s: "07:45", e: "08:30" },
  { p: 2, s: "08:30", e: "09:15" },
  { p: 3, s: "09:15", e: "10:00" },
  { p: 4, s: "10:20", e: "11:05" },
  { p: 5, s: "11:05", e: "11:50" },
  { p: 6, s: "11:50", e: "12:35" },
  { p: 7, s: "13:00", e: "13:45" },
];

var COLORS = [
  { n: "Blue",    v: "#2563EB", l: "#DBEAFE" },
  { n: "Emerald", v: "#059669", l: "#D1FAE5" },
  { n: "Amber",   v: "#D97706", l: "#FEF3C7" },
  { n: "Rose",    v: "#E11D48", l: "#FFE4E6" },
  { n: "Purple",  v: "#7C3AED", l: "#EDE9FE" },
  { n: "Teal",    v: "#0D9488", l: "#CCFBF1" },
  { n: "Orange",  v: "#EA580C", l: "#FFF7ED" },
  { n: "Indigo",  v: "#4F46E5", l: "#E0E7FF" },
  { n: "Pink",    v: "#DB2777", l: "#FCE7F3" },
  { n: "Slate",   v: "#475569", l: "#F1F5F9" },
];

var SHAPES = [
  { n: "Circle",  i: Circle   },
  { n: "Square",  i: Square   },
  { n: "Diamond", i: Diamond  },
  { n: "Star",    i: Star     },
  { n: "Hexagon", i: Hexagon  },
  { n: "Triangle",i: Triangle },
];

var DEF_CFG = {
  "10A": { c: COLORS[0], s: SHAPES[0] },
  "10B": { c: COLORS[1], s: SHAPES[1] },
  "10C": { c: COLORS[2], s: SHAPES[2] },
  "11A": { c: COLORS[3], s: SHAPES[3] },
  "11B": { c: COLORS[4], s: SHAPES[4] },
  "12A": { c: COLORS[5], s: SHAPES[5] },
};

// Status display config
var SC = {
  approved: { c: "#059669", bg: "#D1FAE5", lb: "Approved",  ic: CheckCircle2 },
  draft:    { c: "#64748B", bg: "#F1F5F9", lb: "Draft",     ic: FileText     },
  pending:  { c: "#D97706", bg: "#FEF3C7", lb: "Pending",   ic: Clock        },
  rejected: { c: "#DC2626", bg: "#FEE2E2", lb: "Rejected",  ic: AlertCircle  },
};

// ─── SEED DATA ────────────────────────────────────────────────────────────────

var INIT = {
  MON: [
    { p: 1, sub: "Mathematics", cl: "10A", plan: { id: 1, t: "Number Patterns", st: "approved", obj: "Identify and extend number patterns", act: "Group work, worksheet", dif: "Visual aids for support learners", res: "Textbook Ch.2", del: true,  att: [{ id: 1, n: "Worksheet.pdf", tp: "pdf", sz: 245000 }, { id: 2, n: "Slides.pptx", tp: "pptx", sz: 1200000 }] } },
    { p: 2, sub: "Mathematics", cl: "10B", plan: { id: 2, t: "Number Patterns", st: "approved", obj: "Identify patterns", act: "Group work", dif: "", res: "", del: true, att: [] } },
    { p: 3, sub: "Mathematics", cl: "10C", plan: null },
    { p: 4, sub: "Mathematics", cl: "11A", plan: { id: 4, t: "Quadratic Equations", st: "pending", obj: "Solve by factoring", act: "Demo, practice", dif: "", res: "", del: false, att: [{ id: 3, n: "Notes.docx", tp: "docx", sz: 89000 }] } },
    { p: 5, sub: "Mathematics", cl: "11B", plan: null },
  ],
  TUE: [
    { p: 1, sub: "Mathematics", cl: "10A", plan: { id: 5, t: "Algebraic Expressions", st: "approved", obj: "Simplify expressions", act: "Demo, practice", dif: "", res: "", del: false, att: [] } },
    { p: 2, sub: "Mathematics", cl: "10B", plan: { id: 6, t: "Algebraic Expressions", st: "draft",    obj: "Simplify expressions", act: "Demo, practice", dif: "", res: "", del: false, att: [] } },
    { p: 4, sub: "Mathematics", cl: "11A", plan: null },
    { p: 5, sub: "Mathematics", cl: "11B", plan: { id: 8, t: "Trig Ratios", st: "rejected", obj: "Calculate trig ratios", act: "Discovery activity", dif: "", res: "", del: false, fb: "Needs differentiation strategies.", att: [] } },
  ],
  WED: [
    { p: 1, sub: "Mathematics", cl: "10A", plan: null },
    { p: 2, sub: "Mathematics", cl: "10B", plan: null },
    { p: 3, sub: "Mathematics", cl: "10C", plan: { id: 9, t: "Exponents", st: "draft", obj: "Apply exponent laws", act: "Direct instruction, exercises", dif: "", res: "Textbook Ch.3", del: false, att: [] } },
    { p: 4, sub: "Mathematics", cl: "11A", plan: null },
    { p: 7, sub: "Mathematics", cl: "12A", plan: { id: 10, t: "Calculus Intro", st: "approved", obj: "Understand limits", act: "Lecture, Q&A", dif: "", res: "", del: true, att: [] } },
  ],
  THU: [
    { p: 1, sub: "Mathematics", cl: "10A", plan: { id: 11, t: "Functions & Graphs", st: "draft", obj: "Draw linear functions", act: "Plotting exercise", dif: "Graph paper scaffold", res: "", del: false, att: [] } },
    { p: 2, sub: "Mathematics", cl: "10B", plan: null },
    { p: 3, sub: "Mathematics", cl: "10C", plan: null },
    { p: 5, sub: "Mathematics", cl: "11B", plan: null },
  ],
  FRI: [
    { p: 1, sub: "Mathematics", cl: "10A", plan: null },
    { p: 2, sub: "Mathematics", cl: "10B", plan: null },
    { p: 4, sub: "Mathematics", cl: "11A", plan: null },
    { p: 7, sub: "Mathematics", cl: "12A", plan: null },
  ],
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function fSz(b) {
  return b < 1024 ? b + " B" : b < 1048576 ? (b / 1024).toFixed(1) + " KB" : (b / 1048576).toFixed(1) + " MB";
}

function gMon(d) {
  var dt = new Date(d);
  var dy = dt.getDay();
  dt.setDate(dt.getDate() - dy + (dy === 0 ? -6 : 1));
  return dt;
}

function gWN(d) {
  var dt = new Date(d);
  dt.setHours(0, 0, 0, 0);
  dt.setDate(dt.getDate() + 3 - (dt.getDay() + 6) % 7);
  var w1 = new Date(dt.getFullYear(), 0, 4);
  return 1 + Math.round(((dt - w1) / 864e5 - 3 + (w1.getDay() + 6) % 7) / 7);
}

function fDt(d) {
  return d.toLocaleDateString("en-ZA", { day: "numeric", month: "short" });
}

var _nid = 100;

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function WeeklyPlannerPage() {
  var auth = useAuth();
  var fRef  = useRef(null);
  var pfRef = useRef(null);
  var iRef  = useRef(null);

  var today = new Date();
  var mon0  = gMon(today);

  // ── State ──────────────────────────────────────────────
  var [wOff,      setWOff]      = useState(0);
  var [wd,        setWd]        = useState(JSON.parse(JSON.stringify(INIT)));
  var [sp,        setSp]        = useState(null);       // detail side panel
  var [showCr,    setShowCr]    = useState(false);      // create/edit modal
  var [isEd,      setIsEd]      = useState(false);
  var [tgt,       setTgt]       = useState(null);
  var [showImp,   setShowImp]   = useState(false);
  var [iRes,      setIRes]      = useState(null);
  var [fm,        setFm]        = useState({ t: "", obj: "", act: "", dif: "", res: "" });
  var [saveErr,   setSaveErr]   = useState("");
  var [pnd,       setPnd]       = useState([]);         // pending new file attachments
  var [editAtt,   setEditAtt]   = useState([]);         // existing atts when editing
  var [sav,       setSav]       = useState(false);
  var [ccfg,      setCcfg]      = useState(DEF_CFG);    // class colour/shape config
  var [showCfg,   setShowCfg]   = useState(false);
  var [cfgCl,     setCfgCl]     = useState(null);

  // ── Computed ───────────────────────────────────────────
  var cMon = new Date(mon0); cMon.setDate(cMon.getDate() + wOff * 7);
  var cFri = new Date(cMon); cFri.setDate(cFri.getDate() + 4);
  var wn   = gWN(cMon);
  var isCur = wOff === 0;
  var wDts = [];
  for (var wi = 0; wi < 5; wi++) {
    var wd2 = new Date(cMon); wd2.setDate(wd2.getDate() + wi); wDts.push(wd2);
  }

  // Stats
  var tot = 0, made = 0, appd = 0;
  Object.values(wd).forEach(function(ss) {
    ss.forEach(function(s) { tot++; if (s.plan) { made++; if (s.plan.st === "approved") appd++; } });
  });
  var miss = tot - made;

  // ── Class style helpers ────────────────────────────────
  function gCS(cl) { var c = ccfg[cl]; return c ? { c: c.c.v, l: c.c.l } : { c: "#475569", l: "#F1F5F9" }; }
  function gSh(cl) { var c = ccfg[cl]; return c ? c.s.i : Circle; }

  // ── Open create modal ──────────────────────────────────
  function openC(day, sl) {
    setTgt({ p: sl.p, day: day, sub: sl.sub, cl: sl.cl });
    setFm({ t: "", obj: "", act: "", dif: "", res: "" });
    setPnd([]); setEditAtt([]); setSaveErr(""); setIsEd(false); setShowCr(true);
  }

  // ── Open edit modal ────────────────────────────────────
  function openE(plan, slot, dayK) {
    setTgt({ p: slot.p, day: dayK, sub: slot.sub, cl: slot.cl });
    setFm({ t: plan.t, obj: plan.obj, act: plan.act, dif: plan.dif || "", res: plan.res || "" });
    setPnd([]); setSaveErr("");
    setEditAtt(plan.att ? JSON.parse(JSON.stringify(plan.att)) : []);
    setIsEd(true); setShowCr(true); setSp(null);
  }

  // ── SAVE (fixed: correctly writes back into wd state) ──
  async function doSave(submit) {
    if (!fm.t.trim())   { setSaveErr("Title is required.");       return; }
    if (!fm.obj.trim()) { setSaveErr("Objectives are required."); return; }
    if (!fm.act.trim()) { setSaveErr("Activities are required."); return; }

    setSav(true);
    await new Promise(function(r) { setTimeout(r, 600); });

    // Build attachments
    var newAtt = pnd.map(function(f, idx) {
      return { id: _nid + idx + 1, n: f.name, tp: f.name.split(".").pop(), sz: f.size, url: URL.createObjectURL(f) };
    });
    var allAtt = isEd ? editAtt.concat(newAtt) : newAtt;

    // Find existing slot to read its current plan
    var existSlot = (wd[tgt.day] || []).find(function(s) { return s.p === tgt.p && s.cl === tgt.cl; });
    var existPlan = existSlot ? existSlot.plan : null;

    var planData = {
      id:  isEd && existPlan ? existPlan.id : ++_nid,
      t:   fm.t.trim(),
      obj: fm.obj.trim(),
      act: fm.act.trim(),
      dif: fm.dif.trim(),
      res: fm.res.trim(),
      st:  submit ? "pending" : (isEd && existPlan ? existPlan.st : "draft"),
      del: isEd && existPlan ? (existPlan.del || false) : false,
      fb:  isEd && existPlan ? (existPlan.fb  || "")    : "",
      att: allAtt,
    };
    if (submit) planData.st = "pending";

    // Write plan back into week data
    setWd(function(prev) {
      var updated = JSON.parse(JSON.stringify(prev));
      var daySlots = updated[tgt.day];
      if (daySlots) {
        for (var i = 0; i < daySlots.length; i++) {
          if (daySlots[i].p === tgt.p && daySlots[i].cl === tgt.cl) {
            daySlots[i].plan = planData;
            break;
          }
        }
      }
      return updated;
    });

    // Keep detail panel in sync if it's showing this slot
    if (sp && sp.slot && sp.slot.p === tgt.p && sp.day === tgt.day && sp.slot.cl === tgt.cl) {
      setSp(function(prev) { return prev ? Object.assign({}, prev, planData) : null; });
    }

    _nid += pnd.length + 2;
    setSav(false);
    setShowCr(false);
    setFm({ t: "", obj: "", act: "", dif: "", res: "" });
  }

  // ── Delete plan ────────────────────────────────────────
  function deletePlan(day, p, cl) {
    setWd(function(prev) {
      var updated = JSON.parse(JSON.stringify(prev));
      var daySlots = updated[day];
      if (daySlots) {
        for (var i = 0; i < daySlots.length; i++) {
          if (daySlots[i].p === p && daySlots[i].cl === cl) { daySlots[i].plan = null; break; }
        }
      }
      return updated;
    });
    setSp(null);
  }

  // ── File handling ──────────────────────────────────────
  function onCreateFiles(e) { setPnd(function(p) { return p.concat(Array.from(e.target.files)); }); e.target.value = ""; }
  function rmPending(idx)   { setPnd(function(p) { return p.filter(function(_, j) { return j !== idx; }); }); }
  function rmEditAtt(idx)   { setEditAtt(function(p) { return p.filter(function(_, j) { return j !== idx; }); }); }

  function onPanelFiles(e) {
    var fs = Array.from(e.target.files).map(function(f, idx) {
      return { id: Date.now() + idx, n: f.name, tp: f.name.split(".").pop(), sz: f.size, url: URL.createObjectURL(f) };
    });
    if (sp) {
      var at = (sp.att || []).concat(fs);
      setSp(Object.assign({}, sp, { att: at }));
      setWd(function(prev) {
        var upd = JSON.parse(JSON.stringify(prev)); var ds = upd[sp.day];
        if (ds) { for (var i = 0; i < ds.length; i++) { if (ds[i].p === sp.slot.p && ds[i].cl === sp.slot.cl && ds[i].plan) { ds[i].plan.att = at; break; } } }
        return upd;
      });
    }
    e.target.value = "";
  }

  function rmPanelAtt(attId) {
    if (!sp) return;
    var at = (sp.att || []).filter(function(a) { return a.id !== attId; });
    setSp(Object.assign({}, sp, { att: at }));
    setWd(function(prev) {
      var upd = JSON.parse(JSON.stringify(prev)); var ds = upd[sp.day];
      if (ds) { for (var i = 0; i < ds.length; i++) { if (ds[i].p === sp.slot.p && ds[i].cl === sp.slot.cl && ds[i].plan) { ds[i].plan.att = at; break; } } }
      return upd;
    });
  }

  function dlF(a) {
    var el = document.createElement("a"); el.href = a.url || "#"; el.download = a.n;
    if (a.url) { document.body.appendChild(el); el.click(); document.body.removeChild(el); } else { alert("Download: " + a.n); }
  }

  // ── Import / Export ────────────────────────────────────
  async function doImp(e) {
    if (!e.target.files[0]) return;
    setIRes({ ld: true });
    await new Promise(function(r) { setTimeout(r, 1500); });
    setIRes({ ld: false, cr: 3, sk: 1, er: ["Row 5: Already exists"], tot: 4 });
    e.target.value = "";
  }
  function doExp(f) { alert("Export " + f.toUpperCase() + "\n/api/v1/planning/export/?format=" + f); }
  function dlTpl() {
    var csv = "day,period,title,objectives,activities,differentiation,resources\nMonday,1,Example,Learners will...,Activity 1,Support,Textbook";
    var el = document.createElement("a");
    el.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    el.download = "lesson_plan_template.csv";
    document.body.appendChild(el); el.click(); document.body.removeChild(el);
  }

  // ── Class colour / shape customisation ─────────────────
  function uCC(cl, c) { var cfg = Object.assign({}, ccfg); cfg[cl] = Object.assign({}, cfg[cl], { c: c }); setCcfg(cfg); }
  function uCS(cl, s) { var cfg = Object.assign({}, ccfg); cfg[cl] = Object.assign({}, cfg[cl], { s: s }); setCcfg(cfg); }

  // ─────────────────────────────────────────────────────────────────────────────
  //  RENDER
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div style={{ padding: "var(--space-xl)", maxWidth: 1200, margin: "0 auto" }}>

      {/* ── HEADER ─────────────────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 10, background: "#FEF3C7", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <BookCopy size={22} color="#D97706" />
          </div>
          <div>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 600, margin: 0 }}>Weekly Planner</h1>
            <p style={{ fontSize: 14, color: "var(--color-slate)", marginTop: 2 }}>Plan and track your lesson delivery</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={function() { setShowCfg(!showCfg); setCfgCl(null); }}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", fontSize: 13, fontWeight: 600, fontFamily: "var(--font-body)", background: showCfg ? "#FEF3C7" : "var(--color-surface)", color: showCfg ? "#D97706" : "var(--color-slate)", border: "1px solid " + (showCfg ? "#D97706" : "var(--color-border-light)"), borderRadius: 6, cursor: "pointer" }}>
            <Palette size={15} /> Colours
          </button>
          <button onClick={function() { setShowImp(true); setIRes(null); }}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", fontSize: 13, fontWeight: 600, fontFamily: "var(--font-body)", background: "var(--color-surface)", color: "var(--color-slate)", border: "1px solid var(--color-border-light)", borderRadius: 6, cursor: "pointer" }}>
            <Upload size={15} /> Import
          </button>
          <button onClick={function() { doExp("csv"); }}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", fontSize: 13, fontWeight: 600, fontFamily: "var(--font-body)", background: "var(--color-navy)", color: "#FEF3C7", border: "none", borderRadius: 6, cursor: "pointer" }}>
            <Download size={15} /> Export
          </button>
        </div>
      </div>

      {/* ── CLASS COLOUR / SHAPE CONFIG PANEL ──────────────────── */}
      {showCfg && (
        <div style={{ background: "#FFF", border: "1px solid var(--color-border-light)", borderRadius: 10, padding: 16, marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <Palette size={16} color="#D97706" />
            <span style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 600, flex: 1 }}>Class Colours & Shapes</span>
            <button onClick={function() { setShowCfg(false); setCfgCl(null); }} style={{ background: "none", border: "none", color: "var(--color-slate-light)", cursor: "pointer" }}><X size={16} /></button>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {Object.keys(ccfg).map(function(cl) {
              var cfg = ccfg[cl]; var SI = cfg.s.i; var isOpen = cfgCl === cl;
              return (
                <div key={cl}>
                  <button onClick={function() { setCfgCl(isOpen ? null : cl); }}
                    style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", border: "2px solid " + cfg.c.v, background: cfg.c.l, borderRadius: 6, cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 700, color: cfg.c.v }}>
                    <SI size={16} color={cfg.c.v} fill={cfg.c.v} /> {cl}
                  </button>
                  {isOpen && (
                    <div style={{ padding: 10, marginTop: 4, background: "var(--color-surface-alt)", borderRadius: 6, border: "1px solid var(--color-border-light)" }}>
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--color-slate-light)", marginBottom: 6 }}>COLOUR</div>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {COLORS.map(function(c) {
                            return <button key={c.n} onClick={function() { uCC(cl, c); }}
                              style={{ width: 26, height: 26, borderRadius: "50%", background: c.v, border: "none", cursor: "pointer", outline: cfg.c.n === c.n ? "3px solid " + c.v : "none", outlineOffset: 2 }} />;
                          })}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--color-slate-light)", marginBottom: 6 }}>SHAPE</div>
                        <div style={{ display: "flex", gap: 6 }}>
                          {SHAPES.map(function(s) {
                            var Ic = s.i;
                            return <button key={s.n} onClick={function() { uCS(cl, s); }}
                              style={{ width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", border: "1.5px solid " + (cfg.s.n === s.n ? cfg.c.v : "var(--color-border)"), borderRadius: 6, cursor: "pointer", background: cfg.s.n === s.n ? cfg.c.l : "transparent" }}>
                              <Ic size={16} color={cfg.c.v} />
                            </button>;
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── WEEK NAVIGATION ────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 12, padding: 16, background: "#FFF", borderRadius: 10, border: "1px solid var(--color-border-light)" }}>
        <button onClick={function() { setWOff(wOff - 1); }}
          style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-surface-alt)", border: "1px solid var(--color-border-light)", borderRadius: 6, cursor: "pointer" }}>
          <ChevronLeft size={18} />
        </button>
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 2 }}>
            <Calendar size={15} color="#D97706" />
            <span style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700 }}>Week {wn}</span>
            {isCur && <span style={{ fontSize: 10, fontWeight: 700, color: "#FFF", background: "#D97706", padding: "2px 8px", borderRadius: 99 }}>Current</span>}
          </div>
          <div style={{ fontSize: 13, color: "var(--color-slate)" }}>{fDt(cMon)} — {fDt(cFri)}, {cMon.getFullYear()}</div>
        </div>
        <button onClick={function() { setWOff(wOff + 1); }}
          style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-surface-alt)", border: "1px solid var(--color-border-light)", borderRadius: 6, cursor: "pointer" }}>
          <ChevronRight size={18} />
        </button>
        {!isCur && (
          <button onClick={function() { setWOff(0); }}
            style={{ padding: "8px 16px", fontSize: 13, fontWeight: 600, fontFamily: "var(--font-body)", background: "#FEF3C7", color: "#D97706", border: "1px solid rgba(217,119,6,0.2)", borderRadius: 6, cursor: "pointer" }}>
            Today
          </button>
        )}
      </div>

      {/* ── STATS BAR ──────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 12, padding: "8px 16px" }}>
        <div style={{ textAlign: "center" }}>
          <span style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700, display: "block" }}>{made}/{tot}</span>
          <span style={{ fontSize: 11, color: "var(--color-slate-light)" }}>Created</span>
        </div>
        <div style={{ textAlign: "center" }}>
          <span style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700, color: "#059669", display: "block" }}>{appd}</span>
          <span style={{ fontSize: 11, color: "var(--color-slate-light)" }}>Approved</span>
        </div>
        <div style={{ textAlign: "center" }}>
          <span style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700, color: miss > 0 ? "#DC2626" : "#059669", display: "block" }}>{miss}</span>
          <span style={{ fontSize: 11, color: "var(--color-slate-light)" }}>Missing</span>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", alignItems: "center", gap: 8, maxWidth: 200, flex: 1 }}>
          <div style={{ flex: 1, height: 6, background: "var(--color-surface-alt)", borderRadius: 3 }}>
            <div style={{ height: "100%", background: "#059669", borderRadius: 3, width: Math.round(made / tot * 100) + "%", transition: "width 0.3s" }} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-slate)" }}>{Math.round(made / tot * 100)}%</span>
        </div>
      </div>

      {/* ── TIMETABLE GRID ─────────────────────────────────────── */}
      <div style={{ overflowX: "auto", marginBottom: 12 }}>
        <div style={{ display: "grid", gridTemplateColumns: "80px repeat(5, 1fr)", gap: 2, minWidth: 900 }}>

          {/* Column headers */}
          <div style={{ padding: 10, fontSize: 11, fontWeight: 600, color: "var(--color-slate-light)", textTransform: "uppercase" }}>Period</div>
          {DAYS.map(function(day, idx) {
            var isToday = isCur && wDts[idx].toDateString() === today.toDateString();
            return (
              <div key={day.key} style={{ padding: "10px 8px", background: isToday ? "#FEF3C7" : "#FFF", borderRadius: "8px 8px 0 0", textAlign: "center", border: "1px solid " + (isToday ? "#D97706" : "var(--color-border-light)") }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{day.label}</div>
                <div style={{ fontSize: 11, color: isToday ? "#D97706" : "var(--color-slate-light)", marginTop: 2, fontWeight: isToday ? 700 : 400 }}>{fDt(wDts[idx])}</div>
              </div>
            );
          })}

          {/* Period rows */}
          {PT.map(function(pt) {
            return (
              <React.Fragment key={pt.p}>
                <div style={{ padding: "10px 6px", textAlign: "center" }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>P{pt.p}</div>
                  <div style={{ fontSize: 9, color: "var(--color-slate-light)", marginTop: 2 }}>{pt.s}–{pt.e}</div>
                </div>

                {DAYS.map(function(day) {
                  var sl = (wd[day.key] || []).find(function(s) { return s.p === pt.p; });

                  if (!sl) return (
                    <div key={day.key} style={{ background: "var(--color-surface-alt)", border: "1px solid var(--color-border-light)", borderRadius: 6, padding: 8, minHeight: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ color: "var(--color-border)", fontSize: 16 }}>—</span>
                    </div>
                  );

                  var pl  = sl.plan;
                  var sc  = pl ? SC[sl.plan.st] : null;
                  var Ic  = sc ? sc.ic : null;
                  var cs  = gCS(sl.cl);
                  var ShI = gSh(sl.cl);

                  return (
                    <div key={day.key}
                      style={{
                        background: cs.l,
                        border: "1px solid " + cs.c + "33",
                        borderRadius: 6,
                        padding: 10,
                        minHeight: 100,
                        cursor: "pointer",
                        borderTop: pl ? "3px solid " + sc.c : "3px solid var(--color-border-light)",
                        borderLeft: "5px solid " + cs.c,
                        position: "relative",
                      }}
                      onClick={function() { pl ? setSp(Object.assign({}, pl, { slot: sl, day: day.key })) : openC(day.key, sl); }}>

                      {/* Class label + subject tag */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <ShI size={14} color={cs.c} fill={cs.c} />
                          <span style={{ fontSize: 12, fontWeight: 800, color: cs.c }}>{sl.cl}</span>
                        </div>
                        <span style={{ fontSize: 9, fontWeight: 600, color: cs.c, background: cs.c + "20", padding: "1px 6px", borderRadius: 99 }}>{sl.sub}</span>
                      </div>

                      {pl ? (
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--color-navy)", lineHeight: 1.3, marginBottom: 5 }}>{pl.t}</div>
                          <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
                            <div style={{ display: "inline-flex", alignItems: "center", gap: 2, padding: "2px 6px", borderRadius: 99, fontSize: 9, fontWeight: 600, background: sc.bg, color: sc.c }}>
                              <Ic size={10} /> {sc.lb}
                            </div>
                            {pl.att && pl.att.length > 0 && (
                              <div style={{ display: "inline-flex", alignItems: "center", gap: 2, fontSize: 9, color: "var(--color-slate-light)" }}>
                                <Paperclip size={9} /> {pl.att.length}
                              </div>
                            )}
                          </div>
                          {pl.del && (
                            <div style={{ display: "inline-flex", alignItems: "center", gap: 2, marginTop: 3, fontSize: 9, color: "#059669", fontWeight: 600 }}>
                              <Check size={10} /> Delivered
                            </div>
                          )}
                        </div>
                      ) : (
                        <button
                          style={{ display: "flex", alignItems: "center", gap: 3, width: "100%", marginTop: 8, padding: 6, fontSize: 11, fontWeight: 500, fontFamily: "var(--font-body)", background: "#FFF", color: "var(--color-slate)", border: "1px dashed var(--color-border)", borderRadius: 4, cursor: "pointer", justifyContent: "center" }}
                          onClick={function(e) { e.stopPropagation(); openC(day.key, sl); }}>
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

      {/* ── LEGEND ─────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 16, justifyContent: "center", padding: "8px 0", fontSize: 12, color: "var(--color-slate)", flexWrap: "wrap", alignItems: "center" }}>
        {Object.entries(SC).map(function(e) {
          return <div key={e[0]} style={{ display: "flex", alignItems: "center", gap: 4 }}><div style={{ width: 8, height: 8, borderRadius: 2, background: e[1].c }} />{e[1].lb}</div>;
        })}
        <span style={{ color: "var(--color-border)" }}>|</span>
        {Object.keys(ccfg).map(function(cl) {
          var cfg = ccfg[cl]; var SI = cfg.s.i;
          return (
            <div key={cl} style={{ display: "flex", alignItems: "center", gap: 4, padding: "2px 8px", background: cfg.c.l, borderRadius: 99, border: "1px solid " + cfg.c.v + "44" }}>
              <SI size={11} color={cfg.c.v} fill={cfg.c.v} />
              <span style={{ fontWeight: 600, color: cfg.c.v }}>{cl}</span>
            </div>
          );
        })}
      </div>

      {/* ═══════════════════════════════════════════════════════════
          DETAIL SIDE PANEL
      ═══════════════════════════════════════════════════════════ */}
      {sp && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.4)", zIndex: 200, display: "flex", justifyContent: "flex-end", animation: "fadeIn 0.2s" }}
          onClick={function() { setSp(null); }}>
          <div style={{ width: 520, height: "100%", background: "#FFF", overflowY: "auto", padding: 24, animation: "slideIn 0.25s ease-out", boxShadow: "0 12px 32px rgba(0,0,0,0.1)" }}
            onClick={function(e) { e.stopPropagation(); }}>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
              <div>
                <div style={{ fontSize: 13, color: "#D97706", fontWeight: 600, marginBottom: 4 }}>
                  {sp.slot.cl} · {sp.slot.sub} · P{sp.slot.p} · {(DAYS.find(function(d) { return d.key === sp.day; }) || {}).label}
                </div>
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 600 }}>{sp.t}</h2>
              </div>
              <button onClick={function() { setSp(null); }} style={{ background: "none", border: "none", color: "var(--color-slate-light)", cursor: "pointer" }}><X size={20} /></button>
            </div>

            {SC[sp.st] && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 99, fontSize: 13, fontWeight: 600, background: SC[sp.st].bg, color: SC[sp.st].c, marginBottom: 20 }}>
                {React.createElement(SC[sp.st].ic, { size: 14 })} {SC[sp.st].lb}
              </div>
            )}

            {sp.st === "rejected" && sp.fb && (
              <div style={{ background: "#FEE2E2", border: "1px solid #FECACA", borderRadius: 8, padding: 12, marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#DC2626", marginBottom: 4 }}>FEEDBACK</div>
                <div style={{ fontSize: 13, color: "#991B1B" }}>{sp.fb}</div>
              </div>
            )}

            {[
              { lb: "Objectives",      val: sp.obj },
              { lb: "Activities",      val: sp.act },
              sp.dif && { lb: "Differentiation", val: sp.dif },
              sp.res && { lb: "Resources",        val: sp.res },
            ].filter(Boolean).map(function(f, i) {
              return (
                <div key={i} style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--color-slate-light)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>{f.lb}</div>
                  <div style={{ fontSize: 14, color: "var(--color-navy)", lineHeight: 1.7 }}>{f.val}</div>
                </div>
              );
            })}

            {/* Attachments */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--color-slate-light)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Attachments {sp.att && sp.att.length > 0 ? "(" + sp.att.length + ")" : ""}
                </div>
                <button onClick={function() { pfRef.current && pfRef.current.click(); }}
                  style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", border: "1px solid var(--color-border)", borderRadius: 5, background: "#FFF", cursor: "pointer", fontSize: 12, color: "var(--color-slate)", fontFamily: "var(--font-body)" }}>
                  <Paperclip size={12} /> Attach
                </button>
                <input type="file" multiple ref={pfRef} onChange={onPanelFiles} style={{ display: "none" }} />
              </div>
              {sp.att && sp.att.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {sp.att.map(function(a) {
                    return (
                      <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: "var(--color-surface-alt)", borderRadius: 6, border: "1px solid var(--color-border-light)" }}>
                        <File size={14} color="var(--color-info)" />
                        <span style={{ flex: 1, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.n}</span>
                        <span style={{ fontSize: 11, color: "var(--color-slate-light)" }}>{fSz(a.sz)}</span>
                        <button onClick={function() { dlF(a); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-info)", padding: 4 }}><Download size={13} /></button>
                        <button onClick={function() { rmPanelAtt(a.id); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#DC2626", padding: 4 }}><X size={13} /></button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ padding: "16px 0", textAlign: "center", color: "var(--color-slate-light)", fontSize: 13 }}>No attachments yet</div>
              )}
            </div>

            {/* Panel actions */}
            <div style={{ display: "flex", gap: 8, paddingTop: 24, borderTop: "1px solid var(--color-border-light)", flexWrap: "wrap" }}>
              {(sp.st === "draft" || sp.st === "rejected") && (
                <button onClick={function() { openE(sp, sp.slot, sp.day); }}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 18px", fontSize: 14, fontWeight: 600, fontFamily: "var(--font-body)", background: "#DBEAFE", color: "#2563EB", border: "none", borderRadius: 6, cursor: "pointer" }}>
                  <Edit3 size={14} /> Edit Plan
                </button>
              )}
              {sp.st === "draft" && (
                <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 18px", fontSize: 14, fontWeight: 600, fontFamily: "var(--font-body)", background: "#D97706", color: "#FFF", border: "none", borderRadius: 6, cursor: "pointer" }}>
                  <Send size={14} /> Submit
                </button>
              )}
              {sp.st === "approved" && !sp.del && (
                <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 18px", fontSize: 14, fontWeight: 600, fontFamily: "var(--font-body)", background: "#D1FAE5", color: "#059669", border: "none", borderRadius: 6, cursor: "pointer" }}>
                  <Check size={14} /> Mark Delivered
                </button>
              )}
              <button onClick={function() { deletePlan(sp.day, sp.slot.p, sp.slot.cl); }}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 18px", fontSize: 14, fontWeight: 600, fontFamily: "var(--font-body)", background: "#FEE2E2", color: "#DC2626", border: "none", borderRadius: 6, cursor: "pointer", marginLeft: "auto" }}>
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          CREATE / EDIT MODAL
      ═══════════════════════════════════════════════════════════ */}
      {showCr && tgt && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.4)", zIndex: 200, display: "flex", justifyContent: "center", alignItems: "center", animation: "fadeIn 0.2s" }}
          onClick={function() { setShowCr(false); setSaveErr(""); }}>
          <div style={{ width: 720, maxHeight: "92vh", background: "#FFF", borderRadius: 16, overflow: "hidden", display: "flex", flexDirection: "column" }}
            onClick={function(e) { e.stopPropagation(); }}>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: 24, borderBottom: "1px solid var(--color-border-light)" }}>
              <div>
                <div style={{ fontSize: 13, color: "#D97706", fontWeight: 600, marginBottom: 4 }}>{tgt.sub} · {tgt.cl} · P{tgt.p}</div>
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 600 }}>{isEd ? "Edit Lesson Plan" : "New Lesson Plan"}</h2>
              </div>
              <button onClick={function() { setShowCr(false); setSaveErr(""); }} style={{ background: "none", border: "none", color: "var(--color-slate-light)", cursor: "pointer" }}><X size={20} /></button>
            </div>

            {saveErr && (
              <div style={{ padding: "10px 24px", background: "#FEE2E2", borderBottom: "1px solid #FECACA", display: "flex", alignItems: "center", gap: 8, color: "#DC2626", fontSize: 13 }}>
                <AlertCircle size={15} /> {saveErr}
              </div>
            )}

            <div style={{ padding: 24, overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "var(--color-slate)", display: "block", marginBottom: 4 }}>Title *</label>
                <input type="text" value={fm.t}
                  onChange={function(e) { setFm(Object.assign({}, fm, { t: e.target.value })); if (saveErr) setSaveErr(""); }}
                  placeholder="e.g. Algebraic Expressions"
                  style={{ width: "100%", padding: "10px 14px", fontSize: 14, fontFamily: "var(--font-body)", border: "1.5px solid var(--color-border)", borderRadius: 6, color: "var(--color-navy)", boxSizing: "border-box" }} />
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "var(--color-slate)", display: "block", marginBottom: 4 }}>Objectives *</label>
                <textarea rows={3} value={fm.obj}
                  onChange={function(e) { setFm(Object.assign({}, fm, { obj: e.target.value })); if (saveErr) setSaveErr(""); }}
                  placeholder="What will learners be able to do by the end of this lesson?"
                  style={{ width: "100%", padding: "10px 14px", fontSize: 14, fontFamily: "var(--font-body)", border: "1.5px solid var(--color-border)", borderRadius: 6, color: "var(--color-navy)", resize: "vertical", boxSizing: "border-box" }} />
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "var(--color-slate)", display: "block", marginBottom: 4 }}>Activities *</label>
                <textarea rows={3} value={fm.act}
                  onChange={function(e) { setFm(Object.assign({}, fm, { act: e.target.value })); if (saveErr) setSaveErr(""); }}
                  placeholder="Key teaching activities and learner tasks"
                  style={{ width: "100%", padding: "10px 14px", fontSize: 14, fontFamily: "var(--font-body)", border: "1.5px solid var(--color-border)", borderRadius: 6, color: "var(--color-navy)", resize: "vertical", boxSizing: "border-box" }} />
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "var(--color-slate)", display: "block", marginBottom: 4 }}>Differentiation</label>
                <textarea rows={2} value={fm.dif}
                  onChange={function(e) { setFm(Object.assign({}, fm, { dif: e.target.value })); }}
                  placeholder="How will you support or extend learners? (optional)"
                  style={{ width: "100%", padding: "10px 14px", fontSize: 14, fontFamily: "var(--font-body)", border: "1.5px solid var(--color-border)", borderRadius: 6, color: "var(--color-navy)", resize: "vertical", boxSizing: "border-box" }} />
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "var(--color-slate)", display: "block", marginBottom: 4 }}>Resources</label>
                <input type="text" value={fm.res}
                  onChange={function(e) { setFm(Object.assign({}, fm, { res: e.target.value })); }}
                  placeholder="Textbooks, worksheets, digital tools… (optional)"
                  style={{ width: "100%", padding: "10px 14px", fontSize: 14, fontFamily: "var(--font-body)", border: "1.5px solid var(--color-border)", borderRadius: 6, color: "var(--color-navy)", boxSizing: "border-box" }} />
              </div>

              {/* Attachments */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "var(--color-slate)", display: "block", marginBottom: 8 }}>Attachments</label>
                <input type="file" multiple ref={fRef} onChange={onCreateFiles} style={{ display: "none" }} />
                <button onClick={function() { fRef.current && fRef.current.click(); }}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", border: "1px dashed var(--color-border)", borderRadius: 6, background: "var(--color-surface-alt)", cursor: "pointer", fontSize: 13, color: "var(--color-slate)", fontFamily: "var(--font-body)" }}>
                  <Paperclip size={14} /> Attach files
                </button>

                {isEd && editAtt.length > 0 && (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--color-slate-light)", marginBottom: 6 }}>EXISTING FILES</div>
                    {editAtt.map(function(a, i) {
                      return (
                        <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: "var(--color-surface-alt)", borderRadius: 6, border: "1px solid var(--color-border-light)", marginBottom: 4 }}>
                          <File size={14} color="var(--color-info)" />
                          <span style={{ flex: 1, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.n}</span>
                          <span style={{ fontSize: 11, color: "var(--color-slate-light)" }}>{fSz(a.sz)}</span>
                          <button onClick={function() { rmEditAtt(i); }} style={{ background: "none", border: "none", color: "#DC2626", cursor: "pointer", padding: 4 }}><X size={14} /></button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {pnd.length > 0 && (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--color-slate-light)", marginBottom: 6 }}>NEW FILES</div>
                    {pnd.map(function(f, i) {
                      return (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: "var(--color-surface-alt)", borderRadius: 6, border: "1px solid var(--color-border-light)", marginBottom: 4 }}>
                          <File size={14} color="var(--color-info)" />
                          <span style={{ flex: 1, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</span>
                          <span style={{ fontSize: 11, color: "var(--color-slate-light)" }}>{fSz(f.size)}</span>
                          <button onClick={function() { rmPending(i); }} style={{ background: "none", border: "none", color: "#DC2626", cursor: "pointer", padding: 4 }}><X size={14} /></button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "16px 24px", borderTop: "1px solid var(--color-border-light)", background: "var(--color-surface-alt)" }}>
              <button onClick={function() { setShowCr(false); setSaveErr(""); }}
                style={{ padding: "10px 18px", fontSize: 14, fontWeight: 500, fontFamily: "var(--font-body)", background: "transparent", color: "var(--color-slate)", border: "1px solid var(--color-border)", borderRadius: 6, cursor: "pointer" }}>
                Cancel
              </button>
              <button onClick={function() { doSave(false); }} disabled={sav || !fm.t || !fm.obj}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 18px", fontSize: 14, fontWeight: 600, fontFamily: "var(--font-body)", background: "#FFF", color: "var(--color-navy)", border: "1px solid var(--color-border)", borderRadius: 6, cursor: "pointer", opacity: sav || !fm.t ? 0.6 : 1 }}>
                {sav ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Save size={16} />}
                {isEd ? "Update Draft" : "Save Draft"}
              </button>
              <button onClick={function() { doSave(true); }} disabled={sav || !fm.t || !fm.obj || !fm.act}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 18px", fontSize: 14, fontWeight: 600, fontFamily: "var(--font-body)", background: "#D97706", color: "#FFF", border: "none", borderRadius: 6, cursor: "pointer", opacity: sav || !fm.act ? 0.6 : 1 }}>
                <Send size={16} />
                {isEd ? "Update & Submit" : "Save & Submit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          IMPORT MODAL
      ═══════════════════════════════════════════════════════════ */}
      {showImp && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.4)", zIndex: 200, display: "flex", justifyContent: "center", alignItems: "center", animation: "fadeIn 0.2s" }}
          onClick={function() { setShowImp(false); setIRes(null); }}>
          <div style={{ width: 520, maxHeight: "85vh", background: "#FFF", borderRadius: 16, overflow: "hidden", display: "flex", flexDirection: "column" }}
            onClick={function(e) { e.stopPropagation(); }}>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: 24, borderBottom: "1px solid var(--color-border-light)" }}>
              <div>
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 600 }}>Import Lesson Plans</h2>
                <p style={{ fontSize: 13, color: "var(--color-slate)", marginTop: 4 }}>Upload CSV or Excel</p>
              </div>
              <button onClick={function() { setShowImp(false); setIRes(null); }} style={{ background: "none", border: "none", color: "var(--color-slate-light)", cursor: "pointer" }}><X size={20} /></button>
            </div>

            <div style={{ padding: 24, overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 16, background: "#D1FAE5", borderRadius: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <File size={18} color="#059669" />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: "#059669" }}>Download Template</div>
                    <div style={{ fontSize: 12, color: "#064E3B" }}>CSV: day, period, title, objectives, activities</div>
                  </div>
                </div>
                <button onClick={dlTpl} style={{ padding: "6px 14px", background: "#059669", color: "#FFF", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "var(--font-body)" }}>Template</button>
              </div>

              <input type="file" ref={iRef} accept=".csv,.xlsx,.xls" onChange={doImp} style={{ display: "none" }} />
              <button onClick={function() { iRef.current && iRef.current.click(); }}
                style={{ padding: 24, border: "2px dashed var(--color-border)", borderRadius: 10, background: "var(--color-surface-alt)", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, color: "var(--color-slate)" }}>
                <Upload size={28} color="var(--color-slate-light)" />
                <span style={{ fontWeight: 600, fontSize: 15 }}>Click to upload file</span>
                <span style={{ fontSize: 12, color: "var(--color-slate-light)" }}>CSV, XLSX supported</span>
              </button>

              {iRes && iRes.ld && (
                <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#D97706", fontSize: 14 }}>
                  <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> Processing your file…
                </div>
              )}
              {iRes && !iRes.ld && (
                <div style={{ padding: 14, background: "var(--color-surface-alt)", borderRadius: 10, border: "1px solid var(--color-border-light)", fontSize: 13 }}>
                  <div style={{ color: "#059669", fontWeight: 600, marginBottom: 4 }}>✓ {iRes.cr} plans imported</div>
                  {iRes.sk > 0 && <div style={{ color: "#D97706", marginBottom: 4 }}>⚠ {iRes.sk} skipped</div>}
                  {(iRes.er || []).map(function(e, i) { return <div key={i} style={{ color: "#DC2626" }}>✕ {e}</div>; })}
                </div>
              )}

              <div style={{ paddingTop: 8, borderTop: "1px solid var(--color-border-light)" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-slate)", marginBottom: 8 }}>Export current plans</div>
                <div style={{ display: "flex", gap: 8 }}>
                  {["csv", "xlsx"].map(function(f) {
                    return <button key={f} onClick={function() { doExp(f); }}
                      style={{ flex: 1, padding: "8px 0", border: "1px solid var(--color-border)", borderRadius: 6, background: "#FFF", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600, color: "var(--color-slate)", textTransform: "uppercase" }}>
                      {f}
                    </button>;
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn  { from { opacity: 0 }                  to { opacity: 1 } }
        @keyframes slideIn { from { transform: translateX(100%) } to { transform: translateX(0) } }
        @keyframes spin    { from { transform: rotate(0deg) }     to { transform: rotate(360deg) } }
      `}</style>
    </div>
  );
}
