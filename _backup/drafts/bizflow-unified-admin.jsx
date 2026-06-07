import { useState, useCallback } from "react";

/* ===============================================================
   BIZFLOW INDIA  .  UNIFIED ADMIN PORTAL
   Phase 1: Dashboard . Products . Stock Ledger . Adjust Stock
   Phase 2: Buyers . Orders . Dispatch . GST Invoices
   =============================================================== */

const C = {
  bg:        "#07090F",
  surface:   "#0D1117",
  card:      "#111827",
  raised:    "#161F30",
  border:    "#1E2D3D",
  muted:     "#243447",
  brand:     "#1D4ED8",
  brandHov:  "#2563EB",
  brandGlow: "#1D4ED833",
  accent:    "#EA580C",
  accentGlow:"#EA580C22",
  green:     "#059669",
  greenL:    "#10B981",
  red:       "#DC2626",
  redL:      "#EF4444",
  gold:      "#D97706",
  goldL:     "#F59E0B",
  purple:    "#7C3AED",
  teal:      "#0891B2",
  ink:       "#F1F5F9",
  mid:       "#94A3B8",
  faint:     "#475569",
  line:      "#1E2D3D",
};

//
const initProducts = [
  { id:1, sku:"BF-001", name:"Cotton Fabric (White)",     cat:"Fabric",      hsn:"520811", gst:5,  unit:"Metre", buyPrice:85,  tradePrice:120, mrp:150, reorder:500,  stock:2340, active:true },
  { id:2, sku:"BF-002", name:"Polyester Blend Fabric",    cat:"Fabric",      hsn:"540742", gst:12, unit:"Metre", buyPrice:65,  tradePrice:95,  mrp:130, reorder:300,  stock:85,   active:true },
  { id:3, sku:"BF-003", name:"Denim Fabric (Blue)",       cat:"Fabric",      hsn:"520942", gst:5,  unit:"Metre", buyPrice:145, tradePrice:200, mrp:260, reorder:200,  stock:0,    active:true },
  { id:4, sku:"CH-001", name:"Brass Zip 20cm",            cat:"Accessories", hsn:"963200", gst:18, unit:"Nos",   buyPrice:8,   tradePrice:15,  mrp:20,  reorder:1000, stock:4500, active:true },
  { id:5, sku:"CH-002", name:"Plastic Buttons (12mm)",    cat:"Accessories", hsn:"960610", gst:12, unit:"Nos",   buyPrice:1.5, tradePrice:3,   mrp:5,   reorder:2000, stock:420,  active:true },
  { id:6, sku:"TH-001", name:"Polyester Thread (Black)",  cat:"Thread",      hsn:"540200", gst:12, unit:"Box",   buyPrice:280, tradePrice:380, mrp:450, reorder:50,   stock:180,  active:true },
  { id:7, sku:"TH-002", name:"Cotton Thread (Assorted)",  cat:"Thread",      hsn:"520400", gst:5,  unit:"Box",   buyPrice:320, tradePrice:440, mrp:520, reorder:40,   stock:22,   active:true },
];

const initLedger = [
  { id:1,  pid:1, type:"OPENING",  qty:3000,  bal:3000, date:"2026-04-01", ref:"Opening Entry",   by:"Admin", note:"" },
  { id:2,  pid:1, type:"DISPATCH", qty:-660,  bal:2340, date:"2026-04-05", ref:"ORD-2026-001",    by:"System", note:"" },
  { id:3,  pid:2, type:"OPENING",  qty:500,   bal:500,  date:"2026-04-01", ref:"Opening Entry",   by:"Admin", note:"" },
  { id:4,  pid:2, type:"DISPATCH", qty:-415,  bal:85,   date:"2026-04-10", ref:"ORD-2026-002",    by:"System", note:"" },
  { id:5,  pid:3, type:"OPENING",  qty:200,   bal:200,  date:"2026-04-01", ref:"Opening Entry",   by:"Admin", note:"" },
  { id:6,  pid:3, type:"DISPATCH", qty:-200,  bal:0,    date:"2026-04-12", ref:"ORD-2026-003",    by:"System", note:"" },
  { id:7,  pid:4, type:"OPENING",  qty:5000,  bal:5000, date:"2026-04-01", ref:"Opening Entry",   by:"Admin", note:"" },
  { id:8,  pid:4, type:"DISPATCH", qty:-500,  bal:4500, date:"2026-04-08", ref:"ORD-2026-001",    by:"System", note:"" },
  { id:9,  pid:5, type:"OPENING",  qty:3000,  bal:3000, date:"2026-04-01", ref:"Opening Entry",   by:"Admin", note:"" },
  { id:10, pid:5, type:"DISPATCH", qty:-2580, bal:420,  date:"2026-04-14", ref:"ORD-2026-004",    by:"System", note:"" },
  { id:11, pid:6, type:"OPENING",  qty:200,   bal:200,  date:"2026-04-01", ref:"Opening Entry",   by:"Admin", note:"" },
  { id:12, pid:7, type:"OPENING",  qty:40,    bal:40,   date:"2026-04-01", ref:"Opening Entry",   by:"Admin", note:"" },
  { id:13, pid:7, type:"DAMAGE",   qty:-18,   bal:22,   date:"2026-04-15", ref:"DMG-001",         by:"Admin", note:"Water damage in godown" },
];

const initBuyers = [
  { id:1, name:"Sharma Textiles Pvt Ltd", gstin:"27AABCU9603R1ZX", pan:"AABCU9603R", phone:"9876543210", email:"sharma@textiles.com", city:"Mumbai", state:"Maharashtra", creditLimit:200000, msme:"UDYAM-MH-01-0012345", type:"Pvt Ltd",  status:"approved", joined:"2026-01-15", riskScore:85 },
  { id:2, name:"Gupta Garments",          gstin:"07AAACG1234C1Z5", pan:"AAACG1234C", phone:"9812345678", email:"gupta@garments.in",  city:"Delhi",   state:"Delhi",        creditLimit:100000, msme:"",                    type:"Proprietor",status:"approved", joined:"2026-02-10", riskScore:42 },
  { id:3, name:"Rajasthan Fabrics LLP",   gstin:"08AABFR5678D1ZP", pan:"AABFR5678D", phone:"9001234567", email:"raj@fabrics.com",    city:"Jaipur",  state:"Rajasthan",    creditLimit:150000, msme:"UDYAM-RJ-03-0067890", type:"LLP",       status:"pending",  joined:"2026-04-18", riskScore:0  },
];

const initOrders = [
  { id:"ORD-2026-001", buyerId:1, date:"2026-04-10", status:"dispatched",
    items:[{pid:1,qty:500,price:120,gst:5},{pid:4,qty:200,price:15,gst:18}],
    addr:"Unit 4, Dharavi Industrial Estate, Mumbai 400017", notes:"",
    dispatch:{date:"2026-04-12",vehicle:"MH12AB1234",transporter:"Shree Cargo",ewb:"EWB-7892341567"},
    invoice:{no:"INV-2026-001",date:"2026-04-12",irn:"a3f9b2c1d4e5f6a7b8c9d0e1f2a3b4c5",due:"2026-05-27",paid:false} },
  { id:"ORD-2026-002", buyerId:2, date:"2026-04-14", status:"approved",
    items:[{pid:6,qty:20,price:380,gst:12},{pid:7,qty:10,price:440,gst:5}],
    addr:"45 Gandhi Nagar, Shahdara, Delhi 110032", notes:"Urgent - needed by April 25",
    dispatch:null, invoice:null },
  { id:"ORD-2026-003", buyerId:1, date:"2026-04-18", status:"pending",
    items:[{pid:2,qty:80,price:95,gst:12}],
    addr:"Unit 4, Dharavi Industrial Estate, Mumbai 400017", notes:"",
    dispatch:null, invoice:null },
];

//
const fmtN   = n => new Intl.NumberFormat("en-IN").format(Math.round(n));
const fmtD   = n => new Intl.NumberFormat("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2}).format(n);
const cur    = n => "₹" + fmtD(n);
const today  = () => new Date().toISOString().slice(0,10);
const addD   = (d,n)=>{ const dt=new Date(d); dt.setDate(dt.getDate()+n); return dt.toISOString().slice(0,10); };
const oBase  = items => items.reduce((s,i)=>s+i.qty*i.price,0);
const oGST   = items => items.reduce((s,i)=>s+i.qty*i.price*i.gst/100,0);
const oGrand = items => oBase(items)+oGST(items);
const genIRN = () => Array.from({length:32},()=>"0123456789abcdef"[Math.floor(Math.random()*16)]).join("");
const genEWB = () => "EWB-"+Math.floor(1000000000+Math.random()*9000000000);
const newId  = () => Date.now();

const LEDGER_TYPES = ["PURCHASE","RETURN","DAMAGE","ADJUSTMENT"];
const UNITS   = ["Nos","Kg","Gram","Litre","ML","Metre","Box","Carton","Set","Pair","Roll"];
const CATS    = ["Fabric","Thread","Accessories","Packaging","Chemicals","Electronics","Other"];
const GST_OPTS= [0,5,12,18,28];
const BIZ_TYPES=["Proprietor","Partnership","LLP","Pvt Ltd","Ltd","HUF"];

const stockBadge = (s,r) =>
  s===0 ? {label:"Out of Stock", c:C.red,   bg:C.red+"22"}  :
  s< r  ? {label:"Low Stock",    c:C.gold,  bg:C.gold+"22"} :
          {label:"In Stock",     c:C.green, bg:C.green+"22"};

const orderStatus = {
  pending:   {label:"Pending",    c:C.gold,  bg:C.gold+"22",  icon:"⏳"},
  approved:  {label:"Approved",   c:C.brand, bg:C.brand+"22", icon:"✅"},
  dispatched:{label:"Dispatched", c:C.green, bg:C.green+"22", icon:"🚚"},
  delivered: {label:"Delivered",  c:C.greenL,bg:C.greenL+"22",icon:"📦"},
  rejected:  {label:"Rejected",   c:C.red,   bg:C.red+"22",   icon:"✕"},
};

const buyerStatus = {
  approved:{label:"Approved",   c:C.green, bg:C.green+"22", icon:"✓"},
  pending: {label:"Pending KYC",c:C.gold,  bg:C.gold+"22",  icon:"⏳"},
  blocked: {label:"Blocked",    c:C.red,   bg:C.red+"22",   icon:"🔒"},
};

//
const Th = ({ch,right,w}) => (
  <th style={{padding:"9px 12px",background:C.muted,textAlign:right?"right":"left",
    fontSize:10,color:C.mid,fontWeight:700,letterSpacing:1,textTransform:"uppercase",
    whiteSpace:"nowrap",width:w}}>
    {ch}
  </th>
);
const Td = ({ch,right,bold,color,mono,small}) => (
  <td style={{padding:"10px 12px",borderBottom:`1px solid ${C.line}`,
    textAlign:right?"right":"left",fontSize:small?11:13,
    color:color||C.mid,fontWeight:bold?700:400,
    fontFamily:mono?"'Courier New',monospace":"inherit",whiteSpace:"nowrap"}}>
    {ch}
  </td>
);
const Pill = ({label,c,bg,icon}) => (
  <span style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:11,fontWeight:700,
    padding:"3px 9px",borderRadius:20,background:bg||c+"22",color:c,letterSpacing:0.3,whiteSpace:"nowrap"}}>
    {icon&&<span>{icon}</span>}{label}
  </span>
);
const Btn = ({ch,onClick,color=C.brand,sm,outline,full,disabled}) => (
  <button onClick={disabled?undefined:onClick} style={{
    padding:sm?"6px 12px":"9px 18px",borderRadius:7,
    border:outline?`1px solid ${color}`:"none",
    cursor:disabled?"not-allowed":"pointer",
    background:outline?"transparent":color,
    color:outline?color:"#fff",opacity:disabled?0.5:1,
    fontSize:sm?11:13,fontWeight:700,fontFamily:"inherit",
    display:"inline-flex",alignItems:"center",gap:5,
    width:full?"100%":undefined,justifyContent:full?"center":undefined}}>
    {ch}
  </button>
);
const Inp = ({label,value,onChange,type="text",placeholder,opts,req,note}) => (
  <div style={{display:"flex",flexDirection:"column",gap:4,flex:1,minWidth:120}}>
    {label&&<label style={{fontSize:10,color:C.mid,letterSpacing:1,textTransform:"uppercase",fontWeight:700}}>
      {label}{req&&<span style={{color:C.red}}> *</span>}
    </label>}
    {opts
      ? <select value={value} onChange={e=>onChange(e.target.value)}
          style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:7,
            padding:"9px 11px",color:C.ink,fontSize:13,outline:"none",fontFamily:"inherit"}}>
          {opts.map(o=><option key={o}>{o}</option>)}
        </select>
      : <input type={type} value={value} onChange={e=>onChange(e.target.value)}
          placeholder={placeholder}
          style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:7,
            padding:"9px 11px",color:C.ink,fontSize:13,outline:"none",fontFamily:"inherit"}}/>
    }
    {note&&<span style={{fontSize:10,color:C.faint}}>{note}</span>}
  </div>
);
const Card = ({children,style}) => (
  <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:13,...style}}>
    {children}
  </div>
);
const Section = ({title,sub,action,children}) => (
  <div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
      <div>
        <h1 style={{fontSize:22,fontWeight:800,color:C.ink,margin:0,letterSpacing:-0.5}}>{title}</h1>
        {sub&&<p style={{color:C.mid,fontSize:13,marginTop:4,marginBottom:0}}>{sub}</p>}
      </div>
      {action}
    </div>
    {children}
  </div>
);
const Modal = ({title,sub,onClose,children,wide}) => (
  <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:3000,
    display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,
      width:"100%",maxWidth:wide?820:520,maxHeight:"90vh",overflowY:"auto",
      boxShadow:"0 40px 120px rgba(0,0,0,0.8)"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",
        padding:"20px 24px 16px",borderBottom:`1px solid ${C.border}`}}>
        <div>
          <div style={{fontSize:17,fontWeight:800,color:C.ink}}>{title}</div>
          {sub&&<div style={{fontSize:12,color:C.mid,marginTop:3}}>{sub}</div>}
        </div>
        <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",
          color:C.mid,fontSize:20,lineHeight:1,padding:4}}>x</button>
      </div>
      <div style={{padding:"20px 24px"}}>{children}</div>
    </div>
  </div>
);
const Alert = ({type,ch}) => {
  const colors = {success:{bg:C.green+"15",border:C.green+"44",c:C.greenL,icon:"✅"},
                  warn:{bg:C.gold+"15",border:C.gold+"44",c:C.goldL,icon:"⚠️"},
                  info:{bg:C.brand+"15",border:C.brand+"44",c:C.brand,icon:"ℹ️"},
                  error:{bg:C.red+"15",border:C.red+"44",c:C.redL,icon:"🚨"}};
  const s=colors[type]||colors.info;
  return <div style={{background:s.bg,border:`1px solid ${s.border}`,borderRadius:9,
    padding:"11px 16px",marginBottom:16,fontSize:13,color:s.c,display:"flex",gap:8,alignItems:"flex-start"}}>
    <span>{s.icon}</span><span>{ch}</span>
  </div>;
};

//
const NAV_GROUPS = [
  { group:"PHASE 1 - STOCK", items:[
    {key:"dashboard", icon:"▦",  label:"Dashboard"},
    {key:"products",  icon:"📦", label:"Products"},
    {key:"ledger",    icon:"📋", label:"Stock Ledger"},
    {key:"adjust",    icon:"🔧", label:"Adjust Stock"},
  ]},
  { group:"PHASE 2 - ORDERS", items:[
    {key:"buyers",    icon:"👥", label:"Buyers"},
    {key:"orders",    icon:"🛒", label:"Orders"},
    {key:"dispatch",  icon:"🚚", label:"Dispatch Queue"},
    {key:"invoices",  icon:"🧾", label:"GST Invoices"},
  ]},
];

const Sidebar = ({page,setPage,counts}) => (
  <div style={{width:224,minHeight:"100vh",background:C.surface,
    borderRight:`1px solid ${C.border}`,display:"flex",flexDirection:"column",flexShrink:0}}>
    {/* Logo */}
    <div style={{padding:"22px 18px 16px",borderBottom:`1px solid ${C.border}`}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <div style={{width:34,height:34,borderRadius:8,
          background:`linear-gradient(135deg,${C.brand},${C.accent})`,
          display:"flex",alignItems:"center",justifyContent:"center",
          fontWeight:900,color:"#fff",fontSize:17}}>B</div>
        <div>
          <div style={{fontSize:15,fontWeight:800,color:C.ink,letterSpacing:-0.3}}>BizFlow</div>
          <div style={{fontSize:9,color:C.faint,letterSpacing:2,textTransform:"uppercase"}}>India . Admin</div>
        </div>
      </div>
    </div>
    {/* Nav */}
    <nav style={{padding:"10px 8px",flex:1,overflowY:"auto"}}>
      {NAV_GROUPS.map(g=>(
        <div key={g.group} style={{marginBottom:20}}>
          <div style={{fontSize:9,color:C.faint,letterSpacing:2,fontWeight:700,
            textTransform:"uppercase",padding:"0 10px",marginBottom:6}}>{g.group}</div>
          {g.items.map(n=>{
            const active=page===n.key;
            const cnt=counts && counts[n.key];
            return (
              <button key={n.key} onClick={()=>setPage(n.key)} style={{
                display:"flex",alignItems:"center",gap:9,width:"100%",
                padding:"9px 12px",borderRadius:8,border:"none",cursor:"pointer",
                marginBottom:2,fontFamily:"inherit",
                background:active?C.brand+"28":"transparent",
                color:active?C.brandHov:C.mid,
                fontWeight:active?700:400,fontSize:13,
                borderLeft:active?`3px solid ${C.brand}`:"3px solid transparent"}}>
                <span style={{fontSize:15}}>{n.icon}</span>
                <span style={{flex:1,textAlign:"left"}}>{n.label}</span>
                {cnt>0&&<span style={{background:C.accent,color:"#fff",borderRadius:10,
                  fontSize:10,fontWeight:700,padding:"1px 6px",lineHeight:1.4}}>{cnt}</span>}
              </button>
            );
          })}
        </div>
      ))}
    </nav>
    {/* Footer */}
    <div style={{padding:"14px 18px",borderTop:`1px solid ${C.border}`}}>
      <div style={{fontSize:10,color:C.faint,marginBottom:2}}>GSTIN</div>
      <div style={{fontSize:11,color:C.mid,fontWeight:600,fontFamily:"'Courier New',monospace"}}>27AABCU9603R1ZX</div>
      <div style={{fontSize:10,color:C.green,marginTop:5}}> Active . April 2026</div>
    </div>
  </div>
);

//
//  P1 - DASHBOARD
//
const Dashboard = ({products,ledger,orders,buyers}) => {
  const ap=products.filter(p=>p.active);
  const stockVal=ap.reduce((s,p)=>s+p.stock*p.buyPrice,0);
  const tradeVal=ap.reduce((s,p)=>s+p.stock*p.tradePrice,0);
  const lowStock=ap.filter(p=>p.stock>0&&p.stock<p.reorder);
  const outStock=ap.filter(p=>p.stock===0);
  const pendingOrders=orders.filter(o=>o.status==="pending");
  const dispatchQ=orders.filter(o=>o.status==="approved");
  const totalReceivable=orders.filter(o=>o.invoice&&!o.invoice.paid).reduce((s,o)=>s+oGrand(o.items),0);
  const pendingBuyers=buyers.filter(b=>b.status==="pending");
  const recent=[...ledger].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,5);

  const kpis=[
    {label:"Stock Value (Cost)",   val:cur(stockVal),    icon:"💰",c:C.brand, sub:"At purchase price"},
    {label:"Realisable Value",     val:cur(tradeVal),    icon:"📈",c:C.green, sub:"At trade price"},
    {label:"Pending Orders",       val:pendingOrders.length,icon:"⏳",c:C.gold, sub:"Awaiting approval"},
    {label:"Dispatch Queue",       val:dispatchQ.length, icon:"🚚",c:C.accent,sub:"Ready to ship"},
    {label:"Outstanding Invoices", val:cur(totalReceivable),icon:"🧾",c:C.red,sub:"Unpaid receivables"},
    {label:"Buyers Pending KYC",   val:pendingBuyers.length,icon:"👥",c:C.purple,sub:"Need approval"},
    {label:"Low Stock Items",      val:lowStock.length,  icon:"⚠️",c:C.goldL, sub:"Below reorder level"},
    {label:"Out of Stock",         val:outStock.length,  icon:"🚨",c:C.redL,  sub:"Zero stock - urgent"},
  ];

  return (
    <Section title="Dashboard" sub={`Overview . ${today()}`}>
      {(outStock.length>0||pendingOrders.length>0)&&(
        <Alert type="warn" ch={
          [outStock.length>0&&`${outStock.length} product(s) out of stock`,
           pendingOrders.length>0&&`${pendingOrders.length} order(s) awaiting approval`,
          ].filter(Boolean).join(" . ")
        }/>
      )}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(210px,1fr))",gap:14,marginBottom:28}}>
        {kpis.map((k,i)=>(
          <Card key={i} style={{padding:"18px 20px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div>
                <div style={{fontSize:10,color:C.faint,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>{k.label}</div>
                <div style={{fontSize:24,fontWeight:800,color:k.c,letterSpacing:-0.5}}>{k.val}</div>
                <div style={{fontSize:11,color:C.faint,marginTop:4}}>{k.sub}</div>
              </div>
              <span style={{fontSize:22}}>{k.icon}</span>
            </div>
          </Card>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <Card style={{padding:20}}>
          <div style={{fontSize:13,fontWeight:700,color:C.ink,marginBottom:14}}> Stock Alerts</div>
          {[...outStock,...lowStock].slice(0,6).map(p=>{
            const b=stockBadge(p.stock,p.reorder);
            return <div key={p.id} style={{display:"flex",justifyContent:"space-between",
              alignItems:"center",padding:"8px 0",borderBottom:`1px solid ${C.line}`}}>
              <div>
                <div style={{fontSize:13,color:C.ink,fontWeight:600}}>{p.name}</div>
                <div style={{fontSize:11,color:C.faint}}>{p.sku} . reorder@{fmtN(p.reorder)}</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:14,fontWeight:800,color:b.c}}>{fmtN(p.stock)}</div>
                <Pill label={b.label} c={b.c} bg={b.bg}/>
              </div>
            </div>;
          })}
          {outStock.length===0&&lowStock.length===0&&
            <div style={{color:C.faint,fontSize:13}}>All stock levels are healthy </div>}
        </Card>
        <Card style={{padding:20}}>
          <div style={{fontSize:13,fontWeight:700,color:C.ink,marginBottom:14}}> Recent Stock Movements</div>
          {recent.map(l=>{
            const p=products.find(x=>x.id===l.pid);
            return <div key={l.id} style={{display:"flex",justifyContent:"space-between",
              alignItems:"center",padding:"8px 0",borderBottom:`1px solid ${C.line}`}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,color:C.ink,fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{(p && p.name)}</div>
                <div style={{fontSize:11,color:C.faint}}>{l.date} . {l.ref}</div>
              </div>
              <div style={{textAlign:"right",marginLeft:12}}>
                <div style={{fontSize:13,fontWeight:700,color:l.qty>0?C.green:C.accent}}>
                  {l.qty>0?"+":""}{fmtN(l.qty)}
                </div>
                <Pill label={l.type} c={
                  l.type==="OPENING"?C.brand:l.type==="PURCHASE"?C.green:
                  l.type==="DISPATCH"?C.accent:l.type==="DAMAGE"?C.red:C.mid}/>
              </div>
            </div>;
          })}
        </Card>
      </div>
    </Section>
  );
};

//
//  P1 - PRODUCTS
//
const emptyProd = {name:"",sku:"",hsn:"",gst:5,unit:"Metre",buyPrice:"",tradePrice:"",mrp:"",reorder:"",openStock:"",cat:"Fabric",active:true};

const Products = ({products,setProducts,setLedger}) => {
  const [search,setSearch]=useState("");
  const [catF,setCatF]=useState("All");
  const [modal,setModal]=useState(null); 
  const [editId,setEditId]=useState(null);
  const [form,setForm]=useState(emptyProd);
  const [toast,setToast]=useState(null);

  const showToast=(msg,type="success")=>{setToast({msg,type});setTimeout(()=>setToast(null),3000);};
  const f=v=>({...form,...v});

  const filtered=products.filter(p=>
    (catF==="All"||p.cat===catF)&&
    (p.name.toLowerCase().includes(search.toLowerCase())||p.sku.toLowerCase().includes(search.toLowerCase()))
  );

  const openAdd=()=>{setForm(emptyProd);setEditId(null);setModal("add");};
  const openEdit=p=>{setForm({...p,buyPrice:p.buyPrice+"",tradePrice:p.tradePrice+"",mrp:p.mrp+"",reorder:p.reorder+"",openStock:p.stock+""});setEditId(p.id);setModal("edit");};

  const save=()=>{
    if(!form.name||!form.sku||!form.hsn||!form.buyPrice||!form.tradePrice){showToast("Fill required fields","error");return;}
    if(modal==="edit"){
      setProducts(prev=>prev.map(p=>p.id===editId?{...p,...form,gst:+form.gst,buyPrice:+form.buyPrice,tradePrice:+form.tradePrice,mrp:+form.mrp||0,reorder:+form.reorder||0}:p));
      showToast("Product updated");
    } else {
      const id=Math.max(...products.map(p=>p.id),0)+1;
      const oq=+form.openStock||0;
      setProducts(prev=>[...prev,{id,...form,gst:+form.gst,buyPrice:+form.buyPrice,tradePrice:+form.tradePrice,mrp:+form.mrp||0,reorder:+form.reorder||0,stock:oq,active:true}]);
      if(oq>0) setLedger(prev=>[...prev,{id:newId(),pid:id,type:"OPENING",qty:oq,bal:oq,date:today(),ref:"Opening Entry",by:"Admin",note:""}]);
      showToast("Product added");
    }
    setModal(null);
  };

  const margin=form.buyPrice&&form.tradePrice?((+form.tradePrice-+form.buyPrice)/+form.buyPrice*100).toFixed(1):null;

  return (
    <Section title="Products" sub={`${products.filter(p=>p.active).length} active . ${products.filter(p=>!p.active).length} inactive`}
      action={<Btn ch="+ Add Product" onClick={openAdd}/>}>
      {toast&&<Alert type={toast.type} ch={toast.msg}/>}
      <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap"}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name or SKU…"
          style={{flex:1,minWidth:180,background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,
            padding:"9px 13px",color:C.ink,fontSize:13,outline:"none"}}/>
        <select value={catF} onChange={e=>setCatF(e.target.value)}
          style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,
            padding:"9px 13px",color:C.ink,fontSize:13,outline:"none"}}>
          <option>All</option>{CATS.map(c=><option key={c}>{c}</option>)}
        </select>
      </div>
      <Card style={{overflow:"hidden",padding:0}}>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr>
              <Th ch="SKU"/><Th ch="Product"/><Th ch="Category"/><Th ch="HSN"/><Th ch="GST%"/>
              <Th ch="Unit"/><Th ch="Stock" right/><Th ch="Buy Price" right/><Th ch="Trade Price" right/><Th ch="Status"/><Th ch="Actions"/>
            </tr></thead>
            <tbody>
              {filtered.map(p=>{
                const b=stockBadge(p.stock,p.reorder);
                return <tr key={p.id} style={{opacity:p.active?1:0.4}}>
                  <Td ch={<span style={{fontFamily:"'Courier New',monospace",fontSize:12,color:C.brandHov}}>{p.sku}</span>}/>
                  <Td ch={p.name} bold color={C.ink}/>
                  <Td ch={p.cat}/>
                  <Td ch={p.hsn} mono small/>
                  <Td ch={<Pill label={p.gst+"%"} c={C.brand}/>}/>
                  <Td ch={p.unit}/>
                  <Td ch={fmtN(p.stock)} right bold color={b.c}/>
                  <Td ch={cur(p.buyPrice)} right/>
                  <Td ch={cur(p.tradePrice)} right bold color={C.ink}/>
                  <Td ch={<Pill label={b.label} c={b.c} bg={b.bg}/>}/>
                  <Td ch={<div style={{display:"flex",gap:6}}>
                    <Btn ch="Edit" sm onClick={()=>openEdit(p)}/>
                    <Btn ch={p.active?"Disable":"Enable"} sm outline color={p.active?C.red:C.green}
                      onClick={()=>setProducts(prev=>prev.map(x=>x.id===p.id?{...x,active:!x.active}:x))}/>
                  </div>}/>
                </tr>;
              })}
              {!filtered.length&&<tr><td colSpan={11} style={{padding:36,textAlign:"center",color:C.faint}}>No products found</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      {modal&&(
        <Modal title={modal==="edit"?"Edit Product":"Add New Product"} onClose={()=>setModal(null)} wide>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
              <Inp label="Product Name" value={form.name} onChange={v=>setForm(f({name:v}))} placeholder="e.g. Cotton Fabric White" req/>
              <Inp label="SKU / Item Code" value={form.sku} onChange={v=>setForm(f({sku:v}))} placeholder="BF-001" req/>
            </div>
            <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
              <Inp label="HSN Code" value={form.hsn} onChange={v=>setForm(f({hsn:v}))} placeholder="6-digit HSN" req note="6-digit if turnover >₹5Cr"/>
              <Inp label="GST Rate %" value={form.gst+""} onChange={v=>setForm(f({gst:+v}))} opts={GST_OPTS.map(String)}/>
              <Inp label="Unit" value={form.unit} onChange={v=>setForm(f({unit:v}))} opts={UNITS}/>
              <Inp label="Category" value={form.cat} onChange={v=>setForm(f({cat:v}))} opts={CATS}/>
            </div>
            <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
              <Inp label="Purchase Price ₹ (excl. GST)" value={form.buyPrice} onChange={v=>setForm(f({buyPrice:v}))} type="number" placeholder="0.00" req/>
              <Inp label="Trade Price ₹ (excl. GST)" value={form.tradePrice} onChange={v=>setForm(f({tradePrice:v}))} type="number" placeholder="0.00" req/>
              <Inp label="MRP ₹" value={form.mrp} onChange={v=>setForm(f({mrp:v}))} type="number" placeholder="0.00"/>
            </div>
            <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
              <Inp label="Reorder Level" value={form.reorder} onChange={v=>setForm(f({reorder:v}))} type="number" placeholder="e.g. 500"/>
              {!editId&&<Inp label="Opening Stock (qty)" value={form.openStock} onChange={v=>setForm(f({openStock:v}))} type="number" placeholder="Starting qty"/>}
            </div>
            {form.buyPrice&&form.tradePrice&&(
              <div style={{background:C.raised,border:`1px solid ${C.border}`,borderRadius:8,padding:"11px 14px",
                display:"flex",gap:24,fontSize:13}}>
                <span style={{color:C.mid}}>Incl. GST: <strong style={{color:C.greenL}}>{cur(+form.tradePrice*(1++form.gst/100))}</strong></span>
                {margin&&<span style={{color:C.mid}}>Margin: <strong style={{color:C.goldL}}>{margin}%</strong></span>}
              </div>
            )}
            <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:4}}>
              <Btn ch="Cancel" outline color={C.faint} onClick={()=>setModal(null)}/>
              <Btn ch={editId?"Save Changes":"Add Product"} onClick={save}/>
            </div>
          </div>
        </Modal>
      )}
    </Section>
  );
};

//
//  P1 - STOCK LEDGER
//
const Ledger = ({products,ledger}) => {
  const [pf,setPf]=useState("All");
  const [tf,setTf]=useState("All");
  const typeColor={OPENING:C.brand,PURCHASE:C.green,DISPATCH:C.accent,RETURN:C.goldL,DAMAGE:C.red,ADJUSTMENT:C.faint};
  const rows=[...ledger]
    .filter(l=>(pf==="All"||l.pid===+pf)&&(tf==="All"||l.type===tf))
    .sort((a,b)=>new Date(b.date)-new Date(a.date));
  return (
    <Section title="Stock Ledger" sub="Complete tamper-evident audit trail of every stock movement">
      <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap"}}>
        <select value={pf} onChange={e=>setPf(e.target.value)}
          style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,padding:"9px 13px",color:C.ink,fontSize:13,outline:"none"}}>
          <option value="All">All Products</option>
          {products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select value={tf} onChange={e=>setTf(e.target.value)}
          style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,padding:"9px 13px",color:C.ink,fontSize:13,outline:"none"}}>
          <option value="All">All Types</option>
          {["OPENING","PURCHASE","DISPATCH","RETURN","DAMAGE","ADJUSTMENT"].map(t=><option key={t}>{t}</option>)}
        </select>
        <div style={{marginLeft:"auto",fontSize:12,color:C.faint,alignSelf:"center"}}>{rows.length} entries</div>
      </div>
      <Card style={{overflow:"hidden",padding:0}}>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr>
              <Th ch="Date"/><Th ch="Product"/><Th ch="SKU"/><Th ch="Type"/>
              <Th ch="Quantity" right/><Th ch="Balance After" right/><Th ch="Reference"/><Th ch="Notes"/><Th ch="By"/>
            </tr></thead>
            <tbody>
              {rows.map(l=>{
                const p=products.find(x=>x.id===l.pid);
                const tc=typeColor[l.type]||C.mid;
                return <tr key={l.id}>
                  <Td ch={l.date}/>
                  <Td ch={(p && p.name)} bold color={C.ink}/>
                  <Td ch={(p && p.sku)} mono small/>
                  <Td ch={<Pill label={l.type} c={tc}/>}/>
                  <Td ch={<span style={{color:l.qty>0?C.greenL:C.accent,fontWeight:700}}>{l.qty>0?"+":""}{fmtN(l.qty)}</span>} right/>
                  <Td ch={fmtN(l.bal)} right bold color={C.ink}/>
                  <Td ch={l.ref} mono small/>
                  <Td ch={l.note||"—"}/>
                  <Td ch={l.by}/>
                </tr>;
              })}
              {!rows.length&&<tr><td colSpan={9} style={{padding:36,textAlign:"center",color:C.faint}}>No entries found</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </Section>
  );
};

//
//  P1 - ADJUST STOCK
//
const Adjust = ({products,setProducts,setLedger}) => {
  const [form,setForm]=useState({pid:"",type:"PURCHASE",qty:"",note:""});
  const [confirm,setConfirm]=useState(null);
  const [toast,setToast]=useState(null);
  const showToast=msg=>{setToast(msg);setTimeout(()=>setToast(null),3500);};
  const selP=products.find(p=>p.id===+form.pid);
  const isOut=["DISPATCH","DAMAGE"].includes(form.type);
  const delta=+form.qty*(isOut?-1:1);
  const newBal=selP?selP.stock+delta:null;
  const save=()=>{
    setProducts(prev=>prev.map(p=>p.id===+confirm.pid?{...p,stock:confirm.newBal}:p));
    setLedger(prev=>[...prev,{id:newId(),pid:+confirm.pid,type:confirm.type,
      qty:confirm.delta,bal:confirm.newBal,date:today(),
      ref:confirm.type+"-"+Date.now().toString().slice(-5),by:"Admin",note:confirm.note}]);
    showToast(`Done! New stock: ${fmtN(confirm.newBal)} ${confirm.prod.unit}`);
    setConfirm(null);
    setForm({pid:"",type:"PURCHASE",qty:"",note:""});
  };
  return (
    <Section title="Adjust Stock" sub="Record purchases, returns, damage write-offs and manual corrections">
      {toast&&<Alert type="success" ch={toast}/>}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
        <Card style={{padding:24}}>
          <div style={{fontSize:14,fontWeight:700,color:C.ink,marginBottom:18}}>Adjustment Form</div>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div style={{display:"flex",flexDirection:"column",gap:4}}>
              <label style={{fontSize:10,color:C.mid,letterSpacing:1,textTransform:"uppercase",fontWeight:700}}>Product <span style={{color:C.red}}>*</span></label>
              <select value={form.pid} onChange={e=>setForm(f=>({...f,pid:e.target.value}))}
                style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:7,padding:"9px 11px",color:form.pid?C.ink:C.faint,fontSize:13,outline:"none"}}>
                <option value="">- Select product -</option>
                {products.filter(p=>p.active).map(p=><option key={p.id} value={p.id}>{p.name} (Stock: {fmtN(p.stock)} {p.unit})</option>)}
              </select>
            </div>
            <Inp label="Transaction Type" value={form.type} onChange={v=>setForm(f=>({...f,type:v}))} opts={LEDGER_TYPES}/>
            <Inp label={`Quantity${selP?" ("+selP.unit+")":""}`} value={form.qty} onChange={v=>setForm(f=>({...f,qty:v}))} type="number" placeholder="Enter quantity" req/>
            <Inp label="Notes / Reference" value={form.note} onChange={v=>setForm(f=>({...f,note:v}))} placeholder="Invoice no., reason, GRN ref…"/>
            {selP&&form.qty>0&&(
              <div style={{background:C.raised,border:`1px solid ${C.border}`,borderRadius:8,padding:"12px 14px"}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                  <span style={{fontSize:12,color:C.mid}}>Current stock</span>
                  <strong style={{color:C.ink,fontSize:13}}>{fmtN(selP.stock)} {selP.unit}</strong>
                </div>
                <div style={{display:"flex",justifyContent:"space-between"}}>
                  <span style={{fontSize:12,color:C.mid}}>After adjustment</span>
                  <strong style={{fontSize:14,color:newBal>=0?C.greenL:C.red}}>{fmtN(newBal)} {selP.unit}</strong>
                </div>
                {newBal<0&&<div style={{color:C.red,fontSize:11,marginTop:6}}> Exceeds available stock</div>}
              </div>
            )}
            <Btn ch="Record Movement" onClick={()=>{
              if(!form.pid||!form.qty||+form.qty<=0) return;
              setConfirm({...form,prod:selP,delta,newBal});
            }} full disabled={!form.pid||!form.qty||+form.qty<=0||newBal<0}/>
          </div>
        </Card>
        <Card style={{padding:24}}>
          <div style={{fontSize:14,fontWeight:700,color:C.ink,marginBottom:16}}>Transaction Guide</div>
          {[
            {type:"PURCHASE",icon:"📥",c:C.greenL,desc:"Goods received from supplier. Adds to stock with GRN reference."},
            {type:"RETURN",  icon:"↩️",c:C.goldL, desc:"Buyer returns goods. Stock re-added to warehouse."},
            {type:"DAMAGE",  icon:"💔",c:C.redL,  desc:"Items damaged or expired. Reduces stock with audit note."},
            {type:"ADJUSTMENT",icon:"🔧",c:C.mid, desc:"Manual correction after physical count. Note is mandatory."},
          ].map(t=>(
            <div key={t.type} style={{display:"flex",gap:12,padding:"10px 0",borderBottom:`1px solid ${C.line}`}}>
              <span style={{fontSize:20}}>{t.icon}</span>
              <div><div style={{fontSize:13,fontWeight:700,color:t.c,marginBottom:2}}>{t.type}</div>
              <div style={{fontSize:12,color:C.mid,lineHeight:1.4}}>{t.desc}</div></div>
            </div>
          ))}
        </Card>
      </div>
      {confirm&&(
        <Modal title="Confirm Stock Movement" onClose={()=>setConfirm(null)}>
          {[["Product",confirm.prod.name],["Type",confirm.type],
            ["Quantity",(confirm.delta>0?"+":"")+fmtN(confirm.delta)+" "+confirm.prod.unit],
            ["Current Stock",fmtN(confirm.prod.stock)+" "+confirm.prod.unit],
            ["New Balance",fmtN(confirm.newBal)+" "+confirm.prod.unit],
            ...(confirm.note?[["Notes",confirm.note]]:[])
          ].map(([k,v],i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",
              borderBottom:i<4?`1px solid ${C.line}`:"none"}}>
              <span style={{color:C.mid,fontSize:13}}>{k}</span>
              <strong style={{color:C.ink,fontSize:13}}>{v}</strong>
            </div>
          ))}
          <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:16}}>
            <Btn ch="Cancel" outline color={C.faint} onClick={()=>setConfirm(null)}/>
            <Btn ch="✓ Confirm & Save" color={C.green} onClick={save}/>
          </div>
        </Modal>
      )}
    </Section>
  );
};

//
//  P2 - BUYERS
//
const Buyers = ({buyers,setBuyers,orders}) => {
  const [modal,setModal]=useState(null);
  const [form,setForm]=useState({name:"",gstin:"",pan:"",phone:"",email:"",city:"",state:"",type:"Proprietor",msme:"",creditLimit:"50000"});
  const [verified,setVerified]=useState(false);
  const [toast,setToast]=useState(null);
  const showToast=(m,t="success")=>{setToast({m,t});setTimeout(()=>setToast(null),3000);};

  const orderTotal=b=>orders.filter(o=>o.buyerId===b.id&&o.status!=="rejected").reduce((s,o)=>s+oGrand(o.items),0);

  const saveBuyer=()=>{
    if(!form.name||!form.gstin){showToast("Name and GSTIN required","error");return;}
    const nb={id:Math.max(...buyers.map(b=>b.id),0)+1,...form,
      creditLimit:+form.creditLimit||50000,riskScore:0,status:"approved",joined:today()};
    setBuyers(b=>[...b,nb]);
    setModal(null);showToast("Buyer added");
  };

  const approveBuyer=id=>setBuyers(b=>b.map(x=>x.id===id?{...x,status:"approved",riskScore:75}:x));
  const blockBuyer=id=>setBuyers(b=>b.map(x=>x.id===id?{...x,status:"blocked"}:x));

  return (
    <Section title="Buyers" sub="KYC management . Credit limits . MSME registration tracking"
      action={<Btn ch="+ Add Buyer" onClick={()=>{setModal(true);setVerified(false);setForm({name:"",gstin:"",pan:"",phone:"",email:"",city:"",state:"",type:"Proprietor",msme:"",creditLimit:"50000"});}}/>}>
      {toast&&<Alert type={toast.t} ch={toast.m}/>}
      <Card style={{overflow:"hidden",padding:0}}>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr>
              <Th ch="Business"/><Th ch="GSTIN"/><Th ch="Type"/><Th ch="MSME"/>
              <Th ch="Credit Limit" right/><Th ch="Outstanding" right/><Th ch="Risk" right/>
              <Th ch="Status"/><Th ch="Joined"/><Th ch="Actions"/>
            </tr></thead>
            <tbody>
              {buyers.map(b=>{
                const used=orderTotal(b);
                const bs=buyerStatus[b.status]||buyerStatus.pending;
                const rc=b.riskScore>70?C.greenL:b.riskScore>40?C.goldL:C.redL;
                return <tr key={b.id}>
                  <Td ch={<div><div style={{fontWeight:700,color:C.ink,fontSize:13}}>{b.name}</div>
                    <div style={{fontSize:11,color:C.faint}}>{b.city} . {b.email}</div></div>}/>
                  <Td ch={b.gstin} mono small/>
                  <Td ch={b.type}/>
                  <Td ch={b.msme
                    ?<Pill label="MSME ✓" c={C.green}/>
                    :<span style={{color:C.faint,fontSize:11}}>-</span>}/>
                  <Td ch={cur(b.creditLimit)} right/>
                  <Td ch={cur(used)} right color={used>b.creditLimit*0.9?C.redL:C.mid}/>
                  <Td ch={b.riskScore>0
                    ?<div style={{display:"flex",alignItems:"center",gap:6,justifyContent:"flex-end"}}>
                       <div style={{width:50,height:5,borderRadius:3,background:C.muted,overflow:"hidden"}}>
                         <div style={{width:b.riskScore+"%",height:"100%",background:rc,borderRadius:3}}/>
                       </div>
                       <span style={{fontSize:12,fontWeight:700,color:rc}}>{b.riskScore}</span>
                     </div>
                    :<span style={{color:C.faint,fontSize:11}}>New</span>} right/>
                  <Td ch={<Pill label={bs.label} c={bs.c} bg={bs.bg} icon={bs.icon}/>}/>
                  <Td ch={b.joined}/>
                  <Td ch={<div style={{display:"flex",gap:5}}>
                    {b.status==="pending"&&<Btn ch="✓ Approve" sm color={C.green} onClick={()=>approveBuyer(b.id)}/>}
                    {b.status==="approved"&&<Btn ch="Block" sm outline color={C.red} onClick={()=>blockBuyer(b.id)}/>}
                    {b.status==="blocked"&&<Btn ch="Unblock" sm outline color={C.green} onClick={()=>approveBuyer(b.id)}/>}
                  </div>}/>
                </tr>;
              })}
            </tbody>
          </table>
        </div>
      </Card>
      {modal&&(
        <Modal title="Add New Buyer" onClose={()=>setModal(null)} wide>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div style={{background:C.raised,border:`1px solid ${C.brand}33`,borderRadius:9,padding:"14px 16px"}}>
              <div style={{fontSize:12,fontWeight:700,color:C.brand,marginBottom:8}}>Step 1 - Verify GSTIN</div>
              <div style={{display:"flex",gap:8}}>
                <input value={form.gstin} onChange={e=>setForm(f=>({...f,gstin:e.target.value.toUpperCase()}))}
                  placeholder="15-digit GSTIN" maxLength={15}
                  style={{flex:1,background:C.surface,border:`1px solid ${C.border}`,borderRadius:7,padding:"9px 11px",color:C.ink,fontSize:13,outline:"none"}}/>
                <Btn ch={verified?"✓ Verified":"Verify GSTIN"} color={verified?C.green:C.brand}
                  onClick={()=>{if(form.gstin.length===15){setVerified(true);showToast("GSTIN verified ✓");}}}/>
              </div>
              {verified&&<div style={{fontSize:11,color:C.greenL,marginTop:6}}> Verified via GST API . Auto-filled below</div>}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <Inp label="Business Name" value={form.name} onChange={v=>setForm(f=>({...f,name:v}))} req/>
              <Inp label="PAN" value={form.pan} onChange={v=>setForm(f=>({...f,pan:v}))} placeholder="AABCU9603R"/>
              <Inp label="Phone" value={form.phone} onChange={v=>setForm(f=>({...f,phone:v}))} placeholder="10-digit mobile"/>
              <Inp label="Email" value={form.email} onChange={v=>setForm(f=>({...f,email:v}))} placeholder="business@domain.com"/>
              <Inp label="City" value={form.city} onChange={v=>setForm(f=>({...f,city:v}))}/>
              <Inp label="State" value={form.state} onChange={v=>setForm(f=>({...f,state:v}))}/>
              <Inp label="Business Type" value={form.type} onChange={v=>setForm(f=>({...f,type:v}))} opts={BIZ_TYPES}/>
              <Inp label="Credit Limit ₹" value={form.creditLimit} onChange={v=>setForm(f=>({...f,creditLimit:v}))} type="number"/>
            </div>
            <Inp label="Udyam / MSME Number (optional)" value={form.msme} onChange={v=>setForm(f=>({...f,msme:v}))} placeholder="UDYAM-MH-01-XXXXXXX" note="MSME registration enables Section 43B(h) tax protection"/>
            <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
              <Btn ch="Cancel" outline color={C.faint} onClick={()=>setModal(null)}/>
              <Btn ch="Add Buyer" onClick={saveBuyer}/>
            </div>
          </div>
        </Modal>
      )}
    </Section>
  );
};

//
//  P2 - ORDERS
//
const Orders = ({orders,setOrders,buyers,products,setPage}) => {
  const [statusF,setStatusF]=useState("All");
  const [toast,setToast]=useState(null);
  const [rejectId,setRejectId]=useState(null);
  const showToast=(m,t="success")=>{setToast({m,t});setTimeout(()=>setToast(null),3000);};

  const approve=id=>{setOrders(o=>o.map(x=>x.id===id?{...x,status:"approved"}:x));showToast("Order approved ✓");};
  const reject=id=>{setOrders(o=>o.map(x=>x.id===id?{...x,status:"rejected"}:x));setRejectId(null);showToast("Order rejected","warn");};

  const filtered=[...orders]
    .filter(o=>statusF==="All"||o.status===statusF)
    .sort((a,b)=>new Date(b.date)-new Date(a.date));

  return (
    <Section title="Orders" sub="Review and approve incoming purchase orders from buyers"
      action={
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <span style={{fontSize:12,color:C.mid}}>Filter:</span>
          {["All","pending","approved","dispatched","rejected"].map(s=>(
            <button key={s} onClick={()=>setStatusF(s)} style={{
              padding:"5px 12px",borderRadius:16,border:"none",cursor:"pointer",
              fontSize:11,fontWeight:statusF===s?700:400,fontFamily:"inherit",
              background:statusF===s?C.brand:C.muted,color:statusF===s?"#fff":C.mid}}>
              {s==="All"?"All":orderStatus[s] && orderStatus[s].label}
            </button>
          ))}
        </div>
      }>
      {toast&&<Alert type={toast.t} ch={toast.m}/>}
      <Card style={{overflow:"hidden",padding:0}}>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr>
              <Th ch="Order ID"/><Th ch="Buyer"/><Th ch="Date"/>
              <Th ch="Items"/><Th ch="Base Amt" right/><Th ch="GST" right/><Th ch="Grand Total" right/>
              <Th ch="Status"/><Th ch="Actions"/>
            </tr></thead>
            <tbody>
              {filtered.map(o=>{
                const buyer=buyers.find(b=>b.id===o.buyerId);
                const os=orderStatus[o.status]||orderStatus.pending;
                const base=oBase(o.items), gst=oGST(o.items), grand=base+gst;
                return <tr key={o.id}>
                  <Td ch={<span style={{fontFamily:"'Courier New',monospace",fontSize:12,color:C.brandHov,fontWeight:700}}>{o.id}</span>}/>
                  <Td ch={<div><div style={{fontWeight:600,color:C.ink,fontSize:13}}>{(buyer && buyer.name)}</div>
                    <div style={{fontSize:11,color:C.faint}}>{(buyer && buyer.gstin)}</div></div>}/>
                  <Td ch={o.date}/>
                  <Td ch={o.items.length+" item"+(o.items.length>1?"s":"")}/>
                  <Td ch={cur(base)} right/>
                  <Td ch={cur(gst)} right/>
                  <Td ch={cur(grand)} right bold color={C.ink}/>
                  <Td ch={<Pill label={os.label} c={os.c} bg={os.bg} icon={os.icon}/>}/>
                  <Td ch={<div style={{display:"flex",gap:6}}>
                    {o.status==="pending"&&<>
                      <Btn ch="✓ Approve" sm color={C.green} onClick={()=>approve(o.id)}/>
                      <Btn ch="✕ Reject" sm color={C.red} onClick={()=>setRejectId(o.id)}/>
                    </>}
                    {o.status==="approved"&&
                      <Btn ch="🚚 Dispatch" sm color={C.accent} onClick={()=>setPage("dispatch")}/>}
                    {(o.status==="dispatched"||o.status==="delivered")&&
                      <Pill label="Invoiced" c={C.green}/>}
                    {o.status==="rejected"&&<Pill label="Rejected" c={C.red}/>}
                  </div>}/>
                </tr>;
              })}
              {!filtered.length&&<tr><td colSpan={9} style={{padding:36,textAlign:"center",color:C.faint}}>No orders found</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
      {rejectId&&(
        <Modal title="Reject this order?" sub="Buyer will be notified via WhatsApp & Email" onClose={()=>setRejectId(null)}>
          <Alert type="warn" ch="This action cannot be undone. The buyer will need to place a new order."/>
          <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
            <Btn ch="Cancel" outline color={C.faint} onClick={()=>setRejectId(null)}/>
            <Btn ch="✕ Confirm Reject" color={C.red} onClick={()=>reject(rejectId)}/>
          </div>
        </Modal>
      )}
    </Section>
  );
};

//
//  P2 - DISPATCH
//
const Dispatch = ({orders,setOrders,buyers,products,setLedger}) => {
  const [modal,setModal]=useState(null);
  const [df,setDf]=useState({vehicle:"",transporter:"",note:""});
  const [toast,setToast]=useState(null);
  const showToast=(m,t="success")=>{setToast({m,t});setTimeout(()=>setToast(null),4000);};

  const doDispatch=()=>{
    const o=modal;
    const grand=oGrand(o.items);
    const ewb=grand>=50000?genEWB():null;
    const irn=genIRN();
    const invNo="INV-2026-"+String(orders.filter(x=>x.invoice).length+1).padStart(3,"0");
    // deduct stock
    setLedger(prev=>[...prev,...o.items.map(i=>({
      id:newId()+i.pid,pid:i.pid,type:"DISPATCH",
      qty:-i.qty,bal:0,date:today(),ref:o.id,by:"System",note:""
    }))]);
    // update order
    setOrders(prev=>prev.map(x=>x.id===o.id?{...x,status:"dispatched",
      dispatch:{date:today(),vehicle:df.vehicle,transporter:df.transporter,ewb},
      invoice:{no:invNo,date:today(),irn,due:addD(today(),45),paid:false}
    }:x));
    setModal(null);setDf({vehicle:"",transporter:"",note:""});
    showToast(`✓ Dispatched! Invoice ${invNo} raised. IRN generated. Sent to buyer via WhatsApp & Email.`);
  };

  const queue=orders.filter(o=>o.status==="approved");

  return (
    <Section title="Dispatch Queue" sub="Approved orders ready to ship . E-Way Bill auto-generated for orders >= ₹50,000">
      {toast&&<Alert type="success" ch={toast}/>}
      {queue.length===0
        ?<Card style={{padding:48,textAlign:"center"}}><div style={{fontSize:32,marginBottom:12}}></div>
           <div style={{color:C.mid,fontSize:14}}>No orders pending dispatch</div></Card>
        :queue.map(o=>{
          const buyer=buyers.find(b=>b.id===o.buyerId);
          const grand=oGrand(o.items);
          const needsEWB=grand>=50000;
          return <Card key={o.id} style={{padding:22,marginBottom:16}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
              <div>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
                  <span style={{fontSize:15,fontWeight:800,color:C.brandHov,fontFamily:"'Courier New',monospace"}}>{o.id}</span>
                  <Pill label="Approved - Ready to Ship" c={C.brand}/>
                  {needsEWB&&<Pill label="E-Way Bill Required" c={C.accent} icon="⚠️"/>}
                </div>
                <div style={{fontSize:13,color:C.ink,fontWeight:600}}>{(buyer && buyer.name)}</div>
                <div style={{fontSize:12,color:C.faint,marginTop:2}}>Deliver to: {o.addr}</div>
                {o.notes&&<div style={{fontSize:12,color:C.goldL,marginTop:4}}> {o.notes}</div>}
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:24,fontWeight:900,color:C.ink}}>{cur(grand)}</div>
                <div style={{fontSize:11,color:C.faint}}>{o.items.length} item{o.items.length>1?"s":""} . {o.date}</div>
              </div>
            </div>
            {/* Items */}
            <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:14}}>
              {o.items.map(i=>{
                const p=products.find(x=>x.id===i.pid);
                return <span key={i.pid} style={{fontSize:12,padding:"4px 10px",background:C.muted,borderRadius:6,color:C.mid}}>
                  {(p && p.name)}  {fmtN(i.qty)} {(p && p.unit)}
                </span>;
              })}
            </div>
            {needsEWB&&<Alert type="warn" ch={`Order value ₹${fmtN(grand)} >= ₹50,000 - E-Way Bill (EWB) will be auto-generated via NIC API on dispatch confirmation`}/>}
            <Btn ch="🚚 Mark as Dispatched & Generate Invoice" color={C.accent}
              onClick={()=>{setModal(o);setDf({vehicle:"",transporter:"",note:"",grand});}}/>
          </Card>;
        })}
      {modal&&(
        <Modal title="Confirm Dispatch" sub={`${modal.id} . ${cur(oGrand(modal.items))}`} onClose={()=>setModal(null)}>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <Inp label="Vehicle Number" value={df.vehicle} onChange={v=>setDf(d=>({...d,vehicle:v}))} placeholder="MH12AB1234" req/>
            <Inp label="Transporter Name" value={df.transporter} onChange={v=>setDf(d=>({...d,transporter:v}))} placeholder="e.g. Shree Cargo Services"/>
            <Inp label="Dispatch Notes (optional)" value={df.note} onChange={v=>setDf(d=>({...d,note:v}))} placeholder="Handling instructions, packaging notes…"/>
            <div style={{background:C.raised,border:`1px solid ${C.greenL}33`,borderRadius:8,padding:"12px 14px",fontSize:12,color:C.greenL}}>
               On confirm: <strong>GST E-Invoice auto-generated</strong> . IRN registered with IRP within 30-day mandate .
              Invoice PDF sent to buyer via <strong>Email + WhatsApp</strong> .
              {oGrand(modal.items)>=50000&&<><strong> E-Way Bill auto-generated</strong> via NIC API .</>}
              <strong> Stock ledger updated</strong> automatically
            </div>
            <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
              <Btn ch="Cancel" outline color={C.faint} onClick={()=>setModal(null)}/>
              <Btn ch="✓ Confirm Dispatch & Generate Invoice" color={C.accent}
                onClick={doDispatch} disabled={!df.vehicle}/>
            </div>
          </div>
        </Modal>
      )}
    </Section>
  );
};

//
//  P2 - GST INVOICES
//
const Invoices = ({orders,setOrders,buyers,products}) => {
  const [toast,setToast]=useState(null);
  const showToast=m=>{setToast(m);setTimeout(()=>setToast(null),3000);};
  const invoiced=orders.filter(o=>o.invoice);

  const markPaid=id=>{
    setOrders(prev=>prev.map(o=>o.id===id?{...o,invoice:{...o.invoice,paid:true}}:o));
    showToast("Payment recorded ✓");
  };

  const overdue=invoiced.filter(o=>!o.invoice.paid&&o.invoice.due<today());
  const unpaid=invoiced.filter(o=>!o.invoice.paid);
  const totalOR=unpaid.reduce((s,o)=>s+oGrand(o.items),0);

  return (
    <Section title="GST Invoices" sub="E-Invoices with IRN . IRP registered . 30-day upload mandate tracked">
      {toast&&<Alert type="success" ch={toast}/>}
      {overdue.length>0&&<Alert type="error" ch={`${overdue.length} invoice(s) are OVERDUE (past 45-day MSME limit). Compound interest at 3x RBI rate applies. Consider filing on MSME Samadhaan portal.`}/>}

      {/* Summary */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:14,marginBottom:20}}>
        {[
          {label:"Total Invoices",val:invoiced.length,c:C.brand},
          {label:"Outstanding",val:cur(totalOR),c:C.redL},
          {label:"Overdue (>45 days)",val:overdue.length,c:C.red},
          {label:"Paid",val:invoiced.filter(o=>o.invoice.paid).length,c:C.green},
        ].map((k,i)=>(
          <Card key={i} style={{padding:"14px 18px"}}>
            <div style={{fontSize:10,color:C.faint,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>{k.label}</div>
            <div style={{fontSize:22,fontWeight:800,color:k.c}}>{k.val}</div>
          </Card>
        ))}
      </div>

      {!invoiced.length
        ?<Card style={{padding:48,textAlign:"center"}}><div style={{color:C.mid}}>No invoices yet. Dispatch an order to generate the first invoice.</div></Card>
        :invoiced.map(o=>{
          const buyer=buyers.find(b=>b.id===o.buyerId);
          const base=oBase(o.items),gst=oGST(o.items),grand=base+gst;
          const isOverdue=!o.invoice.paid&&o.invoice.due<today();
          const daysDue=Math.floor((new Date()-new Date(o.invoice.due))/(1000*60*60*24));
          return <Card key={o.id} style={{marginBottom:16,border:`1px solid ${isOverdue?C.red+"55":o.invoice.paid?C.green+"33":C.border}`}}>
            {/* Invoice header */}
            <div style={{padding:"18px 20px",borderBottom:`1px solid ${C.line}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
                    <span style={{fontSize:15,fontWeight:800,color:C.brandHov,fontFamily:"'Courier New',monospace"}}>{o.invoice.no}</span>
                    <Pill label="IRN ✓" c={C.green}/>
                    <Pill label="IRP Registered" c={C.teal}/>
                    {o.invoice.paid
                      ?<Pill label="PAID" c={C.green} icon="✓"/>
                      :isOverdue
                        ?<Pill label={`OVERDUE ${daysDue}d`} c={C.red} icon="🚨"/>
                        :<Pill label="Unpaid" c={C.gold} icon="⏳"/>}
                  </div>
                  <div style={{fontSize:13,fontWeight:600,color:C.ink}}>{(buyer && buyer.name)}</div>
                  <div style={{fontSize:11,color:C.faint}}>GSTIN: {(buyer && buyer.gstin)} . {(buyer && buyer.city)}</div>
                  <div style={{fontSize:11,color:C.faint,marginTop:2}}>Invoice: {o.invoice.date} . Order: {o.id}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:26,fontWeight:900,color:C.ink}}>{cur(grand)}</div>
                  <div style={{fontSize:11,color:C.faint}}>{cur(base)} + GST {cur(gst)}</div>
                  <div style={{fontSize:12,fontWeight:700,color:isOverdue?C.red:C.goldL,marginTop:4}}>
                    Due: {o.invoice.due}{isOverdue&&" ⚠️ OVERDUE"}
                  </div>
                </div>
              </div>
            </div>
            {/* Line items */}
            <div style={{padding:"14px 20px",borderBottom:`1px solid ${C.line}`}}>
              <table style={{width:"100%",borderCollapse:"collapse"}}>
                <thead><tr>
                  {["Item","HSN","Qty","Rate","GST%","GST Amt","Total"].map(h=>(
                    <th key={h} style={{padding:"6px 10px",fontSize:10,color:C.faint,
                      textAlign:["Qty","Rate","GST%","GST Amt","Total"].includes(h)?"right":"left",
                      textTransform:"uppercase",letterSpacing:0.8,background:C.muted}}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {o.items.map(i=>{
                    const p=products.find(x=>x.id===i.pid);
                    const b=i.qty*i.price,g=b*i.gst/100;
                    return <tr key={i.pid}>
                      <td style={{padding:"7px 10px",fontSize:13,color:C.ink,fontWeight:600,borderBottom:`1px solid ${C.line}`}}>{(p && p.name)}</td>
                      <td style={{padding:"7px 10px",fontSize:11,fontFamily:"'Courier New',monospace",color:C.mid,borderBottom:`1px solid ${C.line}`}}>{(p && p.hsn)}</td>
                      <td style={{padding:"7px 10px",fontSize:13,textAlign:"right",color:C.mid,borderBottom:`1px solid ${C.line}`}}>{fmtN(i.qty)} {(p && p.unit)}</td>
                      <td style={{padding:"7px 10px",fontSize:13,textAlign:"right",color:C.mid,borderBottom:`1px solid ${C.line}`}}>{cur(i.price)}</td>
                      <td style={{padding:"7px 10px",fontSize:13,textAlign:"right",color:C.mid,borderBottom:`1px solid ${C.line}`}}>{i.gst}%</td>
                      <td style={{padding:"7px 10px",fontSize:13,textAlign:"right",color:C.mid,borderBottom:`1px solid ${C.line}`}}>{cur(g)}</td>
                      <td style={{padding:"7px 10px",fontSize:13,textAlign:"right",fontWeight:700,color:C.ink,borderBottom:`1px solid ${C.line}`}}>{cur(b+g)}</td>
                    </tr>;
                  })}
                </tbody>
              </table>
            </div>
            {/* IRN + Dispatch */}
            <div style={{padding:"12px 20px",borderBottom:`1px solid ${C.line}`,background:C.raised}}>
              <div style={{fontSize:10,color:C.teal,fontWeight:700,letterSpacing:1,marginBottom:3}}>IRN - INVOICE REFERENCE NUMBER</div>
              <div style={{fontSize:11,color:C.mid,fontFamily:"'Courier New',monospace",wordBreak:"break-all"}}>{o.invoice.irn}</div>
              {o.dispatch&&<div style={{fontSize:11,color:C.faint,marginTop:6}}>
                 Dispatched: {o.dispatch.date} . Vehicle: {o.dispatch.vehicle} . {o.dispatch.transporter}
                {o.dispatch.ewb&&<> . EWB: <span style={{color:C.accent}}>{o.dispatch.ewb}</span></>}
              </div>}
            </div>
            {/* Actions */}
            <div style={{padding:"12px 20px",display:"flex",gap:8,flexWrap:"wrap"}}>
              <Btn ch="📧 Email Invoice" sm color={C.brand}/>
              <Btn ch="📱 WhatsApp PDF" sm color={C.green}/>
              <Btn ch="⬇ Download PDF" sm outline color={C.mid}/>
              {isOverdue&&<Btn ch="⚖️ File Samadhaan" sm color={C.red}/>}
              {!o.invoice.paid&&<Btn ch="💳 Mark as Paid" sm color={C.green} onClick={()=>markPaid(o.id)}/>}
              {o.invoice.paid&&<Pill label="Payment Recorded ✓" c={C.green}/>}
            </div>
            {isOverdue&&(
              <div style={{margin:"0 20px 16px",background:C.red+"11",border:`1px solid ${C.red}44`,borderRadius:8,padding:"10px 14px",fontSize:12,color:C.redL}}>
                 <strong>MSME Alert:</strong> Payment overdue by {daysDue} days.
                Compound interest at 3x RBI bank rate (~19% p.a.) is now applicable.
                {(buyer && buyer.msme)&&" Buyer's expense deduction is disallowed under Section 43B(h) of Income Tax Act."}
                {" "}MSME Samadhaan complaint can be filed.
              </div>
            )}
          </Card>;
        })}
    </Section>
  );
};

//
//  ROOT APP
//
export default function App() {
  const [page,setPage]=useState("dashboard");
  const [products,setProducts]=useState(initProducts);
  const [ledger,setLedger]=useState(initLedger);
  const [buyers,setBuyers]=useState(initBuyers);
  const [orders,setOrders]=useState(initOrders);

  // sidebar badge counts
  const counts={
    orders:orders.filter(o=>o.status==="pending").length,
    dispatch:orders.filter(o=>o.status==="approved").length,
    buyers:buyers.filter(b=>b.status==="pending").length,
    invoices:orders.filter(o=>o.invoice&&!o.invoice.paid).length,
  };

  const pageEl = {
    dashboard:<Dashboard products={products} ledger={ledger} orders={orders} buyers={buyers}/>,
    products:  <Products products={products} setProducts={setProducts} setLedger={setLedger}/>,
    ledger:    <Ledger products={products} ledger={ledger}/>,
    adjust:    <Adjust products={products} setProducts={setProducts} setLedger={setLedger}/>,
    buyers:    <Buyers buyers={buyers} setBuyers={setBuyers} orders={orders}/>,
    orders:    <Orders orders={orders} setOrders={setOrders} buyers={buyers} products={products} setPage={setPage}/>,
    dispatch:  <Dispatch orders={orders} setOrders={setOrders} buyers={buyers} products={products} setLedger={setLedger}/>,
    invoices:  <Invoices orders={orders} setOrders={setOrders} buyers={buyers} products={products}/>,
  }[page];

  return (
    <div style={{display:"flex",minHeight:"100vh",background:C.bg,
      fontFamily:"'DM Sans','Segoe UI',system-ui,sans-serif",color:C.ink}}>
      <Sidebar page={page} setPage={setPage} counts={counts}/>
      <main style={{flex:1,padding:"28px 32px",overflowY:"auto",maxHeight:"100vh"}}>
        {pageEl}
      </main>
    </div>
  );
}
