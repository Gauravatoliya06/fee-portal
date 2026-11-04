import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from './auth.jsx';
import { SCHOOL_NAME } from './api.js';
import { 
  LayoutDashboard, Users, FileSpreadsheet, CreditCard, BarChart3, 
  UserCheck, LogOut, GraduationCap, ShieldCheck, Database 
} from 'lucide-react';

const ADMIN_NAV = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/students', label: 'Students', icon: Users },
  { to: '/admin/fees', label: 'Fee Structures', icon: FileSpreadsheet },
  { to: '/admin/payments', label: 'Payments', icon: CreditCard },
  { to: '/admin/reports', label: 'Reports & Dues', icon: BarChart3 },
  { to: '/admin/account', label: 'My Account', icon: UserCheck },
];

const STUDENT_NAV = [
  { to: '/me', label: 'My Fees & Receipts', icon: CreditCard, end: true },
  { to: '/me/account', label: 'Security & Account', icon: UserCheck },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const items = user.role === 'admin' ? ADMIN_NAV : STUDENT_NAV;
  const initial = (user.name || 'U').charAt(0).toUpperCase();

  return (
    <div className="shell">
      <aside className="side">
        <div className="side-header">
          <div className="brand-badge">
            <div className="brand-icon-box">
              <GraduationCap size={22} />
            </div>
            <div className="brand-text-col">
              <span className="brand-name" title={SCHOOL_NAME}>{SCHOOL_NAME}</span>
              <span className="brand-sub">{user.role === 'admin' ? 'Admin Portal' : 'Student Hub'}</span>
            </div>
          </div>
        </div>

        <nav aria-label="Main Navigation">
          <span className="nav-label">Menu</span>
          {items.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="side-footer">
          <div className="user-profile-card">
            <div className="user-avatar">{initial}</div>
            <div className="user-meta">
              <span className="user-name-text" title={user.name}>{user.name}</span>
              <span className="user-role-badge">
                <ShieldCheck size={12} color="#818cf8" />
                {user.role === 'admin' ? 'Accounts Admin' : `Student (${user.rollNo || 'Roll'})`}
              </span>
            </div>
          </div>

          <button
            className="btn-logout"
            onClick={() => {
              logout();
              nav('/login');
            }}
          >
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <main className="main">
        {/* Top live indicators */}
        <header className="top-header-strip">
          <div className="badge-live-pulse">
            <span className="pulse-dot"></span>
            <span>MongoDB Connected • Live System</span>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{
              fontSize: 12,
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: '99px',
              background: 'var(--bg-subtle)',
              color: 'var(--ink-700)',
              border: '1px solid var(--border)'
            }}>
              Session 2026-27
            </span>
            <span style={{
              fontSize: 12,
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: '99px',
              background: user.role === 'admin' ? 'var(--primary-soft)' : 'var(--emerald-soft)',
              color: user.role === 'admin' ? 'var(--primary)' : 'var(--emerald-dark)',
              border: user.role === 'admin' ? '1px solid #c7d2fe' : '1px solid var(--emerald-border)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}>
              {user.role}
            </span>
          </div>
        </header>

        <Outlet />
      </main>
    </div>
  );
}
