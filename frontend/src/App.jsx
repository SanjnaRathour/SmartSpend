import { Routes, Route, Navigate } from 'react-router-dom';
import AuthedLayout from './components/AuthedLayout.jsx';
import AdminLayout from './components/AdminLayout.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Transactions from './pages/Transactions.jsx';
import Forecast from './pages/Forecast.jsx';
import Alerts from './pages/Alerts.jsx';
import Budgets from './pages/Budgets.jsx';
import Profile from './pages/Profile.jsx';
import AdminOverview from './pages/admin/AdminOverview.jsx';
import AdminUsers from './pages/admin/AdminUsers.jsx';
import AdminAuditLogs from './pages/admin/AdminAuditLogs.jsx';
import AdminModel from './pages/admin/AdminModel.jsx';
import { isAdmin } from './api';

function Protected({ children }) {
  return localStorage.getItem('token') ? children : <Navigate to="/login" />;
}

function AdminOnly({ children }) {
  if (!localStorage.getItem('token')) return <Navigate to="/login" />;
  if (!isAdmin()) return <Navigate to="/" />;
  return children;
}

const userPages = [
  { path: '/',             el: <Dashboard /> },
  { path: '/transactions', el: <Transactions /> },
  { path: '/budgets',      el: <Budgets /> },
  { path: '/forecast',     el: <Forecast /> },
  { path: '/alerts',       el: <Alerts /> },
  { path: '/profile',      el: <Profile /> },
];

const adminPages = [
  { path: '/admin',        el: <AdminOverview /> },
  { path: '/admin/users',  el: <AdminUsers /> },
  { path: '/admin/audit',  el: <AdminAuditLogs /> },
  { path: '/admin/model',  el: <AdminModel /> },
];

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {userPages.map((p) => (
        <Route key={p.path} path={p.path}
               element={<Protected><AuthedLayout>{p.el}</AuthedLayout></Protected>} />
      ))}

      {adminPages.map((p) => (
        <Route key={p.path} path={p.path}
               element={<AdminOnly><AdminLayout>{p.el}</AdminLayout></AdminOnly>} />
      ))}
    </Routes>
  );
}
