import React, { useEffect, useState, useMemo } from 'react';
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  FileText,
  Eye,
  Send,
  AlertTriangle,
  User,
  MapPin,
  CreditCard,
  Download,
  Search,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Sparkles,
  RotateCcw,
  Package,
  Printer,
  Calendar,
  ShieldCheck,
} from 'lucide-react';
import { DataTable, Column } from '../components/common/DataTable';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { useToast } from '../components/common/Toast';
import {
  orderApi,
  OrderData,
  CourierOptionData,
  OrderOperationalCounts,
} from '../services/adminApi';

// 7 Simplified Operational Categories
const OPERATIONAL_TABS = [
  { id: 'ALL', label: 'All Orders', countKey: 'all' },
  { id: 'NEW_ORDERS', label: '1. New Orders', countKey: 'newOrders' },
  { id: 'ACCEPTED', label: '2. Accepted / Preparing', countKey: 'accepted' },
  { id: 'READY_FOR_PICKUP', label: '3. Ready for Pickup', countKey: 'readyForPickup' },
  { id: 'SHIPPED', label: '4. Shipped / In Transit', countKey: 'shipped' },
  { id: 'DELIVERED', label: '5. Delivered', countKey: 'delivered' },
  { id: 'EXCEPTIONS', label: '6. Exceptions', countKey: 'exceptions' },
  { id: 'CANCELLED', label: '7. Cancelled / Returns', countKey: 'cancelled' },
];

export const OrdersPage: React.FC = () => {
  const { toast } = useToast();
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [counts, setCounts] = useState<OrderOperationalCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Selected Order for Full Detail Modal
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Accept & Select Courier Modal State
  const [acceptModalOpen, setAcceptModalOpen] = useState(false);
  const [targetOrderForAccept, setTargetOrderForAccept] = useState<OrderData | null>(null);
  const [courierLoading, setCourierLoading] = useState(false);
  const [courierOptions, setCourierOptions] = useState<CourierOptionData[]>([]);
  const [packageMetrics, setPackageMetrics] = useState<{ weight: number; length: number; breadth: number; height: number } | null>(null);
  const [selectedCourierId, setSelectedCourierId] = useState<number | undefined>(undefined);

  // Schedule Pickup Modal State
  const [pickupModalOpen, setPickupModalOpen] = useState(false);
  const [targetOrderForPickup, setTargetOrderForPickup] = useState<OrderData | null>(null);
  const [pickupDate, setPickupDate] = useState<string>(
    new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );

  // Internal Note State
  const [noteText, setNoteText] = useState('');

  // Cancel Modal State
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('Customer requested cancellation before dispatch');

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await orderApi.list({
        limit: 100,
        category: selectedCategory === 'ALL' ? undefined : selectedCategory,
        search: searchTerm.trim() || undefined,
      });
      setOrders(res.orders);
      if (res.counts) {
        setCounts(res.counts);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [selectedCategory]);

  const handleOpenDetail = async (ord: OrderData) => {
    try {
      setDetailLoading(true);
      const res = await orderApi.getById(ord._id);
      setSelectedOrder(res.order);
      setNoteText('');
    } catch (err: any) {
      toast.error('Failed to load order details');
    } finally {
      setDetailLoading(false);
    }
  };

  // Stage 1 -> 2: Open Accept & Courier Selection Modal
  const handleOpenAcceptModal = async (ord: OrderData) => {
    setTargetOrderForAccept(ord);
    setAcceptModalOpen(true);
    setCourierLoading(true);
    setCourierOptions([]);
    setSelectedCourierId(undefined);

    try {
      const data = await orderApi.getCouriers(ord._id);
      setPackageMetrics(data.metrics);
      setCourierOptions(data.couriers);
      if (data.couriers.length > 0) {
        setSelectedCourierId(data.couriers[0].courierCompanyId);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to calculate courier rates');
    } finally {
      setCourierLoading(false);
    }
  };

  // Stage 2: Confirm Accept & Generate Shipment in Shiprocket
  const handleConfirmAcceptShipment = async () => {
    if (!targetOrderForAccept) return;
    try {
      setActionLoading(true);
      const res = await orderApi.acceptShipment(targetOrderForAccept._id, selectedCourierId);
      toast.success(res.message);
      setAcceptModalOpen(false);

      if (selectedOrder?._id === targetOrderForAccept._id) {
        setSelectedOrder(res.data.order);
      }
      fetchOrders();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to book shipment');
    } finally {
      setActionLoading(false);
    }
  };

  // Stage 3 -> 4: Open Schedule Pickup Modal
  const handleOpenPickupModal = (ord: OrderData) => {
    setTargetOrderForPickup(ord);
    setPickupDate(new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    setPickupModalOpen(true);
  };

  // Stage 4: Confirm Schedule Pickup
  const handleConfirmSchedulePickup = async () => {
    if (!targetOrderForPickup) return;
    try {
      setActionLoading(true);
      const res = await orderApi.schedulePickup(targetOrderForPickup._id, pickupDate);
      toast.success(res.message);
      setPickupModalOpen(false);

      if (selectedOrder?._id === targetOrderForPickup._id) {
        setSelectedOrder(res.data.order);
      }
      fetchOrders();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to schedule pickup');
    } finally {
      setActionLoading(false);
    }
  };

  // Direct Label Download Handler
  const handleDownloadLabel = async (orderId: string) => {
    try {
      toast.info('Fetching shipping label...');
      const data = await orderApi.getLabel(orderId);
      if (data.labelUrl) {
        window.open(data.labelUrl, '_blank');
        toast.success('Shipping label opened.');
      } else {
        toast.error('Shipping label URL not available.');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to open shipping label');
    }
  };

  // Direct Handover Manifest Download Handler
  const handleDownloadManifest = async (orderId: string) => {
    try {
      toast.info('Generating courier handover manifest...');
      const data = await orderApi.getManifest(orderId);
      if (data.manifestUrl) {
        window.open(data.manifestUrl, '_blank');
        toast.success('Courier manifest opened.');
      } else {
        toast.error('Manifest URL not ready.');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to generate manifest');
    }
  };

  const handleConfirmCancel = async () => {
    if (!selectedOrder) return;
    try {
      setActionLoading(true);
      const res = await orderApi.cancel(selectedOrder._id, cancelReason);
      toast.success(res.message);
      setIsCancelModalOpen(false);
      setSelectedOrder(res.data.order);
      fetchOrders();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Cancellation failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !noteText.trim()) return;

    try {
      setActionLoading(true);
      const res = await orderApi.addNote(selectedOrder._id, noteText);
      toast.success('Note appended to timeline.');
      setSelectedOrder(res.data.order);
      setNoteText('');
    } catch (err: any) {
      toast.error('Failed to add note');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadInvoice = async (orderId: string, orderNumber: string) => {
    try {
      toast.info('Generating official Tax Invoice PDF...');
      await orderApi.downloadInvoice(orderId, orderNumber);
      toast.success('Tax invoice downloaded.');
    } catch (err: any) {
      toast.error('Failed to download invoice PDF');
    }
  };

  // Automated Next Action Resolver for each Order Row
  const renderNextAction = (ord: OrderData) => {
    const tracking = ord.shipmentDetails || (ord as any).shipment;
    const hasAwb = Boolean(tracking?.awbCode || tracking?.awbNumber);
    const hasPickup = Boolean(tracking?.pickupTokenNumber);

    // 1. New Order -> Accept Order
    if (!hasAwb && (ord.orderStatus === 'PENDING' || ord.orderStatus === 'CONFIRMED')) {
      return (
        <button
          onClick={() => handleOpenAcceptModal(ord)}
          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-2xs transition-all whitespace-nowrap"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Accept Order</span>
        </button>
      );
    }

    // 2. Accepted / Label Ready -> Download Label & Schedule Pickup
    if (hasAwb && !hasPickup && (ord.orderStatus === 'CONFIRMED' || ord.orderStatus === 'PROCESSING')) {
      return (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handleDownloadLabel(ord._id)}
            className="px-2.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-2xs transition-all whitespace-nowrap"
            title="Download Shipping Label"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Label</span>
          </button>
          <button
            onClick={() => handleOpenPickupModal(ord)}
            className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-2xs transition-all whitespace-nowrap"
            title="Mark packed & schedule courier pickup"
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Schedule Pickup</span>
          </button>
        </div>
      );
    }

    // 3. Pickup Scheduled -> Waiting for Courier
    if (hasPickup && ord.orderStatus === 'READY_TO_SHIP') {
      return (
        <div className="flex items-center gap-1.5">
          <span className="px-2 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-md text-[11px] font-semibold flex items-center gap-1 whitespace-nowrap">
            <Clock className="w-3 h-3 text-amber-600" />
            <span>Pickup Slotted</span>
          </span>
          <button
            onClick={() => handleDownloadManifest(ord._id)}
            className="p-2 sm:p-1.5 min-w-[36px] min-h-[36px] flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
            title="Download Handover Manifest"
          >
            <FileText className="w-4 h-4" />
          </button>
        </div>
      );
    }

    // 4. Shipped / In Transit / Out for Delivery -> 100% Automated Carrier Tracking
    if (['SHIPPED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(ord.orderStatus)) {
      return (
        <div className="flex items-center gap-1">
          <span className="px-2 py-1 bg-cyan-50 text-cyan-800 border border-cyan-200 rounded-md text-[11px] font-semibold flex items-center gap-1 whitespace-nowrap">
            <Sparkles className="w-3 h-3 text-cyan-600" />
            <span>Live Carrier Sync</span>
          </span>
          {tracking?.trackingUrl && (
            <a
              href={tracking.trackingUrl}
              target="_blank"
              rel="noreferrer"
              className="p-2 sm:p-1.5 min-w-[36px] min-h-[36px] flex items-center justify-center text-teal-700 hover:bg-teal-50 rounded-md transition-colors"
              title="Track live on courier site"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      );
    }

    // 5. Delivered
    if (ord.orderStatus === 'DELIVERED') {
      return (
        <span className="px-2 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md text-[11px] font-semibold flex items-center gap-1 whitespace-nowrap">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          <span>Completed</span>
        </span>
      );
    }

    // 6. Exceptions
    if (['DELIVERY_FAILED', 'SHIPMENT_DELAYED'].includes(ord.orderStatus)) {
      return (
        <span className="px-2 py-1 bg-rose-50 text-rose-800 border border-rose-200 rounded-md text-[11px] font-semibold flex items-center gap-1 whitespace-nowrap">
          <AlertTriangle className="w-3 h-3 text-rose-600" />
          <span>Carrier Exception</span>
        </span>
      );
    }

    // 7. Cancelled / Returned
    if (['CANCELLED', 'RETURNED', 'REFUNDED'].includes(ord.orderStatus)) {
      return (
        <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-md text-[11px] font-medium whitespace-nowrap">
          {ord.orderStatus}
        </span>
      );
    }

    return null;
  };

  const columns: Column<OrderData>[] = [
    {
      key: 'orderNumber',
      header: 'Order Details',
      sortable: true,
      render: (ord: OrderData) => (
        <div>
          <button
            onClick={() => handleOpenDetail(ord)}
            className="font-mono font-bold text-xs text-teal-700 hover:text-teal-900 hover:underline flex items-center gap-1"
          >
            <span>{ord.orderNumber}</span>
          </button>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {new Date(ord.createdAt).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        </div>
      ),
    },
    {
      key: 'customer',
      header: 'Customer & Address',
      render: (ord: OrderData) => (
        <div>
          <div className="text-xs font-semibold text-slate-900">
            {ord.shippingAddress?.fullName || 'Customer'}
          </div>
          <div className="text-[11px] text-slate-500 font-mono">{ord.shippingAddress?.phone}</div>
          <div className="text-[10px] text-slate-400 truncate max-w-[160px]">
            {ord.shippingAddress?.city}, {ord.shippingAddress?.state} ({ord.shippingAddress?.pincode})
          </div>
        </div>
      ),
    },
    {
      key: 'items',
      header: 'Items',
      render: (ord: OrderData) => (
        <div className="text-xs">
          <span className="font-semibold text-slate-800">
            {ord.items?.reduce((acc, i) => acc + i.quantity, 0)} item(s)
          </span>
          <div className="text-[11px] text-slate-500 truncate max-w-xs">
            {ord.items?.map((i) => `${i.quantity}x ${i.title}`).join(', ')}
          </div>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Amount & Pay',
      sortable: true,
      render: (ord: OrderData) => (
        <div>
          <div className="font-bold text-xs text-slate-900">
            ₹{(ord.pricing?.finalTotal || 0).toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            {ord.paymentMethod} •{' '}
            <span
              className={
                ord.paymentStatus === 'PAID'
                  ? 'text-emerald-700 font-semibold'
                  : 'text-amber-700 font-semibold'
              }
            >
              {ord.paymentStatus}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'orderStatus',
      header: 'Order Status',
      sortable: true,
      render: (ord: OrderData) => <StatusBadge status={ord.orderStatus} />,
    },
    {
      key: 'tracking',
      header: 'Shipment / AWB',
      render: (ord: OrderData) => {
        const tracking = ord.shipmentDetails || (ord as any).shipment;
        if (!tracking?.awbCode && !tracking?.awbNumber) {
          return <span className="text-[11px] text-slate-400 italic">Not Booked</span>;
        }
        const awb = tracking.awbCode || tracking.awbNumber;
        const courier = tracking.courierName || 'Courier Partner';
        return (
          <div className="text-xs">
            <div className="font-mono font-bold text-teal-800 flex items-center gap-1">
              <span>{awb}</span>
            </div>
            <div className="text-[10px] text-slate-500 truncate max-w-[130px]">{courier}</div>
            {tracking.pickupTokenNumber && (
              <div className="text-[9px] font-mono text-amber-700">Token: {tracking.pickupTokenNumber}</div>
            )}
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: 'Automated Action',
      render: (ord: OrderData) => (
        <div className="flex items-center gap-2">
          {renderNextAction(ord)}
          <button
            onClick={() => handleOpenDetail(ord)}
            className="p-2 sm:p-1.5 min-w-[36px] min-h-[36px] flex items-center justify-center text-slate-400 hover:text-teal-700 hover:bg-teal-50 rounded-md transition-colors"
            title="Inspect full order"
            aria-label="Inspect full order"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDownloadInvoice(ord._id, ord.orderNumber)}
            className="p-2 sm:p-1.5 min-w-[36px] min-h-[36px] flex items-center justify-center text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors"
            title="Download Tax Invoice"
            aria-label="Download Tax Invoice"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 sm:p-5 rounded-xl border border-slate-200/90 shadow-2xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex flex-wrap items-center gap-2">
            <span>Automated Order Fulfillment</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200 font-semibold">
              Shiprocket Live Sync
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Accept verified checkouts, print shipping labels, and schedule pickups. All carrier tracking syncs automatically.
          </p>
        </div>

        {/* Global Order Search Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchOrders();
          }}
          className="flex items-center gap-2 w-full sm:w-auto"
        >
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search order #, phone, customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-600 focus:bg-white transition-all"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {/* Simplified 7 Operational Workflow Tabs */}
      <div className="flex overflow-x-auto no-scrollbar gap-1.5 p-1 bg-white rounded-xl border border-slate-200/90 shadow-2xs">
        {OPERATIONAL_TABS.map((tab) => {
          const isActive = selectedCategory === tab.id;
          const count = counts ? (counts as any)[tab.countKey] : undefined;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                isActive
                  ? 'bg-teal-700 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <span>{tab.label}</span>
              {typeof count === 'number' && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Orders DataTable */}
      <DataTable
        data={orders}
        columns={columns}
        keyExtractor={(ord) => ord._id}
        isLoading={loading}
        searchPlaceholder="Filter listed orders..."
        searchableFields={['orderNumber', 'shippingAddress.fullName', 'shippingAddress.phone']}
        emptyMessage="No orders found matching this operational category."
        emptySubtitle="Orders will automatically appear here as they progress through Shiprocket fulfillment."
      />

      {/* Modal 1: Stage 2 Accept Order & Select Courier Modal */}
      <Modal
        isOpen={acceptModalOpen}
        onClose={() => setAcceptModalOpen(false)}
        title={targetOrderForAccept ? `Accept & Fulfill Order #${targetOrderForAccept.orderNumber}` : 'Accept Order'}
        subtitle="Validate customer details, confirm package metrics, and assign courier partner"
      >
        {targetOrderForAccept && (
          <div className="space-y-5 text-xs">
            {/* Order Brief Summary Banner */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-900 text-sm">
                  {targetOrderForAccept.shippingAddress?.fullName}
                </div>
                <div className="text-slate-500 text-[11px]">
                  {targetOrderForAccept.shippingAddress?.city}, {targetOrderForAccept.shippingAddress?.state} -{' '}
                  <strong className="font-mono text-slate-800">{targetOrderForAccept.shippingAddress?.pincode}</strong>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-slate-900 font-mono text-sm">
                  ₹{targetOrderForAccept.pricing?.finalTotal}
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase">
                  {targetOrderForAccept.paymentMethod}
                </span>
              </div>
            </div>

            {/* Calculated Package Metrics */}
            <div className="p-3.5 bg-teal-50/70 border border-teal-200 rounded-xl space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-teal-900 text-xs">
                <Package className="w-4 h-4 text-teal-700" />
                <span>Calculated Package Logistics Metrics</span>
              </div>
              <p className="text-[11px] text-teal-800">
                Calculated from item quantities and packaging tare weight:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-xs">
                <div className="bg-white p-2 rounded-lg border border-teal-200">
                  <span className="text-[10px] text-slate-400 block font-sans">Weight</span>
                  <strong className="text-slate-900">{packageMetrics?.weight || 0.5} kg</strong>
                </div>
                <div className="bg-white p-2 rounded-lg border border-teal-200">
                  <span className="text-[10px] text-slate-400 block font-sans">Length</span>
                  <strong className="text-slate-900">{packageMetrics?.length || 20} cm</strong>
                </div>
                <div className="bg-white p-2 rounded-lg border border-teal-200">
                  <span className="text-[10px] text-slate-400 block font-sans">Breadth</span>
                  <strong className="text-slate-900">{packageMetrics?.breadth || 15} cm</strong>
                </div>
                <div className="bg-white p-2 rounded-lg border border-teal-200">
                  <span className="text-[10px] text-slate-400 block font-sans">Height</span>
                  <strong className="text-slate-900">{packageMetrics?.height || 10} cm</strong>
                </div>
              </div>
            </div>

            {/* Available Courier Partners Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="font-bold text-slate-800 block text-xs">
                  Select Eligible Courier Partner
                </label>
                <span className="text-[10px] text-slate-400">
                  {courierOptions.length} available service(s)
                </span>
              </div>

              {courierLoading ? (
                <div className="py-8 text-center text-slate-400">
                  <div className="inline-block animate-spin w-5 h-5 border-2 border-teal-700 border-t-transparent rounded-full mb-2" />
                  <p>Fetching real-time courier rates from Shiprocket...</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {courierOptions.map((courier) => {
                    const isSelected = selectedCourierId === courier.courierCompanyId;
                    return (
                      <div
                        key={courier.courierCompanyId}
                        onClick={() => setSelectedCourierId(courier.courierCompanyId)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? 'border-teal-600 bg-teal-50/50 ring-1 ring-teal-600 shadow-2xs'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="courierSelection"
                            checked={isSelected}
                            onChange={() => setSelectedCourierId(courier.courierCompanyId)}
                            className="text-teal-600 focus:ring-teal-500"
                          />
                          <div>
                            <div className="font-bold text-slate-900">{courier.courierName}</div>
                            <div className="text-[11px] text-slate-500">
                              Estimated Delivery:{' '}
                              <strong className="text-slate-700">{courier.estimatedDeliveryDays} days</strong> • ★{' '}
                              {courier.rating}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="font-bold text-slate-900 font-mono text-sm">₹{courier.rate}</div>
                          <span className="text-[10px] text-slate-400">Freight Charge</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setAcceptModalOpen(false)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAcceptShipment}
                disabled={actionLoading || courierLoading || courierOptions.length === 0}
                className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-lg shadow-2xs transition-colors flex items-center gap-1.5"
              >
                {actionLoading ? 'Assigning AWB & Label...' : '✓ Accept Order & Generate AWB'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal 2: Stage 4 Schedule Courier Pickup Modal */}
      <Modal
        isOpen={pickupModalOpen}
        onClose={() => setPickupModalOpen(false)}
        title={targetOrderForPickup ? `Schedule Pickup for Order #${targetOrderForPickup.orderNumber}` : 'Schedule Pickup'}
        subtitle="Request carrier dispatch executive to collect the packed package"
      >
        {targetOrderForPickup && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
              <div className="flex items-center gap-2 font-bold text-blue-900 text-xs">
                <Truck className="w-4 h-4 text-blue-700" />
                <span>Parcel Packaging Verification</span>
              </div>
              <p className="text-[11px] text-blue-800">
                Please ensure the tamper-evident box is sealed and the <strong>Shipping Label</strong> is visibly attached before scheduling courier pickup.
              </p>
              <div className="pt-1 text-[11px] text-slate-600 font-mono">
                Courier: <strong>{targetOrderForPickup.shipmentDetails?.courierName || 'Courier Partner'}</strong> • AWB:{' '}
                <strong>{targetOrderForPickup.shipmentDetails?.awbNumber}</strong>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-800 block text-xs mb-1">
                Requested Pickup Date *
              </label>
              <input
                type="date"
                value={pickupDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setPickupDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-600 focus:bg-white"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                The courier partner executive will arrive at your Primary Warehouse between 11:00 AM – 4:00 PM on this date.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPickupModalOpen(false)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSchedulePickup}
                disabled={actionLoading || !pickupDate}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-2xs transition-colors flex items-center gap-1.5"
              >
                {actionLoading ? 'Scheduling...' : '🚚 Confirm & Schedule Pickup'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal 3: Order Details Inspection Modal */}
      <Modal
        isOpen={Boolean(selectedOrder && !acceptModalOpen && !pickupModalOpen && !isCancelModalOpen)}
        onClose={() => setSelectedOrder(null)}
        title={selectedOrder ? `Order #${selectedOrder.orderNumber}` : 'Order Details'}
        subtitle={
          selectedOrder
            ? `Placed on ${new Date(selectedOrder.createdAt).toLocaleString('en-IN', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}`
            : ''
        }
      >
        {selectedOrder && (
          <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-1">
            {/* Top Quick Actions Bar */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Current Status
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <StatusBadge status={selectedOrder.orderStatus} size="md" />
                  <span className="text-xs text-slate-600">
                    Payment:{' '}
                    <strong className="text-slate-900 font-mono">
                      {selectedOrder.paymentStatus} ({selectedOrder.paymentMethod})
                    </strong>
                  </span>
                </div>
              </div>

              {/* Contextual Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {/* 1. New Order Action */}
                {!selectedOrder.shipmentDetails?.awbNumber &&
                  (selectedOrder.orderStatus === 'PENDING' || selectedOrder.orderStatus === 'CONFIRMED') && (
                    <button
                      onClick={() => handleOpenAcceptModal(selectedOrder)}
                      disabled={actionLoading}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-2xs flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Accept Order & Assign Courier</span>
                    </button>
                  )}

                {/* 2. Label Ready Actions */}
                {selectedOrder.shipmentDetails?.awbNumber && (
                  <button
                    onClick={() => handleDownloadLabel(selectedOrder._id)}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold shadow-2xs flex items-center gap-1"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Download Shipping Label</span>
                  </button>
                )}

                {/* 3. Schedule Pickup Action */}
                {selectedOrder.shipmentDetails?.awbNumber &&
                  !selectedOrder.shipmentDetails?.pickupTokenNumber &&
                  (selectedOrder.orderStatus === 'CONFIRMED' || selectedOrder.orderStatus === 'PROCESSING') && (
                    <button
                      onClick={() => handleOpenPickupModal(selectedOrder)}
                      disabled={actionLoading}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-2xs flex items-center gap-1"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>Mark Packed & Schedule Pickup</span>
                    </button>
                  )}

                {/* 4. Manifest Download */}
                {selectedOrder.shipmentDetails?.pickupTokenNumber && (
                  <button
                    onClick={() => handleDownloadManifest(selectedOrder._id)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Download Manifest</span>
                  </button>
                )}

                {/* Cancel Order */}
                {['PENDING', 'CONFIRMED', 'PROCESSING'].includes(selectedOrder.orderStatus) && (
                  <button
                    onClick={() => setIsCancelModalOpen(true)}
                    disabled={actionLoading}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition-colors"
                  >
                    ✕ Cancel
                  </button>
                )}
              </div>
            </div>

            {/* Customer & Shipping Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border border-slate-200 rounded-xl space-y-1.5 bg-white shadow-2xs">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                  <User className="w-4 h-4 text-teal-700" />
                  <span>Customer Contact</span>
                </div>
                <div className="text-sm font-semibold text-slate-900">
                  {selectedOrder.shippingAddress?.fullName}
                </div>
                <div className="text-xs text-slate-600">
                  Phone: <strong className="font-mono">{selectedOrder.shippingAddress?.phone}</strong>
                </div>
                <div className="text-xs text-slate-600">
                  Email: {selectedOrder.userId?.email || selectedOrder.guestEmail || 'Not provided'}
                </div>
              </div>

              <div className="p-4 border border-slate-200 rounded-xl space-y-1.5 bg-white shadow-2xs">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                  <MapPin className="w-4 h-4 text-teal-700" />
                  <span>Delivery Address</span>
                </div>
                <div className="text-xs text-slate-700 leading-relaxed">
                  {selectedOrder.shippingAddress?.addressLine1}
                  {selectedOrder.shippingAddress?.addressLine2 && `, ${selectedOrder.shippingAddress.addressLine2}`}
                  <br />
                  {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} -{' '}
                  <span className="font-mono font-bold text-slate-900">
                    {selectedOrder.shippingAddress?.pincode}
                  </span>
                </div>
              </div>
            </div>

            {/* Active Courier Tracking Details Card */}
            {selectedOrder.shipmentDetails?.awbNumber && (
              <div className="p-4 bg-teal-50/60 border border-teal-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-teal-700 text-white flex items-center justify-center flex-shrink-0">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 block">
                      Assigned Courier & AWB
                    </span>
                    <div className="text-xs font-bold text-slate-900">
                      {selectedOrder.shipmentDetails.courierName} •{' '}
                      <span className="font-mono text-teal-800">
                        AWB: {selectedOrder.shipmentDetails.awbNumber}
                      </span>
                    </div>
                    {selectedOrder.shipmentDetails.pickupTokenNumber && (
                      <div className="text-[11px] text-amber-800 font-mono mt-0.5">
                        Pickup Token: <strong>{selectedOrder.shipmentDetails.pickupTokenNumber}</strong>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownloadLabel(selectedOrder._id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-teal-300 rounded-lg text-xs font-semibold text-teal-800 hover:bg-teal-100 transition-colors shadow-2xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>View Label</span>
                  </button>
                  {selectedOrder.shipmentDetails.trackingUrl && (
                    <a
                      href={selectedOrder.shipmentDetails.trackingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-700 rounded-lg text-xs font-semibold text-white hover:bg-teal-800 transition-colors shadow-2xs"
                    >
                      <span>Track Courier</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Line Items Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
              <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 font-bold text-xs text-slate-800 flex justify-between">
                <span>Purchased Products ({selectedOrder.items?.length})</span>
                <button
                  type="button"
                  onClick={() => handleDownloadInvoice(selectedOrder._id, selectedOrder.orderNumber)}
                  className="text-teal-700 hover:text-teal-900 flex items-center gap-1 font-semibold text-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Tax Invoice</span>
                </button>
              </div>

              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-500 bg-slate-50/40">
                    <th className="py-2 px-4 font-semibold">Item</th>
                    <th className="py-2 px-4 font-semibold">Flavor & Pack</th>
                    <th className="py-2 px-4 font-semibold">Unit Price</th>
                    <th className="py-2 px-4 font-semibold">Qty</th>
                    <th className="py-2 px-4 font-semibold text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedOrder.items?.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-9 h-9 rounded-lg object-contain bg-slate-100 border border-slate-200 p-0.5"
                          />
                          <div>
                            <div className="font-semibold text-slate-900">{item.title}</div>
                            <div className="text-[10px] text-slate-500 font-mono">{item.sku}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-4 text-slate-600">
                        {item.flavor} • {item.packSize}
                      </td>
                      <td className="py-2.5 px-4 font-mono">₹{item.unitPrice}</td>
                      <td className="py-2.5 px-4 font-mono font-bold">{item.quantity}</td>
                      <td className="py-2.5 px-4 font-mono font-bold text-right text-slate-900">
                        ₹{item.total}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pricing Breakdown Footer */}
              <div className="bg-slate-50/80 p-4 border-t border-slate-200 flex justify-end">
                <div className="w-64 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal</span>
                    <span className="font-mono">₹{selectedOrder.pricing?.subtotal}</span>
                  </div>
                  {selectedOrder.pricing?.couponDiscount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-semibold">
                      <span>Discount ({selectedOrder.pricing?.couponCode})</span>
                      <span className="font-mono">-₹{selectedOrder.pricing.couponDiscount}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-600">
                    <span>GST (18% inclusive)</span>
                    <span className="font-mono">₹{selectedOrder.pricing?.taxGst}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Shipping Fee</span>
                    <span className="font-mono">
                      {selectedOrder.pricing?.shippingFee === 0 ? 'FREE' : `₹${selectedOrder.pricing?.shippingFee}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                    <span>Total Amount</span>
                    <span className="font-mono text-teal-800">
                      ₹{selectedOrder.pricing?.finalTotal}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline & Audit History Feed */}
            <div className="p-4 border border-slate-200 rounded-xl space-y-3.5 bg-white shadow-2xs">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Order Lifecycle & Automated Events Feed
                </h4>
                <span className="text-[11px] text-slate-400">
                  {selectedOrder.orderTimeline?.length || 0} event(s) recorded
                </span>
              </div>

              {/* Add Note Form */}
              <form onSubmit={handleAddNote} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add internal staff note to order timeline..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-600 focus:bg-white transition-all"
                />
                <button
                  type="submit"
                  disabled={actionLoading || !noteText.trim()}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1.5 flex-shrink-0 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Add Note</span>
                </button>
              </form>

              {/* Chronological Timeline Feed */}
              <div className="space-y-3 pt-2">
                {selectedOrder.orderTimeline?.length ? (
                  selectedOrder.orderTimeline.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3 text-xs border-l-2 border-teal-600 pl-3 py-0.5">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900">{item.status}</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 uppercase">
                            {item.source || 'SYSTEM'}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {new Date(item.timestamp).toLocaleString('en-IN', {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })}
                          </span>
                        </div>
                        <div className="text-slate-600 mt-0.5">{item.note}</div>
                        {item.authorName && (
                          <div className="text-[10px] text-slate-400 mt-0.5">By: {item.authorName}</div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-400">No previous timeline notes recorded.</div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors"
              >
                Close Details
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Cancel Order Modal */}
      <ConfirmDialog
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirm={handleConfirmCancel}
        title="Cancel Order & Restock Inventory"
        message={`Are you sure you want to cancel order #${selectedOrder?.orderNumber}? All purchased items will be immediately returned to available warehouse stock.`}
        confirmLabel="Confirm Cancellation"
        variant="danger"
        isLoading={actionLoading}
      />
    </div>
  );
};
