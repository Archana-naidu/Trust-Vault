import React, { useState } from 'react';
import { X, Bug, ShieldAlert, CheckCircle2, RotateCcw, AlertTriangle, Loader2 } from 'lucide-react';
import { documentAPI } from '../services/api';

export default function TamperSimModal({ isOpen, onClose, document, onTamperExecuted }) {
  const [isTampering, setIsTampering] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  if (!isOpen || !document) return null;

  const handleSimulateTamper = async () => {
    setIsTampering(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await documentAPI.simulateTamper(document.id);
      if (res.data.success) {
        setMessage({
          type: 'tampered',
          text: 'Adversarial simulation complete: File byte-stream corrupted on disk. Click "Verify Document" to trigger cryptographic tamper detection.'
        });
        if (onTamperExecuted) onTamperExecuted();
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to simulate file tampering.'
      });
    } finally {
      setIsTampering(false);
    }
  };

  const handleRestoreTamper = async () => {
    setIsRestoring(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await documentAPI.restoreTamper(document.id);
      if (res.data.success) {
        setMessage({
          type: 'restored',
          text: 'Pristine file snapshot restored to vault. Document now matches original baseline hash.'
        });
        if (onTamperExecuted) onTamperExecuted();
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to restore file.'
      });
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 bg-amber-950 text-amber-100 flex items-center justify-between border-b border-amber-900">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center text-white">
              <Bug className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight text-white">Adversarial Tamper Simulation Lab</h3>
              <p className="text-xs text-amber-300 font-mono">Hiring Challenge Evaluation Sandbox</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-amber-300 hover:text-white hover:bg-amber-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-amber-900">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>Simulate Threat Actor Direct Disk Modification</span>
            </div>
            <p className="leading-relaxed">
              This lab injects an out-of-band byte payload directly into the stored document file on disk (bypassing normal API controls).
              When you re-run <strong>Cryptographic Verification</strong>, TrustVault will recalculate the actual SHA-256 byte stream, detect the discrepancy, and trigger a <strong>TAMPER DETECTED</strong> alert!
            </p>
          </div>

          <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-1.5 text-xs">
            <div className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              Target Document:
            </div>
            <div className="text-white font-medium truncate">{document.title}</div>
            <div className="text-slate-400 font-mono text-[11px] truncate">File: {document.original_filename}</div>
          </div>

          {message.text && (
            <div
              className={`p-3 rounded-lg text-xs flex items-center gap-2.5 ${
                message.type === 'error'
                  ? 'bg-rose-50 border border-rose-200 text-rose-700'
                  : message.type === 'tampered'
                  ? 'bg-rose-50 border border-rose-200 text-rose-800 font-semibold'
                  : 'bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold'
              }`}
            >
              {message.type === 'error' && <AlertTriangle className="w-4 h-4 shrink-0" />}
              {message.type === 'tampered' && <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />}
              {message.type === 'restored' && <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />}
              <span>{message.text}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={handleSimulateTamper}
              disabled={isTampering || isRestoring}
              className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isTampering ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldAlert className="w-3.5 h-3.5" />}
              <span>Corrupt File on Disk</span>
            </button>

            <button
              onClick={handleRestoreTamper}
              disabled={isTampering || isRestoring}
              className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isRestoring ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
              <span>Restore Pristine File</span>
            </button>
          </div>
        </div>

        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg transition-colors"
          >
            Close Sandbox
          </button>
        </div>
      </div>
    </div>
  );
}
