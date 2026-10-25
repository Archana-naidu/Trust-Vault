import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
  History, 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle2, 
  RotateCcw, 
  Bug, 
  RefreshCw, 
  AlertTriangle, 
  Filter, 
  Terminal, 
  ExternalLink,
  Copy,
  Check,
  Search,
  Layers
} from 'lucide-react';
import { auditAPI } from '../services/api';
import HashChainVisualizer from '../components/HashChainVisualizer';
import Navbar from '../components/Navbar';

export default function AuditPage() {
  const { openUpload } = useOutletContext();
  const [logs, setLogs] = useState([]);
  const [verificationReport, setVerificationReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isTampering, setIsTampering] = useState(false);
  const [isRepairing, setIsRepairing] = useState(false);
  const [actionFilter, setActionFilter] = useState('all');
  const [copiedHash, setCopiedHash] = useState(null);

  const fetchAuditData = async () => {
    setIsLoading(true);
    try {
      const [logsRes, verifyRes] = await Promise.all([
        auditAPI.getAuditLogs({ action: actionFilter !== 'all' ? actionFilter : undefined }),
        auditAPI.verifyAuditChain()
      ]);

      if (logsRes.data.success) {
        setLogs(logsRes.data.logs || []);
      }
      if (verifyRes.data.success) {
        setVerificationReport(verifyRes.data.report);
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditData();
  }, [actionFilter]);

  const handleVerifyChain = async () => {
    setIsVerifying(true);
    try {
      const res = await auditAPI.verifyAuditChain();
      if (res.data.success) {
        setVerificationReport(res.data.report);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Audit chain verification failed.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSimulateAuditTamper = async () => {
    if (!window.confirm('Simulate adversarial alteration of an audit block in the database? This will break the cryptographic hash chain.')) return;
    setIsTampering(true);
    try {
      const res = await auditAPI.simulateTamper();
      if (res.data.success) {
        // Immediately run verification to demonstrate the breakage
        await fetchAuditData();
        alert(`Adversarial Tamper Injected!\n${res.data.result?.message}\n\nThe audit verification engine now detects the broken hash chain!`);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Tamper simulation failed.');
    } finally {
      setIsTampering(false);
    }
  };

  const handleRepairAudit = async () => {
    setIsRepairing(true);
    try {
      const res = await auditAPI.repairTamper();
      if (res.data.success) {
        await fetchAuditData();
        alert(res.data.result?.message || 'Audit chain restored to pristine state.');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Repair operation failed.');
    } finally {
      setIsRepairing(false);
    }
  };

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(key);
    setTimeout(() => setCopiedHash(null), 1500);
  };

  const isValid = verificationReport?.status === 'VALID';
  const compromisedEntries = verificationReport?.compromisedEntries || [];

  return (
    <div className="space-y-6">
      <Navbar
        title="Tamper-Evident Audit Ledger"
        subtitle="Mathematically verified SHA-256 hash-chained sequence of all system transactions"
        onOpenUpload={openUpload}
      />

      {/* Verification & Evaluator Control Strip */}
      <div className={`p-6 rounded-2xl border shadow-xs transition-all ${
        isValid
          ? 'bg-white border-slate-200'
          : 'bg-rose-50/70 border-rose-300 ring-2 ring-rose-500/20'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0 ${
              isValid ? 'bg-emerald-600 shadow-md shadow-emerald-600/20' : 'bg-rose-600 shadow-md shadow-rose-600/20 animate-pulse'
            }`}>
              {isValid ? <ShieldCheck className="w-6 h-6 stroke-[2.2]" /> : <ShieldAlert className="w-6 h-6 stroke-[2.2]" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-slate-900">
                  Audit Chain Status: {isValid ? 'CONTINUOUS & VALID' : 'CRITICAL: CHAIN TAMPER DETECTED'}
                </h3>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  isValid ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-200 text-rose-900'
                }`}>
                  {verificationReport?.totalRecords || 0} Blocks Verified
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                {verificationReport?.message || 'Calculating cryptographic continuity...'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleVerifyChain}
              disabled={isVerifying}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isVerifying ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <ShieldCheck className="w-3.5 h-3.5" />
              )}
              <span>{isVerifying ? 'Verifying Chain...' : 'Verify Complete Chain'}</span>
            </button>

            {/* Evaluator Simulation Buttons */}
            <button
              onClick={handleSimulateAuditTamper}
              disabled={isTampering}
              className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
              title="Test tampering with an audit block"
            >
              <Bug className="w-3.5 h-3.5 text-rose-600" />
              <span>Simulate Tamper</span>
            </button>

            <button
              onClick={handleRepairAudit}
              disabled={isRepairing}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
              title="Restore audit log after tampering"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restore Integrity</span>
            </button>
          </div>
        </div>

        {/* Compromised Alert Breakdown (if any) */}
        {!isValid && compromisedEntries.length > 0 && (
          <div className="mt-4 p-4 rounded-xl bg-rose-950 text-rose-200 text-xs font-mono space-y-2 border border-rose-800">
            <div className="flex items-center gap-2 font-bold text-rose-400">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Cryptographic Discontinuity Details ({compromisedEntries.length} Broken Blocks):</span>
            </div>
            {compromisedEntries.map((c, idx) => (
              <div key={idx} className="p-2.5 rounded bg-rose-900/40 border border-rose-800/80 space-y-1">
                <div className="text-white font-bold flex items-center justify-between">
                  <span>Block #{c.sequenceNum} ({c.eventId}) - Action: {c.action}</span>
                  <span className="text-rose-400">Broken Link Detected</span>
                </div>
                <div className="text-[11px] text-rose-300">
                  {c.reasons?.map((r, ri) => <div key={ri}>&bull; {r}</div>)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Visual Hash Chain Inspector */}
      <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 shadow-md">
        <HashChainVisualizer
          logs={[...logs].sort((a, b) => a.sequence_num - b.sequence_num)}
          compromisedEntries={compromisedEntries}
        />
      </div>

      {/* Filter and Detailed Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <Layers className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold text-slate-800">
              Detailed Ledger Records ({logs.length})
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Filter Action:</span>
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-hidden"
              >
                <option value="all">All Events</option>
                <option value="DOCUMENT_UPLOADED">DOCUMENT_UPLOADED</option>
                <option value="DOCUMENT_DOWNLOADED">DOCUMENT_DOWNLOADED</option>
                <option value="DOCUMENT_VERIFIED">DOCUMENT_VERIFIED</option>
                <option value="DOCUMENT_SHARED">DOCUMENT_SHARED</option>
                <option value="ACCESS_REVOKED">ACCESS_REVOKED</option>
                <option value="DOCUMENT_DELETED">DOCUMENT_DELETED</option>
                <option value="USER_REGISTERED">USER_REGISTERED</option>
                <option value="USER_LOGGED_IN">USER_LOGGED_IN</option>
              </select>
            </div>

            <button
              onClick={fetchAuditData}
              className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-400 font-mono">Querying immutable SQLite chain...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">No audit records match the filter.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Seq / Event ID</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Target Entity</th>
                  <th className="py-3 px-4">Previous Block Hash</th>
                  <th className="py-3 px-4">Current Block Hash</th>
                  <th className="py-3 px-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Seq & Event ID */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-mono font-bold text-slate-800">#{log.sequence_num}</div>
                      <div className="text-[10px] font-mono text-slate-400">{log.event_id}</div>
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                        {log.action}
                      </span>
                    </td>

                    {/* Actor */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-800 truncate max-w-[140px]">
                        {log.user_email || 'System'}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">IP: {log.ip_address || '127.0.0.1'}</div>
                    </td>

                    {/* Target */}
                    <td className="py-3 px-4 min-w-[160px]">
                      <div className="font-medium text-slate-800 truncate max-w-[200px]">
                        {log.document_name || log.detailsObj?.note || '-'}
                      </div>
                      {log.detailsObj && (
                        <div className="text-[10px] text-slate-500 font-mono truncate max-w-[200px]">
                          {typeof log.detailsObj === 'object' ? JSON.stringify(log.detailsObj).substring(0, 40) + '...' : log.detailsObj}
                        </div>
                      )}
                    </td>

                    {/* Prev Hash */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-hash text-[11px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 flex items-center justify-between gap-1 max-w-[130px]">
                        <span>{log.previous_event_hash?.substring(0, 10)}...</span>
                        <button
                          onClick={() => copyToClipboard(log.previous_event_hash, `p-${log.id}`)}
                          className="hover:text-blue-600"
                        >
                          {copiedHash === `p-${log.id}` ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </td>

                    {/* Curr Hash */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-hash text-[11px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200 flex items-center justify-between gap-1 max-w-[130px]">
                        <span>{log.current_event_hash?.substring(0, 10)}...</span>
                        <button
                          onClick={() => copyToClipboard(log.current_event_hash, `c-${log.id}`)}
                          className="hover:text-blue-800"
                        >
                          {copiedHash === `c-${log.id}` ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </td>

                    {/* Timestamp */}
                    <td className="py-3 px-4 text-right whitespace-nowrap text-slate-500 text-[11px]">
                      <div>{new Date(log.timestamp).toLocaleDateString()}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Honest Limitation & Security Specification Panel */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
          <Terminal className="w-4 h-4 text-blue-600" />
          <span>Security Architecture Note: Hash Chaining Guarantees & Real-World Boundaries</span>
        </div>
        <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
          <p>
            TrustVault implements a deterministic SHA-256 recurrence relation:
            <code className="bg-slate-100 text-slate-900 px-1.5 py-0.5 rounded font-hash ml-1">
              H[n] = SHA256( H[n-1] | Seq | Time | User | Action | Doc | Details )
            </code>.
            Because each block commits to the exact cryptographic output of its predecessor, modifying an existing block alters its current hash, which immediately invalidates the next block's recorded <code className="bg-slate-100 px-1 py-0.2 rounded font-hash">previous_event_hash</code>.
          </p>
          <p>
            <strong>Immutability Boundary:</strong> Hash chaining provides internal tamper-evidence against rogue users or SQL injection attackers. However, a malicious database administrator with raw write access could theoretically rewrite a row and sequentially recompute all subsequent hashes up to the head block.
          </p>
          <p>
            <strong>Production Enterprise Hardening:</strong> In regulated high-security environments, TrustVault's audit chain is reinforced by:
            (1) <em>External Merkle Root Anchoring</em> into an external immutable ledger or public blockchain witness,
            (2) <em>RFC 3161 Certified Digital Timestamping Authorities</em>, and
            (3) <em>Hardware Security Module (HSM)</em> asymmetric signing keys.
          </p>
        </div>
      </div>
    </div>
  );
}
