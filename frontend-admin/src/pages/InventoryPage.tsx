import React, { useEffect, useState } from 'react';
import { Boxes, Plus, Minus, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { adminApi } from '../services/adminApi';

export const InventoryPage: React.FC = () => {
  const [inventoryList, setInventoryList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [adjustModalItem, setAdjustModalItem] = useState<any | null>(null);
  const [adjustQuantity, setAdjustQuantity] = useState<number>(25);
  const [adjustReason, setAdjustReason] = useState<string>('Warehouse Restock Batch');

  const fetchInventory = async () => {
    try {
      setIsLoading(true);
      const res = await adminApi.get('/admin/inventory');
      if (res.data?.data?.inventory) {
        setInventoryList(res.data.data.inventory);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustModalItem) return;

    try {
      await adminApi.put(`/admin/inventory/${adjustModalItem._id}/adjust`, {
        changeQty: adjustQuantity,
        reason: adjustReason,
      });
      alert('Stock successfully updated with audit record.');
      setAdjustModalItem(null);
      fetchInventory();
    } catch {
      alert('Failed to adjust stock.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-admin-dark tracking-tight">Inventory & Stock Master</h1>
        <p className="text-xs text-admin-muted mt-1">Real-time stock on hand, reserved orders & safety thresholds</p>
      </div>

      <div className="admin-card !p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr>
                <th className="admin-table-th">SKU</th>
                <th className="admin-table-th">Product Variant</th>
                <th className="admin-table-th">Stock on Hand</th>
                <th className="admin-table-th">Reserved (Pending)</th>
                <th className="admin-table-th">Available to Sell</th>
                <th className="admin-table-th">Threshold</th>
                <th className="admin-table-th">Status</th>
                <th className="admin-table-th">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-admin-muted">
                    Loading inventory records...
                  </td>
                </tr>
              ) : inventoryList.map((inv) => (
                <tr key={inv._id} className="hover:bg-slate-50 transition-colors">
                  <td className="admin-table-td font-bold text-admin-dark">{inv.sku}</td>
                  
                  <td className="admin-table-td font-semibold text-admin-dark">
                    {inv.variantId?.title || inv.sku}
                  </td>

                  <td className="admin-table-td font-medium text-admin-dark">{inv.stockOnHand}</td>

                  <td className="admin-table-td text-amber-600 font-medium">{inv.reservedStock}</td>

                  <td className="admin-table-td">
                    <span className="font-bold text-sm text-admin-dark">{inv.availableStock}</span>
                  </td>

                  <td className="admin-table-td text-admin-muted">{inv.lowStockThreshold}</td>

                  <td className="admin-table-td">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        inv.alertStatus === 'IN_STOCK'
                          ? 'bg-emerald-50 text-emerald-700'
                          : inv.alertStatus === 'LOW_STOCK'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-red-50 text-red-700'
                      }`}
                    >
                      {inv.alertStatus}
                    </span>
                  </td>

                  <td className="admin-table-td">
                    <button
                      onClick={() => setAdjustModalItem(inv)}
                      className="admin-btn-secondary !text-xs !py-1 !px-2.5"
                    >
                      Adjust Stock
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Modal */}
      {adjustModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-admin-border relative">
            <button
              onClick={() => setAdjustModalItem(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-base font-bold text-admin-dark">Adjust Stock for {adjustModalItem.sku}</h3>
              <p className="text-xs text-admin-muted">Current Stock on Hand: {adjustModalItem.stockOnHand}</p>
            </div>

            <form onSubmit={handleAdjustSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-admin-dark block mb-1">
                  Quantity Adjustment (positive to add, negative to remove)
                </label>
                <input
                  type="number"
                  required
                  value={adjustQuantity}
                  onChange={(e) => setAdjustQuantity(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-admin-border bg-white text-sm font-bold"
                />
              </div>

              <div>
                <label className="font-semibold text-admin-dark block mb-1">Audit Reason *</label>
                <input
                  type="text"
                  required
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="e.g. Shipment received from Bengaluru unit"
                  className="w-full px-3 py-2 rounded-lg border border-admin-border bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setAdjustModalItem(null)} className="admin-btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="admin-btn-primary">
                  Save Stock Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
