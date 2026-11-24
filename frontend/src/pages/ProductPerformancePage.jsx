import React, { useState, useEffect } from 'react';
import {
  Package,
  TrendingUp,
  Search,
  ArrowUpDown,
  Filter,
  DollarSign,
  ShoppingCart,
  Layers,
  ChevronDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell
} from 'recharts';
import { ChartSkeleton, TableSkeleton } from '../components/LoadingSkeleton';
import { formatCurrency, formatNumber } from '../utils/formatters';
import { salesService } from '../services/api';

const CustomBarTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 backdrop-blur-md text-white px-3 py-2 rounded-xl shadow-xl border border-slate-800 text-xs">
        <p className="font-semibold text-slate-300 mb-1 max-w-[200px] truncate">{label}</p>
        <div className="flex items-center gap-2">
          <span className="text-slate-400 capitalize">{payload[0].name}:</span>
          <span className="font-bold text-white">
            {payload[0].name.toLowerCase().includes('revenue')
              ? formatCurrency(payload[0].value)
              : formatNumber(payload[0].value)}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

export default function ProductPerformancePage({ filterParams, refreshTrigger }) {
  const [loading, setLoading] = useState(true);
  const [productsData, setProductsData] = useState({ by_revenue: [], by_quantity: [], all_products: [] });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('revenue');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    let isMounted = true;
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const data = await salesService.getTopProducts({ ...filterParams, limit: 10 });
        if (isMounted) setProductsData(data);
      } catch (err) {
        console.error('Error fetching product performance:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProducts();
    return () => { isMounted = false; };
  }, [filterParams, refreshTrigger]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartSkeleton height="h-88" />
          <ChartSkeleton height="h-88" />
        </div>
        <TableSkeleton rows={10} />
      </div>
    );
  }

  // Filter and sort product table
  const filteredProducts = (productsData.all_products || []).filter((p) => {
    const q = searchTerm.toLowerCase();
    return p.product.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];
    if (typeof valA === 'string') {
      return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    return sortOrder === 'asc' ? valA - valB : valB - valA;
  });

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const totalRev = filteredProducts.reduce((sum, p) => sum + p.revenue, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top 10 Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 10 by Revenue */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">Top 10 Products by Revenue</h2>
            <p className="text-xs text-slate-500 font-medium">Ranked by gross sales volume ($)</p>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={productsData.by_revenue}
                margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis
                  type="number"
                  stroke="#94a3b8"
                  fontSize={10}
                  tickLine={false}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                />
                <YAxis
                  type="category"
                  dataKey="product"
                  stroke="#94a3b8"
                  fontSize={10}
                  tickLine={false}
                  width={130}
                  tickFormatter={(val) => (val.length > 18 ? `${val.substring(0, 18)}...` : val)}
                />
                <Tooltip content={<CustomBarTooltip />} />
                <Bar dataKey="revenue" name="Total Revenue" fill="#4f46e5" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top 10 by Quantity Sold */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">Top 10 Products by Units Sold</h2>
            <p className="text-xs text-slate-500 font-medium">High-turnover fast-moving inventory items</p>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={productsData.by_quantity}
                margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="product"
                  stroke="#94a3b8"
                  fontSize={10}
                  tickLine={false}
                  width={130}
                  tickFormatter={(val) => (val.length > 18 ? `${val.substring(0, 18)}...` : val)}
                />
                <Tooltip content={<CustomBarTooltip />} />
                <Bar dataKey="quantity" name="Units Sold" fill="#06b6d4" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Product Performance Table with Search & Sort */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">Product Catalogue Performance Ledger</h2>
            <p className="text-xs text-slate-500 font-medium">
              Showing {sortedProducts.length} of {productsData.total_products || 0} products
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Search products or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 w-56 text-slate-800"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase tracking-wider">
                <th
                  onClick={() => handleSort('product')}
                  className="pb-3 cursor-pointer hover:text-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    Product
                    {sortField === 'product' && (sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('category')}
                  className="pb-3 cursor-pointer hover:text-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    Category
                    {sortField === 'category' && (sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('quantity')}
                  className="pb-3 text-right cursor-pointer hover:text-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-end gap-1">
                    Units Sold
                    {sortField === 'quantity' && (sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('avg_price')}
                  className="pb-3 text-right cursor-pointer hover:text-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-end gap-1">
                    Avg Price
                    {sortField === 'avg_price' && (sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('revenue')}
                  className="pb-3 text-right cursor-pointer hover:text-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-end gap-1">
                    Total Revenue
                    {sortField === 'revenue' && (sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('orders')}
                  className="pb-3 text-right cursor-pointer hover:text-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-end gap-1">
                    Orders
                    {sortField === 'orders' && (sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedProducts.map((p, idx) => {
                const sharePct = totalRev > 0 ? ((p.revenue / totalRev) * 100).toFixed(1) : 0;
                return (
                  <tr key={p.product} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 font-semibold text-slate-900 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                        {idx + 1}
                      </span>
                      <span className="truncate max-w-xs">{p.product}</span>
                    </td>
                    <td className="py-3 text-slate-600">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[11px] font-medium text-slate-700">
                        {p.category}
                      </span>
                    </td>
                    <td className="py-3 text-right font-medium text-slate-700">
                      {formatNumber(p.quantity)}
                    </td>
                    <td className="py-3 text-right font-medium text-slate-700">
                      {formatCurrency(p.avg_price)}
                    </td>
                    <td className="py-3 text-right">
                      <span className="font-bold text-slate-900">{formatCurrency(p.revenue)}</span>
                      <span className="text-slate-400 text-[10px] block">({sharePct}%)</span>
                    </td>
                    <td className="py-3 text-right font-medium text-slate-700">
                      {formatNumber(p.orders)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
