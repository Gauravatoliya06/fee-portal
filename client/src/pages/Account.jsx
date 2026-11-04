import { useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { Field, Msg } from '../ui.jsx';
import { KeyRound, ShieldCheck, UserCheck, Lock } from 'lucide-react';

export default function Account() {
  const { user } = useAuth();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '' });
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError(''); 
    setOk('');
    try {
      await api('/auth/change-password', { method: 'POST', body: form });
      setOk('Your password was updated successfully.');
      setForm({ currentPassword: '', newPassword: '' });
    } catch (err) { 
      setError(err.message); 
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <h1>Security & Profile Settings</h1>
      <p className="sub">Manage credentials, authentication password, and active portal session.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 480px)', gap: 20 }}>
        {/* Profile Card */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '22px 24px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: 'var(--primary-gradient)',
              color: '#fff',
              display: 'grid',
              placeItems: 'center',
              fontWeight: 800,
              fontSize: 18
            }}>
              {(user.name || 'U').charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 17 }}>{user.name}</h3>
              <span style={{ fontSize: 13, color: 'var(--ink-500)' }}>{user.email}</span>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 12,
            background: 'var(--bg-subtle)',
            padding: '12px 14px',
            borderRadius: 'var(--radius-md)',
            fontSize: 13
          }}>
            <div>
              <span style={{ color: 'var(--ink-400)', textTransform: 'uppercase', fontSize: 11, fontWeight: 700 }}>
                Role Permission
              </span>
              <div style={{ fontWeight: 600, color: 'var(--ink-800)', textTransform: 'capitalize' }}>
                {user.role}
              </div>
            </div>
            <div>
              <span style={{ color: 'var(--ink-400)', textTransform: 'uppercase', fontSize: 11, fontWeight: 700 }}>
                Identifier
              </span>
              <div style={{ fontWeight: 600, color: 'var(--ink-800)' }}>
                {user.rollNo || 'Staff ID'}
              </div>
            </div>
          </div>
        </div>

        {/* Change Password Slip */}
        <form className="slip" onSubmit={submit}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <KeyRound size={20} color="var(--primary)" />
            <h3 style={{ margin: 0, fontSize: 16 }}>Update Account Password</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Current Existing Password">
              <input 
                type="password" 
                value={form.currentPassword} 
                onChange={set('currentPassword')} 
                placeholder="••••••••" 
                required 
              />
            </Field>

            <Field label="New Secure Password" hint="Must be at least 8 characters long">
              <input 
                type="password" 
                value={form.newPassword} 
                onChange={set('newPassword')} 
                placeholder="••••••••" 
                minLength={8} 
                required 
              />
            </Field>

            <Msg error={error} ok={ok} />

            <div style={{ marginTop: 6 }}>
              <button className="btn" disabled={busy}>
                <Lock size={15} />
                <span>{busy ? 'Updating Password…' : 'Save New Password'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}
