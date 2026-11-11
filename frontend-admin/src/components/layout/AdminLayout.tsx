import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Layers,
  Boxes,
  Tag,
  LogOut,
  ExternalLink,
  Shield,
  Leaf,
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';

export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { adminUser, logout } = useAdminAuth();

  const navItems = [
    { path: '/dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
    { path: '/orders', label: 'Order Management', icon: Package },
    { path: '/products', label: 'Catalog & Products', icon: Layers },
    { path: '/inventory', label: 'Inventory Master', icon: Boxes },
    { path: '/coupons', label: 'Marketing & Coupons', icon: Tag },
  ];

  return (
    <div className="min-h-screen flex bg-admin-bg text-admin-dark">
      {/* Sidebar */}
      <aside className="w-64 bg-admin-sidebar text-slate-300 flex flex-col justify-between p-5 border-r border-slate-800">
        <div className="space-y-8">
          {/* Brand Logo */}
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <Leaf className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-white text-base tracking-tight">AuraPure Control</h2>
              <span className="text-[10px] text-slate-400 block -mt-0.5">Admin Operations Hub</span>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="pt-6 border-t border-slate-800 space-y-3">
          <a
            href="http://localhost:3000"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors"
          >
            <span>View Live Storefront</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <div className="p-3 rounded-xl bg-slate-800/60 flex items-center justify-between">
            <div className="truncate pr-2">
              <span className="text-xs font-bold text-white block truncate">{adminUser?.name}</span>
              <span className="text-[10px] text-emerald-400 uppercase font-semibold">{adminUser?.role}</span>
            </div>
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-700/50 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="h-16 bg-white border-b border-admin-border px-8 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-admin-muted font-medium">
            <Shield className="w-4 h-4 text-emerald-600" />
            <span>Secure Admin Enclave • 256-bit Authenticated Session</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase tracking-wider">
              Live Gateway Active
            </span>
          </div>
        </header>

        <main className="p-8 flex-1">{children}</main>
      </div>
    </div>
  );
};
