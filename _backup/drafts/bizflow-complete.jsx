import { useState, useCallback } from "react";

// ============================================================
// COLOR PALETTE
// ============================================================
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

// ============================================================
// UTILITIES
// ============================================================
const fmtN = n => new Intl.NumberFormat("en-IN").format(Math.round(n));
const fmtD = n => new Intl.NumberFormat("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2}).format(n);
const cur = n => "Rs " + fmtD(n);
const today = () => new Date().toISOString().slice(0,10);
const addD = (d,n) => { const dt=new Date(d); dt.setDate(dt.getDate()+n); return dt.toISOString().slice(0,10); };
const daysBetween = (d1, d2) => Math.floor((new Date(d2) - new Date(d1)) / (1000*60*60*24));
const newId = () => Date.now();

const oBase = items => items.reduce((s,i) => s + i.qty*i.price, 0);
const oGST = items => items.reduce((s,i) => s + i.qty*i.price*i.gst/100, 0);
const oGrand = items => oBase(items) + oGST(items);

const compoundInterest = (principal, daysOverdue) => {
  const monthsOverdue = daysOverdue / 30;
  const monthlyRate = 0.015;
  return principal * (Math.pow(1 + monthlyRate, monthsOverdue) - 1);
};

const generateUPILink = (upiId, name, amount, description) => {
  return `upi://pay?pa=${upiId}&pn=${encodeURIComponent(name)}&am=${amount}&tn=${encodeURIComponent(description)}`;
};

const generateQRCode = (upiLink) => {
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(upiLink)}`;
};

// ============================================================
// SEED DATA
// ============================================================
const initProducts = [
  { id:1, sku:"BF-001", name:"Cotton Fabric (White)", cat:"Fabric", hsn:"520811", gst:5, unit:"Metre", buyPrice:85, tradePrice:120, mrp:150, reorder:500, stock:2340, active:true },
  { id:2, sku:"BF-002", name:"Polyester Blend", cat:"Fabric", hsn:"540742", gst:12, unit:"Metre", buyPrice:65, tradePrice:95, mrp:130, reorder:300, stock:85, active:true },
  { id:3, sku:"BF-003", name:"Denim (Blue)", cat:"Fabric", hsn:"520942", gst:5, unit:"Metre", buyPrice:145, tradePrice:200, mrp:260, reorder:200, stock:0, active:true },
  { id:4, sku:"CH-001", name:"Brass Zip 20cm", cat:"Accessories", hsn:"963200", gst:18, unit:"Nos", buyPrice:8, tradePrice:15, mrp:20, reorder:1000, stock:4500, active:true },
  { id:5, sku:"CH-002", name:"Plastic Buttons", cat:"Accessories", hsn:"960610", gst:12, unit:"Nos", buyPrice:1.5, tradePrice:3, mrp:5, reorder:2000, stock:420, active:true },
  { id:6, sku:"TH-001", name:"Polyester Thread", cat:"Thread", hsn:"540200", gst:12, unit:"Box", buyPrice:280, tradePrice:380, mrp:450, reorder:50, stock:180, active:true },
  { id:7, sku:"TH-002", name:"Cotton Thread", cat:"Thread", hsn:"520400", gst:5, unit:"Box", buyPrice:320, tradePrice:440, mrp:520, reorder:40, stock:22, active:true },
];

const initLedger = [
  { id:1, pid:1, type:"OPENING", qty:3000, bal:3000, date:"2026-04-01", ref:"Opening Entry", by:"Admin", note:"" },
  { id:2, pid:1, type:"DISPATCH", qty:-660, bal:2340, date:"2026-04-05", ref:"ORD-2026-001", by:"System", note:"" },
  { id:3, pid:2, type:"OPENING", qty:500, bal:500, date:"2026-04-01", ref:"Opening Entry", by:"Admin", note:"" },
  { id:4, pid:2, type:"DISPATCH", qty:-415, bal:85, date:"2026-04-10", ref:"ORD-2026-002", by:"System", note:"" },
  { id:5, pid:3, type:"OPENING", qty:200, bal:200, date:"2026-04-01", ref:"Opening Entry", by:"Admin", note:"" },
  { id:6, pid:3, type:"DISPATCH", qty:-200, bal:0, date:"2026-04-12", ref:"ORD-2026-003", by:"System", note:"" },
];

const initBuyers = [
  { id:1, name:"Sharma Textiles Pvt Ltd", gstin:"27AABCU9603R1ZX", pan:"AABCU9603R", phone:"9876543210", email:"sharma@textiles.com", city:"Mumbai", state:"Maharashtra", creditLimit:200000, msme:"UDYAM-MH-01-0012345", type:"Pvt Ltd", status:"approved", joined:"2026-01-15", riskScore:85 },
  { id:2, name:"Gupta Garments", gstin:"07AAACG1234C1Z5", pan:"AAACG1234C", phone:"9812345678", email:"gupta@garments.in", city:"Delhi", state:"Delhi", creditLimit:100000, msme:"", type:"Proprietor", status:"approved", joined:"2026-02-10", riskScore:42 },
  { id:3, name:"Rajasthan Fabrics LLP", gstin:"08AABFR5678D1ZP", pan:"AABFR5678D", phone:"9001234567", email:"raj@fabrics.com", city:"Jaipur", state:"Rajasthan", creditLimit:150000, msme:"UDYAM-RJ-03-0067890", type:"LLP", status:"pending", joined:"2026-04-18", riskScore:0 },
];

const initOrders = [
  { id:"ORD-2026-001", buyerId:1, date:"2026-04-10", status:"dispatched", items:[{pid:1,qty:500,price:120,gst:5},{pid:4,qty:200,price:15,gst:18}], addr:"Unit 4, Dharavi, Mumbai", dispatch:{date:"2026-04-12",vehicle:"MH12AB1234",transporter:"Shree Cargo",ewb:"EWB-7892341567"}, invoice:{no:"INV-2026-001",date:"2026-04-12",irn:"a3f9b2c1d4e5f6a7b8c9d0e1f2a3b4c5",due:"2026-05-27",paid:false} },
  { id:"ORD-2026-002", buyerId:2, date:"2026-04-14", status:"approved", items:[{pid:6,qty:20,price:380,gst:12},{pid:7,qty:10,price:440,gst:5}], addr:"45 Gandhi Nagar, Delhi", dispatch:null, invoice:null },
  { id:"ORD-2026-003", buyerId:1, date:"2026-04-18", status:"pending", items:[{pid:2,qty:80,price:95,gst:12}], addr:"Unit 4, Dharavi, Mumbai", dispatch:null, invoice:null },
];

const initBankAccounts = [
  { id:1, accountName:"Primary - HDFC", bankName:"HDFC Bank", accountNo:"****1234", ifsc:"HDFC0001234", upiId:"bizflow@hdfc", ownerName:"BizFlow India", active:true, default:true },
  { id:2, accountName:"Secondary - ICICI", bankName:"ICICI Bank", accountNo:"****5678", ifsc:"ICIC0005678", upiId:"bizflow@icici", ownerName:"BizFlow India", active:true, default:false },
];

const initPayments = [
  { id:"PAY-2026-001", invoiceNo:"INV-2026-001", amount:71400, buyerName:"Sharma Textiles", dueDate:"2026-05-27", status:"pending", type:"online", paymentDate:null, utrNo:null, notes:"", approvedBy:null, approvalDate:null },
  { id:"PAY-2026-002", invoiceNo:"INV-2026-002", amount:9300, buyerName:"Gupta Garments", dueDate:"2026-05-29", status:"pending", type:"online", paymentDate:null, utrNo:null, notes:"", approvedBy:null, approvalDate:null },
  { id:"PAY-2026-003", invoiceNo:"INV-2026-003", amount:19200, buyerName:"Sharma Textiles", dueDate:"2026-05-25", status:"offline_pending", type:"offline", paymentDate:"2026-04-26", utrNo:"HDFC20260426001", notes:"Cheque #1001", approvedBy:null, approvalDate:null },
];

// ============================================================
// COMPONENTS
// ============================================================
const Th = ({ch, right, w}) => (
  <th style={{padding:"9px 12px", background:C.muted, textAlign:right?"right":"left", fontSize:10, color:C.mid, fontWeight:700, letterSpacing:1, textTransform:"uppercase", whiteSpace:"nowrap", width:w}}>
    {ch}
  </th>
);

const Td = ({ch, right, bold, color, mono, small}) => (
  <td style={{padding:"10px 12px", borderBottom:`1px solid ${C.line}`, textAlign:right?"right":"left", fontSize:small?11:13, color:color||C.mid, fontWeight:bold?700:400, fontFamily:mono?"'Courier New',monospace":"inherit", whiteSpace:"nowrap"}}>
    {ch}
  </td>
);

const Pill = ({label, c, bg, icon}) => (
  <span style={{display:"inline-flex", alignItems:"center", gap:4, fontSize:11, fontWeight:700, padding:"3px 9px", borderRadius:20, background:bg||c+"22", color:c, letterSpacing:0.3, whiteSpace:"nowrap"}}>
    {icon && <span>{icon}</span>}{label}
  </span>
);

const Btn = ({ch, onClick, color=C.brand, sm, outline, full, disabled}) => (
  <button onClick={disabled?undefined:onClick} style={{padding:sm?"6px 12px":"9px 18px", borderRadius:7, border:outline?`1px solid ${color}`:"none", cursor:disabled?"not-allowed":"pointer", background:outline?"transparent":color, color:outline?color:"#fff", opacity:disabled?0.5:1, fontSize:sm?11:13, fontWeight:700, fontFamily:"inherit", display:"inline-flex", alignItems:"center", gap:5, width:full?"100%":undefined, justifyContent:full?"center":undefined}}>
    {ch}
  </button>
);

const Inp = ({label, value, onChange, type="text", placeholder, opts, req, note}) => (
  <div style={{display:"flex", flexDirection:"column", gap:4, flex:1, minWidth:120}}>
    {label && <label style={{fontSize:10, color:C.mid, letterSpacing:1, textTransform:"uppercase", fontWeight:700}}>{label}{req && <span style={{color:C.red}}> *</span>}</label>}
    {opts ? <select value={value} onChange={e => onChange(e.target.value)} style={{background:C.surface, border:`1px solid ${C.border}`, borderRadius:7, padding:"9px 11px", color:C.ink, fontSize:13, outline:"none", fontFamily:"inherit"}}>
      {opts.map(o => <option key={o}>{o}</option>)}
    </select> : <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{background:C.surface, border:`1px solid ${C.border}`, borderRadius:7, padding:"9px 11px", color:C.ink, fontSize:13, outline:"none", fontFamily:"inherit"}}/>}
    {note && <span style={{fontSize:10, color:C.faint}}>{note}</span>}
  </div>
);

const Card = ({children, style}) => (
  <div style={{background:C.card, border:`1px solid ${C.border}`, borderRadius:13, ...style}}>
    {children}
  </div>
);

const Section = ({title, sub, action, children}) => (
  <div>
    <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20}}>
      <div>
        <h1 style={{fontSize:22, fontWeight:800, color:C.ink, margin:0, letterSpacing:-0.5}}>{title}</h1>
        {sub && <p style={{color:C.mid, fontSize:13, marginTop:4, marginBottom:0}}>{sub}</p>}
      </div>
      {action}
    </div>
    {children}
  </div>
);

const Modal = ({title, sub, onClose, children, wide}) => (
  <div style={{position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", zIndex:3000, display:"flex", alignItems:"center", justifyContent:"center", padding:16}}>
    <div style={{background:C.card, border:`1px solid ${C.border}`, borderRadius:16, width:"100%", maxWidth:wide?820:520, maxHeight:"90vh", overflowY:"auto", boxShadow:"0 40px 120px rgba(0,0,0,0.8)"}}>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start", padding:"20px 24px 16px", borderBottom:`1px solid ${C.border}`}}>
        <div>
          <div style={{fontSize:17, fontWeight:800, color:C.ink}}>{title}</div>
          {sub && <div style={{fontSize:12, color:C.mid, marginTop:3}}>{sub}</div>}
        </div>
        <button onClick={onClose} style={{background:"none", border:"none", cursor:"pointer", color:C.mid, fontSize:20, lineHeight:1, padding:4}}>x</button>
      </div>
      <div style={{padding:"20px 24px"}}>{children}</div>
    </div>
  </div>
);

const Alert = ({type, ch}) => {
  const colors = {success:{bg:C.green+"15",border:C.green+"44",c:C.greenL,icon:"OK"},warn:{bg:C.gold+"15",border:C.gold+"44",c:C.goldL,icon:"!"},error:{bg:C.red+"15",border:C.red+"44",c:C.redL,icon:"X"}};
  const s = colors[type] || colors.info;
  return <div style={{background:s.bg, border:`1px solid ${s.border}`, borderRadius:9, padding:"11px 16px", marginBottom:16, fontSize:13, color:s.c, display:"flex", gap:8, alignItems:"flex-start"}}>
    <span style={{fontWeight:800,fontSize:14}}>[{s.icon}]</span><span>{ch}</span>
  </div>;
};

// ============================================================
// NAVBAR & SIDEBAR
// ============================================================
const NAV_GROUPS = [
  { group:"PHASE 1 - STOCK", items:[
    {key:"dashboard", icon:"DASH", label:"Dashboard"},
    {key:"products", icon:"BOX", label:"Products"},
    {key:"ledger", icon:"DOC", label:"Stock Ledger"},
    {key:"adjust", icon:"GEAR", label:"Adjust Stock"},
  ]},
  { group:"PHASE 2 - ORDERS", items:[
    {key:"buyers", icon:"USERS", label:"Buyers"},
    {key:"orders", icon:"CART", label:"Orders"},
    {key:"dispatch", icon:"TRUCK", label:"Dispatch Queue"},
    {key:"invoices", icon:"BILL", label:"GST Invoices"},
  ]},
  { group:"PHASE 3 - PAYMENTS", items:[
    {key:"payments", icon:"COINS", label:"Payment Tracker"},
    {key:"gateway", icon:"CARD", label:"Payment Gateway"},
    {key:"banksetup", icon:"BANK", label:"Bank Setup"},
  ]},
];

const Sidebar = ({page, setPage, counts}) => (
  <div style={{width:224, minHeight:"100vh", background:C.surface, borderRight:`1px solid ${C.border}`, display:"flex", flexDirection:"column", flexShrink:0}}>
    <div style={{padding:"22px 18px 16px", borderBottom:`1px solid ${C.border}`}}>
      <div style={{display:"flex", alignItems:"center", gap:10}}>
        <div style={{width:34, height:34, borderRadius:8, background:`linear-gradient(135deg,${C.brand},${C.accent})`, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, color:"#fff", fontSize:17}}>B</div>
        <div>
          <div style={{fontSize:15, fontWeight:800, color:C.ink, letterSpacing:-0.3}}>BizFlow</div>
          <div style={{fontSize:9, color:C.faint, letterSpacing:2, textTransform:"uppercase"}}>COMPLETE</div>
        </div>
      </div>
    </div>
    <nav style={{padding:"10px 8px", flex:1, overflowY:"auto"}}>
      {NAV_GROUPS.map(g => (
        <div key={g.group} style={{marginBottom:20}}>
          <div style={{fontSize:9, color:C.faint, letterSpacing:2, fontWeight:700, textTransform:"uppercase", padding:"0 10px", marginBottom:6}}>{g.group}</div>
          {g.items.map(n => {
            const active = page === n.key;
            const cnt = counts && counts[n.key];
            return (
              <button key={n.key} onClick={() => setPage(n.key)} style={{display:"flex", alignItems:"center", gap:9, width:"100%", padding:"9px 12px", borderRadius:8, border:"none", cursor:"pointer", marginBottom:2, fontFamily:"inherit", background:active?C.brand+"28":"transparent", color:active?C.brandHov:C.mid, fontWeight:active?700:400, fontSize:13, borderLeft:active?`3px solid ${C.brand}`:"3px solid transparent"}}>
                <span style={{fontSize:13}}>{n.icon}</span>
                <span style={{flex:1, textAlign:"left"}}>{n.label}</span>
                {cnt>0 && <span style={{background:C.accent, color:"#fff", borderRadius:10, fontSize:10, fontWeight:700, padding:"1px 6px", lineHeight:1.4}}>{cnt}</span>}
              </button>
            );
          })}
        </div>
      ))}
    </nav>
    <div style={{padding:"14px 18px", borderTop:`1px solid ${C.border}`}}>
      <div style={{fontSize:10, color:C.faint, marginBottom:2}}>GSTIN</div>
      <div style={{fontSize:11, color:C.mid, fontWeight:600, fontFamily:"'Courier New',monospace"}}>27AABCU9603R1ZX</div>
      <div style={{fontSize:10, color:C.green, marginTop:5}}>LIVE - April 2026</div>
    </div>
  </div>
);

// ============================================================
// MAIN APP
// ============================================================
export default function BizFlowComplete() {
  const [page, setPage] = useState("dashboard");
  const [products, setProducts] = useState(initProducts);
  const [ledger, setLedger] = useState(initLedger);
  const [buyers, setBuyers] = useState(initBuyers);
  const [orders, setOrders] = useState(initOrders);
  const [banks, setBanks] = useState(initBankAccounts);
  const [payments, setPayments] = useState(initPayments);

  const counts = {
    orders: orders.filter(o => o.status === "pending").length,
    dispatch: orders.filter(o => o.status === "approved").length,
    buyers: buyers.filter(b => b.status === "pending").length,
    invoices: orders.filter(o => o.invoice && !o.invoice.paid).length,
  };

  // PAGE CONTENT DISPATCH
  const pageEl = {
    dashboard: <Dashboard products={products} ledger={ledger} orders={orders} buyers={buyers}/>,
    products: <Products products={products} setProducts={setProducts} setLedger={setLedger}/>,
    ledger: <Ledger products={products} ledger={ledger}/>,
    adjust: <Adjust products={products} setProducts={setProducts} setLedger={setLedger}/>,
    buyers: <Buyers buyers={buyers} setBuyers={setBuyers} orders={orders}/>,
    orders: <Orders orders={orders} setOrders={setOrders} buyers={buyers} products={products} setPage={setPage}/>,
    dispatch: <Dispatch orders={orders} setOrders={setOrders} buyers={buyers} products={products} setLedger={setLedger}/>,
    invoices: <Invoices orders={orders} setOrders={setOrders} buyers={buyers} products={products}/>,
    payments: <PaymentTracker payments={payments} setPayments={setPayments}/>,
    gateway: <PaymentGateway payments={payments} setPayments={setPayments} banks={banks}/>,
    banksetup: <BankSetup banks={banks} setBanks={setBanks}/>,
  }[page];

  return (
    <div style={{display:"flex", minHeight:"100vh", background:C.bg, fontFamily:"'DM Sans','Segoe UI',system-ui,sans-serif", color:C.ink}}>
      <Sidebar page={page} setPage={setPage} counts={counts}/>
      <main style={{flex:1, padding:"28px 32px", overflowY:"auto", maxHeight:"100vh"}}>
        {pageEl}
      </main>
    </div>
  );
}

// ============================================================
// PHASE 1 SCREENS
// ============================================================
const Dashboard = ({products, ledger, orders, buyers}) => {
  const ap = products.filter(p => p.active);
  const stockVal = ap.reduce((s,p) => s + p.stock*p.buyPrice, 0);
  const tradeVal = ap.reduce((s,p) => s + p.stock*p.tradePrice, 0);
  const lowStock = ap.filter(p => p.stock > 0 && p.stock < p.reorder);
  const outStock = ap.filter(p => p.stock === 0);
  const pendingOrders = orders.filter(o => o.status === "pending");
  const dispatchQ = orders.filter(o => o.status === "approved");
  const totalReceivable = orders.filter(o => o.invoice && !o.invoice.paid).reduce((s,o) => s + oGrand(o.items), 0);
  const recent = [...ledger].sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0,5);

  return (
    <Section title="Dashboard" sub={`Overview ${today()}`}>
      {outStock.length > 0 && <Alert type="warn" ch={`${outStock.length} product(s) out of stock`}/>}
      <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(210px,1fr))", gap:14, marginBottom:28}}>
        {[
          {label:"Stock Value (Cost)", val:cur(stockVal), icon:"Rs", c:C.brand, sub:"Purchase price"},
          {label:"Trade Value", val:cur(tradeVal), icon:"UP", c:C.green, sub:"at markup"},
          {label:"Pending Orders", val:pendingOrders.length, icon:"WAIT", c:C.gold, sub:"awaiting approval"},
          {label:"Dispatch Queue", val:dispatchQ.length, icon:"TRUCK", c:C.accent, sub:"ready to ship"},
          {label:"Outstanding", val:cur(totalReceivable), icon:"BILL", c:C.red, sub:"unpaid"},
          {label:"Low Stock", val:lowStock.length, icon:"WARN", c:C.goldL, sub:"reorder needed"},
        ].map((k,i) => (
          <Card key={i} style={{padding:"18px 20px"}}>
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start"}}>
              <div>
                <div style={{fontSize:10, color:C.faint, textTransform:"uppercase", letterSpacing:1, marginBottom:8}}>{k.label}</div>
                <div style={{fontSize:24, fontWeight:800, color:k.c, letterSpacing:-0.5}}>{k.val}</div>
                <div style={{fontSize:11, color:C.faint, marginTop:4}}>{k.sub}</div>
              </div>
              <span style={{fontSize:18}}>{k.icon}</span>
            </div>
          </Card>
        ))}
      </div>
    </Section>
  );
};

const Products = ({products, setProducts, setLedger}) => {
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({name:"", sku:"", hsn:"", gst:5, unit:"Metre", buyPrice:"", tradePrice:"", mrp:"", reorder:"", openStock:"", cat:"Fabric", active:true});
  const f = v => ({...form, ...v});
  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()));

  const save = () => {
    if (!form.name || !form.sku || !form.hsn || !form.buyPrice || !form.tradePrice) return;
    if (modal === "add") {
      const id = Math.max(...products.map(p => p.id), 0) + 1;
      const oq = +form.openStock || 0;
      setProducts(prev => [...prev, {id, ...form, gst:+form.gst, buyPrice:+form.buyPrice, tradePrice:+form.tradePrice, mrp:+form.mrp||0, reorder:+form.reorder||0, stock:oq, active:true}]);
      if (oq > 0) setLedger(prev => [...prev, {id:newId(), pid:id, type:"OPENING", qty:oq, bal:oq, date:today(), ref:"Opening", by:"Admin", note:""}]);
    }
    setModal(null);
  };

  return (
    <Section title="Products" sub={`${products.filter(p=>p.active).length} active`} action={<Btn ch="+ Add Product" onClick={() => setModal("add")}/>}>
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search SKU or name..." style={{width:"100%", marginBottom:16, background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, padding:"9px 13px", color:C.ink, fontSize:13, outline:"none"}}/>
      <Card style={{overflow:"hidden", padding:0}}>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%", borderCollapse:"collapse"}}>
            <thead><tr>
              <Th ch="SKU"/><Th ch="Product"/><Th ch="Category"/><Th ch="HSN"/><Th ch="GST%"/><Th ch="Stock" right/><Th ch="Buy Price" right/><Th ch="Trade Price" right/>
            </tr></thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id}>
                  <Td ch={p.sku} mono small/>
                  <Td ch={p.name} bold color={C.ink}/>
                  <Td ch={p.cat}/>
                  <Td ch={p.hsn} mono small/>
                  <Td ch={<Pill label={p.gst+"%"} c={C.brand}/>}/>
                  <Td ch={fmtN(p.stock)} right/>
                  <Td ch={cur(p.buyPrice)} right/>
                  <Td ch={cur(p.tradePrice)} right bold color={C.ink}/>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      {modal === "add" && (
        <Modal title="Add Product" onClose={() => setModal(null)}>
          <div style={{display:"flex", flexDirection:"column", gap:14}}>
            <div style={{display:"flex", gap:12, flexWrap:"wrap"}}>
              <Inp label="Product Name" value={form.name} onChange={v => setForm(f({name:v}))} req/>
              <Inp label="SKU" value={form.sku} onChange={v => setForm(f({sku:v}))} req/>
            </div>
            <div style={{display:"flex", gap:12, flexWrap:"wrap"}}>
              <Inp label="HSN Code" value={form.hsn} onChange={v => setForm(f({hsn:v}))} req/>
              <Inp label="GST %" value={form.gst+""} onChange={v => setForm(f({gst:+v}))} opts={[0,5,12,18,28].map(String)}/>
              <Inp label="Unit" value={form.unit} onChange={v => setForm(f({unit:v}))} opts={["Metre","Nos","Box","Kg","Litre"]}/>
            </div>
            <Btn ch="Add Product" onClick={save}/>
          </div>
        </Modal>
      )}
    </Section>
  );
};

const Ledger = ({products, ledger}) => {
  const [pf, setPf] = useState("All");
  const rows = [...ledger].filter(l => pf === "All" || l.pid === +pf).sort((a,b) => new Date(b.date) - new Date(a.date));
  return (
    <Section title="Stock Ledger" sub="Complete audit trail">
      <select value={pf} onChange={e => setPf(e.target.value)} style={{marginBottom:16, background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, padding:"9px 13px", color:C.ink, fontSize:13, outline:"none"}}>
        <option value="All">All Products</option>
        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
      <Card style={{overflow:"hidden", padding:0}}>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%", borderCollapse:"collapse"}}>
            <thead><tr>
              <Th ch="Date"/><Th ch="Product"/><Th ch="Type"/><Th ch="Qty" right/><Th ch="Balance" right/><Th ch="Reference"/>
            </tr></thead>
            <tbody>
              {rows.map(l => {
                const p = products.find(x => x.id === l.pid);
                return <tr key={l.id}>
                  <Td ch={l.date}/>
                  <Td ch={p && p.name} bold color={C.ink}/>
                  <Td ch={<Pill label={l.type} c={C.brand}/>}/>
                  <Td ch={<span style={{color:l.qty>0?C.greenL:C.accent, fontWeight:700}}>{l.qty>0?"+":""}{fmtN(l.qty)}</span>} right/>
                  <Td ch={fmtN(l.bal)} right bold color={C.ink}/>
                  <Td ch={l.ref} mono small/>
                </tr>;
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </Section>
  );
};

const Adjust = ({products, setProducts, setLedger}) => {
  const [form, setForm] = useState({pid:"", type:"PURCHASE", qty:"", note:""});
  const [confirm, setConfirm] = useState(null);
  const selP = products.find(p => p.id === +form.pid);
  const isOut = ["DISPATCH", "DAMAGE"].includes(form.type);
  const delta = +form.qty * (isOut ? -1 : 1);
  const newBal = selP ? selP.stock + delta : null;

  const save = () => {
    setProducts(prev => prev.map(p => p.id === +confirm.pid ? {...p, stock:confirm.newBal} : p));
    setLedger(prev => [...prev, {id:newId(), pid:+confirm.pid, type:confirm.type, qty:confirm.delta, bal:confirm.newBal, date:today(), ref:confirm.type+"-"+Date.now().toString().slice(-5), by:"Admin", note:confirm.note}]);
    setConfirm(null);
    setForm({pid:"", type:"PURCHASE", qty:"", note:""});
  };

  return (
    <Section title="Adjust Stock" sub="Record movements manually">
      <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:20}}>
        <Card style={{padding:24}}>
          <div style={{fontSize:14, fontWeight:700, color:C.ink, marginBottom:18}}>Adjustment Form</div>
          <div style={{display:"flex", flexDirection:"column", gap:14}}>
            <Inp label="Product" value={form.pid} onChange={v => setForm(f => ({...f, pid:v}))} opts={[""].concat(products.map(p => p.id+""))}/>
            <Inp label="Type" value={form.type} onChange={v => setForm(f => ({...f, type:v}))} opts={["PURCHASE","RETURN","DAMAGE","ADJUSTMENT"]}/>
            <Inp label="Quantity" value={form.qty} onChange={v => setForm(f => ({...f, qty:v}))} type="number"/>
            <Inp label="Notes" value={form.note} onChange={v => setForm(f => ({...f, note:v}))}/>
            {selP && form.qty > 0 && (
              <div style={{background:C.raised, border:`1px solid ${C.border}`, borderRadius:8, padding:"12px 14px"}}>
                <div style={{display:"flex", justifyContent:"space-between", marginBottom:4}}>
                  <span style={{fontSize:12, color:C.mid}}>Current</span>
                  <strong style={{color:C.ink, fontSize:13}}>{fmtN(selP.stock)} {selP.unit}</strong>
                </div>
                <div style={{display:"flex", justifyContent:"space-between"}}>
                  <span style={{fontSize:12, color:C.mid}}>After adjustment</span>
                  <strong style={{fontSize:14, color:newBal>=0?C.greenL:C.red}}>{fmtN(newBal)}</strong>
                </div>
              </div>
            )}
            <Btn ch="Record Movement" onClick={() => { if (form.pid && form.qty && +form.qty > 0 && newBal >= 0) setConfirm({...form, prod:selP, delta, newBal}); }} full disabled={!form.pid || !form.qty || +form.qty <= 0 || newBal < 0}/>
          </div>
        </Card>
      </div>
      {confirm && (
        <Modal title="Confirm Stock Movement" onClose={() => setConfirm(null)}>
          {[["Product", confirm.prod.name], ["Type", confirm.type], ["Qty", fmtN(confirm.delta)], ["New Balance", fmtN(confirm.newBal)]].map(([k,v],i) => (
            <div key={i} style={{display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:i<3?`1px solid ${C.line}`:"none"}}>
              <span style={{color:C.mid, fontSize:13}}>{k}</span>
              <strong style={{color:C.ink, fontSize:13}}>{v}</strong>
            </div>
          ))}
          <div style={{display:"flex", gap:8, justifyContent:"flex-end", marginTop:16}}>
            <Btn ch="Cancel" outline color={C.faint} onClick={() => setConfirm(null)}/>
            <Btn ch="Confirm" color={C.green} onClick={save}/>
          </div>
        </Modal>
      )}
    </Section>
  );
};

// ============================================================
// PHASE 2 SCREENS
// ============================================================
const Buyers = ({buyers, setBuyers, orders}) => {
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({name:"", gstin:"", phone:"", email:"", city:"", state:"", type:"Proprietor", msme:"", creditLimit:"50000"});

  const saveBuyer = () => {
    if (!form.name || !form.gstin) return;
    setBuyers(b => [...b, {id:Math.max(...b.map(x=>x.id),0)+1, ...form, creditLimit:+form.creditLimit, riskScore:0, status:"approved", joined:today()}]);
    setModal(null);
  };

  return (
    <Section title="Buyers" sub="KYC Management" action={<Btn ch="+ Add Buyer" onClick={() => setModal(true)}/>}>
      <Card style={{overflow:"hidden", padding:0}}>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%", borderCollapse:"collapse"}}>
            <thead><tr>
              <Th ch="Business"/><Th ch="GSTIN"/><Th ch="City"/><Th ch="Credit Limit" right/><Th ch="MSME"/><Th ch="Status"/>
            </tr></thead>
            <tbody>
              {buyers.map(b => (
                <tr key={b.id}>
                  <Td ch={<div><div style={{fontWeight:700, color:C.ink, fontSize:13}}>{b.name}</div><div style={{fontSize:11, color:C.faint}}>{b.email}</div></div>}/>
                  <Td ch={b.gstin} mono small/>
                  <Td ch={b.city}/>
                  <Td ch={cur(b.creditLimit)} right/>
                  <Td ch={b.msme?<Pill label="MSME" c={C.green}/>:"—"}/>
                  <Td ch={<Pill label={b.status} c={b.status==="approved"?C.green:C.gold}/>}/>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      {modal && (
        <Modal title="Add Buyer" onClose={() => setModal(false)}>
          <div style={{display:"flex", flexDirection:"column", gap:14}}>
            <Inp label="Business Name" value={form.name} onChange={v => setForm(f => ({...f, name:v}))} req/>
            <Inp label="GSTIN" value={form.gstin} onChange={v => setForm(f => ({...f, gstin:v.toUpperCase()}))} req/>
            <Inp label="Email" value={form.email} onChange={v => setForm(f => ({...f, email:v}))}/>
            <Inp label="Phone" value={form.phone} onChange={v => setForm(f => ({...f, phone:v}))}/>
            <Inp label="City" value={form.city} onChange={v => setForm(f => ({...f, city:v}))}/>
            <Inp label="Credit Limit" value={form.creditLimit} onChange={v => setForm(f => ({...f, creditLimit:v}))} type="number"/>
            <Btn ch="Add Buyer" onClick={saveBuyer}/>
          </div>
        </Modal>
      )}
    </Section>
  );
};

const Orders = ({orders, setOrders, buyers, products, setPage}) => {
  const [statusF, setStatusF] = useState("All");
  const filtered = [...orders].filter(o => statusF === "All" || o.status === statusF).sort((a,b) => new Date(b.date) - new Date(a.date));

  return (
    <Section title="Orders" sub="Review and approve">
      <div style={{display:"flex", gap:8, marginBottom:20, flexWrap:"wrap"}}>
        {["All", "pending", "approved", "dispatched"].map(s => (
          <button key={s} onClick={() => setStatusF(s)} style={{padding:"5px 12px", borderRadius:16, border:"none", cursor:"pointer", fontSize:11, fontWeight:statusF===s?700:400, fontFamily:"inherit", background:statusF===s?C.brand:C.muted, color:statusF===s?"#fff":C.mid}}>
            {s}
          </button>
        ))}
      </div>
      <Card style={{overflow:"hidden", padding:0}}>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%", borderCollapse:"collapse"}}>
            <thead><tr>
              <Th ch="Order ID"/><Th ch="Buyer"/><Th ch="Amount" right/><Th ch="Items"/><Th ch="Status"/><Th ch="Actions"/>
            </tr></thead>
            <tbody>
              {filtered.map(o => {
                const buyer = buyers.find(b => b.id === o.buyerId);
                const grand = oGrand(o.items);
                return <tr key={o.id}>
                  <Td ch={o.id} mono bold color={C.brandHov}/>
                  <Td ch={buyer && buyer.name} bold color={C.ink}/>
                  <Td ch={cur(grand)} right bold color={C.ink}/>
                  <Td ch={o.items.length}/>
                  <Td ch={<Pill label={o.status} c={o.status==="pending"?C.gold:o.status==="approved"?C.brand:C.green}/>}/>
                  <Td ch={o.status==="pending"&&<Btn ch="Approve" sm color={C.green} onClick={() => setOrders(x => x.map(z => z.id===o.id?{...z,status:"approved"}:z))}/>}/>
                </tr>;
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </Section>
  );
};

const Dispatch = ({orders, setOrders, buyers, products, setLedger}) => {
  const queue = orders.filter(o => o.status === "approved");
  const doDispatch = (o) => {
    const grand = oGrand(o.items);
    const invNo = "INV-2026-" + String(orders.filter(x => x.invoice).length + 1).padStart(3,"0");
    setLedger(prev => [...prev, ...o.items.map(i => ({id:newId()+i.pid, pid:i.pid, type:"DISPATCH", qty:-i.qty, bal:0, date:today(), ref:o.id, by:"System", note:""}))]);
    setOrders(prev => prev.map(x => x.id === o.id ? {...x, status:"dispatched", dispatch:{date:today(), vehicle:"", transporter:""}, invoice:{no:invNo, date:today(), irn:"auto-gen", due:addD(today(),45), paid:false}} : x));
  };

  return (
    <Section title="Dispatch Queue" sub="Approved orders ready to ship">
      {queue.length === 0 ? <Alert type="success" ch="No pending dispatch"/> : queue.map(o => (
        <Card key={o.id} style={{padding:20, marginBottom:16}}>
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12}}>
            <div>
              <div style={{fontSize:15, fontWeight:800, color:C.brandHov}}>{o.id}</div>
              <div style={{fontSize:13, color:C.ink, fontWeight:600, marginTop:4}}>{buyers.find(b => b.id === o.buyerId) && buyers.find(b => b.id === o.buyerId).name}</div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:22, fontWeight:900, color:C.ink}}>{cur(oGrand(o.items))}</div>
            </div>
          </div>
          <Btn ch="Dispatch & Generate Invoice" color={C.accent} onClick={() => doDispatch(o)}/>
        </Card>
      ))}
    </Section>
  );
};

const Invoices = ({orders, setOrders, buyers, products}) => {
  const invoiced = orders.filter(o => o.invoice);
  const unpaid = invoiced.filter(o => !o.invoice.paid);
  const totalOR = unpaid.reduce((s,o) => s + oGrand(o.items), 0);

  return (
    <Section title="GST Invoices" sub={`${invoiced.length} invoices, ${unpaid.length} unpaid`}>
      {unpaid.length > 0 && <Alert type="warn" ch={`Rs ${fmtD(totalOR)} outstanding`}/>}
      <Card style={{overflow:"hidden", padding:0}}>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%", borderCollapse:"collapse"}}>
            <thead><tr>
              <Th ch="Invoice"/><Th ch="Buyer"/><Th ch="Amount" right/><Th ch="Due"/><Th ch="Status"/><Th ch="Actions"/>
            </tr></thead>
            <tbody>
              {invoiced.map(o => {
                const buyer = buyers.find(b => b.id === o.buyerId);
                const grand = oGrand(o.items);
                return <tr key={o.id}>
                  <Td ch={o.invoice.no} mono bold color={C.brandHov}/>
                  <Td ch={buyer && buyer.name}/>
                  <Td ch={cur(grand)} right bold color={C.ink}/>
                  <Td ch={o.invoice.due}/>
                  <Td ch={<Pill label={o.invoice.paid?"PAID":"UNPAID"} c={o.invoice.paid?C.green:C.red}/>}/>
                  <Td ch={!o.invoice.paid && <Btn ch="Mark Paid" sm color={C.green} onClick={() => setOrders(x => x.map(z => z.id===o.id?{...z,invoice:{...z.invoice,paid:true}}:z))}/>}/>
                </tr>;
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </Section>
  );
};

// ============================================================
// PHASE 3 SCREENS
// ============================================================
const PaymentTracker = ({payments, setPayments}) => {
  const totalOverdue = payments.filter(p => p.status === "pending" || p.status === "offline_pending").reduce((s,p) => s + p.amount, 0);
  const overdue = payments.filter(p => p.dueDate < today());

  return (
    <Section title="Payment Tracker" sub="45-Day Reminders & Collections">
      {overdue.length > 0 && <Alert type="error" ch={`${overdue.length} invoice(s) overdue. Total: ${cur(totalOverdue)}`}/>}
      <Card style={{overflow:"hidden", padding:0}}>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%", borderCollapse:"collapse"}}>
            <thead><tr>
              <Th ch="Invoice"/><Th ch="Amount" right/><Th ch="Due Date"/><Th ch="Days Overdue" right/><Th ch="Interest" right/><Th ch="Status"/>
            </tr></thead>
            <tbody>
              {payments.map(p => {
                const daysOD = Math.max(0, daysBetween(new Date(p.dueDate), new Date(today())));
                const interest = daysOD > 0 ? compoundInterest(p.amount, daysOD) : 0;
                return <tr key={p.id}>
                  <Td ch={p.invoiceNo} mono/>
                  <Td ch={cur(p.amount)} right/>
                  <Td ch={p.dueDate}/>
                  <Td ch={daysOD} right color={daysOD > 45 ? C.red : daysOD > 0 ? C.gold : C.green}/>
                  <Td ch={interest > 0 ? cur(interest) : "-"} right/>
                  <Td ch={<Pill label={p.status} c={p.status==="pending"?C.gold:C.green}/>}/>
                </tr>;
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </Section>
  );
};

const PaymentGateway = ({payments, setPayments, banks}) => {
  const defaultBank = banks.find(b => b.default);

  return (
    <Section title="Payment Gateway" sub="UPI Deep Links & QR Codes">
      {!defaultBank && <Alert type="error" ch="Set up a default bank first"/>}
      <Card style={{overflow:"hidden", padding:0}}>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%", borderCollapse:"collapse"}}>
            <thead><tr>
              <Th ch="Invoice"/><Th ch="Amount" right/><Th ch="Buyer"/><Th ch="Status"/><Th ch="Actions"/>
            </tr></thead>
            <tbody>
              {payments.filter(p => p.type === "online").map(p => (
                <tr key={p.id}>
                  <Td ch={p.invoiceNo} mono/>
                  <Td ch={cur(p.amount)} right/>
                  <Td ch={p.buyerName}/>
                  <Td ch={<Pill label={p.status} c={p.status==="pending"?C.gold:C.green}/>}/>
                  <Td ch={p.status==="pending" && defaultBank && <Btn ch="Generate Link" sm color={C.brand}/>}/>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </Section>
  );
};

const BankSetup = ({banks, setBanks}) => {
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({accountName:"", upiId:"", accountNo:"", ifsc:"", ownerName:""});

  const addBank = () => {
    if (!form.accountName || !form.upiId) return;
    setBanks(b => [...b, {...form, id:Math.max(...b.map(x=>x.id),0)+1, active:true, default:b.every(x=>!x.default)}]);
    setModal(false);
  };

  return (
    <Section title="Bank Setup" sub="Add UPI accounts for payment collection" action={<Btn ch="+ Add Bank" onClick={() => setModal(true)}/>}>
      <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:16}}>
        {banks.map(b => (
          <Card key={b.id} style={{padding:18, border:b.default?`2px solid ${C.brand}`:`1px solid ${C.border}`}}>
            <div style={{fontSize:14, fontWeight:800, color:C.ink, marginBottom:2}}>{b.accountName}</div>
            <div style={{fontSize:11, color:C.mid, marginBottom:12}}>{b.bankName}</div>
            <div style={{background:C.raised, borderRadius:6, padding:8, marginBottom:12, fontFamily:"monospace", fontSize:12, color:C.brandHov, fontWeight:700, wordBreak:"break-all"}}>
              {b.upiId}
            </div>
            {b.default && <Pill label="DEFAULT" c={C.brand}/>}
          </Card>
        ))}
      </div>
      {modal && (
        <Modal title="Add Bank Account" onClose={() => setModal(false)}>
          <div style={{display:"flex", flexDirection:"column", gap:14}}>
            <Inp label="Account Name" value={form.accountName} onChange={v => setForm(f => ({...f, accountName:v}))} req/>
            <Inp label="UPI ID" value={form.upiId} onChange={v => setForm(f => ({...f, upiId:v}))} placeholder="upiid@bank" req/>
            <Inp label="Account Number" value={form.accountNo} onChange={v => setForm(f => ({...f, accountNo:v}))}/>
            <Inp label="IFSC Code" value={form.ifsc} onChange={v => setForm(f => ({...f, ifsc:v}))}/>
            <Inp label="Owner Name" value={form.ownerName} onChange={v => setForm(f => ({...f, ownerName:v}))}/>
            <div style={{display:"flex", gap:8, justifyContent:"flex-end"}}>
              <Btn ch="Cancel" outline color={C.faint} onClick={() => setModal(false)}/>
              <Btn ch="Add Account" onClick={addBank}/>
            </div>
          </div>
        </Modal>
      )}
    </Section>
  );
};
