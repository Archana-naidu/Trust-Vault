import React from 'react';
import { ShieldCheck, Upload, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ title, subtitle, onOpenUpload }) {
  const { user } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shadow-xs sticky top-0 z-20">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs text-slate-500 font-medium">
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Live Integrity Status Pill */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Integrity Chain: <strong className="font-semibold text-emerald-900">Protected</strong></span>
        </div>

        {/* Quick Upload Button */}
        {onOpenUpload && (
          <button
            onClick={onOpenUpload}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold shadow-sm shadow-blue-500/20 transition-all hover:shadow active:scale-95"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Document</span>
          </button>
        )}

        {/* User Mini Profile */}
        <div className="pl-2 border-l border-slate-200 flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold">
            {user?.full_name?.charAt(0) || 'U'}
          </div>
          <div className="hidden md:block text-left">
            <div className="text-xs font-semibold text-slate-800 leading-tight">
              {user?.full_name?.split(' ')[0]}
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              {user?.role}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
