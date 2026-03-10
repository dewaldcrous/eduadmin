import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { BookCopy, Plus, Check, Clock, X, Send, Edit3, AlertCircle, CheckCircle2, FileText, Save, Loader2, Upload, Download, Paperclip, File, ChevronLeft, ChevronRight, Calendar, Palette, Circle, Square, Triangle, Diamond, Star, Hexagon, Trash2 } from "lucide-react";
import { getWeeklyPlan, createPlan, updatePlan, submitPlan, deliverLesson, uploadAttachments, deleteAttachment, importPlans, exportPlansUrl } from "../api/client";

var DAYS=[{key:"MON",label:"Monday"},{key:"TUE",label:"Tuesday"},{key:"WED",label:"Wednesday"},{key:"THU",label:"Thursday"},{key:"FRI",label:"Friday"}];
var PT=[{p:1,s:"07:45",e:"08:30"},{p:2,s:"08:30",e:"09:15"},{p:3,s:"09:15",e:"10:00"},{p:4,s:"10:20",e:"11:05"},{p:5,s:"11:05",e:"11:50"},{p:6,s:"11:50",e:"12:35"},{p:7,s:"13:00",e:"13:45"}];
var COLORS=[{n:"Blue",v:"#2563EB",l:"#DBEAFE"},{n:"Emerald",v:"#059669",l:"#D1FAE5"},{n:"Amber",v:"#D97706",l:"#FEF3C7"},{n:"Rose",v:"#E11D48",l:"#FFE4E6"},{n:"Purple",v:"#7C3AED",l:"#EDE9FE"},{n:"Teal",v:"#0D9488",l:"#CCFBF1"},{n:"Orange",v:"#EA580C",l:"#FFF7ED"},{n:"Indigo",v:"#4F46E5",l:"#E0E7FF"},{n:"Pink",v:"#DB2777",l:"#FCE7F3"},{n:"Slate",v:"#475569",l:"#F1F5F9"}];
var SHAPES=[{n:"Circle",i:Circle},{n:"Square",i:Square},{n:"Diamond",i:Diamond},{n:"Star",i:Star},{n:"Hexagon",i:Hexagon},{n:"Triangle",i:Triangle}];
var DEF_CFG={"10A":{c:COLORS[0],s:SHAPES[0]},"10B":{c:COLORS[1],s:SHAPES[1]},"10C":{c:COLORS[2],s:SHAPES[2]},"11A":{c:COLORS[3],s:SHAPES[3]},"11B":{c:COLORS[4],s:SHAPES[4]},"12A":{c:COLORS[5],s:SHAPES[5]}};

var SC={approved:{lb:"Approved",c:"#059669",bg:"#D1FAE5",ic:CheckCircle2},pending:{lb:"Pending",c:"#D97706",bg:"#FEF3C7",ic:Clock},draft:{lb:"Draft",c:"#475569",bg:"#F1F5F9",ic:Edit3},rejected:{lb:"Rejected",c:"#DC2626",bg:"#FEE2E2",ic:X}};

function fSz(b){return b<1024?b+" B":b<1048576?(b/1024).toFixed(1)+" KB":(b/1048576).toFixed(1)+" MB";}
function gMon(d){var dt=new Date(d);var dy=dt.getDay();dt.setDate(dt.getDate()-dy+(dy===0?-6:1));return dt;}
function gWN(d){var dt=new Date(d);dt.setHours(0,0,0,0);dt.setDate(dt.getDate()+3-(dt.getDay()+6)%7);var w1=new Date(dt.getFullYear(),0,4);return 1+Math.round(((dt-w1)/864e5-3+(w1.getDay()+6)%7)/7);}
function fDt(d){return d.toLocaleDateString("en-ZA",{day:"numeric",month:"short"});}

export default function WeeklyPlannerPage(){
var auth=useAuth();
var pfRef=useRef(null);var editFRef=useRef(null);var iRef=useRef(null);
var today=new Date();var mon0=gMon(today);

var _a=useState(0);var wOff=_a[0];var sWOff=_a[1];
var _b=useState({});var wd=_b[0];var sWd=_b[1];
var _c=useState(null);var sp=_c[0];var sSp=_c[1];
var _d=useState(false);var sCr=_d[0];var ssCr=_d[1];
var _e=useState(false);var isEd=_e[0];var sIsEd=_e[1];
var _f=useState(null);var tgt=_f[0];var sTgt=_f[1];
var _g=useState(false);var sImp=_g[0];var ssImp=_g[1];
var _h=useState(null);var iRes=_h[0];var sIRes=_h[1];
var _i=useState({t:"",obj:"",act:"",dif:"",res:""});var fm=_i[0];var sFm=_i[1];
var _j=useState([]);var pnd=_j[0];var sPnd=_j[1];
var _k=useState(false);var sav=_k[0];var sSav=_k[1];
var _l=useState(DEF_CFG);var ccfg=_l[0];var sCcfg=_l[1];
var _m=useState(false);var showCfg=_m[0];var sShowCfg=_m[1];
var _n=useState(null);var cfgCl=_n[0];var sCfgCl=_n[1];
var _o=useState(100);var nid=_o[0];var sNid=_o[1];
var _p=useState([]);var editExistAtt=_p[0];var sEditExistAtt=_p[1];
var _q=useState(true);var loading=_q[0];var sLoading=_q[1];
var _r=useState(null);var error=_r[0];var sError=_r[1];
var _s=useState(null);var timetableInfo=_s[0];var sTimetableInfo=_s[1];

// Load weekly plan data from API
useEffect(function(){
  async function loadWeeklyPlan(){
    try{
      sLoading(true);
      sError(null);
      var res=await getWeeklyPlan();
      var data=res.data;
      sTimetableInfo({term:data.term,year:data.year,timetable_id:data.timetable_id});

      // Transform API response to weekly data structure
      var weekly=data.weekly||[];
      var transformed={};
      weekly.forEach(function(dayData){
        var dayKey=dayData.day;
        var periods=dayData.periods||[];
        transformed[dayKey]=periods.map(function(p){
          var plan=p.plan;
          return{
            id:p.slot_id,
            p:p.period,
            sub:p.subject||"Class",
            cl:p.classroom||"",
            plan:plan?{
              id:plan.id,
              t:plan.title,
              st:plan.status,
              obj:plan.objectives||"",
              act:plan.activities||"",
              dif:plan.differentiation||"",
              res:plan.resources_note||"",
              del:plan.has_delivery||false,
              fb:plan.feedback||"",
              att:(plan.attachments||[]).map(function(a){
                return{id:a.id,n:a.file_name,tp:a.file_type,sz:a.file_size,url:a.url};
              })
            }:null
          };
        });
      });
      sWd(transformed);

      // Build class config from data
      var newCfg=Object.assign({},DEF_CFG);
      var colorIdx=0;
      Object.values(transformed).forEach(function(slots){
        slots.forEach(function(s){
          if(s.cl&&!newCfg[s.cl]){
            newCfg[s.cl]={c:COLORS[colorIdx%COLORS.length],s:SHAPES[colorIdx%SHAPES.length]};
            colorIdx++;
          }
        });
      });
      sCcfg(newCfg);

    }catch(err){
      console.error("Failed to load weekly plan:",err);
      sError("Failed to load lesson plans");
      // Initialize with empty data
      sWd({MON:[],TUE:[],WED:[],THU:[],FRI:[]});
    }finally{
      sLoading(false);
    }
  }
  loadWeeklyPlan();
},[wOff]);

var cMon=new Date(mon0);cMon.setDate(cMon.getDate()+wOff*7);
var cFri=new Date(cMon);cFri.setDate(cFri.getDate()+4);
var wn=gWN(cMon);var isCur=wOff===0;
var wDts=[];for(var i=0;i<5;i++){var dd=new Date(cMon);dd.setDate(dd.getDate()+i);wDts.push(dd);}

var tot=0,made=0,appd=0;
Object.values(wd).forEach(function(ss){ss.forEach(function(s){tot++;if(s.plan){made++;if(s.plan.st==="approved")appd++;}});});
var miss=tot-made;

function gCS(cl){var c=ccfg[cl];return c?{c:c.c.v,l:c.c.l}:{c:"#475569",l:"#F1F5F9"};}
function gSh(cl){var c=ccfg[cl];return c?c.s.i:Circle;}

// ─── CRUD ───────────────────────────────────────────────
function openC(day,sl){
  sTgt({p:sl.p,day:day,sub:sl.sub,cl:sl.cl});
  sFm({t:"",obj:"",act:"",dif:"",res:""});
  sPnd([]);sEditExistAtt([]);sIsEd(false);ssCr(true);
}

function openE(plan,slot,dayK){
  sTgt({p:slot.p,day:dayK,sub:slot.sub,cl:slot.cl});
  sFm({t:plan.t,obj:plan.obj,act:plan.act,dif:plan.dif||"",res:plan.res||""});
  sPnd([]);sEditExistAtt(plan.att?JSON.parse(JSON.stringify(plan.att)):[]);
  sIsEd(true);ssCr(true);sSp(null);
}

function doSave(submit){return async function(){
  sSav(true);
  try{
    // Find the slot to get its ID
    var slots=wd[tgt.day]||[];
    var slotData=null;
    var existingPlanId=null;
    for(var i=0;i<slots.length;i++){
      if(slots[i].p===tgt.p){
        slotData=slots[i];
        if(slots[i].plan)existingPlanId=slots[i].plan.id;
        break;
      }
    }

    // Prepare plan data for API
    var planData={
      timetable_slot:slotData?slotData.id:null,
      title:fm.t,
      objectives:fm.obj,
      activities:fm.act,
      differentiation:fm.dif,
      resources_note:fm.res
    };

    var savedPlan;
    if(isEd&&existingPlanId){
      // Update existing plan
      var res=await updatePlan(existingPlanId,planData);
      savedPlan=res.data;
    }else{
      // Create new plan
      var res=await createPlan(planData);
      savedPlan=res.data;
    }

    // Upload any new attachments
    if(pnd.length>0&&savedPlan&&savedPlan.id){
      await uploadAttachments(savedPlan.id,pnd,"");
    }

    // Submit if requested
    if(submit&&savedPlan&&savedPlan.id){
      await submitPlan(savedPlan.id);
    }

    // Update local state
    var newAtt=pnd.map(function(f,idx){return{id:nid+idx+1,n:f.name,tp:f.name.split(".").pop(),sz:f.size,url:URL.createObjectURL(f)};});
    var allAtt=isEd?editExistAtt.concat(newAtt):newAtt;
    var np={id:savedPlan?savedPlan.id:nid,t:fm.t,obj:fm.obj,act:fm.act,dif:fm.dif,res:fm.res,st:submit?"pending":"draft",att:allAtt};
    if(!isEd)sNid(nid+pnd.length+2);
    var upd=JSON.parse(JSON.stringify(wd));var ds=upd[tgt.day];
    if(ds){for(var j=0;j<ds.length;j++){if(ds[j].p===tgt.p){if(ds[j].plan&&isEd){np.del=ds[j].plan.del;np.fb=ds[j].plan.fb;}ds[j].plan=np;break;}}}
    sWd(upd);ssCr(false);
  }catch(err){
    console.error("Failed to save plan:",err);
    alert("Failed to save lesson plan. Please try again.");
  }finally{
    sSav(false);
  }
};}

// Handle submit for existing plan
async function handleSubmitPlan(planId){
  try{
    await submitPlan(planId);
    // Update local state
    var upd=JSON.parse(JSON.stringify(wd));
    Object.keys(upd).forEach(function(day){
      upd[day].forEach(function(s){
        if(s.plan&&s.plan.id===planId){
          s.plan.st="pending";
        }
      });
    });
    sWd(upd);
    if(sp&&sp.id===planId){
      sSp(Object.assign({},sp,{st:"pending"}));
    }
  }catch(err){
    console.error("Failed to submit plan:",err);
    alert("Failed to submit plan. Please try again.");
  }
}

// Handle mark as delivered
async function handleDeliverLesson(planId){
  try{
    await deliverLesson(planId,"full",100);
    // Update local state
    var upd=JSON.parse(JSON.stringify(wd));
    Object.keys(upd).forEach(function(day){
      upd[day].forEach(function(s){
        if(s.plan&&s.plan.id===planId){
          s.plan.del=true;
        }
      });
    });
    sWd(upd);
    if(sp&&sp.id===planId){
      sSp(Object.assign({},sp,{del:true}));
    }
  }catch(err){
    console.error("Failed to mark as delivered:",err);
    alert("Failed to mark lesson as delivered. Please try again.");
  }
}

// ─── File handling ──────────────────────────────────────
function onCreateFiles(e){sPnd(function(p){return p.concat(Array.from(e.target.files));});e.target.value="";}
function rmPending(idx){sPnd(function(p){return p.filter(function(_,j){return j!==idx;});});}
function rmEditAtt(idx){sEditExistAtt(function(p){return p.filter(function(_,j){return j!==idx;});});}

function onPanelFiles(e){
  var fs=Array.from(e.target.files).map(function(f,idx){return{id:Date.now()+idx,n:f.name,tp:f.name.split(".").pop(),sz:f.size,url:URL.createObjectURL(f)};});
  if(sp){
    var at=(sp.att||[]).concat(fs);sSp(Object.assign({},sp,{att:at}));
    var upd=JSON.parse(JSON.stringify(wd));var ds=upd[sp.day];
    if(ds){for(var i=0;i<ds.length;i++){if(ds[i].p===sp.slot.p&&ds[i].plan){ds[i].plan.att=at;break;}}}
    sWd(upd);
  }
  e.target.value="";
}

async function rmPanelAtt(attId){
  if(!sp)return;
  try{
    await deleteAttachment(attId);
    var at=(sp.att||[]).filter(function(a){return a.id!==attId;});
    sSp(Object.assign({},sp,{att:at}));
    var upd=JSON.parse(JSON.stringify(wd));var ds=upd[sp.day];
    if(ds){for(var i=0;i<ds.length;i++){if(ds[i].p===sp.slot.p&&ds[i].plan){ds[i].plan.att=at;break;}}}
    sWd(upd);
  }catch(err){
    console.error("Failed to delete attachment:",err);
    alert("Failed to delete attachment. Please try again.");
  }
}

function dlF(a){var el=document.createElement("a");el.href=a.url||"#";el.download=a.n;if(a.url){document.body.appendChild(el);el.click();document.body.removeChild(el);}else{alert("Download: "+a.n);}}

// ─── Import/Export ──────────────────────────────────────
async function doImp(e){
  if(!e.target.files[0])return;
  sIRes({ld:true});
  try{
    var res=await importPlans(e.target.files[0]);
    var data=res.data;
    sIRes({ld:false,cr:data.created||0,sk:data.skipped||0,er:data.errors||[],tot:data.total_rows||0});
    // Reload the weekly plan after import
    var weekRes=await getWeeklyPlan();
    var weekData=weekRes.data;
    var weekly=weekData.weekly||[];
    var transformed={};
    weekly.forEach(function(dayData){
      var dayKey=dayData.day;
      var periods=dayData.periods||[];
      transformed[dayKey]=periods.map(function(p){
        var plan=p.plan;
        return{
          id:p.slot_id,p:p.period,sub:p.subject||"Class",cl:p.classroom||"",
          plan:plan?{id:plan.id,t:plan.title,st:plan.status,obj:plan.objectives||"",act:plan.activities||"",dif:plan.differentiation||"",res:plan.resources_note||"",del:plan.has_delivery||false,fb:plan.feedback||"",att:(plan.attachments||[]).map(function(a){return{id:a.id,n:a.file_name,tp:a.file_type,sz:a.file_size,url:a.url};})}:null
        };
      });
    });
    sWd(transformed);
  }catch(err){
    console.error("Import failed:",err);
    sIRes({ld:false,cr:0,sk:0,er:["Import failed: "+(err.message||"Unknown error")],tot:0});
  }
  e.target.value="";
}
function doExp(f){
  var url=exportPlansUrl(f);
  window.open(url,"_blank");
}
function dlTpl(){var csv="day,period,title,objectives,activities,differentiation,resources\nMonday,1,Example,Learners will...,Activity 1,Support,Textbook";var el=document.createElement("a");el.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));el.download="lesson_plan_template.csv";document.body.appendChild(el);el.click();document.body.removeChild(el);}

// ─── Class config ───────────────────────────────────────
function uCC(cl,c){var cfg=Object.assign({},ccfg);cfg[cl]=Object.assign({},cfg[cl],{c:c});sCcfg(cfg);}
function uCS(cl,s){var cfg=Object.assign({},ccfg);cfg[cl]=Object.assign({},cfg[cl],{s:s});sCcfg(cfg);}

// ─── Render helpers ─────────────────────────────────────
function renderAttRow(a, onRemove){
  return <div key={a.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",background:"var(--color-surface-alt)",borderRadius:6,border:"1px solid var(--color-border-light)"}}>
    <FileText size={16} color="var(--color-info)"/>
    <div style={{flex:1,minWidth:0}}><div style={{fontSize:13,fontWeight:600,color:"var(--color-navy)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{a.n}</div><div style={{fontSize:11,color:"var(--color-slate-light)"}}>{fSz(a.sz)}</div></div>
    <button onClick={function(){dlF(a);}} style={{display:"flex",alignItems:"center",gap:4,padding:"5px 10px",fontSize:11,fontWeight:600,fontFamily:"var(--font-body)",background:"var(--color-info-light)",color:"var(--color-info)",border:"none",borderRadius:4,cursor:"pointer"}}><Download size={12}/> Download</button>
    <button onClick={onRemove} style={{display:"flex",alignItems:"center",gap:4,padding:"5px 10px",fontSize:11,fontWeight:600,fontFamily:"var(--font-body)",background:"#FEE2E2",color:"#DC2626",border:"none",borderRadius:4,cursor:"pointer"}}><Trash2 size={12}/> Remove</button>
  </div>;
}

function renderFileInput(ref, onChange){
  return <div>
    <input ref={ref} type="file" multiple accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.png,.jpg,.jpeg" onChange={onChange} style={{display:"none"}}/>
    <button onClick={function(){ref.current.click();}} style={{display:"flex",alignItems:"center",gap:6,marginTop:10,padding:"10px 16px",fontSize:13,fontWeight:600,fontFamily:"var(--font-body)",background:"var(--color-info-light)",color:"var(--color-info)",border:"1px solid rgba(37,99,235,0.15)",borderRadius:6,cursor:"pointer"}}><Upload size={14}/> Upload Files</button>
  </div>;
}

// ─── RENDER ─────────────────────────────────────────────

// Loading state
if(loading){
  return(
    <div style={{padding:24,maxWidth:1200,display:"flex",alignItems:"center",justifyContent:"center",minHeight:400}}>
      <div style={{textAlign:"center"}}>
        <Loader2 size={32} color="#D97706" style={{animation:"spin 1s linear infinite"}}/>
        <p style={{marginTop:16,color:"var(--color-slate)"}}>Loading lesson plans...</p>
      </div>
    </div>
  );
}

// Error state
if(error){
  return(
    <div style={{padding:24,maxWidth:1200,display:"flex",alignItems:"center",justifyContent:"center",minHeight:400}}>
      <div style={{textAlign:"center",padding:32,background:"#FEE2E2",borderRadius:12}}>
        <AlertCircle size={32} color="#DC2626"/>
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
{/* HEADER */}
<div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
<div style={{display:"flex",alignItems:"center",gap:16}}><div style={{width:48,height:48,borderRadius:10,background:"#DBEAFE",display:"flex",alignItems:"center",justifyContent:"center"}}><BookCopy size={22} color="#2563EB"/></div><div><h1 style={{fontFamily:"var(--font-display)",fontSize:24,fontWeight:600,color:"var(--color-navy)"}}>Weekly Lesson Planner</h1><p style={{fontSize:14,color:"var(--color-slate)"}}>Term 1, 2026 · Mathematics</p></div></div>
<div style={{display:"flex",gap:8}}>
<button onClick={function(){sShowCfg(!showCfg);}} style={{display:"flex",alignItems:"center",gap:6,padding:"10px 16px",fontSize:13,fontWeight:600,fontFamily:"var(--font-body)",background:"#FEF3C7",color:"#D97706",border:"1px solid rgba(217,119,6,0.2)",borderRadius:6,cursor:"pointer"}}><Palette size={15}/> Customise</button>
<button onClick={function(){ssImp(true);}} style={{display:"flex",alignItems:"center",gap:6,padding:"10px 16px",fontSize:13,fontWeight:600,fontFamily:"var(--font-body)",background:"#FFF",color:"var(--color-navy)",border:"1px solid var(--color-border)",borderRadius:6,cursor:"pointer"}}><Upload size={15}/> Import</button>
<button onClick={function(){doExp("xlsx");}} style={{display:"flex",alignItems:"center",gap:6,padding:"10px 16px",fontSize:13,fontWeight:600,fontFamily:"var(--font-body)",background:"var(--color-navy)",color:"#FEF3C7",border:"none",borderRadius:6,cursor:"pointer"}}><Download size={15}/> Export</button>
</div></div>

{/* CLASS CONFIG */}
{showCfg&&<div style={{background:"#FFF",border:"1px solid var(--color-border-light)",borderRadius:10,padding:16,marginBottom:12}}>
<div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}><Palette size={16} color="#D97706"/><span style={{fontFamily:"var(--font-display)",fontSize:15,fontWeight:600,flex:1}}>Class Colours & Shapes</span><button onClick={function(){sShowCfg(false);sCfgCl(null);}} style={{background:"none",border:"none",color:"var(--color-slate-light)",cursor:"pointer"}}><X size={16}/></button></div>
<div style={{display:"flex",flexWrap:"wrap",gap:8}}>
{Object.keys(ccfg).map(function(cl){var cfg=ccfg[cl];var SI=cfg.s.i;var isO=cfgCl===cl;
return <div key={cl}><button onClick={function(){sCfgCl(isO?null:cl);}} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 14px",border:"2px solid "+cfg.c.v,background:cfg.c.l,borderRadius:6,cursor:"pointer",fontFamily:"var(--font-body)",fontSize:13,fontWeight:700,color:cfg.c.v}}><SI size={16} color={cfg.c.v} fill={cfg.c.v}/>{cl}</button>
{isO&&<div style={{padding:8,marginTop:4,background:"var(--color-surface-alt)",borderRadius:6,border:"1px solid var(--color-border-light)"}}>
<div style={{marginBottom:8}}><div style={{fontSize:11,fontWeight:600,color:"var(--color-slate-light)",marginBottom:4}}>COLOUR</div><div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{COLORS.map(function(c){return <button key={c.n} onClick={function(){uCC(cl,c);}} style={{width:24,height:24,borderRadius:"50%",background:c.v,border:"none",cursor:"pointer",outline:cfg.c.n===c.n?"3px solid "+c.v:"none",outlineOffset:2}}/>;})}</div></div>
<div><div style={{fontSize:11,fontWeight:600,color:"var(--color-slate-light)",marginBottom:4}}>SHAPE</div><div style={{display:"flex",gap:4}}>{SHAPES.map(function(s){var Ic=s.i;return <button key={s.n} onClick={function(){uCS(cl,s);}} style={{width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",border:"1.5px solid "+(cfg.s.n===s.n?cfg.c.v:"var(--color-border)"),borderRadius:6,cursor:"pointer",background:cfg.s.n===s.n?cfg.c.l:"transparent"}}><Ic size={16} color={cfg.c.v}/></button>;})}</div></div>
</div>}</div>;})}
</div></div>}

{/* WEEK NAV */}
<div style={{display:"flex",alignItems:"center",gap:16,marginBottom:12,padding:16,background:"#FFF",borderRadius:10,border:"1px solid var(--color-border-light)"}}>
<button onClick={function(){sWOff(wOff-1);}} style={{width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",background:"var(--color-surface-alt)",border:"1px solid var(--color-border-light)",borderRadius:6,cursor:"pointer"}}><ChevronLeft size={18}/></button>
<div style={{flex:1,textAlign:"center"}}><div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:2}}><Calendar size={15} color="#D97706"/><span style={{fontFamily:"var(--font-display)",fontSize:18,fontWeight:700}}>Week {wn}</span>{isCur&&<span style={{fontSize:10,fontWeight:700,color:"#FFF",background:"#D97706",padding:"2px 8px",borderRadius:99}}>Current</span>}</div><div style={{fontSize:13,color:"var(--color-slate)"}}>{fDt(cMon)} — {fDt(cFri)}, {cMon.getFullYear()}</div></div>
<button onClick={function(){sWOff(wOff+1);}} style={{width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",background:"var(--color-surface-alt)",border:"1px solid var(--color-border-light)",borderRadius:6,cursor:"pointer"}}><ChevronRight size={18}/></button>
{!isCur&&<button onClick={function(){sWOff(0);}} style={{padding:"8px 16px",fontSize:13,fontWeight:600,fontFamily:"var(--font-body)",background:"#FEF3C7",color:"#D97706",border:"1px solid rgba(217,119,6,0.2)",borderRadius:6,cursor:"pointer"}}>Today</button>}
</div>

{/* STATS */}
<div style={{display:"flex",alignItems:"center",gap:24,marginBottom:12,padding:"8px 16px"}}>
<div style={{textAlign:"center"}}><span style={{fontFamily:"var(--font-display)",fontSize:20,fontWeight:700,display:"block"}}>{made}/{tot}</span><span style={{fontSize:11,color:"var(--color-slate-light)"}}>Created</span></div>
<div style={{textAlign:"center"}}><span style={{fontFamily:"var(--font-display)",fontSize:20,fontWeight:700,color:"#059669",display:"block"}}>{appd}</span><span style={{fontSize:11,color:"var(--color-slate-light)"}}>Approved</span></div>
<div style={{textAlign:"center"}}><span style={{fontFamily:"var(--font-display)",fontSize:20,fontWeight:700,color:miss>0?"#DC2626":"#059669",display:"block"}}>{miss}</span><span style={{fontSize:11,color:"var(--color-slate-light)"}}>Missing</span></div>
<div style={{flex:1}}/><div style={{display:"flex",alignItems:"center",gap:8,maxWidth:200,flex:1}}><div style={{flex:1,height:6,background:"var(--color-surface-alt)",borderRadius:3}}><div style={{height:"100%",background:"#059669",borderRadius:3,width:Math.round(made/tot*100)+"%",transition:"width 0.3s"}}/></div><span style={{fontSize:13,fontWeight:600,color:"var(--color-slate)"}}>{Math.round(made/tot*100)}%</span></div>
</div>

{/* GRID */}
<div style={{overflowX:"auto",marginBottom:12}}><div style={{display:"grid",gridTemplateColumns:"80px repeat(5, 1fr)",gap:2,minWidth:900}}>
<div style={{padding:10,fontSize:11,fontWeight:600,color:"var(--color-slate-light)",textTransform:"uppercase"}}>Period</div>
{DAYS.map(function(day,idx){var isT=isCur&&wDts[idx].toDateString()===today.toDateString();return <div key={day.key} style={{padding:"10px 8px",background:isT?"#FEF3C7":"#FFF",borderRadius:"8px 8px 0 0",textAlign:"center",border:"1px solid "+(isT?"#D97706":"var(--color-border-light)")}}><div style={{fontSize:13,fontWeight:700}}>{day.label}</div><div style={{fontSize:11,color:isT?"#D97706":"var(--color-slate-light)",marginTop:2,fontWeight:isT?700:400}}>{fDt(wDts[idx])}</div></div>;})}

{PT.map(function(pt){return <React.Fragment key={pt.p}>
<div style={{padding:"10px 6px",textAlign:"center"}}><div style={{fontWeight:700,fontSize:13}}>P{pt.p}</div><div style={{fontSize:9,color:"var(--color-slate-light)",marginTop:2}}>{pt.s}–{pt.e}</div></div>
{DAYS.map(function(day){
  var sl=(wd[day.key]||[]).find(function(s){return s.p===pt.p;});
  if(!sl)return <div key={day.key} style={{background:"var(--color-surface-alt)",border:"1px solid var(--color-border-light)",borderRadius:6,padding:8,minHeight:100,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{color:"var(--color-border)",fontSize:16}}>—</span></div>;

  var pl=sl.plan;var sc=pl?SC[sl.plan.st]:null;var Ic=sc?sc.ic:null;
  var cs=gCS(sl.cl);var ShI=gSh(sl.cl);

  return <div key={day.key} style={{
    background:cs.l,border:"1px solid "+cs.c+"33",borderRadius:6,padding:10,minHeight:100,cursor:"pointer",
    borderTop:pl?"3px solid "+sc.c:"3px solid var(--color-border-light)",borderLeft:"5px solid "+cs.c,
    position:"relative"
  }} onClick={function(){pl?sSp(Object.assign({},pl,{slot:sl,day:day.key})):openC(day.key,sl);}}>
    {/* Class + Subject header */}
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
      <div style={{display:"flex",alignItems:"center",gap:4}}>
        <ShI size={14} color={cs.c} fill={cs.c}/>
        <span style={{fontSize:12,fontWeight:800,color:cs.c}}>{sl.cl}</span>
      </div>
      <span style={{fontSize:9,fontWeight:600,color:cs.c,background:cs.c+"20",padding:"1px 6px",borderRadius:99}}>{sl.sub}</span>
    </div>
    {pl?<div>
      <div style={{fontSize:11,fontWeight:600,color:"var(--color-navy)",lineHeight:1.3,marginBottom:5}}>{pl.t}</div>
      <div style={{display:"flex",alignItems:"center",gap:4,flexWrap:"wrap"}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:2,padding:"2px 6px",borderRadius:99,fontSize:9,fontWeight:600,background:sc.bg,color:sc.c}}><Ic size={10}/> {sc.lb}</div>
        {pl.att&&pl.att.length>0&&<div style={{display:"inline-flex",alignItems:"center",gap:2,fontSize:9,color:"var(--color-slate-light)"}}><Paperclip size={9}/> {pl.att.length}</div>}
      </div>
      {pl.del&&<div style={{display:"inline-flex",alignItems:"center",gap:2,marginTop:3,fontSize:9,color:"#059669",fontWeight:600}}><Check size={10}/> Delivered</div>}
    </div>
    :<button style={{display:"flex",alignItems:"center",gap:3,width:"100%",marginTop:8,padding:6,fontSize:11,fontWeight:500,fontFamily:"var(--font-body)",background:"#FFF",color:"var(--color-slate)",border:"1px dashed var(--color-border)",borderRadius:4,cursor:"pointer",justifyContent:"center"}} onClick={function(e){e.stopPropagation();openC(day.key,sl);}}><Plus size={14}/> Add Plan</button>}
  </div>;
})}
</React.Fragment>;})}
</div></div>

{/* LEGEND */}
<div style={{display:"flex",gap:16,justifyContent:"center",padding:"8px 0",fontSize:12,color:"var(--color-slate)",flexWrap:"wrap",alignItems:"center"}}>
{Object.entries(SC).map(function(e){return <div key={e[0]} style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:8,height:8,borderRadius:2,background:e[1].c}}/>{e[1].lb}</div>;})}
<span style={{color:"var(--color-border)"}}>|</span>
{Object.keys(ccfg).map(function(cl){var cfg=ccfg[cl];var SI=cfg.s.i;return <div key={cl} style={{display:"flex",alignItems:"center",gap:4,padding:"2px 8px",background:cfg.c.l,borderRadius:99,border:"1px solid "+cfg.c.v+"44"}}><SI size={11} color={cfg.c.v} fill={cfg.c.v}/><span style={{fontWeight:600,color:cfg.c.v}}>{cl}</span></div>;})}
</div>

{/* ─── DETAIL PANEL ───────────────────────────────────── */}
{sp&&<div style={{position:"fixed",inset:0,background:"rgba(15,23,42,0.4)",zIndex:200,display:"flex",justifyContent:"flex-end",animation:"fadeIn 0.2s"}} onClick={function(){sSp(null);}}>
<div style={{width:520,height:"100%",background:"#FFF",overflowY:"auto",padding:24,animation:"slideIn 0.25s ease-out",boxShadow:"0 12px 32px rgba(0,0,0,0.1)"}} onClick={function(e){e.stopPropagation();}}>

<div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24}}>
<div><div style={{fontSize:13,color:"#D97706",fontWeight:600,marginBottom:4}}>{sp.slot.cl} · {sp.slot.sub} · P{sp.slot.p} · {DAYS.find(function(d){return d.key===sp.day;}).label}</div><h2 style={{fontFamily:"var(--font-display)",fontSize:22,fontWeight:600}}>{sp.t}</h2></div>
<button onClick={function(){sSp(null);}} style={{background:"none",border:"none",color:"var(--color-slate-light)",cursor:"pointer"}}><X size={20}/></button></div>

<div style={{display:"inline-flex",alignItems:"center",gap:6,padding:"8px 14px",borderRadius:6,fontSize:13,fontWeight:600,marginBottom:24,background:SC[sp.st].bg,color:SC[sp.st].c}}>{React.createElement(SC[sp.st].ic,{size:14})} {SC[sp.st].lb}{sp.fb&&<span style={{fontWeight:400,fontStyle:"italic"}}> — "{sp.fb}"</span>}</div>

<div style={{marginBottom:24}}><div style={{fontSize:12,fontWeight:600,color:"var(--color-slate-light)",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:8}}>Objectives</div><div style={{fontSize:15,lineHeight:1.6}}>{sp.obj}</div></div>
<div style={{marginBottom:24}}><div style={{fontSize:12,fontWeight:600,color:"var(--color-slate-light)",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:8}}>Activities</div><div style={{fontSize:15,lineHeight:1.6}}>{sp.act}</div></div>
{sp.dif&&<div style={{marginBottom:24}}><div style={{fontSize:12,fontWeight:600,color:"var(--color-slate-light)",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:8}}>Differentiation</div><div style={{fontSize:15,lineHeight:1.6}}>{sp.dif}</div></div>}
{sp.res&&<div style={{marginBottom:24}}><div style={{fontSize:12,fontWeight:600,color:"var(--color-slate-light)",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:8}}>Resources</div><div style={{fontSize:15,lineHeight:1.6}}>{sp.res}</div></div>}

{/* Attachments with remove */}
<div style={{marginBottom:24}}>
<div style={{fontSize:12,fontWeight:600,color:"var(--color-slate-light)",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:8}}>Attachments ({sp.att?sp.att.length:0})</div>
{sp.att&&sp.att.length>0?<div style={{display:"flex",flexDirection:"column",gap:6}}>{sp.att.map(function(a){
  return renderAttRow(a, function(){rmPanelAtt(a.id);});
})}</div>:<div style={{fontSize:13,color:"var(--color-slate-light)",fontStyle:"italic",padding:"8px 0"}}>No files attached</div>}
{renderFileInput(pfRef, onPanelFiles)}
</div>

<div style={{display:"flex",gap:8,paddingTop:24,borderTop:"1px solid var(--color-border-light)"}}>
{(sp.st==="draft"||sp.st==="rejected")&&<button onClick={function(){openE(sp,sp.slot,sp.day);}} style={{display:"flex",alignItems:"center",gap:6,padding:"10px 18px",fontSize:14,fontWeight:600,fontFamily:"var(--font-body)",background:"#DBEAFE",color:"#2563EB",border:"none",borderRadius:6,cursor:"pointer"}}><Edit3 size={14}/> Edit Plan</button>}
{sp.st==="draft"&&<button onClick={function(){handleSubmitPlan(sp.id);}} style={{display:"flex",alignItems:"center",gap:6,padding:"10px 18px",fontSize:14,fontWeight:600,fontFamily:"var(--font-body)",background:"#D97706",color:"#FFF",border:"none",borderRadius:6,cursor:"pointer"}}><Send size={14}/> Submit</button>}
{sp.st==="approved"&&!sp.del&&<button onClick={function(){handleDeliverLesson(sp.id);}} style={{display:"flex",alignItems:"center",gap:6,padding:"10px 18px",fontSize:14,fontWeight:600,fontFamily:"var(--font-body)",background:"#D1FAE5",color:"#059669",border:"none",borderRadius:6,cursor:"pointer"}}><Check size={14}/> Delivered</button>}
</div>
</div></div>}

{/* ─── CREATE/EDIT MODAL ──────────────────────────────── */}
{sCr&&tgt&&<div style={{position:"fixed",inset:0,background:"rgba(15,23,42,0.4)",zIndex:200,display:"flex",justifyContent:"center",alignItems:"center",animation:"fadeIn 0.2s"}} onClick={function(){ssCr(false);}}>
<div style={{width:720,maxHeight:"92vh",background:"#FFF",borderRadius:16,overflow:"hidden",display:"flex",flexDirection:"column"}} onClick={function(e){e.stopPropagation();}}>

<div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",padding:24,borderBottom:"1px solid var(--color-border-light)"}}>
<div><div style={{fontSize:13,color:"#D97706",fontWeight:600,marginBottom:4}}>{tgt.sub} · {tgt.cl} · P{tgt.p}</div><h2 style={{fontFamily:"var(--font-display)",fontSize:20,fontWeight:600}}>{isEd?"Edit Lesson Plan":"New Lesson Plan"}</h2></div>
<button onClick={function(){ssCr(false);}} style={{background:"none",border:"none",color:"var(--color-slate-light)",cursor:"pointer"}}><X size={20}/></button></div>

<div style={{padding:24,overflowY:"auto",flex:1,display:"flex",flexDirection:"column",gap:16}}>
<div><label style={{fontSize:13,fontWeight:600,color:"var(--color-slate)",display:"block",marginBottom:4}}>Title *</label><input type="text" value={fm.t} onChange={function(e){sFm(Object.assign({},fm,{t:e.target.value}));}} placeholder="e.g. Algebraic Expressions" style={{width:"100%",padding:"10px 14px",fontSize:14,fontFamily:"var(--font-body)",border:"1.5px solid var(--color-border)",borderRadius:6,color:"var(--color-navy)"}}/></div>
<div><label style={{fontSize:13,fontWeight:600,color:"var(--color-slate)",display:"block",marginBottom:4}}>Objectives *</label><textarea value={fm.obj} onChange={function(e){sFm(Object.assign({},fm,{obj:e.target.value}));}} placeholder="What will learners do?" style={{width:"100%",padding:"10px 14px",fontSize:14,fontFamily:"var(--font-body)",border:"1.5px solid var(--color-border)",borderRadius:6,resize:"vertical",lineHeight:1.5}} rows={3}/></div>
<div><label style={{fontSize:13,fontWeight:600,color:"var(--color-slate)",display:"block",marginBottom:4}}>Activities *</label><textarea value={fm.act} onChange={function(e){sFm(Object.assign({},fm,{act:e.target.value}));}} placeholder="Describe activities" style={{width:"100%",padding:"10px 14px",fontSize:14,fontFamily:"var(--font-body)",border:"1.5px solid var(--color-border)",borderRadius:6,resize:"vertical",lineHeight:1.5}} rows={4}/></div>
<div style={{display:"flex",gap:16}}>
<div style={{flex:1}}><label style={{fontSize:13,fontWeight:600,color:"var(--color-slate)",display:"block",marginBottom:4}}>Differentiation</label><textarea value={fm.dif} onChange={function(e){sFm(Object.assign({},fm,{dif:e.target.value}));}} placeholder="Support / extension" style={{width:"100%",padding:"10px 14px",fontSize:14,fontFamily:"var(--font-body)",border:"1.5px solid var(--color-border)",borderRadius:6,resize:"vertical",lineHeight:1.5}} rows={2}/></div>
<div style={{flex:1}}><label style={{fontSize:13,fontWeight:600,color:"var(--color-slate)",display:"block",marginBottom:4}}>Resources</label><textarea value={fm.res} onChange={function(e){sFm(Object.assign({},fm,{res:e.target.value}));}} placeholder="Textbooks, worksheets" style={{width:"100%",padding:"10px 14px",fontSize:14,fontFamily:"var(--font-body)",border:"1.5px solid var(--color-border)",borderRadius:6,resize:"vertical",lineHeight:1.5}} rows={2}/></div>
</div>

{/* Attachments section — shows existing (when editing) + new uploads */}
<div>
<label style={{fontSize:13,fontWeight:600,color:"var(--color-slate)",display:"block",marginBottom:4}}>Attachments</label>

{/* Existing attachments when editing */}
{isEd&&editExistAtt.length>0&&<div style={{marginBottom:8}}>
<div style={{fontSize:11,fontWeight:600,color:"var(--color-slate-light)",marginBottom:4}}>EXISTING FILES</div>
<div style={{display:"flex",flexDirection:"column",gap:4}}>
{editExistAtt.map(function(a,idx){return renderAttRow(a, function(){rmEditAtt(idx);});})}
</div></div>}

{/* Upload drop zone */}
<input ref={editFRef} type="file" multiple accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.png,.jpg,.jpeg" onChange={onCreateFiles} style={{display:"none"}}/>
<div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6,padding:24,border:"2px dashed var(--color-border)",borderRadius:10,cursor:"pointer"}} onClick={function(e){e.preventDefault();editFRef.current.click();}}>
<Upload size={20} color="var(--color-slate-light)"/>
<span style={{fontSize:14,fontWeight:500,color:"var(--color-slate)"}}>Click to upload files</span>
<span style={{fontSize:12,color:"var(--color-slate-light)"}}>PDF, Word, PowerPoint, Excel, Images</span>
</div>

{/* Pending new files */}
{pnd.length>0&&<div style={{display:"flex",flexDirection:"column",gap:4,marginTop:8}}>
<div style={{fontSize:11,fontWeight:600,color:"var(--color-slate-light)",marginBottom:2}}>NEW FILES</div>
{pnd.map(function(f,i){return <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",background:"var(--color-surface-alt)",borderRadius:6,border:"1px solid var(--color-border-light)"}}>
<File size={14} color="var(--color-info)"/>
<span style={{flex:1,fontSize:13,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{f.name}</span>
<span style={{fontSize:11,color:"var(--color-slate-light)",flexShrink:0}}>{fSz(f.size)}</span>
<button onClick={function(){rmPending(i);}} style={{background:"none",border:"none",color:"#DC2626",cursor:"pointer",padding:4}}><X size={14}/></button>
</div>;})}
</div>}
</div>
</div>

<div style={{display:"flex",justifyContent:"flex-end",gap:8,padding:"16px 24px",borderTop:"1px solid var(--color-border-light)",background:"var(--color-surface-alt)"}}>
<button onClick={function(){ssCr(false);}} style={{padding:"10px 18px",fontSize:14,fontWeight:500,fontFamily:"var(--font-body)",background:"transparent",color:"var(--color-slate)",border:"1px solid var(--color-border)",borderRadius:6,cursor:"pointer"}}>Cancel</button>
<button onClick={doSave(false)} disabled={sav||!fm.t||!fm.obj} style={{display:"flex",alignItems:"center",gap:6,padding:"10px 18px",fontSize:14,fontWeight:600,fontFamily:"var(--font-body)",background:"#FFF",color:"var(--color-navy)",border:"1px solid var(--color-border)",borderRadius:6,cursor:"pointer",opacity:sav||!fm.t?0.6:1}}>{sav?<Loader2 size={16} style={{animation:"spin 1s linear infinite"}}/>:<Save size={16}/>} {isEd?"Update Draft":"Save Draft"}</button>
<button onClick={doSave(true)} disabled={sav||!fm.t||!fm.obj||!fm.act} style={{display:"flex",alignItems:"center",gap:6,padding:"10px 18px",fontSize:14,fontWeight:600,fontFamily:"var(--font-body)",background:"#D97706",color:"#FFF",border:"none",borderRadius:6,cursor:"pointer",opacity:sav||!fm.act?0.6:1}}><Send size={16}/> {isEd?"Update & Submit":"Save & Submit"}</button>
</div>
</div></div>}

{/* ─── IMPORT MODAL ───────────────────────────────────── */}
{sImp&&<div style={{position:"fixed",inset:0,background:"rgba(15,23,42,0.4)",zIndex:200,display:"flex",justifyContent:"center",alignItems:"center",animation:"fadeIn 0.2s"}} onClick={function(){ssImp(false);sIRes(null);}}>
<div style={{width:520,maxHeight:"85vh",background:"#FFF",borderRadius:16,overflow:"hidden",display:"flex",flexDirection:"column"}} onClick={function(e){e.stopPropagation();}}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",padding:24,borderBottom:"1px solid var(--color-border-light)"}}><div><h2 style={{fontFamily:"var(--font-display)",fontSize:20,fontWeight:600}}>Import Lesson Plans</h2><p style={{fontSize:13,color:"var(--color-slate)",marginTop:4}}>Upload CSV or Excel</p></div><button onClick={function(){ssImp(false);sIRes(null);}} style={{background:"none",border:"none",color:"var(--color-slate-light)",cursor:"pointer"}}><X size={20}/></button></div>
<div style={{padding:24,overflowY:"auto",flex:1,display:"flex",flexDirection:"column",gap:16}}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:16,background:"#D1FAE5",borderRadius:10}}><div style={{display:"flex",alignItems:"center",gap:10}}><File size={18} color="#059669"/><div><div style={{fontWeight:600,fontSize:14}}>Download Template</div><div style={{fontSize:12,color:"var(--color-slate)"}}>CSV with correct headers</div></div></div><button onClick={dlTpl} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 14px",fontSize:13,fontWeight:600,fontFamily:"var(--font-body)",background:"#FFF",color:"#059669",border:"1px solid rgba(5,150,105,0.3)",borderRadius:6,cursor:"pointer"}}><Download size={14}/> Download</button></div>
<div><div style={{fontSize:12,fontWeight:600,color:"var(--color-slate-light)",marginBottom:6,textTransform:"uppercase"}}>Expected columns</div><div style={{display:"flex",flexWrap:"wrap",gap:4}}>{["day","period","title*","objectives*","activities","differentiation","resources"].map(function(c){return <span key={c} style={{padding:"3px 10px",background:"var(--color-surface-alt)",borderRadius:99,fontSize:12,border:"1px solid var(--color-border-light)"}}>{c}</span>;})}</div></div>
<div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6,padding:24,border:"2px dashed var(--color-border)",borderRadius:10,cursor:"pointer"}} onClick={function(){iRef.current.click();}}><Upload size={24} color="var(--color-slate-light)"/><span style={{fontSize:14,fontWeight:500,color:"var(--color-slate)"}}>Click to select file</span><span style={{fontSize:12,color:"var(--color-slate-light)"}}>.csv or .xlsx</span><input ref={iRef} type="file" accept=".csv,.xlsx,.xls" onChange={doImp} style={{display:"none"}}/></div>
{iRes&&<div style={{padding:16,background:"var(--color-surface-alt)",borderRadius:10,border:"1px solid var(--color-border-light)"}}>{iRes.ld?<div style={{display:"flex",alignItems:"center",gap:8,justifyContent:"center",padding:16,fontSize:14}}><Loader2 size={20} style={{animation:"spin 1s linear infinite"}}/> Importing...</div>:<div><div style={{display:"flex",gap:24,marginBottom:8}}><div style={{display:"flex",alignItems:"center",gap:4,fontSize:14,fontWeight:600}}><CheckCircle2 size={16} color="#059669"/> {iRes.cr} created</div><div style={{display:"flex",alignItems:"center",gap:4,fontSize:14,fontWeight:600}}><AlertCircle size={16} color="#D97706"/> {iRes.sk} skipped</div></div>{iRes.er.map(function(err,i){return <div key={i} style={{fontSize:13,color:"#D97706",padding:"2px 0"}}>{err}</div>;})}</div>}</div>}
</div>
<div style={{display:"flex",justifyContent:"flex-end",gap:8,padding:"16px 24px",borderTop:"1px solid var(--color-border-light)",background:"var(--color-surface-alt)"}}><button onClick={function(){ssImp(false);sIRes(null);}} style={{padding:"10px 18px",fontSize:14,fontWeight:500,fontFamily:"var(--font-body)",background:"transparent",color:"var(--color-slate)",border:"1px solid var(--color-border)",borderRadius:6,cursor:"pointer"}}>{iRes&&!iRes.ld?"Done":"Cancel"}</button></div>
</div></div>}

<style dangerouslySetInnerHTML={{__html:"@keyframes spin{to{transform:rotate(360deg)}}@keyframes slideIn{from{transform:translateX(100%)}to{transform:translateX(0)}}@keyframes fadeIn{from{opacity:0}to{opacity:1}}input:focus,textarea:focus{outline:none;border-color:#D97706!important;box-shadow:0 0 0 3px rgba(217,119,6,0.15)!important}"}}/>
</div>);
}
