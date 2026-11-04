import { useState } from 'react';
import { api } from '../api.js';
import { useLoad, Loading, Empty, Modal, Field, Msg } from '../ui.jsx';
import { 
  Users, UserPlus, Search, Edit2, Trash2, Mail, Phone, 
  ShieldAlert, BookOpen, GraduationCap 
} from 'lucide-react';

const blank = { name: '', email: '', password: '', rollNo: '', course: '', guardianName: '', phone: '' };

function StudentForm({ student, onClose, onSaved }) {
  const editing = !!student;
  const [form, setForm] = useState(editing
    ? { 
        name: student.user.name, 
        email: student.user.email, 
        rollNo: student.rollNo, 
        course: student.course, 
        guardianName: student.guardianName || '', 
        phone: student.phone || '' 
      }
    : blank);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setBusy(true); 
    setError('');
    try {
      await api(editing ? `/students/${student._id}` : '/students', { 
        method: editing ? 'PUT' : 'POST', 
        body: form 
      });
      onSaved();
    } catch (err) { 
      setError(err.message); 
      setBusy(false); 
    }
  }

  return (
    <Modal title={editing ? `Edit Record • ${student.user.name}` : 'Enroll New Student'} onClose={onClose}>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="grid2">
          <Field label="Full Name">
            <input value={form.name} onChange={set('name')} placeholder="e.g. Aarav Sharma" required autoFocus />
          </Field>
          <Field label="Email Address">
            <input type="email" value={form.email} onChange={set('email')} placeholder="student@example.test" required />
          </Field>
          <Field label="Roll Number">
            <input value={form.rollNo} onChange={set('rollNo')} placeholder="e.g. S-1006" required />
          </Field>
          <Field label="Course / Class">
            <input value={form.course} onChange={set('course')} placeholder="e.g. Class 10 or B.Tech CS" required />
          </Field>
          <Field label="Guardian / Parent Name">
            <input value={form.guardianName} onChange={set('guardianName')} placeholder="Parent full name" />
          </Field>
          <Field label="Contact Phone">
            <input value={form.phone} onChange={set('phone')} placeholder="+91 98765 43210" />
          </Field>
        </div>

        {!editing && (
          <Field 
            label="Initial Account Password" 
            hint="Leave blank to automatically use the student's roll number as their default password"
          >
            <input 
              type="text" 
              value={form.password} 
              onChange={set('password')} 
              placeholder="Defaults to roll number" 
              minLength={6} 
            />
          </Field>
        )}

        <Msg error={error} />

        <div className="modal-f">
          <button type="button" className="btn ghost" onClick={onClose}>Cancel</button>
          <button className="btn" disabled={busy}>
            {editing ? 'Save Changes' : 'Enroll Student'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function Students() {
  const { data, loading, error, reload } = useLoad('/students');
  const [q, setQ] = useState('');
  const [course, setCourse] = useState('');
  const [editing, setEditing] = useState(null); // null | 'new' | student

  const all = data || [];
  const courses = [...new Set(all.map((s) => s.course))].sort();
  const list = all.filter((s) => (
    (!course || s.course === course) && 
    (!q || `${s.user.name} ${s.rollNo} ${s.user.email}`.toLowerCase().includes(q.toLowerCase()))
  ));

  async function remove(s) {
    if (!confirm(`Are you sure you want to delete student "${s.user.name}" (${s.rollNo})? This will permanently remove their records.`)) {
      return;
    }
    try { 
      await api(`/students/${s._id}`, { method: 'DELETE' }); 
      reload(); 
    } catch (e) { 
      alert(e.message); 
    }
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1>Students Directory</h1>
          <p className="sub">Manage student profiles, credentials, assigned classes, and contact records.</p>
        </div>
        <button className="btn" onClick={() => setEditing('new')}>
          <UserPlus size={16} />
          <span>Add Student</span>
        </button>
      </div>

      <div className="bar">
        <div className="grow">
          <Field label="Search Students">
            <div style={{ position: 'relative' }}>
              <input 
                placeholder="Search by name, roll number, or email…" 
                value={q} 
                onChange={(e) => setQ(e.target.value)} 
              />
            </div>
          </Field>
        </div>

        <div style={{ minWidth: 200 }}>
          <Field label="Filter by Class / Course">
            <select value={course} onChange={(e) => setCourse(e.target.value)}>
              <option value="">All Classes ({all.length})</option>
              {courses.map((c) => (
                <option key={c} value={c}>
                  {c} ({all.filter((s) => s.course === c).length})
                </option>
              ))}
            </select>
          </Field>
        </div>
      </div>

      <Loading loading={loading} error={error} />

      {!loading && !error && (
        list.length === 0 ? (
          <Empty icon={Users}>No students found matching your filters. Add a new student to get started.</Empty>
        ) : (
          <div className="table-card">
            <div className="tablewrap">
              <table>
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Roll Number</th>
                    <th>Class / Course</th>
                    <th>Email Address</th>
                    <th>Guardian / Parent</th>
                    <th>Contact Phone</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((s) => {
                    const initials = (s.user.name || 'S').slice(0, 2).toUpperCase();
                    return (
                      <tr key={s._id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                              width: 34,
                              height: 34,
                              borderRadius: '50%',
                              background: 'var(--primary-soft)',
                              color: 'var(--primary)',
                              display: 'grid',
                              placeItems: 'center',
                              fontWeight: 700,
                              fontSize: 12
                            }}>
                              {initials}
                            </div>
                            <div>
                              <b>{s.user.name}</b>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span style={{ 
                            fontFamily: 'var(--font-mono)', 
                            fontWeight: 700,
                            padding: '3px 8px',
                            background: '#f1f5f9',
                            borderRadius: '4px',
                            fontSize: 12
                          }}>
                            {s.rollNo}
                          </span>
                        </td>
                        <td>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '3px 9px',
                            borderRadius: '99px',
                            fontSize: 12,
                            fontWeight: 600,
                            background: 'var(--cyan-soft)',
                            color: '#0284c7',
                            border: '1px solid var(--cyan-border)'
                          }}>
                            <BookOpen size={11} />
                            <span>{s.course}</span>
                          </span>
                        </td>
                        <td style={{ color: 'var(--ink-500)', fontSize: 13 }}>{s.user.email}</td>
                        <td>{s.guardianName || '—'}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{s.phone || '—'}</td>
                        <td className="actions">
                          <button className="btn ghost small" onClick={() => setEditing(s)}>
                            <Edit2 size={13} />
                            <span>Edit</span>
                          </button>
                          <button className="btn danger small" onClick={() => remove(s)}>
                            <Trash2 size={13} />
                            <span>Delete</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {editing && (
        <StudentForm 
          student={editing === 'new' ? null : editing} 
          onClose={() => setEditing(null)}
          onSaved={() => { 
            setEditing(null); 
            reload(); 
          }} 
        />
      )}
    </>
  );
}
