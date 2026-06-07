import { useState } from "react";

const C = {
  bg: "#07090F", surface: "#0D1117", card: "#111827", raised: "#161F30",
  border: "#1E2D3D", muted: "#243447",
  brand: "#1D4ED8", brandHov: "#2563EB", accent: "#EA580C",
  green: "#059669", greenL: "#10B981",
  red: "#DC2626", redL: "#EF4444",
  gold: "#D97706", goldL: "#F59E0B",
  ink: "#F1F5F9", mid: "#94A3B8", faint: "#475569", line: "#1E2D3D",
};

const fmtD = n => new Intl.NumberFormat("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2}).format(n);
const cur = n => "Rs " + fmtD(n);
const today = () => new Date().toISOString().slice(0,10);

// Generate UPI deep link: upi://pay?pa=UPI_ID&pn=NAME&am=AMOUNT&tn=DESCRIPTION
const generateUPILink = (upiId, name, amount, description) => {
  return `upi://pay?pa=${upiId}&pn=${encodeURIComponent(name)}&am=${amount}&tn=${encodeURIComponent(description)}`;
};

// Generate QR Code data URL (using qr-server API)
const generateQRCode = (upiLink) => {
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(upiLink)}`;
};

// DEMO DATA
const initBankAccounts = [
  {
    id: 1, accountName: "Primary - HDFC", bankName: "HDFC Bank", accountNo: "****1234",
    ifsc: "HDFC0001234", upiId: "bizflow@hdfc", ownerName: "BizFlow India", active: true, default: true
  },
  {
    id: 2, accountName: "Secondary - ICICI", bankName: "ICICI Bank", accountNo: "****5678",
    ifsc: "ICIC0005678", upiId: "bizflow@icici", ownerName: "BizFlow India", active: true, default: false
  },
];

const initPayments = [
  {
    id: "PAY-2026-001", invoiceNo: "INV-2026-001", amount: 71400, buyerName: "Sharma Textiles",
    dueDate: "2026-05-27", status: "pending", type: "online", // online|offline_pending|offline_approved|offline_rejected
    paymentDate: null, utrNo: null, notes: "", createdBy: "System", approvedBy: null, approvalDate: null
  },
  {
    id: "PAY-2026-002", invoiceNo: "INV-2026-002", amount: 9300, buyerName: "Gupta Garments",
    dueDate: "2026-05-29", status: "pending", type: "online",
    paymentDate: null, utrNo: null, notes: "", createdBy: "System", approvedBy: null, approvalDate: null
  },
  {
    id: "PAY-2026-003", invoiceNo: "INV-2026-003", amount: 19200, buyerName: "Sharma Textiles",
    dueDate: "2026-05-25", status: "offline_pending", type: "offline",
    paymentDate: "2026-04-26", utrNo: "HDFC20260426001", notes: "Cheque #1001 deposited", createdBy: "Admin", approvedBy: null, approvalDate: null
  },
];

// MAIN APP
export default function PaymentGateway() {
  const [banks, setBanks] = useState(initBankAccounts);
  const [payments, setPayments] = useState(initPayments);
  const [page, setPage] = useState("invoices"); // invoices | banksetup | offlinepayments
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [bankModal, setBankModal] = useState(null);
  const [offlineModal, setOfflineModal] = useState(null);
  const [newBank, setNewBank] = useState({ accountName: "", upiId: "", accountNo: "", ifsc: "", ownerName: "" });
  const [offlineForm, setOfflineForm] = useState({ paymentDate: "", utrNo: "", notes: "", amount: "" });
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({msg, type});
    setTimeout(() => setToast(null), 3000);
  };

  const defaultBank = banks.find(b => b.default && b.active);

  // Add bank account
  const addBank = () => {
    if (!newBank.accountName || !newBank.upiId) {showToast("Fill required fields", "error"); return;}
    setBanks(b => [...b, {...newBank, id: Math.max(...b.map(x=>x.id),0)+1, active: true, default: false}]);
    showToast("Bank account added");
    setBankModal(null);
    setNewBank({ accountName: "", upiId: "", accountNo: "", ifsc: "", ownerName: "" });
  };

  // Toggle default bank
  const setDefaultBank = (id) => {
    setBanks(b => b.map(x => ({...x, default: x.id === id})));
  };

  // Record offline payment
  const recordOfflinePayment = (invoiceNo) => {
    if (!offlineForm.paymentDate || !offlineForm.utrNo || !offlineForm.amount) {
      showToast("Fill all fields", "error"); return;
    }
    setPayments(p => p.map(x => x.invoiceNo === invoiceNo
      ? {...x, status: "offline_pending", paymentDate: offlineForm.paymentDate, utrNo: offlineForm.utrNo, notes: offlineForm.notes, type: "offline"}
      : x));
    showToast("Offline payment recorded - pending approval");
    setOfflineModal(null);
    setOfflineForm({ paymentDate: "", utrNo: "", notes: "", amount: "" });
  };

  // Approve/Reject offline payment
  const approveOfflinePayment = (id, approved) => {
    setPayments(p => p.map(x => x.id === id
      ? {...x, status: approved ? "offline_approved" : "offline_rejected", approvedBy: "Admin", approvalDate: today()}
      : x));
    showToast(approved ? "Payment approved" : "Payment rejected");
  };

  const Alert = ({type, ch}) => {
    const colors = {
      success: {bg: C.green+"15", border: C.green+"44", c: C.greenL},
      warn: {bg: C.gold+"15", border: C.gold+"44", c: C.goldL},
      error: {bg: C.red+"15", border: C.red+"44", c: C.redL},
    };
    const s = colors[type] || colors.warn;
    return <div style={{background: s.bg, border: `1px solid ${s.border}`, borderRadius: 9,
      padding: "11px 16px", marginBottom: 16, fontSize: 13, color: s.c}}>{ch}</div>;
  };

  return (
    <div style={{background: C.bg, minHeight: "100vh", fontFamily: "Outfit, Segoe UI, sans-serif", color: C.ink, padding: "28px 32px"}}>
      <div style={{maxWidth: 1200, margin: "0 auto"}}>

        <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24}}>
          <div>
            <h1 style={{fontSize: 26, fontWeight: 800, color: C.ink, margin: 0, letterSpacing: -0.5}}>Payment Gateway</h1>
            <p style={{color: C.mid, fontSize: 13, marginTop: 4}}>UPI Deep Links + Bank Setup + Offline Payment Reconciliation</p>
          </div>
        </div>

        {/* TABS */}
        <div style={{display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap"}}>
          {[
            {key: "invoices", label: "Send Payment Links", icon: "📤"},
            {key: "banksetup", label: "Bank Setup", icon: "🏦"},
            {key: "offlinepayments", label: "Offline Payments", icon: "📋"},
          ].map(t => (
            <button key={t.key} onClick={() => setPage(t.key)} style={{
              padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer",
              background: page === t.key ? C.brand : C.raised,
              color: page === t.key ? "#fff" : C.mid,
              fontSize: 13, fontWeight: 700, fontFamily: "inherit"
            }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {toast && <Alert type={toast.type} ch={toast.msg}/>}

        {/* PAGE 1: INVOICES - SEND PAYMENT LINKS */}
        {page === "invoices" && (
          <div>
            {!defaultBank && <Alert type="error" ch="No default bank account set. Go to Bank Setup first."/>}

            <div style={{background: C.card, border: `1px solid ${C.border}`, borderRadius: 13, overflow: "hidden"}}>
              <div style={{overflowX: "auto"}}>
                <table style={{width: "100%", borderCollapse: "collapse"}}>
                  <thead><tr style={{background: C.muted}}>
                    <th style={{padding: "10px 12px", textAlign: "left", fontSize: 10, color: C.mid, fontWeight: 700, textTransform: "uppercase"}}>Invoice</th>
                    <th style={{padding: "10px 12px", textAlign: "left", fontSize: 10, color: C.mid, fontWeight: 700, textTransform: "uppercase"}}>Buyer</th>
                    <th style={{padding: "10px 12px", textAlign: "right", fontSize: 10, color: C.mid, fontWeight: 700, textTransform: "uppercase"}}>Amount</th>
                    <th style={{padding: "10px 12px", textAlign: "center", fontSize: 10, color: C.mid, fontWeight: 700, textTransform: "uppercase"}}>Status</th>
                    <th style={{padding: "10px 12px", textAlign: "center", fontSize: 10, color: C.mid, fontWeight: 700, textTransform: "uppercase"}}>Actions</th>
                  </tr></thead>
                  <tbody>
                    {payments.map((p, idx) => (
                      <tr key={p.id} style={{borderBottom: `1px solid ${C.line}`, background: idx % 2 === 0 ? "transparent" : C.raised}}>
                        <td style={{padding: "10px 12px", fontSize: 12, fontFamily: "monospace", color: C.brandHov, fontWeight: 700}}>{p.invoiceNo}</td>
                        <td style={{padding: "10px 12px", fontSize: 13, color: C.ink}}>{p.buyerName}</td>
                        <td style={{padding: "10px 12px", fontSize: 13, textAlign: "right", fontWeight: 700, color: C.ink}}>{cur(p.amount)}</td>
                        <td style={{padding: "10px 12px", fontSize: 11, textAlign: "center"}}>
                          <span style={{padding: "3px 8px", borderRadius: 12, background: p.status === "pending" ? C.gold+"22" : C.green+"22",
                            color: p.status === "pending" ? C.goldL : C.greenL, fontWeight: 700}}>
                            {p.status === "pending" ? "Pending" : "Paid"}
                          </span>
                        </td>
                        <td style={{padding: "10px 12px", textAlign: "center"}}>
                          {p.status === "pending" && (
                            <button onClick={() => setSelectedInvoice(p.invoiceNo)} style={{
                              padding: "6px 12px", borderRadius: 6, border: "none", background: C.brand, color: "#fff",
                              cursor: "pointer", fontSize: 12, fontWeight: 700
                            }}>Generate Link</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* PAYMENT LINK DISPLAY */}
            {selectedInvoice && (
              <PaymentLinkGenerator invoice={payments.find(p => p.invoiceNo === selectedInvoice)} bank={defaultBank} onClose={() => setSelectedInvoice(null)}/>
            )}
          </div>
        )}

        {/* PAGE 2: BANK SETUP */}
        {page === "banksetup" && (
          <div>
            <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20}}>
              <h2 style={{fontSize: 18, fontWeight: 700, color: C.ink, margin: 0}}>Linked Bank Accounts</h2>
              <button onClick={() => setBankModal(true)} style={{
                padding: "8px 16px", borderRadius: 7, border: "none", background: C.brand, color: "#fff",
                cursor: "pointer", fontSize: 13, fontWeight: 700
              }}>+ Add Bank Account</button>
            </div>

            <div style={{display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: 16}}>
              {banks.map(b => (
                <div key={b.id} style={{background: C.card, border: b.default ? `2px solid ${C.brand}` : `1px solid ${C.border}`, borderRadius: 12, padding: 18}}>
                  <div style={{display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12}}>
                    <div>
                      <div style={{fontSize: 14, fontWeight: 800, color: C.ink}}>{b.accountName}</div>
                      <div style={{fontSize: 11, color: C.mid, marginTop: 2}}>{b.bankName}</div>
                    </div>
                    {b.default && <span style={{fontSize: 10, background: C.brand+"33", color: C.brand, padding: "3px 8px", borderRadius: 12, fontWeight: 700}}>DEFAULT</span>}
                  </div>

                  <div style={{background: C.raised, borderRadius: 8, padding: 10, marginBottom: 12}}>
                    <div style={{fontSize: 10, color: C.faint, marginBottom: 3}}>UPI ID</div>
                    <div style={{fontSize: 13, fontFamily: "monospace", color: C.brandHov, fontWeight: 700}}>{b.upiId}</div>
                  </div>

                  <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12}}>
                    <div>
                      <div style={{fontSize: 10, color: C.faint}}>Account</div>
                      <div style={{fontSize: 11, color: C.mid, fontFamily: "monospace"}}>{b.accountNo}</div>
                    </div>
                    <div>
                      <div style={{fontSize: 10, color: C.faint}}>IFSC</div>
                      <div style={{fontSize: 11, color: C.mid, fontFamily: "monospace"}}>{b.ifsc}</div>
                    </div>
                  </div>

                  {!b.default && (
                    <button onClick={() => setDefaultBank(b.id)} style={{
                      width: "100%", padding: "8px 12px", borderRadius: 6, border: `1px solid ${C.border}`,
                      background: "transparent", color: C.mid, cursor: "pointer", fontSize: 12, fontWeight: 700
                    }}>Set as Default</button>
                  )}
                </div>
              ))}
            </div>

            {/* ADD BANK MODAL */}
            {bankModal && (
              <Modal title="Add Bank Account for UPI" onClose={() => {setBankModal(false); setNewBank({ accountName: "", upiId: "", accountNo: "", ifsc: "", ownerName: "" });}}>
                <div style={{display: "flex", flexDirection: "column", gap: 14}}>
                  <div>
                    <label style={{fontSize: 10, color: C.mid, letterSpacing: 1, textTransform: "uppercase", fontWeight: 700, display: "block", marginBottom: 6}}>Account Name (e.g., Primary HDFC)</label>
                    <input value={newBank.accountName} onChange={e => setNewBank(n => ({...n, accountName: e.target.value}))} placeholder="Descriptive name"
                      style={{width: "100%", border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px", background: C.surface, color: C.ink, fontSize: 13, outline: "none"}}/>
                  </div>
                  <div>
                    <label style={{fontSize: 10, color: C.mid, letterSpacing: 1, textTransform: "uppercase", fontWeight: 700, display: "block", marginBottom: 6}}>UPI ID (e.g., bizflow@hdfc)</label>
                    <input value={newBank.upiId} onChange={e => setNewBank(n => ({...n, upiId: e.target.value}))} placeholder="upiid@bank"
                      style={{width: "100%", border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px", background: C.surface, color: C.ink, fontSize: 13, outline: "none"}}/>
                  </div>
                  <div>
                    <label style={{fontSize: 10, color: C.mid, letterSpacing: 1, textTransform: "uppercase", fontWeight: 700, display: "block", marginBottom: 6}}>Account Number (last 4 digits only)</label>
                    <input value={newBank.accountNo} onChange={e => setNewBank(n => ({...n, accountNo: e.target.value}))} placeholder="****1234"
                      style={{width: "100%", border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px", background: C.surface, color: C.ink, fontSize: 13, outline: "none"}}/>
                  </div>
                  <div>
                    <label style={{fontSize: 10, color: C.mid, letterSpacing: 1, textTransform: "uppercase", fontWeight: 700, display: "block", marginBottom: 6}}>IFSC Code</label>
                    <input value={newBank.ifsc} onChange={e => setNewBank(n => ({...n, ifsc: e.target.value}))} placeholder="HDFC0001234"
                      style={{width: "100%", border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px", background: C.surface, color: C.ink, fontSize: 13, outline: "none"}}/>
                  </div>
                  <div>
                    <label style={{fontSize: 10, color: C.mid, letterSpacing: 1, textTransform: "uppercase", fontWeight: 700, display: "block", marginBottom: 6}}>Account Owner Name</label>
                    <input value={newBank.ownerName} onChange={e => setNewBank(n => ({...n, ownerName: e.target.value}))} placeholder="BizFlow India"
                      style={{width: "100%", border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px", background: C.surface, color: C.ink, fontSize: 13, outline: "none"}}/>
                  </div>
                  <div style={{background: C.brand+"11", border: `1px solid ${C.brand}33`, borderRadius: 8, padding: "10px 12px", fontSize: 12, color: C.brand}}>
                    UPI Deep Links will be generated using this account's UPI ID. Payments will arrive at this account.
                  </div>
                  <div style={{display: "flex", gap: 8, justifyContent: "flex-end"}}>
                    <button onClick={() => {setBankModal(false); setNewBank({ accountName: "", upiId: "", accountNo: "", ifsc: "", ownerName: "" });}} style={{
                      padding: "9px 18px", borderRadius: 7, border: `1px solid ${C.border}`, background: "transparent", color: C.mid, cursor: "pointer", fontSize: 13, fontWeight: 700
                    }}>Cancel</button>
                    <button onClick={addBank} style={{
                      padding: "9px 18px", borderRadius: 7, border: "none", background: C.brand, color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700
                    }}>Add Account</button>
                  </div>
                </div>
              </Modal>
            )}
          </div>
        )}

        {/* PAGE 3: OFFLINE PAYMENTS */}
        {page === "offlinepayments" && (
          <div>
            <Alert type="warn" ch="Offline payments (cheque, bank transfer, cash) must be recorded here and approved by Accounts team via bank statement reconciliation."/>

            <div style={{background: C.card, border: `1px solid ${C.border}`, borderRadius: 13, overflow: "hidden", marginTop: 16}}>
              <div style={{overflowX: "auto"}}>
                <table style={{width: "100%", borderCollapse: "collapse"}}>
                  <thead><tr style={{background: C.muted}}>
                    <th style={{padding: "10px 12px", textAlign: "left", fontSize: 10, color: C.mid, fontWeight: 700, textTransform: "uppercase"}}>Invoice</th>
                    <th style={{padding: "10px 12px", textAlign: "left", fontSize: 10, color: C.mid, fontWeight: 700, textTransform: "uppercase"}}>Amount</th>
                    <th style={{padding: "10px 12px", textAlign: "center", fontSize: 10, color: C.mid, fontWeight: 700, textTransform: "uppercase"}}>Payment Date</th>
                    <th style={{padding: "10px 12px", textAlign: "left", fontSize: 10, color: C.mid, fontWeight: 700, textTransform: "uppercase"}}>UTR/Ref</th>
                    <th style={{padding: "10px 12px", textAlign: "center", fontSize: 10, color: C.mid, fontWeight: 700, textTransform: "uppercase"}}>Status</th>
                    <th style={{padding: "10px 12px", textAlign: "center", fontSize: 10, color: C.mid, fontWeight: 700, textTransform: "uppercase"}}>Actions</th>
                  </tr></thead>
                  <tbody>
                    {payments.filter(p => p.type === "offline").map((p, idx) => (
                      <tr key={p.id} style={{borderBottom: `1px solid ${C.line}`, background: idx % 2 === 0 ? "transparent" : C.raised}}>
                        <td style={{padding: "10px 12px", fontSize: 12, fontFamily: "monospace", color: C.brandHov, fontWeight: 700}}>{p.invoiceNo}</td>
                        <td style={{padding: "10px 12px", fontSize: 13, fontWeight: 700, color: C.ink}}>{cur(p.amount)}</td>
                        <td style={{padding: "10px 12px", fontSize: 12, textAlign: "center", color: C.mid}}>{p.paymentDate}</td>
                        <td style={{padding: "10px 12px", fontSize: 12, fontFamily: "monospace", color: C.mid}}>{p.utrNo}</td>
                        <td style={{padding: "10px 12px", fontSize: 11, textAlign: "center"}}>
                          <span style={{padding: "3px 8px", borderRadius: 12, background: p.status === "offline_pending" ? C.gold+"22" : p.status === "offline_approved" ? C.green+"22" : C.red+"22",
                            color: p.status === "offline_pending" ? C.goldL : p.status === "offline_approved" ? C.greenL : C.redL, fontWeight: 700}}>
                            {p.status === "offline_pending" ? "Pending Approval" : p.status === "offline_approved" ? "Approved" : "Rejected"}
                          </span>
                        </td>
                        <td style={{padding: "10px 12px", textAlign: "center"}}>
                          {p.status === "offline_pending" && (
                            <div style={{display: "flex", gap: 5, justifyContent: "center"}}>
                              <button onClick={() => approveOfflinePayment(p.id, true)} style={{padding: "5px 10px", borderRadius: 6, border: "none", background: C.green, color: "#fff", cursor: "pointer", fontSize: 11, fontWeight: 700}}>Approve</button>
                              <button onClick={() => approveOfflinePayment(p.id, false)} style={{padding: "5px 10px", borderRadius: 6, border: "none", background: C.red, color: "#fff", cursor: "pointer", fontSize: 11, fontWeight: 700}}>Reject</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                    {payments.filter(p => p.type === "offline").length === 0 && (
                      <tr><td colSpan={6} style={{padding: 32, textAlign: "center", color: C.mid}}>No offline payments recorded</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{display: "flex", justifyContent: "flex-end", marginTop: 16}}>
              <button onClick={() => {
                const pending = payments.find(p => p.type === "online" && p.status === "pending");
                if (pending) setOfflineModal(pending.invoiceNo);
              }} style={{
                padding: "9px 18px", borderRadius: 7, border: "none", background: C.accent, color: "#fff",
                cursor: "pointer", fontSize: 13, fontWeight: 700
              }}>+ Record Offline Payment</button>
            </div>

            {/* OFFLINE PAYMENT FORM */}
            {offlineModal && (
              <Modal title="Record Offline Payment" sub={`Invoice: ${offlineModal}`} onClose={() => setOfflineModal(null)}>
                <div style={{display: "flex", flexDirection: "column", gap: 14}}>
                  <div>
                    <label style={{fontSize: 10, color: C.mid, letterSpacing: 1, textTransform: "uppercase", fontWeight: 700, display: "block", marginBottom: 6}}>Payment Date</label>
                    <input type="date" value={offlineForm.paymentDate} onChange={e => setOfflineForm(f => ({...f, paymentDate: e.target.value}))}
                      style={{width: "100%", border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px", background: C.surface, color: C.ink, fontSize: 13, outline: "none"}}/>
                  </div>
                  <div>
                    <label style={{fontSize: 10, color: C.mid, letterSpacing: 1, textTransform: "uppercase", fontWeight: 700, display: "block", marginBottom: 6}}>UTR / Cheque / Reference Number</label>
                    <input placeholder="e.g., HDFC20260426001 or Cheque #1001" value={offlineForm.utrNo} onChange={e => setOfflineForm(f => ({...f, utrNo: e.target.value}))}
                      style={{width: "100%", border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px", background: C.surface, color: C.ink, fontSize: 13, outline: "none"}}/>
                  </div>
                  <div>
                    <label style={{fontSize: 10, color: C.mid, letterSpacing: 1, textTransform: "uppercase", fontWeight: 700, display: "block", marginBottom: 6}}>Amount</label>
                    <input type="number" placeholder="0.00" value={offlineForm.amount} onChange={e => setOfflineForm(f => ({...f, amount: e.target.value}))}
                      style={{width: "100%", border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px", background: C.surface, color: C.ink, fontSize: 13, outline: "none"}}/>
                  </div>
                  <div>
                    <label style={{fontSize: 10, color: C.mid, letterSpacing: 1, textTransform: "uppercase", fontWeight: 700, display: "block", marginBottom: 6}}>Notes (Method, Bank, etc.)</label>
                    <input placeholder="e.g., Cheque deposited, Wire transfer from ICICI" value={offlineForm.notes} onChange={e => setOfflineForm(f => ({...f, notes: e.target.value}))}
                      style={{width: "100%", border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px", background: C.surface, color: C.ink, fontSize: 13, outline: "none"}}/>
                  </div>
                  <Alert type="warn" ch="This payment will be marked as PENDING APPROVAL. Accounts team will verify against bank statement before approving."/>
                  <div style={{display: "flex", gap: 8, justifyContent: "flex-end"}}>
                    <button onClick={() => setOfflineModal(null)} style={{
                      padding: "9px 18px", borderRadius: 7, border: `1px solid ${C.border}`, background: "transparent", color: C.mid, cursor: "pointer", fontSize: 13, fontWeight: 700
                    }}>Cancel</button>
                    <button onClick={() => recordOfflinePayment(offlineModal)} style={{
                      padding: "9px 18px", borderRadius: 7, border: "none", background: C.accent, color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700
                    }}>Record Payment</button>
                  </div>
                </div>
              </Modal>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// PAYMENT LINK GENERATOR
const PaymentLinkGenerator = ({invoice, bank, onClose}) => {
  if (!invoice || !bank) return null;

  const upiLink = generateUPILink(bank.upiId, bank.ownerName, invoice.amount, `Payment for ${invoice.invoiceNo}`);
  const qrCodeUrl = generateQRCode(upiLink);

  return (
    <Modal title="Payment Link Generated" sub={`Invoice: ${invoice.invoiceNo}`} onClose={onClose} wide>
      <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20}}>
        {/* LEFT: QR CODE */}
        <div style={{textAlign: "center"}}>
          <div style={{fontSize: 12, fontWeight: 700, color: C.ink, marginBottom: 10}}>Scan to Pay</div>
          <img src={qrCodeUrl} alt="Payment QR Code" style={{width: 250, height: 250, borderRadius: 8, border: `2px solid ${C.border}`}}/>
          <div style={{fontSize: 11, color: C.mid, marginTop: 10}}>Buyer can scan this QR to pay</div>
        </div>

        {/* RIGHT: DETAILS */}
        <div>
          <div style={{background: C.raised, border: `1px solid ${C.border}`, borderRadius: 8, padding: 14, marginBottom: 14}}>
            <div style={{fontSize: 12, fontWeight: 700, color: C.ink, marginBottom: 10}}>Payment Details</div>
            {[
              ["Invoice", invoice.invoiceNo],
              ["Amount", "Rs " + fmtD(invoice.amount)],
              ["Receiver", bank.accountName],
              ["UPI ID", bank.upiId],
            ].map(([k,v], i) => (
              <div key={i} style={{display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: i < 3 ? `1px solid ${C.line}` : "none"}}>
                <span style={{color: C.mid, fontSize: 12}}>{k}</span>
                <strong style={{color: C.ink, fontSize: 12}}>{v}</strong>
              </div>
            ))}
          </div>

          <div style={{fontSize: 12, fontWeight: 700, color: C.ink, marginBottom: 8}}>Share Payment Link with Buyer</div>
          <div style={{background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: 10, marginBottom: 14, fontFamily: "monospace", fontSize: 11, color: C.mid, wordBreak: "break-all"}}>
            {upiLink}
          </div>

          <div style={{display: "flex", gap: 8, marginBottom: 14}}>
            <button onClick={() => {
              navigator.clipboard.writeText(upiLink);
              alert("Link copied!");
            }} style={{flex: 1, padding: "9px 14px", borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent", color: C.mid, cursor: "pointer", fontSize: 12, fontWeight: 700}}>Copy Link</button>
            <button onClick={() => {
              navigator.clipboard.writeText(`Pay your invoice via UPI: ${upiLink}`);
              alert("WhatsApp text copied!");
            }} style={{flex: 1, padding: "9px 14px", borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent", color: C.mid, cursor: "pointer", fontSize: 12, fontWeight: 700}}>WhatsApp Template</button>
          </div>

          <Alert type="success" ch="Send this link to the buyer via WhatsApp, SMS, or Email. Payment will arrive instantly in your account."/>
        </div>
      </div>
    </Modal>
  );
};

const Modal = ({title, sub, onClose, children, wide}) => (
  <div style={{position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 2000,
    display: "flex", alignItems: "center", justifyContent: "center", padding: 16}}>
    <div style={{background: C.card, border: `1px solid ${C.border}`, borderRadius: 16,
      width: "100%", maxWidth: wide ? 900 : 560, maxHeight: "92vh", overflowY: "auto"}}>
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
