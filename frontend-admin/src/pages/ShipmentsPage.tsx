import React, { useState, useEffect } from 'react';
import { Truck, ExternalLink, MapPin, CheckCircle2, Clock, Plus, Search } from 'lucide-react';
import { DataTable, Column } from '../components/common/DataTable';
import { Modal } from '../components/common/Modal';
import { useToast } from '../components/common/Toast';
import { logisticsApi, ShipmentData, orderApi, OrderData } from '../services/adminApi';

export const ShipmentsPage: React.FC = () => {
  const { toast } = useToast();
  const [shipments, setShipments] = useState<ShipmentData[]>([]);
  const [loading, setLoading] = useState(true);

  // Book shipment modal
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [unshippedOrders, setUnshippedOrders] = useState<OrderData[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [courierName, setCourierName] = useState('BlueDart Express Air');
  const [actionLoading, setActionLoading] = useState(false);

  // Tracking modal
  const [trackingShipment, setTrackingShipment] = useState<ShipmentData | null>(null);

  const fetchShipments = async () => {
    try {
      setLoading(true);
      const res = await logisticsApi.listShipments({ limit: 100 });
      setShipments(res.shipments);
    } catch (err: any) {
      toast.error('Failed to load shipments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipments();
  }, []);

  const handleOpenBookModal = async () => {
    try {
      setActionLoading(true);
      const res = await orderApi.list({ status: 'PROCESSING', limit: 50 });
      setUnshippedOrders(res.orders);
      if (res.orders.length > 0) {
        setSelectedOrderId(res.orders[0]._id);
      }
      setIsBookModalOpen(true);
    } catch {
      toast.error('Failed to load pending orders');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBookShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId) {
      toast.warning('Please select an order to dispatch.');
      return;
    }

    try {
      setActionLoading(true);
      const res = await logisticsApi.createShipment(selectedOrderId, courierName);
      toast.success(res.message);
      setIsBookModalOpen(false);
      fetchShipments();
    } catch (err: any) {
      toast.error('Failed to book shipment');
    } finally {
      setActionLoading(false);
    }
  };

  const columns: Column<ShipmentData>[] = [
    {
      key: 'awbCode',
      header: 'AWB & Courier',
      sortable: true,
      render: (s: ShipmentData) => (
        <div>
          <div className="font-mono font-bold text-xs text-indigo-700">{s.awbCode || 'PENDING-AWB'}</div>
          <div className="text-xs font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
            <Truck className="w-3.5 h-3.5 text-slate-500" />
            <span>{s.courierName || 'Shiprocket Air'}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'orderNumber',
      header: 'Order Reference',
      render: (s: ShipmentData) => (
        <div>
          <div className="font-bold text-xs text-slate-900">{s.orderId?.orderNumber || '—'}</div>
          <div className="text-[11px] text-slate-500">{s.orderId?.shippingAddress?.fullName}</div>
        </div>
      ),
    },
    {
      key: 'destination',
      header: 'Destination Pincode',
      render: (s: ShipmentData) => (
        <div>
          <span className="text-xs font-mono font-bold text-slate-800">
            {s.orderId?.shippingAddress?.pincode}
          </span>
          <div className="text-[11px] text-slate-500">
            {s.orderId?.shippingAddress?.city}, {s.orderId?.shippingAddress?.state}
          </div>
        </div>
      ),
    },
    {
      key: 'currentStatus',
      header: 'Logistics State',
      sortable: true,
      render: (s: ShipmentData) => (
        <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
          <Truck className="w-3.5 h-3.5" /> {s.currentStatus}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Tracking',
      render: (s: ShipmentData) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTrackingShipment(s)}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
          >
            Checkpoints
          </button>
          {s.trackingUrl && (
            <a
              href={s.trackingUrl}
              target="_blank"
              rel="noreferrer"
              className="text-slate-400 hover:text-indigo-600"
              title="Open External Courier Page"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Shipments & Logistics (Shiprocket)</h1>
          <p className="text-sm text-slate-500 mt-1">
            Dispatch orders through Indian express couriers, auto-generate AWBs, and monitor delivery checkpoints.
          </p>
        </div>
        <button onClick={handleOpenBookModal} className="admin-btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          <span>Book Courier Pickup</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="admin-card p-5">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Dispatches Booked</div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{shipments.length}</div>
        </div>
        <div className="admin-card p-5">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Logistics Integration</div>
          <div className="text-2xl font-bold text-indigo-600 mt-2">Shiprocket Cloud API</div>
        </div>
        <div className="admin-card p-5">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Express Couriers</div>
          <div className="text-2xl font-bold text-emerald-600 mt-2">BlueDart / Delhivery Air</div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={shipments}
        keyExtractor={(item) => item._id}
        isLoading={loading}
        searchPlaceholder="Search by AWB code..."
        emptyMessage="No shipments recorded."
      />

      {/* Book Shipment Modal */}
      <Modal
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        title="Book Courier Dispatch via Shiprocket"
        subtitle="Generate AWB tracking code and schedule warehouse pickup."
      >
        <form onSubmit={handleBookShipment} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Select Processing Order *
            </label>
            {unshippedOrders.length === 0 ? (
              <div className="p-3 bg-amber-50 text-amber-800 text-xs rounded-lg border border-amber-200">
                No orders currently in 'PROCESSING' status. Move an order to PROCESSING in the Orders Hub first.
              </div>
            ) : (
              <select
                value={selectedOrderId}
                onChange={(e) => setSelectedOrderId(e.target.value)}
                className="admin-input text-xs"
              >
                {unshippedOrders.map((o) => (
                  <option key={o._id} value={o._id}>
                    Order #{o.orderNumber} — {o.shippingAddress?.fullName} ({o.shippingAddress?.city} - {o.shippingAddress?.pincode})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Courier Partner *
            </label>
            <select
              value={courierName}
              onChange={(e) => setCourierName(e.target.value)}
              className="admin-input text-xs"
            >
              <option value="BlueDart Express Air">BlueDart Express Air (Metro 24-48h)</option>
              <option value="Delhivery Surface Express">Delhivery Surface Express (All-India)</option>
              <option value="Ecom Express Ground">Ecom Express Ground</option>
              <option value="Shadowfax Local Delivery">Shadowfax Local Delivery</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsBookModalOpen(false)}
              className="admin-btn-secondary text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading || unshippedOrders.length === 0}
              className="admin-btn-primary text-xs"
            >
              {actionLoading ? 'Booking Pickup...' : 'Book Courier & Generate AWB'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Checkpoints Modal */}
      <Modal
        isOpen={!!trackingShipment}
        onClose={() => setTrackingShipment(null)}
        title={`Live Tracking: ${trackingShipment?.awbCode}`}
        subtitle={`Courier: ${trackingShipment?.courierName}`}
      >
        <div className="space-y-4">
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {trackingShipment?.trackingHistory?.length ? (
              trackingShipment.trackingHistory.map((cp, idx) => (
                <div key={idx} className="flex items-start gap-3 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 mt-1 flex-shrink-0" />
                  <div>
                    <div className="font-bold text-slate-800">{cp.status}</div>
                    <div className="text-slate-600">{cp.activity}</div>
                    <div className="text-[11px] text-slate-400">
                      {cp.location} • {new Date(cp.timestamp).toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-400 py-4 text-center">No live checkpoints yet.</div>
            )}
          </div>
          <div className="flex justify-end pt-2 border-t border-slate-100">
            <button onClick={() => setTrackingShipment(null)} className="admin-btn-secondary text-xs">
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
export default ShipmentsPage;
