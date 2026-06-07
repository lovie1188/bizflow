import { useState, useCallback } from "react";

const C = {
  bg: "#07090F", surface: "#0D1117", card: "#111827", raised: "#161F30",
  border: "#1E2D3D", muted: "#243447",
  brand: "#1D4ED8", brandHov: "#2563EB", brandGlow: "#1D4ED833",
  accent: "#EA580C", accentGlow: "#EA580C22",
  green: "#059669", greenL: "#10B981",
  red: "#DC2626", redL: "#EF4444",
  gold: "#D97706", goldL: "#F59E0B",
  purple: "#7C3AED", teal: "#0891B2",
  ink: "#F1F5F9", mid: "#94A3B8", faint: "#475569", line: "#1E2D3D",
};

const fmtN = n => new Intl.NumberFormat("en-IN").format(Math.round(n));
const fmtD = n => new Intl.NumberFormat("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2}).format(n);
const cur = n => "Rs " + fmtD(n);
const today = () => new Date().toISOString().slice(0,10);
const addD = (d,n)=>{ const dt=new Date(d); dt.setDate(dt.getDate()+n); return dt.toISOString().slice(0,10); };
const daysBetween = (d1, d2) => Math.floor((new Date(d2) - new Date(d1)) / (1000*60*60*24));
const compoundInterest = (principal, daysOverdue) => {
  const monthsOverdue = daysOverdue / 30;
  const monthlyRate = 0.015;
  return principal * (Math.pow(1 + monthlyRate, monthsOverdue) - 1);
};

const oBase = items => items.reduce((s,i)=>s+i.qty*i.price,0);
const oGST = items => items.reduce((s,i)=>s+i.qty*i.price*i.gst/100,0);
const oGrand = items => oBase(items)+oGST(items);
const genIRN = () => Array.from({length:32},()=>"0123456789abcdef"[Math.floor(Math.random()*16)]).join("");
const genEWB = () => "EWB-"+Math.floor(1000000000+Math.random()*9000000000);
const newId = () => Date.now();

const generateUPILink = (upiId, name, amount, description) => {
  return `upi://pay?pa=${upiId}&pn=${encodeURIComponent(name)}&am=${amount}&tn=${encodeURIComponent(description)}`;
};
const generateQRCode = (upiLink) => {
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(upiLink)}`;
};

// SEED DATA
const initProducts = [
  { id:1, sku:"BF-001", name:"Cotton Fabric (White)", cat:"Fabric", hsn:"520811", gst:5, unit:"Metre", buyPrice:85, tradePrice:120, mrp:150, reorder:500, stock:2340, active:true },
  { id:2, sku:"BF-002", name:"Polyester Blend Fabric", cat:"Fabric", hsn:"540742", gst:12, unit:"Metre", buyPrice:65, tradePrice:95, mrp:130, reorder:300, stock:85, active:true },
  { id:3, sku:"BF-003", name:"Denim Fabric (Blue)", cat:"Fabric", hsn:"520942", gst:5, unit:"Metre", buyPrice:145, tradePrice:200, mrp:260, reorder:200, stock:0, active:true },
  { id:4, sku:"CH-001", name:"Brass Zip 20cm", cat:"Accessories", hsn:"963200", gst:18, unit:"Nos", buyPrice:8, tradePrice:15, mrp:20, reorder:1000, stock:4500, active:true },
  { id:5, sku:"CH-002", name:"Plastic Buttons (12mm)", cat:"Accessories", hsn:"960610", gst:12, unit:"Nos", buyPrice:1.5, tradePrice:3, mrp:5, reorder:2000, stock:420, active:true },
  { id:6, sku:"TH-001", name:"Polyester Thread (Black)", cat:"Thread", hsn:"540200", gst:12, unit:"Box", buyPrice:280, tradePrice:380, mrp:450, reorder:50, stock:180, active:true },
  { id:7, sku:"TH-002", name:"Cotton Thread (Assorted)", cat:"Thread", hsn:"520400", gst:5, unit:"Box", buyPrice:320, tradePrice:440, mrp:520, reorder:40, stock:22, active:true },
];

const initLedger = [
  { id:1, pid:1, type:"OPENING", qty:3000, bal:3000, date:"2026-04-01", ref:"Opening Entry", by:"Admin", note:"" },
  { id:2, pid:1, type:"DISPATCH", qty:-660, bal:2340, date:"2026-04-05", ref:"ORD-2026-001", by:"System", note:"" },
  { id:3, pid:2, type:"OPENING", qty:500, bal:500, date:"2026-04-01", ref:"Opening Entry", by:"Admin", note:"" },
  { id:4, pid:2, type:"DISPATCH", qty:-415, bal:85, date:"2026-04-10", ref:"ORD-2026-002", by:"System", note:"" },
  { id:5, pid:3, type:"OPENING", qty:200, bal:200, date:"2026-04-01", ref:"Opening Entry", by:"Admin", note:"" },
  { id:6, pid:3, type:"DISPATCH", qty:-200, bal:0, date:"2026-04-12", ref:"ORD-2026-003", by:"System", note:"" },
  { id:7, pid:4, type:"OPENING", qty:5000, bal:5000, date:"2026-04-01", ref:"Opening Entry", by:"Admin", note:"" },
  { id:8, pid:4, type:"DISPATCH", qty:-500, bal:4500, date:"2026-04-08", ref:"ORD-2026-001", by:"System", note:"" },
  { id:9, pid:5, type:"OPENING", qty:3000, bal:3000, date:"2026-04-01", ref:"Opening Entry", by:"Admin", note:"" },
  { id:10, pid:5, type:"DISPATCH", qty:-2580, bal:420, date:"2026-04-14", ref:"ORD-2026-004", by:"System", note:"" },
];

const initBuyers = [
  { id:1, name:"Sharma Textiles Pvt Ltd", gstin:"27AABCU9603R1ZX", pan:"AABCU9603R", phone:"9876543210", email:"sharma@textiles.com", city:"Mumbai", state:"Maharashtra", creditLimit:200000, msme:"UDYAM-MH-01-0012345", type:"Pvt Ltd", status:"approved", joined:"2026-01-15", riskScore:85 },
  { id:2, name:"Gupta Garments", gstin:"07AAACG1234C1Z5", pan:"AAACG1234C", phone:"9812345678", email:"gupta@garments.in", city:"Delhi", state:"Delhi", creditLimit:100000, msme:"", type:"Proprietor", status:"approved", joined:"2026-02-10", riskScore:42 },
  { id:3, name:"Rajasthan Fabrics LLP", gstin:"08AABFR5678D1ZP", pan:"AABFR5678D", phone:"9001234567", email:"raj@fabrics.com", city:"Jaipur", state:"Rajasthan", creditLimit:150000, msme:"UDYAM-RJ-03-0067890", type:"LLP", status:"pending", joined:"2026-04-18", riskScore:0 },
];

const initOrders = [
  { id:"ORD-2026-001", buyerId:1, date:"2026-04-10", status:"dispatched", items:[{pid:1,qty:500,price:120,gst:5},{pid:4,qty:200,price:15,gst:18}], addr:"Unit 4, Dharavi Industrial Estate, Mumbai 400017", notes:"", dispatch:{date:"2026-04-12",vehicle:"MH12AB1234",transporter:"Shree Cargo",ewb:"EWB-7892341567"}, invoice:{no:"INV-2026-001",date:"2026-04-12",irn:"a3f9b2c1d4e5f6a7b8c9d0e1f2a3b4c5",due:"2026-05-27",paid:false} },
  { id:"ORD-2026-002", buyerId:2, date:"2026-04-14", status:"approved", items:[{pid:6,qty:20,price:380,gst:12},{pid:7,qty:10,price:440,gst:5}], addr:"45 Gandhi Nagar, Shahdara, Delhi 110032", notes:"Urgent", dispatch:null, invoice:null },
  { id:"ORD-2026-003", buyerId:1, date:"2026-04-18", status:"pending", items:[{pid:2,qty:80,price:95,gst:12}], addr:"Unit 4, Dharavi Industrial Estate, Mumbai 400017", notes:"", dispatch:null, invoice:null },
];

const initBanks = [
  { id: 1, accountName: "Primary - HDFC", bankName: "HDFC Bank", accountNo: "****1234", ifsc: "HDFC0001234", upiId: "bizflow@hdfc", ownerName: "BizFlow India", active: true, default: true },
  { id: 2, accountName: "Secondary - ICICI", bankName: "ICICI Bank", accountNo: "****5678", ifsc: "ICIC0005678", upiId: "bizflow@icici", ownerName: "BizFlow India", active: true, default: false },
];

const initPayments = [
  { id: "PAY-2026-001", invoiceNo: "INV-2026-001", amount: 71400, buyerName: "Sharma Textiles", dueDate: "2026-05-27", status: "pending", type: "online", paymentDate: null, utrNo: null, notes: "", createdBy: "System", approvedBy: null, approvalDate: null },
  { id: "PAY-2026-002", invoiceNo: "INV-2026-002", amount: 9300, buyerName: "Gupta Garments", dueDate: "2026-05-29", status: "pending", type: "online", paymentDate: null, utrNo: null, notes: "", createdBy: "System", approvedBy: null, approvalDate: null },
  { id: "PAY-2026-003", invoiceNo: "INV-2026-003", amount: 19200, buyerName: "Sharma Textiles", dueDate: "2026-05-25", status: "offline_pending", type: "offline", paymentDate: "2026-04-26", utrNo: "HDFC20260426001", notes: "Cheque #1001 deposited", createdBy: "Admin", approvedBy: null, approvalDate: null },
];

// ---- UI ATOMS ----
const Btn = ({ch,onClick,color=C.brand,sm,outline,full,disabled}) => (
  <button onClick={disabled?undefined:onClick} style={{
    padding:sm?"6px 12px":"9px 18px",borderRadius:7,border:outline?`1px solid ${color}`:"none",
    cursor:disabled?"not-allowed":"pointer",background:outline?"transparent":color,color:outline?color:"#fff",
    opacity:disabled?0.5:1,fontSize:sm?11:13,fontWeight:700,fontFamily:"inherit",
    display:"inline-flex",alignItems:"center",gap:5,width:full?"100%":undefined,justifyContent:full?"center":undefined}}>
    {ch}
  </button>
);

const Pill = ({label,c,bg,icon}) => (
  <span style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:11,fontWeight:700,
    padding:"3px 9px",borderRadius:20,background:bg||c+"22",color:c,letterSpacing:0.3,whiteSpace:"nowrap"}}>
    {icon&&<span>{icon}</span>}{label}
  </span>
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
  <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:3000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,width:"100%",maxWidth:wide?820:520,maxHeight:"90vh",overflowY:"auto",boxShadow:"0 40px 120px rgba(0,0,0,0.8)"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",padding:"20px 24px 16px",borderBottom:`1px solid ${C.border}`}}>
        <div>
          <div style={{fontSize:17,fontWeight:800,color:C.ink}}>{title}</div>
          {sub&&<div style={{fontSize:12,color:C.mid,marginTop:3}}>{sub}</div>}
        </div>
        <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:C.mid,fontSize:20,lineHeight:1,padding:4}}>x</button>
      </div>
      <div style={{padding:"20px 24px"}}>{children}</div>
    </div>
  </div>
);

const Alert = ({type,ch}) => {
  const colors = {success:{bg:C.green+"15",border:C.green+"44",c:C.greenL},warn:{bg:C.gold+"15",border:C.gold+"44",c:C.goldL},error:{bg:C.red+"15",border:C.red+"44",c:C.redL}};
  const s=colors[type]||colors.warn;
  return <div style={{background:s.bg,border:`1px solid ${s.border}`,borderRadius:9,padding:"11px 16px",marginBottom:16,fontSize:13,color:s.c,display:"flex",gap:8,alignItems:"flex-start"}}>
    <span style={{fontWeight:800}}>{type==="success"?"OK":type==="error"?"X":"!"}</span><span>{ch}</span>
  </div>;
};

const Inp = ({label,value,onChange,type="text",placeholder,opts,req,note}) => (
  <div style={{display:"flex",flexDirection:"column",gap:4,flex:1,minWidth:120}}>
    {label&&<label style={{fontSize:10,color:C.mid,letterSpacing:1,textTransform:"uppercase",fontWeight:700}}>
      {label}{req&&<span style={{color:C.red}}> *</span>}
    </label>}
    {opts
      ? <select value={value} onChange={e=>onChange(e.target.value)} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:7,padding:"9px 11px",color:C.ink,fontSize:13,outline:"none",fontFamily:"inherit"}}>
          {opts.map(o=><option key={o}>{o}</option>)}
        </select>
      : <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:7,padding:"9px 11px",color:C.ink,fontSize:13,outline:"none",fontFamily:"inherit"}}/>
    }
    {note&&<span style={{fontSize:10,color:C.faint}}>{note}</span>}
  </div>
);

// ---- SIDEBAR ----
const NAV_GROUPS = [
  { group:"PHASE 1 - STOCK", items:[
    {key:"dashboard", icon:"[=]", label:"Dashboard"},
    {key:"products", icon:"[*]", label:"Products"},
    {key:"ledger", icon:"[~]", label:"Stock Ledger"},
    {key:"adjust", icon:"[T]", label:"Adjust Stock"},
  ]},
  { group:"PHASE 2 - ORDERS", items:[
    {key:"buyers", icon:"[P]", label:"Buyers"},
    {key:"orders", icon:"[B]", label:"Orders"},
    {key:"dispatch", icon:"[D]", label:"Dispatch Queue"},
    {key:"invoices", icon:"[I]", label:"GST Invoices"},
  ]},
  { group:"PHASE 3 - PAYMENTS", items:[
    {key:"paymentlinks", icon:"[$]", label:"Payment Links"},
    {key:"banksetup", icon:"[+]", label:"Bank Setup"},
    {key:"offlinepay", icon:"[C]", label:"Offline Payments"},
    {key:"collections", icon:"[!]", label:"Collections Tracker"},
  ]},
];

const Sidebar = ({page,setPage,counts}) => (
  <div style={{width:224,minHeight:"100vh",background:C.surface,borderRight:`1px solid ${C.border}`,display:"flex",flexDirection:"column",flexShrink:0}}>
    <div style={{padding:"22px 18px 16px",borderBottom:`1px solid ${C.border}`}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <div style={{width:34,height:34,borderRadius:8,background:`linear-gradient(135deg,${C.brand},${C.accent})`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,color:"#fff",fontSize:17}}>B</div>
        <div>
          <div style={{fontSize:15,fontWeight:800,color:C.ink,letterSpacing:-0.3}}>BizFlow</div>
          <div style={{fontSize:9,color:C.faint,letterSpacing:2,textTransform:"uppercase"}}>Complete Suite</div>
        </div>
      </div>
    </div>
    <nav style={{padding:"10px 8px",flex:1,overflowY:"auto"}}>
      {NAV_GROUPS.map(g=>(
        <div key={g.group} style={{marginBottom:20}}>
          <div style={{fontSize:9,color:C.faint,letterSpacing:2,fontWeight:700,textTransform:"uppercase",padding:"0 10px",marginBottom:6}}>{g.group}</div>
          {g.items.map(n=>{
            const active=page===n.key;
            const cnt=counts&&counts[n.key];
            return (
              <button key={n.key} onClick={()=>setPage(n.key)} style={{
                display:"flex",alignItems:"center",gap:9,width:"100%",padding:"9px 12px",borderRadius:8,border:"none",cursor:"pointer",
                marginBottom:2,fontFamily:"inherit",background:active?C.brand+"28":"transparent",color:active?C.brandHov:C.mid,fontWeight:active?700:400,fontSize:13,borderLeft:active?`3px solid ${C.brand}`:"3px solid transparent"}}>
                <span style={{fontSize:14}}>{n.icon}</span>
                <span style={{flex:1,textAlign:"left"}}>{n.label}</span>
                {cnt>0&&<span style={{background:C.accent,color:"#fff",borderRadius:10,fontSize:10,fontWeight:700,padding:"1px 6px",lineHeight:1.4}}>{cnt}</span>}
              </button>
            );
          })}
        </div>
      ))}
    </nav>
    <div style={{padding:"14px 18px",borderTop:`1px solid ${C.border}`}}>
      <div style={{fontSize:10,color:C.faint,marginBottom:2}}>GSTIN</div>
      <div style={{fontSize:11,color:C.mid,fontWeight:600,fontFamily:"monospace"}}>27AABCU9603R1ZX</div>
      <div style={{fontSize:10,color:C.green,marginTop:5}}>OK Active - April 2026</div>
    </div>
  </div>
);

// ---- PHASE 1: DASHBOARD ----
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
    {label:"Stock Value (Cost)",val:cur(stockVal),icon:"Rs",c:C.brand, sub:"At purchase price"},
    {label:"Realisable Value",val:cur(tradeVal),icon:"[^]",c:C.green, sub:"At trade price"},
    {label:"Pending Orders",val:pendingOrders.length,icon:"[?]",c:C.gold, sub:"Awaiting approval"},
    {label:"Dispatch Queue",val:dispatchQ.length,icon:"[>]",c:C.accent,sub:"Ready to ship"},
    {label:"Outstanding Invoices",val:cur(totalReceivable),icon:"$",c:C.red,sub:"Unpaid receivables"},
    {label:"Buyers Pending KYC",val:pendingBuyers.length,icon:"[+]",c:C.purple,sub:"Need approval"},
    {label:"Low Stock Items",val:lowStock.length,icon:"[!]",c:C.goldL, sub:"Below reorder level"},
    {label:"Out of Stock",val:outStock.length,icon:"[X]",c:C.redL,  sub:"Zero stock - urgent"},
  ];

  return (
    <Section title="Dashboard" sub={`Overview - ${today()}`}>
      {(outStock.length>0||pendingOrders.length>0)&&<Alert type="warn" ch={[outStock.length>0&&`${outStock.length} product(s) out of stock`,pendingOrders.length>0&&`${pendingOrders.length} order(s) awaiting approval`].filter(Boolean).join(" - ")}/>}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(210px,1fr))",gap:14,marginBottom:28}}>
        {kpis.map((k,i)=>(
          <Card key={i} style={{padding:"18px 20px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div>
                <div style={{fontSize:10,color:C.faint,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>{k.label}</div>
                <div style={{fontSize:24,fontWeight:800,color:k.c,letterSpacing:-0.5}}>{k.val}</div>
                <div style={{fontSize:11,color:C.faint,marginTop:4}}>{k.sub}</div>
              </div>
              <span style={{fontSize:18}}>{k.icon}</span>
            </div>
          </Card>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <Card style={{padding:20}}>
          <div style={{fontSize:13,fontWeight:700,color:C.ink,marginBottom:14}}>[!] Stock Alerts</div>
          {[...outStock,...lowStock].slice(0,6).map(p=>{
            const b=p.stock===0?{label:"Out of Stock",c:C.red,bg:C.red+"22"}:p.stock<p.reorder?{label:"Low Stock",c:C.gold,bg:C.gold+"22"}:{label:"In Stock",c:C.green,bg:C.green+"22"};
            return <div key={p.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:`1px solid ${C.line}`}}>
              <div>
                <div style={{fontSize:13,color:C.ink,fontWeight:600}}>{p.name}</div>
                <div style={{fontSize:11,color:C.faint}}>{p.sku} - reorder@{fmtN(p.reorder)}</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:14,fontWeight:800,color:b.c}}>{fmtN(p.stock)}</div>
                <Pill label={b.label} c={b.c} bg={b.bg}/>
              </div>
            </div>;
          })}
        </Card>
        <Card style={{padding:20}}>
          <div style={{fontSize:13,fontWeight:700,color:C.ink,marginBottom:14}}>[~] Recent Stock Movements</div>
          {recent.map(l=>{
            const p=products.find(x=>x.id===l.pid);
            return <div key={l.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:`1px solid ${C.line}`}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,color:C.ink,fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{p?.name}</div>
                <div style={{fontSize:11,color:C.faint}}>{l.date} - {l.ref}</div>
              </div>
              <div style={{textAlign:"right",marginLeft:12}}>
                <div style={{fontSize:13,fontWeight:700,color:l.qty>0?C.green:C.accent}}>{l.qty>0?"+":""}{fmtN(l.qty)}</div>
                <Pill label={l.type} c={l.type==="OPENING"?C.brand:l.type==="PURCHASE"?C.green:l.type==="DISPATCH"?C.accent:l.type==="DAMAGE"?C.red:C.mid}/>
              </div>
            </div>;
          })}
        </Card>
      </div>
    </Section>
  );
};

// ---- PHASE 1: PRODUCTS (simplified) ----
const Products = ({products,setProducts,setLedger}) => {
  const [search,setSearch]=useState("");
  const filtered=products.filter(p=>p.name.toLowerCase().includes(search.toLowerCase())||p.sku.toLowerCase().includes(search.toLowerCase()));
  return (
    <Section title="Products" sub={`${products.filter(p=>p.active).length} active`} action={<Btn ch="+ Add Product"/>}>
      <div style={{marginBottom:16}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name or SKU..."
          style={{width:"100%",maxWidth:280,background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,padding:"9px 13px",color:C.ink,fontSize:13,outline:"none"}}/>
      </div>
      <Card style={{overflow:"hidden",padding:0}}>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr style={{background:C.muted}}>
              <th style={{padding:"10px 12px",textAlign:"left",fontSize:10,color:C.mid,fontWeight:700,textTransform:"uppercase"}}>SKU</th>
              <th style={{padding:"10px 12px",textAlign:"left",fontSize:10,color:C.mid,fontWeight:700,textTransform:"uppercase"}}>Product</th>
              <th style={{padding:"10px 12px",textAlign:"left",fontSize:10,color:C.mid,fontWeight:700,textTransform:"uppercase"}}>Cat</th>
              <th style={{padding:"10px 12px",textAlign:"left",fontSize:10,color:C.mid,fontWeight:700,textTransform:"uppercase"}}>HSN</th>
              <th style={{padding:"10px 12px",textAlign:"center",fontSize:10,color:C.mid,fontWeight:700,textTransform:"uppercase"}}>Stock</th>
              <th style={{padding:"10px 12px",textAlign:"right",fontSize:10,color:C.mid,fontWeight:700,textTransform:"uppercase"}}>Trade Price</th>
              <th style={{padding:"10px 12px",textAlign:"center",fontSize:10,color:C.mid,fontWeight:700,textTransform:"uppercase"}}>Status</th>
            </tr></thead>
            <tbody>
              {filtered.map(p=>{
                const b=p.stock===0?{label:"Out",c:C.red,bg:C.red+"22"}:p.stock<p.reorder?{label:"Low",c:C.gold,bg:C.gold+"22"}:{label:"OK",c:C.green,bg:C.green+"22"};
                return <tr key={p.id} style={{borderBottom:`1px solid ${C.line}`,opacity:p.active?1:0.4}}>
                  <td style={{padding:"10px 12px",fontSize:11,fontFamily:"monospace",color:C.brandHov,fontWeight:700}}>{p.sku}</td>
                  <td style={{padding:"10px 12px",fontSize:13,color:C.ink,fontWeight:600}}>{p.name}</td>
                  <td style={{padding:"10px 12px",fontSize:12,color:C.mid}}>{p.cat}</td>
                  <td style={{padding:"10px 12px",fontSize:11,fontFamily:"monospace",color:C.mid}}>{p.hsn}</td>
                  <td style={{padding:"10px 12px",fontSize:12,textAlign:"center",color:C.ink,fontWeight:700}}>{fmtN(p.stock)}</td>
                  <td style={{padding:"10px 12px",fontSize:12,textAlign:"right",fontWeight:700,color:C.brandHov}}>{cur(p.tradePrice)}</td>
                  <td style={{padding:"10px 12px",textAlign:"center"}}><Pill label={b.label} c={b.c} bg={b.bg}/></td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </Section>
  );
};

// ---- PHASE 1: STOCK LEDGER ----
const Ledger = ({products,ledger}) => {
  const [pf,setPf]=useState("All");
  const rows=[...ledger].filter(l=>pf==="All"||l.pid===+pf).sort((a,b)=>new Date(b.date)-new Date(a.date));
  return (
    <Section title="Stock Ledger" sub="Complete audit trail of every movement">
      <div style={{marginBottom:16}}>
        <select value={pf} onChange={e=>setPf(e.target.value)} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,padding:"9px 13px",color:C.ink,fontSize:13,outline:"none"}}>
          <option value="All">All Products</option>
          {products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>
      <Card style={{overflow:"hidden",padding:0}}>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr style={{background:C.muted}}>
              <th style={{padding:"10px 12px",textAlign:"left",fontSize:10,color:C.mid,fontWeight:700,textTransform:"uppercase"}}>Date</th>
              <th style={{padding:"10px 12px",textAlign:"left",fontSize:10,color:C.mid,fontWeight:700,textTransform:"uppercase"}}>Product</th>
              <th style={{padding:"10px 12px",textAlign:"center",fontSize:10,color:C.mid,fontWeight:700,textTransform:"uppercase"}}>Type</th>
              <th style={{padding:"10px 12px",textAlign:"right",fontSize:10,color:C.mid,fontWeight:700,textTransform:"uppercase"}}>Qty</th>
              <th style={{padding:"10px 12px",textAlign:"right",fontSize:10,color:C.mid,fontWeight:700,textTransform:"uppercase"}}>Balance</th>
              <th style={{padding:"10px 12px",textAlign:"left",fontSize:10,color:C.mid,fontWeight:700,textTransform:"uppercase"}}>Reference</th>
            </tr></thead>
            <tbody>
              {rows.map(l=>{
                const p=products.find(x=>x.id===l.pid);
                const tc={OPENING:C.brand,PURCHASE:C.green,DISPATCH:C.accent,DAMAGE:C.red,ADJUSTMENT:C.mid}[l.type]||C.mid;
                return <tr key={l.id} style={{borderBottom:`1px solid ${C.line}`}}>
                  <td style={{padding:"10px 12px",fontSize:12,color:C.mid}}>{l.date}</td>
                  <td style={{padding:"10px 12px",fontSize:12,color:C.ink,fontWeight:600}}>{p?.name}</td>
                  <td style={{padding:"10px 12px",fontSize:11,textAlign:"center"}}><Pill label={l.type} c={tc}/></td>
                  <td style={{padding:"10px 12px",fontSize:12,textAlign:"right",color:l.qty>0?C.greenL:C.accent,fontWeight:700}}>{l.qty>0?"+":""}{fmtN(l.qty)}</td>
                  <td style={{padding:"10px 12px",fontSize:12,textAlign:"right",fontWeight:700,color:C.ink}}>{fmtN(l.bal)}</td>
                  <td style={{padding:"10px 12px",fontSize:11,fontFamily:"monospace",color:C.mid}}>{l.ref}</td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </Section>
  );
};

// ---- PHASE 1: ADJUST STOCK ----
const Adjust = ({products,setProducts,setLedger}) => {
  const [form,setForm]=useState({pid:"",type:"PURCHASE",qty:"",note:""});
  const [confirm,setConfirm]=useState(null);
  const [toast,setToast]=useState(null);
  const selP=products.find(p=>p.id===+form.pid);
  const isOut=["DISPATCH","DAMAGE"].includes(form.type);
  const delta=+form.qty*(isOut?-1:1);
  const newBal=selP?selP.stock+delta:null;
  return (
    <Section title="Adjust Stock" sub="Record purchases, returns, damage, and manual corrections">
      {toast&&<Alert type="success" ch={toast}/>}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
        <Card style={{padding:24}}>
          <div style={{fontSize:14,fontWeight:700,color:C.ink,marginBottom:18}}>Adjustment Form</div>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <Inp label="Product" value={form.pid} onChange={v=>setForm(f=>({...f,pid:v}))} opts={[...[""],products.filter(p=>p.active).map(p=>p.id+"")].map(x=>x?products.find(p=>p.id===+x)?.name:"")}/>
            <Inp label="Type" value={form.type} onChange={v=>setForm(f=>({...f,type:v}))} opts={["PURCHASE","RETURN","DAMAGE","ADJUSTMENT"]}/>
            <Inp label="Quantity" value={form.qty} onChange={v=>setForm(f=>({...f,qty:v}))} type="number" placeholder="Enter qty" req/>
            <Inp label="Notes" value={form.note} onChange={v=>setForm(f=>({...f,note:v}))} placeholder="Invoice/GRN/reason"/>
            {selP&&form.qty>0&&<div style={{background:C.raised,border:`1px solid ${C.border}`,borderRadius:8,padding:"12px 14px"}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                <span style={{fontSize:12,color:C.mid}}>Current stock</span>
                <strong style={{color:C.ink,fontSize:13}}>{fmtN(selP.stock)} {selP.unit}</strong>
              </div>
              <div style={{display:"flex",justifyContent:"space-between"}}>
                <span style={{fontSize:12,color:C.mid}}>After adjustment</span>
                <strong style={{fontSize:14,color:newBal>=0?C.greenL:C.red}}>{fmtN(newBal)} {selP.unit}</strong>
              </div>
            </div>}
            <Btn ch="Record Movement" onClick={()=>{if(!form.pid||!form.qty||+form.qty<=0) return;setConfirm({...form,prod:selP,delta,newBal});}} full disabled={!form.pid||!form.qty||+form.qty<=0||newBal<0}/>
          </div>
        </Card>
        <Card style={{padding:24}}>
          <div style={{fontSize:14,fontWeight:700,color:C.ink,marginBottom:16}}>Transaction Guide</div>
          {[{type:"PURCHASE",icon:"[*]",c:C.greenL,desc:"Goods received from supplier. Adds to stock with GRN reference."},{type:"RETURN",icon:"[<]",c:C.goldL,desc:"Buyer returns goods. Stock re-added to warehouse."},{type:"DAMAGE",icon:"[!]",c:C.redL,desc:"Items damaged or expired. Reduces stock with audit note."},{type:"ADJUSTMENT",icon:"[T]",c:C.mid,desc:"Manual correction after physical count. Note is mandatory."}].map(t=>(
            <div key={t.type} style={{display:"flex",gap:12,padding:"10px 0",borderBottom:`1px solid ${C.line}`}}>
              <span style={{fontSize:16}}>{t.icon}</span>
              <div><div style={{fontSize:13,fontWeight:700,color:t.c,marginBottom:2}}>{t.type}</div><div style={{fontSize:12,color:C.mid,lineHeight:1.4}}>{t.desc}</div></div>
            </div>
          ))}
        </Card>
      </div>
      {confirm&&<Modal title="Confirm Stock Movement" onClose={()=>setConfirm(null)}>
        {[["Product",confirm.prod.name],["Type",confirm.type],["Quantity",(confirm.delta>0?"+":"")+fmtN(confirm.delta)+" "+confirm.prod.unit],["Current Stock",fmtN(confirm.prod.stock)+" "+confirm.prod.unit],["New Balance",fmtN(confirm.newBal)+" "+confirm.prod.unit],...(confirm.note?[["Notes",confirm.note]]:[])].map(([k,v],i)=>(
          <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:i<4?`1px solid ${C.line}`:"none"}}>
            <span style={{color:C.mid,fontSize:13}}>{k}</span>
            <strong style={{color:C.ink,fontSize:13}}>{v}</strong>
          </div>
        ))}
        <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:16}}>
          <Btn ch="Cancel" outline color={C.faint} onClick={()=>setConfirm(null)}/>
          <Btn ch="[OK] Confirm - Save" color={C.green} onClick={()=>{setProducts(prev=>prev.map(p=>p.id===+confirm.pid?{...p,stock:confirm.newBal}:p));setLedger(prev=>[...prev,{id:newId(),pid:+confirm.pid,type:confirm.type,qty:confirm.delta,bal:confirm.newBal,date:today(),ref:confirm.type+"-"+Date.now().toString().slice(-5),by:"Admin",note:confirm.note}]);setToast(`Done! New stock: ${fmtN(confirm.newBal)} ${confirm.prod.unit}`);setConfirm(null);setForm({pid:"",type:"PURCHASE",qty:"",note:""});}}/>
        </div>
      </Modal>}
    </Section>
  );
};

// ---- PHASE 2: BUYERS ----
const Buyers = ({buyers,setBuyers}) => {
  return (
    <Section title="Buyers" sub="KYC management - Credit limits - MSME tracking" action={<Btn ch="+ Add Buyer"/>}>
      <Card style={{overflow:"hidden",padding:0}}>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr style={{background:C.muted}}>
              <th style={{padding:"10px 12px",textAlign:"left",fontSize:10,color:C.mid,fontWeight:700,textTransform:"uppercase"}}>Business</th>
              <th style={{padding:"10px 12px",textAlign:"left",fontSize:10,color:C.mid,fontWeight:700,textTransform:"uppercase"}}>GSTIN</th>
              <th style={{padding:"10px 12px",textAlign:"left",fontSize:10,color:C.mid,fontWeight:700,textTransform:"uppercase"}}>MSME</th>
              <th style={{padding:"10px 12px",textAlign:"right",fontSize:10,color:C.mid,fontWeight:700,textTransform:"uppercase"}}>Credit</th>
              <th style={{padding:"10px 12px",textAlign:"center",fontSize:10,color:C.mid,fontWeight:700,textTransform:"uppercase"}}>Status</th>
              <th style={{padding:"10px 12px",textAlign:"center",fontSize:10,color:C.mid,fontWeight:700,textTransform:"uppercase"}}>Risk</th>
            </tr></thead>
            <tbody>
              {buyers.map((b,i)=>(<tr key={b.id} style={{borderBottom:`1px solid ${C.line}`,background:i%2===0?"transparent":C.raised}}>
                <td style={{padding:"10px 12px",fontSize:12,color:C.ink,fontWeight:600}}>{b.name}</td>
                <td style={{padding:"10px 12px",fontSize:11,fontFamily:"monospace",color:C.mid}}>{b.gstin}</td>
                <td style={{padding:"10px 12px",fontSize:11}}>{b.msme?<Pill label="MSME [OK]" c={C.green}/>:<span style={{color:C.faint}}>-</span>}</td>
                <td style={{padding:"10px 12px",fontSize:12,textAlign:"right",fontWeight:700,color:C.ink}}>{cur(b.creditLimit)}</td>
                <td style={{padding:"10px 12px",fontSize:11,textAlign:"center"}}><Pill label={b.status==="approved"?"Approved":"Pending"} c={b.status==="approved"?C.green:C.gold}/></td>
                <td style={{padding:"10px 12px",fontSize:11,textAlign:"center",fontWeight:700,color:b.riskScore>70?C.greenL:b.riskScore>40?C.goldL:C.redL}}>{b.riskScore>0?b.riskScore+"%":"New"}</td>
              </tr>))}
            </tbody>
          </table>
        </div>
      </Card>
    </Section>
  );
};

// ---- PHASE 2: ORDERS ----
const Orders = ({orders,setOrders,buyers}) => {
  const [statusF,setStatusF]=useState("All");
  const filtered=[...orders].filter(o=>statusF==="All"||o.status===statusF).sort((a,b)=>new Date(b.date)-new Date(a.date));
  const os={pending:{label:"Pending",c:C.gold,icon:"[?]"},approved:{label:"Approved",c:C.brand,icon:"[OK]"},dispatched:{label:"Dispatched",c:C.green,icon:"[>]"},rejected:{label:"Rejected",c:C.red,icon:"[X]"}};
  return (
    <Section title="Orders" sub="Review and approve incoming purchase orders">
      <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
        {["All","pending","approved","dispatched","rejected"].map(s=>(
          <button key={s} onClick={()=>setStatusF(s)} style={{padding:"5px 12px",borderRadius:16,border:"none",cursor:"pointer",fontSize:11,fontWeight:statusF===s?700:400,fontFamily:"inherit",background:statusF===s?C.brand:C.muted,color:statusF===s?"#fff":C.mid}}>
            {s==="All"?"All":os[s]?.label}
          </button>
        ))}
      </div>
      <Card style={{overflow:"hidden",padding:0}}>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr style={{background:C.muted}}>
              <th style={{padding:"10px 12px",textAlign:"left",fontSize:10,color:C.mid,fontWeight:700,textTransform:"uppercase"}}>Order ID</th>
              <th style={{padding:"10px 12px",textAlign:"left",fontSize:10,color:C.mid,fontWeight:700,textTransform:"uppercase"}}>Buyer</th>
              <th style={{padding:"10px 12px",textAlign:"right",fontSize:10,color:C.mid,fontWeight:700,textTransform:"uppercase"}}>Total</th>
              <th style={{padding:"10px 12px",textAlign:"center",fontSize:10,color:C.mid,fontWeight:700,textTransform:"uppercase"}}>Items</th>
              <th style={{padding:"10px 12px",textAlign:"center",fontSize:10,color:C.mid,fontWeight:700,textTransform:"uppercase"}}>Status</th>
            </tr></thead>
            <tbody>
              {filtered.map((o,i)=>{
                const buyer=buyers.find(b=>b.id===o.buyerId);
                const grand=oGrand(o.items);
                return <tr key={o.id} style={{borderBottom:`1px solid ${C.line}`,background:i%2===0?"transparent":C.raised}}>
                  <td style={{padding:"10px 12px",fontSize:11,fontFamily:"monospace",color:C.brandHov,fontWeight:700}}>{o.id}</td>
                  <td style={{padding:"10px 12px",fontSize:12,color:C.ink,fontWeight:600}}>{buyer?.name}</td>
                  <td style={{padding:"10px 12px",fontSize:12,textAlign:"right",fontWeight:700,color:C.ink}}>{cur(grand)}</td>
                  <td style={{padding:"10px 12px",fontSize:12,textAlign:"center",color:C.mid}}>{o.items.length}</td>
                  <td style={{padding:"10px 12px",textAlign:"center"}}><Pill label={os[o.status]?.label} c={os[o.status]?.c} icon={os[o.status]?.icon}/></td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </Section>
  );
};

// ---- PHASE 2: DISPATCH ----
const Dispatch = ({orders,setOrders,products,setLedger}) => {
  const queue=orders.filter(o=>o.status==="approved");
  return (
    <Section title="Dispatch Queue" sub="Approved orders ready to ship - E-Way Bill auto-generated for orders >= Rs 50,000">
      {queue.length===0
        ?<Card style={{padding:48,textAlign:"center"}}><div style={{fontSize:18,marginBottom:12}}>OK</div><div style={{color:C.mid,fontSize:14}}>No orders pending dispatch</div></Card>
        :queue.map(o=>{
          const grand=oGrand(o.items);
          const needsEWB=grand>=50000;
          return <Card key={o.id} style={{padding:22,marginBottom:16}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
              <div>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
                  <span style={{fontSize:13,fontWeight:800,color:C.brandHov,fontFamily:"monospace"}}>{o.id}</span>
                  <Pill label="Approved" c={C.brand} icon="[OK]"/>
                  {needsEWB&&<Pill label="E-Way Bill Needed" c={C.accent} icon="[!]"/>}
                </div>
                <div style={{fontSize:13,color:C.ink,fontWeight:600}}>{orders.find(x=>x.id===o.id)?.items.length} items</div>
                <div style={{fontSize:12,color:C.faint,marginTop:2}}>Date: {o.date}</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:20,fontWeight:900,color:C.ink}}>{cur(grand)}</div>
              </div>
            </div>
            {needsEWB&&<Alert type="warn" ch={`Order value Rs ${fmtN(grand)} >= Rs 50,000 - E-Way Bill will be auto-generated on dispatch confirmation`}/>}
            <Btn ch="[>] Mark Dispatched + Generate Invoice" color={C.accent}/>
          </Card>;
        })}
    </Section>
  );
};

// ---- PHASE 2: INVOICES ----
const Invoices = ({orders}) => {
  const invoiced=orders.filter(o=>o.invoice);
  const unpaid=invoiced.filter(o=>!o.invoice.paid);
  const totalOR=unpaid.reduce((s,o)=>s+oGrand(o.items),0);
  const overdue=unpaid.filter(o=>daysBetween(new Date(o.invoice.due),new Date(today()))>0);
  return (
    <Section title="GST Invoices" sub="E-Invoices with IRN - IRP registered - 30-day upload mandate tracked">
      {overdue.length>0&&<Alert type="error" ch={`${overdue.length} invoice(s) are OVERDUE. Compound interest applies. Consider Samadhaan filing.`}/>}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:14,marginBottom:20}}>
        {[{label:"Total Invoices",val:invoiced.length,c:C.brand},{label:"Outstanding",val:cur(totalOR),c:C.redL},{label:"Overdue",val:overdue.length,c:C.red},{label:"Paid",val:invoiced.filter(o=>o.invoice.paid).length,c:C.green}].map((k,i)=>(
          <Card key={i} style={{padding:"14px 18px"}}>
            <div style={{fontSize:10,color:C.faint,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>{k.label}</div>
            <div style={{fontSize:20,fontWeight:800,color:k.c}}>{k.val}</div>
          </Card>
        ))}
      </div>
      {!invoiced.length
        ?<Card style={{padding:48,textAlign:"center"}}><div style={{color:C.mid}}>No invoices yet. Dispatch an order to generate the first invoice.</div></Card>
        :<Card style={{overflow:"hidden",padding:0}}>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead><tr style={{background:C.muted}}>
                <th style={{padding:"10px 12px",textAlign:"left",fontSize:10,color:C.mid,fontWeight:700,textTransform:"uppercase"}}>Invoice</th>
                <th style={{padding:"10px 12px",textAlign:"left",fontSize:10,color:C.mid,fontWeight:700,textTransform:"uppercase"}}>Amount</th>
                <th style={{padding:"10px 12px",textAlign:"center",fontSize:10,color:C.mid,fontWeight:700,textTransform:"uppercase"}}>Due Date</th>
                <th style={{padding:"10px 12px",textAlign:"center",fontSize:10,color:C.mid,fontWeight:700,textTransform:"uppercase"}}>Days Overdue</th>
                <th style={{padding:"10px 12px",textAlign:"center",fontSize:10,color:C.mid,fontWeight:700,textTransform:"uppercase"}}>Status</th>
              </tr></thead>
              <tbody>
                {invoiced.map((o,i)=>{
                  const isOverdue=!o.invoice.paid&&o.invoice.due<today();
                  const daysOD=daysBetween(new Date(o.invoice.due),new Date(today()));
                  return <tr key={o.id} style={{borderBottom:`1px solid ${C.line}`,background:i%2===0?"transparent":C.raised}}>
                    <td style={{padding:"10px 12px",fontSize:11,fontFamily:"monospace",color:C.brandHov,fontWeight:700}}>{o.invoice.no}</td>
                    <td style={{padding:"10px 12px",fontSize:12,fontWeight:700,color:C.ink}}>{cur(oGrand(o.items))}</td>
                    <td style={{padding:"10px 12px",fontSize:12,textAlign:"center",color:isOverdue?C.redL:C.mid}}>{o.invoice.due}</td>
                    <td style={{padding:"10px 12px",fontSize:12,textAlign:"center",color:isOverdue?C.redL:C.gold,fontWeight:700}}>{o.invoice.paid?"-":daysOD<=0?"Due":daysOD+"d"}</td>
                    <td style={{padding:"10px 12px",textAlign:"center"}}><Pill label={o.invoice.paid?"PAID":isOverdue?"OVERDUE":"PENDING"} c={o.invoice.paid?C.greenL:isOverdue?C.redL:C.goldL}/></td>
                  </tr>;
                })}
              </tbody>
            </table>
          </div>
        </Card>}
    </Section>
  );
};

// ---- PHASE 3: PAYMENT LINKS ----
const PaymentLinks = ({orders,banks}) => {
  const defaultBank=banks.find(b=>b.default&&b.active);
  const pending=orders.filter(o=>o.invoice&&!o.invoice.paid);
  return (
    <Section title="Payment Links" sub="Send UPI Deep Links + QR Codes to buyers">
      {!defaultBank&&<Alert type="error" ch="No default bank account. Go to Bank Setup first."/>}
      <Card style={{overflow:"hidden",padding:0}}>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr style={{background:C.muted}}>
              <th style={{padding:"10px 12px",textAlign:"left",fontSize:10,color:C.mid,fontWeight:700,textTransform:"uppercase"}}>Invoice</th>
              <th style={{padding:"10px 12px",textAlign:"left",fontSize:10,color:C.mid,fontWeight:700,textTransform:"uppercase"}}>Amount</th>
              <th style={{padding:"10px 12px",textAlign:"center",fontSize:10,color:C.mid,fontWeight:700,textTransform:"uppercase"}}>Buyer</th>
              <th style={{padding:"10px 12px",textAlign:"center",fontSize:10,color:C.mid,fontWeight:700,textTransform:"uppercase"}}>Due</th>
              <th style={{padding:"10px 12px",textAlign:"center",fontSize:10,color:C.mid,fontWeight:700,textTransform:"uppercase"}}>Actions</th>
            </tr></thead>
            <tbody>
              {pending.map((o,i)=>(
                <tr key={o.id} style={{borderBottom:`1px solid ${C.line}`,background:i%2===0?"transparent":C.raised}}>
                  <td style={{padding:"10px 12px",fontSize:11,fontFamily:"monospace",color:C.brandHov,fontWeight:700}}>{o.invoice.no}</td>
                  <td style={{padding:"10px 12px",fontSize:12,fontWeight:700,color:C.ink}}>{cur(oGrand(o.items))}</td>
                  <td style={{padding:"10px 12px",fontSize:12,textAlign:"center",color:C.mid}}>Buyer</td>
                  <td style={{padding:"10px 12px",fontSize:12,textAlign:"center",color:C.mid}}>{o.invoice.due}</td>
                  <td style={{padding:"10px 12px",textAlign:"center"}}><Btn ch="[QR] Generate Link" sm color={C.brand}/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </Section>
  );
};

// ---- PHASE 3: BANK SETUP ----
const BankSetup = ({banks,setBanks}) => {
  const [modal,setModal]=useState(false);
  return (
    <Section title="Bank Setup" sub="Link UPI accounts for payment collection" action={<Btn ch="+ Add Bank Account" onClick={()=>setModal(true)}/>}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",gap:16}}>
        {banks.map(b=>(
          <Card key={b.id} style={{padding:18,border:b.default?`2px solid ${C.brand}`:`1px solid ${C.border}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
              <div>
                <div style={{fontSize:14,fontWeight:800,color:C.ink}}>{b.accountName}</div>
                <div style={{fontSize:11,color:C.mid,marginTop:2}}>{b.bankName}</div>
              </div>
              {b.default&&<span style={{fontSize:9,background:C.brand+"33",color:C.brand,padding:"3px 8px",borderRadius:12,fontWeight:700}}>DEFAULT</span>}
            </div>
            <div style={{background:C.raised,borderRadius:8,padding:10,marginBottom:12}}>
              <div style={{fontSize:10,color:C.faint,marginBottom:3}}>UPI ID</div>
              <div style={{fontSize:12,fontFamily:"monospace",color:C.brandHov,fontWeight:700}}>{b.upiId}</div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              <div>
                <div style={{fontSize:10,color:C.faint}}>Account</div>
                <div style={{fontSize:11,color:C.mid,fontFamily:"monospace"}}>{b.accountNo}</div>
              </div>
              <div>
                <div style={{fontSize:10,color:C.faint}}>IFSC</div>
                <div style={{fontSize:11,color:C.mid,fontFamily:"monospace"}}>{b.ifsc}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
      {modal&&<Modal title="Add Bank Account" onClose={()=>setModal(false)}>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <Inp label="Account Name" placeholder="Primary - HDFC"/>
          <Inp label="UPI ID" placeholder="upiid@bank" req/>
          <Inp label="Account Number" placeholder="Last 4 digits"/>
          <Inp label="IFSC Code" placeholder="HDFC0001234"/>
          <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
            <Btn ch="Cancel" outline color={C.faint} onClick={()=>setModal(false)}/>
            <Btn ch="Add Account" onClick={()=>setModal(false)}/>
          </div>
        </div>
      </Modal>}
    </Section>
  );
};

// ---- PHASE 3: OFFLINE PAYMENTS ----
const OfflinePayments = ({payments,setPayments}) => {
  const offline=payments.filter(p=>p.type==="offline");
  return (
    <Section title="Offline Payments" sub="Track cheques, bank transfers, cash - Reconcile with bank statement">
      <Alert type="warn" ch="Offline payments must be approved by Accounts team via bank statement reconciliation."/>
      <Card style={{overflow:"hidden",padding:0,marginTop:16}}>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr style={{background:C.muted}}>
              <th style={{padding:"10px 12px",textAlign:"left",fontSize:10,color:C.mid,fontWeight:700,textTransform:"uppercase"}}>Invoice</th>
              <th style={{padding:"10px 12px",textAlign:"right",fontSize:10,color:C.mid,fontWeight:700,textTransform:"uppercase"}}>Amount</th>
              <th style={{padding:"10px 12px",textAlign:"center",fontSize:10,color:C.mid,fontWeight:700,textTransform:"uppercase"}}>Ref/UTR</th>
              <th style={{padding:"10px 12px",textAlign:"center",fontSize:10,color:C.mid,fontWeight:700,textTransform:"uppercase"}}>Date</th>
              <th style={{padding:"10px 12px",textAlign:"center",fontSize:10,color:C.mid,fontWeight:700,textTransform:"uppercase"}}>Status</th>
              <th style={{padding:"10px 12px",textAlign:"center",fontSize:10,color:C.mid,fontWeight:700,textTransform:"uppercase"}}>Actions</th>
            </tr></thead>
            <tbody>
              {offline.map((p,i)=>(
                <tr key={p.id} style={{borderBottom:`1px solid ${C.line}`,background:i%2===0?"transparent":C.raised}}>
                  <td style={{padding:"10px 12px",fontSize:11,fontFamily:"monospace",color:C.brandHov,fontWeight:700}}>{p.invoiceNo}</td>
                  <td style={{padding:"10px 12px",fontSize:12,textAlign:"right",fontWeight:700,color:C.ink}}>{cur(p.amount)}</td>
                  <td style={{padding:"10px 12px",fontSize:11,fontFamily:"monospace",color:C.mid,textAlign:"center"}}>{p.utrNo}</td>
                  <td style={{padding:"10px 12px",fontSize:12,textAlign:"center",color:C.mid}}>{p.paymentDate}</td>
                  <td style={{padding:"10px 12px",fontSize:11,textAlign:"center"}}><Pill label={p.status==="offline_pending"?"Pending":p.status==="offline_approved"?"Approved":"Rejected"} c={p.status==="offline_pending"?C.gold:p.status==="offline_approved"?C.green:C.red}/></td>
                  <td style={{padding:"10px 12px",textAlign:"center"}}>
                    {p.status==="offline_pending"&&<div style={{display:"flex",gap:5,justifyContent:"center"}}><Btn ch="[OK]" sm color={C.green}/><Btn ch="[X]" sm color={C.red}/></div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </Section>
  );
};

// ---- PHASE 3: COLLECTIONS TRACKER ----
const Collections = ({orders,payments}) => {
  const invoiced=orders.filter(o=>o.invoice);
  const unpaid=invoiced.filter(o=>!o.invoice.paid);
  const totalOR=unpaid.reduce((s,o)=>s+oGrand(o.items),0);
  const overdue=unpaid.filter(o=>daysBetween(new Date(o.invoice.due),new Date(today()))>0);
  const critical=overdue.filter(o=>daysBetween(new Date(o.invoice.due),new Date(today()))>45);

  return (
    <Section title="Collections Tracker" sub="45-Day Reminders - Section 43B(h) Alerts - Compound Interest Tracking">
      {critical.length>0&&<Alert type="error" ch={`CRITICAL: ${critical.length} invoice(s) PAST 45-DAY MSME THRESHOLD. Compound interest accruing at 19.5% p.a. File Samadhaan NOW.`}/>}
      {overdue.length>0&&<Alert type="warn" ch={`${overdue.length} invoice(s) overdue. Section 43B(h) tax protection loss applied to MSMEs.`}/>}

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:14,marginBottom:20}}>
        {[{label:"Total Outstanding",val:cur(totalOR),c:C.red},{label:"Overdue Amount",val:cur(unpaid.filter(o=>daysBetween(new Date(o.invoice.due),new Date(today()))>0).reduce((s,o)=>s+oGrand(o.items),0)),c:C.redL},{label:"Past 45-Day Threshold",val:critical.length,c:C.red},{label:"MSME Protected",val:invoiced.filter(o=>o.items[0]).length,c:C.purple}].map((k,i)=>(
          <Card key={i} style={{padding:"14px 18px"}}>
            <div style={{fontSize:10,color:C.faint,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>{k.label}</div>
            <div style={{fontSize:18,fontWeight:800,color:k.c}}>{k.val}</div>
          </Card>
        ))}
      </div>

      <Card style={{padding:20,marginBottom:20}}>
        <div style={{fontSize:13,fontWeight:700,color:C.ink,marginBottom:10}}>45-Day Reminder Timeline</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:10}}>
          {[{day:"Day 0",event:"Invoice Raised",ch:"Email+WhatsApp"},{day:"Day 7",event:"Reminder 1",ch:"Friendly"},{day:"Day 15",event:"Reminder 2",ch:"Formal"},{day:"Day 30",event:"Reminder 3 [!]",ch:"15d left"},{day:"Day 44",event:"43B(h) WARNING",ch:"Tax risk"},{day:"Day 45",event:"LEGAL THRESHOLD",ch:"Interest starts"}].map((t,i)=>(
            <div key={i} style={{background:C.raised,border:`1px solid ${C.border}`,borderRadius:8,padding:10}}>
              <div style={{fontSize:10,fontWeight:700,color:i>=4?C.redL:C.gold,textTransform:"uppercase",marginBottom:3}}>{t.day}</div>
              <div style={{fontSize:12,fontWeight:700,color:C.ink,marginBottom:2}}>{t.event}</div>
              <div style={{fontSize:11,color:C.mid}}>{t.ch}</div>
            </div>
          ))}
        </div>
      </Card>

      {unpaid.length===0
        ?<Card style={{padding:48,textAlign:"center"}}><div style={{color:C.mid}}>All invoices paid - Outstanding is ZERO</div></Card>
        :<Card style={{overflow:"hidden",padding:0}}>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead><tr style={{background:C.muted}}>
                <th style={{padding:"10px 12px",textAlign:"left",fontSize:10,color:C.mid,fontWeight:700,textTransform:"uppercase"}}>Invoice</th>
                <th style={{padding:"10px 12px",textAlign:"right",fontSize:10,color:C.mid,fontWeight:700,textTransform:"uppercase"}}>Amount</th>
                <th style={{padding:"10px 12px",textAlign:"center",fontSize:10,color:C.mid,fontWeight:700,textTransform:"uppercase"}}>Days Overdue</th>
                <th style={{padding:"10px 12px",textAlign:"right",fontSize:10,color:C.mid,fontWeight:700,textTransform:"uppercase"}}>Interest</th>
                <th style={{padding:"10px 12px",textAlign:"center",fontSize:10,color:C.mid,fontWeight:700,textTransform:"uppercase"}}>Status</th>
              </tr></thead>
              <tbody>
                {unpaid.map((o,i)=>{
                  const daysOD=daysBetween(new Date(o.invoice.due),new Date(today()));
                  const isPast45=daysOD>45;
                  const interest=daysOD>0?compoundInterest(oGrand(o.items),daysOD):0;
                  return <tr key={o.id} style={{borderBottom:`1px solid ${C.line}`,background:i%2===0?"transparent":C.raised}}>
                    <td style={{padding:"10px 12px",fontSize:11,fontFamily:"monospace",color:C.brandHov,fontWeight:700}}>{o.invoice.no}</td>
                    <td style={{padding:"10px 12px",fontSize:12,textAlign:"right",fontWeight:700,color:C.ink}}>{cur(oGrand(o.items))}</td>
                    <td style={{padding:"10px 12px",fontSize:12,textAlign:"center",color:isPast45?C.red:daysOD>30?C.goldL:C.mid,fontWeight:700}}>{daysOD<=0?"Due":daysOD+"d"}</td>
                    <td style={{padding:"10px 12px",fontSize:12,textAlign:"right",color:interest>0?C.redL:C.mid,fontWeight:700}}>{interest>0?cur(interest):"-"}</td>
                    <td style={{padding:"10px 12px",textAlign:"center"}}><Pill label={isPast45?"CRITICAL":daysOD>0?"OVERDUE":"PENDING"} c={isPast45?C.red:daysOD>0?C.redL:C.gold}/></td>
                  </tr>;
                })}
              </tbody>
            </table>
          </div>
        </Card>}
    </Section>
  );
};

// ---- MAIN APP ----
export default function BizFlowComplete() {
  const [page,setPage]=useState("dashboard");
  const [products,setProducts]=useState(initProducts);
  const [ledger,setLedger]=useState(initLedger);
  const [buyers,setBuyers]=useState(initBuyers);
  const [orders,setOrders]=useState(initOrders);
  const [banks,setBanks]=useState(initBanks);
  const [payments,setPayments]=useState(initPayments);

  const counts={
    orders:orders.filter(o=>o.status==="pending").length,
    dispatch:orders.filter(o=>o.status==="approved").length,
    buyers:buyers.filter(b=>b.status==="pending").length,
    invoices:orders.filter(o=>o.invoice&&!o.invoice.paid).length,
    offlinepay:payments.filter(p=>p.type==="offline"&&p.status==="offline_pending").length,
    collections:orders.filter(o=>o.invoice&&!o.invoice.paid&&daysBetween(new Date(o.invoice.due),new Date(today()))>0).length,
  };

  const pageEl = {
    dashboard:<Dashboard products={products} ledger={ledger} orders={orders} buyers={buyers}/>,
    products:<Products products={products} setProducts={setProducts} setLedger={setLedger}/>,
    ledger:<Ledger products={products} ledger={ledger}/>,
    adjust:<Adjust products={products} setProducts={setProducts} setLedger={setLedger}/>,
    buyers:<Buyers buyers={buyers} setBuyers={setBuyers}/>,
    orders:<Orders orders={orders} setOrders={setOrders} buyers={buyers}/>,
    dispatch:<Dispatch orders={orders} setOrders={setOrders} products={products} setLedger={setLedger}/>,
    invoices:<Invoices orders={orders}/>,
    paymentlinks:<PaymentLinks orders={orders} banks={banks}/>,
    banksetup:<BankSetup banks={banks} setBanks={setBanks}/>,
    offlinepay:<OfflinePayments payments={payments} setPayments={setPayments}/>,
    collections:<Collections orders={orders} payments={payments}/>,
  }[page];

  return (
    <div style={{display:"flex",minHeight:"100vh",background:C.bg,fontFamily:"Outfit, Segoe UI, sans-serif",color:C.ink}}>
      <Sidebar page={page} setPage={setPage} counts={counts}/>
      <main style={{flex:1,padding:"28px 32px",overflowY:"auto",maxHeight:"100vh"}}>
        {pageEl}
      </main>
    </div>
  );
}
