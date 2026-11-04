import { useCallback, useEffect, useState } from 'react';
import { api } from './api.js';
import { 
  CheckCircle2, Clock, AlertCircle, AlertTriangle, X, Loader2, 
  HelpCircle, Sparkles, FolderOpen 
} from 'lucide-react';
import confetti from 'canvas-confetti';

export function fireConfetti() {
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#4f46e5', '#10b981', '#f59e0b', '#3b82f6', '#ec4899']
  });
}

export function useLoad(path) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  
  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api(path);
      setData(res);
      setError('');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, error, loading, reload };
}

export const Status = ({ fee }) => {
  const isOverdue = fee.overdue || (fee.status !== 'paid' && new Date(fee.dueDate) < new Date());
  const key = isOverdue ? 'overdue' : fee.status;

  const config = {
    paid: { label: 'Paid in Full', icon: CheckCircle2, cls: 'paid' },
    partial: { label: 'Partially Paid', icon: Clock, cls: 'partial' },
    pending: { label: 'Payment Pending', icon: Clock, cls: 'pending' },
    overdue: { label: 'Payment Overdue', icon: AlertCircle, cls: 'overdue' },
  }[key] || { label: fee.status, icon: HelpCircle, cls: 'pending' };

  const Icon = config.icon;

  return (
    <span className={`pill ${config.cls}`}>
      <Icon size={13} strokeWidth={2.5} />
      <span>{config.label}</span>
    </span>
  );
};

export function Modal({ title, onClose, children }) {
  // Close on Escape key
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="scrim" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-h">
          <h2>{title}</h2>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export const Field = ({ label, children, hint }) => (
  <label className="field">
    <span>{label}</span>
    {children}
    {hint && <small style={{ color: 'var(--ink-500)', fontSize: 11 }}>{hint}</small>}
  </label>
);

export const Msg = ({ error, ok }) => {
  if (error) {
    return (
      <div className="msg err" role="alert">
        <AlertCircle size={16} style={{ flexShrink: 0 }} />
        <span>{error}</span>
      </div>
    );
  }
  if (ok) {
    return (
      <div className="msg ok" role="status">
        <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
        <span>{ok}</span>
      </div>
    );
  }
  return null;
};

export const Empty = ({ children, icon: Icon = FolderOpen }) => (
  <div className="empty">
    <div style={{
      width: 44,
      height: 44,
      borderRadius: '50%',
      background: 'var(--bg-subtle)',
      display: 'grid',
      placeItems: 'center',
      color: 'var(--ink-400)',
      marginBottom: 4
    }}>
      <Icon size={22} />
    </div>
    <p style={{ margin: 0 }}>{children}</p>
  </div>
);

export const Loading = ({ loading, error }) => {
  if (loading) {
    return (
      <div className="empty" style={{ border: 'none', background: 'transparent' }}>
        <Loader2 size={26} className="spin" style={{ animation: 'spin 1s linear infinite', color: 'var(--primary)' }} />
        <span style={{ color: 'var(--ink-500)', fontSize: 13, fontWeight: 500 }}>Fetching latest records…</span>
        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }
  if (error) {
    return <Msg error={error} />;
  }
  return null;
};
