import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

export default function KpiCard({
  title,
  value,
  icon: Icon,
  change,
  comparisonLabel,
  prefix = '',
  suffix = '',
  badgeColor = 'indigo',
  subtitle
}) {
  const isPositive = change > 0;
  const isNegative = change < 0;
  const isNeutral = change === 0 || change === null || change === undefined;

  const colorStyles = {
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm hover-lift relative overflow-hidden transition-all duration-200">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500 tracking-wide">{title}</p>
        {Icon && (
          <div className={`p-2.5 rounded-lg border ${colorStyles[badgeColor] || colorStyles.indigo}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-3">
        <h3 className="text-2xl font-bold tracking-tight text-slate-900">
          {prefix}{value}{suffix}
        </h3>
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs">
        {change !== undefined && change !== null && (
          <span
            className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full font-semibold ${
              isPositive
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                : isNegative
                ? 'bg-rose-50 text-rose-700 border border-rose-200/60'
                : 'bg-slate-100 text-slate-600 border border-slate-200'
            }`}
          >
            {isPositive && <ArrowUpRight className="w-3.5 h-3.5" />}
            {isNegative && <ArrowDownRight className="w-3.5 h-3.5" />}
            {isNeutral && <Minus className="w-3.5 h-3.5" />}
            {isPositive ? `+${change}%` : `${change}%`}
          </span>
        )}

        {comparisonLabel && (
          <span className="text-slate-400 truncate font-medium">
            {comparisonLabel}
          </span>
        )}

        {subtitle && !comparisonLabel && (
          <span className="text-slate-400 truncate">{subtitle}</span>
        )}
      </div>
    </div>
  );
}
