import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './auth.jsx';
import Layout from './Layout.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Students from './pages/Students.jsx';
import Fees from './pages/Fees.jsx';
import Payments from './pages/Payments.jsx';
import Reports from './pages/Reports.jsx';
import MyFees from './pages/MyFees.jsx';
import Account from './pages/Account.jsx';

function Guard({ role, children }) {
  const { user, ready } = useAuth();
  if (!ready) return <p className="boot">Loading…</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
}

function Home() {
  const { user, ready } = useAuth();
  if (!ready) return <p className="boot">Loading…</p>;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'admin' ? '/admin' : '/me'} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/admin" element={<Guard role="admin"><Layout /></Guard>}>
        <Route index element={<Dashboard />} />
        <Route path="students" element={<Students />} />
        <Route path="fees" element={<Fees />} />
        <Route path="payments" element={<Payments />} />
        <Route path="reports" element={<Reports />} />
        <Route path="account" element={<Account />} />
      </Route>
      <Route path="/me" element={<Guard role="student"><Layout /></Guard>}>
        <Route index element={<MyFees />} />
        <Route path="account" element={<Account />} />
      </Route>
      <Route path="*" element={<Home />} />
    </Routes>
  );
}
