import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ClipboardCheck, Check, X, Clock, Search,
  ChevronDown, Save, Loader2, ArrowLeft,
} from "lucide-react";

// ─── DATA: Each class has its own learner roster ─────────────────────────────

const CLASS_ROSTERS = {
  1: [ // 10A Mathematics
    "Lerato Mokoena","Ethan Van der Merwe","Thandi Naidoo","Sipho Dlamini",
    "Priya Williams","Kagiso Botha","Zanele Pillay","Bongani Zulu",
    "Emma Maharaj","Neo September","Aisha Smith","Tshepo Fourie",
    "Naledi Govender","Mandla Mahlangu","Chloe Khoza","David Louw",
    "Palesa Jordaan","Rajan Erasmus","Lindiwe Cloete","Ahmed Patel",
    "Kefilwe Ngcobo","Jason Venter","Sarah Modise","Michael Adams",
    "Ava Petersen","Luke Khumalo","Lisa Sithole","Liam Mthembu",
    "Nomsa Ndlovu","Thabo Cele",
  ],
  2: [ // 10B Mathematics
    "Siphamandla Dube","Yolande Booysen","Tebogo Molefe","Chantelle Erwee",
    "Nkosinathi Mkhize","Fatima Ismail","Brendan Steyn","Zanele Mahlangu",
    "Pieter Marais","Nokwanda Dlamini","Ruvan Pietersen","Asanda Ntanzi",
    "Jenna Cronje","Sibusiso Cele","Lana Van Zyl","Dumisani Buthelezi",
    "Carla Botha","Mpendulo Nkosi","Tamsin Fourie","Lwazi Mthethwa",
    "Natasha Lombard","Sifiso Zulu","Robyn Gerber","Ayanda Ndaba",
    "Christiaan Du Toit","Nomvula Sithole","Warren Swarts","Phumzile Khumalo",
    "Shantel Olivier","Buhle Madlala",
  ],
  3: [ // 10C Mathematics
    "Tumelo Mokoena","Alexia De Beer","Sanele Mthembu","Stephanie Harmse",
    "Lungelo Nxumalo","Bianca Swanepoel","Mvelo Dlamini","Taryn Van Der Berg",
    "Sibonelo Zwane","Kaylee Engelbrecht","Thulani Msweli","Jade Bosman",
    "Lungisa Ngcobo","Tanya Loots","Sipho Buthelezi","Marisha Bekker",
    "Sandile Nkosi","Bianca Britz","Nkosinathi Shabalala","Tarryn Basson",
    "Mthobisi Mkhize","Carmen Raath","Lindani Mthethwa","Rozanne Botha",
    "Njabulo Mhlongo","Tamara Myburgh","Thembinkosi Cele","Kirsty Potgieter",
    "Nqobile Nkosi","Melissa Rademeyer",
  ],
  4: [ // 11A Mathematics
    "Lungelo Shabalala","Bernice Steenkamp","Ntokozo Mthembu","Celeste Uys",
    "Mthokozisi Nkosi","Danielle Louw","Sipho Msomi","Estelle Van Der Merwe",
    "Thulane Dlamini","Faye Harmse","Mandisa Mkhize","Gert Fourie",
    "Nokwazi Ntuli","Hendrik Swanepoel","Siphiwe Zulu","Ilse Botha",
    "Mfanafuthi Mkhize","Juanita Erasmus","Sithembile Ngcobo","Kyle De Villiers",
    "Ntombi Shabalala","Leon Joubert","Phiwayinkosi Mthethwa","Megan Visser",
    "Sandisiwe Cele","Nico Marais","Sifokazi Nkosi","Petra Coetzee",
    "Thobani Buthelezi","Quinn Jacobs",
  ],
  5: [ // 11B Mathematics
    "Ayanda Mthembu","Rudi Steyn","Busisiwe Nkosi","Sune Bosman",
    "Dumisani Ndaba","Tiaan Cronje","Hlengiwe Cele","Ulrich Badenhorst",
    "Jabulani Dube","Vera Potgieter","Khanyisile Mkhize","Willem Fouche",
    "Lungisani Nxumalo","Xanthe De Beer","Mthembeni Shabalala","Yolande Venter",
    "Nkosinathi Buthelezi","Zara Swarts","Phumelele Zulu","Albert Lombard",
    "Qiniso Mthethwa","Bonnie Raath","Rishaad Ismail","Courtney Bekker",
    "Siyabonga Mhlongo","Dianne Marais","Thando Ntuli","Elan Swanepoel",
    "Unathi Dlamini","Florette Botha",
  ],
  7: [ // 12A Mathematics
    "Vusi Mthembu","Alicia Steenkamp","Wandile Nkosi","Bronwyn Joubert",
    "Xolani Shabalala","Cara-Lee Marais","Yenza Dlamini","Deon Cronje",
    "Zanele Buthelezi","Elrika Venter","Anda Cele","Francois De Villiers",
    "Bongiwe Mkhize","Gina Coetzee","Cebo Ndaba","Hannelie Lombard",
    "Dalisu Nxumalo","Ingrid Erasmus","Emihle Zulu","Johan Botha",
    "Fisani Mthethwa","Karen Harmse","Gugulethu Ntuli","Lize Fourie",
    "Hlengiwe Shabalala","Morne Potgieter","Isipho Dube","Nadia Bekker",
    "Jabulani Mhlongo","Olivia Steyn",
  ],
};

const DEMO_CLASSES = [
  { id: 1,  name: "10A", subject: "Mathematics", period: "P1", time: "07:45 – 08:30" },
  { id: 2,  name: "10B", subject: "Mathematics", period: "P2", time: "08:30 – 09:15" },
  { id: 3,  name: "10C", subject: "Mathematics", period: "P3", time: "09:15 – 10:00" },
  { id: 4,  name: "11A", subject: "Mathematics", period: "P4", time: "10:20 – 11:05" },
  { id: 5,  name: "11B", subject: "Mathematics", period: "P5", time: "11:05 – 11:50" },
  { id: 7,  name: "12A", subject: "Mathematics", period: "P7", time: "13:00 – 13:45" },
];

function buildDefaultRecords(classId) {
  const learners = CLASS_ROSTERS[classId] || [];
  const defaults = {};
  learners.forEach((name, i) => {
    defaults[i] = { name, status: "present", reason: "" };
  });
  return defaults;
}

export default function AttendancePage() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const incomingState = location.state;

  const initialClass = incomingState?.slotId
    ? DEMO_CLASSES.find((c) => c.id === incomingState.slotId) || DEMO_CLASSES[0]
    : DEMO_CLASSES[0];

  const [selectedClass, setSelectedClass] = useState(initialClass);
  const [showClassPicker, setShowClassPicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [search, setSearch] = useState("");
  const [records, setRecords] = useState(() => buildDefaultRecords(initialClass.id));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showFromDashboard] = useState(!!incomingState?.slotId);

  // ── When class changes, load THAT class's roster ──
  useEffect(() => {
    setRecords(buildDefaultRecords(selectedClass.id));
    setSearch("");
    setSaved(false);
  }, [selectedClass.id]);

  // ── Handle navigation from dashboard ──
  useEffect(() => {
    if (incomingState?.slotId) {
      const match = DEMO_CLASSES.find((c) => c.id === incomingState.slotId);
      if (match) setSelectedClass(match);
    }
  }, [incomingState]);

  const setStatus = (id, status) => {
    setRecords((prev) => ({ ...prev, [id]: { ...prev[id], status } }));
    setSaved(false);
  };

  const setReason = (id, reason) => {
    setRecords((prev) => ({ ...prev, [id]: { ...prev[id], reason } }));
  };

  const markAllPresent = () => {
    const updated = {};
    Object.entries(records).forEach(([id, rec]) => {
      updated[id] = { ...rec, status: "present", reason: "" };
    });
    setRecords(updated);
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    setSaved(true);
  };

  const filteredLearners = Object.entries(records).filter(([_, rec]) =>
    rec.name.toLowerCase().includes(search.toLowerCase())
  );

  const counts = {
    present: Object.values(records).filter((r) => r.status === "present").length,
    absent:  Object.values(records).filter((r) => r.status === "absent").length,
    late:    Object.values(records).filter((r) => r.status === "late").length,
  };

  const totalLearners = Object.keys(records).length;

  return (
    <div style={styles.page}>
      {showFromDashboard && (
        <button onClick={() => navigate("/")} style={styles.backBtn}>
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
      )}

      {/* Page Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.headerIcon}>
            <ClipboardCheck size={22} color="var(--color-success)" />
          </div>
          <div>
            <h1 style={styles.title}>Attendance Register</h1>
            <p style={styles.subtitle}>
              {selectedDate === new Date().toISOString().split("T")[0]
                ? "Today"
                : new Date(selectedDate + "T00:00:00").toLocaleDateString("en-ZA", {
                    weekday: "long", day: "numeric", month: "long",
                  })}
              {" — "}{selectedClass.name} · {selectedClass.subject}
            </p>
          </div>
        </div>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          style={styles.datePicker}
        />
      </div>

      {/* Class Selector */}
      <div style={styles.classSelectorWrap}>
        <button
          onClick={() => setShowClassPicker(!showClassPicker)}
          style={styles.classSelector}
        >
          <div>
            <span style={styles.classLabel}>
              {selectedClass.subject} — {selectedClass.name}
            </span>
            <span style={styles.classMeta}>
              {selectedClass.period} · {selectedClass.time} · {totalLearners} learners
            </span>
          </div>
          <ChevronDown size={18} color="var(--color-slate-light)"
            style={{ transform: showClassPicker ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
        </button>

        {showClassPicker && (
          <div style={styles.classPicker}>
            {DEMO_CLASSES.map((cls) => (
              <button
                key={cls.id}
                onClick={() => { setSelectedClass(cls); setShowClassPicker(false); }}
                style={{
                  ...styles.classOption,
                  background: cls.id === selectedClass.id ? "var(--color-accent-light)" : "transparent",
                  borderLeft: cls.id === selectedClass.id ? "3px solid var(--color-accent)" : "3px solid transparent",
                }}
              >
                <div>
                  <span style={styles.classOptLabel}>{cls.subject} — {cls.name}</span>
                  <span style={styles.classOptMeta}>
                    {cls.period} · {cls.time} · {(CLASS_ROSTERS[cls.id] || []).length} learners
                  </span>
                </div>
                {cls.id === selectedClass.id && <Check size={16} color="var(--color-accent)" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Stats bar */}
      <div style={styles.statsBar}>
        <div style={{ ...styles.statPill, background: "#D1FAE5" }}>
          <div style={{ ...styles.statDot, background: "var(--color-present)" }} />
          Present: <strong>{counts.present}</strong>
        </div>
        <div style={{ ...styles.statPill, background: "#FEE2E2" }}>
          <div style={{ ...styles.statDot, background: "var(--color-absent)" }} />
          Absent: <strong>{counts.absent}</strong>
        </div>
        <div style={{ ...styles.statPill, background: "#FEF3C7" }}>
          <div style={{ ...styles.statDot, background: "var(--color-late)" }} />
          Late: <strong>{counts.late}</strong>
        </div>
        <div style={{ flex: 1 }} />
        <button onClick={markAllPresent} style={styles.markAllBtn}>
          Mark all present
        </button>
      </div>

      {/* Search */}
      <div style={styles.searchWrap}>
        <Search size={16} color="var(--color-slate-light)" style={{ position: "absolute", left: 12, top: 12 }} />
        <input
          type="text"
          placeholder={`Search ${totalLearners} learners in ${selectedClass.name}…`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={styles.searchInput}
        />
        {search && (
          <button onClick={() => setSearch("")}
            style={{ position: "absolute", right: 12, top: 10, background: "none", border: "none", cursor: "pointer", color: "#94A3B8" }}>
            <X size={15} />
          </button>
        )}
      </div>

      {/* Learner List */}
      <div style={styles.listContainer}>
        {filteredLearners.length === 0 && (
          <div style={{ padding: 40, textAlign: "center", color: "#94A3B8" }}>No learners match your search</div>
        )}
        {filteredLearners.map(([id, rec], i) => (
          <div
            key={id}
            style={{
              ...styles.learnerRow,
              background: i % 2 === 0 ? "var(--color-surface)" : "var(--color-surface-alt)",
            }}
          >
            <div style={styles.learnerNum}>{parseInt(id) + 1}</div>
            <div style={styles.learnerName}>{rec.name}</div>

            <div style={styles.statusBtns}>
              {[
                { key: "present", label: "Present", icon: Check,  color: "var(--color-present)", bg: "var(--color-present-bg)" },
                { key: "absent",  label: "Absent",  icon: X,     color: "var(--color-absent)",  bg: "var(--color-absent-bg)"  },
                { key: "late",    label: "Late",    icon: Clock, color: "var(--color-late)",    bg: "var(--color-late-bg)"    },
              ].map((s) => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.key}
                    onClick={() => setStatus(id, s.key)}
                    style={{
                      ...styles.statusBtn,
                      background: rec.status === s.key ? s.bg : "transparent",
                      color: rec.status === s.key ? s.color : "var(--color-slate-light)",
                      borderColor: rec.status === s.key ? s.color : "var(--color-border)",
                      fontWeight: rec.status === s.key ? 600 : 400,
                    }}
                  >
                    <Icon size={13} />
                    {s.label}
                  </button>
                );
              })}
            </div>

            {/* Reason input — only shown when absent */}
            {rec.status === "absent" && (
              <input
                type="text"
                placeholder="Reason (optional)"
                value={rec.reason}
                onChange={(e) => setReason(id, e.target.value)}
                style={styles.reasonInput}
                onClick={(e) => e.stopPropagation()}
              />
            )}
          </div>
        ))}
      </div>

      {/* Save footer */}
      <div style={styles.saveFooter}>
        <div style={styles.saveInfo}>
          {totalLearners} learners · {counts.absent} absent · {counts.late} late
        </div>
        <button
          onClick={handleSave}
          disabled={saving || saved}
          style={{
            ...styles.saveBtn,
            background: saved ? "#059669" : "var(--color-accent)",
            opacity: saving ? 0.7 : 1,
            cursor: saving ? "not-allowed" : "pointer",
          }}
        >
          {saving ? (
            <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Saving…</>
          ) : saved ? (
            <><Check size={16} /> Saved</>
          ) : (
            <><Save size={16} /> Save Register</>
          )}
        </button>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

const styles = {
  page: { padding: "var(--space-xl)", maxWidth: 900, margin: "0 auto" },
  backBtn: {
    display: "flex", alignItems: "center", gap: 6,
    padding: "8px 14px", marginBottom: "var(--space-md)",
    fontSize: 13, fontWeight: 500, fontFamily: "var(--font-body)",
    background: "transparent", color: "var(--color-slate)",
    border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)",
    cursor: "pointer", alignSelf: "flex-start",
  },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-lg)" },
  headerLeft: { display: "flex", alignItems: "center", gap: "var(--space-md)" },
  headerIcon: { width: 48, height: 48, borderRadius: "var(--radius-md)", background: "var(--color-success-light)", display: "flex", alignItems: "center", justifyContent: "center" },
  title: { fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 600, color: "var(--color-navy)", margin: 0 },
  subtitle: { fontSize: 14, color: "var(--color-slate-light)", marginTop: 2 },
  datePicker: { padding: "10px 14px", border: "1.5px solid var(--color-border)", borderRadius: "var(--radius-md)", fontFamily: "var(--font-body)", fontSize: 14, color: "var(--color-navy)", cursor: "pointer" },
  classSelectorWrap: { position: "relative", marginBottom: "var(--space-md)" },
  classSelector: { width: "100%", padding: "14px 16px", background: "var(--color-surface)", border: "1.5px solid var(--color-border)", borderRadius: "var(--radius-md)", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 15, textAlign: "left" },
  classLabel: { fontWeight: 600, color: "var(--color-navy)", display: "block" },
  classMeta: { fontSize: 13, color: "var(--color-slate-light)" },
  classPicker: { position: "absolute", top: "100%", left: 0, right: 0, background: "var(--color-surface)", border: "1.5px solid var(--color-border)", borderRadius: "var(--radius-md)", marginTop: 4, zIndex: 50, boxShadow: "var(--shadow-lg)", overflow: "hidden" },
  classOption: { width: "100%", padding: "12px 16px", border: "none", borderBottom: "1px solid var(--color-border-light)", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 14, textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center" },
  classOptLabel: { fontWeight: 600, color: "var(--color-navy)", display: "block" },
  classOptMeta: { fontSize: 12, color: "var(--color-slate-light)" },
  statsBar: { display: "flex", alignItems: "center", gap: "var(--space-md)", marginBottom: "var(--space-md)", flexWrap: "wrap" },
  statPill: { display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: "var(--radius-md)", fontSize: 14, fontFamily: "var(--font-body)" },
  statDot: { width: 8, height: 8, borderRadius: "50%" },
  markAllBtn: { padding: "8px 16px", background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 13, color: "var(--color-slate)", fontWeight: 500 },
  searchWrap: { position: "relative", marginBottom: "var(--space-md)" },
  searchInput: { width: "100%", padding: "11px 14px 11px 38px", fontSize: 14, fontFamily: "var(--font-body)", border: "1.5px solid var(--color-border)", borderRadius: "var(--radius-md)", color: "var(--color-navy)", outline: "none", boxSizing: "border-box" },
  listContainer: { background: "var(--color-surface)", border: "1px solid var(--color-border-light)", borderRadius: "var(--radius-lg)", overflow: "hidden", marginBottom: 80 },
  learnerRow: { display: "flex", alignItems: "center", gap: "var(--space-md)", padding: "12px 16px", borderBottom: "1px solid var(--color-border-light)", flexWrap: "wrap" },
  learnerNum: { fontSize: 12, color: "var(--color-slate-light)", width: 24, textAlign: "right", flexShrink: 0 },
  learnerName: { flex: 1, fontWeight: 500, color: "var(--color-navy)", fontSize: 14, minWidth: 160 },
  statusBtns: { display: "flex", gap: 6 },
  statusBtn: { display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", border: "1.5px solid", borderRadius: "var(--radius-md)", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 13, transition: "all 0.12s" },
  reasonInput: { flex: 1, padding: "6px 10px", border: "1px solid #FECACA", borderRadius: "var(--radius-sm)", fontSize: 13, fontFamily: "var(--font-body)", color: "#991B1B", background: "#FFF5F5", outline: "none", minWidth: 180 },
  saveFooter: { position: "fixed", bottom: 0, left: 240, right: 0, padding: "16px 32px", background: "var(--color-surface)", borderTop: "1px solid var(--color-border-light)", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 100 },
  saveInfo: { fontSize: 14, color: "var(--color-slate)", fontFamily: "var(--font-body)" },
  saveBtn: { display: "flex", alignItems: "center", gap: 8, padding: "12px 28px", border: "none", borderRadius: "var(--radius-md)", color: "#FFF", fontFamily: "var(--font-body)", fontSize: 15, fontWeight: 600, transition: "all 0.2s" },
};
