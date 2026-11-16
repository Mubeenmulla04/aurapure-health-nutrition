import React, { useState, useEffect } from 'react';
import { UserCheck, UserX, Shield, Plus, Edit2, Trash2, KeyRound } from 'lucide-react';
import { DataTable, Column } from '../components/common/DataTable';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { useToast } from '../components/common/Toast';
import { staffApi, StaffMember, RoleDoc } from '../services/adminApi';
import { useAdminAuth } from '../context/AdminAuthContext';

export const StaffPage: React.FC = () => {
  const { adminUser } = useAdminAuth();
  const { toast } = useToast();

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [roles, setRoles] = useState<RoleDoc[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);

  // Confirm delete dialog
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<StaffMember | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form states for Add Staff
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'order_manager',
  });

  const [editFormData, setEditFormData] = useState({
    name: '',
    phone: '',
    role: '',
    isActive: true,
  });

  const fetchStaffData = async () => {
    try {
      setLoading(true);
      const [staffList, roleList] = await Promise.all([staffApi.list(), staffApi.listRoles()]);
      setStaff(staffList);
      setRoles(roleList);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to load staff accounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffData();
  }, []);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.role) {
      toast.warning('Name, 10-digit mobile number, and role are required.');
      return;
    }

    try {
      setActionLoading(true);
      const res = await staffApi.create(formData);
      toast.success(res.message);
      setIsAddModalOpen(false);
      setFormData({ name: '', email: '', phone: '', role: 'order_manager' });
      fetchStaffData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Creation Failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenEdit = (member: StaffMember) => {
    setEditingStaff(member);
    setEditFormData({
      name: member.name,
      phone: member.phone || '',
      role: member.role,
      isActive: member.isActive,
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;

    try {
      setActionLoading(true);
      const res = await staffApi.update(editingStaff._id, editFormData);
      toast.success(res.message);
      setIsEditModalOpen(false);
      setEditingStaff(null);
      fetchStaffData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Update Failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteStaff = async () => {
    if (!staffToDelete) return;
    try {
      setActionLoading(true);
      const res = await staffApi.delete(staffToDelete._id);
      toast.success(res.message);
      setIsDeleteOpen(false);
      setStaffToDelete(null);
      fetchStaffData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Delete Failed');
    } finally {
      setActionLoading(false);
    }
  };

  const roleBadgeStyle = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'admin':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'order_manager':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'product_manager':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'inventory_manager':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'support_manager':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      case 'marketing_manager':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const columns: Column<StaffMember>[] = [
    {
      key: 'name',
      header: 'Staff Member',
      sortable: true,
      render: (member: StaffMember) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
            {member.name.charAt(0)}
          </div>
          <div>
            <div className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
              {member.name}
              {member.role === 'super_admin' && (
                <span title="Super Admin">
                  <Shield className="w-3.5 h-3.5 text-purple-600 inline" />
                </span>
              )}
            </div>
            <div className="text-xs text-slate-500">{member.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Assigned Role',
      sortable: true,
      render: (member: StaffMember) => (
        <div>
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${roleBadgeStyle(
              member.role
            )}`}
          >
            {member.role.replace('_', ' ').toUpperCase()}
          </span>
          <p className="text-[11px] text-slate-500 mt-0.5 truncate max-w-xs">
            {member.roleId?.description || 'Operational staff privileges'}
          </p>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (member: StaffMember) => <span className="text-xs text-slate-600">{member.phone || '—'}</span>,
    },
    {
      key: 'isActive',
      header: 'Account Status',
      render: (member: StaffMember) => (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
            member.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
          }`}
        >
          {member.isActive ? (
            <>
              <UserCheck className="w-3.5 h-3.5" /> Active
            </>
          ) : (
            <>
              <UserX className="w-3.5 h-3.5" /> Deactivated
            </>
          )}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Joined Date',
      render: (member: StaffMember) => (
        <span className="text-xs text-slate-500">
          {new Date(member.createdAt).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (member: StaffMember) => {
        const isSelf = adminUser?.id === member._id;
        return (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleOpenEdit(member)}
              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              title="Edit Staff Member"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            {!isSelf && (
              <button
                onClick={() => {
                  setStaffToDelete(member);
                  setIsDeleteOpen(true);
                }}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                title="Delete Account"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Staff & Roles Governance</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage administrative personnel, assign granular department roles, and enforce security policies.
          </p>
        </div>
        <button onClick={() => setIsAddModalOpen(true)} className="admin-btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          <span>Add Staff Member</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="admin-card p-5">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Staff Accounts</div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{staff.length}</div>
          <div className="text-xs text-slate-500 mt-1">Across 7 specialized operational roles</div>
        </div>
        <div className="admin-card p-5">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Active Status</div>
          <div className="text-2xl font-bold text-emerald-600 mt-2">
            {staff.filter((s) => s.isActive).length} / {staff.length}
          </div>
          <div className="text-xs text-slate-500 mt-1">Authorized for dashboard access</div>
        </div>
        <div className="admin-card p-5">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">System Roles Defined</div>
          <div className="text-2xl font-bold text-indigo-600 mt-2">{roles.length}</div>
          <div className="text-xs text-slate-500 mt-1">Order, Product, Inventory, Support, Marketing</div>
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={staff}
        keyExtractor={(item) => item._id}
        isLoading={loading}
        searchPlaceholder="Search staff by name or email..."
        emptyMessage="No staff members registered."
      />

      {/* Add Staff Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Administrative Staff Member"
        subtitle="Create an authorized operational account for an employee."
      >
        <form onSubmit={handleCreateStaff} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Full Legal Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Priyanshu Sharma"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="admin-input"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Staff Mobile Number (for OTP Login) *
              </label>
              <div className="flex items-center rounded-lg border border-slate-200 overflow-hidden bg-white">
                <span className="px-3 py-2 bg-slate-50 border-r border-slate-200 text-xs font-bold text-slate-600">
                  +91
                </span>
                <input
                  type="tel"
                  required
                  placeholder="10-digit number"
                  maxLength={10}
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                  className="w-full px-3 py-2 text-xs text-slate-900 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Corporate Email (Optional)
              </label>
              <input
                type="email"
                placeholder="priyanshu@aurapure.in"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="admin-input"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Assigned Department Role *
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="admin-input"
            >
              <option value="order_manager">Order Manager (Fulfillments, Shipments, Invoices)</option>
              <option value="product_manager">Product Manager (Catalog, Categories, Variants)</option>
              <option value="inventory_manager">Inventory Manager (Stock Levels, Warehouse Adjustments)</option>
              <option value="support_manager">Support Manager (Customer Profiles, Reviews)</option>
              <option value="marketing_manager">Marketing Manager (Coupons, Banners, Campaigns)</option>
              <option value="admin">Admin (Full Business Operations)</option>
              {adminUser?.role === 'super_admin' && (
                <option value="super_admin">Super Admin (System Governance & Staff)</option>
              )}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="admin-btn-secondary"
              disabled={actionLoading}
            >
              Cancel
            </button>
            <button type="submit" className="admin-btn-primary" disabled={actionLoading}>
              {actionLoading ? 'Creating Account...' : 'Create Staff Account'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Staff Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Staff Account: ${editingStaff?.name}`}
      >
        <form onSubmit={handleUpdateStaff} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Full Legal Name
            </label>
            <input
              type="text"
              required
              value={editFormData.name}
              onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
              className="admin-input"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Phone Number
            </label>
            <input
              type="tel"
              value={editFormData.phone}
              onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
              className="admin-input"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Assigned Role
            </label>
            <select
              value={editFormData.role}
              onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
              className="admin-input"
            >
              <option value="order_manager">Order Manager</option>
              <option value="product_manager">Product Manager</option>
              <option value="inventory_manager">Inventory Manager</option>
              <option value="support_manager">Support Manager</option>
              <option value="marketing_manager">Marketing Manager</option>
              <option value="admin">Admin</option>
              {adminUser?.role === 'super_admin' && <option value="super_admin">Super Admin</option>}
            </select>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="isActiveToggle"
              checked={editFormData.isActive}
              onChange={(e) => setEditFormData({ ...editFormData, isActive: e.target.checked })}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
            />
            <label htmlFor="isActiveToggle" className="text-sm font-medium text-slate-700 cursor-pointer">
              Account Active (Authorize login to admin console)
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="admin-btn-secondary"
              disabled={actionLoading}
            >
              Cancel
            </button>
            <button type="submit" className="admin-btn-primary" disabled={actionLoading}>
              {actionLoading ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteStaff}
        title="Revoke and Delete Staff Account"
        message={`Are you sure you want to permanently delete the staff account for ${staffToDelete?.name} (${staffToDelete?.email})? All session access will be immediately terminated.`}
        confirmLabel="Delete Account"
        isLoading={actionLoading}
      />
    </div>
  );
};
export default StaffPage;
