import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  ShoppingCart,
  Package,
  Layers,
  ShoppingBag,
  TrendingUp,
  ArrowRight,
  Sparkles,
  Tag
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import KpiCard from '../components/KpiCard';
import { CardSkeleton, ChartSkeleton, TableSkeleton } from '../components/LoadingSkeleton';
import { formatCurrency, formatNumber } from '../utils/formatters';
import { salesService } from '../services/api';

// Custom sleek tooltip for charts
const CustomTooltip = ({ active, payload, label, prefix = '$' }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 backdrop-blur-md text-white px-3 py-2.5 rounded-xl shadow-xl border border-slate-800 text-xs">
        <p className="font-semibold text-slate-300 mb-1">{label}</p>
        {payload.map((entry, index) => (
          <div key={`item-${index}`} className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: entry.color || entry.fill }}
            />
            <span className="text-slate-400 capitalize">{entry.name}:</span>
            <span className="font-bold text-white">
              {entry.name.toLowerCase().includes('revenue') || entry.name.toLowerCase().includes('price') || prefix === '$'
                ? formatCurrency(entry.value)
                : formatNumber(entry.value)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function OverviewPage({
  filterParams,
  setActiveTab,
  refreshTrigger
}) {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [monthlySales, setMonthlySales] = useState([]);
  const [categorySales, setCategorySales] = useState([]);
  const [dailySales, setDailySales] = useState([]);
  const [topProducts, setTopProducts] = useState([]);

  useEffect(() => {
    let isMounted = true;
    const loadOverviewData = async () => {
      setLoading(true);
      try {
        const [ovData, mData, cData, dData, pData] = await Promise.all([
          salesService.getOverview(filterParams),
          salesService.getMonthlySales(filterParams),
          salesService.getCategorySales(filterParams),
          salesService.getDailySales({ ...filterParams, limit_days: 30 }),
          salesService.getTopProducts({ ...filterParams, limit: 5 })
        ]);

        if (isMounted) {
          setOverview(ovData);
          setMonthlySales(mData);
          setCategorySales(cData);
          setDailySales(dData);
          setTopProducts(pData.by_revenue || []);
        }
      } catch (err) {
        console.error('Failed to load overview analytics:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadOverviewData();
    return () => { isMounted = false; };
  }, [filterParams, refreshTrigger]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <CardSkeleton count={6} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2"><ChartSkeleton height="h-80" /></div>
          <div><ChartSkeleton height="h-80" /></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartSkeleton height="h-72" />
          <TableSkeleton rows={5} />
        </div>
      </div>
    );
  }

  const comparison = overview?.comparison || {};

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard
          title="Total Revenue"
          value={formatCurrency(overview?.total_revenue || 0)}
          icon={DollarSign}
          change={comparison.revenue_growth}
          comparisonLabel={comparison.comparison_label}
          badgeColor="indigo"
        />
        <KpiCard
          title="Total Orders"
          value={formatNumber(overview?.total_orders || 0)}
          icon={ShoppingCart}
          change={comparison.orders_growth}
          comparisonLabel={comparison.comparison_label}
          badgeColor="blue"
        />
        <KpiCard
          title="Units Sold"
          value={formatNumber(overview?.total_units_sold || 0)}
          icon={Package}
          change={comparison.units_growth}
          comparisonLabel={comparison.comparison_label}
          badgeColor="emerald"
        />
        <KpiCard
          title="Avg Order Value"
          value={formatCurrency(overview?.average_order_value || 0)}
          icon={ShoppingBag}
          change={comparison.aov_growth}
          comparisonLabel={comparison.comparison_label}
          badgeColor="amber"
        />
        <KpiCard
          title="Active Products"
          value={formatNumber(overview?.total_products || 0)}
          icon={Tag}
          subtitle="Unique catalogue items"
          badgeColor="purple"
        />
        <KpiCard
          title="Categories"
          value={formatNumber(overview?.total_categories || 0)}
          icon={Layers}
          subtitle="Product lines"
          badgeColor="rose"
        />
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Revenue Trend (Area Chart) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">Monthly Revenue Trend</h2>
              <p className="text-xs text-slate-500 font-medium">Historical sales volume trajectory</p>
            </div>
            <button
              onClick={() => setActiveTab('analytics')}
              className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1 group"
            >
              Deep Analytics <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlySales} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month_name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip prefix="$" />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="Monthly Revenue"
                  stroke="#4f46e5"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#revenueGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Revenue Distribution (Donut Chart) */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">Category Breakdown</h2>
              <p className="text-xs text-slate-500 font-medium">Revenue contribution share</p>
            </div>
          </div>

          <div className="h-52 w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categorySales}
                  dataKey="revenue"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                >
                  {categorySales.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip prefix="$" />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Category Legend list */}
          <div className="space-y-1.5 mt-2 border-t border-slate-100 pt-3">
            {categorySales.map((cat) => (
              <div key={cat.category} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 truncate">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                  <span className="text-slate-600 font-medium truncate">{cat.category}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-900 font-semibold">{formatCurrency(cat.revenue)}</span>
                  <span className="text-slate-400 font-medium text-[11px] w-10 text-right">({cat.percentage}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Secondary Row: Daily Trend & Top 5 Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Sales Trend (Recent 30 Days) */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">Daily Sales Trend (Recent 30 Days)</h2>
              <p className="text-xs text-slate-500 font-medium">Short-term daily revenue pulses</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailySales} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="dailyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="display_date" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={10}
                  tickLine={false}
                  tickFormatter={(val) => `$${val}`}
                />
                <Tooltip content={<CustomTooltip prefix="$" />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="Daily Revenue"
                  stroke="#0891b2"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#dailyGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top 5 Products Quick Table */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">Top Revenue Drivers</h2>
              <p className="text-xs text-slate-500 font-medium">Leading products by total sales</p>
            </div>
            <button
              onClick={() => setActiveTab('products')}
              className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1 group"
            >
              All Products <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="pb-2.5">Product</th>
                  <th className="pb-2.5">Category</th>
                  <th className="pb-2.5 text-right">Units</th>
                  <th className="pb-2.5 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {topProducts.map((prod, idx) => (
                  <tr key={prod.product} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 font-medium text-slate-900 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="truncate max-w-[170px]">{prod.product}</span>
                    </td>
                    <td className="py-2.5 text-slate-500">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[11px] font-medium text-slate-700">
                        {prod.category}
                      </span>
                    </td>
                    <td className="py-2.5 text-right font-medium text-slate-600">
                      {formatNumber(prod.quantity)}
                    </td>
                    <td className="py-2.5 text-right font-bold text-slate-900">
                      {formatCurrency(prod.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
