import React, { useEffect, useState } from 'react';
import { Search, Download, ExternalLink, Filter, CheckCircle2, AlertCircle } from 'lucide-react';
import { adminApi } from '../services/adminApi';

export const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const res = await adminApi.get('/admin/orders', {
        params: { status: statusFilter, search: searchTerm },
      });
      if (res.data?.data?.orders) {
        setOrders(res.data.data.orders);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders();
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      setUpdatingOrderId(orderId);
      await adminApi.put(`/admin/orders/${orderId}/status`, { status: newStatus });
      fetchOrders();
    } catch {
      alert('Failed to update order status.');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const statuses = ['ALL', 'PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-admin-dark tracking-tight">Order Fulfillment Hub</h1>
          <p className="text-xs text-admin-muted mt-1">Track orders, trigger notifications & oversee shipments</p>
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Order # or Name..."
              className="px-3.5 py-2 pl-9 rounded-lg border border-admin-border text-xs bg-white text-admin-dark focus:outline-none focus:ring-1 focus:ring-admin-primary"
            />
            <Search className="w-4 h-4 text-admin-muted absolute left-3 top-2.5" />
          </div>
          <button type="submit" className="admin-btn-primary !text-xs !py-2">
            Filter
          </button>
        </form>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {statuses.map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              statusFilter === st
                ? 'bg-admin-dark text-white shadow-sm'
                : 'bg-white border border-admin-border text-admin-muted hover:text-admin-dark'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="admin-card !p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="admin-table-th">Order Number</th>
                <th className="admin-table-th">Customer & Shipping</th>
                <th className="admin-table-th">Products</th>
                <th className="admin-table-th">Total Amount</th>
                <th className="admin-table-th">Payment</th>
                <th className="admin-table-th">Fulfillment Status</th>
                <th className="admin-table-th">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-admin-muted">
                    Loading order records...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-admin-muted">
                    No orders match your filter criteria.
                  </td>
                </tr>
              ) : (
                orders.map((ord) => (
                  <tr key={ord._id} className="hover:bg-slate-50 transition-colors">
                    <td className="admin-table-td">
                      <span className="font-bold text-admin-dark block">{ord.orderNumber}</span>
                      <span className="text-[10px] text-admin-muted">
                        {new Date(ord.createdAt).toLocaleDateString('en-IN')}
                      </span>
                    </td>

                    <td className="admin-table-td">
                      <strong className="text-admin-dark">{ord.shippingAddress?.fullName}</strong>
                      <p className="text-[11px] text-admin-muted leading-tight mt-0.5">
                        {ord.shippingAddress?.city}, {ord.shippingAddress?.state} - {ord.shippingAddress?.pincode}
                      </p>
                      <span className="text-[10px] text-admin-muted">{ord.shippingAddress?.phone}</span>
                    </td>

                    <td className="admin-table-td">
                      <div className="space-y-1 max-w-xs">
                        {ord.items.map((it: any, i: number) => (
                          <div key={i} className="truncate text-admin-dark">
                            <strong>{it.quantity}x</strong> {it.title} ({it.flavor})
                          </div>
                        ))}
                      </div>
                    </td>

                    <td className="admin-table-td font-bold text-admin-dark">
                      ₹{ord.pricing?.finalTotal}
                    </td>

                    <td className="admin-table-td">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          ord.paymentStatus === 'PAID'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {ord.paymentStatus}
                      </span>
                    </td>

                    <td className="admin-table-td">
                      <select
                        value={ord.orderStatus}
                        disabled={updatingOrderId === ord._id}
                        onChange={(e) => handleStatusChange(ord._id, e.target.value)}
                        className="bg-white border border-admin-border rounded-lg px-2 py-1 text-xs font-semibold text-admin-dark focus:outline-none"
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="CONFIRMED">CONFIRMED</option>
                        <option value="PROCESSING">PROCESSING</option>
                        <option value="SHIPPED">SHIPPED</option>
                        <option value="DELIVERED">DELIVERED</option>
                        <option value="CANCELLED">CANCELLED</option>
                      </select>
                    </td>

                    <td className="admin-table-td">
                      <a
                        href={`http://localhost:5000/api/v1/invoices/${ord._id}/download`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:underline"
                        title="Download Invoice"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Invoice</span>
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
