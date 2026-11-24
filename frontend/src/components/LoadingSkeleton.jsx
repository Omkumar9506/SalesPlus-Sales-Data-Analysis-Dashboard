import React from 'react';

export function CardSkeleton({ count = 1 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs animate-pulse"
        >
          <div className="flex items-center justify-between">
            <div className="h-4 bg-slate-200 rounded w-24"></div>
            <div className="h-9 w-9 bg-slate-100 rounded-lg"></div>
          </div>
          <div className="mt-4">
            <div className="h-7 bg-slate-200 rounded w-32"></div>
          </div>
          <div className="mt-3 flex gap-2">
            <div className="h-4 bg-slate-100 rounded w-16"></div>
            <div className="h-4 bg-slate-100 rounded w-24"></div>
          </div>
        </div>
      ))}
    </>
  );
}

export function ChartSkeleton({ height = 'h-72' }) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs animate-pulse ${height} flex flex-col justify-between`}>
      <div className="flex justify-between items-center">
        <div className="h-5 bg-slate-200 rounded w-40"></div>
        <div className="h-4 bg-slate-100 rounded w-20"></div>
      </div>
      <div className="h-40 bg-slate-100/70 rounded-lg flex items-end p-4 gap-4">
        <div className="h-16 bg-slate-200 rounded w-full"></div>
        <div className="h-24 bg-slate-200 rounded w-full"></div>
        <div className="h-32 bg-slate-200 rounded w-full"></div>
        <div className="h-20 bg-slate-200 rounded w-full"></div>
        <div className="h-28 bg-slate-200 rounded w-full"></div>
        <div className="h-36 bg-slate-200 rounded w-full"></div>
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs animate-pulse">
      <div className="h-5 bg-slate-200 rounded w-36 mb-4"></div>
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4 items-center">
            <div className="h-4 bg-slate-100 rounded w-24"></div>
            <div className="h-4 bg-slate-200 rounded w-1/3"></div>
            <div className="h-4 bg-slate-100 rounded w-20"></div>
            <div className="h-4 bg-slate-200 rounded w-20 ml-auto"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
