import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Download,
  Eye,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  MapPin,
  ShoppingBag,
  IndianRupee,
} from 'lucide-react';
import { DataTable, Column } from '../components/common/DataTable';
import { Modal } from '../components/common/Modal';
import { StatusBadge } from '../components/common/StatusBadge';
import { useToast } from '../components/common/Toast';
import { customerApi, CustomerData } from '../services/adminApi';

export const CustomersPage: React.FC = () => {
  const { toast } = useToast();
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Selected Customer for Profile View
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerData | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await customerApi.list({ limit: 100 });
      setCustomers(res.customers);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleExportCsv = async () => {
    try {
      setExporting(true);
      await customerApi.downloadCsv();
      toast.success('Customer directory exported to CSV.');
    } catch (err: any) {
      toast.error('Failed to export customers');
    } finally {
      setExporting(false);
    }
  };

  const handleOpenProfile = async (cust: CustomerData) => {
    try {
      setProfileLoading(true);
      const detailed = await customerApi.getById(cust._id);
      setSelectedCustomer(detailed);
    } catch (err: any) {
      toast.error('Failed to load customer profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleToggleStatus = async (cust: CustomerData) => {
    try {
      setStatusLoading(true);
      const nextActive = !cust.isActive;
      const res = await customerApi.toggleStatus(cust._id, nextActive);
      toast.success(res.message);
      setCustomers((prev) =>
        prev.map((c) => (c._id === cust._id ? { ...c, isActive: nextActive } : c))
      );
      if (selectedCustomer && selectedCustomer._id === cust._id) {
        setSelectedCustomer((prev) => (prev ? { ...prev, isActive: nextActive } : null));
      }
    } catch (err: any) {
      toast.error('Failed to update account status');
    } finally {
      setStatusLoading(false);
    }
  };

  const columns: Column<CustomerData>[] = [
    {
      key: 'name',
      header: 'Customer Details',
      sortable: true,
      render: (cust: CustomerData) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
            {cust.name.charAt(0)}
          </div>
          <div>
            <div className="font-semibold text-slate-900 text-sm flex items-center gap-2">
              {cust.name}
              {cust.totalSpend >= 5000 && (
                <span className="text-[10px] bg-purple-50 text-purple-700 font-bold px-2 py-0.5 rounded-full border border-purple-200">
                  VIP
                </span>
              )}
            </div>
            <div className="text-xs text-slate-500">{cust.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (cust: CustomerData) => <span className="text-xs text-slate-600">{cust.phone || '—'}</span>,
    },
    {
      key: 'ordersCount',
      header: 'Order Volume',
      sortable: true,
      render: (cust: CustomerData) => (
        <div>
          <span className="text-xs font-bold text-slate-900">{cust.ordersCount} Orders</span>
          <span className="text-[11px] text-slate-500 block">
            {cust.paidOrdersCount} Paid Checkouts
          </span>
        </div>
      ),
    },
    {
      key: 'totalSpend',
      header: 'Lifetime Spend',
      sortable: true,
      render: (cust: CustomerData) => (
        <span className="text-xs font-bold font-mono text-emerald-700">
          ₹{cust.totalSpend.toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      key: 'isActive',
      header: 'Account Status',
      render: (cust: CustomerData) => (
        <button
          onClick={() => handleToggleStatus(cust)}
          disabled={statusLoading}
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
            cust.isActive
              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
          }`}
          title="Click to toggle block status"
        >
          {cust.isActive ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" /> Active
            </>
          ) : (
            <>
              <XCircle className="w-3.5 h-3.5" /> Blocked
            </>
          )}
        </button>
      ),
    },
    {
      key: 'createdAt',
      header: 'Joined Date',
      sortable: true,
      render: (cust: CustomerData) => (
        <span className="text-xs text-slate-500">
          {new Date(cust.createdAt).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (cust: CustomerData) => (
        <button
          onClick={() => handleOpenProfile(cust)}
          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
          title="View Customer Profile"
        >
          <Eye className="w-4 h-4" />
        </button>
      ),
    },
  ];

  const totalSpendAll = customers.reduce((acc, curr) => acc + curr.totalSpend, 0);
  const vipCustomersCount = customers.filter((c) => c.totalSpend >= 5000).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">Customer Directory & Spend Profiles</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Analyze customer lifetime value (LTV), review order histories, and manage verified account statuses.
          </p>
        </div>
        <button
          onClick={handleExportCsv}
          disabled={exporting}
          className="admin-btn-secondary flex items-center justify-center gap-2 w-full sm:w-auto text-xs"
        >
          <Download className="w-4 h-4" />
          <span>{exporting ? 'Exporting...' : 'Export Directory (CSV)'}</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="admin-card p-5">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Registered Customers</div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{customers.length}</div>
          <div className="text-xs text-slate-500 mt-1">Verified user accounts</div>
        </div>
        <div className="admin-card p-5">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Customer Spend</div>
          <div className="text-2xl font-bold text-emerald-600 mt-2">
            ₹{totalSpendAll.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-slate-500 mt-1">Paid gross checkout value</div>
        </div>
        <div className="admin-card p-5">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">VIP High-Spenders</div>
          <div className="text-2xl font-bold text-purple-600 mt-2">{vipCustomersCount}</div>
          <div className="text-xs text-slate-500 mt-1">Lifetime spend {'>'} ₹5,000</div>
        </div>
        <div className="admin-card p-5">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Active Good Standing</div>
          <div className="text-2xl font-bold text-indigo-600 mt-2">
            {customers.filter((c) => c.isActive).length} / {customers.length}
          </div>
          <div className="text-xs text-slate-500 mt-1">Authorized for checkout</div>
        </div>
      </div>

      {/* Main Table */}
      <DataTable
        columns={columns}
        data={customers}
        keyExtractor={(item) => item._id}
        isLoading={loading}
        searchPlaceholder="Search customer by name, email, or phone..."
        emptyMessage="No customer accounts found."
      />

      {/* Customer Profile Modal */}
      <Modal
        isOpen={!!selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        title={`Customer Profile: ${selectedCustomer?.name}`}
        subtitle={`Member since ${
          selectedCustomer ? new Date(selectedCustomer.createdAt).toLocaleDateString('en-IN') : ''
        }`}
        maxWidth="3xl"
      >
        {selectedCustomer && (
          <div className="space-y-6">
            {/* Top Snapshot */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="text-[11px] text-slate-500 uppercase font-semibold">Total Orders Placed</div>
                <div className="text-xl font-bold text-slate-900 mt-1">{selectedCustomer.ordersCount}</div>
              </div>
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="text-[11px] text-slate-500 uppercase font-semibold">Total Gross Spend</div>
                <div className="text-xl font-bold text-emerald-600 mt-1">
                  ₹{selectedCustomer.totalSpend.toLocaleString('en-IN')}
                </div>
              </div>
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="text-[11px] text-slate-500 uppercase font-semibold">Account Standing</div>
                <div className="mt-1">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      selectedCustomer.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                    }`}
                  >
                    {selectedCustomer.isActive ? 'Active' : 'Account Blocked'}
                  </span>
                </div>
              </div>
            </div>

            {/* Saved Addresses */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-indigo-600" />
                <span>Saved Shipping Addresses ({selectedCustomer.addresses?.length || 0})</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedCustomer.addresses?.length ? (
                  selectedCustomer.addresses.map((addr: any, idx: number) => (
                    <div key={idx} className="p-3.5 border border-slate-200 rounded-xl text-xs space-y-1">
                      <div className="font-bold text-slate-900">{addr.fullName}</div>
                      <div className="text-slate-600">
                        {addr.addressLine1}
                        {addr.addressLine2 && `, ${addr.addressLine2}`}
                      </div>
                      <div className="text-slate-600">
                        {addr.city}, {addr.state} - <span className="font-mono font-bold">{addr.pincode}</span>
                      </div>
                      <div className="text-slate-500 text-[11px]">Phone: {addr.phone}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-400 col-span-2">No saved addresses on file.</div>
                )}
              </div>
            </div>

            {/* Past Orders */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4 text-indigo-600" />
                <span>Purchase History ({selectedCustomer.orders?.length || 0})</span>
              </h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="py-2.5 px-3.5 font-semibold">Order #</th>
                      <th className="py-2.5 px-3.5 font-semibold">Date</th>
                      <th className="py-2.5 px-3.5 font-semibold">Items</th>
                      <th className="py-2.5 px-3.5 font-semibold">Amount</th>
                      <th className="py-2.5 px-3.5 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {selectedCustomer.orders?.length ? (
                      selectedCustomer.orders.map((ord: any) => (
                        <tr key={ord._id} className="hover:bg-slate-50/70 font-sans">
                          <td className="py-2.5 px-3.5 font-mono font-bold text-indigo-600 text-xs">
                            {ord.orderNumber}
                          </td>
                          <td className="py-2.5 px-3.5 text-slate-500 text-[11px]">
                            {new Date(ord.createdAt).toLocaleDateString('en-IN')}
                          </td>
                          <td className="py-2.5 px-3.5 text-slate-700 text-xs">
                            {ord.items?.length || 0} product(s)
                          </td>
                          <td className="py-2.5 px-3.5 font-bold text-slate-900 text-xs">
                            ₹{ord.pricing?.finalTotal}
                          </td>
                          <td className="py-2.5 px-3.5">
                            <StatusBadge status={ord.orderStatus} />
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-xs text-slate-400">
                          No order history for this account.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => handleToggleStatus(selectedCustomer)}
                disabled={statusLoading}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg border ${
                  selectedCustomer.isActive
                    ? 'border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100'
                    : 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                }`}
              >
                {selectedCustomer.isActive ? 'Block Customer Account' : 'Unblock Account'}
              </button>

              <button onClick={() => setSelectedCustomer(null)} className="admin-btn-secondary text-xs">
                Close Profile
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
export default CustomersPage;
