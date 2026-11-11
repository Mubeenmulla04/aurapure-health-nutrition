import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  Package,
  Clock,
  CheckCircle2,
  AlertTriangle,
  IndianRupee,
  Users,
  ArrowUpRight,
} from 'lucide-react';
import { adminApi } from '../services/adminApi';

export const DashboardPage: React.FC = () => {
  const [data, setData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    adminApi
      .get('/admin/dashboard')
      .then((res) => {
        setData(res.data?.data);
      })
      .catch((err) => console.error('Error fetching admin dashboard:', err))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading || !data) {
    return (
      <div className="py-20 text-center text-admin-muted text-xs">
        Loading operational analytics...
      </div>
    );
  }

  const { kpi, revenueChart, lowStockItems, recentOrders } = data;

  const maxRevenue = revenueChart.length > 0 ? Math.max(...revenueChart.map((d: any) => d.revenue), 1) : 1;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-admin-dark tracking-tight">Executive Dashboard</h1>
        <p className="text-xs text-admin-muted mt-1">Live sales metrics, order pipeline & inventory status</p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Total Revenue */}
        <div className="admin-card space-y-3">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-admin-muted uppercase tracking-wider">Total Sales</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-bold text-admin-dark">₹{kpi.totalRevenue.toLocaleString('en-IN')}</span>
            <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold mt-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Paid Orders Authoritative</span>
            </div>
          </div>
        </div>

        {/* Total Orders */}
        <div className="admin-card space-y-3">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-admin-muted uppercase tracking-wider">Total Orders</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-bold text-admin-dark">{kpi.totalOrders}</span>
            <span className="text-[11px] text-admin-muted block mt-1">Lifetime customer purchases</span>
          </div>
        </div>

        {/* Pending Fulfillment */}
        <div className="admin-card space-y-3">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-admin-muted uppercase tracking-wider">Pending Fulfillment</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-bold text-admin-dark">{kpi.pendingOrders}</span>
            <span className="text-[11px] text-amber-600 font-medium block mt-1">Ready for warehouse dispatch</span>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="admin-card space-y-3">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-admin-muted uppercase tracking-wider">Stock Alerts</span>
            <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-bold text-admin-dark">{kpi.lowStockAlerts}</span>
            <span className="text-[11px] text-red-600 font-medium block mt-1">SKUs below safety threshold</span>
          </div>
        </div>

      </div>

      {/* Middle Row: Revenue Chart & Low Stock Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* 7-Day Revenue Trends Chart */}
        <div className="lg:col-span-8 admin-card space-y-5">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-admin-dark">7-Day Revenue Velocity</h3>
              <p className="text-xs text-admin-muted">Daily captured payments in INR</p>
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
              Live Feed
            </span>
          </div>

          <div className="h-56 flex items-end gap-4 pt-6 pb-2 px-2">
            {revenueChart.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-xs text-admin-muted">
                No recent daily transactions recorded yet.
              </div>
            ) : (
              revenueChart.map((d: any) => {
                const heightPercent = Math.max(15, Math.round((d.revenue / maxRevenue) * 100));
                return (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-2 group">
                    <div className="text-[10px] text-admin-muted opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                      ₹{d.revenue}
                    </div>
                    <div
                      className="w-full bg-emerald-600/80 group-hover:bg-emerald-600 rounded-t-lg transition-all"
                      style={{ height: `${heightPercent}%` }}
                    />
                    <span className="text-[10px] text-admin-muted font-medium truncate w-full text-center">
                      {d.date.split('-').slice(1).join('/')}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Low Stock Alerts Card */}
        <div className="lg:col-span-4 admin-card space-y-4">
          <h3 className="text-sm font-bold text-admin-dark flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span>Low Inventory Warnings</span>
          </h3>

          <div className="divide-y divide-admin-border">
            {lowStockItems.length === 0 ? (
              <div className="py-8 text-center text-xs text-admin-muted">
                All catalog variants are well-stocked.
              </div>
            ) : (
              lowStockItems.map((inv: any) => (
                <div key={inv._id} className="py-3 flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-admin-dark">{inv.sku}</h5>
                    <span className="text-[10px] text-admin-muted block">Threshold: {inv.lowStockThreshold}</span>
                  </div>
                  <span className="text-xs font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-full">
                    {inv.availableStock} left
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Bottom: Recent Orders Table */}
      <div className="admin-card space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-sm font-bold text-admin-dark">Recent Customer Orders</h3>
            <p className="text-xs text-admin-muted">Latest purchases awaiting dispatch</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="admin-table-th">Order #</th>
                <th className="admin-table-th">Customer</th>
                <th className="admin-table-th">Phone</th>
                <th className="admin-table-th">Amount</th>
                <th className="admin-table-th">Status</th>
                <th className="admin-table-th">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border">
              {recentOrders.map((ord: any) => (
                <tr key={ord._id} className="hover:bg-slate-50 transition-colors">
                  <td className="admin-table-td font-bold text-admin-dark">{ord.orderNumber}</td>
                  <td className="admin-table-td">{ord.shippingAddress?.fullName}</td>
                  <td className="admin-table-td text-xs text-admin-muted">{ord.shippingAddress?.phone}</td>
                  <td className="admin-table-td font-semibold">₹{ord.pricing?.finalTotal}</td>
                  <td className="admin-table-td">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                        ord.orderStatus === 'DELIVERED'
                          ? 'bg-emerald-50 text-emerald-700'
                          : ord.orderStatus === 'CONFIRMED'
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {ord.orderStatus}
                    </span>
                  </td>
                  <td className="admin-table-td text-xs text-admin-muted">
                    {new Date(ord.createdAt).toLocaleDateString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
