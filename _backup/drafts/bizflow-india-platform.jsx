import { useState } from "react";

const COLORS = {
  bg: "#0A0F1E",
  surface: "#111827",
  card: "#161E2E",
  border: "#1E2D45",
  accent: "#FF6B2B",
  accentLight: "#FF8C52",
  gold: "#F5B800",
  green: "#10B981",
  red: "#EF4444",
  blue: "#3B82F6",
  purple: "#8B5CF6",
  text: "#F1F5F9",
  muted: "#64748B",
  subtle: "#94A3B8",
};

const modules = [
  {
    id: "inventory",
    icon: "📦",
    title: "Stock & Inventory Management",
    color: COLORS.blue,
    tag: "ADMIN MODULE",
    features: [
      "Product catalogue with HSN codes (mandatory for GST)",
      "Real-time stock levels with low-stock alerts",
      "Batch/lot tracking for perishables or serialized goods",
      "Purchase price, MRP, trade price management",
      "Multi-warehouse / godown support",
      "Stock ledger with opening/closing balance reports",
    ],
    india_note: "HSN code is mandatory for GST e-invoicing. 6-digit for turnover >₹5Cr, 4-digit below.",
  },
  {
    id: "buyer",
    icon: "🧑‍💼",
    title: "Buyer Registration & KYC",
    color: COLORS.purple,
    tag: "BUYER MODULE",
    features: [
      "Buyer self-registration with GSTIN verification via GST API",
      "PAN verification for credit limit eligibility",
      "Udyam/MSME registration status capture",
      "Business type: Proprietor / Pvt Ltd / LLP / Partnership",
      "Credit limit assignment by admin (₹ cap per buyer)",
      "Buyer risk score based on past payment history",
    ],
    india_note: "GSTIN verification ensures ITC eligibility for buyers. Reduces fake-buyer risk.",
  },
  {
    id: "orders",
    icon: "🛒",
    title: "Purchase Order Management",
    color: COLORS.green,
    tag: "ORDER MODULE",
    features: [
      "Buyer places order with product selection & quantity",
      "Admin review & approval workflow (approve / modify / reject)",
      "Order confirmation with estimated dispatch date",
      "Order linked to buyer's credit limit — auto-block if exceeded",
      "Pro-forma invoice generation before dispatch",
      "Order history and re-order functionality",
    ],
    india_note: "Pro-forma invoice is not a tax document. It protects the seller before goods leave the warehouse.",
  },
  {
    id: "dispatch",
    icon: "🚚",
    title: "Dispatch & E-Way Bill",
    color: COLORS.accent,
    tag: "LOGISTICS MODULE",
    features: [
      "Admin marks order as 'Ready for Dispatch'",
      "E-Way Bill auto-generation via NIC API (for goods >₹50,000)",
      "Transporter / vehicle details capture",
      "Dispatch challan generation",
      "Real-time dispatch status notifications (SMS + WhatsApp + Email)",
      "Delivery confirmation by buyer (digital acknowledgment)",
    ],
    india_note: "E-Way Bill is mandatory for interstate goods movement >₹50,000. Non-compliance = goods detention.",
  },
  {
    id: "invoice",
    icon: "🧾",
    title: "GST E-Invoice Generation",
    color: COLORS.gold,
    tag: "COMPLIANCE MODULE",
    features: [
      "Auto-generate GST-compliant invoice on dispatch",
      "IRP submission → IRN + QR code generation (within 30 days mandate)",
      "CGST/SGST/IGST calculation based on supply type & place",
      "Invoice sent to buyer via Email + WhatsApp PDF",
      "Invoice registered in GSTR-1 auto-population",
      "Credit note / debit note management",
    ],
    india_note: "From April 2025, businesses >₹10Cr must upload to IRP within 30 days. Invalid IRN = no ITC for buyer.",
  },
  {
    id: "payment",
    icon: "💳",
    title: "Payment Tracking & Recovery",
    color: "#EC4899",
    tag: "COLLECTIONS MODULE",
    features: [
      "Invoice aging dashboard: 0-30, 31-45, 46-60, 60+ days",
      "Automated WhatsApp + SMS + Email reminders (Day 7, 15, 30, 44)",
      "Section 43B(h) alert to buyer: 'Tax deduction at risk after 45 days'",
      "UPI / NEFT / RTGS / Cheque payment recording",
      "Partial payment support with outstanding balance tracking",
      "Payment receipt auto-sent to buyer on recording payment",
    ],
    india_note: "Section 43B(h) from FY2024-25: buyer LOSES tax deduction if MSME invoice unpaid beyond 45 days.",
  },
  {
    id: "compliance",
    icon: "⚖️",
    title: "Legal & Compliance Escalation",
    color: COLORS.red,
    tag: "LEGAL MODULE",
    features: [
      "Auto-flag invoices beyond 45-day MSME threshold",
      "One-click MSME Samadhaan portal complaint pre-fill",
      "Legal notice draft generator (with compound interest @ 3× RBI rate)",
      "Buyer blacklist management & credit block",
      "Outstanding receivables report for CA/auditor export",
      "Income Tax 43B(h) disallowance tracker for tax filings",
    ],
    india_note: "Compound interest at 3× RBI bank rate (~18-21% p.a.) is auto-applicable once 45 days lapse.",
  },
  {
    id: "reports",
    icon: "📊",
    title: "Reports & Tax Dashboard",
    color: "#06B6D4",
    tag: "ANALYTICS MODULE",
    features: [
      "GSTR-1 ready export (sales register)",
      "GSTR-3B summary (output GST liability)",
      "Receivables ageing report for income tax provisions",
      "Buyer-wise outstanding & payment history",
      "Monthly P&L impact of delayed payments",
      "TDS/TCS tracking where applicable",
    ],
    india_note: "GST council now requires invoice-wise GSTR-7 reporting from Sept 2025. Accurate records are critical.",
  },
];

const complianceTimeline = [
  { day: "Day 0", event: "Dispatch + GST E-Invoice raised", icon: "🧾", color: COLORS.green, action: "IRN generated, sent to buyer via Email & WhatsApp" },
  { day: "Day 7", event: "Payment Reminder #1", icon: "📱", color: COLORS.blue, action: "Friendly WhatsApp + Email reminder" },
  { day: "Day 15", event: "Payment Reminder #2", icon: "📧", color: COLORS.blue, action: "Email with invoice copy + UPI QR code" },
  { day: "Day 30", event: "Payment Reminder #3 — Urgent", icon: "⚠️", color: COLORS.gold, action: "WhatsApp + SMS: 15 days left before tax impact" },
  { day: "Day 44", event: "CRITICAL: 43B(h) Alert", icon: "🚨", color: COLORS.accent, action: "Warn buyer: 'Tomorrow your tax deduction is disallowed'" },
  { day: "Day 45", event: "MSME Legal Threshold Crossed", icon: "⚖️", color: COLORS.red, action: "Compound interest starts. Samadhaan complaint ready." },
  { day: "Day 60+", event: "Escalation & Credit Block", icon: "🔒", color: COLORS.red, action: "Buyer blocked, legal notice sent, GST impact flagged" },
];

const stats = [
  { label: "Pending MSME dues (Samadhaan portal)", value: "₹22,363 Cr", sub: "As of July 2025", color: COLORS.red },
  { label: "Cases filed since 2017", value: "2.18 Lakh+", sub: "Mostly unresolved", color: COLORS.gold },
  { label: "Tax deduction disallowed", value: "Section 43B(h)", sub: "From FY 2024-25", color: COLORS.accent },
  { label: "E-invoice IRP mandate", value: "₹5 Cr+", sub: "Turnover threshold", color: COLORS.green },
];

export default function App() {
  const [activeModule, setActiveModule] = useState(null);
  const [activeTab, setActiveTab] = useState("platform");

  return (
    <div style={{
      background: COLORS.bg,
      minHeight: "100vh",
      fontFamily: "'Georgia', serif",
      color: COLORS.text,
      overflowX: "hidden",
    }}>
      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, #0A0F1E 0%, #0F1A35 50%, #0A0F1E 100%)`,
        borderBottom: `1px solid ${COLORS.border}`,
        padding: "0 24px",
        position: "sticky",
        top: 0,
        zIndex: 100,
        backdropFilter: "blur(20px)",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8,
              background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.gold})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18, fontWeight: "bold"
            }}>B</div>
            <div>
              <div style={{ fontFamily: "'Georgia', serif", fontWeight: "bold", fontSize: 18, letterSpacing: 1 }}>
                BizFlow <span style={{ color: COLORS.accent }}>India</span>
              </div>
              <div style={{ fontSize: 10, color: COLORS.muted, letterSpacing: 2, textTransform: "uppercase" }}>
                Order · Invoice · Collect · Comply
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {["platform", "problem", "timeline", "compliance"].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                padding: "6px 14px", borderRadius: 6, border: "none", cursor: "pointer",
                fontSize: 12, fontFamily: "'Georgia', serif", letterSpacing: 0.5,
                textTransform: "capitalize",
                background: activeTab === tab ? COLORS.accent : "transparent",
                color: activeTab === tab ? "#fff" : COLORS.muted,
                transition: "all 0.2s",
              }}>{tab}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>

        {/* PLATFORM TAB */}
        {activeTab === "platform" && (
          <>
            <div style={{ textAlign: "center", marginBottom: 48 }}>
              <div style={{
                display: "inline-block", padding: "4px 16px", borderRadius: 20,
                border: `1px solid ${COLORS.accent}`, color: COLORS.accent,
                fontSize: 11, letterSpacing: 3, textTransform: "uppercase", marginBottom: 16
              }}>Platform Architecture</div>
              <h1 style={{
                fontSize: "clamp(28px, 5vw, 52px)", fontFamily: "'Georgia', serif",
                fontWeight: "bold", margin: "0 0 16px",
                background: `linear-gradient(135deg, ${COLORS.text}, ${COLORS.accent})`,
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
              }}>
                End-to-End B2B Commerce<br />& Collections Platform
              </h1>
              <p style={{ color: COLORS.subtle, fontSize: 16, maxWidth: 600, margin: "0 auto", lineHeight: 1.6 }}>
                Built for Indian businesses. GST-compliant. MSME-aware. Designed to convert overdue receivables into recovered payments.
              </p>
            </div>

            {/* Flow diagram */}
            <div style={{
              background: COLORS.card, border: `1px solid ${COLORS.border}`,
              borderRadius: 16, padding: "24px", marginBottom: 40,
              overflowX: "auto"
            }}>
              <div style={{ fontSize: 11, color: COLORS.muted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 20 }}>
                Platform Flow
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "nowrap", minWidth: 700 }}>
                {[
                  { label: "Buyer Registers", sub: "GSTIN KYC", icon: "👤" },
                  { label: "Places Order", sub: "Credit checked", icon: "🛒" },
                  { label: "Admin Approves", sub: "Dashboard", icon: "✅" },
                  { label: "Dispatch + E-Way Bill", sub: "NIC API", icon: "🚚" },
                  { label: "E-Invoice (IRN)", sub: "IRP Portal", icon: "🧾" },
                  { label: "Auto Reminders", sub: "WA+SMS+Email", icon: "📱" },
                  { label: "Payment Collected", sub: "UPI/NEFT", icon: "💳" },
                  { label: "GST Reports", sub: "GSTR-1/3B", icon: "📊" },
                ].map((step, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    <div style={{
                      background: COLORS.surface, border: `1px solid ${COLORS.border}`,
                      borderRadius: 10, padding: "10px 14px", textAlign: "center", minWidth: 90
                    }}>
                      <div style={{ fontSize: 20, marginBottom: 4 }}>{step.icon}</div>
                      <div style={{ fontSize: 11, fontWeight: "bold", color: COLORS.text }}>{step.label}</div>
                      <div style={{ fontSize: 10, color: COLORS.muted }}>{step.sub}</div>
                    </div>
                    {i < 7 && <div style={{ color: COLORS.accent, fontSize: 20, flexShrink: 0 }}>→</div>}
                  </div>
                ))}
              </div>
            </div>

            {/* Module Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20, marginBottom: 40 }}>
              {modules.map(mod => (
                <div
                  key={mod.id}
                  onClick={() => setActiveModule(activeModule === mod.id ? null : mod.id)}
                  style={{
                    background: COLORS.card,
                    border: `1px solid ${activeModule === mod.id ? mod.color : COLORS.border}`,
                    borderRadius: 14, padding: "20px", cursor: "pointer",
                    transition: "all 0.25s",
                    boxShadow: activeModule === mod.id ? `0 0 20px ${mod.color}22` : "none",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 10, fontSize: 20,
                        background: `${mod.color}22`, border: `1px solid ${mod.color}44`,
                        display: "flex", alignItems: "center", justifyContent: "center"
                      }}>{mod.icon}</div>
                      <div>
                        <div style={{ fontSize: 10, color: mod.color, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 2 }}>{mod.tag}</div>
                        <div style={{ fontSize: 14, fontWeight: "bold", color: COLORS.text }}>{mod.title}</div>
                      </div>
                    </div>
                    <div style={{ color: COLORS.muted, fontSize: 18, transition: "transform 0.2s", transform: activeModule === mod.id ? "rotate(90deg)" : "none" }}>›</div>
                  </div>

                  {activeModule === mod.id && (
                    <div>
                      <ul style={{ margin: "0 0 12px", padding: "0 0 0 16px", listStyle: "none" }}>
                        {mod.features.map((f, i) => (
                          <li key={i} style={{ fontSize: 13, color: COLORS.subtle, padding: "4px 0", display: "flex", gap: 8 }}>
                            <span style={{ color: mod.color, flexShrink: 0 }}>•</span>{f}
                          </li>
                        ))}
                      </ul>
                      <div style={{
                        background: `${mod.color}11`, border: `1px solid ${mod.color}33`,
                        borderRadius: 8, padding: "10px 12px",
                        fontSize: 12, color: mod.color, lineHeight: 1.5
                      }}>
                        🇮🇳 <strong>India Context:</strong> {mod.india_note}
                      </div>
                    </div>
                  )}

                  {activeModule !== mod.id && (
                    <div style={{ fontSize: 12, color: COLORS.muted }}>
                      {mod.features[0]} <span style={{ color: COLORS.accent }}>+{mod.features.length - 1} more →</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* PROBLEM TAB */}
        {activeTab === "problem" && (
          <>
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <div style={{
                display: "inline-block", padding: "4px 16px", borderRadius: 20,
                border: `1px solid ${COLORS.red}`, color: COLORS.red,
                fontSize: 11, letterSpacing: 3, textTransform: "uppercase", marginBottom: 16
              }}>The Indian Problem</div>
              <h1 style={{ fontSize: 36, fontFamily: "'Georgia', serif", fontWeight: "bold", margin: "0 0 12px" }}>
                Why Indian Businesses<br /><span style={{ color: COLORS.accent }}>Bleed Cash</span>
              </h1>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16, marginBottom: 40 }}>
              {stats.map((s, i) => (
                <div key={i} style={{
                  background: COLORS.card, border: `1px solid ${s.color}44`,
                  borderRadius: 14, padding: "20px", textAlign: "center"
                }}>
                  <div style={{ fontSize: 28, fontWeight: "bold", color: s.color, fontFamily: "'Georgia', serif" }}>{s.value}</div>
                  <div style={{ fontSize: 13, color: COLORS.text, margin: "6px 0 4px" }}>{s.label}</div>
                  <div style={{ fontSize: 11, color: COLORS.muted }}>{s.sub}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 32 }}>
              {[
                {
                  title: "The Core Problem",
                  icon: "🔴",
                  color: COLORS.red,
                  points: [
                    "Buyers receive goods but delay payment 60–180 days",
                    "Seller has already paid GST output tax from own pocket",
                    "Seller cannot file GSTR-3B accurately with unpaid receivables",
                    "Income tax provisions distorted by unpaid debtors",
                    "Working capital trapped — can't buy new stock",
                    "Legal recovery takes 2–5 years through courts",
                  ]
                },
                {
                  title: "GST Compliance Impact",
                  icon: "⚠️",
                  color: COLORS.gold,
                  points: [
                    "GST is collected from buyer on invoice date — seller pays govt",
                    "If buyer doesn't pay, seller funds the govt's GST",
                    "IRN must be generated within 30 days — no delay allowed",
                    "Buyer loses ITC if seller doesn't upload invoice",
                    "Fake invoices or mismatches trigger GST notices",
                    "GSTR-1 vs GSTR-2A mismatch = scrutiny + penalties",
                  ]
                },
                {
                  title: "Income Tax Impact",
                  icon: "📋",
                  color: COLORS.purple,
                  points: [
                    "Section 43B(h): From FY2024-25, buyer CANNOT deduct expenses if MSME invoice unpaid beyond 45 days",
                    "This is a POWERFUL tool — buyer's taxable income increases",
                    "Seller must track all MSME-registered buyers carefully",
                    "Bad debts provisioning needed for income tax accuracy",
                    "TDS on payments must be matched with 26AS",
                    "Auditors require aged debtors report for tax audit",
                  ]
                },
                {
                  title: "Our Platform's Solution",
                  icon: "✅",
                  color: COLORS.green,
                  points: [
                    "Automated 7-stage reminder engine before legal threshold",
                    "Section 43B(h) warning sent to buyer at Day 44",
                    "One-click MSME Samadhaan complaint pre-fill",
                    "Real-time invoice aging dashboard for owner + CA",
                    "All invoices auto-submitted to IRP (IRN within 30 days)",
                    "GSTR-1 export ready — zero manual work for CA",
                  ]
                }
              ].map((card, i) => (
                <div key={i} style={{
                  background: COLORS.card, border: `1px solid ${card.color}33`,
                  borderRadius: 14, padding: "20px"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                    <span style={{ fontSize: 20 }}>{card.icon}</span>
                    <span style={{ fontSize: 15, fontWeight: "bold", color: card.color }}>{card.title}</span>
                  </div>
                  <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                    {card.points.map((p, j) => (
                      <li key={j} style={{ fontSize: 13, color: COLORS.subtle, padding: "5px 0", display: "flex", gap: 8, lineHeight: 1.4 }}>
                        <span style={{ color: card.color, flexShrink: 0 }}>▸</span>{p}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </>
        )}

        {/* TIMELINE TAB */}
        {activeTab === "timeline" && (
          <>
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <div style={{
                display: "inline-block", padding: "4px 16px", borderRadius: 20,
                border: `1px solid ${COLORS.gold}`, color: COLORS.gold,
                fontSize: 11, letterSpacing: 3, textTransform: "uppercase", marginBottom: 16
              }}>Automated Recovery Engine</div>
              <h1 style={{ fontSize: 36, fontFamily: "'Georgia', serif", fontWeight: "bold", margin: "0 0 12px" }}>
                45-Day Collection<br /><span style={{ color: COLORS.accent }}>Timeline</span>
              </h1>
              <p style={{ color: COLORS.subtle, maxWidth: 500, margin: "0 auto" }}>
                Every invoice triggers an automated multi-channel follow-up sequence. Buyers are nudged firmly — and legally — to pay on time.
              </p>
            </div>

            <div style={{ position: "relative", paddingLeft: 24, marginBottom: 40 }}>
              <div style={{
                position: "absolute", left: 11, top: 0, bottom: 0,
                width: 2, background: `linear-gradient(${COLORS.green}, ${COLORS.red})`,
                borderRadius: 2
              }} />
              {complianceTimeline.map((item, i) => (
                <div key={i} style={{ display: "flex", gap: 20, marginBottom: 24, position: "relative" }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                    background: item.color, display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, position: "absolute", left: -12, top: 12,
                    boxShadow: `0 0 12px ${item.color}66`
                  }}>{item.icon}</div>
                  <div style={{
                    marginLeft: 20,
                    background: COLORS.card, border: `1px solid ${item.color}44`,
                    borderRadius: 12, padding: "16px 20px", flex: 1
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
                      <span style={{
                        background: `${item.color}22`, color: item.color,
                        fontSize: 11, fontWeight: "bold", padding: "2px 10px",
                        borderRadius: 12, letterSpacing: 1
                      }}>{item.day}</span>
                      <span style={{ fontSize: 15, fontWeight: "bold", color: COLORS.text }}>{item.event}</span>
                    </div>
                    <div style={{ fontSize: 13, color: COLORS.subtle }}>{item.action}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{
              background: `linear-gradient(135deg, ${COLORS.red}11, ${COLORS.accent}11)`,
              border: `1px solid ${COLORS.red}44`, borderRadius: 14, padding: "20px 24px"
            }}>
              <div style={{ fontSize: 16, fontWeight: "bold", color: COLORS.red, marginBottom: 8 }}>
                ⚖️ After Day 45 — Automatic Legal Protections Activate
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 12 }}>
                {[
                  "Compound interest @ 3× RBI bank rate (~19-21% p.a.) — enforceable in court",
                  "Buyer's tax deduction disallowed under Section 43B(h) of Income Tax Act",
                  "MSME Samadhaan portal complaint auto-filled — one click to file",
                  "Buyer credit limit blocked — no new orders processed",
                  "Legal notice template auto-generated with outstanding + interest",
                  "Receivables report exported for CA / tax audit purposes",
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, fontSize: 13, color: COLORS.subtle, lineHeight: 1.4 }}>
                    <span style={{ color: COLORS.red, flexShrink: 0 }}>→</span>{item}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* COMPLIANCE TAB */}
        {activeTab === "compliance" && (
          <>
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <div style={{
                display: "inline-block", padding: "4px 16px", borderRadius: 20,
                border: `1px solid ${COLORS.green}`, color: COLORS.green,
                fontSize: 11, letterSpacing: 3, textTransform: "uppercase", marginBottom: 16
              }}>India Compliance Stack</div>
              <h1 style={{ fontSize: 36, fontFamily: "'Georgia', serif", fontWeight: "bold", margin: "0 0 12px" }}>
                Built for Indian<br /><span style={{ color: COLORS.green }}>Tax Laws</span>
              </h1>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20, marginBottom: 40 }}>
              {[
                {
                  law: "GST E-Invoicing (IRP)", icon: "🧾", color: COLORS.blue,
                  rule: "Turnover >₹5 Cr: mandatory e-invoice via IRP. IRN + QR code required.",
                  how: "Platform auto-submits to IRP on dispatch. IRN + QR embedded in PDF sent to buyer.",
                  ref: "CBIC Notification 2020 → updated 2024/2025"
                },
                {
                  law: "30-Day IRP Upload Rule", icon: "⏱️", color: COLORS.gold,
                  rule: "Businesses >₹10Cr AATO: upload invoice to IRP within 30 days from invoice date.",
                  how: "Platform timestamps invoice creation vs IRP upload. Alerts admin if upload pending.",
                  ref: "GSTN Advisory Nov 2024, effective April 2025"
                },
                {
                  law: "E-Way Bill (EWB)", icon: "🚛", color: COLORS.accent,
                  rule: "Goods worth >₹50,000 cannot move without an E-Way Bill from NIC portal.",
                  how: "Platform auto-generates EWB via NIC API at dispatch confirmation.",
                  ref: "Rule 138 of CGST Rules, 2017"
                },
                {
                  law: "MSME 45-Day Rule", icon: "📅", color: COLORS.purple,
                  rule: "Buyer must pay MSME supplier within 45 days. Default = compound interest @ 3× RBI rate.",
                  how: "Invoice aging tracked from Day 0. Legal threshold breach auto-flagged.",
                  ref: "Section 15-16, MSMED Act 2006"
                },
                {
                  law: "Section 43B(h) — Income Tax", icon: "🏛️", color: COLORS.red,
                  rule: "From FY2024-25: buyer cannot claim expense deduction if MSME dues unpaid beyond 45 days.",
                  how: "Platform sends Day-44 tax warning to buyer with exact deduction amount at risk.",
                  ref: "Finance Act 2023, effective 1 April 2024"
                },
                {
                  law: "GSTR-1 / GSTR-3B Filing", icon: "📋", color: COLORS.green,
                  rule: "All B2B invoices must reflect in GSTR-1. Output GST must be paid via GSTR-3B.",
                  how: "Platform auto-populates GSTR-1 data. Monthly export ready for CA filing.",
                  ref: "GST Act 2017, Rule 59"
                },
                {
                  law: "HSN Code Classification", icon: "🔢", color: "#06B6D4",
                  rule: "6-digit HSN for turnover >₹5Cr, 4-digit for below. Mandatory on invoices.",
                  how: "Product catalogue requires HSN code entry. Validated against GST HSN master list.",
                  ref: "GST Notification 78/2020"
                },
                {
                  law: "MSME Samadhaan Integration", icon: "⚖️", color: COLORS.accent,
                  rule: "MSME suppliers can file delayed payment complaints on govt portal.",
                  how: "Platform pre-fills complaint form with all invoice/buyer details. One-click submit.",
                  ref: "Ministry of MSME, samadhaan.msme.gov.in"
                },
              ].map((item, i) => (
                <div key={i} style={{
                  background: COLORS.card, border: `1px solid ${item.color}33`,
                  borderRadius: 14, padding: "18px 20px"
                }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
                    <span style={{ fontSize: 22 }}>{item.icon}</span>
                    <span style={{ fontSize: 14, fontWeight: "bold", color: item.color }}>{item.law}</span>
                  </div>
                  <div style={{ fontSize: 12, color: COLORS.subtle, marginBottom: 10, lineHeight: 1.5 }}>
                    <strong style={{ color: COLORS.text }}>Law: </strong>{item.rule}
                  </div>
                  <div style={{ fontSize: 12, color: COLORS.subtle, marginBottom: 10, lineHeight: 1.5 }}>
                    <strong style={{ color: item.color }}>Platform: </strong>{item.how}
                  </div>
                  <div style={{ fontSize: 10, color: COLORS.muted, fontStyle: "italic" }}>📌 {item.ref}</div>
                </div>
              ))}
            </div>

            {/* Tech Stack */}
            <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: "24px" }}>
              <div style={{ fontSize: 14, fontWeight: "bold", color: COLORS.text, marginBottom: 16 }}>🛠️ Recommended Tech Stack</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
                {[
                  { layer: "Frontend", tech: "React + PWA (mobile-first)", icon: "⚛️" },
                  { layer: "Backend", tech: "Node.js / Python FastAPI", icon: "⚙️" },
                  { layer: "Database", tech: "PostgreSQL + Redis cache", icon: "🗄️" },
                  { layer: "GST/IRP API", tech: "Cleartax / IRIS IRP / NIC", icon: "🧾" },
                  { layer: "E-Way Bill", tech: "NIC EWB API", icon: "🚛" },
                  { layer: "Notifications", tech: "WhatsApp (WATI/Interakt) + SMS (Textlocal/MSG91) + Email (SendGrid)", icon: "📱" },
                  { layer: "Payments", tech: "Razorpay / PayU / Cashfree", icon: "💳" },
                  { layer: "Auth", tech: "OTP via SMS + GSTIN verification", icon: "🔐" },
                ].map((s, i) => (
                  <div key={i} style={{
                    background: COLORS.surface, border: `1px solid ${COLORS.border}`,
                    borderRadius: 10, padding: "12px 14px"
                  }}>
                    <div style={{ fontSize: 18, marginBottom: 4 }}>{s.icon}</div>
                    <div style={{ fontSize: 11, color: COLORS.accent, letterSpacing: 1, textTransform: "uppercase", marginBottom: 2 }}>{s.layer}</div>
                    <div style={{ fontSize: 12, color: COLORS.subtle }}>{s.tech}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Footer */}
        <div style={{ marginTop: 48, paddingTop: 24, borderTop: `1px solid ${COLORS.border}`, textAlign: "center" }}>
          <div style={{ fontSize: 12, color: COLORS.muted }}>
            BizFlow India Platform Blueprint · Built for Indian SMEs · GST · MSME · Income Tax Compliant
          </div>
          <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 4 }}>
            Research-backed solution addressing ₹22,363 Cr+ in pending MSME delayed payment cases (Samadhaan Portal, July 2025)
          </div>
        </div>
      </div>
    </div>
  );
}
