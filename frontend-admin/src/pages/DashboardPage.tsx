import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  IndianRupee,
  ShoppingBag,
  Clock,
  CheckCircle2,
  Users,
  AlertTriangle,
  ArrowRight,
  Plus,
  Package,
  Boxes,
  Tag,
  SlidersHorizontal,
  ChevronRight,
  TrendingUp,
  RotateCcw,
  Truck,
  Eye,
  Calendar,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { dashboardApi, DashboardData } from '../services/adminApi';
import { StatCard } from '../components/common/StatCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { useToast } from '../components/common/Toast';
import { useAdminAuth } from '../context/AdminAuthContext';

export const DashboardPage: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { adminUser } = useAdminAuth();

  const [range, setRange] = useState<'7d' | '30d' | '1y'>('7d');
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Time-based greeting (e.g. Good morning / afternoon / evening)
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const fetchDashboard = async (selectedRange = range) => {
    try {
      setIsLoading(true);
      const res = await dashboardApi.getOverview(selectedRange);
      setData(res);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to load dashboard metrics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard(range);
  }, [range]);

  const kpi = data?.kpi;

  // Map order status distribution into actionable buckets
  const statusCounts = useMemo(() => {
    const map: Record<string, number> = {};
    data?.orderStatusDistribution?.forEach((item) => {
      map[item.status] = item.count;
    });
    return map;
  }, [data?.orderStatusDistribution]);

  // Actionable Order Buckets
  const orderBuckets = [
    {
      label: 'New Orders',
      count: statusCounts['PENDING'] || 0,
      path: '/orders?status=PENDING',
      color: 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100/70',
      badgeColor: 'bg-amber-500 text-white',
      desc: 'Awaiting confirmation',
    },
    {
      label: 'Payment Pending',
      count: statusCounts['CONFIRMED'] || 0,
      path: '/orders?status=CONFIRMED',
      color: 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100/70',
      badgeColor: 'bg-blue-500 text-white',
      desc: 'Confirmed, payment pending',
    },
    {
      label: 'Processing',
      count: statusCounts['PROCESSING'] || 0,
      path: '/orders?status=PROCESSING',
      color: 'bg-indigo-50 text-indigo-800 border-indigo-200 hover:bg-indigo-100/70',
      badgeColor: 'bg-indigo-500 text-white',
      desc: 'Packing & preparing',
    },
    {
      label: 'Ready to Ship',
      count: statusCounts['PACKED'] || 0,
      path: '/orders?status=PACKED',
      color: 'bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100/70',
      badgeColor: 'bg-purple-500 text-white',
      desc: 'AWB generated',
    },
    {
      label: 'Shipped',
      count: statusCounts['SHIPPED'] || 0,
      path: '/orders?status=SHIPPED',
      color: 'bg-sky-50 text-sky-800 border-sky-200 hover:bg-sky-100/70',
      badgeColor: 'bg-sky-500 text-white',
      desc: 'In transit with courier',
    },
    {
      label: 'Return / Refund',
      count: (kpi?.refundRequests || 0) + (statusCounts['RETURN_REQUESTED'] || 0),
      path: '/payments?tab=refunds',
      color: 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100/70',
      badgeColor: 'bg-rose-500 text-white',
      desc: 'Requires inspection',
    },
  ];

  // Quick Action Shortcuts
  const quickActions = [
    {
      label: 'Add New Product',
      icon: Plus,
      path: '/products',
      color: 'bg-teal-50 text-teal-700 hover:bg-teal-100/80 border-teal-200',
    },
    {
      label: 'View All Orders',
      icon: ShoppingBag,
      path: '/orders',
      color: 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200',
    },
    {
      label: 'Update Stock Levels',
      icon: Boxes,
      path: '/inventory',
      color: 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200',
    },
    {
      label: 'Create Discount Coupon',
      icon: Tag,
      path: '/marketing',
      color: 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200',
    },
    {
      label: 'Manage Homepage Content',
      icon: SlidersHorizontal,
      path: '/content',
      color: 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200',
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-8">
      {/* 1. Header: Greeting & Quick Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {greeting}, {adminUser?.name?.split(' ')[0] || 'Store Owner'}!
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Here is your AuraPure Health & Nutrition store overview and daily operations summary.
          </p>
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium hidden sm:inline">Sales Period:</span>
          <div className="inline-flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-medium">
            <button
              onClick={() => setRange('7d')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                range === '7d'
                  ? 'bg-white text-teal-800 font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setRange('30d')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                range === '30d'
                  ? 'bg-white text-teal-800 font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              30 Days
            </button>
            <button
              onClick={() => setRange('1y')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                range === '1y'
                  ? 'bg-white text-teal-800 font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              1 Year
            </button>
          </div>
        </div>
      </div>

      {/* 2. Business Overview — 5 Essential KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
        <StatCard
          title="Today's Sales"
          value={`₹${(kpi?.todayRevenue || 0).toLocaleString('en-IN')}`}
          subtitle="Revenue since midnight"
          icon={IndianRupee}
          iconColor="text-teal-700 bg-teal-50 border-teal-200"
          isLoading={isLoading}
        />
        <StatCard
          title="Total Orders"
          value={(kpi?.totalOrders || 0).toLocaleString('en-IN')}
          subtitle="All lifetime orders"
          icon={ShoppingBag}
          iconColor="text-blue-700 bg-blue-50 border-blue-200"
          isLoading={isLoading}
        />
        <StatCard
          title="Pending Orders"
          value={(kpi?.pendingOrders || 0).toLocaleString('en-IN')}
          subtitle="Orders requiring action"
          icon={Clock}
          iconColor="text-amber-700 bg-amber-50 border-amber-200"
          isLoading={isLoading}
          onClick={() => navigate('/orders?status=PENDING')}
        />
        <StatCard
          title="Delivered Orders"
          value={(kpi?.deliveredOrders || 0).toLocaleString('en-IN')}
          subtitle="Successfully fulfilled"
          icon={CheckCircle2}
          iconColor="text-emerald-700 bg-emerald-50 border-emerald-200"
          isLoading={isLoading}
          onClick={() => navigate('/orders?status=DELIVERED')}
        />
        <div className="col-span-2 sm:col-span-1">
          <StatCard
            title="Total Customers"
            value={(kpi?.totalCustomers || 0).toLocaleString('en-IN')}
            subtitle="Registered buyers"
            icon={Users}
            iconColor="text-indigo-700 bg-indigo-50 border-indigo-200"
            isLoading={isLoading}
            onClick={() => navigate('/customers')}
          />
        </div>
      </div>

      {/* 3. Orders Requiring Attention (One of the most important sections) */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs space-y-3.5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">
              Orders Requiring Attention
            </h2>
            <p className="text-xs text-slate-500">
              Click any bucket to view and process matching customer orders directly.
            </p>
          </div>
          <Link
            to="/orders"
            className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1"
          >
            <span>All Orders</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
          {orderBuckets.map((bucket, bIdx) => (
            <Link
              key={bIdx}
              to={bucket.path}
              className={`p-3 rounded-lg border transition-all flex flex-col justify-between ${bucket.color}`}
            >
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <span className="text-xs font-semibold truncate">{bucket.label}</span>
                <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${bucket.badgeColor}`}>
                  {bucket.count}
                </span>
              </div>
              <span className="text-[10px] opacity-75 leading-tight truncate">
                {bucket.desc}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* 4. Sales Overview Graph & Quick Actions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Sales Overview Area Chart (2 Cols on Desktop) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">Sales Overview</h2>
              <p className="text-xs text-slate-500">
                Gross sales and order volume over the selected time range.
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Total in Period</span>
              <span className="text-base font-bold text-teal-800">
                ₹{(kpi?.totalRevenue || 0).toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            {isLoading ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400 animate-pulse">
                Loading sales trend...
              </div>
            ) : data?.revenueChart && data.revenueChart.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={data.revenueChart}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0f766e" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#0f766e" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 11 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const item = payload[0].payload;
                        return (
                          <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-md text-xs space-y-1">
                            <span className="font-semibold text-slate-700 block">{item.date}</span>
                            <div className="text-teal-700 font-bold">
                              Sales: ₹{(item.revenue || 0).toLocaleString('en-IN')}
                            </div>
                            <div className="text-slate-500">Orders: {item.orders || 0}</div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#0f766e"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#salesGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No sales data captured in this date range.
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions Shortcuts (1 Col on Desktop) */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs space-y-3.5 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">Quick Actions</h2>
            <p className="text-xs text-slate-500">
              Frequently used operational tasks to save time.
            </p>
          </div>

          <div className="space-y-2 flex-1">
            {quickActions.map((qa, idx) => {
              const Icon = qa.icon;
              return (
                <Link
                  key={idx}
                  to={qa.path}
                  className={`flex items-center justify-between p-2.5 rounded-lg border text-xs font-medium transition-all ${qa.color}`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{qa.label}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                </Link>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-100">
            <span className="text-[11px] text-slate-400 block text-center">
              Need help? All store settings can be found under{' '}
              <Link to="/settings" className="text-teal-700 font-medium hover:underline">
                Settings
              </Link>
              .
            </span>
          </div>
        </div>
      </div>

      {/* 5. Low-Stock Alerts (Products that need attention) */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                Low-Stock Alerts
              </h2>
              <p className="text-xs text-slate-500">
                Products currently at or below their configured stock threshold.
              </p>
            </div>
          </div>
          <Link
            to="/inventory"
            className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1"
          >
            <span>Manage Inventory</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {data?.lowStockItems && data.lowStockItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            {data.lowStockItems.slice(0, 6).map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg border border-amber-200/80 bg-amber-50/40 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <h4 className="text-xs font-semibold text-slate-900 truncate">
                    {item.variantId?.productId?.title || item.sku}
                  </h4>
                  <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-slate-600">{item.sku}</span>
                    <span>•</span>
                    <span className="font-bold text-amber-800">
                      Only {item.availableStock} left
                    </span>
                  </div>
                </div>

                <Link
                  to={`/inventory?search=${encodeURIComponent(item.sku)}`}
                  className="px-2.5 py-1 rounded-md bg-white border border-amber-300 text-amber-900 font-semibold text-xs hover:bg-amber-100 flex-shrink-0 transition-colors shadow-2xs"
                >
                  Update Stock
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-lg bg-emerald-50/60 border border-emerald-100 flex items-center gap-2 text-xs text-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Healthy Inventory: All products currently meet their minimum stock thresholds.</span>
          </div>
        )}
      </div>

      {/* 6. Recent Orders Table (Compact, clear, max 7 columns) */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs space-y-3.5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">Recent Orders</h2>
            <p className="text-xs text-slate-500">
              Latest transactions placed on the AuraPure customer storefront.
            </p>
          </div>
          <Link
            to="/orders"
            className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1"
          >
            <span>View All Orders</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {data?.recentOrders && data.recentOrders.length > 0 ? (
          <div className="overflow-x-auto border border-slate-100 rounded-lg">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Order ID</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Payment</th>
                  <th className="py-2.5 px-3">Order Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.recentOrders.slice(0, 6).map((ord: any) => (
                  <tr key={ord._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      {ord.orderNumber || `#${ord._id.slice(-6)}`}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-medium text-slate-900 block truncate max-w-[140px]">
                        {ord.shippingAddress?.fullName || ord.userId?.name || 'Customer'}
                      </span>
                      <span className="text-[10px] text-slate-400 block truncate">
                        {ord.shippingAddress?.phone || '—'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                      {new Date(ord.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 whitespace-nowrap">
                      ₹{(ord.pricing?.finalTotal || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 px-3">
                      <StatusBadge status={ord.paymentStatus} size="sm" />
                    </td>
                    <td className="py-2.5 px-3">
                      <StatusBadge status={ord.orderStatus} size="sm" />
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <Link
                        to={`/orders?orderId=${ord._id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700 hover:text-teal-700 hover:border-teal-300 transition-colors font-medium text-[11px] shadow-2xs"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Details</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-slate-400">
            No recent orders available.
          </div>
        )}
      </div>
    </div>
  );
};
