import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  Users, Search, X, ChevronDown, Phone, Mail, Shield, FileText,
  Plus, Calendar, AlertTriangle, Check, LayoutGrid, List,
  UserPlus, UserMinus, BookOpen, GraduationCap, Filter,
  TrendingUp, TrendingDown, Clock,
} from "lucide-react";

// ─── STATIC DATA ────────────────────────────────────────────────────────────

var GRADES = [
  { id: "g10", name: "Grade 10" },
  { id: "g11", name: "Grade 11" },
  { id: "g12", name: "Grade 12" },
];

var SUBJECTS = [
  { id: "math", name: "Mathematics", code: "MATH" },
  { id: "eng", name: "English", code: "ENG" },
  { id: "phys", name: "Physical Sciences", code: "PHYS" },
  { id: "life", name: "Life Sciences", code: "LIFE" },
  { id: "geo", name: "Geography", code: "GEO" },
  { id: "hist", name: "History", code: "HIST" },
  { id: "acc", name: "Accounting", code: "ACC" },
  { id: "lo", name: "Life Orientation", code: "LO" },
];

var CLASSES = [
  { id: 1, name: "10A", grade: "Grade 10", gradeId: "g10", count: 30 },
  { id: 2, name: "10B", grade: "Grade 10", gradeId: "g10", count: 30 },
  { id: 3, name: "10C", grade: "Grade 10", gradeId: "g10", count: 30 },
  { id: 4, name: "11A", grade: "Grade 11", gradeId: "g11", count: 30 },
  { id: 5, name: "11B", grade: "Grade 11", gradeId: "g11", count: 30 },
  { id: 6, name: "12A", grade: "Grade 12", gradeId: "g12", count: 30 },
];

// Learner → subject mapping (which subjects each learner takes)
var LEARNER_SUBJECTS = {
  1: ["math","eng","phys","geo"],
  2: ["math","eng","life","hist"],
  3: ["math","eng","phys","geo"],
  4: ["math","eng","life","lo"],
  5: ["math","eng","acc","lo"],
  6: ["math","eng","phys","hist"],
  7: ["math","eng","life","geo"],
  8: ["math","eng","phys","lo"],
  9: ["math","eng","acc","hist"],
  10: ["math","eng","life","geo"],
  11: ["math","eng","phys","lo"],
  12: ["math","eng","acc","geo"],
  13: ["math","eng","life","hist"],
  14: ["math","eng","phys","lo"],
  15: ["math","eng","acc","lo"],
  16: ["math","eng","phys","geo"],
  17: ["math","eng","life","hist"],
  18: ["math","eng","acc","lo"],
  19: ["math","eng","life","geo"],
  20: ["math","eng","acc","hist"],
};

var INIT_LEARNERS = [
  {id:1,fn:"Lerato",ln:"Mokoena",cl:"10A",gr:"Grade 10",grId:"g10",att:96,lang:"Sesotho",absences:2,late:1,risk:null,needs:""},
  {id:2,fn:"Ethan",ln:"Van der Merwe",cl:"10A",gr:"Grade 10",grId:"g10",att:98,lang:"English",absences:1,late:0,risk:null,needs:""},
  {id:3,fn:"Thandi",ln:"Naidoo",cl:"10A",gr:"Grade 10",grId:"g10",att:88,lang:"English",absences:6,late:2,risk:"medium",needs:""},
  {id:4,fn:"Sipho",ln:"Dlamini",cl:"10A",gr:"Grade 10",grId:"g10",att:72,lang:"isiZulu",absences:14,late:3,risk:"high",needs:"Behaviour support plan"},
  {id:5,fn:"Priya",ln:"Williams",cl:"10A",gr:"Grade 10",grId:"g10",att:100,lang:"English",absences:0,late:0,risk:null,needs:""},
  {id:6,fn:"Kagiso",ln:"Botha",cl:"10A",gr:"Grade 10",grId:"g10",att:94,lang:"Setswana",absences:3,late:1,risk:null,needs:""},
  {id:7,fn:"Zanele",ln:"Pillay",cl:"10A",gr:"Grade 10",grId:"g10",att:91,lang:"isiZulu",absences:4,late:2,risk:null,needs:""},
  {id:8,fn:"Bongani",ln:"Zulu",cl:"10A",gr:"Grade 10",grId:"g10",att:78,lang:"isiZulu",absences:11,late:1,risk:"high",needs:"IEP — Reading support"},
  {id:9,fn:"Emma",ln:"Maharaj",cl:"10A",gr:"Grade 10",grId:"g10",att:97,lang:"English",absences:1,late:1,risk:null,needs:""},
  {id:10,fn:"Neo",ln:"September",cl:"10A",gr:"Grade 10",grId:"g10",att:85,lang:"Afrikaans",absences:7,late:3,risk:"medium",needs:""},
  {id:11,fn:"Aisha",ln:"Smith",cl:"10B",gr:"Grade 10",grId:"g10",att:95,lang:"English",absences:2,late:1,risk:null,needs:""},
  {id:12,fn:"Tshepo",ln:"Fourie",cl:"10B",gr:"Grade 10",grId:"g10",att:89,lang:"Sesotho",absences:5,late:2,risk:null,needs:""},
  {id:13,fn:"Naledi",ln:"Govender",cl:"10B",gr:"Grade 10",grId:"g10",att:93,lang:"English",absences:3,late:1,risk:null,needs:""},
  {id:14,fn:"Mandla",ln:"Mahlangu",cl:"10B",gr:"Grade 10",grId:"g10",att:76,lang:"isiZulu",absences:12,late:2,risk:"high",needs:""},
  {id:15,fn:"Chloe",ln:"Khoza",cl:"10B",gr:"Grade 10",grId:"g10",att:99,lang:"English",absences:0,late:1,risk:null,needs:""},
  {id:16,fn:"David",ln:"Louw",cl:"11A",gr:"Grade 11",grId:"g11",att:92,lang:"Afrikaans",absences:4,late:1,risk:null,needs:""},
  {id:17,fn:"Palesa",ln:"Jordaan",cl:"11A",gr:"Grade 11",grId:"g11",att:87,lang:"Sesotho",absences:6,late:3,risk:"medium",needs:""},
  {id:18,fn:"Rajan",ln:"Erasmus",cl:"11B",gr:"Grade 11",grId:"g11",att:94,lang:"English",absences:3,late:0,risk:null,needs:""},
  {id:19,fn:"Lindiwe",ln:"Cloete",cl:"11B",gr:"Grade 11",grId:"g11",att:81,lang:"isiZulu",absences:9,late:2,risk:"medium",needs:"Maths support"},
  {id:20,fn:"Ahmed",ln:"Patel",cl:"12A",gr:"Grade 12",grId:"g12",att:97,lang:"English",absences:1,late:1,risk:null,needs:""},
];

var DETAIL_GUARDIANS = [
  {id:1,name:"Mrs Mokoena",rel:"Mother",phone:"082-555-1234",email:"mom.mokoena@email.co.za",primary:true},
  {id:2,name:"Mr Mokoena",rel:"Father",phone:"082-555-5678",email:"dad.mokoena@email.co.za",primary:false},
];
var DETAIL_ATTENDANCE = [
  {date:"2026-03-07",day:"Friday",p:1,sub:"Mathematics",st:"present"},
  {date:"2026-03-06",day:"Thursday",p:4,sub:"Mathematics",st:"present"},
  {date:"2026-03-05",day:"Wednesday",p:1,sub:"Mathematics",st:"late"},
  {date:"2026-03-04",day:"Tuesday",p:1,sub:"Mathematics",st:"present"},
  {date:"2026-03-03",day:"Monday",p:1,sub:"Mathematics",st:"absent",reason:"Sick — flu"},
  {date:"2026-02-28",day:"Friday",p:1,sub:"Mathematics",st:"present"},
  {date:"2026-02-27",day:"Thursday",p:4,sub:"Mathematics",st:"present"},
  {date:"2026-02-26",day:"Wednesday",p:1,sub:"Mathematics",st:"present"},
  {date:"2026-02-25",day:"Tuesday",p:1,sub:"Mathematics",st:"absent",reason:"Family matter"},
  {date:"2026-02-24",day:"Monday",p:1,sub:"Mathematics",st:"present"},
];
var DETAIL_SUPPORT = [
  {id:1,type:"IEP",desc:"Reading comprehension support — extra time on assessments, paired reading sessions twice weekly.",start:"2026-01-15",end:"2026-06-30",active:true,by:"S. Williams"},
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function attColor(r) {
  if (r === null) return { c: "#475569", bg: "#F1F5F9" };
  if (r >= 90) return { c: "#059669", bg: "#D1FAE5" };
  if (r >= 80) return { c: "#D97706", bg: "#FEF3C7" };
  return { c: "#DC2626", bg: "#FEE2E2" };
}
function riskBadge(r) {
  if (!r) return null;
  var m = { high: { c: "#DC2626", bg: "#FEE2E2", lb: "High Risk" }, medium: { c: "#D97706", bg: "#FEF3C7", lb: "Medium Risk" } };
  return m[r] || null;
}
function stColor(st) {
  var m = { present: { c: "#059669", bg: "#D1FAE5" }, absent: { c: "#DC2626", bg: "#FEE2E2" }, late: { c: "#D97706", bg: "#FEF3C7" } };
  return m[st] || { c: "#475569", bg: "#F1F5F9" };
}

// ─── ENROLL MODAL ─────────────────────────────────────────────────────────────

function EnrollModal({ learner, allLearners, onClose, onSave }) {
  var [selCls, setSelCls] = useState(learner ? learner.cl : "");
  var [mode, setMode] = useState("move"); // "move" or "remove"

  if (!learner) return null;

  function handleSave() {
    if (mode === "remove") {
      onSave(learner.id, null, null, null);
    } else if (selCls && selCls !== learner.cl) {
      var cls = CLASSES.find(function(c) { return c.name === selCls; });
      if (cls) onSave(learner.id, selCls, cls.grade, cls.gradeId);
    }
    onClose();
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", animation: "fadeIn 0.15s" }}
      onClick={onClose}>
      <div style={{ width: 460, background: "#FFF", borderRadius: 16, overflow: "hidden", boxShadow: "0 24px 64px rgba(0,0,0,0.15)" }}
        onClick={function(e) { e.stopPropagation(); }}>
        {/* Header */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "#7C3AED", textTransform: "uppercase", marginBottom: 2 }}>Class Enrollment</div>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 600, color: "var(--color-navy)" }}>
              {learner.fn} {learner.ln}
            </h3>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-slate-light)" }}><X size={20} /></button>
        </div>

        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Current class badge */}
          <div style={{ padding: "12px 16px", background: "#F8FAFC", borderRadius: 10, border: "1px solid #E2E8F0", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#7C3AED" }} />
            <span style={{ fontSize: 13, color: "#64748B" }}>Currently enrolled in</span>
            <span style={{ fontWeight: 700, fontSize: 14, color: "var(--color-navy)" }}>{learner.cl} ({learner.gr})</span>
          </div>

          {/* Mode toggle */}
          <div style={{ display: "flex", gap: 8 }}>
            {[{ k: "move", lb: "Move to another class", icon: UserPlus }, { k: "remove", lb: "Remove from class", icon: UserMinus }].map(function(m) {
              var Icon = m.icon;
              var active = mode === m.k;
              return (
                <button key={m.k} onClick={function() { setMode(m.k); }}
                  style={{ flex: 1, padding: "10px 12px", border: "2px solid " + (active ? (m.k === "remove" ? "#DC2626" : "#7C3AED") : "#E2E8F0"), borderRadius: 10, cursor: "pointer", background: active ? (m.k === "remove" ? "#FEE2E2" : "#EDE9FE") : "#FFF", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontFamily: "var(--font-body)", fontSize: 13, fontWeight: active ? 600 : 400, color: active ? (m.k === "remove" ? "#DC2626" : "#7C3AED") : "#64748B", transition: "all 0.15s" }}>
                  <Icon size={15} /> {m.lb}
                </button>
              );
            })}
          </div>

          {/* Class picker */}
          {mode === "move" && (
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#64748B", display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Select destination class</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                {CLASSES.map(function(cls) {
                  var isCurrent = cls.name === learner.cl;
                  var isSelected = selCls === cls.name;
                  return (
                    <button key={cls.id} disabled={isCurrent} onClick={function() { setSelCls(cls.name); }}
                      style={{ padding: "12px 8px", border: "2px solid " + (isSelected ? "#7C3AED" : isCurrent ? "#E2E8F0" : "#E2E8F0"), borderRadius: 10, cursor: isCurrent ? "not-allowed" : "pointer", background: isSelected ? "#EDE9FE" : isCurrent ? "#F8FAFC" : "#FFF", textAlign: "center", opacity: isCurrent ? 0.5 : 1, transition: "all 0.15s" }}>
                      <div style={{ fontWeight: 700, fontSize: 16, color: isSelected ? "#7C3AED" : "var(--color-navy)" }}>{cls.name}</div>
                      <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>{cls.grade}</div>
                      {isCurrent && <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 2 }}>Current</div>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {mode === "remove" && (
            <div style={{ padding: 16, background: "#FEF2F2", borderRadius: 10, border: "1px solid #FECACA" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#DC2626", fontWeight: 600, fontSize: 14 }}>
                <AlertTriangle size={16} /> This will unenroll {learner.fn} from {learner.cl}
              </div>
              <div style={{ fontSize: 13, color: "#B91C1C", marginTop: 6, lineHeight: 1.5 }}>
                The learner's records will be retained but they will no longer appear in class rosters.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 24px", borderTop: "1px solid #E2E8F0", display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={onClose} style={{ padding: "10px 20px", border: "1px solid #E2E8F0", borderRadius: 8, background: "#FFF", fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600, color: "#64748B", cursor: "pointer" }}>Cancel</button>
          <button onClick={handleSave}
            disabled={mode === "move" && (!selCls || selCls === learner.cl)}
            style={{ padding: "10px 20px", border: "none", borderRadius: 8, background: mode === "remove" ? "#DC2626" : "#7C3AED", color: "#FFF", fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: (mode === "move" && (!selCls || selCls === learner.cl)) ? 0.5 : 1, display: "flex", alignItems: "center", gap: 6 }}>
            {mode === "remove" ? <><UserMinus size={14} /> Remove from Class</> : <><Check size={14} /> Confirm Move</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── BREAKDOWN VIEW ───────────────────────────────────────────────────────────

function BreakdownView({ learners }) {
  var [breakBy, setBreakBy] = useState("class"); // "class" | "grade" | "subject"

  function getGroups() {
    if (breakBy === "grade") {
      return GRADES.map(function(g) {
        var members = learners.filter(function(l) { return l.grId === g.id; });
        return { key: g.id, label: g.name, subtitle: null, members: members, icon: GraduationCap, color: "#7C3AED", bg: "#EDE9FE" };
      }).filter(function(g) { return g.members.length > 0; });
    }
    if (breakBy === "subject") {
      return SUBJECTS.map(function(s) {
        var members = learners.filter(function(l) {
          var subs = LEARNER_SUBJECTS[l.id] || [];
          return subs.indexOf(s.id) !== -1;
        });
        return { key: s.id, label: s.name, subtitle: s.code, members: members, icon: BookOpen, color: "#0891B2", bg: "#E0F2FE" };
      }).filter(function(g) { return g.members.length > 0; });
    }
    // By class (default)
    return CLASSES.map(function(c) {
      var members = learners.filter(function(l) { return l.cl === c.name; });
      return { key: c.id, label: c.name, subtitle: c.grade, members: members, icon: Users, color: "#059669", bg: "#D1FAE5" };
    }).filter(function(g) { return g.members.length > 0; });
  }

  var groups = getGroups();

  return (
    <div>
      {/* Toggle */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, background: "#F8FAFC", padding: 4, borderRadius: 10, width: "fit-content", border: "1px solid #E2E8F0" }}>
        {[{ k: "class", lb: "By Class", icon: Users }, { k: "grade", lb: "By Grade", icon: GraduationCap }, { k: "subject", lb: "By Subject", icon: BookOpen }].map(function(opt) {
          var Icon = opt.icon;
          var active = breakBy === opt.k;
          return (
            <button key={opt.k} onClick={function() { setBreakBy(opt.k); }}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", border: "none", borderRadius: 8, cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 13, fontWeight: active ? 600 : 400, color: active ? "#7C3AED" : "#64748B", background: active ? "#FFF" : "transparent", boxShadow: active ? "0 1px 4px rgba(0,0,0,0.08)" : "none", transition: "all 0.15s" }}>
              <Icon size={14} /> {opt.lb}
            </button>
          );
        })}
      </div>

      {/* Group cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {groups.map(function(g) {
          var Icon = g.icon;
          var avgAtt = g.members.length > 0 ? Math.round(g.members.reduce(function(s, l) { return s + l.att; }, 0) / g.members.length) : 0;
          var atRisk = g.members.filter(function(l) { return l.risk; }).length;
          var ac = attColor(avgAtt);

          return (
            <div key={g.key} style={{ background: "#FFF", border: "1px solid #E2E8F0", borderRadius: 12, overflow: "hidden" }}>
              {/* Group header */}
              <div style={{ padding: "14px 20px", background: "#FAFAFA", borderBottom: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: g.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon size={18} color={g.color} />
                  </div>
                  <div>
                    <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, color: "var(--color-navy)" }}>{g.label}</div>
                    {g.subtitle && <div style={{ fontSize: 12, color: "#94A3B8" }}>{g.subtitle}</div>}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, color: "var(--color-navy)" }}>{g.members.length}</div>
                    <div style={{ fontSize: 10, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.05em" }}>Learners</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, color: ac.c }}>{avgAtt}%</div>
                    <div style={{ fontSize: 10, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.05em" }}>Avg Att.</div>
                  </div>
                  {atRisk > 0 && (
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, color: "#DC2626" }}>{atRisk}</div>
                      <div style={{ fontSize: 10, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.05em" }}>At Risk</div>
                    </div>
                  )}
                  {/* Attendance bar */}
                  <div style={{ width: 120 }}>
                    <div style={{ height: 6, background: "#F1F5F9", borderRadius: 99, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: avgAtt + "%", background: ac.c, borderRadius: 99, transition: "width 0.4s" }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Learner chips */}
              <div style={{ padding: "14px 20px", display: "flex", flexWrap: "wrap", gap: 8 }}>
                {g.members.map(function(l) {
                  var rb = riskBadge(l.risk);
                  var ac2 = attColor(l.att);
                  return (
                    <div key={l.id}
                      style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 12px", background: rb ? rb.bg + "66" : "#F8FAFC", borderRadius: 99, border: "1px solid " + (rb ? rb.c + "44" : "#E2E8F0"), fontSize: 13 }}>
                      <div style={{ width: 24, height: 24, borderRadius: "50%", background: rb ? rb.bg : "#EDE9FE", color: rb ? rb.c : "#7C3AED", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700 }}>
                        {l.fn[0]}{l.ln[0]}
                      </div>
                      <span style={{ fontWeight: 600, color: "var(--color-navy)" }}>{l.fn} {l.ln}</span>
                      <span style={{ fontSize: 11, padding: "2px 6px", borderRadius: 99, background: ac2.bg, color: ac2.c, fontWeight: 600 }}>{l.att}%</span>
                      {breakBy !== "class" && <span style={{ fontSize: 11, color: "#94A3B8" }}>{l.cl}</span>}
                      {rb && <AlertTriangle size={11} color={rb.c} />}
                    </div>
                  );
                })}
                {g.members.length === 0 && <span style={{ fontSize: 13, color: "#94A3B8" }}>No learners</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function LearnersPage() {
  var auth = useAuth(); var user = auth.user;

  // View mode: "list" | "breakdown"
  var [viewMode, setViewMode] = useState("list");

  // Filters
  var [selClass, setSelClass] = useState("all");
  var [selGrade, setSelGrade] = useState("all");
  var [selSubject, setSelSubject] = useState("all");
  var [search, setSearch] = useState("");
  var [showClassDrop, setShowClassDrop] = useState(false);
  var [showGradeDrop, setShowGradeDrop] = useState(false);
  var [showSubjectDrop, setShowSubjectDrop] = useState(false);

  // Learner data (mutable for enroll changes)
  var [learners, setLearners] = useState(INIT_LEARNERS);

  // Detail panel
  var [selLearner, setSelLearner] = useState(null);
  var [detailTab, setDetailTab] = useState("attendance");

  // Enroll modal
  var [enrollLearner, setEnrollLearner] = useState(null);

  // ── Filter logic ──
  var filtered = learners.filter(function(l) {
    if (selClass !== "all" && l.cl !== selClass) return false;
    if (selGrade !== "all" && l.grId !== selGrade) return false;
    if (selSubject !== "all") {
      var subs = LEARNER_SUBJECTS[l.id] || [];
      if (subs.indexOf(selSubject) === -1) return false;
    }
    if (search) {
      var q = search.toLowerCase();
      if ((l.fn + " " + l.ln).toLowerCase().indexOf(q) < 0) return false;
    }
    return true;
  });

  // ── Stats ──
  var tot = filtered.length;
  var atRisk = filtered.filter(function(l) { return l.risk; }).length;
  var avgAtt = tot > 0 ? Math.round(filtered.reduce(function(s, l) { return s + l.att; }, 0) / tot) : 0;

  // ── Enroll save ──
  function handleEnrollSave(learnerId, newCls, newGr, newGrId) {
    setLearners(function(prev) {
      return prev.map(function(l) {
        if (l.id !== learnerId) return l;
        if (newCls === null) {
          // Remove from class
          return Object.assign({}, l, { cl: "—", gr: "—", grId: "" });
        }
        return Object.assign({}, l, { cl: newCls, gr: newGr, grId: newGrId });
      });
    });
    // Update selected learner if detail panel is open
    if (selLearner && selLearner.id === learnerId) {
      setSelLearner(function(prev) {
        if (!prev) return null;
        if (newCls === null) return Object.assign({}, prev, { cl: "—", gr: "—", grId: "" });
        return Object.assign({}, prev, { cl: newCls, gr: newGr, grId: newGrId });
      });
    }
  }

  // ── Active filter count ──
  var activeFilters = [selClass !== "all", selGrade !== "all", selSubject !== "all", search !== ""].filter(Boolean).length;

  function clearFilters() { setSelClass("all"); setSelGrade("all"); setSelSubject("all"); setSearch(""); }

  return (
    <div style={{ padding: 24, maxWidth: 1200 }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 10, background: "#EDE9FE", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Users size={22} color="#7C3AED" />
          </div>
          <div>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 600 }}>Learner Profiles</h1>
            <p style={{ fontSize: 14, color: "var(--color-slate)" }}>View and manage learner information</p>
          </div>
        </div>

        {/* Stats + View toggle */}
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {[
            { lb: "Learners", val: tot, c: "var(--color-navy)" },
            { lb: "Avg Attendance", val: avgAtt + "%", c: attColor(avgAtt).c },
            { lb: "At-Risk", val: atRisk, c: atRisk > 0 ? "#DC2626" : "#059669" },
          ].map(function(s, i) {
            return (
              <div key={i} style={{ textAlign: "center", padding: "8px 16px", background: "#FFF", border: "1px solid #E2E8F0", borderRadius: 8 }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700, color: s.c }}>{s.val}</div>
                <div style={{ fontSize: 11, color: "#94A3B8" }}>{s.lb}</div>
              </div>
            );
          })}

          {/* View mode toggle */}
          <div style={{ display: "flex", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, overflow: "hidden" }}>
            {[{ k: "list", icon: List }, { k: "breakdown", icon: LayoutGrid }].map(function(v) {
              var Icon = v.icon;
              return (
                <button key={v.k} onClick={function() { setViewMode(v.k); }}
                  style={{ padding: "10px 14px", border: "none", cursor: "pointer", background: viewMode === v.k ? "#FFF" : "transparent", color: viewMode === v.k ? "#7C3AED" : "#94A3B8", borderRight: v.k === "list" ? "1px solid #E2E8F0" : "none", transition: "all 0.15s" }}>
                  <Icon size={18} />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Filters ── */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>

        {/* Grade filter */}
        <div style={{ position: "relative" }}>
          <button onClick={function() { setShowGradeDrop(!showGradeDrop); setShowClassDrop(false); setShowSubjectDrop(false); }}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", background: selGrade !== "all" ? "#EDE9FE" : "#FFF", border: "1.5px solid " + (selGrade !== "all" ? "#7C3AED" : "#E2E8F0"), borderRadius: 8, cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 13, fontWeight: selGrade !== "all" ? 600 : 400, color: selGrade !== "all" ? "#7C3AED" : "#64748B", minWidth: 140 }}>
            <GraduationCap size={14} />
            <span style={{ flex: 1, textAlign: "left" }}>{selGrade === "all" ? "All Grades" : GRADES.find(function(g) { return g.id === selGrade; })?.name}</span>
            <ChevronDown size={14} style={{ transform: showGradeDrop ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
          </button>
          {showGradeDrop && (
            <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, minWidth: "100%", background: "#FFF", border: "1.5px solid #E2E8F0", borderRadius: 10, boxShadow: "0 12px 32px rgba(0,0,0,0.1)", zIndex: 50, overflow: "hidden" }}>
              <button onClick={function() { setSelGrade("all"); setShowGradeDrop(false); }}
                style={{ width: "100%", padding: "10px 14px", border: "none", borderBottom: "1px solid #F1F5F9", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 13, textAlign: "left", background: selGrade === "all" ? "#EDE9FE" : "transparent", color: selGrade === "all" ? "#7C3AED" : "inherit" }}>All Grades</button>
              {GRADES.map(function(g) {
                return (
                  <button key={g.id} onClick={function() { setSelGrade(g.id); setShowGradeDrop(false); }}
                    style={{ width: "100%", padding: "10px 14px", border: "none", borderBottom: "1px solid #F1F5F9", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 13, textAlign: "left", background: selGrade === g.id ? "#EDE9FE" : "transparent", color: selGrade === g.id ? "#7C3AED" : "inherit", fontWeight: selGrade === g.id ? 600 : 400 }}>
                    {g.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Class filter */}
        <div style={{ position: "relative" }}>
          <button onClick={function() { setShowClassDrop(!showClassDrop); setShowGradeDrop(false); setShowSubjectDrop(false); }}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", background: selClass !== "all" ? "#EDE9FE" : "#FFF", border: "1.5px solid " + (selClass !== "all" ? "#7C3AED" : "#E2E8F0"), borderRadius: 8, cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 13, fontWeight: selClass !== "all" ? 600 : 400, color: selClass !== "all" ? "#7C3AED" : "#64748B", minWidth: 140 }}>
            <Users size={14} />
            <span style={{ flex: 1, textAlign: "left" }}>{selClass === "all" ? "All Classes" : selClass}</span>
            <ChevronDown size={14} style={{ transform: showClassDrop ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
          </button>
          {showClassDrop && (
            <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, minWidth: 180, background: "#FFF", border: "1.5px solid #E2E8F0", borderRadius: 10, boxShadow: "0 12px 32px rgba(0,0,0,0.1)", zIndex: 50, overflow: "hidden" }}>
              <button onClick={function() { setSelClass("all"); setShowClassDrop(false); }}
                style={{ width: "100%", padding: "10px 14px", border: "none", borderBottom: "1px solid #F1F5F9", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 13, textAlign: "left", background: selClass === "all" ? "#EDE9FE" : "transparent", color: selClass === "all" ? "#7C3AED" : "inherit" }}>All Classes</button>
              {CLASSES.map(function(c) {
                return (
                  <button key={c.id} onClick={function() { setSelClass(c.name); setShowClassDrop(false); }}
                    style={{ width: "100%", padding: "10px 14px", border: "none", borderBottom: "1px solid #F1F5F9", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 13, textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center", background: selClass === c.name ? "#EDE9FE" : "transparent", color: selClass === c.name ? "#7C3AED" : "inherit", fontWeight: selClass === c.name ? 600 : 400 }}>
                    <span>{c.name}</span>
                    <span style={{ fontSize: 11, color: "#94A3B8" }}>{c.grade}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Subject filter */}
        <div style={{ position: "relative" }}>
          <button onClick={function() { setShowSubjectDrop(!showSubjectDrop); setShowGradeDrop(false); setShowClassDrop(false); }}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", background: selSubject !== "all" ? "#E0F2FE" : "#FFF", border: "1.5px solid " + (selSubject !== "all" ? "#0891B2" : "#E2E8F0"), borderRadius: 8, cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 13, fontWeight: selSubject !== "all" ? 600 : 400, color: selSubject !== "all" ? "#0891B2" : "#64748B", minWidth: 160 }}>
            <BookOpen size={14} />
            <span style={{ flex: 1, textAlign: "left" }}>{selSubject === "all" ? "All Subjects" : SUBJECTS.find(function(s) { return s.id === selSubject; })?.name}</span>
            <ChevronDown size={14} style={{ transform: showSubjectDrop ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
          </button>
          {showSubjectDrop && (
            <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, minWidth: 200, background: "#FFF", border: "1.5px solid #E2E8F0", borderRadius: 10, boxShadow: "0 12px 32px rgba(0,0,0,0.1)", zIndex: 50, overflow: "hidden", maxHeight: 280, overflowY: "auto" }}>
              <button onClick={function() { setSelSubject("all"); setShowSubjectDrop(false); }}
                style={{ width: "100%", padding: "10px 14px", border: "none", borderBottom: "1px solid #F1F5F9", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 13, textAlign: "left", background: selSubject === "all" ? "#E0F2FE" : "transparent", color: selSubject === "all" ? "#0891B2" : "inherit" }}>All Subjects</button>
              {SUBJECTS.map(function(s) {
                return (
                  <button key={s.id} onClick={function() { setSelSubject(s.id); setShowSubjectDrop(false); }}
                    style={{ width: "100%", padding: "10px 14px", border: "none", borderBottom: "1px solid #F1F5F9", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 13, textAlign: "left", display: "flex", justifyContent: "space-between", background: selSubject === s.id ? "#E0F2FE" : "transparent", color: selSubject === s.id ? "#0891B2" : "inherit", fontWeight: selSubject === s.id ? 600 : 400 }}>
                    <span>{s.name}</span>
                    <span style={{ fontSize: 11, color: "#94A3B8" }}>{s.code}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Search */}
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Search size={15} color="#94A3B8" style={{ position: "absolute", left: 12, top: 11 }} />
          <input type="text" value={search} onChange={function(e) { setSearch(e.target.value); }} placeholder="Search learners by name…"
            style={{ width: "100%", padding: "9px 14px 9px 36px", fontSize: 13, fontFamily: "var(--font-body)", border: "1.5px solid #E2E8F0", borderRadius: 8, color: "var(--color-navy)", outline: "none", boxSizing: "border-box" }} />
          {search && <button onClick={function() { setSearch(""); }} style={{ position: "absolute", right: 10, top: 9, background: "none", border: "none", cursor: "pointer", color: "#94A3B8" }}><X size={15} /></button>}
        </div>

        {/* Clear filters */}
        {activeFilters > 0 && (
          <button onClick={clearFilters} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", background: "#FFF", border: "1.5px solid #E2E8F0", borderRadius: 8, cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 13, color: "#64748B" }}>
            <X size={13} /> Clear ({activeFilters})
          </button>
        )}
      </div>

      {/* ── Active filter chips ── */}
      {activeFilters > 0 && (
        <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
          {selGrade !== "all" && <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", background: "#EDE9FE", color: "#7C3AED", borderRadius: 99, fontSize: 12, fontWeight: 600 }}><GraduationCap size={11} /> {GRADES.find(function(g) { return g.id === selGrade; })?.name} <button onClick={function() { setSelGrade("all"); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "#7C3AED", display: "flex" }}><X size={11} /></button></span>}
          {selClass !== "all" && <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", background: "#EDE9FE", color: "#7C3AED", borderRadius: 99, fontSize: 12, fontWeight: 600 }}><Users size={11} /> {selClass} <button onClick={function() { setSelClass("all"); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "#7C3AED", display: "flex" }}><X size={11} /></button></span>}
          {selSubject !== "all" && <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", background: "#E0F2FE", color: "#0891B2", borderRadius: 99, fontSize: 12, fontWeight: 600 }}><BookOpen size={11} /> {SUBJECTS.find(function(s) { return s.id === selSubject; })?.name} <button onClick={function() { setSelSubject("all"); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "#0891B2", display: "flex" }}><X size={11} /></button></span>}
        </div>
      )}

      {/* ── BREAKDOWN VIEW ── */}
      {viewMode === "breakdown" && <BreakdownView learners={filtered} />}

      {/* ── LIST VIEW ── */}
      {viewMode === "list" && (
        <>
          <div style={{ background: "#FFF", border: "1px solid #E2E8F0", borderRadius: 12, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ background: "#F8FAFC" }}>
                  {["#","Name","Class","Grade","Language","Attendance","Absences","Status","Actions"].map(function(h, i) {
                    return <th key={i} style={{ textAlign: i <= 1 || i === 8 ? "left" : i >= 5 ? "center" : "left", padding: "12px 14px", fontSize: 11, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{h}</th>;
                  })}
                </tr>
              </thead>
              <tbody>
                {filtered.map(function(l, i) {
                  var ac = attColor(l.att);
                  var rb = riskBadge(l.risk);
                  return (
                    <tr key={l.id}
                      style={{ borderBottom: "1px solid #F1F5F9", transition: "background 0.1s", cursor: "pointer" }}
                      onMouseEnter={function(e) { e.currentTarget.style.background = "#FAFAFA"; }}
                      onMouseLeave={function(e) { e.currentTarget.style.background = "transparent"; }}
                      onClick={function() { setSelLearner(l); setDetailTab("attendance"); }}>
                      <td style={{ padding: "13px 14px", fontSize: 12, color: "#94A3B8" }}>{i + 1}</td>
                      <td style={{ padding: "13px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: "50%", background: rb ? rb.bg : "#EDE9FE", color: rb ? rb.c : "#7C3AED", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                            {l.fn[0]}{l.ln[0]}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: "var(--color-navy)" }}>{l.fn} {l.ln}</div>
                            {l.needs && <div style={{ fontSize: 11, color: "#7C3AED", marginTop: 1 }}><Shield size={9} style={{ display: "inline", marginRight: 2 }} />{l.needs}</div>}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "13px 14px" }}>
                        <span style={{ padding: "3px 10px", background: "#F1F5F9", borderRadius: 99, fontSize: 12, fontWeight: 700, color: "var(--color-navy)" }}>{l.cl}</span>
                      </td>
                      <td style={{ padding: "13px 14px", color: "#64748B", fontSize: 13 }}>{l.gr}</td>
                      <td style={{ padding: "13px 14px", color: "#64748B", fontSize: 13 }}>{l.lang}</td>
                      <td style={{ padding: "13px 14px", textAlign: "center" }}>
                        <span style={{ padding: "4px 12px", borderRadius: 99, fontSize: 13, fontWeight: 600, background: ac.bg, color: ac.c }}>{l.att}%</span>
                      </td>
                      <td style={{ padding: "13px 14px", textAlign: "center" }}>
                        <span style={{ fontWeight: 600, color: l.absences > 5 ? "#DC2626" : "var(--color-navy)" }}>{l.absences}</span>
                      </td>
                      <td style={{ padding: "13px 14px", textAlign: "center" }}>
                        {rb
                          ? <span style={{ padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 600, background: rb.bg, color: rb.c }}>{rb.lb}</span>
                          : <span style={{ fontSize: 12, color: "#059669" }}>OK</span>}
                      </td>
                      {/* ── Enroll action button ── */}
                      <td style={{ padding: "13px 14px" }} onClick={function(e) { e.stopPropagation(); }}>
                        <button
                          onClick={function(e) { e.stopPropagation(); setEnrollLearner(l); }}
                          title="Add / Remove from class"
                          style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 11px", border: "1.5px solid #E2E8F0", borderRadius: 7, background: "#FFF", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#64748B", fontFamily: "var(--font-body)", transition: "all 0.15s" }}
                          onMouseEnter={function(e) { e.currentTarget.style.borderColor = "#7C3AED"; e.currentTarget.style.color = "#7C3AED"; e.currentTarget.style.background = "#EDE9FE"; }}
                          onMouseLeave={function(e) { e.currentTarget.style.borderColor = "#E2E8F0"; e.currentTarget.style.color = "#64748B"; e.currentTarget.style.background = "#FFF"; }}>
                          <Users size={12} /> Enroll
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={9} style={{ padding: 48, textAlign: "center", color: "#94A3B8" }}>
                    <Users size={32} color="#E2E8F0" style={{ display: "block", margin: "0 auto 8px" }} />
                    No learners match your filters
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div style={{ padding: "10px 0", fontSize: 13, color: "#94A3B8", textAlign: "right" }}>
            {filtered.length} learner{filtered.length !== 1 ? "s" : ""} shown
          </div>
        </>
      )}

      {/* ── ENROLL MODAL ── */}
      {enrollLearner && (
        <EnrollModal
          learner={enrollLearner}
          allLearners={learners}
          onClose={function() { setEnrollLearner(null); }}
          onSave={handleEnrollSave}
        />
      )}

      {/* ── DETAIL PANEL ── */}
      {selLearner && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.4)", zIndex: 200, display: "flex", justifyContent: "flex-end", animation: "fadeIn 0.2s" }}
          onClick={function() { setSelLearner(null); }}>
          <div style={{ width: 560, height: "100%", background: "#FFF", overflowY: "auto", animation: "slideIn 0.25s ease-out", boxShadow: "0 12px 32px rgba(0,0,0,0.1)" }}
            onClick={function(e) { e.stopPropagation(); }}>

            {/* Profile header */}
            <div style={{ padding: 24, background: "#EDE9FE", borderBottom: "1px solid #C4B5FD" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#7C3AED", color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700 }}>
                    {selLearner.fn[0]}{selLearner.ln[0]}
                  </div>
                  <div>
                    <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 600, color: "var(--color-navy)" }}>{selLearner.fn} {selLearner.ln}</h2>
                    <div style={{ fontSize: 14, color: "var(--color-slate)" }}>{selLearner.cl} · {selLearner.gr} · {selLearner.lang}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {/* Quick enroll button in panel */}
                  <button onClick={function() { setEnrollLearner(selLearner); }}
                    style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "#FFF", border: "1.5px solid #C4B5FD", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#7C3AED", fontFamily: "var(--font-body)" }}>
                    <Users size={13} /> Enroll
                  </button>
                  <button onClick={function() { setSelLearner(null); }} style={{ background: "none", border: "none", color: "var(--color-slate)", cursor: "pointer" }}><X size={20} /></button>
                </div>
              </div>

              {/* Quick stats */}
              <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                {[
                  { lb: "Attendance", val: selLearner.att + "%", c: attColor(selLearner.att) },
                  { lb: "Absences", val: selLearner.absences, c: selLearner.absences > 5 ? { c: "#DC2626", bg: "#FEE2E2" } : { c: "#059669", bg: "#D1FAE5" } },
                  { lb: "Late", val: selLearner.late, c: { c: "#D97706", bg: "#FEF3C7" } },
                ].map(function(s, i) {
                  return (
                    <div key={i} style={{ flex: 1, padding: "10px 14px", background: "#FFF", borderRadius: 8, textAlign: "center" }}>
                      <div style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700, color: s.c.c }}>{s.val}</div>
                      <div style={{ fontSize: 11, color: "#94A3B8" }}>{s.lb}</div>
                    </div>
                  );
                })}
                {riskBadge(selLearner.risk) && (
                  <div style={{ flex: 1, padding: "10px 14px", background: riskBadge(selLearner.risk).bg, borderRadius: 8, textAlign: "center", border: "1px solid " + riskBadge(selLearner.risk).c + "33" }}>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 700, color: riskBadge(selLearner.risk).c }}><AlertTriangle size={16} /></div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: riskBadge(selLearner.risk).c }}>{riskBadge(selLearner.risk).lb}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", borderBottom: "1px solid #E2E8F0" }}>
              {[{ k: "attendance", lb: "Attendance" }, { k: "guardians", lb: "Guardians" }, { k: "support", lb: "Support Plans" }, { k: "info", lb: "Info" }].map(function(tab) {
                return (
                  <button key={tab.k} onClick={function() { setDetailTab(tab.k); }}
                    style={{ flex: 1, padding: "12px", fontSize: 13, fontWeight: detailTab === tab.k ? 600 : 400, fontFamily: "var(--font-body)", background: "none", border: "none", borderBottom: detailTab === tab.k ? "2px solid #7C3AED" : "2px solid transparent", color: detailTab === tab.k ? "#7C3AED" : "#94A3B8", cursor: "pointer", transition: "all 0.15s" }}>
                    {tab.lb}
                  </button>
                );
              })}
            </div>

            <div style={{ padding: 20 }}>
              {/* Attendance tab */}
              {detailTab === "attendance" && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>Recent Attendance History</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {DETAIL_ATTENDANCE.map(function(rec, i) {
                      var sc = stColor(rec.st);
                      return (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", background: "#FAFAFA", borderRadius: 8, border: "1px solid #E2E8F0" }}>
                          <div>
                            <div style={{ fontWeight: 600, color: "var(--color-navy)", fontSize: 14 }}>{rec.sub}</div>
                            <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>{rec.day}, {rec.date} · Period {rec.p}</div>
                            {rec.reason && <div style={{ fontSize: 12, color: "#DC2626", marginTop: 2 }}>Reason: {rec.reason}</div>}
                          </div>
                          <span style={{ padding: "4px 12px", borderRadius: 99, fontSize: 12, fontWeight: 600, background: sc.bg, color: sc.c, textTransform: "capitalize" }}>{rec.st}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Guardians tab */}
              {detailTab === "guardians" && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>Guardians & Emergency Contacts</div>
                  {DETAIL_GUARDIANS.map(function(g) {
                    return (
                      <div key={g.id} style={{ padding: "14px 16px", background: "#FAFAFA", borderRadius: 10, border: "1px solid #E2E8F0", marginBottom: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                          <div style={{ fontWeight: 600, fontSize: 15, color: "var(--color-navy)" }}>{g.name} <span style={{ fontSize: 12, color: "#64748B", fontWeight: 400 }}>({g.rel})</span></div>
                          {g.primary && <span style={{ fontSize: 10, fontWeight: 700, color: "#7C3AED", background: "#EDE9FE", padding: "3px 10px", borderRadius: 99 }}>PRIMARY</span>}
                        </div>
                        <div style={{ display: "flex", gap: 16 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#64748B" }}><Phone size={14} color="#0891B2" /> {g.phone}</div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#64748B" }}><Mail size={14} color="#0891B2" /> {g.email}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Support plans tab */}
              {detailTab === "support" && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.05em" }}>Active Support Plans</div>
                    <button style={{ display: "flex", alignItems: "center", gap: 4, padding: "8px 14px", fontSize: 13, fontWeight: 600, fontFamily: "var(--font-body)", background: "#EDE9FE", color: "#7C3AED", border: "none", borderRadius: 6, cursor: "pointer" }}><Plus size={14} /> Add Plan</button>
                  </div>
                  {selLearner.needs
                    ? DETAIL_SUPPORT.map(function(p) {
                        return (
                          <div key={p.id} style={{ padding: 16, background: "#FAFAFA", borderRadius: 10, border: "1px solid #E2E8F0" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Shield size={16} color="#7C3AED" /><span style={{ fontWeight: 600, fontSize: 15 }}>{p.type}</span></div>
                              <span style={{ fontSize: 10, fontWeight: 700, color: "#059669", background: "#D1FAE5", padding: "3px 10px", borderRadius: 99 }}>ACTIVE</span>
                            </div>
                            <div style={{ fontSize: 14, color: "var(--color-navy)", lineHeight: 1.6, marginBottom: 8 }}>{p.desc}</div>
                            <div style={{ display: "flex", gap: 16, fontSize: 12, color: "#64748B" }}>
                              <span><Calendar size={12} style={{ display: "inline", marginRight: 3 }} />{p.start} — {p.end}</span>
                              <span>Created by {p.by}</span>
                            </div>
                          </div>
                        );
                      })
                    : <div style={{ textAlign: "center", padding: 32, color: "#94A3B8" }}><Shield size={32} color="#E2E8F0" style={{ display: "block", margin: "0 auto 8px" }} /><p>No active support plans</p></div>
                  }
                </div>
              )}

              {/* Info tab */}
              {detailTab === "info" && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>Learner Information</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {[
                      { lb: "Full Name", val: selLearner.fn + " " + selLearner.ln },
                      { lb: "Class", val: selLearner.cl + " (" + selLearner.gr + ")" },
                      { lb: "Home Language", val: selLearner.lang },
                      { lb: "Special Needs", val: selLearner.needs || "None recorded" },
                    ].map(function(f, i) {
                      return (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "12px 16px", background: i % 2 === 0 ? "#FAFAFA" : "#FFF", borderRadius: 8 }}>
                          <span style={{ fontSize: 13, color: "#64748B" }}>{f.lb}</span>
                          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-navy)" }}>{f.val}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Animations */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideIn { from { transform: translateX(100%) } to { transform: translateX(0) } }
      `}</style>
    </div>
  );
}
