import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Mail,
  Smartphone,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  Filter,
  RefreshCw,
  Send,
} from 'lucide-react';
import { DataTable, Column } from '../components/common/DataTable';
import { Modal } from '../components/common/Modal';
import { useToast } from '../components/common/Toast';
import { reportsApi, NotificationLogData } from '../services/adminApi';

export const NotificationsPage: React.FC = () => {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<NotificationLogData[]>([]);
  const [loading, setLoading] = useState(true);
  const [channelFilter, setChannelFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedLog, setSelectedLog] = useState<NotificationLogData | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await reportsApi.listNotifications({
        limit: 100,
        channel: channelFilter,
        status: statusFilter,
      });
      setNotifications(res.notifications);
    } catch (err: any) {
      toast.error('Failed to load notification logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [channelFilter, statusFilter]);

  const channelIcon = (ch: string) => {
    switch (ch) {
      case 'WHATSAPP':
        return <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />;
      case 'EMAIL':
        return <Mail className="w-3.5 h-3.5 text-sky-600" />;
      default:
        return <Smartphone className="w-3.5 h-3.5 text-purple-600" />;
    }
  };

  const channelBadge = (ch: string) => {
    switch (ch) {
      case 'WHATSAPP':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'EMAIL':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      default:
        return 'bg-purple-50 text-purple-700 border-purple-200';
    }
  };

  const columns: Column<NotificationLogData>[] = [
    {
      key: 'channel',
      header: 'Channel',
      render: (log: NotificationLogData) => (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${channelBadge(
            log.channel
          )}`}
        >
          {channelIcon(log.channel)}
          {log.channel}
        </span>
      ),
    },
    {
      key: 'recipient',
      header: 'Recipient Contact',
      sortable: true,
      render: (log: NotificationLogData) => (
        <div>
          <div className="font-mono font-semibold text-xs text-slate-900">{log.recipient}</div>
          {log.orderId && (
            <div className="text-[11px] text-slate-500">Order: {log.orderId.orderNumber}</div>
          )}
        </div>
      ),
    },
    {
      key: 'templateName',
      header: 'Template / Purpose',
      render: (log: NotificationLogData) => (
        <div>
          <div className="font-semibold text-xs text-slate-800">{log.templateName}</div>
          <div className="font-mono text-[10px] text-slate-400">ID: {log.externalMessageId || 'Pending MsgId'}</div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Delivery Status',
      render: (log: NotificationLogData) => {
        if (log.status === 'SENT') {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" /> SENT
            </span>
          );
        }
        if (log.status === 'FAILED') {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
              <AlertCircle className="w-3.5 h-3.5" /> FAILED
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5" /> QUEUED
          </span>
        );
      },
    },
    {
      key: 'attempts',
      header: 'Attempts',
      render: (log: NotificationLogData) => (
        <span className="font-mono text-xs text-slate-600">{log.attempts}</span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Dispatched At',
      sortable: true,
      render: (log: NotificationLogData) => (
        <span className="text-xs text-slate-500">
          {new Date(log.sentAt || log.createdAt).toLocaleString('en-IN', {
            dateStyle: 'short',
            timeStyle: 'short',
          })}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Inspect',
      render: (log: NotificationLogData) => (
        <button
          onClick={() => setSelectedLog(log)}
          className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded transition"
          title="View Payload & Details"
        >
          <Eye className="w-4 h-4" />
        </button>
      ),
    },
  ];

  const totalLogs = notifications.length;
  const sentCount = notifications.filter((n) => n.status === 'SENT').length;
  const failedCount = notifications.filter((n) => n.status === 'FAILED').length;
  const deliveryRate = totalLogs > 0 ? Math.round((sentCount / totalLogs) * 100) : 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Omnichannel Notification Logs</h1>
          <p className="text-sm text-slate-500">
            Audit automated WhatsApp Cloud, SMTP transactional email, and SMS messages delivered to customers.
          </p>
        </div>
        <button
          onClick={fetchLogs}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-sm font-medium transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Feed
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Delivery Rate</div>
            <div className="text-2xl font-bold text-emerald-600">{deliveryRate}%</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Successfully Sent</div>
            <div className="text-2xl font-bold text-slate-900">{sentCount}</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Send className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Failed Dispatches</div>
            <div className="text-2xl font-bold text-rose-600">{failedCount}</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-600 uppercase">Channel:</span>
          {['ALL', 'WHATSAPP', 'EMAIL', 'SMS'].map((ch) => (
            <button
              key={ch}
              onClick={() => setChannelFilter(ch)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                channelFilter === ch
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {ch}
            </button>
          ))}
        </div>

        <div className="h-4 w-px bg-slate-200 hidden sm:block" />

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-600 uppercase">Status:</span>
          {['ALL', 'SENT', 'FAILED', 'QUEUED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                statusFilter === st
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <DataTable
          columns={columns}
          data={notifications}
          isLoading={loading}
          keyExtractor={(item) => item._id}
          searchPlaceholder="Filter notification records..."
        />
      </div>

      {/* Payload Modal */}
      {selectedLog && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedLog(null)}
          title={`Notification Event: ${selectedLog.templateName}`}
          subtitle={`Dispatched via ${selectedLog.channel} to ${selectedLog.recipient}`}
        >
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500">Status:</span>{' '}
                <span className="font-bold text-slate-900">{selectedLog.status}</span>
              </div>
              <div>
                <span className="text-slate-500">Attempts:</span>{' '}
                <span className="font-bold text-slate-900">{selectedLog.attempts}</span>
              </div>
              <div>
                <span className="text-slate-500">Timestamp:</span>{' '}
                <span className="font-semibold text-slate-700">
                  {new Date(selectedLog.createdAt).toLocaleString('en-IN')}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Provider Message ID:</span>{' '}
                <span className="font-mono text-slate-700">{selectedLog.externalMessageId || 'N/A'}</span>
              </div>
            </div>

            {selectedLog.lastError && (
              <div className="bg-rose-50 border border-rose-200 p-3 rounded-lg text-xs text-rose-700">
                <span className="font-bold">Provider Error:</span> {selectedLog.lastError}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Payload JSON</label>
              <pre className="bg-slate-900 text-emerald-400 p-4 rounded-xl text-xs font-mono overflow-x-auto max-h-64">
                {JSON.stringify(selectedLog.payload, null, 2)}
              </pre>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 transition"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
