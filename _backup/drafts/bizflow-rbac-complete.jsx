import { useState, useEffect, useRef } from "react";

// ============================================================
// COLOR SYSTEM - Modern, Clean, Accessible
// ============================================================
const C = {
  // Core Neutrals
  bg: "#0A0E27", surface: "#151B3A", card: "#1F2859", raised: "#2A3366",
  border: "#3D4B7A", muted: "#495589",
  
  // Brand Palette
  brand: "#4F46E5", brandLight: "#6366F1", brandDark: "#3730A3",
  
  // Semantic Colors
  success: "#10B981", successLight: "#34D399",
  warning: "#F59E0B", warningLight: "#FBBF24",
  error: "#EF4444", errorLight: "#F87171",
  info: "#0EA5E9", infoLight: "#38BDF8",
  
  // Text
  text: "#F8FAFC", textMuted: "#CBD5E1", textFaint: "#94A3B8",
};

// ============================================================
// UTILITIES
// ============================================================
const fmtN = n => new Intl.NumberFormat("en-IN").format(Math.round(n));
const fmtD = n => new Intl.NumberFormat("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2}).format(n);
const cur = n => "Rs " + fmtD(n);
const today = () => new Date().toISOString().slice(0,10);
const daysBetween = (d1, d2) => Math.floor((new Date(d2) - new Date(d1)) / (1000*60*60*24));

// Voice Notification System
const speakNotification = (message, urgency = "normal") => {
  if (!("speechSynthesis" in window)) return;
  const utterance = new SpeechSynthesisUtterance(message);
  utterance.rate = urgency === "critical" ? 1.2 : 1;
  utterance.pitch = urgency === "critical" ? 1.5 : 1;
  utterance.volume = urgency === "critical" ? 1 : 0.8;
  window.speechSynthesis.speak(utterance);
};

// ============================================================
// LOGIN PAGE - Role Selection
// ============================================================
function LoginPage({ onLogin }) {
  return (
    <div style={{
      background: `linear-gradient(135deg, ${C.bg} 0%, ${C.surface} 100%)`,
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "system-ui, -apple-system, sans-serif",
      padding: 20,
    }}>
      <div style={{width: "100%", maxWidth: 480}}>
        {/* Logo */}
        <div style={{textAlign: "center", marginBottom: 40}}>
          <div style={{fontSize: 48, fontWeight: 900, marginBottom: 8, background: `linear-gradient(135deg, ${C.brand}, ${C.success})`, backgroundClip: "text", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"}}>
            BizFlow
          </div>
          <div style={{fontSize: 14, color: C.textMuted}}>India Business Payment & Collection Platform</div>
        </div>

        {/* Card */}
        <div style={{background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 32, marginBottom: 20}}>
          <h1 style={{fontSize: 20, fontWeight: 700, color: C.text, margin: "0 0 8px", textAlign: "center"}}>Select Your Role</h1>
          <p style={{fontSize: 14, color: C.textMuted, margin: "0 0 32px", textAlign: "center"}}>Choose how you want to access BizFlow</p>

          <div style={{display: "flex", flexDirection: "column", gap: 12}}>
            {[
              {role: "admin", label: "Supplier / Admin", desc: "Manage stock, orders, invoices & collections", icon: "👨‍💼"},
              {role: "buyer", label: "Buyer", desc: "Place orders & make payments", icon: "👤"},
            ].map(opt => (
              <button
                key={opt.role}
                onClick={() => onLogin(opt.role)}
                style={{
                  padding: 20,
                  borderRadius: 12,
                  border: `2px solid ${C.border}`,
                  background: C.surface,
                  cursor: "pointer",
                  transition: "all 0.3s",
                  display: "flex",
                  gap: 16,
                  alignItems: "center",
                  fontFamily: "inherit",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = C.raised;
                  e.currentTarget.style.borderColor = C.brand;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = C.surface;
                  e.currentTarget.style.borderColor = C.border;
                }}
              >
                <div style={{fontSize: 32}}>{opt.icon}</div>
                <div style={{flex: 1, textAlign: "left"}}>
                  <div style={{fontSize: 16, fontWeight: 700, color: C.text}}>{opt.label}</div>
                  <div style={{fontSize: 12, color: C.textMuted, marginTop: 4}}>{opt.desc}</div>
                </div>
                <div style={{fontSize: 20, color: C.brand}}>→</div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{textAlign: "center", fontSize: 12, color: C.textFaint}}>
          Demo Version • All data is simulated
        </div>
      </div>
    </div>
  );
}

// ============================================================
// ADMIN PORTAL
// ============================================================
function AdminPortal({ onLogout }) {
  const [page, setPage] = useState("dashboard");
  const [products] = useState([
    {id: 1, sku: "BF-001", name: "Cotton Fabric", stock: 2340, price: 120, gst: 5},
    {id: 2, sku: "BF-002", name: "Polyester Blend", stock: 85, price: 95, gst: 12},
  ]);
  
  const [orders] = useState([
    {id: "ORD-001", buyer: "Sharma Textiles", amount: 71400, status: "pending", days: 2},
    {id: "ORD-002", buyer: "Gupta Garments", amount: 9300, status: "overdue", days: 48},
    {id: "ORD-003", buyer: "Rajasthan Fabrics", amount: 19200, status: "unpaid", days: 35},
  ]);

  const unpaidOrders = orders.filter(o => o.status !== "paid");
  const criticalOrders = orders.filter(o => o.days > 45);
  const totalOverdue = unpaidOrders.reduce((s, o) => s + o.amount, 0);

  // Trigger voice notifications for critical issues
  useEffect(() => {
    if (criticalOrders.length > 0) {
      speakNotification(`WARNING: You have ${criticalOrders.length} invoice(s) past the 45-day MSME threshold. Immediate action required.`, "critical");
    }
  }, [criticalOrders.length]);

  const SidebarItem = ({label, icon, active, onClick}) => (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        padding: "12px 16px",
        borderRadius: 8,
        border: "none",
        background: active ? C.brand : "transparent",
        color: active ? "#fff" : C.textMuted,
        cursor: "pointer",
        textAlign: "left",
        fontFamily: "inherit",
        fontSize: 14,
        fontWeight: active ? 600 : 400,
        display: "flex",
        alignItems: "center",
        gap: 10,
        marginBottom: 4,
        transition: "all 0.3s",
      }}
      onMouseEnter={e => {
        if (!active) e.currentTarget.style.background = C.raised;
      }}
      onMouseLeave={e => {
        if (!active) e.currentTarget.style.background = "transparent";
      }}
    >
      <span style={{fontSize: 18}}>{icon}</span>
      {label}
    </button>
  );

  const StatCard = ({label, value, icon, color, sub}) => (
    <div style={{background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20}}>
      <div style={{display: "flex", justifyContent: "space-between", alignItems: "flex-start"}}>
        <div>
          <div style={{fontSize: 12, color: C.textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8}}>{label}</div>
          <div style={{fontSize: 28, fontWeight: 800, color: C.text}}>{value}</div>
          {sub && <div style={{fontSize: 12, color: C.textMuted, marginTop: 6}}>{sub}</div>}
        </div>
        <div style={{fontSize: 32, opacity: 0.8}}>{icon}</div>
      </div>
    </div>
  );

  return (
    <div style={{display: "flex", minHeight: "100vh", background: C.bg, fontFamily: "system-ui"}}>
      {/* SIDEBAR */}
      <div style={{width: 240, background: C.surface, borderRight: `1px solid ${C.border}`, padding: 20, display: "flex", flexDirection: "column"}}>
        <div style={{marginBottom: 30}}>
          <div style={{fontSize: 20, fontWeight: 900, color: C.text}}>BizFlow</div>
          <div style={{fontSize: 11, color: C.textFaint, marginTop: 4}}>SUPPLIER ADMIN</div>
        </div>

        <nav style={{flex: 1}}>
          <SidebarItem label="Dashboard" icon="📊" active={page === "dashboard"} onClick={() => setPage("dashboard")}/>
          <SidebarItem label="Products" icon="📦" active={page === "products"} onClick={() => setPage("products")}/>
          <SidebarItem label="Orders" icon="🛒" active={page === "orders"} onClick={() => setPage("orders")}/>
          <SidebarItem label="Invoices" icon="🧾" active={page === "invoices"} onClick={() => setPage("invoices")}/>
          <SidebarItem label="Collections" icon="💰" active={page === "collections"} onClick={() => setPage("collections")}/>
          <SidebarItem label="Settings" icon="⚙️" active={page === "settings"} onClick={() => setPage("settings")}/>
        </nav>

        <button
          onClick={onLogout}
          style={{padding: "10px 16px", borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", color: C.textMuted, cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 600, width: "100%"}}
        >
          ← Logout
        </button>
      </div>

      {/* MAIN CONTENT */}
      <div style={{flex: 1, padding: 32, overflowY: "auto"}}>
        {page === "dashboard" && (
          <div>
            <div style={{marginBottom: 32}}>
              <h1 style={{fontSize: 32, fontWeight: 900, color: C.text, margin: 0}}>Dashboard</h1>
              <p style={{color: C.textMuted, fontSize: 14, marginTop: 8}}>Overview of your business</p>
            </div>

            {/* ALERTS */}
            {criticalOrders.length > 0 && (
              <div style={{background: `${C.error}20`, border: `1px solid ${C.error}`, borderRadius: 12, padding: 16, marginBottom: 24, display: "flex", gap: 12, alignItems: "flex-start"}}>
                <div style={{fontSize: 24}}>🚨</div>
                <div style={{flex: 1}}>
                  <div style={{fontWeight: 700, color: C.errorLight}}>CRITICAL: {criticalOrders.length} invoice(s) past 45-day threshold</div>
                  <div style={{fontSize: 13, color: C.textMuted, marginTop: 4}}>Section 43B(h) - Buyer loses tax deduction. Compound interest accruing at 19.5% p.a.</div>
                </div>
              </div>
            )}

            {/* KPI CARDS */}
            <div style={{display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20, marginBottom: 32}}>
              <StatCard label="Total Outstanding" value={cur(totalOverdue)} icon="💸" color={C.error} sub={`${unpaidOrders.length} unpaid invoices`}/>
              <StatCard label="Stock Value" value={cur(products.reduce((s,p) => s + p.stock * p.price, 0))} icon="📊" color={C.success} sub={`${products.length} products`}/>
              <StatCard label="Pending Orders" value={orders.filter(o => o.days < 7).length} icon="⏳" color={C.warning}/>
              <StatCard label="Critical Overdue" value={criticalOrders.length} icon="🔴" color={C.error} sub={"> 45 days"}/>
            </div>

            {/* ORDERS TABLE */}
            <div style={{background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden"}}>
              <div style={{padding: 20, borderBottom: `1px solid ${C.border}`}}>
                <h2 style={{fontSize: 16, fontWeight: 700, color: C.text, margin: 0}}>Recent Orders</h2>
              </div>
              <div style={{overflowX: "auto"}}>
                <table style={{width: "100%", borderCollapse: "collapse"}}>
                  <thead>
                    <tr style={{background: C.raised}}>
                      {["Order ID", "Buyer", "Amount", "Days", "Status"].map(h => (
                        <th key={h} style={{padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 700, color: C.textMuted, textTransform: "uppercase"}}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(o => (
                      <tr key={o.id} style={{borderBottom: `1px solid ${C.border}`}}>
                        <td style={{padding: "12px 16px", fontFamily: "monospace", fontSize: 13, fontWeight: 700, color: C.brand}}>{o.id}</td>
                        <td style={{padding: "12px 16px", fontSize: 13, color: C.text}}>{o.buyer}</td>
                        <td style={{padding: "12px 16px", fontSize: 13, fontWeight: 700, color: C.text}}>{cur(o.amount)}</td>
                        <td style={{padding: "12px 16px", fontSize: 13, color: o.days > 45 ? C.error : o.days > 30 ? C.warning : C.success, fontWeight: 700}}>{o.days}d</td>
                        <td style={{padding: "12px 16px"}}>
                          <span style={{padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 700, background: o.status === "pending" ? `${C.warning}30` : o.status === "overdue" ? `${C.error}30` : `${C.success}30`, color: o.status === "pending" ? C.warningLight : o.status === "overdue" ? C.errorLight : C.successLight}}>
                            {o.status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {page === "collections" && (
          <div>
            <h1 style={{fontSize: 28, fontWeight: 900, color: C.text, margin: "0 0 24px"}}>Collections & Reminders</h1>
            
            <div style={{background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24}}>
              <div style={{fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 16}}>45-Day Automated Reminder Timeline</div>
              
              <div style={{display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12}}>
                {[
                  {day: "Day 0", event: "Invoice Raised", color: C.info},
                  {day: "Day 7", event: "Reminder #1", color: C.info},
                  {day: "Day 15", event: "Reminder #2", color: C.warning},
                  {day: "Day 30", event: "Reminder #3 URGENT", color: C.warning},
                  {day: "Day 44", event: "43B(h) WARNING", color: C.error},
                  {day: "Day 45+", event: "CRITICAL ZONE", color: C.error},
                ].map((t, i) => (
                  <div key={i} style={{background: C.raised, border: `1px solid ${C.border}`, borderRadius: 8, padding: 12, borderTop: `3px solid ${t.color}`}}>
                    <div style={{fontSize: 12, fontWeight: 700, color: t.color}}>{t.day}</div>
                    <div style={{fontSize: 13, fontWeight: 600, color: C.text, marginTop: 4}}>{t.event}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {page === "settings" && (
          <div>
            <h1 style={{fontSize: 28, fontWeight: 900, color: C.text, margin: "0 0 24px"}}>Settings</h1>
            <div style={{background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24}}>
              <div style={{fontSize: 14, color: C.textMuted}}>Settings page coming soon...</div>
            </div>
          </div>
        )}

        {!["dashboard", "collections", "settings"].includes(page) && (
          <div style={{background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 32, textAlign: "center"}}>
            <div style={{fontSize: 32, marginBottom: 12}}>🔧</div>
            <div style={{fontSize: 16, fontWeight: 700, color: C.text}}>{page.charAt(0).toUpperCase() + page.slice(1)} Module</div>
            <div style={{fontSize: 14, color: C.textMuted, marginTop: 8}}>Coming in next update...</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// BUYER PORTAL
// ============================================================
function BuyerPortal({ onLogout }) {
  const [page, setPage] = useState("orders");
  const [myOrders] = useState([
    {id: "ORD-2026-001", date: "2026-04-10", amount: 71400, status: "dispatched", dueDate: "2026-05-27", paid: false},
    {id: "ORD-2026-002", date: "2026-04-14", amount: 9300, status: "pending", dueDate: "2026-05-29", paid: false},
  ]);

  const [products] = useState([
    {id: 1, name: "Cotton Fabric", price: 120, unit: "Metre", inStock: 2340},
    {id: 2, name: "Polyester Blend", price: 95, unit: "Metre", inStock: 85},
    {id: 3, name: "Denim Blue", price: 200, unit: "Metre", inStock: 0},
  ]);

  const SidebarItem = ({label, icon, active, onClick}) => (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        padding: "12px 16px",
        borderRadius: 8,
        border: "none",
        background: active ? C.brand : "transparent",
        color: active ? "#fff" : C.textMuted,
        cursor: "pointer",
        textAlign: "left",
        fontFamily: "inherit",
        fontSize: 14,
        fontWeight: active ? 600 : 400,
        display: "flex",
        alignItems: "center",
        gap: 10,
        marginBottom: 4,
      }}
      onMouseEnter={e => {
        if (!active) e.currentTarget.style.background = C.raised;
      }}
      onMouseLeave={e => {
        if (!active) e.currentTarget.style.background = "transparent";
      }}
    >
      <span style={{fontSize: 18}}>{icon}</span>
      {label}
    </button>
  );

  return (
    <div style={{display: "flex", minHeight: "100vh", background: C.bg, fontFamily: "system-ui"}}>
      {/* SIDEBAR */}
      <div style={{width: 240, background: C.surface, borderRight: `1px solid ${C.border}`, padding: 20, display: "flex", flexDirection: "column"}}>
        <div style={{marginBottom: 30}}>
          <div style={{fontSize: 20, fontWeight: 900, color: C.text}}>BizFlow</div>
          <div style={{fontSize: 11, color: C.textFaint, marginTop: 4}}>BUYER PORTAL</div>
        </div>

        <nav style={{flex: 1}}>
          <SidebarItem label="My Orders" icon="📋" active={page === "orders"} onClick={() => setPage("orders")}/>
          <SidebarItem label="Products" icon="🏬" active={page === "products"} onClick={() => setPage("products")}/>
          <SidebarItem label="Payments" icon="💳" active={page === "payments"} onClick={() => setPage("payments")}/>
          <SidebarItem label="Profile" icon="👤" active={page === "profile"} onClick={() => setPage("profile")}/>
        </nav>

        <button
          onClick={onLogout}
          style={{padding: "10px 16px", borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", color: C.textMuted, cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 600, width: "100%"}}
        >
          ← Logout
        </button>
      </div>

      {/* MAIN CONTENT */}
      <div style={{flex: 1, padding: 32, overflowY: "auto"}}>
        {page === "orders" && (
          <div>
            <h1 style={{fontSize: 32, fontWeight: 900, color: C.text, margin: 0}}>My Orders</h1>
            <p style={{color: C.textMuted, fontSize: 14, marginTop: 8, marginBottom: 32}}>Your purchase history and status</p>

            <div style={{display: "grid", gap: 16}}>
              {myOrders.map(o => (
                <div key={o.id} style={{background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20}}>
                  <div style={{display: "flex", justifyContent: "space-between", alignItems: "flex-start"}}>
                    <div>
                      <div style={{fontSize: 16, fontWeight: 700, color: C.text}}>{o.id}</div>
                      <div style={{fontSize: 12, color: C.textMuted, marginTop: 4}}>Placed: {o.date} • Due: {o.dueDate}</div>
                    </div>
                    <div style={{textAlign: "right"}}>
                      <div style={{fontSize: 20, fontWeight: 800, color: C.text}}>{cur(o.amount)}</div>
                      <span style={{display: "inline-block", marginTop: 6, padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 700, background: o.status === "dispatched" ? `${C.success}30` : `${C.warning}30`, color: o.status === "dispatched" ? C.successLight : C.warningLight}}>
                        {o.status.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {o.status === "dispatched" && !o.paid && (
                    <div style={{marginTop: 16, paddingTop: 16, borderTop: `1px solid ${C.border}`}}>
                      <button style={{padding: "10px 20px", borderRadius: 8, border: "none", background: C.brand, color: "#fff", cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: 600}}>
                        💳 Pay Now
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {page === "products" && (
          <div>
            <h1 style={{fontSize: 32, fontWeight: 900, color: C.text, margin: 0}}>Shop Products</h1>
            <p style={{color: C.textMuted, fontSize: 14, marginTop: 8, marginBottom: 32}}>Browse and order from our catalog</p>

            <div style={{display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16}}>
              {products.map(p => (
                <div key={p.id} style={{background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16}}>
                  <div style={{fontSize: 14, fontWeight: 700, color: C.text}}>{p.name}</div>
                  <div style={{fontSize: 12, color: C.textMuted, marginTop: 4}}>Rs {p.price}/{p.unit}</div>
                  <div style={{fontSize: 12, color: p.inStock > 0 ? C.success : C.error, fontWeight: 600, marginTop: 8}}>
                    {p.inStock > 0 ? `${p.inStock} in stock` : "Out of stock"}
                  </div>
                  <button style={{width: "100%", marginTop: 12, padding: "8px 12px", borderRadius: 6, border: "none", background: p.inStock > 0 ? C.brand : C.border, color: "#fff", cursor: p.inStock > 0 ? "pointer" : "not-allowed", fontFamily: "inherit", fontSize: 12, fontWeight: 600, opacity: p.inStock > 0 ? 1 : 0.5}}>
                    {p.inStock > 0 ? "Add to Cart" : "Unavailable"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {page === "payments" && (
          <div>
            <h1 style={{fontSize: 32, fontWeight: 900, color: C.text, margin: 0}}>Payments</h1>
            <p style={{color: C.textMuted, fontSize: 14, marginTop: 8, marginBottom: 32}}>Outstanding invoices and payment history</p>

            <div style={{background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24}}>
              <div style={{fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 16}}>Outstanding Invoices</div>
              <div style={{background: C.raised, borderRadius: 8, padding: 16}}>
                <div style={{display: "flex", justifyContent: "space-between", marginBottom: 12}}>
                  <span style={{color: C.textMuted}}>Total Amount Due</span>
                  <span style={{fontSize: 18, fontWeight: 800, color: C.error}}>Rs 80,700</span>
                </div>
                <div style={{fontSize: 12, color: C.textMuted}}>2 unpaid invoices • Due dates approaching</div>
              </div>
            </div>
          </div>
        )}

        {page === "profile" && (
          <div>
            <h1 style={{fontSize: 32, fontWeight: 900, color: C.text, margin: 0}}>Profile</h1>
            <p style={{color: C.textMuted, fontSize: 14, marginTop: 8, marginBottom: 32}}>Your account information</p>

            <div style={{background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24, maxWidth: 500}}>
              {[
                {label: "Business Name", value: "Sharma Textiles Pvt Ltd"},
                {label: "GSTIN", value: "27AABCU9603R1ZX"},
                {label: "Email", value: "sharma@textiles.com"},
                {label: "City", value: "Mumbai, Maharashtra"},
                {label: "Status", value: "Active"},
              ].map((item, i) => (
                <div key={i} style={{display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: i < 4 ? `1px solid ${C.border}` : "none"}}>
                  <span style={{color: C.textMuted, fontSize: 14}}>{item.label}</span>
                  <span style={{color: C.text, fontSize: 14, fontWeight: 600}}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================
export default function BizFlowApp() {
  const [role, setRole] = useState(null);

  if (!role) {
    return <LoginPage onLogin={setRole}/>;
  }

  return role === "admin"
    ? <AdminPortal onLogout={() => setRole(null)}/>
    : <BuyerPortal onLogout={() => setRole(null)}/>;
}
