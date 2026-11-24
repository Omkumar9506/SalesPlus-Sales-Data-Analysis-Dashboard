import React from 'react';
import {
  Calendar,
  Filter,
  RefreshCw,
  Upload,
  Download,
  RotateCcw,
  Sparkles,
  Search
} from 'lucide-react';

export default function Navbar({
  isCollapsed,
  activeTab,
  categories,
  selectedCategory,
  setSelectedCategory,
  dateRangePreset,
  setDateRangePreset,
  customDates,
  setCustomDates,
  onRefresh,
  onOpenUpload,
  onOpenReset,
  loading
}) {
  const titleMap = {
    overview: { title: 'Executive Sales Dashboard', subtitle: 'Real-time revenue metrics, KPIs, and growth performance' },
    analytics: { title: 'Sales & Revenue Analytics', subtitle: 'Deep dive into revenue trends, order volume, and category mix' },
    products: { title: 'Product Performance', subtitle: 'Identify top revenue drivers, unit volume, and product catalogue stats' },
    forecast: { title: 'Machine Learning Revenue Forecasting', subtitle: 'Scikit-learn Linear Regression predictive models and performance metrics' },
    transactions: { title: 'Transaction Records', subtitle: 'Full searchable and filterable sales transaction ledger' },
    data: { title: 'CSV Dataset Management', subtitle: 'Upload custom sales CSV files, inspect schemas, and manage datasets' },
  };

  const currentHeader = titleMap[activeTab] || { title: 'Sales Analytics', subtitle: 'Business Intelligence Dashboard' };

  return (
    <header
      className={`sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-200/80 transition-all duration-300 ${
        isCollapsed ? 'pl-20' : 'pl-64'
      }`}
    >
      <div className="px-6 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Title & Subtitle */}
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            {currentHeader.title}
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {currentHeader.subtitle}
          </p>
        </div>

        {/* Global Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Category Filter */}
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg pl-8 pr-8 py-2 hover:bg-slate-100 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
            >
              <option value="All">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Date Range Preset Selector */}
          <div className="relative">
            <select
              value={dateRangePreset}
              onChange={(e) => setDateRangePreset(e.target.value)}
              className="appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg pl-8 pr-8 py-2 hover:bg-slate-100 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
            >
              <option value="all">All Time (18 Months)</option>
              <option value="last30">Last 30 Days</option>
              <option value="last90">Last 90 Days</option>
              <option value="last180">Last 6 Months</option>
              <option value="year2025">Year 2025</option>
              <option value="year2026">Year 2026</option>
            </select>
            <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors disabled:opacity-50"
            title="Refresh analytics data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>

          {/* Upload CSV Quick Action */}
          <button
            onClick={onOpenUpload}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 shadow-sm shadow-indigo-100 transition-all"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload CSV</span>
          </button>

          {/* Reset Dataset Button */}
          <button
            onClick={onOpenReset}
            className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-slate-200 bg-white text-slate-600 text-xs font-medium hover:bg-slate-50 hover:text-slate-900 transition-all"
            title="Restore default realistic sales dataset"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>
    </header>
  );
}
