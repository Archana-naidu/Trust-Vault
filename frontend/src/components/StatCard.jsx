import React from 'react';

export default function StatCard({ title, value, icon: Icon, color = 'blue', subtitle, alert = false }) {
  const colorMap = {
    blue: {
      bg: 'bg-blue-50 text-blue-600 border-blue-100',
      ring: 'ring-blue-500/10'
    },
    purple: {
      bg: 'bg-purple-50 text-purple-600 border-purple-100',
      ring: 'ring-purple-500/10'
    },
    emerald: {
      bg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      ring: 'ring-emerald-500/10'
    },
    amber: {
      bg: 'bg-amber-50 text-amber-600 border-amber-100',
      ring: 'ring-amber-500/10'
    },
    rose: {
      bg: 'bg-rose-50 text-rose-600 border-rose-100',
      ring: 'ring-rose-500/10'
    },
    indigo: {
      bg: 'bg-indigo-50 text-indigo-600 border-indigo-100',
      ring: 'ring-indigo-500/10'
    }
  };

  const scheme = colorMap[color] || colorMap.blue;

  return (
    <div className={`p-5 rounded-2xl bg-white border shadow-xs transition-all hover:shadow-md ${
      alert ? 'border-rose-300 ring-2 ring-rose-500/20' : 'border-slate-200'
    }`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</span>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${scheme.bg}`}>
          <Icon className="w-5 h-5 stroke-[2.2]" />
        </div>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">{value}</span>
        {alert && (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-100 text-rose-700 animate-pulse">
            Alert
          </span>
        )}
      </div>
      {subtitle && <p className="text-xs text-slate-500 mt-1 font-medium">{subtitle}</p>}
    </div>
  );
}
