import { useState, useEffect } from "react";

// ── DESIGN TOKENS ──────────────────────────────────────────────
const C = {
  bg: "#0D1117", surface: "#161B22", card: "#1C2333", border: "#2D3748",
  brand: "#2563EB", brandLight: "#3B82F6", accent: "#F97316",
  green: "#10B981", red: "#EF4444", gold: "#F59E0B",
  text: "#F0F6FC", subtle: "#8B949E", muted: "#30363D",
  white: "#FFFFFF",
};

// ── SEED DATA ──────────────────────────────────────────────────
const PRODUCTS_INIT = [
  { id: 1, sku: "BF-001", name: "Cotton Fabric (White)", category: "Fabric", hsn: "520811", gstRate: 5, unit: "Metre", purchasePrice: 85, tradePrice: 120, mrp: 150, reorderLevel: 500, stock: 2340, active: true },
  { id: 2, sku: "BF-002", name: "Polyester Blend Fabric", category: "Fabric", hsn: "540742", gstRate: 12, unit: "Metre", purchasePrice: 65, tradePrice: 95, mrp: 130, reorderLevel: 300, stock: 85, active: true },
  { id: 3, sku: "BF-003", name: "Denim Fabric (Blue)", category: "Fabric", hsn: "520942", gstRate: 5, unit: "Metre", purchasePrice: 145, tradePrice: 200, mrp: 260, reorderLevel: 200, stock: 0, active: true },
  { id: 4, sku: "CH-001", name: "Brass Zip 20cm", category: "Accessories", hsn: "963200", gstRate: 18, unit: "Nos", purchasePrice: 8, tradePrice: 15, mrp: 20, reorderLevel: 1000, stock: 4500, active: true },
  { id: 5, sku: "CH-002", name: "Plastic Buttons (12mm)", category: "Accessories", hsn: "960610", gstRate: 12, unit: "Nos", purchasePrice: 1.5, tradePrice: 3, mrp: 5, reorderLevel: 2000, stock: 420, active: true },
  { id: 6, sku: "TH-001", name: "Polyester Thread (Black)", category: "Thread", hsn: "540200", gstRate: 12, unit: "Box", purchasePrice: 280, tradePrice: 380, mrp: 450, reorderLevel: 50, stock: 180, active: true },
  { id: 7, sku: "TH-002", name: "Cotton Thread (Assorted)", category: "Thread", hsn: "520400", gstRate: 5, unit: "Box", purchasePrice: 320, tradePrice: 440, mrp: 520, reorderLevel: 40, stock: 22, active: true },
];

const LEDGER_INIT = [
  { id: 1, productId: 1, type: "OPENING", qty: 3000, balance: 3000, date: "2026-04-01", ref: "Opening Entry", by: "Admin" },
  { id: 2, productId: 1, type: "DISPATCH", qty: -660, balance: 2340, date: "2026-04-05", ref: "ORD-001", by: "Admin" },
  { id: 3, productId: 2, type: "OPENING", qty: 500, balance: 500, date: "2026-04-01", ref: "Opening Entry", by: "Admin" },
  { id: 4, productId: 2, type: "DISPATCH", qty: -415, balance: 85, date: "2026-04-10", ref: "ORD-002", by: "Admin" },
  { id: 5, productId: 3, type: "OPENING", qty: 200, balance: 200, date: "2026-04-01", ref: "Opening Entry", by: "Admin" },
  { id: 6, productId: 3, type: "DISPATCH", qty: -200, balance: 0, date: "2026-04-12", ref: "ORD-003", by: "Admin" },
  { id: 7, productId: 4, type: "OPENING", qty: 5000, balance: 5000, date: "2026-04-01", ref: "Opening Entry", by: "Admin" },
  { id: 8, productId: 4, type: "DISPATCH", qty: -500, balance: 4500, date: "2026-04-08", ref: "ORD-001", by: "Admin" },
  { id: 9, productId: 5, type: "OPENING", qty: 3000, balance: 3000, date: "2026-04-01", ref: "Opening Entry", by: "Admin" },
  { id: 10, productId: 5, type: "DISPATCH", qty: -2580, balance: 420, date: "2026-04-14", ref: "ORD-004", by: "Admin" },
];

const GST_RATES = [0, 5, 12, 18, 28];
const UNITS = ["Nos", "Kg", "Gram", "Litre", "ML", "Metre", "Box", "Carton", "Set", "Pair", "Roll", "Packet"];
const CATEGORIES = ["Fabric", "Thread", "Accessories", "Packaging", "Chemicals", "Electronics", "Other"];
const ADJ_TYPES = ["PURCHASE", "RETURN", "DAMAGE", "ADJUSTMENT"];
const TYPE_COLORS = { OPENING: C.brand, PURCHASE: C.green, DISPATCH: C.accent, RETURN: C.gold, DAMAGE: C.red, ADJUSTMENT: C.subtle };

// ── HELPERS ───────────────────────────────────────────────────
const fmt = (n) => new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n);
const fmtCur = (n) => "₹" + new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(n);
const stockStatus = (s, r) => s === 0 ? "zero" : s < r ? "low" : "ok";
const statusBadge = (s, r) => {
  const st = stockStatus(s, r);
  if (st === "zero") return { label: "Out of Stock", bg: C.red + "22", color: C.red };
  if (st === "low") return { label: "Low Stock", bg: C.gold + "22", color: C.gold };
  return { label: "In Stock", bg: C.green + "22", color: C.green };
};

// ── MICRO COMPONENTS ──────────────────────────────────────────
const Td = ({ children, right, bold, color }) => (
  <td style={{ padding: "10px 12px", borderBottom: `1px solid ${C.muted}`, textAlign: right ? "right" : "left", fontSize: 13, color: color || C.subtle, fontWeight: bold ? 600 : 400, whiteSpace: "nowrap" }}>{children}</td>
);
const Th = ({ children, right }) => (
  <th style={{ padding: "10px 12px", background: C.muted, textAlign: right ? "right" : "left", fontSize: 11, color: C.subtle, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase", whiteSpace: "nowrap" }}>{children}</th>
);
const Input = ({ label, value, onChange, type = "text", placeholder, required, options, small }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: small ? 100 : 140 }}>
    {label && <label style={{ fontSize: 11, color: C.subtle, letterSpacing: 0.5, textTransform: "uppercase" }}>{label}{required && <span style={{ color: C.red }}> *</span>}</label>}
    {options ? (
      <select value={value} onChange={e => onChange(e.target.value)} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, padding: "8px 10px", color: C.text, fontSize: 13, outline: "none" }}>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    ) : (
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} required={required}
        style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, padding: "8px 10px", color: C.text, fontSize: 13, outline: "none" }} />
    )}
  </div>
);
const Btn = ({ children, onClick, color = C.brand, small, outline, danger }) => (
  <button onClick={onClick} style={{
    padding: small ? "6px 12px" : "9px 18px", borderRadius: 7, border: outline ? `1px solid ${color}` : "none", cursor: "pointer",
    background: outline ? "transparent" : (danger ? C.red : color), color: outline ? color : "#fff",
    fontSize: small ? 12 : 13, fontWeight: 600, fontFamily: "inherit", display: "flex", alignItems: "center", gap: 5,
    transition: "opacity 0.15s",
  }}>{children}</button>
);
const Badge = ({ label, color, bg }) => (
  <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 10, background: bg || color + "22", color, letterSpacing: 0.3 }}>{label}</span>
);
const TypeBadge = ({ type }) => {
  const color = TYPE_COLORS[type] || C.subtle;
  return <Badge label={type} color={color} />;
};
const Modal = ({ title, onClose, children, wide }) => (
  <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, width: "100%", maxWidth: wide ? 800 : 540, maxHeight: "90vh", overflowY: "auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 24px", borderBottom: `1px solid ${C.border}` }}>
        <span style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{title}</span>
        <button onClick={onClose} style={{ background: "none", border: "none", color: C.subtle, cursor: "pointer", fontSize: 20 }}>✕</button>
      </div>
      <div style={{ padding: 24 }}>{children}</div>
    </div>
  </div>
);

// ── SIDEBAR ───────────────────────────────────────────────────
const NAV = [
  { key: "dashboard", icon: "⬛", label: "Dashboard" },
  { key: "products", icon: "📦", label: "Products" },
  { key: "ledger", icon: "📋", label: "Stock Ledger" },
  { key: "adjust", icon: "🔧", label: "Adjust Stock" },
];
const Sidebar = ({ active, setActive }) => (
  <div style={{ width: 220, minHeight: "100vh", background: C.surface, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", flexShrink: 0 }}>
    <div style={{ padding: "24px 20px 16px", borderBottom: `1px solid ${C.border}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: 8, background: `linear-gradient(135deg, ${C.brand}, ${C.accent})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 900, color: "#fff" }}>B</div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: C.text, letterSpacing: 0.3 }}>BizFlow</div>
          <div style={{ fontSize: 10, color: C.subtle, letterSpacing: 1.5, textTransform: "uppercase" }}>India Admin</div>
        </div>
      </div>
    </div>
    <nav style={{ padding: "12px 10px", flex: 1 }}>
      {NAV.map(n => (
        <button key={n.key} onClick={() => setActive(n.key)} style={{
          display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 12px", borderRadius: 8,
          border: "none", cursor: "pointer", marginBottom: 2, fontFamily: "inherit",
          background: active === n.key ? C.brand + "22" : "transparent",
          color: active === n.key ? C.brandLight : C.subtle,
          fontWeight: active === n.key ? 700 : 400, fontSize: 14,
          borderLeft: active === n.key ? `3px solid ${C.brand}` : "3px solid transparent",
        }}>
          <span>{n.icon}</span>{n.label}
        </button>
      ))}
    </nav>
    <div style={{ padding: "16px 20px", borderTop: `1px solid ${C.border}` }}>
      <div style={{ fontSize: 11, color: C.subtle }}>GST Registered</div>
      <div style={{ fontSize: 12, color: C.text, fontWeight: 600 }}>27AABCU9603R1ZX</div>
      <div style={{ fontSize: 11, color: C.green, marginTop: 4 }}>● Active Business</div>
    </div>
  </div>
);

// ── DASHBOARD ─────────────────────────────────────────────────
const Dashboard = ({ products, ledger }) => {
  const totalStockValue = products.reduce((s, p) => s + p.stock * p.purchasePrice, 0);
  const totalTradeValue = products.reduce((s, p) => s + p.stock * p.tradePrice, 0);
  const lowStock = products.filter(p => p.active && p.stock > 0 && p.stock < p.reorderLevel).length;
  const outOfStock = products.filter(p => p.active && p.stock === 0).length;
  const totalProducts = products.filter(p => p.active).length;
  const recentLedger = [...ledger].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6);

  const kpis = [
    { label: "Total Stock Value (Cost)", value: fmtCur(totalStockValue), icon: "💰", color: C.brand, sub: "At purchase price" },
    { label: "Realisable Value", value: fmtCur(totalTradeValue), icon: "📈", color: C.green, sub: "At trade price" },
    { label: "Active Products", value: totalProducts, icon: "📦", color: C.brandLight, sub: "In catalogue" },
    { label: "Low Stock Items", value: lowStock, icon: "⚠️", color: C.gold, sub: "Below reorder level" },
    { label: "Out of Stock", value: outOfStock, icon: "🚨", color: C.red, sub: "Zero stock — urgent" },
    { label: "Total SKUs", value: products.length, icon: "🔢", color: C.subtle, sub: "All products" },
  ];

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: C.text, margin: 0 }}>Dashboard</h1>
        <p style={{ color: C.subtle, marginTop: 4, fontSize: 14 }}>Stock overview as of April 21, 2026</p>
      </div>

      {(lowStock > 0 || outOfStock > 0) && (
        <div style={{ background: C.red + "11", border: `1px solid ${C.red}44`, borderRadius: 10, padding: "12px 16px", marginBottom: 24, display: "flex", gap: 12, alignItems: "center" }}>
          <span style={{ fontSize: 18 }}>🚨</span>
          <span style={{ color: C.red, fontSize: 14, fontWeight: 600 }}>
            {outOfStock > 0 && `${outOfStock} product${outOfStock > 1 ? "s" : ""} are OUT OF STOCK`}
            {outOfStock > 0 && lowStock > 0 && " · "}
            {lowStock > 0 && `${lowStock} product${lowStock > 1 ? "s" : ""} are LOW STOCK`}
          </span>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16, marginBottom: 32 }}>
        {kpis.map((k, i) => (
          <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "18px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 11, color: C.subtle, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>{k.label}</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: k.color }}>{k.value}</div>
                <div style={{ fontSize: 11, color: C.subtle, marginTop: 4 }}>{k.sub}</div>
              </div>
              <span style={{ fontSize: 24 }}>{k.icon}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 16 }}>⚠️ Stock Alerts</div>
          {products.filter(p => p.active && p.stock <= p.reorderLevel).length === 0
            ? <p style={{ color: C.subtle, fontSize: 13 }}>No alerts. All stock levels are healthy.</p>
            : products.filter(p => p.active && p.stock <= p.reorderLevel).map(p => {
              const badge = statusBadge(p.stock, p.reorderLevel);
              return (
                <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${C.muted}` }}>
                  <div>
                    <div style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: C.subtle }}>{p.sku} · Reorder at {fmt(p.reorderLevel)} {p.unit}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: badge.color }}>{fmt(p.stock)}</div>
                    <Badge label={badge.label} color={badge.color} bg={badge.bg} />
                  </div>
                </div>
              );
            })
          }
        </div>

        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 16 }}>📋 Recent Stock Movements</div>
          {recentLedger.map(l => {
            const prod = products.find(p => p.id === l.productId);
            return (
              <div key={l.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${C.muted}` }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>{prod?.name}</div>
                  <div style={{ fontSize: 11, color: C.subtle }}>{l.date} · {l.ref}</div>
                </div>
                <div style={{ textAlign: "right", marginLeft: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: l.qty > 0 ? C.green : C.accent }}>
                    {l.qty > 0 ? "+" : ""}{fmt(l.qty)}
                  </div>
                  <TypeBadge type={l.type} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ── PRODUCTS ──────────────────────────────────────────────────
const Products = ({ products, setProducts, ledger, setLedger }) => {
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", sku: "", hsn: "", gstRate: 5, unit: "Metre", purchasePrice: "", tradePrice: "", mrp: "", reorderLevel: "", stock: "", category: "Fabric" });

  const filtered = products.filter(p =>
    (catFilter === "All" || p.category === catFilter) &&
    (p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()))
  );

  const openAdd = () => { setEditing(null); setForm({ name: "", sku: "", hsn: "", gstRate: 5, unit: "Metre", purchasePrice: "", tradePrice: "", mrp: "", reorderLevel: "", stock: "", category: "Fabric" }); setShowForm(true); };
  const openEdit = (p) => { setEditing(p.id); setForm({ ...p, purchasePrice: p.purchasePrice + "", tradePrice: p.tradePrice + "", mrp: p.mrp + "", reorderLevel: p.reorderLevel + "", stock: p.stock + "" }); setShowForm(true); };

  const saveProduct = () => {
    if (!form.name || !form.sku || !form.hsn || !form.purchasePrice || !form.tradePrice) return;
    if (editing) {
      setProducts(prev => prev.map(p => p.id === editing ? { ...p, ...form, gstRate: +form.gstRate, purchasePrice: +form.purchasePrice, tradePrice: +form.tradePrice, mrp: +form.mrp || 0, reorderLevel: +form.reorderLevel || 0 } : p));
    } else {
      const newId = Math.max(...products.map(p => p.id)) + 1;
      const openingQty = +form.stock || 0;
      const newProd = { id: newId, ...form, gstRate: +form.gstRate, purchasePrice: +form.purchasePrice, tradePrice: +form.tradePrice, mrp: +form.mrp || 0, reorderLevel: +form.reorderLevel || 0, stock: openingQty, active: true };
      setProducts(prev => [...prev, newProd]);
      if (openingQty > 0) {
        setLedger(prev => [...prev, { id: Date.now(), productId: newId, type: "OPENING", qty: openingQty, balance: openingQty, date: new Date().toISOString().slice(0, 10), ref: "Opening Entry", by: "Admin" }]);
      }
    }
    setShowForm(false);
  };

  const toggleActive = (id) => setProducts(prev => prev.map(p => p.id === id ? { ...p, active: !p.active } : p));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: C.text, margin: 0 }}>Products</h1>
          <p style={{ color: C.subtle, fontSize: 14, marginTop: 4 }}>{products.filter(p => p.active).length} active products · {products.filter(p => !p.active).length} inactive</p>
        </div>
        <Btn onClick={openAdd}>+ Add Product</Btn>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or SKU…"
          style={{ flex: 1, minWidth: 200, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 14px", color: C.text, fontSize: 13, outline: "none" }} />
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 14px", color: C.text, fontSize: 13, outline: "none" }}>
          <option>All</option>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["SKU", "Product Name", "HSN", "Category", "GST%", "Unit", "Stock", "Trade Price", "Status", "Actions"].map(h => <Th key={h}>{h}</Th>)}
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const badge = statusBadge(p.stock, p.reorderLevel);
                return (
                  <tr key={p.id} style={{ opacity: p.active ? 1 : 0.45 }}>
                    <Td><span style={{ fontFamily: "monospace", fontSize: 12, color: C.brandLight }}>{p.sku}</span></Td>
                    <Td bold color={C.text}>{p.name}</Td>
                    <Td><span style={{ fontFamily: "monospace", fontSize: 12 }}>{p.hsn}</span></Td>
                    <Td>{p.category}</Td>
                    <Td right><Badge label={`${p.gstRate}%`} color={C.brand} /></Td>
                    <Td>{p.unit}</Td>
                    <Td right bold color={badge.color}>{fmt(p.stock)}</Td>
                    <Td right bold color={C.text}>{fmtCur(p.tradePrice)}</Td>
                    <Td><Badge label={badge.label} color={badge.color} bg={badge.bg} /></Td>
                    <Td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <Btn small onClick={() => openEdit(p)}>Edit</Btn>
                        <Btn small outline color={p.active ? C.red : C.green} onClick={() => toggleActive(p.id)}>{p.active ? "Disable" : "Enable"}</Btn>
                      </div>
                    </Td>
                  </tr>
                );
              })}
              {filtered.length === 0 && <tr><td colSpan={10} style={{ padding: 32, textAlign: "center", color: C.subtle, fontSize: 14 }}>No products found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <Modal title={editing ? "Edit Product" : "Add New Product"} onClose={() => setShowForm(false)} wide>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Input label="Product Name" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} required placeholder="e.g. Cotton Fabric White" />
              <Input label="SKU / Item Code" value={form.sku} onChange={v => setForm(f => ({ ...f, sku: v }))} required placeholder="e.g. BF-001" small />
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Input label="HSN Code" value={form.hsn} onChange={v => setForm(f => ({ ...f, hsn: v }))} required placeholder="6-digit HSN" small />
              <Input label="GST Rate %" value={form.gstRate} onChange={v => setForm(f => ({ ...f, gstRate: v }))} options={GST_RATES.map(String)} small />
              <Input label="Unit" value={form.unit} onChange={v => setForm(f => ({ ...f, unit: v }))} options={UNITS} small />
              <Input label="Category" value={form.category} onChange={v => setForm(f => ({ ...f, category: v }))} options={CATEGORIES} small />
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Input label="Purchase Price (₹) excl. GST" value={form.purchasePrice} onChange={v => setForm(f => ({ ...f, purchasePrice: v }))} type="number" required placeholder="0.00" />
              <Input label="Trade Price (₹) excl. GST" value={form.tradePrice} onChange={v => setForm(f => ({ ...f, tradePrice: v }))} type="number" required placeholder="0.00" />
              <Input label="MRP (₹)" value={form.mrp} onChange={v => setForm(f => ({ ...f, mrp: v }))} type="number" placeholder="0.00" />
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Input label="Reorder Level" value={form.reorderLevel} onChange={v => setForm(f => ({ ...f, reorderLevel: v }))} type="number" placeholder="e.g. 500" />
              {!editing && <Input label="Opening Stock (qty)" value={form.stock} onChange={v => setForm(f => ({ ...f, stock: v }))} type="number" placeholder="Starting quantity" />}
            </div>
            {form.purchasePrice && form.tradePrice && (
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "12px 16px", fontSize: 13 }}>
                <span style={{ color: C.subtle }}>Trade Price incl. GST: </span>
                <strong style={{ color: C.green }}>{fmtCur(+form.tradePrice * (1 + +form.gstRate / 100))}</strong>
                <span style={{ color: C.subtle, marginLeft: 16 }}>Margin: </span>
                <strong style={{ color: C.gold }}>{form.purchasePrice > 0 ? (((+form.tradePrice - +form.purchasePrice) / +form.purchasePrice) * 100).toFixed(1) + "%" : "—"}</strong>
              </div>
            )}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
              <Btn outline color={C.subtle} onClick={() => setShowForm(false)}>Cancel</Btn>
              <Btn onClick={saveProduct}>{editing ? "Save Changes" : "Add Product"}</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ── LEDGER ────────────────────────────────────────────────────
const Ledger = ({ products, ledger }) => {
  const [prodFilter, setProdFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");

  const filtered = ledger.filter(l =>
    (prodFilter === "All" || l.productId === +prodFilter) &&
    (typeFilter === "All" || l.type === typeFilter)
  ).sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: C.text, margin: 0 }}>Stock Ledger</h1>
        <p style={{ color: C.subtle, fontSize: 14, marginTop: 4 }}>Complete audit trail of all stock movements</p>
      </div>
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <select value={prodFilter} onChange={e => setProdFilter(e.target.value)} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 14px", color: C.text, fontSize: 13, outline: "none" }}>
          <option value="All">All Products</option>
          {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 14px", color: C.text, fontSize: 13, outline: "none" }}>
          <option value="All">All Types</option>
          {Object.keys(TYPE_COLORS).map(t => <option key={t}>{t}</option>)}
        </select>
      </div>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>{["Date", "Product", "SKU", "Type", "Quantity", "Balance After", "Reference", "By"].map(h => <Th key={h} right={["Quantity", "Balance After"].includes(h)}>{h}</Th>)}</tr>
            </thead>
            <tbody>
              {filtered.map(l => {
                const prod = products.find(p => p.id === l.productId);
                return (
                  <tr key={l.id}>
                    <Td>{l.date}</Td>
                    <Td bold color={C.text}>{prod?.name}</Td>
                    <Td><span style={{ fontFamily: "monospace", fontSize: 12, color: C.brandLight }}>{prod?.sku}</span></Td>
                    <Td><TypeBadge type={l.type} /></Td>
                    <Td right bold color={l.qty > 0 ? C.green : C.accent}>{l.qty > 0 ? "+" : ""}{fmt(l.qty)}</Td>
                    <Td right bold color={C.text}>{fmt(l.balance)}</Td>
                    <Td>{l.ref}</Td>
                    <Td>{l.by}</Td>
                  </tr>
                );
              })}
              {filtered.length === 0 && <tr><td colSpan={8} style={{ padding: 32, textAlign: "center", color: C.subtle, fontSize: 14 }}>No ledger entries found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ── ADJUST STOCK ──────────────────────────────────────────────
const Adjust = ({ products, setProducts, ledger, setLedger }) => {
  const [form, setForm] = useState({ productId: "", type: "PURCHASE", qty: "", notes: "" });
  const [confirm, setConfirm] = useState(null);
  const [success, setSuccess] = useState(null);

  const selectedProduct = products.find(p => p.id === +form.productId);
  const isOut = ["DISPATCH", "DAMAGE"].includes(form.type);
  const newBalance = selectedProduct ? selectedProduct.stock + (isOut ? -Math.abs(+form.qty) : Math.abs(+form.qty)) : null;

  const handleSubmit = () => {
    if (!form.productId || !form.qty || +form.qty <= 0) return;
    setConfirm({ ...form, product: selectedProduct, newBalance, isOut });
  };

  const confirmSave = () => {
    const qty = isOut ? -Math.abs(+confirm.qty) : Math.abs(+confirm.qty);
    const newStock = confirm.product.stock + qty;
    setProducts(prev => prev.map(p => p.id === +confirm.productId ? { ...p, stock: newStock } : p));
    setLedger(prev => [...prev, {
      id: Date.now(), productId: +confirm.productId, type: confirm.type, qty, balance: newStock,
      date: new Date().toISOString().slice(0, 10), ref: confirm.type + "-" + Date.now().toString().slice(-6), by: "Admin", notes: confirm.notes
    }]);
    setSuccess(`Stock updated! New balance for ${confirm.product.name}: ${fmt(newStock)} ${confirm.product.unit}`);
    setConfirm(null);
    setForm({ productId: "", type: "PURCHASE", qty: "", notes: "" });
    setTimeout(() => setSuccess(null), 4000);
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: C.text, margin: 0 }}>Adjust Stock</h1>
        <p style={{ color: C.subtle, fontSize: 14, marginTop: 4 }}>Record purchases, returns, damage write-offs and manual corrections</p>
      </div>

      {success && (
        <div style={{ background: C.green + "22", border: `1px solid ${C.green}44`, borderRadius: 10, padding: "14px 18px", marginBottom: 24, color: C.green, fontWeight: 600 }}>
          ✅ {success}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 20 }}>Stock Adjustment Form</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 11, color: C.subtle, letterSpacing: 0.5, textTransform: "uppercase" }}>Product <span style={{ color: C.red }}>*</span></label>
              <select value={form.productId} onChange={e => setForm(f => ({ ...f, productId: e.target.value }))}
                style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, padding: "9px 12px", color: form.productId ? C.text : C.subtle, fontSize: 13, outline: "none" }}>
                <option value="">Select product…</option>
                {products.filter(p => p.active).map(p => <option key={p.id} value={p.id}>{p.name} (Stock: {fmt(p.stock)} {p.unit})</option>)}
              </select>
            </div>
            <Input label="Transaction Type" value={form.type} onChange={v => setForm(f => ({ ...f, type: v }))} options={ADJ_TYPES} />
            <Input label={`Quantity (${selectedProduct?.unit || "units"})`} value={form.qty} onChange={v => setForm(f => ({ ...f, qty: v }))} type="number" placeholder="Enter quantity" required />
            <Input label="Notes / Reference" value={form.notes} onChange={v => setForm(f => ({ ...f, notes: v }))} placeholder="Invoice no., reason, etc." />

            {selectedProduct && form.qty > 0 && (
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "12px 16px" }}>
                <div style={{ fontSize: 12, color: C.subtle, marginBottom: 4 }}>Preview</div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: C.subtle, fontSize: 13 }}>Current stock:</span>
                  <strong style={{ color: C.text }}>{fmt(selectedProduct.stock)} {selectedProduct.unit}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                  <span style={{ color: C.subtle, fontSize: 13 }}>After this entry:</span>
                  <strong style={{ color: newBalance >= 0 ? C.green : C.red }}>{fmt(newBalance)} {selectedProduct.unit}</strong>
                </div>
                {newBalance < 0 && <div style={{ color: C.red, fontSize: 12, marginTop: 8 }}>⚠️ Quantity exceeds available stock</div>}
              </div>
            )}

            <Btn onClick={handleSubmit}>Record Stock Movement</Btn>
          </div>
        </div>

        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 16 }}>Transaction Type Guide</div>
          {[
            { type: "PURCHASE", icon: "📥", color: C.green, desc: "Goods received from supplier. Use when new stock arrives. Records GRN." },
            { type: "RETURN", icon: "↩️", color: C.gold, desc: "Buyer returns goods. Stock is added back to warehouse inventory." },
            { type: "DAMAGE", icon: "💔", color: C.red, desc: "Items damaged, expired or unusable. Reduces stock with audit note." },
            { type: "ADJUSTMENT", icon: "🔧", color: C.subtle, desc: "Manual correction after physical stock count. Requires a note." },
          ].map(t => (
            <div key={t.type} style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: `1px solid ${C.muted}` }}>
              <span style={{ fontSize: 20 }}>{t.icon}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: t.color }}>{t.type}</div>
                <div style={{ fontSize: 12, color: C.subtle, lineHeight: 1.4 }}>{t.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {confirm && (
        <Modal title="Confirm Stock Movement" onClose={() => setConfirm(null)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "16px 18px" }}>
              {[
                ["Product", confirm.product.name],
                ["Transaction Type", confirm.type],
                ["Quantity", `${confirm.isOut ? "-" : "+"}${fmt(confirm.qty)} ${confirm.product.unit}`],
                ["Current Stock", `${fmt(confirm.product.stock)} ${confirm.product.unit}`],
                ["New Balance", `${fmt(confirm.newBalance)} ${confirm.product.unit}`],
                ...(confirm.notes ? [["Notes", confirm.notes]] : []),
              ].map(([k, v], i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: i < 4 ? `1px solid ${C.muted}` : "none" }}>
                  <span style={{ color: C.subtle, fontSize: 13 }}>{k}</span>
                  <strong style={{ color: C.text, fontSize: 13 }}>{v}</strong>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <Btn outline color={C.subtle} onClick={() => setConfirm(null)}>Cancel</Btn>
              <Btn onClick={confirmSave} color={C.green}>✓ Confirm & Save</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ── APP ───────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("dashboard");
  const [products, setProducts] = useState(PRODUCTS_INIT);
  const [ledger, setLedger] = useState(LEDGER_INIT);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: C.bg, fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif", color: C.text }}>
      <Sidebar active={page} setActive={setPage} />
      <main style={{ flex: 1, padding: "32px 36px", overflowY: "auto", maxHeight: "100vh" }}>
        {page === "dashboard" && <Dashboard products={products} ledger={ledger} />}
        {page === "products" && <Products products={products} setProducts={setProducts} ledger={ledger} setLedger={setLedger} />}
        {page === "ledger" && <Ledger products={products} ledger={ledger} />}
        {page === "adjust" && <Adjust products={products} setProducts={setProducts} ledger={ledger} setLedger={setLedger} />}
      </main>
    </div>
  );
}
