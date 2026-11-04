import { useState } from 'react';
import { money, fmtDate, today, methodLabel, downloadCSV } from '../api.js';
import { useLoad, Loading, Empty, Field } from '../ui.jsx';
import { 
  BarChart3, Download, TrendingUp, AlertOctagon, 
  Wallet, Calendar, Filter, PieChart 
} from 'lucide-react';

function Dues() {
  const { data, loading, error } = useLoad('/reports/dues');
  const rows = data || [];
  const total = rows.reduce((a, r) => a + r.balance, 0);

  return (
    <>
      <div className="bar">
        <div className="grow">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 16 }}>
              Total Outstanding: <b style={{ color: 'var(--rose-dark)', fontSize: 18 }}>{money(total)}</b>
            </span>
            <span style={{
              fontSize: 12,
              padding: '2px 8px',
              borderRadius: '99px',
              background: 'var(--rose-soft)',
              color: 'var(--rose-dark)',
              fontWeight: 700
            }}>
              Across {rows.length} Student{rows.length === 1 ? '' : 's'}
            </span>
          </div>
        </div>

        <button 
          className="btn ghost" 
          disabled={!rows.length}
          onClick={() => downloadCSV('student_dues_report.csv', [
            ['Roll No', 'Student Name', 'Course', 'Phone', 'Unpaid Items', 'Oldest Due Date', 'Total Balance'],
            ...rows.map((r) => [r.rollNo, r.name, r.course, r.phone, r.items, fmtDate(r.oldestDue), r.balance])
          ])}
        >
          <Download size={14} />
          <span>Export Dues CSV</span>
        </button>
      </div>

      <Loading loading={loading} error={error} />

      {!loading && !error && (
        rows.length === 0 ? (
          <Empty icon={AlertOctagon}>All accounts settled! No student currently owes any overdue fees.</Empty>
        ) : (
          <div className="table-card">
            <div className="tablewrap">
              <table>
                <thead>
                  <tr>
                    <th>Roll Number</th>
                    <th>Student Name</th>
                    <th>Class / Course</th>
                    <th>Contact Phone</th>
                    <th className="num">Unpaid Fee Items</th>
                    <th>Oldest Due Date</th>
                    <th className="num">Outstanding Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.studentId}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{r.rollNo}</td>
                      <td><b>{r.name}</b></td>
                      <td>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: 'var(--cyan-soft)',
                          color: '#0284c7',
                          fontWeight: 600,
                          fontSize: 12
                        }}>
                          {r.course}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{r.phone || '—'}</td>
                      <td className="num">{r.items}</td>
                      <td style={{ color: 'var(--rose-dark)', fontWeight: 600 }}>{fmtDate(r.oldestDue)}</td>
                      <td className="num" style={{ fontWeight: 800, color: 'var(--rose-dark)' }}>
                        {money(r.balance)}
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

function Collection() {
  const first = `${today().slice(0, 8)}01`;
  const [from, setFrom] = useState(first);
  const [to, setTo] = useState(today());
  const [groupBy, setGroupBy] = useState('day');
  const { data, loading, error } = useLoad(`/reports/collection?from=${from}&to=${to}&groupBy=${groupBy}`);

  return (
    <>
      <div className="bar">
        <Field label="Collection From">
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </Field>
        <Field label="Collection To">
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </Field>
        <Field label="Grouping Interval">
          <select value={groupBy} onChange={(e) => setGroupBy(e.target.value)}>
            <option value="day">By Day</option>
            <option value="month">By Month</option>
          </select>
        </Field>

        <div className="grow" />

        <button 
          className="btn ghost" 
          disabled={!data?.rows.length}
          onClick={() => downloadCSV('collection_report.csv', [
            ['Period', 'Number of Payments', 'Total Amount Collected'],
            ...data.rows.map((r) => [r.period, r.count, r.total])
          ])}
        >
          <Download size={14} />
          <span>Export Collection CSV</span>
        </button>
      </div>

      <Loading loading={loading} error={error} />

      {data && (
        <>
          <div style={{
            background: 'var(--emerald-soft)',
            border: '1px solid var(--emerald-border)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px 20px',
            marginBottom: 24,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <span style={{ fontSize: 13, color: 'var(--emerald-dark)', textTransform: 'uppercase', fontWeight: 700 }}>
                Period Fee Inflow
              </span>
              <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--emerald-dark)' }}>
                {money(data.total)}
              </div>
            </div>
            <div style={{ textAlign: 'right', fontSize: 13, color: 'var(--ink-600)' }}>
              From <b>{fmtDate(from)}</b> to <b>{fmtDate(to)}</b>
            </div>
          </div>

          {data.rows.length === 0 ? (
            <Empty icon={BarChart3}>No fee collections recorded in this date range.</Empty>
          ) : (
            <div className="grid2" style={{ alignItems: 'start' }}>
              <div>
                <h3 style={{ marginBottom: 12 }}>Time Period Breakdown</h3>
                <div className="table-card">
                  <div className="tablewrap">
                    <table>
                      <thead>
                        <tr>
                          <th>{groupBy === 'month' ? 'Month' : 'Date'}</th>
                          <th className="num">Transactions</th>
                          <th className="num">Collected</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.rows.map((r) => (
                          <tr key={r.period}>
                            <td style={{ fontWeight: 600 }}>{r.period}</td>
                            <td className="num">{r.count}</td>
                            <td className="num" style={{ fontWeight: 700, color: 'var(--emerald-dark)' }}>
                              {money(r.total)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div>
                <h3 style={{ marginBottom: 12 }}>Payment Method Distribution</h3>
                <div className="table-card">
                  <div className="tablewrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Method</th>
                          <th className="num">Transactions</th>
                          <th className="num">Collected</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.byMethod.map((r) => (
                          <tr key={r.method}>
                            <td>
                              <span className="tag-method">
                                {methodLabel(r.method)}
                              </span>
                            </td>
                            <td className="num">{r.count}</td>
                            <td className="num" style={{ fontWeight: 700, color: 'var(--primary)' }}>
                              {money(r.total)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}

export default function Reports() {
  const [tab, setTab] = useState('dues');

  return (
    <>
      <h1>Financial Reports & Analytics</h1>
      <p className="sub">Audit outstanding receivables, view collection trends, and download regulatory CSV exports.</p>

      <div className="tabs" role="tablist">
        <button 
          role="tab" 
          aria-selected={tab === 'dues'} 
          onClick={() => setTab('dues')}
        >
          <AlertOctagon size={16} />
          <span>Pending Dues Aging</span>
        </button>
        <button 
          role="tab" 
          aria-selected={tab === 'collection'} 
          onClick={() => setTab('collection')}
        >
          <BarChart3 size={16} />
          <span>Collection Ledger</span>
        </button>
      </div>

      {tab === 'dues' ? <Dues /> : <Collection />}
    </>
  );
}
