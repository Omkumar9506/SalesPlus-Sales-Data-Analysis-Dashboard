import React from 'react';
import {
  LayoutDashboard,
  LineChart,
  Package,
  TrendingUp,
  Receipt,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  Database,
  Activity,
  Layers
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, isCollapsed, setIsCollapsed, backendHealthy, dbStatus }) {
  const navItems = [
    {
      id: 'overview',
      label: 'Executive Overview',
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: 'analytics',
      label: 'Sales Analytics',
      icon: LineChart,
      badge: null
    },
    {
      id: 'products',
      label: 'Product Performance',
      icon: Package,
      badge: null
    },
    {
      id: 'forecast',
      label: 'Revenue Forecasting',
      icon: TrendingUp,
      badge: 'ML'
    },
    {
      id: 'transactions',
      label: 'Sales Records',
      icon: Receipt,
      badge: null
    },
    {
      id: 'data',
      label: 'Dataset Manager',
      icon: FileSpreadsheet,
      badge: 'CSV'
    },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 z-30 h-screen bg-white border-r border-slate-200/90 transition-all duration-300 flex flex-col ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-100 flex-shrink-0">
            <Activity className="w-5 h-5 stroke-[2.5]" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-slate-900 tracking-tight text-base leading-none">
                SalesPulse
              </span>
              <span className="text-[11px] font-medium text-slate-400 mt-1 uppercase tracking-wider">
                BI & Analytics
              </span>
            </div>
          )}
        </div>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation List */}
      <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          {!isCollapsed ? 'Platform' : '•••'}
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group relative ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon
                className={`w-5 h-5 transition-colors flex-shrink-0 ${
                  isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'
                }`}
              />
              
              {!isCollapsed && (
                <span className="flex-1 text-left truncate">{item.label}</span>
              )}

              {!isCollapsed && item.badge && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                    isActive
                      ? 'bg-indigo-200/80 text-indigo-800'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {item.badge}
                </span>
              )}

              {/* Active Indicator bar */}
              {isActive && (
                <div className="absolute left-0 top-2 bottom-2 w-1 bg-indigo-600 rounded-r-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Backend & Database Status footer */}
      <div className="p-3 border-t border-slate-100 space-y-2">
        <div
          className={`flex items-center gap-3 p-2 rounded-xl bg-slate-50/80 border border-slate-100 ${
            isCollapsed ? 'justify-center' : ''
          }`}
        >
          <div className="relative flex items-center justify-center">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                backendHealthy ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
            {backendHealthy && (
              <span className="absolute w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping opacity-75" />
            )}
          </div>

          {!isCollapsed && (
            <div className="flex-1 truncate">
              <p className="text-xs font-semibold text-slate-800">
                {backendHealthy ? 'Flask API: Online' : 'Checking API...'}
              </p>
              <p className="text-[10px] text-slate-400 truncate">
                Port 5000 • Connected
              </p>
            </div>
          )}
        </div>

        {/* Database Status Widget */}
        <div
          onClick={() => setActiveTab('data')}
          className={`flex items-center gap-2.5 p-2 rounded-xl border cursor-pointer transition-all ${
            dbStatus?.is_mysql
              ? 'bg-blue-50/80 border-blue-200/80 text-blue-900 hover:bg-blue-100/70'
              : 'bg-emerald-50/80 border-emerald-200/80 text-emerald-900 hover:bg-emerald-100/70'
          } ${isCollapsed ? 'justify-center' : ''}`}
          title="Click to configure MySQL database"
        >
          <Database className={`w-3.5 h-3.5 flex-shrink-0 ${dbStatus?.is_mysql ? 'text-blue-600' : 'text-emerald-600'}`} />
          {!isCollapsed && (
            <div className="flex-1 truncate">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold truncate">
                  {dbStatus?.is_mysql ? 'MySQL Database' : 'SQLite Database'}
                </span>
                <span className="text-[9px] font-extrabold px-1 rounded bg-white/80 uppercase">
                  {dbStatus?.is_mysql ? 'MySQL' : 'SQL'}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 truncate">
                {dbStatus?.total_rows ? `${dbStatus.total_rows.toLocaleString()} records` : 'Connected'}
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
