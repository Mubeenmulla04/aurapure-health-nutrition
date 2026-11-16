import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Boxes,
  Users,
  Tag,
  CreditCard,
  BarChart3,
  SlidersHorizontal,
  Star,
  Shield,
  Settings,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Bell,
  LogOut,
  ExternalLink,
  Search,
  Sparkles,
  Calendar,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { Breadcrumbs } from '../common/Breadcrumbs';

export interface NavItemConfig {
  path: string;
  aliases?: string[];
  label: string;
  icon: React.ElementType;
  badge?: string;
  allowedRoles?: string[];
}

export interface NavGroupConfig {
  title: string;
  items: NavItemConfig[];
}

/**
 * 12-Section Approved Navigation Structure:
 * MAIN MENU: Dashboard, Orders, Products, Inventory, Customers, Marketing, Payments, Reports
 * STORE MANAGEMENT: Homepage & Content, Reviews
 * SYSTEM: Staff & Permissions, Settings
 */
const navGroups: NavGroupConfig[] = [
  {
    title: 'Main Menu',
    items: [
      {
        path: '/dashboard',
        label: 'Dashboard',
        icon: LayoutDashboard,
        allowedRoles: ['super_admin', 'admin', 'order_manager', 'product_manager', 'inventory_manager', 'support_manager', 'marketing_manager'],
      },
      {
        path: '/orders',
        aliases: ['/shipments'],
        label: 'Orders',
        icon: ShoppingBag,
        allowedRoles: ['super_admin', 'admin', 'order_manager', 'support_manager'],
      },
      {
        path: '/products',
        label: 'Products',
        icon: Package,
        allowedRoles: ['super_admin', 'admin', 'product_manager'],
      },
      {
        path: '/inventory',
        label: 'Inventory',
        icon: Boxes,
        allowedRoles: ['super_admin', 'admin', 'inventory_manager', 'product_manager'],
      },
      {
        path: '/customers',
        label: 'Customers',
        icon: Users,
        allowedRoles: ['super_admin', 'admin', 'order_manager', 'support_manager'],
      },
      {
        path: '/marketing',
        aliases: ['/coupons'],
        label: 'Marketing',
        icon: Tag,
        allowedRoles: ['super_admin', 'admin', 'marketing_manager'],
      },
      {
        path: '/payments',
        aliases: ['/refunds', '/invoices'],
        label: 'Payments',
        icon: CreditCard,
        allowedRoles: ['super_admin', 'admin', 'order_manager'],
      },
      {
        path: '/reports',
        label: 'Reports',
        icon: BarChart3,
        allowedRoles: ['super_admin', 'admin', 'order_manager', 'marketing_manager', 'inventory_manager'],
      },
    ],
  },
  {
    title: 'Store Management',
    items: [
      {
        path: '/content',
        aliases: ['/content/slides', '/content/banners', '/content/faqs', '/content/pages', '/categories'],
        label: 'Homepage & Content',
        icon: SlidersHorizontal,
        allowedRoles: ['super_admin', 'admin', 'marketing_manager'],
      },
      {
        path: '/reviews',
        label: 'Reviews',
        icon: Star,
        allowedRoles: ['super_admin', 'admin', 'support_manager', 'marketing_manager'],
      },
    ],
  },
  {
    title: 'System',
    items: [
      {
        path: '/settings/staff',
        label: 'Staff & Permissions',
        icon: Shield,
        allowedRoles: ['super_admin', 'admin'],
      },
      {
        path: '/settings',
        aliases: ['/settings/store', '/settings/audit-logs', '/settings/notifications'],
        label: 'Settings',
        icon: Settings,
        allowedRoles: ['super_admin', 'admin'],
      },
    ],
  },
];

export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { adminUser, logout, hasRole } = useAdminAuth();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Format today's date cleanly e.g., "Mon, 16 Nov 2026"
  const formattedToday = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  // Filter navigation items by role
  const filteredNavGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (!item.allowedRoles) return true;
        return hasRole(item.allowedRoles);
      }),
    }))
    .filter((group) => group.items.length > 0);

  const isItemActive = (item: NavItemConfig) => {
    if (item.path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    if (location.pathname.startsWith(item.path)) {
      return true;
    }
    if (item.aliases?.some((alias) => location.pathname.startsWith(alias))) {
      return true;
    }
    return false;
  };

  const handleGlobalSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim().toLowerCase();
    if (!query) return;

    if (query.includes('order') || query.startsWith('ap-') || query.startsWith('ord')) {
      navigate(`/orders?search=${encodeURIComponent(query)}`);
    } else if (query.includes('product') || query.includes('protein') || query.includes('creatine')) {
      navigate(`/products?search=${encodeURIComponent(query)}`);
    } else if (query.includes('customer') || query.includes('user')) {
      navigate(`/customers?search=${encodeURIComponent(query)}`);
    } else if (query.includes('coupon') || query.includes('discount')) {
      navigate('/marketing');
    } else if (query.includes('inventory') || query.includes('stock')) {
      navigate('/inventory');
    } else if (query.includes('setting')) {
      navigate('/settings');
    } else {
      navigate(`/orders?search=${encodeURIComponent(query)}`);
    }
    setSearchQuery('');
  };

  const sidebarContent = (isMobile = false) => (
    <div className="flex flex-col h-full bg-white text-slate-700 border-r border-slate-200/90 select-none">
      {/* Brand Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-slate-100 flex-shrink-0 bg-white">
        <Link
          to="/dashboard"
          onClick={() => isMobile && setIsMobileMenuOpen(false)}
          className="flex items-center gap-3 overflow-hidden group"
        >
          <div className="w-9 h-9 rounded-xl bg-teal-700 text-white flex items-center justify-center font-bold flex-shrink-0 shadow-xs group-hover:bg-teal-800 transition-colors">
            <Sparkles className="w-5 h-5 text-teal-100" />
          </div>
          {(!isCollapsed || isMobile) && (
            <div className="min-w-0">
              <h2 className="font-bold text-slate-900 text-sm tracking-tight truncate leading-tight">
                AuraPure
              </h2>
              <span className="text-[11px] font-medium text-slate-500 block truncate -mt-0.5">
                Admin Panel
              </span>
            </div>
          )}
        </Link>

        {isMobile && (
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav Groups Scrollable Area */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-5">
        {filteredNavGroups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            {(!isCollapsed || isMobile) && (
              <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                {group.title}
              </span>
            )}

            {group.items.map((item) => {
              const Icon = item.icon;
              const active = isItemActive(item);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => isMobile && setIsMobileMenuOpen(false)}
                  title={isCollapsed && !isMobile ? item.label : undefined}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                    active
                      ? 'bg-teal-50 text-teal-900 font-semibold border-l-3 border-teal-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 flex-shrink-0 transition-colors ${
                      active ? 'text-teal-700' : 'text-slate-500'
                    }`}
                  />
                  {(!isCollapsed || isMobile) && <span className="truncate">{item.label}</span>}
                  {item.badge && (!isCollapsed || isMobile) && (
                    <span className="ml-auto px-1.5 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-600">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* Bottom Profile & External Link */}
      <div className="p-3 border-t border-slate-100 space-y-2 flex-shrink-0 bg-slate-50/70">
        <a
          href="http://localhost:3000"
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-teal-800 hover:bg-white transition-colors border border-transparent hover:border-slate-200"
          title="Open customer storefront in a new tab"
        >
          {(!isCollapsed || isMobile) && <span className="truncate">View Customer Store</span>}
          <ExternalLink className="w-3.5 h-3.5 flex-shrink-0 ml-auto text-slate-400" />
        </a>

        {/* Staff Identity Box */}
        <div className="p-2.5 rounded-lg bg-white border border-slate-200/90 flex items-center justify-between gap-2.5 shadow-2xs">
          <div className="w-8 h-8 rounded-lg bg-teal-700 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
            {adminUser?.name?.charAt(0).toUpperCase() || 'A'}
          </div>

          {(!isCollapsed || isMobile) && (
            <div className="min-w-0 flex-1">
              <span className="text-xs font-semibold text-slate-900 block truncate leading-tight">
                {adminUser?.name || 'Administrator'}
              </span>
              <span className="text-[10px] text-teal-700 font-medium uppercase tracking-wide block truncate">
                {adminUser?.role?.replace('_', ' ') || 'Super Admin'}
              </span>
            </div>
          )}

          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors flex-shrink-0"
            title="Sign Out"
            aria-label="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900 font-sans antialiased">
      {/* Desktop Persistent Left Sidebar */}
      <aside
        className={`hidden md:block transition-all duration-200 flex-shrink-0 z-30 sticky top-0 h-screen ${
          isCollapsed ? 'w-[72px]' : 'w-64'
        }`}
      >
        {sidebarContent(false)}
      </aside>

      {/* Mobile Slide-Over Sidebar Drawer (Portaled to document.body) */}
      {isMobileMenuOpen &&
        createPortal(
          <div className="fixed inset-0 z-[100] md:hidden">
            <div
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-2xs transition-opacity"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] h-[100dvh] shadow-xl z-10 flex flex-col">
              {sidebarContent(true)}
            </div>
          </div>,
          document.body
        )}

      {/* Main App Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Operational Header Bar */}
        <header className="h-16 bg-white border-b border-slate-200/90 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 sticky top-0 z-20">
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile Hamburger Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 -ml-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Desktop Collapse / Expand Toggle */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden md:flex p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-label="Toggle sidebar collapse"
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>

            {/* Store Title & Breadcrumbs */}
            <div className="hidden sm:block min-w-0">
              <span className="text-xs font-semibold text-slate-900 block truncate">
                AuraPure Health & Nutrition
              </span>
              <div className="text-[11px] text-slate-500">
                <Breadcrumbs />
              </div>
            </div>
          </div>

          {/* Center Search Bar */}
          <form
            onSubmit={handleGlobalSearch}
            className="hidden md:flex items-center flex-1 max-w-md mx-4 relative"
          >
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search orders, products, customers..."
              className="w-full pl-9 pr-4 py-1.5 bg-slate-50 hover:bg-slate-100 focus:bg-white text-xs border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-600 focus:border-teal-600 transition-all"
            />
          </form>

          {/* Right Header Utilities */}
          <div className="flex items-center gap-2.5 sm:gap-3 flex-shrink-0">
            {/* Today's Date */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-[11px] font-medium border border-slate-200/60">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>{formattedToday}</span>
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors relative"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="w-2 h-2 rounded-full bg-teal-600 absolute top-2 right-2 ring-2 ring-white" />
              </button>

              {/* Notifications Dropdown */}
              {isNotificationsOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 p-4 space-y-3 z-50 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-900">Notifications</span>
                    <button
                      onClick={() => setIsNotificationsOpen(false)}
                      className="text-[10px] text-teal-700 font-semibold hover:underline"
                    >
                      Close
                    </button>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-teal-50/60 border border-teal-100 space-y-0.5">
                      <div className="flex items-center gap-1.5 text-teal-900 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-teal-700" />
                        <span>System Operational</span>
                      </div>
                      <p className="text-[11px] text-teal-800">
                        Orders and payment reconciliations are active and synced.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Admin User Avatar & Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors text-left"
              >
                <div className="w-7 h-7 rounded-lg bg-teal-700 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                  {adminUser?.name?.charAt(0).toUpperCase() || 'A'}
                </div>
                <div className="hidden sm:block leading-tight">
                  <span className="text-xs font-semibold text-slate-900 block truncate max-w-[110px]">
                    {adminUser?.name || 'Admin'}
                  </span>
                  <span className="text-[10px] text-slate-500 uppercase font-medium">
                    {adminUser?.role?.replace('_', ' ') || 'Super Admin'}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-50 animate-in fade-in duration-150">
                  <div className="px-4 py-2 border-b border-slate-100 sm:hidden">
                    <span className="text-xs font-semibold text-slate-900 block truncate">
                      {adminUser?.name || 'Admin'}
                    </span>
                    <span className="text-[10px] text-teal-700 uppercase font-medium">
                      {adminUser?.role?.replace('_', ' ')}
                    </span>
                  </div>

                  <Link
                    to="/settings"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="block px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                  >
                    Store Settings
                  </Link>
                  <Link
                    to="/settings/staff"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="block px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                  >
                    Staff & Permissions
                  </Link>

                  <div className="my-1 border-t border-slate-100" />

                  <button
                    onClick={() => {
                      logout();
                      navigate('/login');
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dynamic Page Workspace Content */}
        <main className="p-4 sm:p-6 lg:p-8 flex-1">{children}</main>
      </div>
    </div>
  );
};
