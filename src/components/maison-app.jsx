"use client";
import { useState, useEffect, useRef } from "react";

/* ═══════════════════════════════════════════════════════════════════════════
   MAISON v3 — Light Theme, Shipment Details, Inbox Filters, Delay Cascade
   ═══════════════════════════════════════════════════════════════════════════ */

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Outfit:wght@300;400;500;600;700&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { -webkit-text-size-adjust: 100%; }

:root {
  --bg: #faf9f7;
  --bg2: #f2f0ec;
  --surface: #ffffff;
  --surface2: #f5f3ef;
  --border: rgba(0,0,0,0.08);
  --border2: rgba(0,0,0,0.14);
  --gold: #9e7c3c;
  --gold-light: #c8a96e;
  --gold-bg: rgba(158,124,60,0.08);
  --red: #c0392b;
  --red-bg: rgba(192,57,43,0.08);
  --amber: #d4820a;
  --amber-bg: rgba(212,130,10,0.08);
  --green: #27855a;
  --green-bg: rgba(39,133,90,0.08);
  --blue: #2872a8;
  --blue-bg: rgba(40,114,168,0.08);
  --muted: #999;
  --text: #1a1a1a;
  --text2: #666;
  --text3: #999;
  --font-display: 'Playfair Display', Georgia, serif;
  --font-body: 'Outfit', system-ui, sans-serif;
}

body { background: var(--bg); color: var(--text); font-family: var(--font-body); }
::-webkit-scrollbar { width: 4px; height: 4px; }
::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.12); border-radius: 4px; }
input, select, textarea, button { font-family: var(--font-body); }
button { cursor: pointer; border: none; background: none; }
img { display: block; }

@keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
@keyframes slideUp { from { transform: translateY(100%); } to { transform: none; } }
@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.35; } }
.fade-up { animation: fadeUp 0.3s ease both; }
.slide-up { animation: slideUp 0.25s ease both; }
.live-dot { animation: pulse 2s infinite; }
`;

/* ─── CONSTANTS ──────────────────────────────────────────────────────────── */
const GOLD = "#9e7c3c"; const RED = "#c0392b"; const AMBER = "#d4820a";
const GREEN = "#27855a"; const BLUE = "#2872a8"; const MUTED = "#999";

const STATUS = {
  draft:      { color: MUTED,    label: "Draft",         bg: "rgba(0,0,0,0.05)" },
  submitted:  { color: BLUE,     label: "Submitted",     bg: "var(--blue-bg)" },
  production: { color: AMBER,    label: "In Production", bg: "var(--amber-bg)" },
  ontrack:    { color: GREEN,    label: "On Track",      bg: "var(--green-bg)" },
  delayed:    { color: RED,      label: "Delayed",       bg: "var(--red-bg)" },
  shipped:    { color: "#7c3aed", label: "Shipped",      bg: "rgba(124,58,237,0.08)" },
  received:   { color: GREEN,    label: "Received",      bg: "var(--green-bg)" },
  cancelled:  { color: "#888",   label: "Cancelled",     bg: "rgba(0,0,0,0.04)" },
};
const STATUSES = Object.keys(STATUS);

const COLLECTIONS = [
  { id:"col-1", name:"Spring Bloom 2025", shortName:"Spring", color:"#27855a", slots:12 },
  { id:"col-2", name:"Summer Heat 2025",  shortName:"Summer", color:"#d4820a", slots:12 },
  { id:"col-3", name:"Autumn Luxe 2025",  shortName:"Autumn", color:"#a0522d", slots:12 },
  { id:"col-4", name:"Holiday Glow 2025", shortName:"Holiday",color:"#7c3aed", slots:12 },
];

const MFRS = [
  { id:"mfr-1", name:"Trims",            country:"India", seaWeeks:8, airDays:14 },
  { id:"mfr-2", name:"Tomorrow Fashion", country:"China", seaWeeks:8, airDays:7 },
  { id:"mfr-3", name:"Bidier",           country:"China", seaWeeks:8, airDays:7 },
];

const SIZES = ["XS","S","M","L","XL","XXL"];

const USERS = [
  { id:"u1", email:"admin@brand.com",     pass:"pass", role:"admin",     name:"Alex Admin" },
  { id:"u2", email:"logistics@brand.com", pass:"pass", role:"logistics", name:"Jordan Lee" },
  { id:"u3", email:"marketing@brand.com", pass:"pass", role:"marketing", name:"Priya Nair" },
  { id:"u4", email:"design@brand.com",    pass:"pass", role:"design",    name:"Sofia Marte" },
  { id:"u5", email:"warehouse@brand.com", pass:"pass", role:"warehouse", name:"Carlos Ruiz" },
];

const TABS_BY_ROLE = {
  admin:["home","dresses","inbox","shipments"], logistics:["home","dresses","shipments"],
  marketing:["home","dresses"], design:["home","dresses","inbox"], warehouse:["home","dresses","shipments"],
};
const TAB_ICONS = { home:"⌂", dresses:"◈", inbox:"✉", shipments:"◎" };

/* ─── HELPERS ────────────────────────────────────────────────────────────── */
const uid = () => Math.random().toString(36).slice(2,10);
const sum = o => Object.values(o).reduce((a,b)=>a+b,0);
const daysUntil = d => Math.ceil((new Date(d)-new Date())/864e5);
const fmtDate = d => { try { return new Date(d).toLocaleDateString("en-US",{month:"short",day:"numeric"}); } catch{ return d; }};
const nowISO = () => new Date().toISOString().split("T")[0];
const nowTime = () => new Date().toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"});
const qM = (xs,s,m,l,xl,xxl) => ({XS:xs,S:s,M:m,L:l,XL:xl,XXL:xxl});

function matchDress(text, dresses) {
  const low = text.toLowerCase();
  return dresses.filter(d => low.includes(d.name.toLowerCase()) || low.includes(d.poNumber.toLowerCase())).map(d=>d.id);
}

/* ─── SEED ───────────────────────────────────────────────────────────────── */
const IMGS = [
  "1558618047-f4042eb19143","1515886153-7f5c45b725b3","1496747611-3c77fbe12163",
  "1502716534-e75a37f3bcdf","1518577915-9d1a8a3d8e29","1524504388-b8b4e1c1ecb0",
  "1549062572-544a64df2316","1551803091-2d30ba8e8e64","1562572159-5c4b5ecb55a3",
  "1544966503-39e4e70eb3ae","1583846783-07850e1f0a87","1596783894-78d8b5d39c88",
];

function mkDress(po,name,col,mfr,status,due,ordered,qty,imgI,alerts=[]) {
  return {
    id:uid(), poNumber:po, name, collectionId:col, manufacturerId:mfr, status, dueDate:due,
    orderDate:ordered, quantities:qty, imageUrl:`https://images.unsplash.com/photo-${IMGS[imgI]}?w=400&q=75`,
    milestones:[
      {label:"Fabric Sourced",done:["production","ontrack","shipped","received"].includes(status)},
      {label:"Cutting",done:["ontrack","shipped","received"].includes(status)},
      {label:"Sewing",done:["shipped","received"].includes(status)},
      {label:"QC Passed",done:["shipped","received"].includes(status)},
      {label:"Dispatched",done:status==="received"},
    ],
    timeline:[{id:uid(),date:ordered,time:"9:00 AM",type:"system",source:"PO Created",content:`PO ${po} submitted`,user:"Sofia Marte",category:"design"}],
    alerts,
  };
}

const SEED_DRESSES = [
  mkDress("PO-001","Florentine Wrap","col-1","mfr-1","ontrack","2025-03-18","2025-01-10",qM(20,50,80,60,30,10),0),
  mkDress("PO-002","Côte d'Azur Midi","col-1","mfr-2","production","2025-03-25","2025-01-12",qM(15,40,70,55,25,8),1),
  mkDress("PO-003","Riviera Maxi","col-1","mfr-3","delayed","2025-03-15","2025-01-05",qM(10,35,60,50,20,5),2,["Fabric supplier delayed — ETA pushed 2 weeks"]),
  mkDress("PO-004","Capri Shift","col-1","mfr-1","ontrack","2025-04-01","2025-01-15",qM(18,45,75,58,28,9),3),
  mkDress("PO-005","Amalfi Slip","col-1","mfr-2","production","2025-04-05","2025-01-18",qM(12,38,65,52,22,7),4),
  mkDress("PO-006","Portofino Pleat","col-1","mfr-3","submitted","2025-04-10","2025-01-20",qM(14,42,68,54,24,8),5),
  mkDress("PO-007","Sorrento Tiered","col-1","mfr-1","production","2025-04-12","2025-01-22",qM(16,44,72,56,26,8),6),
  mkDress("PO-008","Santorini Ruffle","col-1","mfr-2","draft","2025-04-15","2025-01-25",qM(0,0,0,0,0,0),7),
  mkDress("PO-009","Mykonos Linen","col-1","mfr-3","draft","2025-04-20","2025-01-28",qM(0,0,0,0,0,0),8),
  mkDress("PO-010","Aegean Halter","col-1","mfr-1","draft","2025-04-25","2025-02-01",qM(0,0,0,0,0,0),9),
  mkDress("PO-011","Naxos Broderie","col-2","mfr-2","submitted","2025-05-15","2025-02-10",qM(20,48,78,60,28,10),10),
  mkDress("PO-012","Paros Cutout","col-2","mfr-3","submitted","2025-05-20","2025-02-12",qM(18,44,72,55,25,9),11),
];

const SEED_SHIPMENTS = [
  { id:"SHP-001", dressIds:[], carrier:"DHL Express", trackingNo:"DHL928374", eta:"2025-03-20", method:"air", mfrId:"mfr-1", status:"In Transit", lastUpdate:"Departed Mumbai hub — in transit to JFK",
    updates: [
      { date:"2025-02-20", time:"8:00 AM", type:"tracking", content:"Shipment picked up from Trims facility, Mumbai" },
      { date:"2025-02-22", time:"2:15 PM", type:"tracking", content:"Cleared customs, Mumbai airport" },
      { date:"2025-02-23", time:"6:40 AM", type:"tracking", content:"Departed Mumbai hub — in transit to JFK" },
      { date:"2025-02-22", time:"10:00 AM", type:"email", content:"DHL confirmation: Your shipment DHL928374 is in transit. ETA March 20.", from:"DHL Express" },
    ]
  },
  { id:"SHP-002", dressIds:[], carrier:"Maersk", trackingNo:"MSK4471029", eta:"2025-04-10", method:"sea", mfrId:"mfr-2", status:"Awaiting Pickup", lastUpdate:"Container loaded at Shanghai port",
    updates: [
      { date:"2025-02-18", time:"3:00 PM", type:"tracking", content:"Container loaded at Shanghai port" },
      { date:"2025-02-19", time:"9:30 AM", type:"email", content:"Maersk booking confirmed for container MSK4471029. Vessel departure scheduled Feb 25.", from:"Maersk Line" },
    ]
  },
];

const SEED_MSGS = [
  { id:uid(), from:"Trims", channel:"whatsapp", content:"Hi! Fabric for PO-001 Florentine Wrap passed QC — moving to cutting tomorrow.", date:"2025-02-24", time:"9:14 AM", linkedDressIds:[], needsReview:false, resolved:true, category:"design" },
  { id:uid(), from:"Bidier", channel:"whatsapp", content:"Unfortunately fabric supplier for PO-003 Riviera Maxi has delayed shipment by 2 weeks.", date:"2025-02-23", time:"3:42 PM", linkedDressIds:[], needsReview:false, resolved:true, category:"design" },
  { id:uid(), from:"DHL Express", channel:"email", content:"Tracking update: Shipment DHL928374 has departed Mumbai hub and is in transit to JFK. ETA March 20.", date:"2025-02-23", time:"6:45 AM", linkedDressIds:[], needsReview:false, resolved:true, category:"shipping" },
  { id:uid(), from:"Tomorrow Fashion", channel:"email", content:"Production progress report: PO-002 and PO-005 both on schedule. Sample photos attached.", date:"2025-02-22", time:"11:30 AM", linkedDressIds:[], needsReview:false, resolved:true, category:"design" },
  { id:uid(), from:"Maersk Line", channel:"email", content:"Booking confirmed for container MSK4471029. Vessel departure Feb 25 from Shanghai.", date:"2025-02-19", time:"9:30 AM", linkedDressIds:[], needsReview:false, resolved:true, category:"shipping" },
  { id:uid(), from:"Bidier", channel:"whatsapp", content:"We have finished the first batch, checking quality now. Some minor stitching issues.", date:"2025-02-21", time:"4:10 PM", linkedDressIds:[], needsReview:true, resolved:false, category:"design" },
];

/* ─── UI ATOMS ───────────────────────────────────────────────────────────── */
const Badge = ({status,small}) => { const s=STATUS[status]||STATUS.draft; return <span style={{background:s.bg,color:s.color,border:`1px solid ${s.color}22`,borderRadius:20,padding:small?"1px 8px":"3px 11px",fontSize:small?9:10,fontWeight:700,letterSpacing:0.5,textTransform:"uppercase",whiteSpace:"nowrap"}}>{s.label}</span>; };

const Chip = ({children,active,onClick,color}) => (
  <button onClick={onClick} style={{background:active?(color||GOLD)+"14":"var(--surface2)",border:`1px solid ${active?(color||GOLD)+"33":"var(--border)"}`,color:active?(color||GOLD):"var(--text3)",borderRadius:20,padding:"5px 14px",fontSize:12,fontWeight:600,whiteSpace:"nowrap",transition:"all .15s"}}>{children}</button>
);

const ToggleBtn = ({children,active,onClick}) => (
  <button onClick={onClick} style={{background:active?"var(--text)":"transparent",color:active?"#fff":"var(--text3)",borderRadius:8,padding:"7px 16px",fontSize:12,fontWeight:600,transition:"all .15s",border:"1px solid var(--border)"}}>{children}</button>
);

const Card = ({children,onClick,style,alert,className=""}) => (
  <div onClick={onClick} className={className} style={{background:"var(--surface)",border:`1px solid ${alert?"var(--red)"+"33":"var(--border)"}`,borderRadius:14,overflow:"hidden",boxShadow:"0 1px 3px rgba(0,0,0,0.04)",...(onClick?{cursor:"pointer"}:{}),...style}}>{children}</div>
);

const Inp = ({style,...p}) => <input {...p} style={{background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:10,color:"var(--text)",padding:"11px 14px",fontSize:14,width:"100%",outline:"none",fontFamily:"var(--font-body)",...style}} />;
const Txa = ({style,...p}) => <textarea {...p} style={{background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:10,color:"var(--text)",padding:"11px 14px",fontSize:14,width:"100%",outline:"none",resize:"none",fontFamily:"var(--font-body)",...style}} />;
const Sel = ({style,...p}) => <select {...p} style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:10,color:"var(--text)",padding:"11px 14px",fontSize:14,width:"100%",outline:"none",fontFamily:"var(--font-body)",...style}} />;

const BtnGold = ({children,onClick,small,style,disabled}) => <button onClick={onClick} disabled={disabled} style={{background:disabled?"#ddd":"var(--gold)",color:"#fff",borderRadius:10,padding:small?"8px 16px":"12px 24px",fontSize:small?12:14,fontWeight:700,opacity:disabled?0.5:1,...style}}>{children}</button>;
const BtnGhost = ({children,onClick,small,style}) => <button onClick={onClick} style={{background:"var(--surface2)",border:"1px solid var(--border)",color:"var(--text2)",borderRadius:10,padding:small?"8px 14px":"12px 20px",fontSize:small?12:14,fontWeight:500,...style}}>{children}</button>;
const Lbl = ({children}) => <div style={{fontSize:10,color:"var(--text3)",textTransform:"uppercase",letterSpacing:1.5,marginBottom:6,fontWeight:600}}>{children}</div>;

const Ring = ({value,total,color=GOLD,size=64,stroke=5}) => {
  const r=(size-stroke*2)/2, circ=2*Math.PI*r, pct=total?value/total:0;
  return <svg width={size} height={size} style={{transform:"rotate(-90deg)"}}><circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth={stroke}/><circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeDasharray={circ} strokeDashoffset={circ*(1-pct)} strokeLinecap="round" style={{transition:"stroke-dashoffset 0.6s ease"}}/></svg>;
};

const Overlay = ({children,onClose}) => (
  <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",backdropFilter:"blur(4px)",zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
    <div className="slide-up" style={{background:"#fff",borderRadius:"20px 20px 0 0",width:"100%",maxWidth:580,maxHeight:"92dvh",overflowY:"auto",padding:"24px 20px 32px"}}>{children}</div>
  </div>
);

/* ═══════════════════════════════════════════════════════════════════════════
   LOGIN
   ═══════════════════════════════════════════════════════════════════════════ */
const LoginScreen = ({onLogin}) => {
  const [email,setEmail]=useState(""); const [pass,setPass]=useState(""); const [err,setErr]=useState("");
  const go=()=>{ const u=USERS.find(u=>u.email===email&&u.pass===pass); if(u)onLogin(u); else setErr("Invalid credentials"); };
  return (
    <div style={{minHeight:"100dvh",background:"var(--bg)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{width:"100%",maxWidth:340}}>
        <div style={{textAlign:"center",marginBottom:44}}>
          <div style={{fontSize:10,letterSpacing:5,color:GOLD,textTransform:"uppercase",marginBottom:10,fontWeight:600}}>Atelier</div>
          <div style={{fontFamily:"var(--font-display)",fontSize:44,fontWeight:600,color:"var(--text)",lineHeight:1}}>Maison</div>
          <div style={{color:"var(--text3)",fontSize:13,marginTop:10,fontWeight:300}}>Fashion Operations Platform</div>
        </div>
        <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:16,padding:28,boxShadow:"0 2px 12px rgba(0,0,0,0.06)"}}>
          <div style={{marginBottom:16}}><Lbl>Email</Lbl><Inp value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@brand.com"/></div>
          <div style={{marginBottom:24}}><Lbl>Password</Lbl><Inp value={pass} onChange={e=>setPass(e.target.value)} type="password" placeholder="••••••••" onKeyDown={e=>e.key==="Enter"&&go()}/></div>
          {err&&<div style={{color:RED,fontSize:12,marginBottom:12,textAlign:"center"}}>{err}</div>}
          <BtnGold onClick={go} style={{width:"100%",padding:14}}>Sign In</BtnGold>
          <div style={{marginTop:20,fontSize:11,color:"var(--text3)",textAlign:"center",lineHeight:1.7}}>admin / logistics / marketing / design / warehouse<br/>password: <span style={{color:GOLD,fontWeight:600}}>pass</span></div>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   DRESS DETAIL
   ═══════════════════════════════════════════════════════════════════════════ */
const DressDetail = ({dress,onClose,onUpdate,user}) => {
  const [comment,setComment]=useState(""); const [img,setImg]=useState(null); const fileRef=useRef();
  const mfr=MFRS.find(m=>m.id===dress.manufacturerId); const d=daysUntil(dress.dueDate); const done=dress.milestones.filter(m=>m.done).length;

  const addEntry=()=>{ if(!comment&&!img)return; const entry={id:uid(),date:nowISO(),time:nowTime(),type:img?"image":"comment",source:`Comment by ${user.name}`,content:comment||"Image uploaded",user:user.name,imageUrl:img||null,category:"design"}; onUpdate({...dress,timeline:[...dress.timeline,entry]}); setComment(""); setImg(null); };
  const setStatus=s=>{ const entry={id:uid(),date:nowISO(),time:nowTime(),type:"system",source:"Status Change",content:`Status → ${STATUS[s].label}`,user:user.name,category:"design"}; onUpdate({...dress,status:s,timeline:[...dress.timeline,entry]}); };
  const toggleMs=i=>{ const ms=[...dress.milestones]; ms[i]={...ms[i],done:!ms[i].done}; const entry={id:uid(),date:nowISO(),time:nowTime(),type:"system",source:"Milestone",content:`${ms[i].label}: ${ms[i].done?"✓":"unchecked"}`,user:user.name,category:"design"}; onUpdate({...dress,milestones:ms,timeline:[...dress.timeline,entry]}); };

  return (
    <Overlay onClose={onClose}>
      <div style={{display:"flex",gap:14,marginBottom:16}}>
        {dress.imageUrl&&<img src={dress.imageUrl} alt="" style={{width:72,height:90,objectFit:"cover",borderRadius:10,flexShrink:0}}/>}
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:10,color:GOLD,letterSpacing:2,fontWeight:700}}>{dress.poNumber}</div>
          <div style={{fontFamily:"var(--font-display)",fontSize:22,fontWeight:600,color:"var(--text)",lineHeight:1.2,marginTop:2}}>{dress.name}</div>
          <div style={{fontSize:12,color:"var(--text3)",marginTop:4}}>{COLLECTIONS.find(c=>c.id===dress.collectionId)?.name} · {mfr?.name}</div>
          <div style={{marginTop:6}}><Badge status={dress.status}/></div>
        </div>
        <button onClick={onClose} style={{color:"var(--text3)",fontSize:22,alignSelf:"flex-start",padding:4}}>×</button>
      </div>

      {dress.alerts.map((a,i)=><div key={i} style={{background:"var(--red-bg)",border:`1px solid ${RED}22`,borderRadius:10,padding:"10px 14px",marginBottom:10,fontSize:13,color:RED,display:"flex",gap:8}}><span>⚠</span><span>{a}</span></div>)}

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
        <div style={{background:"var(--surface2)",borderRadius:12,padding:"12px 16px"}}><div style={{fontSize:9,color:"var(--text3)",textTransform:"uppercase",letterSpacing:1}}>Due</div><div style={{fontSize:16,fontWeight:700,marginTop:2}}>{fmtDate(dress.dueDate)}</div></div>
        <div style={{background:"var(--surface2)",borderRadius:12,padding:"12px 16px"}}><div style={{fontSize:9,color:"var(--text3)",textTransform:"uppercase",letterSpacing:1}}>Countdown</div><div style={{fontSize:16,fontWeight:800,color:d<0?RED:d<14?AMBER:GREEN,marginTop:2}}>{d<0?`${Math.abs(d)}d LATE`:`${d}d`}</div></div>
      </div>

      <div style={{background:"var(--surface2)",borderRadius:12,padding:"14px 16px",marginBottom:16}}>
        <Lbl>Production ({done}/{dress.milestones.length})</Lbl>
        <div style={{display:"flex",gap:4,marginTop:8}}>
          {dress.milestones.map((m,i)=><div key={i} onClick={()=>toggleMs(i)} style={{flex:1,cursor:"pointer",textAlign:"center"}}><div style={{height:4,borderRadius:2,background:m.done?GREEN:"rgba(0,0,0,0.08)",marginBottom:6,transition:"background 0.2s"}}/><div style={{fontSize:9,color:m.done?GREEN:"var(--text3)",fontWeight:600,lineHeight:1.2}}>{m.label}</div></div>)}
        </div>
      </div>

      <div style={{background:"var(--surface2)",borderRadius:12,padding:"14px 16px",marginBottom:16}}>
        <Lbl>Size Breakdown</Lbl>
        <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:6,marginTop:6}}>
          {SIZES.map(s=><div key={s} style={{textAlign:"center",background:"var(--surface)",borderRadius:8,padding:"6px 2px",border:"1px solid var(--border)"}}><div style={{fontSize:9,color:GOLD,fontWeight:700}}>{s}</div><div style={{fontSize:18,fontWeight:700,fontFamily:"var(--font-display)"}}>{dress.quantities[s]}</div></div>)}
        </div>
        <div style={{marginTop:8,color:GOLD,fontSize:12,fontWeight:700}}>Total: {sum(dress.quantities)} units</div>
      </div>

      <div style={{marginBottom:16}}><Lbl>Update Status</Lbl><div style={{display:"flex",gap:5,flexWrap:"wrap"}}>{STATUSES.filter(s=>s!=="draft").map(s=><Chip key={s} active={dress.status===s} onClick={()=>setStatus(s)} color={STATUS[s].color}>{STATUS[s].label}</Chip>)}</div></div>

      <div style={{marginBottom:16}}>
        <Lbl>Timeline ({dress.timeline.length})</Lbl>
        <div style={{display:"flex",flexDirection:"column",gap:4,maxHeight:280,overflowY:"auto",marginTop:6}}>
          {[...dress.timeline].reverse().map(e=>{
            const ic=e.type==="alert"?"⚠":e.type==="whatsapp"?"💬":e.type==="email"?"📧":e.type==="image"?"📷":e.type==="shipping"?"📦":"◆";
            const icC=e.type==="alert"?RED:e.type==="whatsapp"?"#25d366":e.type==="email"?BLUE:e.type==="shipping"?AMBER:e.type==="comment"?GOLD:"var(--text3)";
            return (
              <div key={e.id} style={{display:"flex",gap:10,padding:"8px 0",borderBottom:"1px solid var(--border)"}}>
                <div style={{width:24,height:24,borderRadius:"50%",background:icC+"14",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,flexShrink:0}}>{ic}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,color:"var(--text)",lineHeight:1.4}}>{e.content}</div>
                  {e.imageUrl&&<img src={e.imageUrl} alt="" style={{marginTop:6,maxWidth:"100%",maxHeight:100,borderRadius:8,objectFit:"cover"}}/>}
                  <div style={{fontSize:10,color:"var(--text3)",marginTop:3}}>{fmtDate(e.date)} {e.time} · <span style={{color:icC}}>{e.source}</span> · {e.user}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div><Lbl>Add to Timeline</Lbl><Txa value={comment} onChange={e=>setComment(e.target.value)} rows={3} placeholder="Add a note..."/>{img&&<img src={img} alt="" style={{maxHeight:60,marginTop:8,borderRadius:6}}/>}<div style={{display:"flex",gap:8,marginTop:8}}><BtnGhost small onClick={()=>fileRef.current.click()}>📎 Attach</BtnGhost><BtnGold small onClick={addEntry} style={{flex:1}}>Add Entry</BtnGold></div><input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>{const f=e.target.files[0];if(f)setImg(URL.createObjectURL(f));}}/></div>
    </Overlay>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   NEW PO MODAL
   ═══════════════════════════════════════════════════════════════════════════ */
const NewPOModal = ({onClose,onCreate,nextPO}) => {
  const [form,setForm]=useState({name:"",collectionId:COLLECTIONS[0].id,manufacturerId:MFRS[0].id,dueDate:"",imageUrl:"",quantities:{XS:0,S:0,M:0,L:0,XL:0,XXL:0}});
  const [preview,setPreview]=useState(null); const fileRef=useRef();
  const set=(k,v)=>setForm(f=>({...f,[k]:v})); const setQ=(s,v)=>setForm(f=>({...f,quantities:{...f.quantities,[s]:parseInt(v)||0}}));
  const mfr=MFRS.find(m=>m.id===form.manufacturerId);
  const submit=()=>{ if(!form.name||!form.dueDate)return alert("Enter dress name and due date"); onCreate(form); onClose(); };
  return (
    <Overlay onClose={onClose}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}><div><div style={{fontFamily:"var(--font-display)",fontSize:24,fontWeight:600}}>New Purchase Order</div><div style={{fontSize:12,color:"var(--text3)",marginTop:2}}>{nextPO}</div></div><button onClick={onClose} style={{color:"var(--text3)",fontSize:24}}>×</button></div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
        <div style={{gridColumn:"1/-1"}}><Lbl>Dress Name</Lbl><Inp value={form.name} onChange={e=>set("name",e.target.value)} placeholder="e.g. Florentine Wrap"/></div>
        <div><Lbl>Collection</Lbl><Sel value={form.collectionId} onChange={e=>set("collectionId",e.target.value)}>{COLLECTIONS.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</Sel></div>
        <div><Lbl>Manufacturer</Lbl><Sel value={form.manufacturerId} onChange={e=>set("manufacturerId",e.target.value)}>{MFRS.map(m=><option key={m.id} value={m.id}>{m.name} ({m.country})</option>)}</Sel></div>
        <div style={{gridColumn:"1/-1"}}><Lbl>Due Date</Lbl><Inp type="date" value={form.dueDate} onChange={e=>set("dueDate",e.target.value)}/></div>
      </div>
      {mfr&&<div style={{background:"var(--gold-bg)",border:`1px solid ${GOLD}22`,borderRadius:10,padding:"9px 14px",fontSize:12,color:GOLD,marginBottom:14}}>🚢 {mfr.name} ({mfr.country}) — Sea: ~{mfr.seaWeeks}wk · Air: {mfr.airDays}d</div>}
      <div style={{marginBottom:14}}><Lbl>Design Image</Lbl><div onClick={()=>fileRef.current.click()} style={{border:"2px dashed var(--border2)",borderRadius:12,padding:16,textAlign:"center",cursor:"pointer"}}>{preview?<img src={preview} alt="" style={{maxHeight:140,borderRadius:8,objectFit:"cover",margin:"0 auto"}}/>:<div style={{color:"var(--text3)"}}><div style={{fontSize:24,marginBottom:4}}>📷</div><div style={{fontSize:12}}>Upload image</div></div>}</div><input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>{const f=e.target.files[0];if(f){setPreview(URL.createObjectURL(f));set("imageUrl",URL.createObjectURL(f));}}}/><Inp value={form.imageUrl} onChange={e=>{set("imageUrl",e.target.value);setPreview(e.target.value);}} placeholder="or paste URL" style={{marginTop:8,fontSize:12}}/></div>
      <div style={{marginBottom:20}}><Lbl>Quantities</Lbl><div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:8}}>{SIZES.map(s=><div key={s}><div style={{fontSize:10,color:GOLD,textAlign:"center",fontWeight:700,marginBottom:3}}>{s}</div><Inp type="number" min="0" value={form.quantities[s]} onChange={e=>setQ(s,e.target.value)} style={{textAlign:"center",padding:"8px 2px"}}/></div>)}</div><div style={{marginTop:8,color:GOLD,fontSize:12,fontWeight:700}}>Total: {sum(form.quantities)} units</div></div>
      <div style={{display:"flex",gap:10}}><BtnGhost onClick={onClose} style={{flex:1}}>Cancel</BtnGhost><BtnGold onClick={submit} style={{flex:2}}>Submit PO</BtnGold></div>
    </Overlay>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   SHIPMENT DETAIL POPUP
   ═══════════════════════════════════════════════════════════════════════════ */
const ShipmentDetail = ({ship,onClose,dresses,onStatusChange}) => {
  const mfr=MFRS.find(m=>m.id===ship.mfrId);
  const linked=dresses.filter(d=>ship.dressIds.includes(d.id));
  const eta=ship.eta?daysUntil(ship.eta):null;
  const updates=ship.updates||[];

  return (
    <Overlay onClose={onClose}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
        <div>
          <div style={{fontSize:10,color:GOLD,letterSpacing:2,fontWeight:700}}>{ship.id}</div>
          <div style={{fontFamily:"var(--font-display)",fontSize:24,fontWeight:600,marginTop:2}}>{ship.carrier}</div>
          <div style={{fontSize:12,color:"var(--text3)",marginTop:4}}>{mfr?.name} · {ship.method==="air"?"✈ Air Freight":"🚢 Sea Freight"}</div>
        </div>
        <button onClick={onClose} style={{color:"var(--text3)",fontSize:22}}>×</button>
      </div>

      {/* Key info */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:16}}>
        <div style={{background:"var(--surface2)",borderRadius:10,padding:"10px 14px"}}><div style={{fontSize:9,color:"var(--text3)",textTransform:"uppercase",letterSpacing:1}}>Tracking</div><div style={{fontSize:13,fontWeight:700,marginTop:2,wordBreak:"break-all"}}>{ship.trackingNo||"—"}</div></div>
        <div style={{background:"var(--surface2)",borderRadius:10,padding:"10px 14px"}}><div style={{fontSize:9,color:"var(--text3)",textTransform:"uppercase",letterSpacing:1}}>ETA</div><div style={{fontSize:13,fontWeight:700,marginTop:2}}>{ship.eta?fmtDate(ship.eta):"—"}</div></div>
        <div style={{background:"var(--surface2)",borderRadius:10,padding:"10px 14px"}}><div style={{fontSize:9,color:"var(--text3)",textTransform:"uppercase",letterSpacing:1}}>Units</div><div style={{fontSize:13,fontWeight:700,marginTop:2}}>{ship.units}u</div></div>
      </div>

      {eta!==null&&<div style={{fontSize:14,fontWeight:700,color:eta<0?RED:eta<7?AMBER:GREEN,marginBottom:16,textAlign:"center",background:eta<0?"var(--red-bg)":eta<7?"var(--amber-bg)":"var(--green-bg)",borderRadius:10,padding:"10px 14px"}}>{eta<0?`${Math.abs(eta)} days overdue`:`${eta} days until arrival`}</div>}

      {/* Linked dresses with images */}
      {linked.length>0&&(
        <div style={{marginBottom:16}}>
          <Lbl>Dresses in this Shipment</Lbl>
          <div style={{display:"flex",flexDirection:"column",gap:6,marginTop:6}}>
            {linked.map(d=>(
              <div key={d.id} style={{display:"flex",gap:10,alignItems:"center",background:"var(--surface2)",borderRadius:10,padding:"8px 12px"}}>
                {d.imageUrl&&<img src={d.imageUrl} alt="" style={{width:36,height:44,objectFit:"cover",borderRadius:6}}/>}
                <div style={{flex:1}}>
                  <div style={{fontWeight:600,fontSize:13}}>{d.name}</div>
                  <div style={{fontSize:10,color:"var(--text3)"}}>{d.poNumber} · {sum(d.quantities)}u</div>
                </div>
                <Badge status={d.status} small/>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status */}
      <div style={{marginBottom:16}}>
        <Lbl>Status</Lbl>
        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
          {["Awaiting Pickup","In Transit","Customs","Delayed","Delivered"].map(st=>(
            <Chip key={st} active={ship.status===st} onClick={()=>onStatusChange(ship.id,st)} color={st==="Delayed"?RED:st==="Delivered"?GREEN:undefined}>{st}</Chip>
          ))}
        </div>
      </div>

      {/* Tracking & email updates timeline */}
      <div>
        <Lbl>Tracking & Email Updates ({updates.length})</Lbl>
        <div style={{display:"flex",flexDirection:"column",gap:4,marginTop:6}}>
          {[...updates].reverse().map((u,i)=>(
            <div key={i} style={{display:"flex",gap:10,padding:"8px 0",borderBottom:"1px solid var(--border)"}}>
              <div style={{width:24,height:24,borderRadius:"50%",background:u.type==="email"?BLUE+"14":GREEN+"14",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,flexShrink:0}}>{u.type==="email"?"📧":"📍"}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:13,lineHeight:1.4}}>{u.content}</div>
                <div style={{fontSize:10,color:"var(--text3)",marginTop:2}}>{fmtDate(u.date)} {u.time}{u.from?` · ${u.from}`:""}</div>
              </div>
            </div>
          ))}
          {updates.length===0&&<div style={{color:"var(--text3)",fontSize:12,padding:16,textAlign:"center"}}>No updates yet</div>}
        </div>
      </div>
    </Overlay>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   HOME
   ═══════════════════════════════════════════════════════════════════════════ */
const HomeView = ({dresses,messages,shipments,user,setTab,setColFilter}) => {
  const delayed=dresses.filter(d=>d.status==="delayed");
  const needsReview=messages.filter(m=>m.needsReview&&!m.resolved).length;
  const urgent=dresses.filter(d=>{const dd=daysUntil(d.dueDate);return dd>=0&&dd<21&&!["received","cancelled"].includes(d.status);});

  return (
    <div className="fade-up">
      <div style={{marginBottom:28}}>
        <div style={{fontSize:10,color:"var(--text3)",letterSpacing:2,textTransform:"uppercase",marginBottom:8}}>{new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}</div>
        <div style={{fontFamily:"var(--font-display)",fontSize:28,fontWeight:600,lineHeight:1.2}}>Good {new Date().getHours()<12?"morning":"afternoon"},<br/>{user.name.split(" ")[0]}</div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:28}}>
        {[{l:"Active POs",v:dresses.filter(d=>!["cancelled","received"].includes(d.status)).length,c:"var(--text)"},{l:"Delayed",v:delayed.length,c:delayed.length>0?RED:GREEN},{l:"Needs Review",v:needsReview,c:needsReview>0?AMBER:"var(--text)"},{l:"Shipments",v:shipments.length,c:"var(--text)"}].map(({l,v,c})=>(
          <div key={l} style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:14,padding:"14px 16px",boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
            <div style={{fontSize:10,color:"var(--text3)",textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>{l}</div>
            <div style={{fontSize:28,fontWeight:800,color:c,fontFamily:"var(--font-display)"}}>{v}</div>
          </div>
        ))}
      </div>

      <div style={{marginBottom:28}}><Lbl>Collections</Lbl><div style={{display:"flex",flexDirection:"column",gap:10,marginTop:8}}>
        {COLLECTIONS.map(col=>{
          const cd=dresses.filter(d=>d.collectionId===col.id); const onTrack=cd.filter(d=>["ontrack","received","shipped"].includes(d.status)).length; const dl=cd.filter(d=>d.status==="delayed").length; const empty=col.slots-cd.length;
          return (
            <Card key={col.id} onClick={()=>{setColFilter(col.id);setTab("dresses");}} style={{padding:14}}>
              <div style={{display:"flex",alignItems:"center",gap:14}}>
                <div style={{position:"relative",flexShrink:0}}><Ring value={onTrack} total={col.slots} color={col.color} size={56} stroke={4}/><div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:15,fontWeight:800,lineHeight:1}}>{onTrack}</span><span style={{fontSize:8,color:"var(--text3)"}}>/{col.slots}</span></div></div>
                <div style={{flex:1}}>
                  <div style={{fontFamily:"var(--font-display)",fontSize:16,fontWeight:600}}>{col.name}</div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:6}}>
                    {dl>0&&<span style={{fontSize:9,color:RED,background:"var(--red-bg)",borderRadius:20,padding:"1px 8px",fontWeight:600}}>⚠ {dl} delayed</span>}
                    {empty>0&&<span style={{fontSize:9,color:MUTED,background:"var(--surface2)",borderRadius:20,padding:"1px 8px"}}>{empty} empty</span>}
                    {dl===0&&empty===0&&<span style={{fontSize:9,color:GREEN,background:"var(--green-bg)",borderRadius:20,padding:"1px 8px"}}>✓ Full</span>}
                  </div>
                </div>
                <div style={{color:"var(--border2)",fontSize:18}}>›</div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(12,1fr)",gap:3,marginTop:10}}>
                {Array.from({length:col.slots},(_,i)=>{const d=cd[i];const c=d?(STATUS[d.status]?.color||MUTED):"rgba(0,0,0,0.06)";return <div key={i} style={{height:5,borderRadius:3,background:c}}/>;})}</div>
            </Card>
          );
        })}
      </div></div>

      {urgent.length>0&&<div style={{marginBottom:28}}><Lbl>⚠ Due Within 21 Days</Lbl><div style={{display:"flex",flexDirection:"column",gap:8,marginTop:8}}>
        {urgent.slice(0,5).map(dress=>{const dd=daysUntil(dress.dueDate);return (
          <Card key={dress.id} style={{padding:"10px 14px",borderLeft:`3px solid ${dd<7?RED:AMBER}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{display:"flex",gap:10,alignItems:"center"}}>{dress.imageUrl&&<img src={dress.imageUrl} alt="" style={{width:36,height:44,objectFit:"cover",borderRadius:6}}/>}<div><div style={{fontWeight:600,fontSize:13}}>{dress.name}</div><div style={{fontSize:10,color:"var(--text3)"}}>{dress.poNumber}</div></div></div>
              <div style={{textAlign:"right"}}><Badge status={dress.status} small/><div style={{fontSize:11,color:dd<7?RED:AMBER,fontWeight:700,marginTop:3}}>{dd}d</div></div>
            </div>
          </Card>
        );})}
      </div></div>}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   DRESSES VIEW
   ═══════════════════════════════════════════════════════════════════════════ */
const DressesView = ({dresses,setDresses,user,initCol}) => {
  const [showNew,setShowNew]=useState(false); const [sel,setSel]=useState(null);
  const [fCol,setFCol]=useState(initCol||"all"); const [fSt,setFSt]=useState("all");
  useEffect(()=>{if(initCol)setFCol(initCol);},[initCol]);
  const filtered=dresses.filter(d=>(fCol==="all"||d.collectionId===fCol)&&(fSt==="all"||d.status===fSt));
  const nextPO=`PO-${String(dresses.length+1).padStart(3,"0")}`;
  const handleCreate=form=>{const np={id:uid(),poNumber:nextPO,name:form.name,collectionId:form.collectionId,manufacturerId:form.manufacturerId,status:"submitted",dueDate:form.dueDate,orderDate:nowISO(),quantities:form.quantities,imageUrl:form.imageUrl,milestones:[{label:"Fabric Sourced",done:false},{label:"Cutting",done:false},{label:"Sewing",done:false},{label:"QC Passed",done:false},{label:"Dispatched",done:false}],timeline:[{id:uid(),date:nowISO(),time:nowTime(),type:"system",source:"PO Created",content:`PO ${nextPO} submitted`,user:user.name,category:"design"}],alerts:[]};setDresses(p=>[...p,np]);};
  const handleUpdate=u=>{setDresses(p=>p.map(d=>d.id===u.id?u:d));setSel(u);};

  return (
    <div className="fade-up">
      {showNew&&<NewPOModal onClose={()=>setShowNew(false)} onCreate={handleCreate} nextPO={nextPO}/>}
      {sel&&<DressDetail dress={sel} onClose={()=>setSel(null)} onUpdate={handleUpdate} user={user}/>}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div style={{fontFamily:"var(--font-display)",fontSize:26,fontWeight:600}}>Dresses</div>
        {["admin","design"].includes(user.role)&&<BtnGold small onClick={()=>setShowNew(true)}>+ New PO</BtnGold>}
      </div>
      <div style={{overflowX:"auto",display:"flex",gap:6,paddingBottom:8,marginBottom:10,WebkitOverflowScrolling:"touch"}}><Chip active={fCol==="all"} onClick={()=>setFCol("all")}>All</Chip>{COLLECTIONS.map(c=><Chip key={c.id} active={fCol===c.id} onClick={()=>setFCol(c.id)} color={c.color}>{c.shortName}</Chip>)}</div>
      <div style={{overflowX:"auto",display:"flex",gap:6,paddingBottom:8,marginBottom:18,WebkitOverflowScrolling:"touch"}}><Chip active={fSt==="all"} onClick={()=>setFSt("all")}>All Status</Chip>{STATUSES.map(s=><Chip key={s} active={fSt===s} onClick={()=>setFSt(s)} color={STATUS[s].color}>{STATUS[s].label}</Chip>)}</div>

      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {filtered.map(dress=>{const dd=daysUntil(dress.dueDate);const mfr=MFRS.find(m=>m.id===dress.manufacturerId);const col=COLLECTIONS.find(c=>c.id===dress.collectionId);const done=dress.milestones.filter(m=>m.done).length;
          return (
            <Card key={dress.id} onClick={()=>setSel(dress)} alert={dress.alerts.length>0} style={{padding:0}}>
              <div style={{display:"flex"}}>
                <div style={{width:72,minHeight:88,flexShrink:0,background:"var(--surface2)",position:"relative"}}>
                  {dress.imageUrl?<img src={dress.imageUrl} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--text3)",fontSize:20}}>📷</div>}
                  {dress.alerts.length>0&&<div style={{position:"absolute",top:4,left:4,width:18,height:18,borderRadius:"50%",background:RED,color:"#fff",fontSize:10,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>!</div>}
                </div>
                <div style={{flex:1,padding:"10px 14px 10px 12px",display:"flex",flexDirection:"column",justifyContent:"center",minWidth:0}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
                    <div style={{minWidth:0}}><div style={{fontSize:9,color:GOLD,letterSpacing:1,fontWeight:700}}>{dress.poNumber}</div><div style={{fontWeight:700,fontSize:14,lineHeight:1.2,marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{dress.name}</div><div style={{fontSize:10,color:"var(--text3)",marginTop:2}}>{mfr?.name} · {col?.shortName}</div></div>
                    <Badge status={dress.status} small/>
                  </div>
                  <div style={{display:"flex",gap:12,marginTop:8}}><span style={{fontSize:10,color:dd<0?RED:dd<14?AMBER:GREEN,fontWeight:700}}>{dd<0?`${Math.abs(dd)}d late`:`${dd}d`}</span><span style={{fontSize:10,color:"var(--text3)"}}>{sum(dress.quantities)}u</span><span style={{fontSize:10,color:"var(--text3)"}}>{done}/{dress.milestones.length} ✓</span><span style={{fontSize:10,color:"var(--text3)"}}>{dress.timeline.length} entries</span></div>
                </div>
              </div>
            </Card>
          );
        })}
        {filtered.length===0&&<div style={{textAlign:"center",color:"var(--text3)",padding:40,fontSize:13}}>No dresses match filters</div>}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   INBOX — with design / shipping toggle
   ═══════════════════════════════════════════════════════════════════════════ */
const InboxView = ({messages,setMessages,dresses,setDresses,user}) => {
  const [sel,setSel]=useState(null); const [compose,setCompose]=useState(false);
  const [newMsg,setNewMsg]=useState({to:"",channel:"whatsapp",body:"",linkedDressIds:[]});
  const [filter,setFilter]=useState("all"); // "all" | "design" | "shipping"
  const fileRef=useRef();
  const unread=messages.filter(m=>!m.read).length;
  const reviewQueue=messages.filter(m=>m.needsReview&&!m.resolved);

  const markRead=id=>setMessages(p=>p.map(m=>m.id===id?{...m,read:true}:m));
  const toggleD=id=>setNewMsg(f=>({...f,linkedDressIds:f.linkedDressIds.includes(id)?f.linkedDressIds.filter(x=>x!==id):[...f.linkedDressIds,id]}));

  const send=()=>{const msg={id:uid(),from:`You (${user.name})`,channel:newMsg.channel,content:newMsg.body,date:nowISO(),time:nowTime(),read:true,linkedDressIds:newMsg.linkedDressIds,needsReview:false,resolved:true,category:"design"};newMsg.linkedDressIds.forEach(dId=>{setDresses(prev=>prev.map(d=>{if(d.id!==dId)return d;return{...d,timeline:[...d.timeline,{id:uid(),date:nowISO(),time:nowTime(),type:newMsg.channel,source:`Outgoing ${newMsg.channel}`,content:newMsg.body.slice(0,200),user:user.name,category:"design"}]};}));});setMessages(p=>[msg,...p]);setCompose(false);setNewMsg({to:"",channel:"whatsapp",body:"",linkedDressIds:[]});};

  const linkAndApprove=(msg,dressId)=>{setDresses(prev=>prev.map(d=>{if(d.id!==dressId)return d;const exists=d.timeline.some(t=>t.content&&t.content.includes(msg.content.slice(0,30)));if(exists)return d;return{...d,timeline:[...d.timeline,{id:uid(),date:msg.date,time:msg.time,type:msg.channel,source:`${msg.channel==="whatsapp"?"WhatsApp":"Email"} from ${msg.from}`,content:msg.content,user:msg.from,category:msg.category||"design"}]};}));setMessages(prev=>prev.map(m=>m.id===msg.id?{...m,needsReview:false,resolved:true,linkedDressIds:[...(m.linkedDressIds||[]),dressId]}:m));};

  const filteredMsgs = messages.filter(m => {
    if (m.needsReview && !m.resolved) return false; // shown in triage
    if (filter === "all") return true;
    return (m.category || "design") === filter;
  });

  return (
    <div className="fade-up">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div style={{fontFamily:"var(--font-display)",fontSize:26,fontWeight:600}}>Inbox {unread>0&&<span style={{fontSize:14,color:AMBER,fontFamily:"var(--font-body)"}}>({unread})</span>}</div>
        <BtnGold small onClick={()=>setCompose(true)}>+ Compose</BtnGold>
      </div>

      {/* TOGGLE: Design / Shipping */}
      <div style={{display:"flex",gap:4,marginBottom:16,background:"var(--surface2)",borderRadius:10,padding:3}}>
        <ToggleBtn active={filter==="all"} onClick={()=>setFilter("all")}>All</ToggleBtn>
        <ToggleBtn active={filter==="design"} onClick={()=>setFilter("design")}>Design</ToggleBtn>
        <ToggleBtn active={filter==="shipping"} onClick={()=>setFilter("shipping")}>Shipping</ToggleBtn>
      </div>

      {/* Triage */}
      {reviewQueue.length>0&&<div style={{marginBottom:20}}><Lbl>⚠ Needs Review — Link to a Dress</Lbl><div style={{display:"flex",flexDirection:"column",gap:8,marginTop:8}}>
        {reviewQueue.map(msg=>(
          <Card key={msg.id} alert style={{padding:14}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><div><div style={{fontWeight:700,fontSize:13}}>{msg.from}</div><div style={{fontSize:10,color:"var(--text3)"}}>{msg.date} · {msg.channel}</div></div><span style={{fontSize:9,background:"var(--amber-bg)",color:AMBER,borderRadius:20,padding:"2px 10px",fontWeight:700}}>⚠ REVIEW</span></div>
            <div style={{fontSize:13,color:"var(--text2)",marginBottom:10,lineHeight:1.4}}>{msg.content}</div>
            <Lbl>Link to dress:</Lbl>
            <div style={{display:"flex",flexWrap:"wrap",gap:5}}>{dresses.slice(0,12).map(d=>(
              <button key={d.id} onClick={()=>linkAndApprove(msg,d.id)} style={{background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:8,padding:"4px 10px",fontSize:10,color:"var(--text)",display:"flex",alignItems:"center",gap:6}}>
                {d.imageUrl&&<img src={d.imageUrl} alt="" style={{width:18,height:22,objectFit:"cover",borderRadius:3}}/>}<span>{d.poNumber} {d.name}</span>
              </button>
            ))}</div>
          </Card>
        ))}
      </div></div>}

      {compose&&<Card style={{padding:18,marginBottom:16}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}><div style={{fontWeight:700,fontSize:15}}>New Message</div><button onClick={()=>setCompose(false)} style={{color:"var(--text3)",fontSize:18}}>×</button></div><div style={{display:"flex",flexDirection:"column",gap:10}}><Sel value={newMsg.channel} onChange={e=>setNewMsg(f=>({...f,channel:e.target.value}))}><option value="whatsapp">💬 WhatsApp</option><option value="email">📧 Email</option></Sel><Inp value={newMsg.to} onChange={e=>setNewMsg(f=>({...f,to:e.target.value}))} placeholder="Recipient"/><div><Lbl>Link Dresses</Lbl><div style={{display:"flex",flexWrap:"wrap",gap:5}}>{dresses.slice(0,8).map(d=><Chip key={d.id} active={newMsg.linkedDressIds.includes(d.id)} onClick={()=>toggleD(d.id)}>{d.poNumber}</Chip>)}</div></div><Txa value={newMsg.body} onChange={e=>setNewMsg(f=>({...f,body:e.target.value}))} rows={4} placeholder="Type message..."/><BtnGold small onClick={send} disabled={!newMsg.body} style={{width:"100%"}}>Send</BtnGold></div></Card>}

      {sel?(
        <div><button onClick={()=>setSel(null)} style={{color:GOLD,fontSize:13,marginBottom:12,padding:0}}>← Back</button>
          <Card style={{padding:18}}>
            <div style={{fontWeight:700,fontSize:16,marginBottom:4}}>{sel.from}</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:6}}>
              <span style={{fontSize:10,background:sel.channel==="whatsapp"?"#25d36614":BLUE+"14",color:sel.channel==="whatsapp"?"#25d366":BLUE,borderRadius:20,padding:"2px 10px"}}>{sel.channel==="whatsapp"?"💬 WhatsApp":"📧 Email"}</span>
              <span style={{fontSize:10,background:(sel.category||"design")==="shipping"?AMBER+"14":GOLD+"14",color:(sel.category||"design")==="shipping"?AMBER:GOLD,borderRadius:20,padding:"2px 10px"}}>{(sel.category||"design")==="shipping"?"📦 Shipping":"🎨 Design"}</span>
              {sel.linkedDressIds?.map(id=>{const d=dresses.find(x=>x.id===id);return d?<span key={id} style={{fontSize:10,background:GOLD+"14",color:GOLD,borderRadius:20,padding:"2px 10px"}}>{d.poNumber}</span>:null;})}
            </div>
            <div style={{fontSize:11,color:"var(--text3)",marginBottom:12}}>{sel.date} · {sel.time}</div>
            <div style={{background:"var(--surface2)",borderRadius:10,padding:14,fontSize:14,lineHeight:1.6}}>{sel.content}</div>
          </Card>
        </div>
      ):(
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {filteredMsgs.map(m=>(
            <Card key={m.id} onClick={()=>{setSel(m);markRead(m.id);}} style={{padding:"10px 14px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{fontWeight:m.read?400:700,fontSize:13}}>{m.from}</div>
                <div style={{display:"flex",gap:6,alignItems:"center"}}>
                  <span style={{fontSize:9,background:(m.category||"design")==="shipping"?AMBER+"14":GOLD+"14",color:(m.category||"design")==="shipping"?AMBER:GOLD,borderRadius:20,padding:"1px 7px"}}>{(m.category||"design")==="shipping"?"📦":"🎨"}</span>
                  <span style={{fontSize:10,color:"var(--text3)"}}>{m.time}</span>
                </div>
              </div>
              <div style={{fontSize:12,color:"var(--text3)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginTop:2}}>{m.content}</div>
              <div style={{display:"flex",gap:5,marginTop:5,flexWrap:"wrap"}}>
                <span style={{fontSize:9,background:m.channel==="whatsapp"?"#25d36614":BLUE+"14",color:m.channel==="whatsapp"?"#25d366":BLUE,borderRadius:20,padding:"1px 7px"}}>{m.channel}</span>
                {m.linkedDressIds?.map(id=>{const d=dresses.find(x=>x.id===id);return d?<span key={id} style={{fontSize:9,background:GOLD+"14",color:GOLD,borderRadius:20,padding:"1px 7px"}}>{d.poNumber}</span>:null;})}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   SHIPMENTS VIEW — clickable with detail popup + delay cascade
   ═══════════════════════════════════════════════════════════════════════════ */
const ShipmentsView = ({shipments,setShipments,dresses,setDresses}) => {
  const [showAdd,setShowAdd]=useState(false);
  const [selShip,setSelShip]=useState(null);
  const [form,setForm]=useState({dressIds:[],carrier:"",trackingNo:"",eta:"",method:"sea",mfrId:MFRS[0].id});
  const set=(k,v)=>setForm(f=>({...f,[k]:v})); const mfr=MFRS.find(m=>m.id===form.mfrId);
  const toggleD=id=>setForm(f=>({...f,dressIds:f.dressIds.includes(id)?f.dressIds.filter(x=>x!==id):[...f.dressIds,id]}));
  const addShip=()=>{const units=form.dressIds.reduce((a,id)=>{const d=dresses.find(x=>x.id===id);return a+(d?sum(d.quantities):0);},0);setShipments(s=>[...s,{id:`SHP-${String(s.length+1).padStart(3,"0")}`,units,...form,status:"Awaiting Pickup",lastUpdate:"Shipment created",updates:[{date:nowISO(),time:nowTime(),type:"tracking",content:"Shipment created and awaiting pickup"}]}]);setShowAdd(false);};

  // DELAY CASCADE: When shipment status changes to "Delayed", update all linked dresses
  const handleStatusChange = (shipId, newStatus) => {
    setShipments(p => p.map(s => {
      if (s.id !== shipId) return s;
      const updated = { ...s, status: newStatus, lastUpdate: `Status updated to ${newStatus}`, updates: [...(s.updates||[]), { date: nowISO(), time: nowTime(), type: "tracking", content: `Shipment status changed to ${newStatus}` }] };
      return updated;
    }));

    // If delayed, cascade to all linked dresses
    const ship = shipments.find(s => s.id === shipId);
    if (newStatus === "Delayed" && ship) {
      ship.dressIds.forEach(dId => {
        setDresses(prev => prev.map(d => {
          if (d.id !== dId) return d;
          const alreadyDelayed = d.status === "delayed";
          const alertMsg = `Shipment ${ship.id} (${ship.carrier}) marked as delayed`;
          const hasAlert = d.alerts.includes(alertMsg);
          return {
            ...d,
            status: "delayed",
            alerts: hasAlert ? d.alerts : [...d.alerts, alertMsg],
            timeline: [...d.timeline, {
              id: uid(), date: nowISO(), time: nowTime(), type: "shipping",
              source: `Shipment ${ship.id} Delay`, 
              content: `⚠ Shipment ${ship.id} (${ship.carrier}) has been marked as delayed${!alreadyDelayed ? " — dress status updated to Delayed" : ""}`,
              user: "System", category: "shipping"
            }],
          };
        }));
      });
    }

    // If delivered, update linked dresses to received
    if (newStatus === "Delivered" && ship) {
      ship.dressIds.forEach(dId => {
        setDresses(prev => prev.map(d => {
          if (d.id !== dId) return d;
          return {
            ...d, status: "received",
            timeline: [...d.timeline, { id: uid(), date: nowISO(), time: nowTime(), type: "shipping", source: `Shipment ${ship.id} Delivered`, content: `Shipment ${ship.id} delivered — dress marked as received`, user: "System", category: "shipping" }],
          };
        }));
      });
    }

    // Update the selected shipment view
    if (selShip && selShip.id === shipId) {
      setSelShip(prev => ({ ...prev, status: newStatus, lastUpdate: `Status updated to ${newStatus}`, updates: [...(prev.updates||[]), { date: nowISO(), time: nowTime(), type: "tracking", content: `Shipment status changed to ${newStatus}` }] }));
    }
  };

  return (
    <div className="fade-up">
      {selShip && <ShipmentDetail ship={selShip} onClose={()=>setSelShip(null)} dresses={dresses} onStatusChange={handleStatusChange} />}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div style={{fontFamily:"var(--font-display)",fontSize:26,fontWeight:600}}>Shipments</div>
        <BtnGold small onClick={()=>setShowAdd(!showAdd)}>+ Track</BtnGold>
      </div>

      <Card style={{padding:"12px 16px",marginBottom:16}}><Lbl>Transit Times</Lbl>{MFRS.map(m=><div key={m.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 0"}}><span style={{fontSize:13,fontWeight:600}}>{m.name} <span style={{color:"var(--text3)",fontWeight:400}}>({m.country})</span></span><div style={{display:"flex",gap:6}}><span style={{fontSize:10,color:BLUE,background:"var(--blue-bg)",borderRadius:20,padding:"2px 9px"}}>✈ {m.airDays}d</span><span style={{fontSize:10,color:"var(--text2)",background:"var(--surface2)",borderRadius:20,padding:"2px 9px"}}>🚢 {m.seaWeeks}w</span></div></div>)}</Card>

      {showAdd&&<Card style={{padding:18,marginBottom:16}}><div style={{fontWeight:700,fontSize:15,marginBottom:14}}>New Shipment</div><div style={{display:"flex",flexDirection:"column",gap:10}}><div><Lbl>Manufacturer</Lbl><Sel value={form.mfrId} onChange={e=>set("mfrId",e.target.value)}>{MFRS.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</Sel></div>{mfr&&<div style={{background:"var(--gold-bg)",border:`1px solid ${GOLD}22`,borderRadius:10,padding:"8px 12px",fontSize:12,color:GOLD}}>✈ Air: {mfr.airDays}d · 🚢 Sea: {mfr.seaWeeks}w from {mfr.country}</div>}<div><Lbl>Link Dresses</Lbl><div style={{display:"flex",flexWrap:"wrap",gap:5}}>{dresses.filter(d=>d.manufacturerId===form.mfrId).map(d=><Chip key={d.id} active={form.dressIds.includes(d.id)} onClick={()=>toggleD(d.id)}>{d.poNumber}</Chip>)}</div></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><div><Lbl>Carrier</Lbl><Inp value={form.carrier} onChange={e=>set("carrier",e.target.value)} placeholder="DHL, Maersk..."/></div><div><Lbl>Tracking #</Lbl><Inp value={form.trackingNo} onChange={e=>set("trackingNo",e.target.value)}/></div><div><Lbl>Method</Lbl><Sel value={form.method} onChange={e=>set("method",e.target.value)}><option value="sea">🚢 Sea</option><option value="air">✈ Air</option></Sel></div><div><Lbl>ETA</Lbl><Inp type="date" value={form.eta} onChange={e=>set("eta",e.target.value)}/></div></div><BtnGold onClick={addShip}>Add Shipment</BtnGold></div></Card>}

      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {shipments.map(s=>{
          const linked=dresses.filter(d=>s.dressIds.includes(d.id));
          const eta=s.eta?daysUntil(s.eta):null;
          const m=MFRS.find(x=>x.id===s.mfrId);
          const isDelayed=s.status==="Delayed";
          return (
            <Card key={s.id} onClick={()=>setSelShip(s)} alert={isDelayed} style={{padding:16}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
                <div><div style={{fontSize:10,color:GOLD,letterSpacing:1}}>{s.id}</div><div style={{fontWeight:700,fontSize:15}}>{s.carrier}</div><div style={{fontSize:11,color:"var(--text3)",marginTop:2}}>{m?.name} · {s.method==="air"?"✈":"🚢"}</div></div>
                <div style={{textAlign:"right"}}><span style={{fontSize:10,background:isDelayed?"var(--red-bg)":s.status==="Delivered"?"var(--green-bg)":"var(--blue-bg)",color:isDelayed?RED:s.status==="Delivered"?GREEN:BLUE,borderRadius:20,padding:"2px 10px",fontWeight:700}}>{s.status}</span></div>
              </div>
              {linked.length>0&&<div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>{linked.map(d=><div key={d.id} style={{display:"flex",alignItems:"center",gap:5,background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:8,padding:"3px 8px"}}>{d.imageUrl&&<img src={d.imageUrl} alt="" style={{width:16,height:20,objectFit:"cover",borderRadius:3}}/>}<span style={{fontSize:10,color:GOLD}}>{d.poNumber}</span></div>)}</div>}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:6}}>{[["Tracking",s.trackingNo||"—"],["ETA",s.eta?fmtDate(s.eta):"—"],["Units",`${s.units}u`]].map(([l,v])=><div key={l}><div style={{fontSize:9,color:"var(--text3)",textTransform:"uppercase",letterSpacing:1}}>{l}</div><div style={{fontSize:13,fontWeight:600,marginTop:1}}>{v}</div></div>)}</div>
              {eta!==null&&<div style={{fontSize:12,color:eta<0?RED:eta<7?AMBER:GREEN,fontWeight:700}}>{eta<0?`${Math.abs(eta)}d overdue`:`${eta}d until arrival`}</div>}
              <div style={{fontSize:11,color:"var(--text3)",marginTop:4}}>↳ {s.lastUpdate}</div>
              <div style={{fontSize:10,color:GOLD,marginTop:6,fontWeight:600}}>Tap for details →</div>
            </Card>
          );
        })}
        {shipments.length===0&&<div style={{textAlign:"center",color:"var(--text3)",padding:40,fontSize:13}}>No shipments yet</div>}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   APP
   ═══════════════════════════════════════════════════════════════════════════ */
export default function App() {
  const [user,setUser]=useState(null);
  const [tab,setTab]=useState("home");
  const [dresses,setDresses]=useState(SEED_DRESSES);
  const [messages,setMessages]=useState(SEED_MSGS);
  const [shipments,setShipments]=useState(SEED_SHIPMENTS);
  const [colFilter,setColFilter]=useState(null);

  // Auto-link seed messages + shipments on mount
  useEffect(()=>{
    setMessages(prev=>prev.map(msg=>{if(msg.linkedDressIds?.length>0)return msg;const matched=matchDress(msg.content,dresses);if(matched.length>0){matched.forEach(dId=>{setDresses(pd=>pd.map(d=>{if(d.id!==dId)return d;const exists=d.timeline.some(t=>t.content?.includes(msg.content.slice(0,30)));if(exists)return d;return{...d,timeline:[...d.timeline,{id:uid(),date:msg.date,time:msg.time,type:msg.channel,source:`${msg.channel==="whatsapp"?"WhatsApp":"Email"} from ${msg.from}`,content:msg.content,user:msg.from,category:msg.category||"design"}]};}));});return{...msg,linkedDressIds:matched};}return msg;}));
    setShipments(prev=>prev.map(s=>{if(s.dressIds?.length>0)return s;if(s.id==="SHP-001")return{...s,dressIds:dresses.filter(d=>d.poNumber==="PO-001"||d.poNumber==="PO-004").map(d=>d.id)};if(s.id==="SHP-002")return{...s,dressIds:dresses.filter(d=>d.poNumber==="PO-002"||d.poNumber==="PO-005").map(d=>d.id)};return s;}));
  },[]); // eslint-disable-line

  // Simulate incoming messages
  useEffect(()=>{
    if(!user)return;
    const t=setInterval(()=>{
      if(Math.random()>0.8){
        const from=MFRS[Math.floor(Math.random()*MFRS.length)];
        const dress=dresses[Math.floor(Math.random()*dresses.length)];
        const isShipping=Math.random()>0.6;
        const designTexts=[`Update on ${dress.poNumber} ${dress.name}: cutting complete, moving to sewing.`,`${dress.name} production on schedule.`,`QC photos for ${dress.poNumber} attached.`,`Slight delay on ${dress.name}, 2 days behind.`];
        const shipTexts=[`Shipping update: container for ${dress.poNumber} cleared customs.`,`Tracking update for ${dress.poNumber}: in transit, on schedule.`,`Delivery for ${dress.name} confirmed for next week.`];
        const texts=isShipping?shipTexts:designTexts;
        const text=texts[Math.floor(Math.random()*texts.length)];
        const matched=matchDress(text,dresses);
        const msg={id:uid(),from:isShipping?"DHL Express":from.name,channel:isShipping?"email":"whatsapp",content:text,date:nowISO(),time:nowTime(),read:false,linkedDressIds:matched,needsReview:matched.length===0,resolved:matched.length>0,category:isShipping?"shipping":"design"};
        if(matched.length>0){matched.forEach(dId=>{setDresses(prev=>prev.map(d=>{if(d.id!==dId)return d;return{...d,timeline:[...d.timeline,{id:uid(),date:nowISO(),time:nowTime(),type:msg.channel,source:`${msg.channel==="whatsapp"?"WhatsApp":"Email"} from ${msg.from}`,content:text,user:msg.from,category:msg.category}]};}));});}
        setMessages(prev=>[msg,...prev]);
      }
    },18000);
    return()=>clearInterval(t);
  },[user,dresses]);

  if(!user)return(<><style>{CSS}</style><LoginScreen onLogin={u=>{setUser(u);setTab("home");}}/></>);

  const tabs=TABS_BY_ROLE[user.role]||TABS_BY_ROLE.admin;
  const unread=messages.filter(m=>!m.read).length;

  return (
    <><style>{CSS}</style>
      <div style={{minHeight:"100dvh",background:"var(--bg)",display:"flex",flexDirection:"column"}}>
        <div style={{position:"sticky",top:0,zIndex:100,background:"rgba(250,249,247,0.95)",backdropFilter:"blur(20px)",padding:"11px 16px",borderBottom:"1px solid var(--border)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}><div style={{fontFamily:"var(--font-display)",fontSize:18,fontWeight:600,color:GOLD}}>Maison</div><div style={{width:6,height:6,borderRadius:"50%",background:GREEN}} className="live-dot"/></div>
          <div style={{display:"flex",alignItems:"center",gap:12}}><div style={{fontSize:11,color:"var(--text3)"}}>{user.name.split(" ")[0]} · <span style={{color:GOLD,textTransform:"capitalize"}}>{user.role}</span></div><button onClick={()=>setUser(null)} style={{color:"var(--text3)",fontSize:12}}>Sign Out</button></div>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"20px 16px 100px",WebkitOverflowScrolling:"touch"}}>
          {tab==="home"&&<HomeView dresses={dresses} messages={messages} shipments={shipments} user={user} setTab={setTab} setColFilter={setColFilter}/>}
          {tab==="dresses"&&<DressesView dresses={dresses} setDresses={setDresses} user={user} initCol={colFilter}/>}
          {tab==="inbox"&&<InboxView messages={messages} setMessages={setMessages} dresses={dresses} setDresses={setDresses} user={user}/>}
          {tab==="shipments"&&<ShipmentsView shipments={shipments} setShipments={setShipments} dresses={dresses} setDresses={setDresses}/>}
        </div>
        <div style={{position:"fixed",bottom:0,left:0,right:0,zIndex:100,background:"rgba(250,249,247,0.95)",backdropFilter:"blur(20px)",borderTop:"1px solid var(--border)",display:"flex",justifyContent:"space-around",paddingBottom:"env(safe-area-inset-bottom, 8px)",paddingTop:8}}>
          {tabs.map(t=>{const active=tab===t;const hasN=t==="inbox"&&unread>0;return(
            <button key={t} onClick={()=>{setTab(t);if(t!=="dresses")setColFilter(null);}} style={{color:active?GOLD:"var(--text3)",display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:"4px 12px",position:"relative",minWidth:56}}>
              <div style={{fontSize:20,lineHeight:1}}>{TAB_ICONS[t]}</div>
              <div style={{fontSize:9,letterSpacing:0.5,textTransform:"uppercase",fontWeight:active?700:400}}>{t==="dresses"?"Dresses":t.charAt(0).toUpperCase()+t.slice(1)}</div>
              {hasN&&<div style={{position:"absolute",top:2,right:"calc(50% - 16px)",width:16,height:16,borderRadius:"50%",background:RED,color:"#fff",fontSize:9,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center"}}>{unread>9?"9+":unread}</div>}
              {active&&<div style={{position:"absolute",bottom:0,left:"25%",right:"25%",height:2,background:GOLD,borderRadius:2}}/>}
            </button>
          );})}
        </div>
      </div>
    </>
  );
}
