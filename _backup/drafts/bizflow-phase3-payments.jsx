import { useState, useEffect } from "react";

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

const today = () => new Date().toISOString().slice(0,10);
const fmtN = n => new Intl.NumberFormat("en-IN").format(Math.round(n));
const fmtD = n => new Intl.NumberFormat("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2}).format(n);
const cur = n => "Rs " + fmtD(n);
const daysBetween = (d1, d2) => Math.floor((new Date(d2) - new Date(d1)) / (1000*60*60*24));

// Calculate compound interest: Principal x (1 + rate)^n - Principal
// rate = 3x RBI base rate. Current RBI ~6.5%, so 3x = 19.5% annual = ~1.5% monthly
const compoundInterest = (principal, daysOverdue) => {
  const monthsOverdue = daysOverdue / 30;
  const monthlyRate = 0.015; // 1.5% monthly (19.5% annual = 3x RBI)
  return principal * (Math.pow(1 + monthlyRate, monthsOverdue) - 1);
};

// DEMO DATA
const initPayments = [
  {
    orderId: "ORD-2026-001", invoiceNo: "INV-2026-001", invoiceDate: "2026-04-12",
    buyerId: 1, buyerName: "Sharma Textiles Pvt Ltd", buyerMsme: true,
    amount: 71400, dueDate: "2026-05-27", paid: false, paidDate: null,
    remindersSent: 4, lastReminder: "2026-04-27",
    status: "overdue", // pending|overdue|paid|disputed
  },
  {
    orderId: "ORD-2026-002", invoiceNo: "INV-2026-002", invoiceDate: "2026-04-14",
    buyerId: 2, buyerName: "Gupta Garments", buyerMsme: false,
    amount: 9300, dueDate: "2026-05-29", paid: false, paidDate: null,
    remindersSent: 3, lastReminder: "2026-04-25",
    status: "overdue",
  },
  {
    orderId: "ORD-2026-003", invoiceNo: "INV-2026-003", invoiceDate: "2026-04-10",
    buyerId: 1, buyerName: "Sharma Textiles Pvt Ltd", buyerMsme: true,
    amount: 19200, dueDate: "2026-05-25", paid: false, paidDate: null,
    remindersSent: 4, lastReminder: "2026-04-26",
    status: "overdue",
  },
  {
    orderId: "ORD-2026-004", invoiceNo: "INV-2026-004", invoiceDate: "2026-04-15",
    buyerId: 3, buyerName: "Rajasthan Fabrics LLP", buyerMsme: true,
    amount: 45600, dueDate: "2026-05-30", paid: false, paidDate: null,
    remindersSent: 2, lastReminder: "2026-04-24",
    status: "pending",
  },
];

// PHASE 3 MAIN COMPONENT
export default function PaymentTrackerPhase3() {
  const [payments, setPayments] = useState(initPayments);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [paymentModal, setPaymentModal] = useState(null);
  const [reminderModal, setReminderModal] = useState(null);
  const [samadhaneModal, setSamadhaneModal] = useState(null);
  const [amountPaid, setAmountPaid] = useState("");
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({msg, type});
    setTimeout(() => setToast(null), 4000);
  };

  // Mark invoice as paid
  const markPaid = (invoiceNo) => {
    if (!amountPaid || +amountPaid <= 0) {showToast("Enter valid amount", "error"); return;}
    setPayments(prev => prev.map(p => p.invoiceNo === invoiceNo
      ? {...p, paid: true, paidDate: today()}
      : p));
    showToast("Payment recorded. Invoice marked PAID");
    setPaymentModal(null);
    setAmountPaid("");
  };

  // Send reminder
  const sendReminder = (invoiceNo) => {
    setPayments(prev => prev.map(p => p.invoiceNo === invoiceNo
      ? {...p, remindersSent: p.remindersSent + 1, lastReminder: today()}
      : p));
    showToast("Reminder sent via WhatsApp, SMS & Email");
    setReminderModal(null);
  };

  // Stats
  const totalOverdue = payments.filter(p => p.status === "overdue" && !p.paid).reduce((s,p) => s + p.amount, 0);
  const totalPending = payments.filter(p => p.status === "pending" && !p.paid).reduce((s,p) => s + p.amount, 0);
  const totalOutstanding = totalOverdue + totalPending;
  const overdueCounts = payments.filter(p => !p.paid && p.status === "overdue");
  const msmeOverdue = overdueCounts.filter(p => p.buyerMsme);
  const criticalAlerts = overdueCounts.filter(p => daysBetween(new Date(p.dueDate), new Date(today())) > 45);

  const Alert = ({type, ch}) => {
    const colors = {
      success: {bg: C.green+"15", border: C.green+"44", c: C.greenL, icon: "OK"},
      warn: {bg: C.gold+"15", border: C.gold+"44", c: C.goldL, icon: "!"},
      error: {bg: C.red+"15", border: C.red+"44", c: C.redL, icon: "X"},
    };
    const s = colors[type] || colors.warn;
    return <div style={{background: s.bg, border: `1px solid ${s.border}`, borderRadius: 9,
      padding: "11px 16px", marginBottom: 16, fontSize: 13, color: s.c, display: "flex", gap: 8}}>
      <span style={{fontWeight: 800, fontSize: 14}}>[{s.icon}]</span><span>{ch}</span>
    </div>;
  };

  return (
    <div style={{background: C.bg, minHeight: "100vh", fontFamily: "Outfit, Segoe UI, sans-serif", color: C.ink, padding: "28px 32px"}}>
      <div style={{maxWidth: 1200, margin: "0 auto"}}>

        <h1 style={{fontSize: 26, fontWeight: 800, color: C.ink, margin: "0 0 6px", letterSpacing: -0.5}}>Payment Tracker & Collections</h1>
        <p style={{color: C.mid, fontSize: 13, marginBottom: 24}}>Phase 3: 45-Day Automated Reminders, Section 43B(h) Alerts, MSME Samadhaan Integration</p>

        {toast && <Alert type={toast.type} ch={toast.msg}/>}

        {/* ALERTS SECTION */}
        {criticalAlerts.length > 0 && <Alert type="error" ch={
          `CRITICAL: ${criticalAlerts.length} invoice(s) PAST 45-DAY MSME THRESHOLD. ` +
          `Compound interest accruing at 19.5% p.a. Tax deduction disallowed under Section 43B(h). ` +
          `File Samadhaan complaint NOW.`
        }/>}

        {msmeOverdue.length > 0 && <Alert type="warn" ch={
          `${msmeOverdue.length} MSME invoice(s) overdue. ` +
          `If unpaid beyond day 45, buyer loses expense tax deduction & compound interest applies.`
        }/>}

        {totalOutstanding > 0 && <Alert type="warn" ch={
          `Rs ${fmtD(totalOutstanding)} outstanding across ${payments.filter(p => !p.paid).length} invoices`
        }/>}

        {/* KPI CARDS */}
        <div style={{display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14, marginBottom: 24}}>
          {[
            {label: "Total Outstanding", val: cur(totalOutstanding), icon: "₹", c: C.red},
            {label: "Overdue Amount", val: cur(totalOverdue), icon: "PAST", c: C.redL},
            {label: "Pending (< 45 days)", val: cur(totalPending), icon: "CLOCK", c: C.gold},
            {label: "Past 45-Day Threshold", val: criticalAlerts.length, icon: "SOS", c: C.redL},
            {label: "MSME Protected", val: msmeOverdue.length, icon: "SHIELD", c: C.purple},
          ].map((k, i) => (
            <div key={i} style={{background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px 18px"}}>
              <div style={{fontSize: 10, color: C.faint, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8}}>{k.label}</div>
              <div style={{fontSize: 24, fontWeight: 800, color: k.c}}>{k.val}</div>
            </div>
          ))}
        </div>

        {/* INVOICE TABLE */}
        <div style={{background: C.card, border: `1px solid ${C.border}`, borderRadius: 13, overflow: "hidden", marginBottom: 20}}>
          <div style={{overflowX: "auto"}}>
            <table style={{width: "100%", borderCollapse: "collapse"}}>
              <thead><tr style={{background: C.muted}}>
                <th style={{padding: "10px 12px", textAlign: "left", fontSize: 10, color: C.mid, fontWeight: 700, textTransform: "uppercase"}}>Invoice</th>
                <th style={{padding: "10px 12px", textAlign: "left", fontSize: 10, color: C.mid, fontWeight: 700, textTransform: "uppercase"}}>Buyer</th>
                <th style={{padding: "10px 12px", textAlign: "right", fontSize: 10, color: C.mid, fontWeight: 700, textTransform: "uppercase"}}>Amount</th>
                <th style={{padding: "10px 12px", textAlign: "center", fontSize: 10, color: C.mid, fontWeight: 700, textTransform: "uppercase"}}>Due Date</th>
                <th style={{padding: "10px 12px", textAlign: "center", fontSize: 10, color: C.mid, fontWeight: 700, textTransform: "uppercase"}}>Days Overdue</th>
                <th style={{padding: "10px 12px", textAlign: "center", fontSize: 10, color: C.mid, fontWeight: 700, textTransform: "uppercase"}}>Interest Accrued</th>
                <th style={{padding: "10px 12px", textAlign: "center", fontSize: 10, color: C.mid, fontWeight: 700, textTransform: "uppercase"}}>Status</th>
                <th style={{padding: "10px 12px", textAlign: "center", fontSize: 10, color: C.mid, fontWeight: 700, textTransform: "uppercase"}}>Actions</th>
              </tr></thead>
              <tbody>
                {payments.map((p, idx) => {
                  const daysOD = daysBetween(new Date(p.dueDate), new Date(today()));
                  const interest = p.status === "overdue" ? compoundInterest(p.amount, daysOD) : 0;
                  const isPastThreshold = daysOD > 45;
                  return (
                    <tr key={p.invoiceNo} style={{borderBottom: `1px solid ${C.line}`, background: idx % 2 === 0 ? "transparent" : C.raised}}>
                      <td style={{padding: "10px 12px", fontSize: 12, fontFamily: "monospace", color: C.brandHov, fontWeight: 700}}>{p.invoiceNo}</td>
                      <td style={{padding: "10px 12px", fontSize: 13, color: C.ink, fontWeight: 600}}>
                        {p.buyerName}
                        {p.buyerMsme && <span style={{fontSize: 11, color: C.green, marginLeft: 6}}>MSME</span>}
                      </td>
                      <td style={{padding: "10px 12px", fontSize: 13, textAlign: "right", color: C.text, fontWeight: 700}}>{cur(p.amount)}</td>
                      <td style={{padding: "10px 12px", fontSize: 12, textAlign: "center", color: p.status === "overdue" ? C.redL : C.mid}}>{p.dueDate}</td>
                      <td style={{padding: "10px 12px", fontSize: 12, textAlign: "center", color: isPastThreshold ? C.red : daysOD > 30 ? C.goldL : C.green, fontWeight: 700}}>
                        {p.paid ? "-" : daysOD <= 0 ? "Due today" : daysOD > 0 ? daysOD + "d" : "Not yet due"}
                      </td>
                      <td style={{padding: "10px 12px", fontSize: 12, textAlign: "center", color: interest > 0 ? C.redL : C.mid, fontWeight: 700}}>
                        {interest > 0 ? cur(interest) : "-"}
                      </td>
                      <td style={{padding: "10px 12px", fontSize: 11, textAlign: "center"}}>
                        <span style={{padding: "3px 8px", borderRadius: 16, background: p.paid ? C.green+"22" : p.status === "overdue" ? C.red+"22" : C.gold+"22",
                          color: p.paid ? C.greenL : p.status === "overdue" ? C.redL : C.goldL, fontWeight: 700, whiteSpace: "nowrap"}}>
                          {p.paid ? "PAID" : isPastThreshold ? "CRITICAL" : p.status === "overdue" ? "OVERDUE" : "PENDING"}
                        </span>
                      </td>
                      <td style={{padding: "10px 12px", fontSize: 11, textAlign: "center"}}>
                        <div style={{display: "flex", gap: 5, justifyContent: "center"}}>
                          {!p.paid && <button onClick={() => setPaymentModal(p.invoiceNo)} style={{padding: "5px 10px", borderRadius: 6, border: "none", cursor: "pointer", background: C.green, color: "#fff", fontSize: 11, fontWeight: 700}}>Mark Paid</button>}
                          {!p.paid && <button onClick={() => setReminderModal(p.invoiceNo)} style={{padding: "5px 10px", borderRadius: 6, border: `1px solid ${C.gold}`, cursor: "pointer", background: "transparent", color: C.goldL, fontSize: 11, fontWeight: 700}}>Remind</button>}
                          {p.buyerMsme && !p.paid && isPastThreshold && <button onClick={() => setSamadhaneModal(p)} style={{padding: "5px 10px", borderRadius: 6, border: `1px solid ${C.red}`, cursor: "pointer", background: "transparent", color: C.redL, fontSize: 11, fontWeight: 700}}>Samadhaan</button>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* REMINDER SCHEDULE GUIDE */}
        <div style={{background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, marginBottom: 20}}>
          <div style={{fontSize: 14, fontWeight: 700, color: C.ink, marginBottom: 14}}>45-Day Automated Reminder Timeline</div>
          <div style={{display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12}}>
            {[
              {day: "Day 0", event: "Invoice Raised", ch: "Email + WhatsApp"},
              {day: "Day 7", event: "Reminder #1", ch: "Friendly message"},
              {day: "Day 15", event: "Reminder #2", ch: "Email with invoice copy"},
              {day: "Day 30", event: "Reminder #3 - URGENT", ch: "15 days left before tax impact"},
              {day: "Day 44", event: "CRITICAL: 43B(h) WARNING", ch: "Tax deduction at risk"},
              {day: "Day 45", event: "LEGAL THRESHOLD", ch: "Compound interest starts, Samadhaan eligible"},
            ].map((t, i) => (
              <div key={i} style={{background: C.raised, border: `1px solid ${C.border}`, borderRadius: 8, padding: 12}}>
                <div style={{fontSize: 11, fontWeight: 700, color: i >= 4 ? C.redL : C.gold, textTransform: "uppercase", marginBottom: 4}}>{t.day}</div>
                <div style={{fontSize: 13, fontWeight: 700, color: C.ink}}>{t.event}</div>
                <div style={{fontSize: 12, color: C.mid, marginTop: 3}}>{t.ch}</div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 43B(h) EXPLAINER */}
        <div style={{background: C.purple+"15", border: `1px solid ${C.purple}44`, borderRadius: 12, padding: 18, marginBottom: 20}}>
          <div style={{fontSize: 14, fontWeight: 700, color: C.purple, marginBottom: 10}}>Section 43B(h) - Income Tax Act (FY 2024-25)</div>
          <div style={{fontSize: 13, color: C.mid, lineHeight: 1.6}}>
            If a buyer does NOT pay this MSME invoice within 45 days from invoice date, the buyer LOSES the ability to claim this expense as a tax deduction.
            <br/>This directly INCREASES the buyer's taxable income. Most businesses don't know this—it's a powerful collection lever.
            <br/>Our system warns the buyer on Day 44 of the exact amount of their deduction at risk.
          </div>
        </div>

        {/* COMPOUND INTEREST EXPLAINER */}
        <div style={{background: C.red+"15", border: `1px solid ${C.red}44`, borderRadius: 12, padding: 18}}>
          <div style={{fontSize: 14, fontWeight: 700, color: C.redL, marginBottom: 10}}>Compound Interest Calculation (Post Day 45)</div>
          <div style={{fontSize: 13, color: C.mid, lineHeight: 1.6}}>
            Once an MSME invoice is unpaid beyond 45 days, compound interest accrues at 3x the RBI bank rate (currently ~19.5% p.a. or 1.5% monthly).
            <br/>Example: Rs 100,000 unpaid for 60 days = Rs 100,000 x 1.015^2 = Rs 103,023 = Rs 3,023 interest accrued.
            <br/>This is enforceable in court. The system auto-calculates and displays this amount daily on overdue invoices.
          </div>
        </div>
      </div>

      {/* MODALS */}
      {paymentModal && (
        <Modal title="Record Payment" sub={`Invoice: ${paymentModal}`} onClose={() => {setPaymentModal(null); setAmountPaid("");}}>
          <div style={{display: "flex", flexDirection: "column", gap: 14}}>
            <div>
              <label style={{fontSize: 10, color: C.mid, letterSpacing: 1, textTransform: "uppercase", fontWeight: 700, display: "block", marginBottom: 6}}>Amount Paid (Rs)</label>
              <input value={amountPaid} onChange={e => setAmountPaid(e.target.value)} type="number" placeholder="0.00"
                style={{width: "100%", border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px", background: C.surface, color: C.ink, fontSize: 13, outline: "none"}}/>
            </div>
            <div>
              <label style={{fontSize: 10, color: C.mid, letterSpacing: 1, textTransform: "uppercase", fontWeight: 700, display: "block", marginBottom: 6}}>Payment Method</label>
              <select style={{width: "100%", border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px", background: C.surface, color: C.ink, fontSize: 13, outline: "none"}}>
                <option>UPI</option><option>NEFT</option><option>RTGS</option><option>Cheque</option><option>Cash</option>
              </select>
            </div>
            <div style={{background: C.green+"11", border: `1px solid ${C.green}33`, borderRadius: 8, padding: "10px 12px", fontSize: 12, color: C.greenL}}>
              Payment receipt will be auto-generated and sent to buyer via Email + WhatsApp
            </div>
            <div style={{display: "flex", gap: 8, justifyContent: "flex-end"}}>
              <button onClick={() => {setPaymentModal(null); setAmountPaid("");}} style={{padding: "9px 18px", borderRadius: 7, border: `1px solid ${C.border}`, background: "transparent", color: C.mid, cursor: "pointer", fontSize: 13, fontWeight: 700}}>Cancel</button>
              <button onClick={() => markPaid(paymentModal)} style={{padding: "9px 18px", borderRadius: 7, border: "none", background: C.green, color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700}}>Record Payment</button>
            </div>
          </div>
        </Modal>
      )}

      {reminderModal && (
        <Modal title="Send Payment Reminder" sub={`Invoice: ${reminderModal}`} onClose={() => setReminderModal(null)}>
          <div style={{display: "flex", flexDirection: "column", gap: 14}}>
            <Alert type="warn" ch="Reminder will be sent via WhatsApp, SMS and Email"/>
            <div style={{background: C.raised, border: `1px solid ${C.border}`, borderRadius: 8, padding: 12}}>
              <div style={{fontSize: 12, color: C.mid, marginBottom: 8}}>Reminder message template:</div>
              <div style={{fontSize: 13, color: C.mid, padding: 8, background: C.surface, borderRadius: 6}}>
                "Hi, we wanted to follow up on invoice {invoiceNo} due {dueDate}. Payment of Rs {amount} is still pending. Please arrange payment at your earliest. Thank you!"
              </div>
            </div>
            <div style={{display: "flex", gap: 8, justifyContent: "flex-end"}}>
              <button onClick={() => setReminderModal(null)} style={{padding: "9px 18px", borderRadius: 7, border: `1px solid ${C.border}`, background: "transparent", color: C.mid, cursor: "pointer", fontSize: 13, fontWeight: 700}}>Cancel</button>
              <button onClick={() => sendReminder(reminderModal)} style={{padding: "9px 18px", borderRadius: 7, border: "none", background: C.gold, color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700}}>Send Reminder</button>
            </div>
          </div>
        </Modal>
      )}

      {samadhaneModal && (
        <Modal title="File MSME Samadhaan Complaint" sub={`Invoice: ${samadhaneModal.invoiceNo}`} onClose={() => setSamadhaneModal(null)} wide>
          <div style={{display: "flex", flexDirection: "column", gap: 14}}>
            <Alert type="error" ch="This invoice has exceeded the 45-day MSME payment threshold. Filing a complaint on the Samadhaan portal is now recommended."/>
            <div style={{background: C.raised, border: `1px solid ${C.border}`, borderRadius: 8, padding: 14}}>
              <div style={{fontSize: 12, fontWeight: 700, color: C.ink, marginBottom: 10}}>Complaint Summary</div>
              {[
                ["Invoice Number", samadhaneModal.invoiceNo],
                ["Buyer Name", samadhaneModal.buyerName],
                ["Invoice Amount", cur(samadhaneModal.amount)],
                ["Invoice Date", samadhaneModal.invoiceDate],
                ["Due Date", samadhaneModal.dueDate],
                ["Days Overdue", daysBetween(new Date(samadhaneModal.dueDate), new Date(today())) + " days"],
                ["Compound Interest Accrued", cur(compoundInterest(samadhaneModal.amount, daysBetween(new Date(samadhaneModal.dueDate), new Date(today()))))],
                ["Total Claim Amount", cur(samadhaneModal.amount + compoundInterest(samadhaneModal.amount, daysBetween(new Date(samadhaneModal.dueDate), new Date(today()))))],
              ].map(([k,v], i) => (
                <div key={i} style={{display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: i < 7 ? `1px solid ${C.line}` : "none", fontSize: 12}}>
                  <span style={{color: C.mid}}>{k}</span>
                  <strong style={{color: C.ink}}>{v}</strong>
                </div>
              ))}
            </div>
            <div style={{background: C.brand+"11", border: `1px solid ${C.brand}33`, borderRadius: 8, padding: "10px 12px", fontSize: 12, color: C.brand}}>
              Next: You'll be redirected to samadhaan.msme.gov.in with all fields pre-filled. Verification may take 3-5 business days.
            </div>
            <div style={{display: "flex", gap: 8, justifyContent: "flex-end"}}>
              <button onClick={() => setSamadhaneModal(null)} style={{padding: "9px 18px", borderRadius: 7, border: `1px solid ${C.border}`, background: "transparent", color: C.mid, cursor: "pointer", fontSize: 13, fontWeight: 700}}>Cancel</button>
              <button onClick={() => {
                window.open("https://samadhaan.msme.gov.in", "_blank");
                setSamadhaneModal(null);
              }} style={{padding: "9px 18px", borderRadius: 7, border: "none", background: C.red, color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700}}>File on Samadhaan Portal</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

const Modal = ({title, sub, onClose, children, wide}) => (
  <div style={{position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 2000,
    display: "flex", alignItems: "center", justifyContent: "center", padding: 16}}>
    <div style={{background: C.card, border: `1px solid ${C.border}`, borderRadius: 16,
      width: "100%", maxWidth: wide ? 820 : 520, maxHeight: "92vh", overflowY: "auto",
      boxShadow: "0 40px 120px rgba(0,0,0,0.8)"}}>
      <div style={{display: "flex", justifyContent: "space-between", alignItems: "flex-start",
        padding: "20px 24px 16px", borderBottom: `1px solid ${C.border}`}}>
        <div>
          <div style={{fontSize: 17, fontWeight: 800, color: C.ink}}>{title}</div>
          {sub && <div style={{fontSize: 12, color: C.mid, marginTop: 3}}>{sub}</div>}
        </div>
        <button onClick={onClose} style={{background: "none", border: "none", cursor: "pointer",
          color: C.mid, fontSize: 20, lineHeight: 1, padding: 4}}>x</button>
      </div>
      <div style={{padding: "20px 24px"}}>{children}</div>
    </div>
  </div>
);
