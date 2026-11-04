import { useEffect, useState } from 'react';
import { api, money, fmtDate, today, methodLabel, openReceipt } from '../api.js';
import { useLoad, Loading, Empty, Field, Msg, fireConfetti } from '../ui.jsx';
import { 
  CreditCard, Plus, Download, CheckCircle2, QrCode, 
  Receipt, Wallet, Calendar, Filter 
} from 'lucide-react';

const METHODS = ['cash', 'upi', 'cheque', 'bank_transfer', 'card'];

function RecordPayment({ onSaved }) {
  const { data: students } = useLoad('/students');
  const [studentId, setStudentId] = useState('');
  const [fees, setFees] = useState([]);
  const [form, setForm] = useState({ 
    studentFeeId: '', 
    amount: '', 
    method: 'cash', 
    referenceNo: '', 
    paidOn: today(), 
    note: '' 
  });
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  useEffect(() => {
    setFees([]);
    setForm((f) => ({ ...f, studentFeeId: '', amount: '' }));
    if (!studentId) return;
    api(`/student-fees?student=${studentId}&open=1`)
      .then(setFees)
      .catch((e) => setError(e.message));
  }, [studentId]);

  function pickFee(e) {
    const fee = fees.find((f) => f._id === e.target.value);
    setForm({ 
      ...form, 
      studentFeeId: e.target.value, 
      amount: fee ? String(fee.balance) : '' 
    });
  }

  async function submit(e) {
    e.preventDefault();
    setBusy(true); 
    setError(''); 
    setSaved(null);
    try {
      const p = await api('/payments', { method: 'POST', body: form });
      fireConfetti();
      setSaved(p);
      setStudentId('');
      setForm({ studentFeeId: '', amount: '', method: 'cash', referenceNo: '', paidOn: today(), note: '' });
      onSaved();
    } catch (err) { 
      setError(err.message); 
    } finally { 
      setBusy(false); 
    }
  }

  return (
    <div className="slip">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
        <div style={{
          width: 38,
          height: 38,
          borderRadius: 'var(--radius-md)',
          background: 'var(--primary-soft)',
          color: 'var(--primary)',
          display: 'grid',
          placeItems: 'center'
        }}>
          <Receipt size={20} />
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: 18 }}>Counter Payment Entry</h2>
          <span style={{ fontSize: 13, color: 'var(--ink-500)' }}>Log cash, cheque, UPI or card payment received from a student</span>
        </div>
      </div>

      <form onSubmit={submit}>
        <div className="grid2">
          <Field label="Select Student">
            <select value={studentId} onChange={(e) => setStudentId(e.target.value)} required>
              <option value="">Choose student by roll number…</option>
              {(students || []).map((s) => (
                <option key={s._id} value={s._id}>
                  {s.rollNo} • {s.user.name} ({s.course})
                </option>
              ))}
            </select>
          </Field>

          <Field label="Pending Fee Obligation">
            <select value={form.studentFeeId} onChange={pickFee} required disabled={!studentId}>
              <option value="">
                {studentId && fees.length === 0 ? 'No pending unpaid fees for this student' : 'Select fee component…'}
              </option>
              {fees.map((f) => (
                <option key={f._id} value={f._id}>
                  {f.title} (Outstanding Balance: {money(f.balance)})
                </option>
              ))}
            </select>
          </Field>

          <Field label="Amount Received (INR)">
            <input 
              type="number" 
              min="0.01" 
              step="0.01" 
              value={form.amount} 
              onChange={set('amount')} 
              placeholder="0.00" 
              required 
            />
          </Field>

          <Field label="Date Received">
            <input 
              type="date" 
              value={form.paidOn} 
              onChange={set('paidOn')} 
              max={today()} 
              required 
            />
          </Field>

          <Field label="Payment Method">
            <select value={form.method} onChange={set('method')}>
              {METHODS.map((m) => (
                <option key={m} value={m}>{methodLabel(m)}</option>
              ))}
            </select>
          </Field>

          <Field label="Transaction / Cheque / Reference No.">
            <input 
              value={form.referenceNo} 
              onChange={set('referenceNo')} 
              placeholder="e.g. UTR / UPI Ref / Cheque No." 
            />
          </Field>
        </div>

        <div style={{ marginTop: 14 }}>
          <Field label="Accounts Officer Note / Remark">
            <input 
              value={form.note} 
              onChange={set('note')} 
              placeholder="Optional notes regarding this transaction" 
            />
          </Field>
        </div>

        <Msg error={error} />

        {saved && (
          <div className="msg ok" style={{ marginTop: 14, justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle2 size={18} />
              <span>Payment logged successfully! Official Receipt: <b>{saved.receiptNo}</b></span>
            </div>
            <button 
              type="button" 
              className="btn small" 
              onClick={() => openReceipt(saved._id)}
              style={{ background: 'var(--emerald-dark)', borderColor: 'var(--emerald-dark)' }}
            >
              <Download size={13} />
              <span>View PDF Slip</span>
            </button>
          </div>
        )}

        <div style={{ marginTop: 18 }}>
          <button className="btn" disabled={busy || !form.studentFeeId}>
            <CheckCircle2 size={16} />
            <span>{busy ? 'Processing Transaction…' : 'Record Payment & Generate Receipt'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

function History({ refreshKey }) {
  const [filters, setFilters] = useState({ from: '', to: '', method: '' });
  const qs = new URLSearchParams(Object.entries(filters).filter(([, v]) => v)).toString();
  const { data, loading, error, reload } = useLoad(`/payments${qs ? `?${qs}` : ''}`);
  
  useEffect(() => { 
    reload(); 
  }, [refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps
  
  const set = (k) => (e) => setFilters({ ...filters, [k]: e.target.value });

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2>Transaction History & Receipts</h2>
      </div>

      <div className="bar">
        <Field label="Received From Date">
          <input type="date" value={filters.from} onChange={set('from')} />
        </Field>
        <Field label="Received To Date">
          <input type="date" value={filters.to} onChange={set('to')} />
        </Field>
        <Field label="Method Filter">
          <select value={filters.method} onChange={set('method')}>
            <option value="">All Payment Modes</option>
            {METHODS.map((m) => (
              <option key={m} value={m}>{methodLabel(m)}</option>
            ))}
          </select>
        </Field>
      </div>

      <Loading loading={loading} error={error} />

      {!loading && !error && (
        (data || []).length === 0 ? (
          <Empty icon={Receipt}>No payment records match the selected date and method filters.</Empty>
        ) : (
          <div className="table-card">
            <div className="tablewrap">
              <table>
                <thead>
                  <tr>
                    <th>Receipt #</th>
                    <th>Date Paid</th>
                    <th>Student Name</th>
                    <th>Fee Component</th>
                    <th>Method</th>
                    <th>Received By</th>
                    <th className="num">Amount</th>
                    <th style={{ textAlign: 'right' }}>Official Slip</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((p) => (
                    <tr key={p._id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--primary)' }}>
                        {p.receiptNo}
                      </td>
                      <td>{fmtDate(p.paidOn)}</td>
                      <td>
                        <b>{p.student?.user?.name}</b>
                        <div style={{ fontSize: 12, color: 'var(--ink-500)' }}>
                          Roll: {p.student?.rollNo} • {p.student?.course}
                        </div>
                      </td>
                      <td>{p.studentFee?.title}</td>
                      <td>
                        <span className="tag-method">
                          {methodLabel(p.method)}
                        </span>
                        {p.referenceNo && (
                          <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--ink-400)', marginTop: 2 }}>
                            Ref: {p.referenceNo}
                          </div>
                        )}
                      </td>
                      <td style={{ color: 'var(--ink-600)', fontSize: 13 }}>
                        {p.receivedBy?.name || 'Portal System'}
                      </td>
                      <td className="num" style={{ color: 'var(--emerald-dark)', fontWeight: 700 }}>
                        {money(p.amount)}
                      </td>
                      <td className="actions">
                        <button className="btn ghost small" onClick={() => openReceipt(p._id)}>
                          <Download size={13} />
                          <span>PDF</span>
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
    </>
  );
}

export default function Payments() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <>
      <h1>Payment Ledger & Receipts</h1>
      <p className="sub">Process student fee payments, maintain transaction logs, and generate compliant PDF receipts.</p>
      
      <RecordPayment onSaved={() => setRefreshKey((k) => k + 1)} />
      <History refreshKey={refreshKey} />
    </>
  );
}
