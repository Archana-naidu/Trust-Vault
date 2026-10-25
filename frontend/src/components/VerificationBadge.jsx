import React from 'react';
import { ShieldCheck, ShieldAlert, Clock } from 'lucide-react';

export default function VerificationBadge({ status, size = 'sm' }) {
  const isVerified = status === 'VERIFIED';
  const isTampered = status === 'TAMPER_DETECTED';

  const sizeClasses = size === 'lg' 
    ? 'px-3 py-1.5 text-xs' 
    : 'px-2 py-0.5 text-[11px]';

  if (isVerified) {
    return (
      <span className={`inline-flex items-center gap-1.5 font-bold uppercase tracking-wider rounded-md bg-emerald-50 text-emerald-700 border border-emerald-300 shadow-2xs ${sizeClasses}`}>
        <ShieldCheck className={size === 'lg' ? 'w-4 h-4' : 'w-3 h-3'} />
        <span>VERIFIED AUTHENTIC</span>
      </span>
    );
  }

  if (isTampered) {
    return (
      <span className={`inline-flex items-center gap-1.5 font-bold uppercase tracking-wider rounded-md bg-rose-50 text-rose-700 border border-rose-300 shadow-2xs animate-pulse ${sizeClasses}`}>
        <ShieldAlert className={size === 'lg' ? 'w-4 h-4' : 'w-3 h-3'} />
        <span>TAMPER DETECTED</span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 font-medium uppercase tracking-wider rounded-md bg-slate-100 text-slate-600 border border-slate-200 ${sizeClasses}`}>
      <Clock className={size === 'lg' ? 'w-4 h-4' : 'w-3 h-3'} />
      <span>PENDING CHECK</span>
    </span>
  );
}
