import { NavLink, useNavigate } from 'react-router-dom';
import { Wallet, LayoutDashboard, ListTree, TrendingUp, LogOut, Moon, Sun, X, Shield, Target, User, ShieldAlert } from 'lucide-react';
import { useTheme } from '../theme.jsx';
import { isAdmin } from '../api';

const BASE_NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/transactions', label: 'Transactions', icon: ListTree },
  { to: '/budgets', label: 'Budgets', icon: Target },
  { to: '/forecast', label: 'Forecast', icon: TrendingUp },
  { to: '/alerts', label: 'Alerts', icon: ShieldAlert },
  { to: '/profile', label: 'Profile', icon: User },
];
// Admin gets a single "Admin Console" link that takes them to the separate admin layout
const ADMIN_NAV = [{ to: '/admin', label: 'Admin Console', icon: Shield }];

export default function Sidebar({ onClose }) {
  const nav = useNavigate();
  const { theme, toggle } = useTheme();
  const logout = () => {
    localStorage.removeItem('token');
    nav('/login');
  };

  const linkCls = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
      isActive
        ? 'bg-brand-600 text-white shadow-md'
        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
    }`;

  return (
    <aside className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 w-64 p-4">
      <div className="flex items-center justify-between gap-2 mb-8 px-2">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-gradient-to-br from-brand-500 to-brand-700 rounded-lg flex items-center justify-center">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg">SmartSpend</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="lg:hidden text-slate-500">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <nav className="flex flex-col gap-1 flex-1">
        {BASE_NAV.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end}
                   className={linkCls} onClick={onClose}>
            <item.icon className="w-4 h-4" /> {item.label}
          </NavLink>
        ))}
        {isAdmin() && ADMIN_NAV.map((item) => (
          <NavLink key={item.to} to={item.to} className={linkCls} onClick={onClose}>
            <item.icon className="w-4 h-4" /> {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="flex flex-col gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
        <button onClick={toggle} className="btn-ghost justify-start gap-3">
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
        </button>
        <button onClick={logout}
                className="btn-ghost justify-start gap-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40">
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </div>
    </aside>
  );
}
