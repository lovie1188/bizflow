import { useState, useEffect, useRef } from "react";

/* ═══════════════════════════════════════════════════════════════
   BIZFLOW INDIA  —  PHASE 2
   Buyer Registration · Purchase Orders · Dispatch · GST E-Invoice
   ═══════════════════════════════════════════════════════════════ */

// ── TOKENS ────────────────────────────────────────────────────
const T = {
  // Admin (dark)
  adminBg: "#080C14", adminSurface: "#0F1624", adminCard: "#141D2E",
  adminBorder: "#1E2D45", adminMuted: "#253347",
  // Buyer (light warm)
  buyerBg: "#F7F3EE", buyerSurface: "#FFFFFF", buyerCard: "#FDF9F5",
  buyerBorder: "#E8DDD0", buyerMuted: "#C8B8A8",
  // Shared brand
  brand: "#1A4FBA", brandLight: "#3B73E8", brandGlow: "#3B73E822",
  accent: "#E8620A", accentLight: "#F97316",
  green: "#059669", greenLight: "#10B981",
  red: "#DC2626", redLight: "#EF4444",
  gold: "#D97706", goldLight: "#F59E0B",
  ink: "#0F1624", inkLight: "#2D3B55",
  paper: "#F7F3EE", paperDark: "#EDE5D8",
  cream: "#FFFDF9",
  text: { dark: "#E8F0FF", mid: "#7A9BC2", faint: "#3A5070" },
  textLight: { dark: "#1A2540", mid: "#5A6F8A", faint: "#9AAFCA" },
};

// ── SEED DATA ─────────────────────────────────────────────────
const PRODUCTS = [
  { id: 1, sku: "BF-001", name: "Cotton Fabric (White)", hsn: "520811", gst: 5,  unit: "Metre",  tradePrice: 120, stock: 2340, category: "Fabric" },
  { id: 2, sku: "BF-002", name: "Polyester Blend Fabric", hsn: "540742", gst: 12, unit: "Metre",  tradePrice: 95,  stock: 85,   category: "Fabric" },
  { id: 3, sku: "BF-003", name: "Denim Fabric (Blue)",    hsn: "520942", gst: 5,  unit: "Metre",  tradePrice: 200, stock: 0,    category: "Fabric" },
  { id: 4, sku: "CH-001", name: "Brass Zip 20cm",         hsn: "963200", gst: 18, unit: "Nos",    tradePrice: 15,  stock: 4500, category: "Accessories" },
  { id: 5, sku: "CH-002", name: "Plastic Buttons (12mm)", hsn: "960610", gst: 12, unit: "Nos",    tradePrice: 3,   stock: 420,  category: "Accessories" },
  { id: 6, sku: "TH-001", name: "Polyester Thread (Black)",hsn:"540200", gst: 12, unit: "Box",    tradePrice: 380, stock: 180,  category: "Thread" },
  { id: 7, sku: "TH-002", name: "Cotton Thread (Assorted)",hsn:"520400", gst: 5,  unit: "Box",    tradePrice: 440, stock: 22,   category: "Thread" },
];

const BUYERS_SEED = [
  { id: 1, name: "Sharma Textiles Pvt Ltd", gstin: "27AABCU9603R1ZX", pan: "AABCU9603R", phone: "9876543210", email: "sharma@textiles.com", city: "Mumbai", state: "Maharashtra", creditLimit: 200000, usedCredit: 45000, msme: "UDYAM-MH-01-0012345", type: "Pvt Ltd", status: "approved", joined: "2026-01-15", riskScore: 85 },
  { id: 2, name: "Gupta Garments", gstin: "07AAACG1234C1Z5", pan: "AAACG1234C", phone: "9812345678", email: "gupta@garments.in", city: "Delhi", state: "Delhi", creditLimit: 100000, usedCredit: 98000, msme: "", type: "Proprietor", status: "approved", joined: "2026-02-10", riskScore: 42 },
  { id: 3, name: "Rajasthan Fabrics LLP", gstin: "08AABFR5678D1ZP", pan: "AABFR5678D", phone: "9001234567", email: "raj@fabrics.com", city: "Jaipur", state: "Rajasthan", creditLimit: 150000, usedCredit: 0, msme: "UDYAM-RJ-03-0067890", type: "LLP", status: "pending", joined: "2026-04-18", riskScore: 0 },
];

const ORDERS_SEED = [
  {
    id: "ORD-2026-001", buyerId: 1, date: "2026-04-10", status: "dispatched",
    items: [{ productId: 1, qty: 500, price: 120, gst: 5 }, { productId: 4, qty: 200, price: 15, gst: 18 }],
    deliveryAddr: "Unit 4, Dharavi Industrial Estate, Mumbai 400017",
    dispatch: { date: "2026-04-12", vehicle: "MH12AB1234", transporter: "Shree Cargo", ewb: "EWB-7892341567" },
    invoice: { no: "INV-2026-001", date: "2026-04-12", irn: "a3f9b2c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1", due: "2026-05-27" },
    notes: "",
  },
  {
    id: "ORD-2026-002", buyerId: 2, date: "2026-04-14", status: "approved",
    items: [{ productId: 6, qty: 20, price: 380, gst: 12 }, { productId: 7, qty: 10, price: 440, gst: 5 }],
    deliveryAddr: "45 Gandhi Nagar, Shahdara, Delhi 110032",
    dispatch: null, invoice: null, notes: "Urgent — needed by April 25",
  },
  {
    id: "ORD-2026-003", buyerId: 1, date: "2026-04-18", status: "pending",
    items: [{ productId: 2, qty: 80, price: 95, gst: 12 }],
    deliveryAddr: "Unit 4, Dharavi Industrial Estate, Mumbai 400017",
    dispatch: null, invoice: null, notes: "",
  },
];

// ── HELPERS ───────────────────────────────────────────────────
const fmt   = n => new Intl.NumberFormat("en-IN").format(Math.round(n));
const fmtD  = n => new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
const cur   = n => "₹" + fmtD(n);
const today = () => new Date().toISOString().slice(0, 10);
const addDays = (d, n) => { const dt = new Date(d); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };
const orderTotal = (items) => items.reduce((s, i) => s + i.qty * i.price, 0);
const orderGST   = (items) => items.reduce((s, i) => s + i.qty * i.price * i.gst / 100, 0);
const orderGrand = (items) => orderTotal(items) + orderGST(items);
const genIRN = () => Array.from({ length: 64 }, () => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join("");
const genEWB = () => "EWB-" + Math.floor(1000000000 + Math.random() * 9000000000);
const statusMeta = {
  pending:    { label: "Pending Review",  color: T.gold,  bg: T.gold  + "20", icon: "⏳" },
  approved:   { label: "Approved",        color: T.brand, bg: T.brand + "20", icon: "✅" },
  dispatched: { label: "Dispatched",      color: T.green, bg: T.green + "20", icon: "🚚" },
  rejected:   { label: "Rejected",        color: T.red,   bg: T.red   + "20", icon: "✕" },
  delivered:  { label: "Delivered",       color: T.greenLight, bg: T.greenLight + "20", icon: "📦" },
};

// ── SHARED UI ─────────────────────────────────────────────────
const Badge = ({ status, custom }) => {
  const m = custom || statusMeta[status] || statusMeta.pending;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700,
      padding: "3px 9px", borderRadius: 20, background: m.bg, color: m.color, letterSpacing: 0.3, whiteSpace: "nowrap" }}>
      {m.icon} {m.label}
    </span>
  );
};

const Modal = ({ title, sub, onClose, children, wide, light }) => (
  <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 2000,
    display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
    <div style={{ background: light ? T.cream : T.adminCard, border: `1px solid ${light ? T.buyerBorder : T.adminBorder}`,
      borderRadius: 18, width: "100%", maxWidth: wide ? 860 : 560, maxHeight: "92vh", overflowY: "auto",
      boxShadow: "0 32px 80px rgba(0,0,0,0.6)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start",
        padding: "22px 28px 18px", borderBottom: `1px solid ${light ? T.buyerBorder : T.adminBorder}` }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: light ? T.ink : T.text.dark, fontFamily: "Georgia, serif" }}>{title}</div>
          {sub && <div style={{ fontSize: 13, color: light ? T.textLight.mid : T.text.mid, marginTop: 3 }}>{sub}</div>}
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer",
          color: light ? T.textLight.mid : T.text.mid, fontSize: 22, lineHeight: 1 }}>✕</button>
      </div>
      <div style={{ padding: "24px 28px" }}>{children}</div>
    </div>
  </div>
);

// ══════════════════════════════════════════════════════════════
//  BUYER PORTAL
// ══════════════════════════════════════════════════════════════
const BuyerApp = ({ onSwitchRole, products, buyers, setBuyers, orders, setOrders }) => {
  const [screen, setScreen] = useState("login"); // login | register | home | catalog | myorders | orderdetail
  const [currentBuyer, setCurrentBuyer] = useState(null);
  const [cart, setCart] = useState([]);
  const [viewOrder, setViewOrder] = useState(null);
  const [regForm, setRegForm] = useState({ name:"", gstin:"", pan:"", phone:"", email:"", city:"", state:"", type:"Proprietor", msme:"" });
  const [gstVerified, setGstVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [loginPhone, setLoginPhone] = useState("");
  const [loginOtp, setLoginOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [placeModal, setPlaceModal] = useState(false);
  const [deliveryAddr, setDeliveryAddr] = useState("");
  const [notes, setNotes] = useState("");
  const [orderSuccess, setOrderSuccess] = useState(null);

  const myOrders = orders.filter(o => o.buyerId === currentBuyer?.id);
  const usedCredit = myOrders.filter(o => o.status !== "rejected").reduce((s,o) => s + orderGrand(o.items), 0);
  const availCredit = (currentBuyer?.creditLimit || 0) - usedCredit;

  const verifyGST = () => {
    setVerifying(true);
    setTimeout(() => {
      if (regForm.gstin.length === 15) {
        setGstVerified(true);
        setRegForm(f => ({ ...f, name: f.name || "Auto-fetched Business Name", state: f.state || "Maharashtra" }));
      }
      setVerifying(false);
    }, 1200);
  };

  const sendOtp = () => {
    if (loginPhone.length === 10) setOtpSent(true);
  };

  const loginWithOtp = () => {
    const buyer = buyers.find(b => b.phone === loginPhone);
    if (buyer && loginOtp === "1234") {
      setCurrentBuyer(buyer);
      setDeliveryAddr(buyer.city);
      setScreen("home");
    }
  };

  const submitReg = () => {
    const newBuyer = {
      id: buyers.length + 1, ...regForm,
      creditLimit: 50000, usedCredit: 0,
      status: "pending", joined: today(), riskScore: 0,
    };
    setBuyers(b => [...b, newBuyer]);
    setCurrentBuyer(newBuyer);
    setScreen("home");
  };

  const addToCart = (product, qty) => {
    setCart(c => {
      const ex = c.find(i => i.productId === product.id);
      if (ex) return c.map(i => i.productId === product.id ? { ...i, qty: i.qty + qty } : i);
      return [...c, { productId: product.id, qty, price: product.tradePrice, gst: product.gst }];
    });
  };

  const placeOrder = () => {
    const newOrder = {
      id: "ORD-2026-" + String(orders.length + 1).padStart(3, "0"),
      buyerId: currentBuyer.id, date: today(), status: "pending",
      items: cart, deliveryAddr, notes, dispatch: null, invoice: null,
    };
    setOrders(o => [...o, newOrder]);
    setCart([]);
    setPlaceModal(false);
    setOrderSuccess(newOrder.id);
    setScreen("myorders");
    setTimeout(() => setOrderSuccess(null), 5000);
  };

  const cartTotal = cart.reduce((s, i) => s + i.qty * i.price, 0);
  const cartGST   = cart.reduce((s, i) => s + i.qty * i.price * i.gst / 100, 0);
  const cartGrand = cartTotal + cartGST;

  // Styles
  const S = {
    bg: { minHeight: "100vh", background: T.buyerBg, fontFamily: "'Georgia', serif", color: T.ink },
    header: { background: T.cream, borderBottom: `1px solid ${T.buyerBorder}`, padding: "0 24px",
      display: "flex", alignItems: "center", justifyContent: "space-between", height: 60, position: "sticky", top: 0, zIndex: 100 },
    logo: { fontFamily: "Georgia, serif", fontWeight: 700, fontSize: 20, color: T.brand, letterSpacing: -0.5 },
    nav: { display: "flex", gap: 4 },
    navBtn: (active) => ({ padding: "6px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13,
      fontFamily: "Georgia, serif", background: active ? T.brand : "transparent", color: active ? "#fff" : T.inkLight }),
    card: { background: T.buyerSurface, border: `1px solid ${T.buyerBorder}`, borderRadius: 14, padding: 24 },
    input: { width: "100%", border: `1px solid ${T.buyerBorder}`, borderRadius: 8, padding: "10px 14px",
      fontSize: 14, fontFamily: "Georgia, serif", background: T.cream, color: T.ink, outline: "none", boxSizing: "border-box" },
    label: { fontSize: 11, fontWeight: 700, color: T.textLight.mid, letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 5 },
    btn: (color = T.brand) => ({ padding: "11px 22px", borderRadius: 9, border: "none", cursor: "pointer", fontSize: 14,
      fontFamily: "Georgia, serif", fontWeight: 700, background: color, color: "#fff", display: "inline-flex", alignItems: "center", gap: 6 }),
    btnOutline: { padding: "10px 20px", borderRadius: 9, border: `1px solid ${T.buyerBorder}`, cursor: "pointer",
      fontSize: 13, fontFamily: "Georgia, serif", background: "transparent", color: T.textLight.mid },
  };

  // ── LOGIN ──
  if (screen === "login") return (
    <div style={{ ...S.bg, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🏪</div>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 28, fontWeight: 700, color: T.brand }}>BizFlow Buyer</div>
          <div style={{ fontSize: 14, color: T.textLight.mid, marginTop: 4 }}>India's trusted B2B commerce platform</div>
        </div>
        <div style={S.card}>
          {!otpSent ? (
            <>
              <div style={{ fontSize: 18, fontWeight: 700, color: T.ink, marginBottom: 20 }}>Login with Mobile OTP</div>
              <label style={S.label}>Mobile Number</label>
              <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                <span style={{ padding: "10px 12px", background: T.paperDark, borderRadius: 8, border: `1px solid ${T.buyerBorder}`, fontSize: 14, color: T.textLight.mid }}>+91</span>
                <input style={{ ...S.input, flex: 1 }} placeholder="10-digit number" maxLength={10}
                  value={loginPhone} onChange={e => setLoginPhone(e.target.value)} />
              </div>
              <button style={{ ...S.btn(), width: "100%", justifyContent: "center" }} onClick={sendOtp}>Send OTP</button>
              <div style={{ textAlign: "center", margin: "16px 0", color: T.textLight.faint, fontSize: 13 }}>— or —</div>
              <button style={{ ...S.btnOutline, width: "100%", textAlign: "center" }} onClick={() => setScreen("register")}>Register New Business</button>
            </>
          ) : (
            <>
              <div style={{ fontSize: 18, fontWeight: 700, color: T.ink, marginBottom: 6 }}>Enter OTP</div>
              <div style={{ fontSize: 13, color: T.textLight.mid, marginBottom: 20 }}>Sent to +91 {loginPhone} · Use <strong>1234</strong> for demo</div>
              <label style={S.label}>OTP</label>
              <input style={{ ...S.input, marginBottom: 16, letterSpacing: 6, fontSize: 22, textAlign: "center" }}
                maxLength={4} value={loginOtp} onChange={e => setLoginOtp(e.target.value)} placeholder="- - - -" />
              <button style={{ ...S.btn(), width: "100%", justifyContent: "center" }} onClick={loginWithOtp}>Verify & Login</button>
              <div style={{ fontSize: 12, color: T.textLight.faint, textAlign: "center", marginTop: 10 }}>Demo phones: 9876543210 (Sharma) · 9812345678 (Gupta)</div>
            </>
          )}
        </div>
        <div style={{ textAlign: "center", marginTop: 20 }}>
          <button onClick={onSwitchRole} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: T.textLight.faint }}>
            → Admin Login
          </button>
        </div>
      </div>
    </div>
  );

  // ── REGISTER ──
  if (screen === "register") return (
    <div style={{ ...S.bg, padding: "32px 16px" }}>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <button onClick={() => setScreen("login")} style={{ ...S.btnOutline, marginBottom: 24 }}>← Back</button>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 26, fontWeight: 700, color: T.brand, marginBottom: 6 }}>Register Your Business</div>
        <div style={{ fontSize: 14, color: T.textLight.mid, marginBottom: 28 }}>GSTIN verification is mandatory to place orders</div>
        <div style={S.card}>
          {/* GSTIN verify */}
          <div style={{ background: T.brand + "0F", border: `1px solid ${T.brand}33`, borderRadius: 10, padding: "16px 18px", marginBottom: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.brand, marginBottom: 10 }}>Step 1 — Verify GSTIN</div>
            <div style={{ display: "flex", gap: 8 }}>
              <input style={{ ...S.input, flex: 1 }} placeholder="15-digit GSTIN e.g. 27AABCU9603R1ZX"
                value={regForm.gstin} onChange={e => setRegForm(f => ({ ...f, gstin: e.target.value.toUpperCase() }))} maxLength={15} />
              <button style={{ ...S.btn(gstVerified ? T.green : T.brand), whiteSpace: "nowrap" }} onClick={verifyGST} disabled={verifying}>
                {verifying ? "Verifying…" : gstVerified ? "✓ Verified" : "Verify"}
              </button>
            </div>
            {gstVerified && <div style={{ fontSize: 12, color: T.green, marginTop: 8 }}>✓ GSTIN verified via GST API · Business details auto-filled</div>}
          </div>

          <div style={{ fontSize: 13, fontWeight: 700, color: T.inkLight, marginBottom: 14 }}>Step 2 — Business Details</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
            {[
              { label: "Business Name", key: "name", placeholder: "As per GST registration" },
              { label: "PAN", key: "pan", placeholder: "AAACG1234C" },
              { label: "Phone", key: "phone", placeholder: "10-digit mobile" },
              { label: "Email", key: "email", placeholder: "business@domain.com" },
              { label: "City", key: "city", placeholder: "Mumbai" },
              { label: "State", key: "state", placeholder: "Maharashtra" },
            ].map(f => (
              <div key={f.key}>
                <label style={S.label}>{f.label}</label>
                <input style={S.input} value={regForm[f.key]} placeholder={f.placeholder}
                  onChange={e => setRegForm(r => ({ ...r, [f.key]: e.target.value }))} />
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 24 }}>
            <div>
              <label style={S.label}>Business Type</label>
              <select style={S.input} value={regForm.type} onChange={e => setRegForm(f => ({ ...f, type: e.target.value }))}>
                {["Proprietor", "Partnership", "LLP", "Pvt Ltd", "Ltd", "HUF"].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={S.label}>Udyam / MSME No. (optional)</label>
              <input style={S.input} value={regForm.msme} placeholder="UDYAM-MH-01-XXXXXXX"
                onChange={e => setRegForm(f => ({ ...f, msme: e.target.value }))} />
            </div>
          </div>
          <div style={{ background: T.gold + "10", border: `1px solid ${T.gold}44`, borderRadius: 8, padding: "12px 14px", marginBottom: 20, fontSize: 12, color: T.gold }}>
            ⚠️ Your account will be reviewed by admin within 24 hours before orders can be placed.
            MSME registration enables Section 43B(h) protection on payments.
          </div>
          <button style={{ ...S.btn(), width: "100%", justifyContent: "center" }} onClick={submitReg}>Submit Registration →</button>
        </div>
      </div>
    </div>
  );

  // ── BUYER HOME / CATALOG / MY ORDERS ──
  return (
    <div style={S.bg}>
      {/* Header */}
      <div style={S.header}>
        <div style={S.logo}>BizFlow <span style={{ color: T.accent }}>Buyer</span></div>
        <div style={S.nav}>
          {[["home","Home"],["catalog","Catalogue"],["myorders","My Orders"]].map(([k,l]) => (
            <button key={k} style={S.navBtn(screen===k)} onClick={() => setScreen(k)}>{l}</button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {cart.length > 0 && (
            <button onClick={() => setPlaceModal(true)} style={{ ...S.btn(T.accent), padding: "7px 14px", fontSize: 13 }}>
              🛒 Cart ({cart.length}) · {cur(cartGrand)}
            </button>
          )}
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>{currentBuyer?.name}</div>
            <div style={{ fontSize: 11, color: T.textLight.mid }}>Credit: {cur(availCredit)} available</div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 20px" }}>

        {/* pending approval banner */}
        {currentBuyer?.status === "pending" && (
          <div style={{ background: T.gold + "15", border: `1px solid ${T.gold}44`, borderRadius: 10,
            padding: "14px 18px", marginBottom: 24, display: "flex", gap: 10, alignItems: "center" }}>
            <span style={{ fontSize: 18 }}>⏳</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.gold }}>Account Pending Approval</div>
              <div style={{ fontSize: 13, color: T.textLight.mid }}>Admin is reviewing your registration. You can browse the catalogue but cannot place orders yet.</div>
            </div>
          </div>
        )}

        {/* HOME */}
        {screen === "home" && (
          <div>
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: T.brand, fontFamily: "Georgia, serif" }}>
                Welcome, {currentBuyer?.name?.split(" ")[0]}
              </div>
              <div style={{ fontSize: 14, color: T.textLight.mid, marginTop: 4 }}>{currentBuyer?.city} · {currentBuyer?.type} · GSTIN {currentBuyer?.gstin}</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16, marginBottom: 32 }}>
              {[
                { label: "Credit Limit", val: cur(currentBuyer?.creditLimit || 0), icon: "💳", color: T.brand },
                { label: "Used Credit", val: cur(usedCredit), icon: "📊", color: T.gold },
                { label: "Available", val: cur(Math.max(0, availCredit)), icon: "✅", color: T.green },
                { label: "My Orders", val: myOrders.length, icon: "📦", color: T.accent },
              ].map((k, i) => (
                <div key={i} style={{ background: T.buyerSurface, border: `1px solid ${T.buyerBorder}`, borderRadius: 12, padding: "18px 20px" }}>
                  <div style={{ fontSize: 22, marginBottom: 6 }}>{k.icon}</div>
                  <div style={{ fontSize: 11, color: T.textLight.mid, textTransform: "uppercase", letterSpacing: 0.8 }}>{k.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: k.color, marginTop: 4 }}>{k.val}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div style={S.card}>
                <div style={{ fontSize: 15, fontWeight: 700, color: T.ink, marginBottom: 16 }}>Recent Orders</div>
                {myOrders.slice(0, 3).map(o => (
                  <div key={o.id} onClick={() => { setViewOrder(o.id); setScreen("myorders"); }}
                    style={{ padding: "10px 0", borderBottom: `1px solid ${T.buyerBorder}`, cursor: "pointer", display: "flex", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: T.brand }}>{o.id}</div>
                      <div style={{ fontSize: 12, color: T.textLight.mid }}>{o.date} · {o.items.length} items</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>{cur(orderGrand(o.items))}</div>
                      <Badge status={o.status} />
                    </div>
                  </div>
                ))}
                {myOrders.length === 0 && <div style={{ color: T.textLight.mid, fontSize: 13 }}>No orders yet. Browse the catalogue!</div>}
              </div>
              <div style={S.card}>
                <div style={{ fontSize: 15, fontWeight: 700, color: T.ink, marginBottom: 14 }}>Quick Actions</div>
                {[
                  { icon: "📦", label: "Browse Catalogue", action: () => setScreen("catalog") },
                  { icon: "📋", label: "View My Orders", action: () => setScreen("myorders") },
                ].map((a, i) => (
                  <button key={i} onClick={a.action} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%",
                    background: T.buyerBg, border: `1px solid ${T.buyerBorder}`, borderRadius: 10, padding: "14px 16px",
                    cursor: "pointer", fontFamily: "Georgia, serif", fontSize: 14, color: T.ink, marginBottom: 10 }}>
                    <span style={{ fontSize: 22 }}>{a.icon}</span>{a.label}
                  </button>
                ))}
                {currentBuyer?.msme && (
                  <div style={{ background: T.green + "10", border: `1px solid ${T.green}33`, borderRadius: 8, padding: "10px 14px", fontSize: 12, color: T.green, marginTop: 8 }}>
                    🛡️ MSME Protected · Your invoices are covered under Section 43B(h) — buyers pay within 45 days or face tax penalties
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* CATALOG */}
        {screen === "catalog" && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 26, fontWeight: 700, color: T.brand, fontFamily: "Georgia, serif" }}>Product Catalogue</div>
              <div style={{ fontSize: 14, color: T.textLight.mid, marginTop: 4 }}>All prices exclude GST · GST added at checkout</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 18 }}>
              {PRODUCTS.map(p => {
                const inCart = cart.find(c => c.productId === p.id);
                const avail = p.stock > 0;
                return (
                  <ProductCard key={p.id} p={p} inCart={inCart} avail={avail} onAdd={addToCart} S={S} />
                );
              })}
            </div>
          </div>
        )}

        {/* MY ORDERS */}
        {screen === "myorders" && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 26, fontWeight: 700, color: T.brand, fontFamily: "Georgia, serif" }}>My Orders</div>
            </div>
            {orderSuccess && (
              <div style={{ background: T.green + "15", border: `1px solid ${T.green}44`, borderRadius: 10,
                padding: "14px 18px", marginBottom: 20, display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ fontSize: 20 }}>✅</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.green }}>Order {orderSuccess} placed successfully!</div>
                  <div style={{ fontSize: 13, color: T.textLight.mid }}>Admin will review and approve your order within 24 hours. You'll be notified via WhatsApp & SMS.</div>
                </div>
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {myOrders.length === 0
                ? <div style={{ ...S.card, textAlign: "center", padding: 48, color: T.textLight.mid }}>No orders yet. <button onClick={() => setScreen("catalog")} style={{ ...S.btn(), marginLeft: 8, padding: "8px 16px", fontSize: 13 }}>Browse Catalogue</button></div>
                : myOrders.map(o => <OrderCard key={o.id} order={o} products={PRODUCTS} S={S} expanded={viewOrder === o.id} onToggle={() => setViewOrder(v => v === o.id ? null : o.id)} />)
              }
            </div>
          </div>
        )}
      </div>

      {/* Cart / Place Order Modal */}
      {placeModal && (
        <Modal title="Review & Place Order" sub="Confirm items and delivery details" onClose={() => setPlaceModal(false)} wide light>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.inkLight, marginBottom: 12 }}>Order Items</div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr style={{ background: T.paperDark }}>
                {["Product", "Qty", "Rate", "GST%", "GST Amt", "Total"].map(h => (
                  <th key={h} style={{ padding: "8px 10px", fontSize: 11, color: T.textLight.mid, textAlign: "right", textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {cart.map(item => {
                  const prod = PRODUCTS.find(p => p.id === item.productId);
                  const base = item.qty * item.price;
                  const gstAmt = base * item.gst / 100;
                  return (
                    <tr key={item.productId}>
                      <td style={{ padding: "8px 10px", fontSize: 13, color: T.ink }}>{prod?.name}</td>
                      <td style={{ padding: "8px 10px", fontSize: 13, textAlign: "right", color: T.inkLight }}>{fmt(item.qty)} {prod?.unit}</td>
                      <td style={{ padding: "8px 10px", fontSize: 13, textAlign: "right", color: T.inkLight }}>{cur(item.price)}</td>
                      <td style={{ padding: "8px 10px", fontSize: 13, textAlign: "right", color: T.inkLight }}>{item.gst}%</td>
                      <td style={{ padding: "8px 10px", fontSize: 13, textAlign: "right", color: T.inkLight }}>{cur(gstAmt)}</td>
                      <td style={{ padding: "8px 10px", fontSize: 13, textAlign: "right", fontWeight: 700, color: T.ink }}>{cur(base + gstAmt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 24, padding: "12px 10px", background: T.paperDark, borderRadius: 8, marginTop: 6 }}>
              <div style={{ fontSize: 13, color: T.textLight.mid }}>Subtotal: <strong style={{ color: T.ink }}>{cur(cartTotal)}</strong></div>
              <div style={{ fontSize: 13, color: T.textLight.mid }}>GST: <strong style={{ color: T.ink }}>{cur(cartGST)}</strong></div>
              <div style={{ fontSize: 15, color: T.ink, fontWeight: 800 }}>Grand Total: {cur(cartGrand)}</div>
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={S.label}>Delivery Address</label>
            <textarea value={deliveryAddr} onChange={e => setDeliveryAddr(e.target.value)}
              style={{ ...S.input, minHeight: 70, resize: "vertical" }} placeholder="Full delivery address with pincode" />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={S.label}>Notes for Supplier (optional)</label>
            <input style={S.input} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Special instructions, urgency, etc." />
          </div>
          <div style={{ background: T.gold + "10", border: `1px solid ${T.gold}44`, borderRadius: 8, padding: "10px 14px", fontSize: 12, color: T.gold, marginBottom: 20 }}>
            💳 Available credit: {cur(availCredit)} · This order: {cur(cartGrand)} · {cartGrand > availCredit ? "⚠️ Exceeds limit — admin may adjust" : "✓ Within limit"}
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <button style={S.btnOutline} onClick={() => setPlaceModal(false)}>Cancel</button>
            <button style={S.btn()} onClick={placeOrder}>Place Order →</button>
          </div>
        </Modal>
      )}
    </div>
  );
};

const ProductCard = ({ p, inCart, avail, onAdd, S }) => {
  const [qty, setQty] = useState(1);
  const gstAmt = p.tradePrice * p.gst / 100;
  return (
    <div style={{ background: T.buyerSurface, border: `1px solid ${inCart ? T.brand : T.buyerBorder}`,
      borderRadius: 14, padding: 20, transition: "border-color 0.2s", boxShadow: inCart ? `0 0 0 2px ${T.brand}22` : "none" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 10, color: T.textLight.mid, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>{p.category}</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: T.ink, lineHeight: 1.3 }}>{p.name}</div>
          <div style={{ fontSize: 11, color: T.textLight.faint, marginTop: 3 }}>SKU: {p.sku} · HSN: {p.hsn}</div>
        </div>
        {!avail
          ? <span style={{ fontSize: 11, fontWeight: 700, color: T.red, background: T.red + "15", padding: "3px 8px", borderRadius: 8 }}>Out of Stock</span>
          : inCart
          ? <span style={{ fontSize: 11, fontWeight: 700, color: T.green, background: T.green + "15", padding: "3px 8px", borderRadius: 8 }}>✓ In Cart</span>
          : null}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: T.brand }}>₹{fmtD(p.tradePrice)}<span style={{ fontSize: 12, fontWeight: 400, color: T.textLight.mid }}>/{p.unit}</span></div>
          <div style={{ fontSize: 11, color: T.textLight.mid }}>+{p.gst}% GST (₹{fmtD(gstAmt)}) = ₹{fmtD(p.tradePrice + gstAmt)} incl.</div>
        </div>
        <div style={{ fontSize: 12, color: avail ? T.green : T.red }}>{avail ? `Stock: ${fmt(p.stock)} ${p.unit}` : "—"}</div>
      </div>
      {avail && (
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", border: `1px solid ${T.buyerBorder}`, borderRadius: 8, overflow: "hidden" }}>
            <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{ padding: "7px 12px", background: T.paperDark, border: "none", cursor: "pointer", fontSize: 16, color: T.inkLight }}>−</button>
            <span style={{ padding: "7px 14px", fontSize: 14, fontWeight: 700, color: T.ink, minWidth: 40, textAlign: "center" }}>{qty}</span>
            <button onClick={() => setQty(q => q + 1)} style={{ padding: "7px 12px", background: T.paperDark, border: "none", cursor: "pointer", fontSize: 16, color: T.inkLight }}>+</button>
          </div>
          <button onClick={() => onAdd(p, qty)} style={{ ...S.btn(inCart ? T.green : T.brand), flex: 1, justifyContent: "center", padding: "9px 14px", fontSize: 13 }}>
            {inCart ? "✓ Add More" : "Add to Cart"}
          </button>
        </div>
      )}
    </div>
  );
};

const OrderCard = ({ order, products, S, expanded, onToggle }) => {
  const grand = orderGrand(order.items);
  return (
    <div style={{ background: T.buyerSurface, border: `1px solid ${order.invoice ? T.brand + "55" : T.buyerBorder}`, borderRadius: 14, overflow: "hidden" }}>
      <div onClick={onToggle} style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: T.brand, fontFamily: "Georgia, serif" }}>{order.id}</div>
          <div style={{ fontSize: 12, color: T.textLight.mid, marginTop: 2 }}>{order.date} · {order.items.length} item{order.items.length > 1 ? "s" : ""}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: T.ink }}>{cur(grand)}</div>
            <div style={{ fontSize: 11, color: T.textLight.faint }}>incl. GST</div>
          </div>
          <Badge status={order.status} />
          <span style={{ color: T.textLight.mid, fontSize: 18 }}>{expanded ? "▲" : "▼"}</span>
        </div>
      </div>
      {expanded && (
        <div style={{ padding: "0 20px 20px", borderTop: `1px solid ${T.buyerBorder}` }}>
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 14, marginBottom: 16 }}>
            <thead><tr style={{ background: T.paperDark }}>
              {["Product", "Qty", "Rate", "GST", "Amount"].map(h => <th key={h} style={{ padding: "7px 10px", fontSize: 11, color: T.textLight.mid, textAlign: "right", textTransform: "uppercase" }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {order.items.map(item => {
                const prod = products.find(p => p.id === item.productId);
                const base = item.qty * item.price;
                const gstAmt = base * item.gst / 100;
                return (
                  <tr key={item.productId}>
                    <td style={{ padding: "7px 10px", fontSize: 13, color: T.ink }}>{prod?.name}</td>
                    <td style={{ padding: "7px 10px", fontSize: 13, textAlign: "right", color: T.inkLight }}>{fmt(item.qty)} {prod?.unit}</td>
                    <td style={{ padding: "7px 10px", fontSize: 13, textAlign: "right", color: T.inkLight }}>{cur(item.price)}</td>
                    <td style={{ padding: "7px 10px", fontSize: 13, textAlign: "right", color: T.inkLight }}>{item.gst}%</td>
                    <td style={{ padding: "7px 10px", fontSize: 13, textAlign: "right", fontWeight: 700, color: T.ink }}>{cur(base + gstAmt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {order.dispatch && (
            <div style={{ background: T.green + "0D", border: `1px solid ${T.green}33`, borderRadius: 10, padding: "12px 14px", marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.green, marginBottom: 6 }}>🚚 Dispatch Details</div>
              <div style={{ fontSize: 12, color: T.textLight.mid }}>Date: {order.dispatch.date} · Vehicle: {order.dispatch.vehicle} · {order.dispatch.transporter}</div>
              <div style={{ fontSize: 12, color: T.textLight.mid }}>E-Way Bill: {order.dispatch.ewb}</div>
            </div>
          )}
          {order.invoice && (
            <div style={{ background: T.brand + "0D", border: `1px solid ${T.brand}33`, borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.brand, marginBottom: 6 }}>🧾 Tax Invoice Raised</div>
              <div style={{ fontSize: 12, color: T.textLight.mid }}>Invoice: {order.invoice.no} · Date: {order.invoice.date}</div>
              <div style={{ fontSize: 11, color: T.textLight.faint, wordBreak: "break-all" }}>IRN: {order.invoice.irn}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: order.invoice.due < today() ? T.red : T.gold, marginTop: 6 }}>
                Payment Due: {order.invoice.due} {order.invoice.due < today() ? "⚠️ OVERDUE" : ""}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════
//  ADMIN PANEL — PHASE 2 EXTENSION
// ══════════════════════════════════════════════════════════════
const AdminApp = ({ onSwitchRole, products, buyers, orders, setOrders }) => {
  const [page, setPage] = useState("orders");
  const [dispatchModal, setDispatchModal] = useState(null);
  const [invoiceModal, setInvoiceModal] = useState(null);
  const [dispatchForm, setDispatchForm] = useState({ vehicle: "", transporter: "", notes: "" });
  const [rejectModal, setRejectModal] = useState(null);

  const handleApprove = (orderId) => {
    setOrders(o => o.map(ord => ord.id === orderId ? { ...ord, status: "approved" } : ord));
  };
  const handleReject = (orderId) => {
    setOrders(o => o.map(ord => ord.id === orderId ? { ...ord, status: "rejected" } : ord));
    setRejectModal(null);
  };
  const handleDispatch = (order) => {
    const ewb = orderGrand(order.items) >= 50000 ? genEWB() : null;
    setOrders(o => o.map(ord => ord.id === order.id ? {
      ...ord, status: "dispatched",
      dispatch: { date: today(), vehicle: dispatchForm.vehicle, transporter: dispatchForm.transporter, ewb }
    } : ord));
    setDispatchModal(null);
    setDispatchForm({ vehicle: "", transporter: "", notes: "" });
    // auto trigger invoice
    setTimeout(() => {
      setOrders(o => o.map(ord => ord.id === order.id ? {
        ...ord,
        invoice: { no: "INV-2026-" + String(Math.floor(Math.random()*900+100)), date: today(), irn: genIRN(), due: addDays(today(), 45) }
      } : ord));
    }, 800);
  };

  const S = {
    bg: { minHeight: "100vh", display: "flex", background: T.adminBg, fontFamily: "'Outfit', 'Segoe UI', system-ui, sans-serif", color: T.text.dark },
    sidebar: { width: 220, background: T.adminSurface, borderRight: `1px solid ${T.adminBorder}`, display: "flex", flexDirection: "column" },
    sideTop: { padding: "22px 18px 14px", borderBottom: `1px solid ${T.adminBorder}` },
    nav: (active) => ({
      display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 14px",
      border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 14, marginBottom: 2, borderRadius: 8,
      background: active ? T.brand + "25" : "transparent", color: active ? T.brandLight : T.text.mid,
      fontWeight: active ? 700 : 400, borderLeft: active ? `3px solid ${T.brand}` : "3px solid transparent",
    }),
    card: { background: T.adminCard, border: `1px solid ${T.adminBorder}`, borderRadius: 12, padding: 20 },
    th: { padding: "10px 14px", background: T.adminMuted, fontSize: 11, color: T.text.mid, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase", whiteSpace: "nowrap" },
    td: (color) => ({ padding: "11px 14px", borderBottom: `1px solid ${T.adminMuted}`, fontSize: 13, color: color || T.text.mid, whiteSpace: "nowrap" }),
    btn: (c = T.brand, outline) => ({
      padding: "7px 14px", borderRadius: 7, border: outline ? `1px solid ${c}` : "none", cursor: "pointer",
      background: outline ? "transparent" : c, color: outline ? c : "#fff",
      fontSize: 12, fontWeight: 700, fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 4
    }),
    input: { background: T.adminSurface, border: `1px solid ${T.adminBorder}`, borderRadius: 8, padding: "9px 12px", color: T.text.dark, fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box", fontFamily: "inherit" },
    label: { fontSize: 11, color: T.text.mid, letterSpacing: 0.5, textTransform: "uppercase", display: "block", marginBottom: 5, fontWeight: 600 },
  };

  const ordersByStatus = (s) => orders.filter(o => o.status === s);
  const allBuyers = buyers;

  return (
    <div style={S.bg}>
      {/* Sidebar */}
      <div style={S.sidebar}>
        <div style={S.sideTop}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: `linear-gradient(135deg, ${T.brand}, ${T.accent})`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: "#fff", fontSize: 15 }}>B</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: T.text.dark }}>BizFlow Admin</div>
              <div style={{ fontSize: 10, color: T.text.mid, letterSpacing: 1 }}>PHASE 2</div>
            </div>
          </div>
        </div>
        <nav style={{ padding: "12px 8px", flex: 1 }}>
          {[
            { k: "orders", icon: "📋", label: "Orders", count: ordersByStatus("pending").length },
            { k: "dispatch", icon: "🚚", label: "Dispatch Queue", count: ordersByStatus("approved").length },
            { k: "invoices", icon: "🧾", label: "Invoices", count: ordersByStatus("dispatched").length },
            { k: "buyers", icon: "👥", label: "Buyers", count: allBuyers.filter(b => b.status === "pending").length },
          ].map(n => (
            <button key={n.k} style={S.nav(page === n.k)} onClick={() => setPage(n.k)}>
              <span>{n.icon}</span>
              <span style={{ flex: 1, textAlign: "left" }}>{n.label}</span>
              {n.count > 0 && <span style={{ background: T.accent, color: "#fff", borderRadius: 10, fontSize: 10, fontWeight: 700, padding: "1px 7px" }}>{n.count}</span>}
            </button>
          ))}
        </nav>
        <div style={{ padding: "14px 16px", borderTop: `1px solid ${T.adminBorder}` }}>
          <button onClick={onSwitchRole} style={{ ...S.btn(T.text.faint, true), width: "100%", justifyContent: "center", fontSize: 11 }}>→ Buyer Portal</button>
        </div>
      </div>

      {/* Main */}
      <main style={{ flex: 1, padding: "28px 32px", overflowY: "auto", maxHeight: "100vh" }}>

        {/* ── ORDERS ── */}
        {page === "orders" && (
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: T.text.dark, margin: "0 0 6px" }}>Order Management</h1>
            <p style={{ color: T.text.mid, fontSize: 13, marginBottom: 24 }}>Review, approve or reject incoming purchase orders</p>
            {orders.length === 0
              ? <div style={{ ...S.card, textAlign: "center", padding: 48, color: T.text.mid }}>No orders yet</div>
              : (
                <div style={{ ...S.card, overflow: "hidden", padding: 0 }}>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead><tr>
                        {["Order ID", "Buyer", "Date", "Items", "Value (incl. GST)", "Status", "Actions"].map(h => <th key={h} style={S.th}>{h}</th>)}
                      </tr></thead>
                      <tbody>
                        {[...orders].sort((a, b) => new Date(b.date) - new Date(a.date)).map(o => {
                          const buyer = buyers.find(b => b.id === o.buyerId);
                          const grand = orderGrand(o.items);
                          return (
                            <tr key={o.id}>
                              <td style={S.td(T.brandLight)}><span style={{ fontFamily: "monospace", fontWeight: 700 }}>{o.id}</span></td>
                              <td style={S.td(T.text.dark)}>{buyer?.name}<div style={{ fontSize: 11, color: T.text.mid }}>{buyer?.gstin}</div></td>
                              <td style={S.td()}>{o.date}</td>
                              <td style={S.td()}>{o.items.length} item{o.items.length > 1 ? "s" : ""}</td>
                              <td style={{ ...S.td(T.text.dark), fontWeight: 700 }}>{cur(grand)}</td>
                              <td style={S.td()}><Badge status={o.status} /></td>
                              <td style={S.td()}>
                                <div style={{ display: "flex", gap: 6 }}>
                                  {o.status === "pending" && <>
                                    <button style={S.btn(T.green)} onClick={() => handleApprove(o.id)}>✓ Approve</button>
                                    <button style={S.btn(T.red)} onClick={() => setRejectModal(o.id)}>✕ Reject</button>
                                  </>}
                                  {o.status === "approved" && <button style={S.btn(T.accent)} onClick={() => { setDispatchModal(o); }}>🚚 Dispatch</button>}
                                  {o.status === "dispatched" && <Badge status="dispatched" />}
                                  {o.status === "rejected" && <Badge status="rejected" />}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
          </div>
        )}

        {/* ── DISPATCH QUEUE ── */}
        {page === "dispatch" && (
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: T.text.dark, margin: "0 0 6px" }}>Dispatch Queue</h1>
            <p style={{ color: T.text.mid, fontSize: 13, marginBottom: 24 }}>Approved orders ready for dispatch · E-Way Bill auto-generated for orders &gt;₹50,000</p>
            {ordersByStatus("approved").length === 0
              ? <div style={{ ...S.card, textAlign: "center", padding: 48, color: T.text.mid }}>No orders pending dispatch</div>
              : ordersByStatus("approved").map(o => {
                const buyer = buyers.find(b => b.id === o.buyerId);
                const grand = orderGrand(o.items);
                const needsEWB = grand >= 50000;
                return (
                  <div key={o.id} style={{ ...S.card, marginBottom: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: T.brandLight }}>{o.id}</div>
                        <div style={{ fontSize: 13, color: T.text.mid, marginTop: 2 }}>{buyer?.name} · {buyer?.city}</div>
                        <div style={{ fontSize: 12, color: T.text.faint, marginTop: 2 }}>Delivery: {o.deliveryAddr}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 22, fontWeight: 800, color: T.text.dark }}>{cur(grand)}</div>
                        {needsEWB && <div style={{ fontSize: 11, color: T.accent, fontWeight: 700, marginTop: 3 }}>⚠️ E-Way Bill Required</div>}
                      </div>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                      {o.items.map(item => {
                        const prod = products.find(p => p.id === item.productId);
                        return <span key={item.productId} style={{ fontSize: 12, padding: "4px 10px", background: T.adminMuted, borderRadius: 6, color: T.text.mid }}>{prod?.name} × {fmt(item.qty)}</span>;
                      })}
                    </div>
                    {o.notes && <div style={{ fontSize: 12, color: T.gold, marginBottom: 12 }}>📝 Buyer note: {o.notes}</div>}
                    <button style={{ ...S.btn(T.accent), padding: "10px 20px", fontSize: 13 }} onClick={() => setDispatchModal(o)}>
                      🚚 Mark as Dispatched
                    </button>
                  </div>
                );
              })}
          </div>
        )}

        {/* ── INVOICES ── */}
        {page === "invoices" && (
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: T.text.dark, margin: "0 0 6px" }}>GST Invoices</h1>
            <p style={{ color: T.text.mid, fontSize: 13, marginBottom: 24 }}>E-Invoices auto-generated on dispatch · IRN registered with IRP · 30-day upload mandate tracked</p>
            {ordersByStatus("dispatched").length === 0
              ? <div style={{ ...S.card, textAlign: "center", padding: 48, color: T.text.mid }}>No dispatched orders yet</div>
              : ordersByStatus("dispatched").map(o => {
                const buyer = buyers.find(b => b.id === o.buyerId);
                const grand = orderGrand(o.items);
                const gstTotal = orderGST(o.items);
                const base = orderTotal(o.items);
                return (
                  <div key={o.id} style={{ ...S.card, marginBottom: 16 }}>
                    {/* Invoice Header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingBottom: 16, borderBottom: `1px solid ${T.adminBorder}`, marginBottom: 16 }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                          <span style={{ fontSize: 15, fontWeight: 800, color: T.brandLight }}>{o.invoice?.no || "Pending"}</span>
                          <Badge status="dispatched" />
                          {o.invoice?.irn && <span style={{ fontSize: 10, background: T.green + "20", color: T.green, padding: "2px 8px", borderRadius: 8, fontWeight: 700 }}>IRN ✓</span>}
                        </div>
                        <div style={{ fontSize: 13, color: T.text.mid }}>{buyer?.name} · GSTIN: {buyer?.gstin}</div>
                        <div style={{ fontSize: 12, color: T.text.faint, marginTop: 2 }}>Invoice Date: {o.invoice?.date} · Due: {o.invoice?.due}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 24, fontWeight: 900, color: T.text.dark }}>{cur(grand)}</div>
                        <div style={{ fontSize: 12, color: T.text.mid }}>Base: {cur(base)} + GST: {cur(gstTotal)}</div>
                      </div>
                    </div>
                    {/* Items */}
                    <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 14 }}>
                      <thead><tr>
                        {["Item", "HSN", "Qty", "Rate", "GST%", "GST Amt", "Total"].map(h => (
                          <th key={h} style={{ ...S.th, background: T.adminMuted, textAlign: h === "Item" || h === "HSN" ? "left" : "right" }}>{h}</th>
                        ))}
                      </tr></thead>
                      <tbody>
                        {o.items.map(item => {
                          const prod = products.find(p => p.id === item.productId);
                          const b = item.qty * item.price, g = b * item.gst / 100;
                          return (
                            <tr key={item.productId}>
                              <td style={{ ...S.td(T.text.dark), fontWeight: 600 }}>{prod?.name}</td>
                              <td style={{ ...S.td(), fontFamily: "monospace", fontSize: 12 }}>{prod?.hsn}</td>
                              <td style={{ ...S.td(), textAlign: "right" }}>{fmt(item.qty)} {prod?.unit}</td>
                              <td style={{ ...S.td(), textAlign: "right" }}>{cur(item.price)}</td>
                              <td style={{ ...S.td(), textAlign: "right" }}>{item.gst}%</td>
                              <td style={{ ...S.td(), textAlign: "right" }}>{cur(g)}</td>
                              <td style={{ ...S.td(T.text.dark), textAlign: "right", fontWeight: 700 }}>{cur(b + g)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {/* IRN */}
                    {o.invoice?.irn && (
                      <div style={{ background: T.green + "0D", border: `1px solid ${T.green}33`, borderRadius: 8, padding: "10px 14px", marginBottom: 10 }}>
                        <div style={{ fontSize: 11, color: T.green, fontWeight: 700, marginBottom: 3 }}>IRP Registered · IRN (Invoice Reference Number)</div>
                        <div style={{ fontSize: 11, color: T.text.mid, fontFamily: "monospace", wordBreak: "break-all" }}>{o.invoice.irn}</div>
                      </div>
                    )}
                    <div style={{ display: "flex", gap: 8 }}>
                      <button style={S.btn(T.brand)}>📧 Email Invoice</button>
                      <button style={S.btn(T.green)}>📱 WhatsApp PDF</button>
                      <button style={S.btn(T.text.faint, true)}>⬇ Download PDF</button>
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        {/* ── BUYERS ── */}
        {page === "buyers" && (
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: T.text.dark, margin: "0 0 6px" }}>Buyer Management</h1>
            <p style={{ color: T.text.mid, fontSize: 13, marginBottom: 24 }}>KYC verification, credit limits, risk scores</p>
            <div style={{ ...S.card, overflow: "hidden", padding: 0 }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead><tr>
                    {["Business", "GSTIN", "Type", "MSME", "Credit Limit", "Used", "Risk Score", "Status", "Actions"].map(h => <th key={h} style={S.th}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {buyers.map(b => {
                      const riskColor = b.riskScore > 70 ? T.green : b.riskScore > 40 ? T.gold : T.red;
                      return (
                        <tr key={b.id}>
                          <td style={S.td(T.text.dark)}><div style={{ fontWeight: 700 }}>{b.name}</div><div style={{ fontSize: 11, color: T.text.faint }}>{b.city} · {b.email}</div></td>
                          <td style={{ ...S.td(), fontFamily: "monospace", fontSize: 11 }}>{b.gstin}</td>
                          <td style={S.td()}>{b.type}</td>
                          <td style={S.td()}>{b.msme ? <span style={{ color: T.green, fontSize: 11, fontWeight: 700 }}>✓ Registered</span> : <span style={{ color: T.text.faint, fontSize: 11 }}>—</span>}</td>
                          <td style={{ ...S.td(), textAlign: "right" }}>{cur(b.creditLimit)}</td>
                          <td style={{ ...S.td(), textAlign: "right" }}>{b.usedCredit > 0 ? cur(b.usedCredit) : "—"}</td>
                          <td style={S.td()}>
                            {b.riskScore > 0
                              ? <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                  <div style={{ width: 60, height: 6, borderRadius: 3, background: T.adminMuted, overflow: "hidden" }}>
                                    <div style={{ width: b.riskScore + "%", height: "100%", background: riskColor, borderRadius: 3 }} />
                                  </div>
                                  <span style={{ fontSize: 12, color: riskColor, fontWeight: 700 }}>{b.riskScore}</span>
                                </div>
                              : <span style={{ fontSize: 11, color: T.text.faint }}>New</span>}
                          </td>
                          <td style={S.td()}><Badge status={b.status} custom={
                            b.status === "approved" ? { label: "Approved", color: T.green, bg: T.green + "20", icon: "✓" }
                            : b.status === "pending" ? { label: "Pending KYC", color: T.gold, bg: T.gold + "20", icon: "⏳" }
                            : { label: "Rejected", color: T.red, bg: T.red + "20", icon: "✕" }
                          } /></td>
                          <td style={S.td()}>
                            {b.status === "pending" && (
                              <button style={S.btn(T.green)} onClick={() => {
                                const updated = buyers.map(bx => bx.id === b.id ? { ...bx, status: "approved", riskScore: 75 } : bx);
                                // prop drill workaround via direct mutation for demo
                              }}>Approve KYC</button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Dispatch Modal */}
      {dispatchModal && (
        <Modal title="Dispatch Order" sub={`${dispatchModal.id} · ${cur(orderGrand(dispatchModal.items))}`} onClose={() => setDispatchModal(null)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {orderGrand(dispatchModal.items) >= 50000 && (
              <div style={{ background: T.accent + "15", border: `1px solid ${T.accent}44`, borderRadius: 8, padding: "10px 14px", fontSize: 12, color: T.accent }}>
                ⚠️ Order value ≥ ₹50,000 · E-Way Bill will be auto-generated via NIC API on dispatch
              </div>
            )}
            <div><label style={S.label}>Vehicle Number</label><input style={S.input} value={dispatchForm.vehicle} onChange={e => setDispatchForm(f => ({ ...f, vehicle: e.target.value }))} placeholder="MH12AB1234" /></div>
            <div><label style={S.label}>Transporter Name</label><input style={S.input} value={dispatchForm.transporter} onChange={e => setDispatchForm(f => ({ ...f, transporter: e.target.value }))} placeholder="e.g. Shree Cargo Services" /></div>
            <div><label style={S.label}>Notes</label><input style={S.input} value={dispatchForm.notes} onChange={e => setDispatchForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional dispatch notes" /></div>
            <div style={{ background: T.green + "0D", border: `1px solid ${T.green}33`, borderRadius: 8, padding: "10px 14px", fontSize: 12, color: T.greenLight }}>
              ✓ On dispatch: GST E-Invoice will be auto-generated and IRN registered with IRP · Invoice PDF will be sent to buyer via Email & WhatsApp
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 6 }}>
              <button style={S.btn(T.text.faint, true)} onClick={() => setDispatchModal(null)}>Cancel</button>
              <button style={S.btn(T.accent)} onClick={() => handleDispatch(dispatchModal)}>🚚 Confirm Dispatch & Generate Invoice</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <Modal title="Reject Order?" sub="This will notify the buyer" onClose={() => setRejectModal(null)}>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
            <button style={S.btn(T.text.faint, true)} onClick={() => setRejectModal(null)}>Cancel</button>
            <button style={S.btn(T.red)} onClick={() => handleReject(rejectModal)}>✕ Confirm Reject</button>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════
//  ROOT — ROLE SWITCHER
// ══════════════════════════════════════════════════════════════
export default function App() {
  const [role, setRole] = useState("switcher"); // switcher | buyer | admin
  const [products, setProducts] = useState(PRODUCTS);
  const [buyers, setBuyers] = useState(BUYERS_SEED);
  const [orders, setOrders] = useState(ORDERS_SEED);

  if (role === "switcher") return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #080C14 0%, #0F1A35 50%, #080C14 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Georgia, serif" }}>
      <div style={{ textAlign: "center", maxWidth: 560, padding: 32 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🇮🇳</div>
        <div style={{ fontSize: 38, fontWeight: 800, color: "#E8F0FF", marginBottom: 8, letterSpacing: -1 }}>BizFlow India</div>
        <div style={{ fontSize: 16, color: "#7A9BC2", marginBottom: 12 }}>Phase 2 — Order · Dispatch · GST E-Invoice</div>
        <div style={{ fontSize: 13, color: "#3A5070", marginBottom: 48 }}>Select your role to explore the full platform flow</div>
        <div style={{ display: "flex", gap: 20, justifyContent: "center" }}>
          <div onClick={() => setRole("buyer")} style={{ background: "#F7F3EE", border: "2px solid #E8DDD0", borderRadius: 18, padding: "32px 40px", cursor: "pointer", flex: 1, maxWidth: 220, transition: "transform 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.transform = "translateY(-4px)"}
            onMouseLeave={e => e.currentTarget.style.transform = "none"}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🧑‍💼</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#1A2540", marginBottom: 6 }}>Buyer Portal</div>
            <div style={{ fontSize: 13, color: "#5A6F8A", lineHeight: 1.5 }}>Register, browse catalogue, place orders, track invoices</div>
          </div>
          <div onClick={() => setRole("admin")} style={{ background: "#0F1624", border: "2px solid #1E2D45", borderRadius: 18, padding: "32px 40px", cursor: "pointer", flex: 1, maxWidth: 220, transition: "transform 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.transform = "translateY(-4px)"}
            onMouseLeave={e => e.currentTarget.style.transform = "none"}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚙️</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#E8F0FF", marginBottom: 6 }}>Admin Panel</div>
            <div style={{ fontSize: 13, color: "#7A9BC2", lineHeight: 1.5 }}>Approve orders, dispatch, generate GST invoices, manage buyers</div>
          </div>
        </div>
        <div style={{ marginTop: 32, fontSize: 12, color: "#3A5070" }}>
          State is shared — place an order as Buyer, then switch to Admin to approve & dispatch it
        </div>
      </div>
    </div>
  );

  if (role === "buyer") return <BuyerApp onSwitchRole={() => setRole("admin")} products={products} buyers={buyers} setBuyers={setBuyers} orders={orders} setOrders={setOrders} />;
  return <AdminApp onSwitchRole={() => setRole("buyer")} products={products} buyers={buyers} setBuyers={setBuyers} orders={orders} setOrders={setOrders} />;
}
