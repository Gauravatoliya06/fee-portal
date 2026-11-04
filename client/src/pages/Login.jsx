import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { api, SCHOOL_NAME } from '../api.js';
import { Field, Msg } from '../ui.jsx';
import { 
  GraduationCap, ArrowRight, ArrowLeft, Sparkles, 
  KeyRound, Mail, CheckCircle2, RefreshCw, Lock 
} from 'lucide-react';

export default function Login() {
  const { user, login } = useAuth();
  const nav = useNavigate();

  // Mode: 'login' | 'forgot'
  const [mode, setMode] = useState('login');

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [busy, setBusy] = useState(false);

  // Forgot password flow state: 1 (Enter Email) | 2 (Enter OTP & New Password)
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [forgotBusy, setForgotBusy] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');

  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : '/me'} replace />;

  async function handleLogin(e) {
    if (e) e.preventDefault();
    setBusy(true); 
    setError('');
    setSuccessMsg('');
    try {
      const u = await login(email, password);
      nav(u.role === 'admin' ? '/admin' : '/me');
    } catch (err) { 
      setError(err.message); 
    } finally { 
      setBusy(false); 
    }
  }

  function setDemoCredentials(demoEmail, demoPassword) {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
    setSuccessMsg('');
  }

  // Step 1: Send OTP to Registered College Email
  async function handleRequestOtp(e) {
    e.preventDefault();
    setForgotBusy(true);
    setForgotError('');
    setForgotSuccess('');

    try {
      const res = await api('/auth/forgot-password', {
        method: 'POST',
        body: { email: forgotEmail },
      });

      setForgotSuccess(res.message);
      if (res.devOtp) setDevOtp(res.devOtp);
      setForgotStep(2);
    } catch (err) {
      setForgotError(err.message);
    } finally {
      setForgotBusy(false);
    }
  }

  // Step 2: Submit OTP & Set New Password
  async function handleResetPassword(e) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setForgotError('New passwords do not match. Please verify.');
      return;
    }
    if (newPassword.length < 8) {
      setForgotError('New password must be at least 8 characters long.');
      return;
    }

    setForgotBusy(true);
    setForgotError('');

    try {
      const res = await api('/auth/reset-password', {
        method: 'POST',
        body: {
          email: forgotEmail,
          otp: otp.trim(),
          newPassword,
        },
      });

      // Switch back to login view with updated email prefilled
      setEmail(forgotEmail);
      setPassword('');
      setSuccessMsg(res.message);
      setMode('login');
      setForgotStep(1);
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
      setDevOtp('');
    } catch (err) {
      setForgotError(err.message);
    } finally {
      setForgotBusy(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand-header">
          <div className="login-logo-circle">
            <GraduationCap size={28} />
          </div>
          <h1>{SCHOOL_NAME}</h1>
          <p className="sub" style={{ margin: '4px 0 0' }}>
            Fee Management & Financial Settlement Portal
          </p>
        </div>

        {mode === 'login' ? (
          <>
            {/* Quick Demo Autofill Chips */}
            <div className="demo-account-box">
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={14} color="#6366f1" />
                <span className="demo-account-title">1-Click Demo Profiles</span>
              </div>
              <div className="demo-chips">
                <button
                  type="button"
                  className="demo-chip"
                  onClick={() => setDemoCredentials('admin@school.test', 'ChangeMe123')}
                >
                  🛡️ Admin Office
                </button>
                <button
                  type="button"
                  className="demo-chip"
                  onClick={() => setDemoCredentials('aarav@example.test', 'S-1001')}
                >
                  🎓 Aarav (Class 10)
                </button>
                <button
                  type="button"
                  className="demo-chip"
                  onClick={() => setDemoCredentials('diya@example.test', 'S-1002')}
                >
                  🎓 Diya (Class 10)
                </button>
                <button
                  type="button"
                  className="demo-chip"
                  onClick={() => setDemoCredentials('kabir@example.test', 'S-1003')}
                >
                  🎓 Kabir (Class 9)
                </button>
              </div>
            </div>

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Field label="Registered College Email Address">
                <div style={{ position: 'relative' }}>
                  <input 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    placeholder="e.g. aarav@example.test or admin@school.test"
                    required 
                    autoFocus 
                  />
                </div>
              </Field>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-800)' }}>Password</label>
                  <button 
                    type="button" 
                    className="forgot-link-btn" 
                    onClick={() => {
                      setMode('forgot');
                      setForgotEmail(email);
                      setForgotError('');
                      setForgotSuccess('');
                    }}
                  >
                    Forgot Password?
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    placeholder="••••••••"
                    required 
                  />
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink-400)', marginTop: 4 }}>
                  Students: your initial password is your roll number (e.g. S-1001)
                </div>
              </div>

              <Msg error={error} ok={successMsg} />

              <button className="btn" disabled={busy} style={{ width: '100%', padding: '12px' }}>
                <span>{busy ? 'Authenticating…' : 'Sign In to Portal'}</span>
                <ArrowRight size={16} />
              </button>
            </form>
          </>
        ) : (
          /* Forgot Password Flow */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 18, color: 'var(--ink-900)' }}>Reset Account Password</h3>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--ink-500)' }}>
                {forgotStep === 1 
                  ? 'Enter your registered college email to receive a 6-digit verification code.'
                  : `Enter the 6-digit verification code sent to ${forgotEmail}.`}
              </p>
            </div>

            {forgotStep === 1 ? (
              /* Step 1: Request OTP Form */
              <form onSubmit={handleRequestOtp} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <Field 
                  label="Registered College Email" 
                  hint="Institutional email ID registered with your student admission profile"
                >
                  <div style={{ position: 'relative' }}>
                    <input 
                      type="email" 
                      value={forgotEmail} 
                      onChange={(e) => setForgotEmail(e.target.value)} 
                      placeholder="e.g. aarav@example.test"
                      required 
                      autoFocus 
                    />
                  </div>
                </Field>

                <Msg error={forgotError} ok={forgotSuccess} />

                <button className="btn" disabled={forgotBusy} style={{ width: '100%', padding: '12px' }}>
                  <span>{forgotBusy ? 'Sending Verification Code…' : 'Send 6-Digit Code'}</span>
                  <Mail size={16} />
                </button>

                <div style={{ textAlign: 'center', marginTop: 4 }}>
                  <button 
                    type="button" 
                    className="text-btn" 
                    onClick={() => {
                      setMode('login');
                      setForgotError('');
                    }}
                  >
                    <ArrowLeft size={14} />
                    <span>Back to Sign In</span>
                  </button>
                </div>
              </form>
            ) : (
              /* Step 2: Verification Code & Set New Password */
              <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {devOtp && (
                  <div className="dev-otp-banner">
                    <div>
                      <div style={{ fontWeight: 700 }}>✨ Demo Verification Code</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 800 }}>{devOtp}</div>
                    </div>
                    <button 
                      type="button" 
                      className="btn small ghost"
                      style={{ background: '#fff', borderColor: '#86efac' }}
                      onClick={() => setOtp(devOtp)}
                    >
                      Auto-fill Code
                    </button>
                  </div>
                )}

                <Field label="6-Digit Verification Code">
                  <input 
                    type="text" 
                    maxLength={6} 
                    value={otp} 
                    onChange={(e) => setOtp(e.target.value)} 
                    placeholder="••••••"
                    className="otp-mono-input"
                    required 
                    autoFocus 
                  />
                </Field>

                <Field label="New Password" hint="Minimum 8 characters">
                  <input 
                    type="password" 
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)} 
                    placeholder="Enter new password"
                    minLength={8}
                    required 
                  />
                </Field>

                <Field label="Confirm New Password">
                  <input 
                    type="password" 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                    placeholder="Re-enter new password"
                    minLength={8}
                    required 
                  />
                </Field>

                <Msg error={forgotError} ok={forgotSuccess} />

                <button className="btn" disabled={forgotBusy} style={{ width: '100%', padding: '12px' }}>
                  <span>{forgotBusy ? 'Resetting Password…' : 'Save New Password & Sign In'}</span>
                  <CheckCircle2 size={16} />
                </button>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                  <button 
                    type="button" 
                    className="text-btn" 
                    onClick={() => {
                      setForgotStep(1);
                      setForgotError('');
                    }}
                  >
                    <ArrowLeft size={14} />
                    <span>Change Email</span>
                  </button>

                  <button 
                    type="button" 
                    className="text-btn" 
                    onClick={handleRequestOtp}
                    disabled={forgotBusy}
                  >
                    <RefreshCw size={13} />
                    <span>Resend Code</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--ink-400)', paddingTop: 6 }}>
          End-to-End Secure • JWT Role Guaranteed • MongoDB Powered
        </div>
      </div>
    </div>
  );
}
