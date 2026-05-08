import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Shield, LayoutDashboard, Users, ScrollText, ArrowLeft, LogOut,
  Moon, Sun, Menu, X, Brain,
} from 'lucide-react';
import { useTheme } from '../theme.jsx';

const ADMIN_NAV = [
  { to: '/admin',         label: 'Overview',    icon: LayoutDashboard, end: true },
  { to: '/admin/users',   label: 'Users',       icon: Users },
  { to: '/admin/audit',   label: 'Audit Logs',  icon: ScrollText },
  { to: '/admin/model',   label: 'ML Model',    icon: Brain },
];

function AdminSidebar({ onClose }) {
  const nav = useNavigate();
  const { theme, toggle } = useTheme();
  const logout = () => {
    localStorage.removeItem('token');
    nav('/login');
  };

  const linkCls = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
      isActive
        ? 'bg-amber-500 text-white shadow-md'
        : 'text-slate-300 hover:bg-slate-800'
    }`;

  return (
    <aside className="flex flex-col h-full bg-slate-900 border-r border-slate-800 w-64 p-4 text-slate-100">
      <div className="flex items-center justify-between gap-2 mb-8 px-2">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-lg leading-tight">Admin</p>
            <p className="text-xs text-amber-500 leading-tight">SmartSpend Console</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="lg:hidden text-slate-400">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <nav className="flex flex-col gap-1 flex-1">
        {ADMIN_NAV.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end}
                   className={linkCls} onClick={onClose}>
            <item.icon className="w-4 h-4" /> {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="flex flex-col gap-2 pt-4 border-t border-slate-800">
        <NavLink to="/" className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800">
          <ArrowLeft className="w-4 h-4" /> Back to app
        </NavLink>
        <button onClick={toggle}
                className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800">
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
        </button>
        <button onClick={logout}
                className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-950/40">
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </div>
    </aside>
  );
}

export default function AdminLayout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="hidden lg:block sticky top-0 h-screen">
        <AdminSidebar />
      </div>

      {mobileOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
          <div className="fixed inset-y-0 left-0 z-50 lg:hidden">
            <AdminSidebar onClose={() => setMobileOpen(false)} />
          </div>
        </>
      )}

      <div className="flex-1 min-w-0">
        <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between p-4 bg-slate-900 text-slate-100 border-b border-slate-800">
          <button onClick={() => setMobileOpen(true)} className="p-2 hover:bg-slate-800 rounded-lg">
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-bold flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-500" /> Admin
          </span>
          <div className="w-9" />
        </header>
        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">{children}</main>
      </div>
    </div>
  );
}
