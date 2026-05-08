import { useState } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar.jsx';

export default function AuthedLayout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <div className="hidden lg:block sticky top-0 h-screen">
        <Sidebar />
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40 lg:hidden"
               onClick={() => setMobileOpen(false)} />
          <div className="fixed inset-y-0 left-0 z-50 lg:hidden">
            <Sidebar onClose={() => setMobileOpen(false)} />
          </div>
        </>
      )}

      <div className="flex-1 min-w-0">
        <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur border-b border-slate-200 dark:border-slate-800">
          <button onClick={() => setMobileOpen(true)} className="btn-ghost p-2">
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-bold">SmartSpend</span>
          <div className="w-9" />
        </header>
        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">{children}</main>
      </div>
    </div>
  );
}
