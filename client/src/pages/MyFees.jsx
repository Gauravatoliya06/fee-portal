import { useState } from 'react';
import { useAuth } from '../auth.jsx';
import { api, money, fmtDate, methodLabel, openReceipt } from '../api.js';
import { useLoad, Loading, Empty, Status, Modal, Field, Msg, fireConfetti } from '../ui.jsx';
import { 
  CreditCard, QrCode, Building, CheckCircle2, AlertCircle, 
  Download, ArrowRight, ShieldCheck, Sparkles 
} from 'lucide-react';

function OnlinePayModal({ fee, onClose, onPaid }) {
  const [amount, setAmount] = useState(String(fee.balance));
  const [method, setMethod] = useState('upi'); // upi | card | netbanking
  const [upiId, setUpiId] = useState('student@okaxis');
  const [cardHolder, setCardHolder] = useState('STUDENT HOLDER');
  const [cardNumber, setCardNumber] = useState('•••• •••• •••• 4242');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);

  async function handlePayment(e) {
    e.preventDefault();
    setBusy(true);
    setError('');

    try {
      const res = await api(`/student-fees/${fee._id}/pay-online`, {
        method: 'POST',
        body: {
          amount: Number(amount),
          method: method === 'netbanking' ? 'bank_transfer' : method,
        },
      });

      fireConfetti();
      setSuccess(res.payment);
      onPaid();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={`Pay Fee Online • ${fee.title}`} onClose={onClose}>
      {success ? (
        <div style={{ textAlign: 'center', padding: '16px 0', display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center' }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'var(--emerald-soft)',
            color: 'var(--emerald-dark)',
            display: 'grid',
            placeItems: 'center'
          }}>
            <CheckCircle2 size={32} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 18 }}>Payment Successful!</h3>
            <p style={{ color: 'var(--ink-500)', fontSize: 14, marginTop: 4 }}>
              Receipt <b>{success.receiptNo}</b> has been generated and recorded.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button className="btn" onClick={() => openReceipt(success._id)}>
              <Download size={15} />
              <span>Download PDF Receipt</span>
            </button>
            <button className="btn ghost" onClick={onClose}>Done</button>
          </div>
        </div>
      ) : (
        <form onSubmit={handlePayment} className="checkout-modal-body">
          <div className="checkout-fee-summary">
            <div>
              <div style={{ fontSize: 12, color: 'var(--ink-500)', textTransform: 'uppercase', fontWeight: 600 }}>Total Remaining Balance</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--primary)' }}>{money(fee.balance)}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, color: 'var(--ink-500)', textTransform: 'uppercase', fontWeight: 600 }}>Due Date</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{fmtDate(fee.dueDate)}</div>
            </div>
          </div>

          <Field label="Amount to Pay (INR)" hint="You can pay the full dues or any partial amount">
            <input 
              type="number" 
              min="1" 
              max={fee.balance} 
              step="0.01" 
              value={amount} 
              onChange={(e) => setAmount(e.target.value)} 
              required 
            />
          </Field>

          <div>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-800)', display: 'block', marginBottom: 8 }}>
              Select Payment Method
            </span>
            <div className="checkout-tabs">
              <button 
                type="button" 
                className={`checkout-tab-btn ${method === 'upi' ? 'active' : ''}`}
                onClick={() => setMethod('upi')}
              >
                <QrCode size={18} />
                <span>UPI / QR</span>
              </button>
              <button 
                type="button" 
                className={`checkout-tab-btn ${method === 'card' ? 'active' : ''}`}
                onClick={() => setMethod('card')}
              >
                <CreditCard size={18} />
                <span>Card</span>
              </button>
              <button 
                type="button" 
                className={`checkout-tab-btn ${method === 'netbanking' ? 'active' : ''}`}
                onClick={() => setMethod('netbanking')}
              >
                <Building size={18} />
                <span>Net Banking</span>
              </button>
            </div>
          </div>

          {method === 'upi' && (
            <div className="sim-qr-box">
              <div className="qr-code-art">
                {/* Simulated SVG QR Code pattern */}
                <svg width="110" height="110" viewBox="0 0 100 100" fill="currentColor">
                  <path d="M0,0 h30 v30 h-30 z M10,10 h10 v10 h-10 z" />
                  <path d="M70,0 h30 v30 h-30 z M80,10 h10 v10 h-10 z" />
                  <path d="M0,70 h30 v30 h-30 z M10,80 h10 v10 h-10 z" />
                  <rect x="40" y="10" width="10" height="20" />
                  <rect x="10" y="40" width="20" height="10" />
                  <rect x="40" y="40" width="20" height="20" />
                  <rect x="70" y="40" width="20" height="10" />
                  <rect x="70" y="70" width="10" height="20" />
                  <rect x="40" y="80" width="20" height="10" />
                </svg>
              </div>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-800)' }}>Scan with any UPI App</span>
                <div style={{ fontSize: 12, color: 'var(--ink-500)' }}>Google Pay • PhonePe • Paytm • BHIM</div>
              </div>
            </div>
          )}

          {method === 'card' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div className="virtual-card">
                <div className="virtual-card-top">
                  <div className="chip-icon" />
                  <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.06em' }}>VISA / DEBIT</span>
                </div>
                <div className="card-num-text">{cardNumber}</div>
                <div className="virtual-card-bottom">
                  <div>
                    <span>Cardholder</span>
                    <div className="card-holder">{cardHolder}</div>
                  </div>
                  <div>
                    <span>Expires</span>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>08/29</div>
                  </div>
                </div>
              </div>
              <div className="grid2">
                <Field label="Cardholder Name">
                  <input value={cardHolder} onChange={(e) => setCardHolder(e.target.value)} />
                </Field>
                <Field label="CVV">
                  <input type="password" defaultValue="882" maxLength={4} />
                </Field>
              </div>
            </div>
          )}

          {method === 'netbanking' && (
            <Field label="Select Banking Partner">
              <select defaultValue="hdfc">
                <option value="hdfc">HDFC Bank</option>
                <option value="sbi">State Bank of India</option>
                <option value="icici">ICICI Bank</option>
                <option value="axis">Axis Bank</option>
                <option value="kotak">Kotak Mahindra Bank</option>
              </select>
            </Field>
          )}

          <Msg error={error} />

          <div className="modal-f">
            <button type="button" className="btn ghost" onClick={onClose} disabled={busy}>Cancel</button>
            <button className="btn" disabled={busy || Number(amount) <= 0}>
              <span>{busy ? 'Processing Transaction…' : `Pay ${money(amount)}`}</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}

export default function MyFees() {
  const { user } = useAuth();
  const fees = useLoad('/student-fees');
  const pays = useLoad('/payments');
  const [payingFee, setPayingFee] = useState(null);

  const list = fees.data || [];
  const balance = list.reduce((a, f) => a + f.balance, 0);
  const paid = list.reduce((a, f) => a + f.paidAmount, 0);
  const totalBilled = balance + paid;
  const progressPct = totalBilled > 0 ? Math.round((paid / totalBilled) * 100) : 100;

  function reloadAll() {
    fees.reload();
    pays.reload();
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1>Welcome, {user.name}</h1>
          <p className="sub">
            {user.rollNo ? `Roll Number: ${user.rollNo} • Class/Course: ${user.course}` : 'Review and settle academic fees.'}
          </p>
        </div>
      </div>

      <Loading loading={fees.loading} error={fees.error} />

      {fees.data && (
        <>
          {/* Student Dues Executive Banner */}
          <div className="hero-card" style={{ gridTemplateColumns: '1.2fr 1fr' }}>
            <div className="hero-content">
              <h2>Fee Settlement Status: {progressPct}%</h2>
              <p>
                {balance > 0 
                  ? `You have an outstanding balance of ${money(balance)}. You can settle full or partial dues online.`
                  : 'Congratulations! All your assigned tuition and facility fees are fully settled.'}
              </p>
              <div className="progress-container" style={{ height: 10, maxWidth: 380 }}>
                <div 
                  className="progress-fill success" 
                  style={{ width: `${progressPct}%` }} 
                />
              </div>
            </div>

            <div className="hero-stats-row">
              <div className="hero-stat-box">
                <div className="h-k">Pending Dues</div>
                <div className="h-v" style={{ color: balance > 0 ? '#fca5a5' : '#a7f3d0' }}>
                  {money(balance)}
                </div>
              </div>
              <div className="hero-stat-box">
                <div className="h-k">Paid So Far</div>
                <div className="h-v">{money(paid)}</div>
              </div>
            </div>
          </div>

          <h2 style={{ marginBottom: 12 }}>Assigned Fee Obligations</h2>
          {list.length === 0 ? (
            <Empty>No fee obligations have been assigned to your profile yet.</Empty>
          ) : (
            <div className="table-card">
              <div className="tablewrap">
                <table>
                  <thead>
                    <tr>
                      <th>Fee Component</th>
                      <th>Due Date</th>
                      <th className="num">Original Fee</th>
                      <th className="num">Discount</th>
                      <th className="num">Net Payable</th>
                      <th className="num">Paid</th>
                      <th className="num">Remaining Due</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((f) => (
                      <tr key={f._id}>
                        <td style={{ fontWeight: 600 }}>{f.title}</td>
                        <td>{fmtDate(f.dueDate)}</td>
                        <td className="num">{money(f.amountDue)}</td>
                        <td className="num" style={{ color: f.discount > 0 ? 'var(--emerald-dark)' : 'var(--ink-400)' }}>
                          {f.discount > 0 ? `-${money(f.discount)}` : '₹0.00'}
                        </td>
                        <td className="num" style={{ fontWeight: 700 }}>{money(f.net)}</td>
                        <td className="num" style={{ color: 'var(--emerald-dark)' }}>{money(f.paidAmount)}</td>
                        <td className="num" style={{ fontWeight: 800, color: f.balance > 0 ? 'var(--rose-dark)' : 'var(--emerald-dark)' }}>
                          {money(f.balance)}
                        </td>
                        <td>
                          <Status fee={f} />
                        </td>
                        <td className="actions">
                          {f.balance > 0 ? (
                            <button className="btn small" onClick={() => setPayingFee(f)}>
                              <CreditCard size={13} />
                              <span>Pay Online</span>
                            </button>
                          ) : (
                            <span style={{ fontSize: 12, color: 'var(--emerald-dark)', fontWeight: 700 }}>
                              Settled ✓
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Payment History & Downloadable Receipts */}
      <div style={{ marginTop: 36 }}>
        <h2 style={{ marginBottom: 12 }}>Payment Receipts & Transaction Log</h2>
        <Loading loading={pays.loading} error={pays.error} />
        {pays.data && (
          pays.data.length === 0 ? (
            <Empty>No payment records found yet. Once a payment is recorded or made online, your official receipt will appear here.</Empty>
          ) : (
            <div className="table-card">
              <div className="tablewrap">
                <table>
                  <thead>
                    <tr>
                      <th>Receipt #</th>
                      <th>Payment Date</th>
                      <th>Fee Component</th>
                      <th>Mode</th>
                      <th>Reference ID</th>
                      <th className="num">Amount Paid</th>
                      <th style={{ textAlign: 'right' }}>Official PDF Slip</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pays.data.map((p) => (
                      <tr key={p._id}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--primary)' }}>
                          {p.receiptNo}
                        </td>
                        <td>{fmtDate(p.paidOn)}</td>
                        <td>{p.studentFee?.title}</td>
                        <td>
                          <span className="tag-method">
                            {methodLabel(p.method)}
                          </span>
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-500)' }}>
                          {p.referenceNo || 'Counter Cash'}
                        </td>
                        <td className="num" style={{ color: 'var(--emerald-dark)', fontWeight: 700 }}>
                          {money(p.amount)}
                        </td>
                        <td className="actions">
                          <button className="btn ghost small" onClick={() => openReceipt(p._id)}>
                            <Download size={13} />
                            <span>Download Receipt</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        )}
      </div>

      {payingFee && (
        <OnlinePayModal 
          fee={payingFee} 
          onClose={() => setPayingFee(null)} 
          onPaid={() => {
            reloadAll();
          }} 
        />
      )}
    </>
  );
}
