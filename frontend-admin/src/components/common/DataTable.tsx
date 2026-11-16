import React, { useState, useMemo } from 'react';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  Filter,
  X,
  Inbox,
  Loader2,
} from 'lucide-react';

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
}

interface BulkAction<T> {
  label: string;
  icon?: React.ReactNode;
  onClick: (selectedItems: T[]) => void | Promise<void>;
  variant?: 'danger' | 'primary' | 'secondary';
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string;
  isLoading?: boolean;
  searchPlaceholder?: string;
  searchableFields?: (keyof T | string)[];
  filterSlot?: React.ReactNode;
  bulkActions?: BulkAction<T>[];
  onExportCsv?: () => void;
  exportFilename?: string;
  emptyMessage?: string;
  emptySubtitle?: string;
  defaultPageSize?: number;
  // External pagination support (optional)
  serverPagination?: {
    totalItems: number;
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    onSearchChange?: (query: string) => void;
  };
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  keyExtractor,
  isLoading = false,
  searchPlaceholder = 'Search records...',
  searchableFields,
  filterSlot,
  bulkActions = [],
  onExportCsv,
  exportFilename = 'export',
  emptyMessage = 'No matching records found',
  emptySubtitle = 'Try adjusting your search criteria or clear active filters.',
  defaultPageSize = 10,
  serverPagination,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  // Handle Search Input
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
    if (serverPagination?.onSearchChange) {
      serverPagination.onSearchChange(query);
    }
  };

  // Client-side Filter & Sort
  const filteredData = useMemo(() => {
    if (serverPagination) return data; // Server handles filtering

    let list = [...data];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((item) => {
        if (searchableFields && searchableFields.length > 0) {
          return searchableFields.some((field) => {
            const val = item[field as string];
            return val ? String(val).toLowerCase().includes(q) : false;
          });
        }
        return Object.values(item).some((val) =>
          val ? String(val).toLowerCase().includes(q) : false
        );
      });
    }

    // Sort
    if (sortKey) {
      list.sort((a, b) => {
        const valA = a[sortKey];
        const valB = b[sortKey];
        if (valA === valB) return 0;
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;

        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortOrder === 'asc' ? valA - valB : valB - valA;
        }

        const comp = String(valA).localeCompare(String(valB));
        return sortOrder === 'asc' ? comp : -comp;
      });
    }

    return list;
  }, [data, searchQuery, sortKey, sortOrder, searchableFields, serverPagination]);

  // Pagination calculation
  const totalItems = serverPagination ? serverPagination.totalItems : filteredData.length;
  const totalPages = serverPagination
    ? serverPagination.totalPages
    : Math.ceil(totalItems / pageSize) || 1;
  const activePage = serverPagination ? serverPagination.currentPage : currentPage;

  const paginatedData = useMemo(() => {
    if (serverPagination) return data;
    const startIndex = (activePage - 1) * pageSize;
    return filteredData.slice(startIndex, startIndex + pageSize);
  }, [filteredData, activePage, pageSize, serverPagination, data]);

  // Handle Sort Toggle
  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortOrder === 'asc') setSortOrder('desc');
      else {
        setSortKey(null);
        setSortOrder('asc');
      }
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  // Selection handlers
  const allCurrentKeys = paginatedData.map(keyExtractor);
  const isAllSelected =
    allCurrentKeys.length > 0 && allCurrentKeys.every((k) => selectedKeys.has(k));

  const toggleSelectAll = () => {
    const next = new Set(selectedKeys);
    if (isAllSelected) {
      allCurrentKeys.forEach((k) => next.delete(k));
    } else {
      allCurrentKeys.forEach((k) => next.add(k));
    }
    setSelectedKeys(next);
  };

  const toggleSelectRow = (key: string) => {
    const next = new Set(selectedKeys);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setSelectedKeys(next);
  };

  const selectedItems = data.filter((item) => selectedKeys.has(keyExtractor(item)));

  // Client-side CSV Exporter
  const handleDefaultCsvExport = () => {
    if (onExportCsv) {
      onExportCsv();
      return;
    }

    if (data.length === 0) return;

    const headers = columns.map((c) => String(c.key));
    const csvRows = [headers.join(',')];

    data.forEach((row) => {
      const values = headers.map((header) => {
        const val = row[header];
        const escaped = ('' + (val ?? '')).replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${exportFilename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
      {/* Top Search, Filter, & Export Bar */}
      <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
        <div className="flex-1 flex flex-wrap items-center gap-2.5">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-9 pr-8 py-2 rounded-lg border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-slate-50/50 focus:bg-white"
            />
            {searchQuery && (
              <button
                onClick={() => handleSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Custom Filter Slot */}
          {filterSlot && <div className="flex items-center gap-2">{filterSlot}</div>}
        </div>

        {/* Action buttons (Export) */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDefaultCsvExport}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
            title="Export CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Bulk Actions Floating Toolbar */}
      {selectedKeys.size > 0 && bulkActions.length > 0 && (
        <div className="px-4 py-2.5 bg-indigo-50 border-b border-indigo-100 flex items-center justify-between gap-3 animate-in fade-in duration-150">
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-950">
            <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">
              {selectedKeys.size}
            </span>
            <span>selected across page</span>
          </div>

          <div className="flex items-center gap-2">
            {bulkActions.map((action, idx) => (
              <button
                key={idx}
                onClick={() => action.onClick(selectedItems)}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shadow-xs ${
                  action.variant === 'danger'
                    ? 'bg-rose-600 hover:bg-rose-700 text-white'
                    : action.variant === 'primary'
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
                }`}
              >
                {action.icon}
                <span>{action.label}</span>
              </button>
            ))}
            <button
              onClick={() => setSelectedKeys(new Set())}
              className="text-xs text-indigo-700 hover:underline px-2"
            >
              Deselect
            </button>
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="overflow-x-auto min-h-[300px]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {bulkActions.length > 0 && (
                <th className="w-10 px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                </th>
              )}

              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => col.sortable && handleSort(col.key)}
                  className={`px-4 py-3 text-slate-600 ${col.className || ''} ${
                    col.sortable ? 'cursor-pointer select-none hover:text-slate-900' : ''
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span>{col.header}</span>
                    {col.sortable && (
                      <span className="text-slate-400">
                        {sortKey === col.key ? (
                          sortOrder === 'asc' ? (
                            <ArrowUp className="w-3.5 h-3.5 text-indigo-600" />
                          ) : (
                            <ArrowDown className="w-3.5 h-3.5 text-indigo-600" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3 h-3 opacity-60" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
            {isLoading ? (
              // Loading Skeleton Rows
              [...Array(pageSize > 5 ? 5 : pageSize)].map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  {bulkActions.length > 0 && (
                    <td className="px-4 py-3.5 text-center">
                      <div className="w-4 h-4 bg-slate-200 rounded mx-auto" />
                    </td>
                  )}
                  {columns.map((col, cIdx) => (
                    <td key={cIdx} className="px-4 py-3.5">
                      <div className="h-4 bg-slate-200 rounded w-4/5" />
                    </td>
                  ))}
                </tr>
              ))
            ) : paginatedData.length === 0 ? (
              // Empty State
              <tr>
                <td
                  colSpan={columns.length + (bulkActions.length > 0 ? 1 : 0)}
                  className="px-4 py-16 text-center"
                >
                  <div className="max-w-xs mx-auto space-y-2">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
                      <Inbox className="w-6 h-6" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-800">{emptyMessage}</h4>
                    <p className="text-xs text-slate-500">{emptySubtitle}</p>
                    {searchQuery && (
                      <button
                        onClick={() => handleSearchChange('')}
                        className="text-xs text-indigo-600 font-semibold hover:underline pt-2 block mx-auto"
                      >
                        Clear search filter
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              // Live Data Rows
              paginatedData.map((item) => {
                const rowKey = keyExtractor(item);
                const isSelected = selectedKeys.has(rowKey);

                return (
                  <tr
                    key={rowKey}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      isSelected ? 'bg-indigo-50/40' : ''
                    }`}
                  >
                    {bulkActions.length > 0 && (
                      <td className="w-10 px-4 py-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectRow(rowKey)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>
                    )}

                    {columns.map((col) => (
                      <td key={col.key} className={`px-4 py-3.5 ${col.className || ''}`}>
                        {col.render ? col.render(item) : item[col.key] ?? '—'}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Bottom Pagination Bar */}
      <div className="px-4 py-3 border-t border-slate-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-center sm:text-left">
          <span>Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-2 py-1 rounded border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {[10, 20, 50, 100].map((sz) => (
              <option key={sz} value={sz}>
                {sz}
              </option>
            ))}
          </select>
          <span className="text-slate-400 hidden sm:inline">|</span>
          <span>
            Showing <strong>{totalItems === 0 ? 0 : (activePage - 1) * pageSize + 1}</strong> to{' '}
            <strong>{Math.min(activePage * pageSize, totalItems)}</strong> of{' '}
            <strong>{totalItems}</strong> entries
          </span>
        </div>

        {/* Page Nav Buttons */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={activePage <= 1 || isLoading}
            onClick={() => {
              const p = 1;
              if (serverPagination) serverPagination.onPageChange(p);
              else setCurrentPage(p);
            }}
            className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white"
            title="First Page"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            disabled={activePage <= 1 || isLoading}
            onClick={() => {
              const p = activePage - 1;
              if (serverPagination) serverPagination.onPageChange(p);
              else setCurrentPage(p);
            }}
            className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white"
            title="Previous Page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="px-3 py-1 font-semibold text-slate-800">
            Page {activePage} of {totalPages}
          </span>

          <button
            type="button"
            disabled={activePage >= totalPages || isLoading}
            onClick={() => {
              const p = activePage + 1;
              if (serverPagination) serverPagination.onPageChange(p);
              else setCurrentPage(p);
            }}
            className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white"
            title="Next Page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            disabled={activePage >= totalPages || isLoading}
            onClick={() => {
              const p = totalPages;
              if (serverPagination) serverPagination.onPageChange(p);
              else setCurrentPage(p);
            }}
            className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white"
            title="Last Page"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
