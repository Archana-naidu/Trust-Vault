import React, { useState } from 'react';
import { Link2, ArrowRight, ShieldCheck, ShieldAlert, Check, Copy } from 'lucide-react';

export default function HashChainVisualizer({ logs = [], compromisedEntries = [] }) {
  const [copiedHash, setCopiedHash] = useState(null);

  const compromisedSeqMap = new Set(compromisedEntries.map((c) => c.sequenceNum));

  const copyToClipboard = (hash, id) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(id);
    setTimeout(() => setCopiedHash(null), 1500);
  };

  if (!logs || logs.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-900 rounded-xl border border-slate-800 text-slate-400 text-xs">
        No audit entries recorded yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span className="font-semibold uppercase tracking-wider">
          Visual Hash Chain Ledger ({logs.length} Blocks)
        </span>
        <span className="font-mono text-[11px]">
          Genesis: 00000000... &rarr; Head: {logs[logs.length - 1]?.current_event_hash?.substring(0, 10)}...
        </span>
      </div>

      <div className="overflow-x-auto pb-4">
        <div className="flex items-stretch gap-3 min-w-max">
          {logs.map((block, idx) => {
            const isCompromised = compromisedSeqMap.has(block.sequence_num);
            const isGenesis = block.sequence_num === 1;

            return (
              <React.Fragment key={block.id}>
                {/* Visual Block Card */}
                <div
                  className={`w-72 rounded-xl p-4 flex flex-col justify-between transition-all ${
                    isCompromised
                      ? 'bg-rose-950/80 border-2 border-rose-500 shadow-lg shadow-rose-950/50'
                      : 'bg-slate-900 border border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Card Header */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono font-bold text-xs text-blue-400">
                        Block #{block.sequence_num}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded">
                        {block.event_id}
                      </span>
                    </div>

                    <div className="mb-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          isCompromised
                            ? 'bg-rose-500 text-white'
                            : 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                        }`}
                      >
                        {block.action}
                      </span>
                      <div className="text-xs text-slate-300 font-medium truncate mt-1.5">
                        {block.document_name || block.detailsObj?.note || 'System Event'}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {block.user_email || 'System Kernel'}
                      </div>
                    </div>
                  </div>

                  {/* Hash Linkage Details */}
                  <div className="space-y-2 pt-2 border-t border-slate-800/80 text-[11px] font-hash">
                    {/* Previous Hash */}
                    <div className="bg-slate-950/80 p-2 rounded border border-slate-800/60">
                      <div className="text-[9px] uppercase font-bold text-slate-400 tracking-wider flex items-center justify-between mb-0.5">
                        <span>Prev Block Digest</span>
                        {isGenesis && <span className="text-emerald-400">GENESIS</span>}
                      </div>
                      <div className="text-slate-400 truncate select-all flex items-center justify-between">
                        <span>{block.previous_event_hash?.substring(0, 16)}...</span>
                        <button
                          onClick={() => copyToClipboard(block.previous_event_hash, `prev-${block.id}`)}
                          className="hover:text-blue-400"
                        >
                          {copiedHash === `prev-${block.id}` ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Current Block Hash */}
                    <div
                      className={`p-2 rounded border ${
                        isCompromised
                          ? 'bg-rose-900/40 border-rose-600/50'
                          : 'bg-blue-950/30 border-blue-900/40'
                      }`}
                    >
                      <div className="text-[9px] uppercase font-bold text-blue-300 tracking-wider flex items-center justify-between mb-0.5">
                        <span>Current SHA-256</span>
                        {isCompromised ? (
                          <span className="text-rose-400 flex items-center gap-1 font-sans font-bold">
                            <ShieldAlert className="w-3 h-3" /> BROKEN
                          </span>
                        ) : (
                          <span className="text-emerald-400 flex items-center gap-1 font-sans font-medium">
                            <ShieldCheck className="w-3 h-3" /> INTACT
                          </span>
                        )}
                      </div>
                      <div className="text-blue-200 truncate select-all flex items-center justify-between font-bold">
                        <span>{block.current_event_hash?.substring(0, 16)}...</span>
                        <button
                          onClick={() => copyToClipboard(block.current_event_hash, `curr-${block.id}`)}
                          className="hover:text-blue-300"
                        >
                          {copiedHash === `curr-${block.id}` ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-400 font-sans text-right pt-0.5">
                      {new Date(block.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </div>
                  </div>
                </div>

                {/* Connector Arrow */}
                {idx < logs.length - 1 && (
                  <div className="flex flex-col items-center justify-center text-slate-600 px-1">
                    <Link2 className="w-4 h-4 text-blue-500 mb-1" />
                    <ArrowRight className="w-4 h-4 text-slate-500" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
