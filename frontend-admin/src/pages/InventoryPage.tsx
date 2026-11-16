import React, { useEffect, useState } from 'react';
import {
  Boxes,
  Plus,
  Minus,
  AlertTriangle,
  History,
  CheckCircle2,
  XCircle,
  PackageCheck,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { DataTable, Column } from '../components/common/DataTable';
import { Modal } from '../components/common/Modal';
import { useToast } from '../components/common/Toast';
import { inventoryApi, InventoryData, InventoryTxData } from '../services/adminApi';

export const InventoryPage: React.FC = () => {
  const { toast } = useToast();
  const [inventoryList, setInventoryList] = useState<InventoryData[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Adjustment Modal
  const [adjustModalItem, setAdjustModalItem] = useState<InventoryData | null>(null);
  const [adjustDirection, setAdjustDirection] = useState<'add' | 'deduct'>('add');
  const [adjustQty, setAdjustQty] = useState<number>(25);
  const [adjustReason, setAdjustReason] = useState<string>('Stock Receipt from Supplier');
  const [adjustNote, setAdjustNote] = useState<string>('');
  const [actionLoading, setActionLoading] = useState(false);

  // History Ledger Modal
  const [historyModalItem, setHistoryModalItem] = useState<InventoryData | null>(null);
  const [historyLogs, setHistoryLogs] = useState<InventoryTxData[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await inventoryApi.list({
        limit: 100,
        alertStatus: statusFilter === 'ALL' ? undefined : statusFilter,
      });
      setInventoryList(res.inventory);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to fetch inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [statusFilter]);

  const handleOpenAdjust = (inv: InventoryData, defaultDir: 'add' | 'deduct' = 'add') => {
    setAdjustModalItem(inv);
    setAdjustDirection(defaultDir);
    setAdjustQty(25);
    setAdjustReason(defaultDir === 'add' ? 'Stock Receipt from Supplier' : 'Damaged / Expired Batch Write-off');
    setAdjustNote('');
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustModalItem) return;

    const finalQty = adjustDirection === 'add' ? Math.abs(adjustQty) : -Math.abs(adjustQty);

    try {
      setActionLoading(true);
      const res = await inventoryApi.adjustStock(adjustModalItem._id, {
        changeQty: finalQty,
        reason: adjustReason,
        note: adjustNote,
      });
      toast.success(res.message);
      setAdjustModalItem(null);
      fetchInventory();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to adjust stock');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenHistory = async (inv: InventoryData) => {
    setHistoryModalItem(inv);
    try {
      setHistoryLoading(true);
      const res = await inventoryApi.getHistory(inv._id);
      setHistoryLogs(res.transactions);
    } catch (err: any) {
      toast.error('Failed to load transaction history');
    } finally {
      setHistoryLoading(false);
    }
  };

  const columns: Column<InventoryData>[] = [
    {
      key: 'sku',
      header: 'SKU & Variant',
      sortable: true,
      render: (inv: InventoryData) => (
        <div>
          <div className="font-mono font-bold text-xs text-indigo-700">{inv.sku}</div>
          <div className="text-xs font-semibold text-slate-900 mt-0.5">
            {inv.variantId?.productId?.title || 'Supplement Product'}
          </div>
          <div className="text-[11px] text-slate-500">
            {inv.variantId?.flavor || 'Original'} • {inv.variantId?.packSize || '1kg'}
          </div>
        </div>
      ),
    },
    {
      key: 'stockOnHand',
      header: 'Stock on Hand',
      sortable: true,
      render: (inv: InventoryData) => (
        <span className="font-semibold text-xs text-slate-900 font-mono">{inv.stockOnHand} Units</span>
      ),
    },
    {
      key: 'reservedStock',
      header: 'Reserved (Orders)',
      render: (inv: InventoryData) => (
        <span className="text-xs font-medium text-amber-600 font-mono">
          {inv.reservedStock > 0 ? `${inv.reservedStock} Locked` : '0'}
        </span>
      ),
    },
    {
      key: 'availableStock',
      header: 'Available to Sell',
      sortable: true,
      render: (inv: InventoryData) => {
        const isOut = inv.availableStock <= 0;
        const isLow = inv.availableStock <= inv.lowStockThreshold;
        return (
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
              isOut
                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                : isLow
                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}
          >
            {inv.availableStock} Units Available
          </span>
        );
      },
    },
    {
      key: 'lowStockThreshold',
      header: 'Safety Level',
      render: (inv: InventoryData) => (
        <span className="text-xs text-slate-500 font-mono">{inv.lowStockThreshold} Units</span>
      ),
    },
    {
      key: 'alertStatus',
      header: 'Health Status',
      render: (inv: InventoryData) => {
        switch (inv.alertStatus) {
          case 'IN_STOCK':
            return (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5" /> Healthy
              </span>
            );
          case 'LOW_STOCK':
            return (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                <AlertTriangle className="w-3.5 h-3.5" /> Low Stock
              </span>
            );
          case 'OUT_OF_STOCK':
            return (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">
                <XCircle className="w-3.5 h-3.5" /> Out of Stock
              </span>
            );
          default:
            return null;
        }
      },
    },
    {
      key: 'actions',
      header: 'Warehouse Actions',
      render: (inv: InventoryData) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenAdjust(inv, 'add')}
            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
            title="Receive Stock (+)"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleOpenAdjust(inv, 'deduct')}
            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            title="Deduct / Discard Stock (-)"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleOpenHistory(inv)}
            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            title="View Stock Audit Ledger"
          >
            <History className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const inStockCount = inventoryList.filter((i) => i.alertStatus === 'IN_STOCK').length;
  const lowStockCount = inventoryList.filter((i) => i.alertStatus === 'LOW_STOCK').length;
  const outOfStockCount = inventoryList.filter((i) => i.alertStatus === 'OUT_OF_STOCK').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Inventory Master & Stock Ledger</h1>
        <p className="text-sm text-slate-500 mt-1">
          Monitor physical warehouse units, manage stock allocations, and audit atomic replenishment movements.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="admin-card p-5">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Tracked SKUs</div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{inventoryList.length}</div>
          <div className="text-xs text-slate-500 mt-1">Across all product variants</div>
        </div>
        <div className="admin-card p-5">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Healthy Stock Level</div>
          <div className="text-2xl font-bold text-emerald-600 mt-2">{inStockCount}</div>
          <div className="text-xs text-slate-500 mt-1">Above safety threshold</div>
        </div>
        <div className="admin-card p-5">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Low Stock Warnings</div>
          <div className="text-2xl font-bold text-amber-600 mt-2">{lowStockCount}</div>
          <div className="text-xs text-slate-500 mt-1">Requires reorder from supplier</div>
        </div>
        <div className="admin-card p-5">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Out of Stock (Zero)</div>
          <div className="text-2xl font-bold text-rose-600 mt-2">{outOfStockCount}</div>
          <div className="text-xs text-slate-500 mt-1">Checkouts blocked on storefront</div>
        </div>
      </div>

      {/* Filter Slot */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-slate-600">Stock Status:</span>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="admin-input text-xs py-1.5 w-auto"
        >
          <option value="ALL">All Inventory SKUs ({inventoryList.length})</option>
          <option value="IN_STOCK">Healthy In Stock ({inStockCount})</option>
          <option value="LOW_STOCK">Low Stock Warnings ({lowStockCount})</option>
          <option value="OUT_OF_STOCK">Out of Stock ({outOfStockCount})</option>
        </select>
      </div>

      {/* Main Table */}
      <DataTable
        columns={columns}
        data={inventoryList}
        keyExtractor={(item) => item._id}
        isLoading={loading}
        searchPlaceholder="Search inventory by SKU..."
        emptyMessage="No inventory records found."
      />

      {/* Adjust Stock Modal */}
      <Modal
        isOpen={!!adjustModalItem}
        onClose={() => setAdjustModalItem(null)}
        title={`Adjust Stock: ${adjustModalItem?.sku}`}
        subtitle={`${adjustModalItem?.variantId?.productId?.title || ''} • Current on Hand: ${
          adjustModalItem?.stockOnHand
        } Units`}
      >
        <form onSubmit={handleAdjustSubmit} className="space-y-4">
          <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setAdjustDirection('add');
                setAdjustReason('Stock Receipt from Supplier');
              }}
              className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                adjustDirection === 'add'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Add Stock (+)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAdjustDirection('deduct');
                setAdjustReason('Damaged / Expired Batch Write-off');
              }}
              className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                adjustDirection === 'deduct'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingDown className="w-3.5 h-3.5" />
              <span>Deduct / Discard (-)</span>
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Adjustment Quantity *
            </label>
            <input
              type="number"
              required
              min={1}
              value={adjustQty}
              onChange={(e) => setAdjustQty(Number(e.target.value))}
              className="admin-input font-bold text-base"
            />
            <div className="flex gap-2 mt-2">
              {[10, 25, 50, 100].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAdjustQty(preset)}
                  className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg"
                >
                  +{preset}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Adjustment Category / Reason *
            </label>
            <select
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
              className="admin-input"
            >
              {adjustDirection === 'add' ? (
                <>
                  <option value="Stock Receipt from Supplier">Stock Receipt from Supplier (Purchase Order)</option>
                  <option value="Customer Return Restock">Customer Return Restock (Inspected Purity)</option>
                  <option value="Cycle Count Physical Audit">Cycle Count Audit (Physical Discrepancy Found)</option>
                </>
              ) : (
                <>
                  <option value="Damaged / Expired Batch Write-off">Damaged / Expired Batch Write-off</option>
                  <option value="Cycle Count Shortage Correction">Cycle Count Audit Shortage</option>
                  <option value="Promotional Sampling / Influencer Gifting">Promotional Sampling / Influencer Gifting</option>
                  <option value="Quality Assurance Lab Destructive Testing">Quality Assurance Lab Testing</option>
                </>
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Optional Batch / Internal Note
            </label>
            <input
              type="text"
              placeholder="e.g. PO-8820 received via Delhivery logistics"
              value={adjustNote}
              onChange={(e) => setAdjustNote(e.target.value)}
              className="admin-input"
            />
          </div>

          {/* Resulting stock preview */}
          {adjustModalItem && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs flex justify-between items-center">
              <span className="text-slate-600">Calculated Stock After Save:</span>
              <span className="font-bold font-mono text-indigo-700 text-sm">
                {Math.max(
                  0,
                  adjustDirection === 'add'
                    ? adjustModalItem.stockOnHand + adjustQty
                    : adjustModalItem.stockOnHand - adjustQty
                )}{' '}
                Units
              </span>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setAdjustModalItem(null)}
              className="admin-btn-secondary"
              disabled={actionLoading}
            >
              Cancel
            </button>
            <button type="submit" className="admin-btn-primary" disabled={actionLoading}>
              {actionLoading ? 'Recording Ledger...' : 'Commit Stock Adjustment'}
            </button>
          </div>
        </form>
      </Modal>

      {/* History Ledger Modal */}
      <Modal
        isOpen={!!historyModalItem}
        onClose={() => setHistoryModalItem(null)}
        title={`Audit Ledger: ${historyModalItem?.sku}`}
        subtitle="Chronological transaction record of all stock adjustments and order commitments."
        maxWidth="3xl"
      >
        <div className="space-y-4">
          <div className="max-h-96 overflow-y-auto">
            {historyLoading ? (
              <div className="py-8 text-center text-xs text-slate-500">Loading transaction history...</div>
            ) : historyLogs.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No past transactions recorded for this SKU.
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="admin-table-th">Timestamp</th>
                    <th className="admin-table-th">Type</th>
                    <th className="admin-table-th">Change</th>
                    <th className="admin-table-th">Stock Result</th>
                    <th className="admin-table-th">Reason / Note</th>
                    <th className="admin-table-th">Staff</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {historyLogs.map((log) => (
                    <tr key={log._id} className="hover:bg-slate-50/70">
                      <td className="admin-table-td text-[11px] text-slate-500 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="admin-table-td">
                        <span className="text-[10px] font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                          {log.type}
                        </span>
                      </td>
                      <td className="admin-table-td">
                        <span
                          className={`font-bold ${log.changeQuantity > 0 ? 'text-emerald-600' : 'text-rose-600'}`}
                        >
                          {log.changeQuantity > 0 ? `+${log.changeQuantity}` : log.changeQuantity}
                        </span>
                      </td>
                      <td className="admin-table-td font-semibold text-slate-800">
                        {log.previousQuantity} → {log.newQuantity}
                      </td>
                      <td className="admin-table-td text-slate-600 font-sans text-xs">
                        {log.reason || 'Manual Adjustment'}
                      </td>
                      <td className="admin-table-td text-slate-500 font-sans text-[11px]">
                        {log.performedBy?.name || 'System'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-100">
            <button onClick={() => setHistoryModalItem(null)} className="admin-btn-secondary text-xs">
              Close Ledger
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
export default InventoryPage;
