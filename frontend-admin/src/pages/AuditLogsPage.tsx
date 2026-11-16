import React, { useState, useEffect } from 'react';
import { Activity, Search, Eye, Filter } from 'lucide-react';
import { Modal } from '../components/common/Modal';
import { settingsApi, AuditLogItem } from '../services/adminApi';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [entityFilter, setEntityFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Selected log for diff viewer modal
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  const fetchLogs = async (p = page, entity = entityFilter, search = searchTerm) => {
    try {
      setLoading(true);
      const data = await settingsApi.listAuditLogs({
        page: p,
        limit: 15,
        entity: entity === 'ALL' ? undefined : entity,
        search: search.trim() || undefined,
      });
      setLogs(data.logs);
      setTotal(data.total);
      setPage(data.page);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1, entityFilter, searchTerm);
  }, [entityFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs(1, entityFilter, searchTerm);
  };

  const entityBadge = (entity: string) => {
    switch (entity) {
      case 'ORDER':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'PRODUCT':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'INVENTORY':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'STAFF':
      case 'USER':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'SETTINGS':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Activity Audit Logs</h1>
        <p className="text-sm text-slate-500 mt-1">
          Immutable ledger of administrative actions, pricing edits, stock adjustments, and staff mutations.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="admin-card p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search by action, email, or entity ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="admin-input pl-9 text-xs"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </form>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-600">Entity:</span>
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="admin-input text-xs py-1.5 w-auto"
          >
            <option value="ALL">All Entities</option>
            <option value="ORDER">Orders</option>
            <option value="PRODUCT">Products</option>
            <option value="INVENTORY">Inventory</option>
            <option value="STAFF">Staff</option>
            <option value="SETTINGS">Settings</option>
            <option value="COUPON">Coupons</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="admin-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="admin-table-th">Timestamp</th>
                <th className="admin-table-th">Action</th>
                <th className="admin-table-th">Entity</th>
                <th className="admin-table-th">Initiated By</th>
                <th className="admin-table-th">Entity ID</th>
                <th className="admin-table-th text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-slate-500">
                    Loading audit trail...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-slate-500">
                    No activity logs recorded matching criteria.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="admin-table-td whitespace-nowrap text-xs text-slate-500 font-mono">
                      {new Date(log.createdAt).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="admin-table-td">
                      <span className="font-semibold text-xs text-slate-800 font-mono bg-slate-100 px-2 py-0.5 rounded">
                        {log.action}
                      </span>
                    </td>
                    <td className="admin-table-td">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${entityBadge(
                          log.entity
                        )}`}
                      >
                        {log.entity}
                      </span>
                    </td>
                    <td className="admin-table-td">
                      <div>
                        <div className="text-xs font-semibold text-slate-900">{log.userId?.name || log.userName || 'System'}</div>
                        <div className="text-[11px] text-slate-500">{log.userId?.email || 'Automated'}</div>
                      </div>
                    </td>
                    <td className="admin-table-td font-mono text-xs text-slate-600 truncate max-w-[120px]">
                      {log.entityId}
                    </td>
                    <td className="admin-table-td text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Diff</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 bg-slate-50/50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <div>
              Showing page <span className="font-semibold">{page}</span> of{' '}
              <span className="font-semibold">{totalPages}</span> ({total} total actions)
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => fetchLogs(page - 1)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => fetchLogs(page + 1)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Diff Inspector Modal */}
      <Modal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title={`Audit Event: ${selectedLog?.action}`}
        subtitle={`Entity: ${selectedLog?.entity} (${selectedLog?.entityId}) at ${
          selectedLog ? new Date(selectedLog.createdAt).toLocaleString('en-IN') : ''
        }`}
      >
        <div className="space-y-4">
          <div className="bg-slate-900 rounded-xl p-4 text-xs font-mono text-emerald-400 overflow-x-auto max-h-96">
            <pre>{JSON.stringify(selectedLog?.diff || { info: 'No recorded state diff for this event' }, null, 2)}</pre>
          </div>
          <div className="flex justify-end pt-2">
            <button onClick={() => setSelectedLog(null)} className="admin-btn-secondary text-xs">
              Close Inspector
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
export default AuditLogsPage;
