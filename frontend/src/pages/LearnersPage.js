import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Users, Search, X, ChevronDown, Phone, Mail, User, Heart, BookOpen, Clock, Check, AlertTriangle, Shield, FileText, Plus, Calendar, TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import { getMySlots, getLearners, getLearnerDetail, getLearnerAttendance, getLearnerSupportPlans, createSupportPlan } from "../api/client";

function attColor(r){if(r===null || r===undefined)return{c:"#475569",bg:"#F1F5F9"};if(r>=90)return{c:"#059669",bg:"#D1FAE5"};if(r>=80)return{c:"#D97706",bg:"#FEF3C7"};return{c:"#DC2626",bg:"#FEE2E2"};}
function riskBadge(r){if(!r)return null;var m={high:{c:"#DC2626",bg:"#FEE2E2",lb:"High Risk"},medium:{c:"#D97706",bg:"#FEF3C7",lb:"Medium Risk"}};return m[r]||null;}
function stColor(st){var m={present:{c:"#059669",bg:"#D1FAE5"},absent:{c:"#DC2626",bg:"#FEE2E2"},late:{c:"#D97706",bg:"#FEF3C7"}};return m[st]||{c:"#475569",bg:"#F1F5F9"};}

export default function LearnersPage(){
var auth=useAuth();
var _a=useState("all");var selClass=_a[0];var sSelClass=_a[1];
var _b=useState("");var search=_b[0];var sSearch=_b[1];
var _c=useState(false);var showDrop=_c[0];var sShowDrop=_c[1];
var _d=useState(null);var selLearner=_d[0];var sSelLearner=_d[1];
var _e=useState("attendance");var detailTab=_e[0];var sDetailTab=_e[1];

// API state
var _f=useState([]);var classes=_f[0];var sClasses=_f[1];
var _g=useState([]);var learners=_g[0];var sLearners=_g[1];
var _h=useState(true);var loading=_h[0];var sLoading=_h[1];
var _i=useState(false);var loadingDetail=_i[0];var sLoadingDetail=_i[1];
var _j=useState(null);var error=_j[0];var sError=_j[1];
var _k=useState([]);var detailAttendance=_k[0];var sDetailAttendance=_k[1];
var _l=useState([]);var detailSupport=_l[0];var sDetailSupport=_l[1];
var _m=useState([]);var detailGuardians=_m[0];var sDetailGuardians=_m[1];

// Load classes from timetable
useEffect(function(){
  async function loadClasses(){
    try{
      sLoading(true);
      sError(null);
      var res=await getMySlots();
      var slots=res.data.slots||[];
      // Extract unique classrooms
      var seen={};
      var cls=[];
      slots.forEach(function(s){
        if(s.classroom&&!seen[s.classroom]){
          seen[s.classroom]=true;
          cls.push({id:s.classroom_id,name:s.classroom,grade:s.grade||"",count:0});
        }
      });
      sClasses(cls);
    }catch(err){
      console.error("Failed to load classes:",err);
      sError("Failed to load classes");
    }finally{
      sLoading(false);
    }
  }
  loadClasses();
},[]);

// Load learners when class changes
useEffect(function(){
  async function loadLearners(){
    try{
      sLoading(true);
      var params={};
      if(selClass!=="all"){
        var cls=classes.find(function(c){return c.name===selClass;});
        if(cls)params.classroom=cls.id;
      }
      var res=await getLearners(params);
      var data=res.data||[];
      // Transform to expected format
      var transformed=data.map(function(l){
        return{
          id:l.id,
          fn:l.first_name,
          ln:l.last_name,
          cl:l.classroom||"",
          gr:l.grade||"",
          att:l.attendance_rate!==undefined?Math.round(l.attendance_rate):null,
          lang:l.home_language||"",
          absences:l.absent_count||0,
          late:0,
          risk:l.attendance_rate<80?"high":(l.attendance_rate<90?"medium":null),
          needs:""
        };
      });
      sLearners(transformed);
    }catch(err){
      console.error("Failed to load learners:",err);
      sLearners([]);
    }finally{
      sLoading(false);
    }
  }
  if(classes.length>0||selClass==="all"){
    loadLearners();
  }
},[selClass,classes]);

// Load detail data when learner is selected
useEffect(function(){
  async function loadDetail(){
    if(!selLearner)return;
    sLoadingDetail(true);
    sDetailAttendance([]);
    sDetailSupport([]);
    sDetailGuardians([]);
    try{
      // Load attendance
      var attRes=await getLearnerAttendance(selLearner.id);
      var attData=(attRes.data||[]).map(function(a){
        var d=new Date(a.date);
        return{
          date:a.date,
          day:d.toLocaleDateString("en-US",{weekday:"long"}),
          p:a.period||1,
          sub:a.subject||"Class",
          st:a.status,
          reason:a.absence_reason||""
        };
      });
      sDetailAttendance(attData);

      // Load support plans
      var spRes=await getLearnerSupportPlans(selLearner.id);
      var spData=(spRes.data||[]).map(function(p){
        return{
          id:p.id,
          type:p.plan_type,
          desc:p.description,
          start:p.start_date,
          end:p.end_date,
          active:p.is_active,
          by:p.created_by_name||"Staff"
        };
      });
      sDetailSupport(spData);

      // Load full learner detail for guardians
      var detailRes=await getLearnerDetail(selLearner.id);
      var guardians=(detailRes.data.guardians||[]).map(function(g){
        return{
          id:g.id,
          name:g.name,
          rel:g.relationship,
          phone:g.phone||"",
          email:g.email||"",
          primary:g.is_primary
        };
      });
      sDetailGuardians(guardians);
    }catch(err){
      console.error("Failed to load learner detail:",err);
    }finally{
      sLoadingDetail(false);
    }
  }
  loadDetail();
},[selLearner]);

var filtered=learners.filter(function(l){
  if(selClass!=="all"&&l.cl!==selClass)return false;
  if(search){var q=search.toLowerCase();return(l.fn+" "+l.ln).toLowerCase().indexOf(q)>=0;}
  return true;
});

var classStats=function(){
  var cls=selClass==="all"?learners:learners.filter(function(l){return l.cl===selClass;});
  var tot=cls.length;var atRisk=cls.filter(function(l){return l.risk;}).length;
  var avgAtt=tot>0?Math.round(cls.reduce(function(s,l){return s+(l.att||0);},0)/tot):0;
  return{tot:tot,atRisk:atRisk,avgAtt:avgAtt};
}();

// Loading state
if(loading&&learners.length===0){
  return(
    <div style={{padding:24,maxWidth:1200,display:"flex",alignItems:"center",justifyContent:"center",minHeight:400}}>
      <div style={{textAlign:"center"}}>
        <Loader2 size={32} color="#7C3AED" style={{animation:"spin 1s linear infinite"}}/>
        <p style={{marginTop:16,color:"var(--color-slate)"}}>Loading learners...</p>
      </div>
    </div>
  );
}

// Error state
if(error){
  return(
    <div style={{padding:24,maxWidth:1200,display:"flex",alignItems:"center",justifyContent:"center",minHeight:400}}>
      <div style={{textAlign:"center",padding:32,background:"#FEE2E2",borderRadius:12}}>
        <AlertTriangle size={32} color="#DC2626"/>
        <p style={{marginTop:12,color:"#DC2626",fontWeight:500}}>{error}</p>
        <button onClick={function(){window.location.reload();}} style={{marginTop:16,padding:"8px 16px",background:"#DC2626",color:"#FFF",border:"none",borderRadius:6,cursor:"pointer"}}>
          Retry
        </button>
      </div>
    </div>
  );
}

return(
<div style={{padding:24,maxWidth:1200}}>
{/* Header */}
<div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
<div style={{display:"flex",alignItems:"center",gap:16}}>
<div style={{width:48,height:48,borderRadius:10,background:"#EDE9FE",display:"flex",alignItems:"center",justifyContent:"center"}}><Users size={22} color="#7C3AED"/></div>
<div><h1 style={{fontFamily:"var(--font-display)",fontSize:24,fontWeight:600}}>Learner Profiles</h1><p style={{fontSize:14,color:"var(--color-slate)"}}>View and manage learner information</p></div>
</div>
<div style={{display:"flex",gap:12,alignItems:"center"}}>
<div style={{textAlign:"center",padding:"8px 16px",background:"#FFF",border:"1px solid var(--color-border-light)",borderRadius:8}}>
<div style={{fontFamily:"var(--font-display)",fontSize:20,fontWeight:700}}>{classStats.tot}</div><div style={{fontSize:11,color:"var(--color-slate-light)"}}>Learners</div></div>
<div style={{textAlign:"center",padding:"8px 16px",background:"#FFF",border:"1px solid var(--color-border-light)",borderRadius:8}}>
<div style={{fontFamily:"var(--font-display)",fontSize:20,fontWeight:700,color:attColor(classStats.avgAtt).c}}>{classStats.avgAtt}%</div><div style={{fontSize:11,color:"var(--color-slate-light)"}}>Avg Attendance</div></div>
<div style={{textAlign:"center",padding:"8px 16px",background:"#FFF",border:"1px solid var(--color-border-light)",borderRadius:8}}>
<div style={{fontFamily:"var(--font-display)",fontSize:20,fontWeight:700,color:classStats.atRisk>0?"#DC2626":"#059669"}}>{classStats.atRisk}</div><div style={{fontSize:11,color:"var(--color-slate-light)"}}>At-Risk</div></div>
</div></div>

{/* Filters */}
<div style={{display:"flex",gap:12,marginBottom:16}}>
{/* Class dropdown */}
<div style={{position:"relative"}}>
<button onClick={function(){sShowDrop(!showDrop);}} style={{display:"flex",alignItems:"center",gap:8,padding:"10px 16px",background:"#FFF",border:"1.5px solid var(--color-border)",borderRadius:8,cursor:"pointer",fontFamily:"var(--font-body)",fontSize:14,minWidth:160}}>
<Users size={16} color="var(--color-slate-light)"/>
<span style={{flex:1,textAlign:"left"}}>{selClass==="all"?"All Classes":selClass}</span>
<ChevronDown size={16} color="var(--color-slate-light)" style={{transform:showDrop?"rotate(180deg)":"none",transition:"transform 0.2s"}}/>
</button>
{showDrop&&<div style={{position:"absolute",top:"100%",left:0,right:0,marginTop:4,background:"#FFF",border:"1.5px solid var(--color-border)",borderRadius:8,boxShadow:"0 12px 32px rgba(0,0,0,0.08)",zIndex:50,overflow:"hidden"}}>
<button onClick={function(){sSelClass("all");sShowDrop(false);}} style={{width:"100%",padding:"10px 16px",border:"none",borderBottom:"1px solid var(--color-border-light)",cursor:"pointer",fontFamily:"var(--font-body)",fontSize:14,textAlign:"left",background:selClass==="all"?"#FEF3C7":"transparent"}}>All Classes</button>
{classes.map(function(c){return <button key={c.id} onClick={function(){sSelClass(c.name);sShowDrop(false);}} style={{width:"100%",padding:"10px 16px",border:"none",borderBottom:"1px solid var(--color-border-light)",cursor:"pointer",fontFamily:"var(--font-body)",fontSize:14,textAlign:"left",display:"flex",justifyContent:"space-between",background:selClass===c.name?"#FEF3C7":"transparent"}}><span style={{fontWeight:600}}>{c.name}</span><span style={{fontSize:12,color:"var(--color-slate-light)"}}>{c.grade}</span></button>;})}
</div>}
</div>
{/* Search */}
<div style={{position:"relative",flex:1}}>
<Search size={16} color="var(--color-slate-light)" style={{position:"absolute",left:12,top:12}}/>
<input type="text" value={search} onChange={function(e){sSearch(e.target.value);}} placeholder="Search learners by name..." style={{width:"100%",padding:"10px 14px 10px 36px",fontSize:14,fontFamily:"var(--font-body)",border:"1.5px solid var(--color-border)",borderRadius:8,color:"var(--color-navy)"}}/>
{search&&<button onClick={function(){sSearch("");}} style={{position:"absolute",right:12,top:10,background:"none",border:"none",color:"var(--color-slate-light)",cursor:"pointer"}}><X size={16}/></button>}
</div>
</div>

{/* Learner Table */}
<div style={{background:"#FFF",border:"1px solid var(--color-border-light)",borderRadius:10,overflow:"hidden"}}>
<table style={{width:"100%",borderCollapse:"collapse",fontSize:14}}>
<thead><tr style={{background:"var(--color-surface-alt)"}}>
<th style={{textAlign:"left",padding:"12px 16px",fontSize:11,fontWeight:600,color:"var(--color-slate-light)",textTransform:"uppercase",letterSpacing:"0.05em"}}>#</th>
<th style={{textAlign:"left",padding:"12px 16px",fontSize:11,fontWeight:600,color:"var(--color-slate-light)",textTransform:"uppercase"}}>Name</th>
<th style={{textAlign:"left",padding:"12px 16px",fontSize:11,fontWeight:600,color:"var(--color-slate-light)",textTransform:"uppercase"}}>Class</th>
<th style={{textAlign:"left",padding:"12px 16px",fontSize:11,fontWeight:600,color:"var(--color-slate-light)",textTransform:"uppercase"}}>Language</th>
<th style={{textAlign:"center",padding:"12px 16px",fontSize:11,fontWeight:600,color:"var(--color-slate-light)",textTransform:"uppercase"}}>Attendance</th>
<th style={{textAlign:"center",padding:"12px 16px",fontSize:11,fontWeight:600,color:"var(--color-slate-light)",textTransform:"uppercase"}}>Absences</th>
<th style={{textAlign:"center",padding:"12px 16px",fontSize:11,fontWeight:600,color:"var(--color-slate-light)",textTransform:"uppercase"}}>Status</th>
</tr></thead>
<tbody>
{filtered.map(function(l,i){
  var ac=attColor(l.att);var rb=riskBadge(l.risk);
  return <tr key={l.id} style={{borderBottom:"1px solid var(--color-border-light)",cursor:"pointer",transition:"background 0.15s"}}
    onClick={function(){sSelLearner(l);sDetailTab("attendance");}}
    onMouseEnter={function(e){e.currentTarget.style.background="var(--color-surface-alt)";}}
    onMouseLeave={function(e){e.currentTarget.style.background="transparent";}}>
    <td style={{padding:"14px 16px",fontSize:12,color:"var(--color-slate-light)"}}>{i+1}</td>
    <td style={{padding:"14px 16px"}}><div style={{fontWeight:600,color:"var(--color-navy)"}}>{l.fn} {l.ln}</div>{l.needs&&<div style={{fontSize:11,color:"#7C3AED",marginTop:2}}><Shield size={10}/> {l.needs}</div>}</td>
    <td style={{padding:"14px 16px"}}><span style={{padding:"3px 10px",background:"var(--color-surface-alt)",borderRadius:99,fontSize:12,fontWeight:600}}>{l.cl}</span></td>
    <td style={{padding:"14px 16px",color:"var(--color-slate)"}}>{l.lang}</td>
    <td style={{padding:"14px 16px",textAlign:"center"}}><span style={{padding:"4px 12px",borderRadius:99,fontSize:13,fontWeight:600,background:ac.bg,color:ac.c}}>{l.att}%</span></td>
    <td style={{padding:"14px 16px",textAlign:"center"}}><span style={{fontWeight:600,color:l.absences>5?"#DC2626":"var(--color-navy)"}}>{l.absences}</span></td>
    <td style={{padding:"14px 16px",textAlign:"center"}}>{rb?<span style={{padding:"3px 10px",borderRadius:99,fontSize:11,fontWeight:600,background:rb.bg,color:rb.c}}>{rb.lb}</span>:<span style={{fontSize:12,color:"#059669"}}>OK</span>}</td>
  </tr>;
})}
{filtered.length===0&&<tr><td colSpan={7} style={{padding:48,textAlign:"center",color:"var(--color-slate-light)"}}>No learners found</td></tr>}
</tbody></table>
</div>

<div style={{padding:"12px 0",fontSize:13,color:"var(--color-slate-light)",textAlign:"right"}}>{filtered.length} learner{filtered.length!==1?"s":""} shown</div>

{/* ─── DETAIL PANEL ───────────────────────────────────── */}
{selLearner&&<div style={{position:"fixed",inset:0,background:"rgba(15,23,42,0.4)",zIndex:200,display:"flex",justifyContent:"flex-end",animation:"fadeIn 0.2s"}} onClick={function(){sSelLearner(null);}}>
<div style={{width:560,height:"100%",background:"#FFF",overflowY:"auto",padding:0,animation:"slideIn 0.25s ease-out",boxShadow:"0 12px 32px rgba(0,0,0,0.1)"}} onClick={function(e){e.stopPropagation();}}>

{/* Profile header */}
<div style={{padding:24,background:"#EDE9FE",borderBottom:"1px solid #C4B5FD"}}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
<div style={{display:"flex",alignItems:"center",gap:16}}>
<div style={{width:56,height:56,borderRadius:"50%",background:"#7C3AED",color:"#FFF",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:700}}>{selLearner.fn[0]}{selLearner.ln[0]}</div>
<div><h2 style={{fontFamily:"var(--font-display)",fontSize:22,fontWeight:600,color:"var(--color-navy)"}}>{selLearner.fn} {selLearner.ln}</h2>
<div style={{fontSize:14,color:"var(--color-slate)"}}>{selLearner.cl} · {selLearner.gr} · {selLearner.lang}</div></div>
</div>
<button onClick={function(){sSelLearner(null);}} style={{background:"none",border:"none",color:"var(--color-slate)",cursor:"pointer"}}><X size={20}/></button>
</div>
{/* Quick stats */}
<div style={{display:"flex",gap:16,marginTop:16}}>
{[
  {lb:"Attendance",val:selLearner.att+"%",c:attColor(selLearner.att)},
  {lb:"Absences",val:selLearner.absences,c:selLearner.absences>5?{c:"#DC2626",bg:"#FEE2E2"}:{c:"#059669",bg:"#D1FAE5"}},
  {lb:"Late",val:selLearner.late,c:{c:"#D97706",bg:"#FEF3C7"}},
].map(function(s,i){return <div key={i} style={{flex:1,padding:"10px 14px",background:"#FFF",borderRadius:8,textAlign:"center"}}>
<div style={{fontFamily:"var(--font-display)",fontSize:20,fontWeight:700,color:s.c.c}}>{s.val}</div>
<div style={{fontSize:11,color:"var(--color-slate-light)"}}>{s.lb}</div></div>;})}
{riskBadge(selLearner.risk)&&<div style={{flex:1,padding:"10px 14px",background:riskBadge(selLearner.risk).bg,borderRadius:8,textAlign:"center",border:"1px solid "+riskBadge(selLearner.risk).c+"33"}}>
<div style={{fontFamily:"var(--font-display)",fontSize:14,fontWeight:700,color:riskBadge(selLearner.risk).c}}><AlertTriangle size={16}/></div>
<div style={{fontSize:11,fontWeight:600,color:riskBadge(selLearner.risk).c}}>{riskBadge(selLearner.risk).lb}</div></div>}
</div></div>

{/* Tabs */}
<div style={{display:"flex",borderBottom:"1px solid var(--color-border-light)"}}>
{[{k:"attendance",lb:"Attendance"},{k:"guardians",lb:"Guardians"},{k:"support",lb:"Support Plans"},{k:"info",lb:"Info"}].map(function(tab){
  return <button key={tab.k} onClick={function(){sDetailTab(tab.k);}} style={{flex:1,padding:"12px",fontSize:13,fontWeight:detailTab===tab.k?600:400,fontFamily:"var(--font-body)",background:"none",border:"none",borderBottom:detailTab===tab.k?"2px solid #7C3AED":"2px solid transparent",color:detailTab===tab.k?"#7C3AED":"var(--color-slate-light)",cursor:"pointer"}}>{tab.lb}</button>;
})}
</div>

<div style={{padding:24}}>
{/* Attendance tab */}
{detailTab==="attendance"&&<div>
<div style={{fontSize:12,fontWeight:600,color:"var(--color-slate-light)",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:12}}>Recent Attendance</div>
{loadingDetail?<div style={{padding:24,textAlign:"center"}}><Loader2 size={20} color="#7C3AED" style={{animation:"spin 1s linear infinite"}}/></div>:
detailAttendance.length===0?<div style={{padding:24,textAlign:"center",color:"var(--color-slate-light)"}}>No attendance records found</div>:
<div style={{display:"flex",flexDirection:"column",gap:4}}>
{detailAttendance.map(function(a,i){var sc=stColor(a.st);
  return <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",background:i%2===0?"var(--color-surface-alt)":"#FFF",borderRadius:6}}>
    <div style={{width:80,fontSize:12,color:"var(--color-slate-light)"}}>{a.date}</div>
    <div style={{width:70,fontSize:12,color:"var(--color-slate)"}}>{a.day}</div>
    <div style={{width:30,fontSize:12,fontWeight:600,color:"var(--color-navy)"}}>P{a.p}</div>
    <div style={{flex:1,fontSize:13,color:"var(--color-navy)"}}>{a.sub}</div>
    <div style={{padding:"3px 10px",borderRadius:99,fontSize:11,fontWeight:600,background:sc.bg,color:sc.c,textTransform:"capitalize"}}>{a.st}</div>
    {a.reason&&<div style={{fontSize:11,color:"#DC2626",fontStyle:"italic"}}>{a.reason}</div>}
  </div>;
})}
</div>}</div>}

{/* Guardians tab */}
{detailTab==="guardians"&&<div>
<div style={{fontSize:12,fontWeight:600,color:"var(--color-slate-light)",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:12}}>Parent / Guardian Contacts</div>
{loadingDetail?<div style={{padding:24,textAlign:"center"}}><Loader2 size={20} color="#7C3AED" style={{animation:"spin 1s linear infinite"}}/></div>:
detailGuardians.length===0?<div style={{padding:24,textAlign:"center",color:"var(--color-slate-light)"}}>No guardian contacts on file</div>:
<div style={{display:"flex",flexDirection:"column",gap:12}}>
{detailGuardians.map(function(g){
  return <div key={g.id} style={{padding:16,background:"var(--color-surface-alt)",borderRadius:10,border:"1px solid var(--color-border-light)"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
      <div><div style={{fontWeight:600,fontSize:15,color:"var(--color-navy)"}}>{g.name}</div><div style={{fontSize:12,color:"var(--color-slate)"}}>{g.rel}</div></div>
      {g.primary&&<span style={{fontSize:10,fontWeight:700,color:"#7C3AED",background:"#EDE9FE",padding:"3px 10px",borderRadius:99}}>PRIMARY</span>}
    </div>
    <div style={{display:"flex",gap:16}}>
      {g.phone&&<div style={{display:"flex",alignItems:"center",gap:6,fontSize:13,color:"var(--color-slate)"}}><Phone size={14} color="var(--color-info)"/> {g.phone}</div>}
      {g.email&&<div style={{display:"flex",alignItems:"center",gap:6,fontSize:13,color:"var(--color-slate)"}}><Mail size={14} color="var(--color-info)"/> {g.email}</div>}
    </div>
  </div>;
})}
</div>}</div>}

{/* Support plans tab */}
{detailTab==="support"&&<div>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
<div style={{fontSize:12,fontWeight:600,color:"var(--color-slate-light)",textTransform:"uppercase",letterSpacing:"0.05em"}}>Active Support Plans</div>
<button style={{display:"flex",alignItems:"center",gap:4,padding:"8px 14px",fontSize:13,fontWeight:600,fontFamily:"var(--font-body)",background:"#EDE9FE",color:"#7C3AED",border:"none",borderRadius:6,cursor:"pointer"}}><Plus size={14}/> Add Plan</button>
</div>
{loadingDetail?<div style={{padding:24,textAlign:"center"}}><Loader2 size={20} color="#7C3AED" style={{animation:"spin 1s linear infinite"}}/></div>:
detailSupport.length>0?<div style={{display:"flex",flexDirection:"column",gap:12}}>
{detailSupport.map(function(p){return <div key={p.id} style={{padding:16,background:"var(--color-surface-alt)",borderRadius:10,border:"1px solid var(--color-border-light)"}}>
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
    <div style={{display:"flex",alignItems:"center",gap:8}}><Shield size={16} color="#7C3AED"/><span style={{fontWeight:600,fontSize:15,color:"var(--color-navy)"}}>{p.type}</span></div>
    <span style={{fontSize:10,fontWeight:700,color:p.active?"#059669":"#475569",background:p.active?"#D1FAE5":"#F1F5F9",padding:"3px 10px",borderRadius:99}}>{p.active?"ACTIVE":"INACTIVE"}</span>
  </div>
  <div style={{fontSize:14,color:"var(--color-navy)",lineHeight:1.6,marginBottom:8}}>{p.desc}</div>
  <div style={{display:"flex",gap:16,fontSize:12,color:"var(--color-slate)"}}>
    <span><Calendar size={12}/> {p.start} — {p.end}</span>
    <span>Created by {p.by}</span>
  </div>
</div>;})}
</div>:<div style={{textAlign:"center",padding:32,color:"var(--color-slate-light)"}}><Shield size={32} color="var(--color-border)"/><p style={{marginTop:8}}>No active support plans</p></div>}
</div>}

{/* Info tab */}
{detailTab==="info"&&<div>
<div style={{fontSize:12,fontWeight:600,color:"var(--color-slate-light)",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:12}}>Learner Information</div>
<div style={{display:"flex",flexDirection:"column",gap:12}}>
{[
  {lb:"Full Name",val:selLearner.fn+" "+selLearner.ln},
  {lb:"Class",val:selLearner.cl+" ("+selLearner.gr+")"},
  {lb:"Home Language",val:selLearner.lang},
  {lb:"Special Needs",val:selLearner.needs||"None recorded"},
].map(function(f,i){return <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"12px 16px",background:i%2===0?"var(--color-surface-alt)":"#FFF",borderRadius:6}}>
  <span style={{fontSize:13,color:"var(--color-slate)"}}>{f.lb}</span>
  <span style={{fontSize:14,fontWeight:500,color:"var(--color-navy)"}}>{f.val}</span>
</div>;})}
</div></div>}

</div>
</div></div>}

<style dangerouslySetInnerHTML={{__html:"@keyframes spin{to{transform:rotate(360deg)}}@keyframes slideIn{from{transform:translateX(100%)}to{transform:translateX(0)}}@keyframes fadeIn{from{opacity:0}to{opacity:1}}input:focus{outline:none;border-color:#7C3AED!important;box-shadow:0 0 0 3px rgba(124,58,237,0.15)!important}"}}/>
</div>);
}
