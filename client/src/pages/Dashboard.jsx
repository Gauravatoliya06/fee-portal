import { useNavigate } from 'react-router-dom';
import { money, fmtDate, openReceipt, methodLabel } from '../api.js';
import { useLoad, Loading, Empty } from '../ui.jsx';
import { 
  TrendingUp, AlertCircle, CheckCircle2, Clock, Wallet, 
  ArrowUpRight, Plus, Users, FileSpreadsheet, Download, Receipt 
} from 'lucide-react';

export default function Dashboard() {
  const { data: d, loading, error } = useLoad('/reports/dashboard');
  const nav = useNavigate();

  const billed = d?.billed || 0;
  const collected = d?.collected || 0;
  const collectionRate = billed > 0 ? Math.round((collected / billed) * 100) : 0;

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1>Financial Overview</h1>
          <p className="sub">Real-time status of fee billing, collections, and outstanding dues.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn" onClick={() => nav('/admin/payments')}>
            <Plus size={16} />
            <span>Record Payment</span>
          </button>
          <button className="btn ghost" onClick={() => nav('/admin/fees')}>
            <FileSpreadsheet size={16} />
            <span>Assign Fee</span>
          </button>
        </div>
      </div>

      <Loading loading={loading} error={error} />

      {d && (
        <>
          {/* Executive Hero Banner */}
          <div className="hero-card">
            <div className="hero-content">
              <h2>Collection Efficiency: {collectionRate}%</h2>
              <p>
                {money(d.collected)} collected out of {money(d.billed)} billed.
                {d.overdueCount > 0 
                  ? ` Attention required: ${d.overdueCount} fee item${d.overdueCount === 1 ? '' : 's'} past due date.` 
                  : ' All dues are currently within allowed grace periods.'}
              </p>
              <div className="progress-container" style={{ height: 10, maxWidth: 420 }}>
                <div 
                  className="progress-fill success" 
                  style={{ width: `${Math.min(collectionRate, 100)}%` }} 
                />
              </div>
            </div>

            <div className="hero-stats-row">
              <div className="hero-stat-box">
                <div className="h-k">Collected Today</div>
                <div className="h-v">{money(d.today)}</div>
              </div>
              <div className="hero-stat-box">
                <div className="h-k">This Month</div>
                <div className="h-v">{money(d.thisMonth)}</div>
              </div>
            </div>
          </div>

          {/* 4 KPI Grid Cards */}
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-card-header">
                <span className="kpi-title">Outstanding Balance</span>
                <div className="kpi-icon-wrap amber">
                  <AlertCircle size={20} />
                </div>
              </div>
              <div className="kpi-value" style={{ color: 'var(--amber-dark)' }}>
                {money(d.outstanding)}
              </div>
              <div className="kpi-meta">
                <span>Total receivable from students</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-card-header">
                <span className="kpi-title">Total Collected</span>
                <div className="kpi-icon-wrap emerald">
                  <CheckCircle2 size={20} />
                </div>
              </div>
              <div className="kpi-value" style={{ color: 'var(--emerald-dark)' }}>
                {money(d.collected)}
              </div>
              <div className="kpi-meta">
                <span style={{ color: 'var(--emerald-dark)', fontWeight: 600 }}>
                  {collectionRate}% of total billed
                </span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-card-header">
                <span className="kpi-title">Total Billed</span>
                <div className="kpi-icon-wrap indigo">
                  <Wallet size={20} />
                </div>
              </div>
              <div className="kpi-value">
                {money(d.billed)}
              </div>
              <div className="kpi-meta">
                <span>Across all active fee structures</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-card-header">
                <span className="kpi-title">Fee Status Breakdown</span>
                <div className="kpi-icon-wrap rose">
                  <Clock size={20} />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--emerald-dark)', fontWeight: 600 }}>Fully Paid:</span>
                  <b>{d.counts.paid}</b>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--cyan)', fontWeight: 600 }}>Partly Paid:</span>
                  <b>{d.counts.partial}</b>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--amber-dark)', fontWeight: 600 }}>Pending:</span>
                  <b>{d.counts.pending}</b>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Payments Section */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2>Recent Payment Receipts</h2>
            <button className="linkbtn" onClick={() => nav('/admin/payments')}>
              <span>View full ledger</span>
              <ArrowUpRight size={14} />
            </button>
          </div>

          {d.recent.length === 0 ? (
            <Empty>No payments recorded yet. Use the "Record Payment" button to log an entry.</Empty>
          ) : (
            <div className="table-card">
              <div className="tablewrap">
                <table>
                  <thead>
                    <tr>
                      <th>Receipt #</th>
                      <th>Student</th>
                      <th>Fee Component</th>
                      <th>Method</th>
                      <th>Date</th>
                      <th className="num">Amount Paid</th>
                      <th style={{ textAlign: 'right' }}>Official Slip</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.recent.map((p) => (
                      <tr key={p._id}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--primary)' }}>
                          {p.receiptNo}
                        </td>
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
                        </td>
                        <td>{fmtDate(p.paidOn)}</td>
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
          )}
        </>
      )}
    </>
  );
}
