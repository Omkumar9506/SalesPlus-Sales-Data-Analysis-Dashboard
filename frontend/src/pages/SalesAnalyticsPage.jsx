import React, { useState, useEffect } from 'react';
import {
  LineChart as LineChartIcon,
  BarChart3,
  Calendar,
  Layers,
  ArrowUpRight,
  TrendingUp,
  Percent,
  CircleDollarSign
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  ZAxis
} from 'recharts';
import { ChartSkeleton } from '../components/LoadingSkeleton';
import { formatCurrency, formatNumber } from '../utils/formatters';
import { salesService } from '../services/api';

const CustomAnalyticsTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 backdrop-blur-md text-white px-3.5 py-2.5 rounded-xl shadow-xl border border-slate-800 text-xs">
        <p className="font-semibold text-slate-300 mb-1.5">{label}</p>
        {payload.map((entry, idx) => (
          <div key={`tip-${idx}`} className="flex items-center justify-between gap-4 py-0.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-slate-400 capitalize">{entry.name}:</span>
            </div>
            <span className="font-bold text-white">
              {entry.name.toLowerCase().includes('revenue') || entry.name.toLowerCase().includes('aov')
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

export default function SalesAnalyticsPage({ filterParams, refreshTrigger }) {
  const [loading, setLoading] = useState(true);
  const [monthlySales, setMonthlySales] = useState([]);
  const [dailySales, setDailySales] = useState([]);
  const [categorySales, setCategorySales] = useState([]);
  const [topProducts, setTopProducts] = useState([]);

  useEffect(() => {
    let isMounted = true;
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const [mData, dData, cData, pData] = await Promise.all([
          salesService.getMonthlySales(filterParams),
          salesService.getDailySales({ ...filterParams, limit_days: 60 }),
          salesService.getCategorySales(filterParams),
          salesService.getTopProducts({ ...filterParams, limit: 15 })
        ]);

        if (isMounted) {
          setMonthlySales(mData);
          setDailySales(dData);
          setCategorySales(cData);
          setTopProducts(pData.all_products || []);
        }
      } catch (err) {
        console.error('Error fetching sales analytics:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAnalytics();
    return () => { isMounted = false; };
  }, [filterParams, refreshTrigger]);

  if (loading) {
    return (
      <div className="space-y-6">
        <ChartSkeleton height="h-88" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartSkeleton height="h-80" />
          <ChartSkeleton height="h-80" />
        </div>
      </div>
    );
  }

  // Prepare scatter data for Revenue vs Quantity
  const scatterData = topProducts.map((p) => ({
    name: p.product,
    quantity: p.quantity,
    revenue: p.revenue,
    avg_price: p.avg_price,
    category: p.category
  }));

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Monthly Revenue & Order Volume Combo Chart */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">Monthly Revenue & Order Volume</h2>
            <p className="text-xs text-slate-500 font-medium">Dual-axis correlation of monthly sales gross vs order transactions</p>
          </div>
          <div className="flex items-center gap-3 text-xs font-semibold text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-indigo-500" /> Revenue ($)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-1 rounded bg-amber-500" /> Orders Count
            </span>
          </div>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={monthlySales} margin={{ top: 15, right: 15, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="month_name" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis
                yAxisId="left"
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
              />
              <Tooltip content={<CustomAnalyticsTooltip />} />
              <Bar
                yAxisId="left"
                dataKey="revenue"
                name="Monthly Revenue"
                fill="#6366f1"
                radius={[4, 4, 0, 0]}
                barSize={24}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="orders"
                name="Orders Count"
                stroke="#f59e0b"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#f59e0b' }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Daily Sales Trend & Average Order Value Evolution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Sales Trend */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">Daily Sales Fluctuation (Past 60 Days)</h2>
            <p className="text-xs text-slate-500 font-medium">Daily order revenue volatility</p>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailySales} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="dailyAnalGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="display_date" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip content={<CustomAnalyticsTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="Daily Revenue"
                  stroke="#2563eb"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#dailyAnalGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Average Order Value (AOV) */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">Average Order Value (AOV) Progression</h2>
            <p className="text-xs text-slate-500 font-medium">Trend in basket size per transaction</p>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlySales} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="aovGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month_name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip content={<CustomAnalyticsTooltip />} />
                <Area
                  type="monotone"
                  dataKey="aov"
                  name="Average Order Value"
                  stroke="#059669"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#aovGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 3. Category Breakdown Details Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
        <h2 className="text-sm font-bold text-slate-900 tracking-tight mb-1">Category Performance Summary</h2>
        <p className="text-xs text-slate-500 font-medium mb-4">Detailed metric breakdown across all active product categories</p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="pb-3">Category</th>
                <th className="pb-3 text-right">Revenue ($)</th>
                <th className="pb-3 text-right">Revenue Share</th>
                <th className="pb-3 text-right">Total Units Sold</th>
                <th className="pb-3 text-right">Orders Count</th>
                <th className="pb-3 text-right">Catalogue Depth</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {categorySales.map((cat) => (
                <tr key={cat.category} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 font-semibold text-slate-900 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-md" style={{ backgroundColor: cat.color }} />
                    {cat.category}
                  </td>
                  <td className="py-3 text-right font-bold text-slate-900">
                    {formatCurrency(cat.revenue)}
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }}
                        />
                      </div>
                      <span className="font-semibold text-slate-700 w-10 text-right">{cat.percentage}%</span>
                    </div>
                  </td>
                  <td className="py-3 text-right font-medium text-slate-600">
                    {formatNumber(cat.quantity)}
                  </td>
                  <td className="py-3 text-right font-medium text-slate-600">
                    {formatNumber(cat.orders)}
                  </td>
                  <td className="py-3 text-right font-medium text-slate-600">
                    {cat.products_count} products
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
