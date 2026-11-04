import { useState } from 'react';
import { api, money, fmtDate } from '../api.js';
import { useLoad, Loading, Empty, Modal, Field, Msg, Status } from '../ui.jsx';
import { 
  FileSpreadsheet, Plus, Users, Edit2, Trash2, Tag, 
  Calendar, Check, AlertCircle, Percent 
} from 'lucide-react';

function StructureForm({ item, onClose, onSaved }) {
  const [form, setForm] = useState(item
    ? { 
        name: item.name, 
        amount: item.amount, 
        course: item.course, 
        academicYear: item.academicYear, 
        dueDate: item.dueDate.slice(0, 10) 
      }
    : { 
        name: '', 
        amount: '', 
        course: '', 
        academicYear: `${new Date().getFullYear()}-${String(new Date().getFullYear() + 1).slice(2)}`, 
        dueDate: new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10) 
      });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api(item ? `/fee-structures/${item._id}` : '/fee-structures', { 
        method: item ? 'PUT' : 'POST', 
        body: form 
      });
      onSaved();
    } catch (err) { 
      setError(err.message); 
      setBusy(false); 
    }
  }

  return (
    <Modal title={item ? 'Edit Fee Structure' : 'Define New Fee Structure'} onClose={onClose}>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field label="Fee Component Title">
          <input 
            value={form.name} 
            onChange={set('name')} 
            placeholder="e.g. Tuition Fee - Term 1, Science Lab, Annual Sports" 
            required 
            autoFocus 
          />
        </Field>
        <div className="grid2">
          <Field label="Amount (INR)">
            <input 
              type="number" 
              min="0" 
              step="0.01" 
              value={form.amount} 
              onChange={set('amount')} 
              placeholder="e.g. 25000" 
              required 
            />
          </Field>
          <Field label="Payment Due Date">
            <input 
              type="date" 
              value={form.dueDate} 
              onChange={set('dueDate')} 
              required 
            />
          </Field>
          <Field label="Target Class / Course">
            <input 
              value={form.course} 
              onChange={set('course')} 
              placeholder="e.g. Class 10 or Class 9" 
              required 
            />
          </Field>
          <Field label="Academic Session">
            <input 
              value={form.academicYear} 
              onChange={set('academicYear')} 
              placeholder="2026-27" 
              required 
            />
          </Field>
        </div>

        <Msg error={error} />

        <div className="modal-f">
          <button type="button" className="btn ghost" onClick={onClose}>Cancel</button>
          <button className="btn" disabled={busy}>
            {item ? 'Save Structure' : 'Create Fee Structure'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function AssignModal({ structure, onClose, onDone }) {
  const { data: students } = useLoad('/students');
  const [mode, setMode] = useState('course');
  const [picked, setPicked] = useState(new Set());
  const [discount, setDiscount] = useState('0');
  const [error, setError] = useState('');
  const [result, setResult] = useState('');
  const [busy, setBusy] = useState(false);

  const toggle = (id) => { 
    const n = new Set(picked); 
    n.has(id) ? n.delete(id) : n.add(id); 
    setPicked(n); 
  };

  const netPayable = Math.max(0, structure.amount - (Number(discount) || 0));

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError(''); 
    setResult('');
    try {
      const r = await api('/student-fees/assign', {
        method: 'POST',
        body: { 
          feeStructureId: structure._id, 
          discount: Number(discount) || 0, 
          studentIds: mode === 'selected' ? [...picked] : undefined 
        },
      });
      setResult(`✓ Successfully assigned to ${r.assigned} student${r.assigned === 1 ? '' : 's'}. (${r.skipped} were already assigned).`);
      onDone();
    } catch (err) { 
      setError(err.message); 
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={`Assign "${structure.name}" to Students`} onClose={onClose}>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{
          padding: '12px 14px',
          background: 'var(--primary-soft)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid #c7d2fe',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--ink-500)', fontWeight: 600 }}>Base Fee Amount</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--primary)' }}>{money(structure.amount)}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12, color: 'var(--ink-500)', fontWeight: 600 }}>Net per Student</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--emerald-dark)' }}>{money(netPayable)}</div>
          </div>
        </div>

        <div>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-800)', display: 'block', marginBottom: 8 }}>
            Assignment Target
          </span>
          <div style={{ display: 'flex', gap: 20 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 14 }}>
              <input type="radio" checked={mode === 'course'} onChange={() => setMode('course')} /> 
              <span>All students in <b>{structure.course}</b></span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 14 }}>
              <input type="radio" checked={mode === 'selected'} onChange={() => setMode('selected')} /> 
              <span>Select specific students</span>
            </label>
          </div>
        </div>

        {mode === 'selected' && (
          <div className="picklist">
            {(students || []).map((s) => (
              <label key={s._id}>
                <input type="checkbox" checked={picked.has(s._id)} onChange={() => toggle(s._id)} />
                <span><b>{s.rollNo}</b> • {s.user.name} ({s.course})</span>
              </label>
            ))}
          </div>
        )}

        <Field label="Discount / Scholarship (INR per student)">
          <input 
            type="number" 
            min="0" 
            max={structure.amount} 
            step="0.01" 
            value={discount} 
            onChange={(e) => setDiscount(e.target.value)} 
          />
        </Field>

        <Msg error={error} ok={result} />

        <div className="modal-f">
          <button type="button" className="btn ghost" onClick={onClose}>
            {result ? 'Done' : 'Cancel'}
          </button>
          {!result && (
            <button className="btn" disabled={busy}>
              {busy ? 'Assigning…' : 'Confirm & Assign Fee'}
            </button>
          )}
        </div>
      </form>
    </Modal>
  );
}

function Structures() {
  const { data, loading, error, reload } = useLoad('/fee-structures');
  const [editing, setEditing] = useState(null);
  const [assigning, setAssigning] = useState(null);

  async function remove(f) {
    if (!confirm(`Delete fee structure "${f.name}" for ${f.course}?`)) return;
    try { 
      await api(`/fee-structures/${f._id}`, { method: 'DELETE' }); 
      reload(); 
    } catch (e) { 
      alert(e.message); 
    }
  }

  return (
    <>
      <div className="bar">
        <div className="grow">
          <span style={{ color: 'var(--ink-500)', fontSize: 14 }}>
            Master fee catalog defined per class and academic year.
          </span>
        </div>
        <button className="btn" onClick={() => setEditing('new')}>
          <Plus size={16} />
          <span>Add Fee Structure</span>
        </button>
      </div>

      <Loading loading={loading} error={error} />

      {!loading && !error && (
        (data || []).length === 0 ? (
          <Empty icon={FileSpreadsheet}>No fee structures created yet. Click "Add Fee Structure" above to define one.</Empty>
        ) : (
          <div className="table-card">
            <div className="tablewrap">
              <table>
                <thead>
                  <tr>
                    <th>Fee Title</th>
                    <th>Target Class</th>
                    <th>Academic Session</th>
                    <th>Due Date</th>
                    <th className="num">Base Amount</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((f) => (
                    <tr key={f._id}>
                      <td style={{ fontWeight: 600 }}>{f.name}</td>
                      <td>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          background: 'var(--cyan-soft)',
                          color: '#0284c7',
                          fontWeight: 600,
                          fontSize: 12
                        }}>
                          {f.course}
                        </span>
                      </td>
                      <td style={{ color: 'var(--ink-500)', fontSize: 13 }}>{f.academicYear}</td>
                      <td>{fmtDate(f.dueDate)}</td>
                      <td className="num" style={{ fontWeight: 700, color: 'var(--primary)' }}>
                        {money(f.amount)}
                      </td>
                      <td className="actions">
                        <button className="btn small" onClick={() => setAssigning(f)}>
                          <Users size={13} />
                          <span>Assign</span>
                        </button>
                        <button className="btn ghost small" onClick={() => setEditing(f)}>
                          <Edit2 size={13} />
                          <span>Edit</span>
                        </button>
                        <button className="btn danger small" onClick={() => remove(f)}>
                          <Trash2 size={13} />
                          <span>Delete</span>
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

      {editing && (
        <StructureForm 
          item={editing === 'new' ? null : editing} 
          onClose={() => setEditing(null)} 
          onSaved={() => { setEditing(null); reload(); }} 
        />
      )}

      {assigning && (
        <AssignModal 
          structure={assigning} 
          onClose={() => setAssigning(null)} 
          onDone={() => { reload(); }} 
        />
      )}
    </>
  );
}

function DiscountModal({ fee, onClose, onSaved }) {
  const [discount, setDiscount] = useState(String(fee.discount));
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try { 
      await api(`/student-fees/${fee._id}/discount`, { 
        method: 'PATCH', 
        body: { discount: Number(discount) } 
      }); 
      onSaved(); 
    } catch (err) { 
      setError(err.message); 
      setBusy(false); 
    }
  }

  const remaining = Math.max(0, fee.amountDue - Number(discount || 0) - fee.paidAmount);

  return (
    <Modal title={`Scholarship / Discount • ${fee.student?.user?.name}`} onClose={onClose}>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{
          padding: '12px 14px',
          background: '#f8fafc',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          fontSize: 13
        }}>
          <div><b>{fee.title}</b> • Student: {fee.student?.user?.name} ({fee.student?.rollNo})</div>
          <div style={{ color: 'var(--ink-500)', marginTop: 4 }}>
            Original Fee: {money(fee.amountDue)} • Paid so far: {money(fee.paidAmount)}
          </div>
        </div>

        <Field label="Discount Amount (INR)">
          <input 
            type="number" 
            min="0" 
            max={fee.amountDue - fee.paidAmount} 
            step="0.01" 
            value={discount} 
            onChange={(e) => setDiscount(e.target.value)} 
            autoFocus 
          />
        </Field>

        <div style={{ fontSize: 13, color: 'var(--ink-600)' }}>
          New Student Balance will be: <b>{money(remaining)}</b>
        </div>

        <Msg error={error} />

        <div className="modal-f">
          <button type="button" className="btn ghost" onClick={onClose}>Cancel</button>
          <button className="btn" disabled={busy}>Save Discount</button>
        </div>
      </form>
    </Modal>
  );
}

function Assigned() {
  const [status, setStatus] = useState('');
  const { data, loading, error, reload } = useLoad(`/student-fees${status ? `?status=${status}` : ''}`);
  const [editing, setEditing] = useState(null);

  return (
    <>
      <div className="bar">
        <div style={{ minWidth: 220 }}>
          <Field label="Filter by Settlement Status">
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All Assigned Fees</option>
              <option value="pending">Pending Only</option>
              <option value="partial">Partially Paid</option>
              <option value="paid">Fully Settled</option>
            </select>
          </Field>
        </div>
      </div>

      <Loading loading={loading} error={error} />

      {!loading && !error && (
        (data || []).length === 0 ? (
          <Empty icon={FileSpreadsheet}>No assigned student fees match this filter.</Empty>
        ) : (
          <div className="table-card">
            <div className="tablewrap">
              <table>
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Fee Title</th>
                    <th>Due Date</th>
                    <th className="num">Net Payable</th>
                    <th className="num">Paid</th>
                    <th className="num">Balance Due</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Adjustment</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((f) => (
                    <tr key={f._id}>
                      <td>
                        <b>{f.student?.user?.name}</b>
                        <div style={{ fontSize: 12, color: 'var(--ink-500)' }}>
                          Roll: {f.student?.rollNo} • {f.student?.course}
                        </div>
                      </td>
                      <td style={{ fontWeight: 600 }}>{f.title}</td>
                      <td>{fmtDate(f.dueDate)}</td>
                      <td className="num">{money(f.net)}</td>
                      <td className="num" style={{ color: 'var(--emerald-dark)' }}>{money(f.paidAmount)}</td>
                      <td className="num" style={{ fontWeight: 800, color: f.balance > 0 ? 'var(--rose-dark)' : 'var(--emerald-dark)' }}>
                        {money(f.balance)}
                      </td>
                      <td>
                        <Status fee={f} />
                      </td>
                      <td className="actions">
                        <button className="btn ghost small" onClick={() => setEditing(f)}>
                          <Percent size={12} />
                          <span>Discount</span>
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

      {editing && (
        <DiscountModal 
          fee={editing} 
          onClose={() => setEditing(null)} 
          onSaved={() => { setEditing(null); reload(); }} 
        />
      )}
    </>
  );
}

export default function Fees() {
  const [tab, setTab] = useState('structures');

  return (
    <>
      <h1>Fee Management</h1>
      <p className="sub">Define standardized fee structures once, then bulk or individually assign them to students.</p>

      <div className="tabs" role="tablist">
        <button 
          role="tab" 
          aria-selected={tab === 'structures'} 
          onClick={() => setTab('structures')}
        >
          <FileSpreadsheet size={16} />
          <span>Fee Catalog & Structures</span>
        </button>
        <button 
          role="tab" 
          aria-selected={tab === 'assigned'} 
          onClick={() => setTab('assigned')}
        >
          <Users size={16} />
          <span>Assigned Student Dues</span>
        </button>
      </div>

      {tab === 'structures' ? <Structures /> : <Assigned />}
    </>
  );
}
