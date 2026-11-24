import React, { useState, useEffect } from 'react';
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  ChevronLeft,
  ChevronRight,
  Receipt,
  Filter,
  FileSpreadsheet
} from 'lucide-react';
import { TableSkeleton } from '../components/LoadingSkeleton';
import { formatCurrency, formatNumber, formatDate } from '../utils/formatters';
import { salesService } from '../services/api';

export default function TransactionsPage({ filterParams, refreshTrigger }) {
  const [loading, setLoading] = useState(true);
  const [recordsData, setRecordsData] = useState({
    records: [],
    total_records: 0,
    total_pages: 1,
    current_page: 1,
    page_size: 15
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    let isMounted = true;
    const fetchTransactions = async () => {
      setLoading(true);
      try {
        const data = await salesService.getRecentSales({
          ...filterParams,
          page,
          page_size: pageSize,
          search: searchTerm || undefined,
          sort_by: sortBy,
          sort_order: sortOrder
        });
        if (isMounted) setRecordsData(data);
      } catch (err) {
        console.error('Error fetching transactions:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchTransactions();
    return () => { isMounted = false; };
  }, [filterParams, page, pageSize, searchTerm, sortBy, sortOrder, refreshTrigger]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setPage(1);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
        {/* Header Controls */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">Sales Transaction Ledger</h2>
            <p className="text-xs text-slate-500 font-medium">
              Showing page {recordsData.current_page} of {recordsData.total_pages} ({formatNumber(recordsData.total_records)} total records)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search product or category..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 w-60 text-slate-800"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>

            {/* Page Size Selector */}
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="15">15 per page</option>
              <option value="30">30 per page</option>
              <option value="50">50 per page</option>
              <option value="100">100 per page</option>
            </select>

            {/* Export Button */}
            <a
              href={salesService.exportCSVUrl(filterParams)}
              download="sales_transactions.csv"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 shadow-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export CSV</span>
            </a>
          </div>
        </div>

        {/* Transactions Table */}
        {loading ? (
          <TableSkeleton rows={pageSize} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase tracking-wider">
                  <th
                    onClick={() => handleSort('date')}
                    className="pb-3 cursor-pointer hover:text-slate-700 transition-colors w-32"
                  >
                    <div className="flex items-center gap-1">
                      Date
                      {sortBy === 'date' && (sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-indigo-600" /> : <ArrowDown className="w-3 h-3 text-indigo-600" />)}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('product')}
                    className="pb-3 cursor-pointer hover:text-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      Product
                      {sortBy === 'product' && (sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-indigo-600" /> : <ArrowDown className="w-3 h-3 text-indigo-600" />)}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('category')}
                    className="pb-3 cursor-pointer hover:text-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      Category
                      {sortBy === 'category' && (sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-indigo-600" /> : <ArrowDown className="w-3 h-3 text-indigo-600" />)}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('quantity')}
                    className="pb-3 text-right cursor-pointer hover:text-slate-700 transition-colors"
                  >
                    <div className="flex items-center justify-end gap-1">
                      Quantity
                      {sortBy === 'quantity' && (sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-indigo-600" /> : <ArrowDown className="w-3 h-3 text-indigo-600" />)}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('price')}
                    className="pb-3 text-right cursor-pointer hover:text-slate-700 transition-colors"
                  >
                    <div className="flex items-center justify-end gap-1">
                      Unit Price
                      {sortBy === 'price' && (sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-indigo-600" /> : <ArrowDown className="w-3 h-3 text-indigo-600" />)}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('revenue')}
                    className="pb-3 text-right cursor-pointer hover:text-slate-700 transition-colors"
                  >
                    <div className="flex items-center justify-end gap-1">
                      Total Revenue
                      {sortBy === 'revenue' && (sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-indigo-600" /> : <ArrowDown className="w-3 h-3 text-indigo-600" />)}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recordsData.records.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-400">
                      No sales records matching your query.
                    </td>
                  </tr>
                ) : (
                  recordsData.records.map((item, idx) => (
                    <tr key={`${item.date}-${item.product}-${idx}`} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 font-medium text-slate-600 whitespace-nowrap">
                        {formatDate(item.date)}
                      </td>
                      <td className="py-3 font-semibold text-slate-900 truncate max-w-xs">
                        {item.product}
                      </td>
                      <td className="py-3 text-slate-500">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[11px] font-medium text-slate-700">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-3 text-right font-medium text-slate-700">
                        {item.quantity}
                      </td>
                      <td className="py-3 text-right font-medium text-slate-700">
                        {formatCurrency(item.price)}
                      </td>
                      <td className="py-3 text-right font-bold text-slate-900">
                        {formatCurrency(item.revenue)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Toolbar */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-slate-600">
          <div>
            Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, recordsData.total_records)} of {formatNumber(recordsData.total_records)} entries
          </div>

          <div className="flex items-center gap-1.5 self-center">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-3 py-1 font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg">
              {page} / {recordsData.total_pages || 1}
            </span>

            <button
              onClick={() => setPage(Math.min(recordsData.total_pages, page + 1))}
              disabled={page >= recordsData.total_pages}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
