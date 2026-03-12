import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getWeeklyPlan, createPlan, updatePlan, deletePlan,
  submitPlan, deliverLesson, importPlans, exportPlansUrl,
  uploadAttachments, deleteAttachment,
} from "../api/client";
import {
  BookCopy, Plus, Check, Clock, X, Send, Edit3, AlertCircle,
  CheckCircle2, FileText, Save, Loader2, Upload, Download,
  Paperclip, File, ChevronLeft, ChevronRight, Calendar, Trash2,
} from "lucide-react";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const DAYS = [
  { key: "MON", label: "Monday" },
  { key: "TUE", label: "Tuesday" },
  { key: "WED", label: "Wednesday" },
  { key: "THU", label: "Thursday" },
  { key: "FRI", label: "Friday" },
];

const PT = [
  { p: 1, s: "07:45", e: "08:30" },
  { p: 2, s: "08:30", e: "09:15" },
  { p: 3, s: "09:15", e: "10:00" },
  { p: 4, s: "10:20", e: "11:05" },
  { p: 5, s: "11:05", e: "11:50" },
  { p: 6, s: "11:50", e: "12:35" },
  { p: 7, s: "13:00", e: "13:45" },
];

const COLORS = [
  { n: "Blue", v: "#2563EB", l: "#DBEAFE" },
  { n: "Emerald", v: "#059669", l: "#D1FAE5" },
  { n: "Amber", v: "#D97706", l: "#FEF3C7" },
  { n: "Rose", v: "#E11D48", l: "#FFE4E6" },
  { n: "Purple", v: "#7C3AED", l: "#EDE9FE" },
  { n: "Teal", v: "#0D9488", l: "#CCFBF1" },
  { n: "Orange", v: "#EA580C", l: "#FFF7ED" },
  { n: "Indigo", v: "#4F46E5", l: "#E0E7FF" },
];

const SC = {
  approved: { c: "#059669", bg: "#D1FAE5", lb: "Approved", ic: CheckCircle2 },
  draft: { c: "#64748B", bg: "#F1F5F9", lb: "Draft", ic: FileText },
  pending: { c: "#D97706", bg: "#FEF3C7", lb: "Pending", ic: Clock },
  rejected: { c: "#DC2626", bg: "#FEE2E2", lb: "Rejected", ic: AlertCircle },
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function fSz(b) {
  return b < 1024 ? b + " B" : b < 1048576 ? (b / 1024).toFixed(1) + " KB" : (b / 1048576).toFixed(1) + " MB";
}

function gMon(d) {
  const dt = new Date(d);
  const dy = dt.getDay();
  dt.setDate(dt.getDate() - dy + (dy === 0 ? -6 : 1));
  return dt;
}

function gWN(d) {
  const dt = new Date(d);
  dt.setHours(0, 0, 0, 0);
  dt.setDate(dt.getDate() + 3 - (dt.getDay() + 6) % 7);
  const w1 = new Date(dt.getFullYear(), 0, 4);
  return 1 + Math.round(((dt - w1) / 864e5 - 3 + (w1.getDay() + 6) % 7) / 7);
}

function fDt(d) {
  return d.toLocaleDateString("en-ZA", { day: "numeric", month: "short" });
}

function getClassColor(classroom) {
  const hash = classroom.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return COLORS[hash % COLORS.length];
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function WeeklyPlannerPage() {
  const { user } = useAuth();
  const fRef = useRef(null);
  const iRef = useRef(null);

  const today = new Date();
  const mon0 = gMon(today);

  // ── State ──
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [wOff, setWOff] = useState(0);
  const [weeklyData, setWeeklyData] = useState(null);
  const [stats, setStats] = useState({ total_slots: 0, plans_created: 0, plans_approved: 0, plans_missing: 0 });

  const [sp, setSp] = useState(null); // detail side panel
  const [showCr, setShowCr] = useState(false); // create/edit modal
  const [isEd, setIsEd] = useState(false);
  const [tgt, setTgt] = useState(null);
  const [showImp, setShowImp] = useState(false);
  const [iRes, setIRes] = useState(null);
  const [fm, setFm] = useState({ t: "", obj: "", act: "", dif: "", res: "" });
  const [saveErr, setSaveErr] = useState("");
  const [pnd, setPnd] = useState([]); // pending new file attachments

  // ── Computed ──
  const cMon = new Date(mon0);
  cMon.setDate(cMon.getDate() + wOff * 7);
  const cFri = new Date(cMon);
  cFri.setDate(cFri.getDate() + 4);
  const wn = gWN(cMon);
  const isCur = wOff === 0;
  const wDts = [];
  for (let wi = 0; wi < 5; wi++) {
    const wd2 = new Date(cMon);
    wd2.setDate(wd2.getDate() + wi);
    wDts.push(wd2);
  }

  // ── Load data ──
  useEffect(() => {
    loadWeeklyData();
  }, []);

  async function loadWeeklyData() {
    setLoading(true);
    setError(null);
    try {
      const res = await getWeeklyPlan();
      setWeeklyData(res.data.weekly || []);
      setStats(res.data.stats || { total_slots: 0, plans_created: 0, plans_approved: 0, plans_missing: 0 });
    } catch (err) {
      console.error("Failed to load weekly plan:", err);
      setError("Failed to load lesson plans. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // ── Get slots for a day ──
  function getDaySlots(dayKey) {
    if (!weeklyData) return [];
    const dayData = weeklyData.find((d) => d.day === dayKey);
    return dayData?.periods || [];
  }

  // ── Open create modal ──
  function openC(dayKey, slot) {
    setTgt({ slot_id: slot.slot_id, day: dayKey, subject: slot.subject, classroom: slot.classroom, period: slot.period });
    setFm({ t: "", obj: "", act: "", dif: "", res: "" });
    setPnd([]);
    setSaveErr("");
    setIsEd(false);
    setShowCr(true);
  }

  // ── Open edit modal ──
  function openE(plan, slot, dayKey) {
    setTgt({ slot_id: slot.slot_id, day: dayKey, subject: slot.subject, classroom: slot.classroom, period: slot.period, plan_id: plan.id });
    setFm({
      t: plan.title || "",
      obj: plan.objectives || "",
      act: plan.activities || "",
      dif: plan.differentiation || "",
      res: plan.resources_note || "",
    });
    setPnd([]);
    setSaveErr("");
    setIsEd(true);
    setShowCr(true);
    setSp(null);
  }

  // ── Save plan ──
  async function doSave(submit) {
    if (!fm.t.trim()) { setSaveErr("Title is required."); return; }
    if (!fm.obj.trim()) { setSaveErr("Objectives are required."); return; }
    if (!fm.act.trim()) { setSaveErr("Activities are required."); return; }

    setSaving(true);
    try {
      const planData = {
        timetable_slot: tgt.slot_id,
        plan_type: "official",
        title: fm.t.trim(),
        objectives: fm.obj.trim(),
        activities: fm.act.trim(),
        differentiation: fm.dif.trim(),
        resources_note: fm.res.trim(),
      };

      let plan;
      if (isEd && tgt.plan_id) {
        const res = await updatePlan(tgt.plan_id, planData);
        plan = res.data;
      } else {
        const res = await createPlan(planData);
        plan = res.data;
      }

      // Upload attachments if any
      if (pnd.length > 0 && plan.id) {
        await uploadAttachments(plan.id, pnd);
      }

      // Submit if requested
      if (submit && plan.id) {
        await submitPlan(plan.id);
      }

      await loadWeeklyData();
      setShowCr(false);
      setFm({ t: "", obj: "", act: "", dif: "", res: "" });
      setPnd([]);
    } catch (err) {
      console.error("Failed to save plan:", err);
      setSaveErr(err.response?.data?.error || "Failed to save plan");
    } finally {
      setSaving(false);
    }
  }

  // ── Delete plan ──
  async function handleDeletePlan(planId) {
    if (!window.confirm("Delete this lesson plan?")) return;
    try {
      await deletePlan(planId);
      await loadWeeklyData();
      setSp(null);
    } catch (err) {
      console.error("Failed to delete plan:", err);
      alert(err.response?.data?.error || "Failed to delete plan");
    }
  }

  // ── Submit plan for approval ──
  async function handleSubmitPlan(planId) {
    setSaving(true);
    try {
      await submitPlan(planId);
      await loadWeeklyData();
      setSp(null);
    } catch (err) {
      console.error("Failed to submit plan:", err);
      alert(err.response?.data?.error || "Failed to submit plan");
    } finally {
      setSaving(false);
    }
  }

  // ── Mark as delivered ──
  async function handleDeliver(planId) {
    setSaving(true);
    try {
      await deliverLesson(planId, "full", 100);
      await loadWeeklyData();
      setSp(null);
    } catch (err) {
      console.error("Failed to mark as delivered:", err);
      alert(err.response?.data?.error || "Failed to mark as delivered");
    } finally {
      setSaving(false);
    }
  }

  // ── File handling ──
  function onCreateFiles(e) {
    setPnd((p) => p.concat(Array.from(e.target.files)));
    e.target.value = "";
  }
  function rmPending(idx) {
    setPnd((p) => p.filter((_, j) => j !== idx));
  }

  // ── Import ──
  async function doImp(e) {
    if (!e.target.files[0]) return;
    setIRes({ ld: true });
    try {
      const res = await importPlans(e.target.files[0]);
      setIRes({ ld: false, cr: res.data.created, sk: res.data.skipped, er: res.data.errors, tot: res.data.total_rows });
      await loadWeeklyData();
    } catch (err) {
      setIRes({ ld: false, cr: 0, sk: 0, er: [err.response?.data?.error || "Import failed"], tot: 0 });
    }
    e.target.value = "";
  }

  // ── Export ──
  function doExp(f) {
    window.open(exportPlansUrl(f), "_blank");
  }

  // ── Loading state ──
  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", flexDirection: "column", gap: 12 }}>
        <Loader2 size={32} color="#D97706" style={{ animation: "spin 1s linear infinite" }} />
        <span style={{ color: "#64748B" }}>Loading lesson plans...</span>
      </div>
    );
  }

  // ── Error state ──
  if (error) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", flexDirection: "column", gap: 12 }}>
        <AlertCircle size={32} color="#DC2626" />
        <span style={{ color: "#DC2626" }}>{error}</span>
        <button onClick={loadWeeklyData} style={{ padding: "8px 16px", background: "#D97706", color: "#FFF", border: "none", borderRadius: 6, cursor: "pointer" }}>Retry</button>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  //  RENDER
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div style={{ padding: "var(--space-xl)", maxWidth: 1200, margin: "0 auto" }}>

      {/* ── HEADER ── */}
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
          <button onClick={() => { setShowImp(true); setIRes(null); }}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", fontSize: 13, fontWeight: 600, fontFamily: "var(--font-body)", background: "var(--color-surface)", color: "var(--color-slate)", border: "1px solid var(--color-border-light)", borderRadius: 6, cursor: "pointer" }}>
            <Upload size={15} /> Import
          </button>
          <button onClick={() => doExp("csv")}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", fontSize: 13, fontWeight: 600, fontFamily: "var(--font-body)", background: "var(--color-navy)", color: "#FEF3C7", border: "none", borderRadius: 6, cursor: "pointer" }}>
            <Download size={15} /> Export
          </button>
        </div>
      </div>

      {/* ── WEEK NAVIGATION ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 12, padding: 16, background: "#FFF", borderRadius: 10, border: "1px solid var(--color-border-light)" }}>
        <button onClick={() => setWOff(wOff - 1)}
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
        <button onClick={() => setWOff(wOff + 1)}
          style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-surface-alt)", border: "1px solid var(--color-border-light)", borderRadius: 6, cursor: "pointer" }}>
          <ChevronRight size={18} />
        </button>
        {!isCur && (
          <button onClick={() => setWOff(0)}
            style={{ padding: "8px 16px", fontSize: 13, fontWeight: 600, fontFamily: "var(--font-body)", background: "#FEF3C7", color: "#D97706", border: "1px solid rgba(217,119,6,0.2)", borderRadius: 6, cursor: "pointer" }}>
            Today
          </button>
        )}
      </div>

      {/* ── STATS BAR ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 12, padding: "8px 16px" }}>
        <div style={{ textAlign: "center" }}>
          <span style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700, display: "block" }}>{stats.plans_created}/{stats.total_slots}</span>
          <span style={{ fontSize: 11, color: "var(--color-slate-light)" }}>Created</span>
        </div>
        <div style={{ textAlign: "center" }}>
          <span style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700, color: "#059669", display: "block" }}>{stats.plans_approved}</span>
          <span style={{ fontSize: 11, color: "var(--color-slate-light)" }}>Approved</span>
        </div>
        <div style={{ textAlign: "center" }}>
          <span style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700, color: stats.plans_missing > 0 ? "#DC2626" : "#059669", display: "block" }}>{stats.plans_missing}</span>
          <span style={{ fontSize: 11, color: "var(--color-slate-light)" }}>Missing</span>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", alignItems: "center", gap: 8, maxWidth: 200, flex: 1 }}>
          <div style={{ flex: 1, height: 6, background: "var(--color-surface-alt)", borderRadius: 3 }}>
            <div style={{ height: "100%", background: "#059669", borderRadius: 3, width: (stats.total_slots > 0 ? Math.round(stats.plans_created / stats.total_slots * 100) : 0) + "%", transition: "width 0.3s" }} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-slate)" }}>{stats.total_slots > 0 ? Math.round(stats.plans_created / stats.total_slots * 100) : 0}%</span>
        </div>
      </div>

      {/* ── TIMETABLE GRID ── */}
      <div style={{ overflowX: "auto", marginBottom: 12 }}>
        <div style={{ display: "grid", gridTemplateColumns: "80px repeat(5, 1fr)", gap: 2, minWidth: 900 }}>
          {/* Column headers */}
          <div style={{ padding: 10, fontSize: 11, fontWeight: 600, color: "var(--color-slate-light)", textTransform: "uppercase" }}>Period</div>
          {DAYS.map((day, idx) => {
            const isToday = isCur && wDts[idx].toDateString() === today.toDateString();
            return (
              <div key={day.key} style={{ padding: "10px 8px", background: isToday ? "#FEF3C7" : "#FFF", borderRadius: "8px 8px 0 0", textAlign: "center", border: "1px solid " + (isToday ? "#D97706" : "var(--color-border-light)") }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{day.label}</div>
                <div style={{ fontSize: 11, color: isToday ? "#D97706" : "var(--color-slate-light)", marginTop: 2, fontWeight: isToday ? 700 : 400 }}>{fDt(wDts[idx])}</div>
              </div>
            );
          })}

          {/* Period rows */}
          {PT.map((pt) => (
            <React.Fragment key={pt.p}>
              <div style={{ padding: "10px 6px", textAlign: "center" }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>P{pt.p}</div>
                <div style={{ fontSize: 9, color: "var(--color-slate-light)", marginTop: 2 }}>{pt.s}–{pt.e}</div>
              </div>

              {DAYS.map((day) => {
                const daySlots = getDaySlots(day.key);
                const sl = daySlots.find((s) => s.period === pt.p);

                if (!sl) return (
                  <div key={day.key} style={{ background: "var(--color-surface-alt)", border: "1px solid var(--color-border-light)", borderRadius: 6, padding: 8, minHeight: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ color: "var(--color-border)", fontSize: 16 }}>—</span>
                  </div>
                );

                const pl = sl.plan;
                const sc = pl ? SC[pl.status] : null;
                const Ic = sc ? sc.ic : null;
                const clsColor = getClassColor(sl.classroom);

                return (
                  <div key={day.key}
                    style={{
                      background: clsColor.l,
                      border: "1px solid " + clsColor.v + "33",
                      borderRadius: 6,
                      padding: 10,
                      minHeight: 100,
                      cursor: "pointer",
                      borderTop: pl ? "3px solid " + sc.c : "3px solid var(--color-border-light)",
                      borderLeft: "5px solid " + clsColor.v,
                      position: "relative",
                    }}
                    onClick={() => pl ? setSp({ ...pl, slot: sl, day: day.key }) : openC(day.key, sl)}>

                    {/* Class label + subject tag */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: clsColor.v }}>{sl.classroom}</span>
                      <span style={{ fontSize: 9, fontWeight: 600, color: clsColor.v, background: clsColor.v + "20", padding: "1px 6px", borderRadius: 99 }}>{sl.subject}</span>
                    </div>

                    {pl ? (
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--color-navy)", lineHeight: 1.3, marginBottom: 5 }}>{pl.title}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
                          <div style={{ display: "inline-flex", alignItems: "center", gap: 2, padding: "2px 6px", borderRadius: 99, fontSize: 9, fontWeight: 600, background: sc.bg, color: sc.c }}>
                            <Ic size={10} /> {sc.lb}
                          </div>
                          {pl.attachment_count > 0 && (
                            <div style={{ display: "inline-flex", alignItems: "center", gap: 2, fontSize: 9, color: "var(--color-slate-light)" }}>
                              <Paperclip size={9} /> {pl.attachment_count}
                            </div>
                          )}
                        </div>
                        {pl.has_delivery && (
                          <div style={{ display: "inline-flex", alignItems: "center", gap: 2, marginTop: 3, fontSize: 9, color: "#059669", fontWeight: 600 }}>
                            <Check size={10} /> Delivered
                          </div>
                        )}
                      </div>
                    ) : (
                      <button
                        style={{ display: "flex", alignItems: "center", gap: 3, width: "100%", marginTop: 8, padding: 6, fontSize: 11, fontWeight: 500, fontFamily: "var(--font-body)", background: "#FFF", color: "var(--color-slate)", border: "1px dashed var(--color-border)", borderRadius: 4, cursor: "pointer", justifyContent: "center" }}
                        onClick={(e) => { e.stopPropagation(); openC(day.key, sl); }}>
                        <Plus size={14} /> Add Plan
                      </button>
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ── LEGEND ── */}
      <div style={{ display: "flex", gap: 16, justifyContent: "center", padding: "8px 0", fontSize: 12, color: "var(--color-slate)", flexWrap: "wrap", alignItems: "center" }}>
        {Object.entries(SC).map(([k, v]) => (
          <div key={k} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: v.c }} />
            {v.lb}
          </div>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════
          DETAIL SIDE PANEL
      ═══════════════════════════════════════════════════════════ */}
      {sp && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.4)", zIndex: 200, display: "flex", justifyContent: "flex-end", animation: "fadeIn 0.2s" }}
          onClick={() => setSp(null)}>
          <div style={{ width: 520, height: "100%", background: "#FFF", overflowY: "auto", padding: 24, animation: "slideIn 0.25s ease-out", boxShadow: "0 12px 32px rgba(0,0,0,0.1)" }}
            onClick={(e) => e.stopPropagation()}>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
              <div>
                <div style={{ fontSize: 13, color: "#D97706", fontWeight: 600, marginBottom: 4 }}>
                  {sp.slot?.classroom} · {sp.slot?.subject} · P{sp.slot?.period} · {DAYS.find((d) => d.key === sp.day)?.label}
                </div>
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 600 }}>{sp.title}</h2>
              </div>
              <button onClick={() => setSp(null)} style={{ background: "none", border: "none", color: "var(--color-slate-light)", cursor: "pointer" }}><X size={20} /></button>
            </div>

            {SC[sp.status] && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 99, fontSize: 13, fontWeight: 600, background: SC[sp.status].bg, color: SC[sp.status].c, marginBottom: 20 }}>
                {React.createElement(SC[sp.status].ic, { size: 14 })} {SC[sp.status].lb}
              </div>
            )}

            {[
              { lb: "Objectives", val: sp.objectives },
              { lb: "Activities", val: sp.activities },
              sp.differentiation && { lb: "Differentiation", val: sp.differentiation },
              sp.resources_note && { lb: "Resources", val: sp.resources_note },
            ].filter(Boolean).map((f, i) => (
              <div key={i} style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--color-slate-light)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>{f.lb}</div>
                <div style={{ fontSize: 14, color: "var(--color-navy)", lineHeight: 1.7 }}>{f.val}</div>
              </div>
            ))}

            {/* Panel actions */}
            <div style={{ display: "flex", gap: 8, paddingTop: 24, borderTop: "1px solid var(--color-border-light)", flexWrap: "wrap" }}>
              {(sp.status === "draft" || sp.status === "rejected") && (
                <button onClick={() => openE(sp, sp.slot, sp.day)}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 18px", fontSize: 14, fontWeight: 600, fontFamily: "var(--font-body)", background: "#DBEAFE", color: "#2563EB", border: "none", borderRadius: 6, cursor: "pointer" }}>
                  <Edit3 size={14} /> Edit Plan
                </button>
              )}
              {sp.status === "draft" && (
                <button onClick={() => handleSubmitPlan(sp.id)} disabled={saving}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 18px", fontSize: 14, fontWeight: 600, fontFamily: "var(--font-body)", background: "#D97706", color: "#FFF", border: "none", borderRadius: 6, cursor: "pointer", opacity: saving ? 0.7 : 1 }}>
                  {saving ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Send size={14} />} Submit
                </button>
              )}
              {sp.status === "approved" && !sp.has_delivery && (
                <button onClick={() => handleDeliver(sp.id)} disabled={saving}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 18px", fontSize: 14, fontWeight: 600, fontFamily: "var(--font-body)", background: "#D1FAE5", color: "#059669", border: "none", borderRadius: 6, cursor: "pointer", opacity: saving ? 0.7 : 1 }}>
                  {saving ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Check size={14} />} Mark Delivered
                </button>
              )}
              <button onClick={() => handleDeletePlan(sp.id)}
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
          onClick={() => { setShowCr(false); setSaveErr(""); }}>
          <div style={{ width: 720, maxHeight: "92vh", background: "#FFF", borderRadius: 16, overflow: "hidden", display: "flex", flexDirection: "column" }}
            onClick={(e) => e.stopPropagation()}>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: 24, borderBottom: "1px solid var(--color-border-light)" }}>
              <div>
                <div style={{ fontSize: 13, color: "#D97706", fontWeight: 600, marginBottom: 4 }}>{tgt.subject} · {tgt.classroom} · P{tgt.period}</div>
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 600 }}>{isEd ? "Edit Lesson Plan" : "New Lesson Plan"}</h2>
              </div>
              <button onClick={() => { setShowCr(false); setSaveErr(""); }} style={{ background: "none", border: "none", color: "var(--color-slate-light)", cursor: "pointer" }}><X size={20} /></button>
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
                  onChange={(e) => { setFm({ ...fm, t: e.target.value }); if (saveErr) setSaveErr(""); }}
                  placeholder="e.g. Algebraic Expressions"
                  style={{ width: "100%", padding: "10px 14px", fontSize: 14, fontFamily: "var(--font-body)", border: "1.5px solid var(--color-border)", borderRadius: 6, color: "var(--color-navy)", boxSizing: "border-box" }} />
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "var(--color-slate)", display: "block", marginBottom: 4 }}>Objectives *</label>
                <textarea rows={3} value={fm.obj}
                  onChange={(e) => { setFm({ ...fm, obj: e.target.value }); if (saveErr) setSaveErr(""); }}
                  placeholder="What will learners be able to do by the end of this lesson?"
                  style={{ width: "100%", padding: "10px 14px", fontSize: 14, fontFamily: "var(--font-body)", border: "1.5px solid var(--color-border)", borderRadius: 6, color: "var(--color-navy)", resize: "vertical", boxSizing: "border-box" }} />
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "var(--color-slate)", display: "block", marginBottom: 4 }}>Activities *</label>
                <textarea rows={3} value={fm.act}
                  onChange={(e) => { setFm({ ...fm, act: e.target.value }); if (saveErr) setSaveErr(""); }}
                  placeholder="Key teaching activities and learner tasks"
                  style={{ width: "100%", padding: "10px 14px", fontSize: 14, fontFamily: "var(--font-body)", border: "1.5px solid var(--color-border)", borderRadius: 6, color: "var(--color-navy)", resize: "vertical", boxSizing: "border-box" }} />
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "var(--color-slate)", display: "block", marginBottom: 4 }}>Differentiation</label>
                <textarea rows={2} value={fm.dif}
                  onChange={(e) => setFm({ ...fm, dif: e.target.value })}
                  placeholder="How will you support or extend learners? (optional)"
                  style={{ width: "100%", padding: "10px 14px", fontSize: 14, fontFamily: "var(--font-body)", border: "1.5px solid var(--color-border)", borderRadius: 6, color: "var(--color-navy)", resize: "vertical", boxSizing: "border-box" }} />
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "var(--color-slate)", display: "block", marginBottom: 4 }}>Resources</label>
                <input type="text" value={fm.res}
                  onChange={(e) => setFm({ ...fm, res: e.target.value })}
                  placeholder="Textbooks, worksheets, digital tools… (optional)"
                  style={{ width: "100%", padding: "10px 14px", fontSize: 14, fontFamily: "var(--font-body)", border: "1.5px solid var(--color-border)", borderRadius: 6, color: "var(--color-navy)", boxSizing: "border-box" }} />
              </div>

              {/* Attachments */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "var(--color-slate)", display: "block", marginBottom: 8 }}>Attachments</label>
                <input type="file" multiple ref={fRef} onChange={onCreateFiles} style={{ display: "none" }} />
                <button onClick={() => fRef.current?.click()}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", border: "1px dashed var(--color-border)", borderRadius: 6, background: "var(--color-surface-alt)", cursor: "pointer", fontSize: 13, color: "var(--color-slate)", fontFamily: "var(--font-body)" }}>
                  <Paperclip size={14} /> Attach files
                </button>

                {pnd.length > 0 && (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--color-slate-light)", marginBottom: 6 }}>NEW FILES</div>
                    {pnd.map((f, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: "var(--color-surface-alt)", borderRadius: 6, border: "1px solid var(--color-border-light)", marginBottom: 4 }}>
                        <File size={14} color="var(--color-info)" />
                        <span style={{ flex: 1, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</span>
                        <span style={{ fontSize: 11, color: "var(--color-slate-light)" }}>{fSz(f.size)}</span>
                        <button onClick={() => rmPending(i)} style={{ background: "none", border: "none", color: "#DC2626", cursor: "pointer", padding: 4 }}><X size={14} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "16px 24px", borderTop: "1px solid var(--color-border-light)", background: "var(--color-surface-alt)" }}>
              <button onClick={() => { setShowCr(false); setSaveErr(""); }}
                style={{ padding: "10px 18px", fontSize: 14, fontWeight: 500, fontFamily: "var(--font-body)", background: "transparent", color: "var(--color-slate)", border: "1px solid var(--color-border)", borderRadius: 6, cursor: "pointer" }}>
                Cancel
              </button>
              <button onClick={() => doSave(false)} disabled={saving || !fm.t || !fm.obj}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 18px", fontSize: 14, fontWeight: 600, fontFamily: "var(--font-body)", background: "#FFF", color: "var(--color-navy)", border: "1px solid var(--color-border)", borderRadius: 6, cursor: "pointer", opacity: saving || !fm.t ? 0.6 : 1 }}>
                {saving ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Save size={16} />}
                {isEd ? "Update Draft" : "Save Draft"}
              </button>
              <button onClick={() => doSave(true)} disabled={saving || !fm.t || !fm.obj || !fm.act}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 18px", fontSize: 14, fontWeight: 600, fontFamily: "var(--font-body)", background: "#D97706", color: "#FFF", border: "none", borderRadius: 6, cursor: "pointer", opacity: saving || !fm.act ? 0.6 : 1 }}>
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
          onClick={() => { setShowImp(false); setIRes(null); }}>
          <div style={{ width: 520, maxHeight: "85vh", background: "#FFF", borderRadius: 16, overflow: "hidden", display: "flex", flexDirection: "column" }}
            onClick={(e) => e.stopPropagation()}>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: 24, borderBottom: "1px solid var(--color-border-light)" }}>
              <div>
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 600 }}>Import Lesson Plans</h2>
                <p style={{ fontSize: 13, color: "var(--color-slate)", marginTop: 4 }}>Upload CSV or Excel</p>
              </div>
              <button onClick={() => { setShowImp(false); setIRes(null); }} style={{ background: "none", border: "none", color: "var(--color-slate-light)", cursor: "pointer" }}><X size={20} /></button>
            </div>

            <div style={{ padding: 24, overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
              <input type="file" ref={iRef} accept=".csv,.xlsx,.xls" onChange={doImp} style={{ display: "none" }} />
              <button onClick={() => iRef.current?.click()}
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
                  {(iRes.er || []).map((e, i) => <div key={i} style={{ color: "#DC2626" }}>✕ {e}</div>)}
                </div>
              )}

              <div style={{ paddingTop: 8, borderTop: "1px solid var(--color-border-light)" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-slate)", marginBottom: 8 }}>Export current plans</div>
                <div style={{ display: "flex", gap: 8 }}>
                  {["csv", "xlsx"].map((f) => (
                    <button key={f} onClick={() => doExp(f)}
                      style={{ flex: 1, padding: "8px 0", border: "1px solid var(--color-border)", borderRadius: 6, background: "#FFF", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600, color: "var(--color-slate)", textTransform: "uppercase" }}>
                      {f}
                    </button>
                  ))}
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
