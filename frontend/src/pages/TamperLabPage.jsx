import React, { useState, useEffect } from 'react';
import { 
  Bug, 
  ShieldAlert, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Loader2, 
  History, 
  ShieldCheck, 
  ArrowRight,
  Database,
  Lock,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { documentAPI, auditAPI } from '../services/api';
import VerificationBadge from '../components/VerificationBadge';

export default function TamperLabPage() {
  const { user: currentUser, login } = useAuth();
  const isAdmin = currentUser?.role === 'admin';

  // Document Tamper Simulation State
  const [documents, setDocuments] = useState([]);
  const [selectedDocId, setSelectedDocId] = useState('');
  const [docLoading, setDocLoading] = useState(false);
  const [tamperLoading, setTamperLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [docMessage, setDocMessage] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);

  // Audit Chain Tamper Simulation State
  const [chainReport, setChainReport] = useState(null);
  const [chainLoading, setChainLoading] = useState(false);
  const [auditTamperLoading, setAuditTamperLoading] = useState(false);
  const [auditRepairLoading, setAuditRepairLoading] = useState(false);
  const [auditMessage, setAuditMessage] = useState(null);

  const fetchDocs = async () => {
    try {
      const res = await documentAPI.getDocuments({ limit: 50 });
      if (res.data.success) {
        setDocuments(res.data.documents);
        if (res.data.documents.length > 0 && !selectedDocId) {
          setSelectedDocId(res.data.documents[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load documents:', err);
    }
  };

  const fetchAuditStatus = async () => {
    setChainLoading(true);
    try {
      const res = await auditAPI.verifyAuditChain();
      if (res.data.success) {
        setChainReport(res.data.report);
      }
    } catch (err) {
      console.error('Failed to verify audit chain:', err);
    } finally {
      setChainLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
    fetchAuditStatus();
  }, []);

  const selectedDoc = documents.find(d => d.id === selectedDocId);

  // Handle Document Tamper Simulation
  const handleSimulateDocTamper = async () => {
    if (!selectedDocId) return;
    setTamperLoading(true);
    setDocMessage(null);
    setVerificationResult(null);
    try {
      const res = await documentAPI.simulateTamper(selectedDocId);
      if (res.data.success) {
        setDocMessage({
          type: 'warning',
          text: 'Tampering simulated: physical bytes corrupted on disk! Click "Run SHA-256 Verification" to see cryptographic detection.'
        });
        await fetchDocs();
      }
    } catch (err) {
      setDocMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to simulate file tampering.'
      });
    } finally {
      setTamperLoading(false);
    }
  };

  // Handle Document Restoration
  const handleRestoreDoc = async () => {
    if (!selectedDocId) return;
    setRestoreLoading(true);
    setDocMessage(null);
    try {
      const res = await documentAPI.restoreTamper(selectedDocId);
      if (res.data.success) {
        setDocMessage({
          type: 'success',
          text: 'Original pristine file restored from backup. File bytes match original SHA-256 baseline.'
        });
        await fetchDocs();
        setVerificationResult(null);
      }
    } catch (err) {
      setDocMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to restore original file.'
      });
    } finally {
      setRestoreLoading(false);
    }
  };

  // Run On-Demand Verification
  const handleVerifyDoc = async () => {
    if (!selectedDocId) return;
    setVerifyLoading(true);
    try {
      const res = await documentAPI.verifyDocument(selectedDocId);
      if (res.data.success) {
        setVerificationResult(res.data);
        await fetchDocs();
        await fetchAuditStatus();
      }
    } catch (err) {
      setDocMessage({
        type: 'error',
        text: err.response?.data?.message || 'Verification failed.'
      });
    } finally {
      setVerifyLoading(false);
    }
  };

  // Handle Audit Ledger Tamper
  const handleSimulateAuditTamper = async () => {
    setAuditTamperLoading(true);
    setAuditMessage(null);
    try {
      const res = await auditAPI.simulateTamper();
      if (res.data.success) {
        setAuditMessage({
          type: 'warning',
          text: res.data.result.message
        });
        await fetchAuditStatus();
      }
    } catch (err) {
      setAuditMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to simulate audit tampering.'
      });
    } finally {
      setAuditTamperLoading(false);
    }
  };

  // Handle Audit Ledger Repair
  const handleRepairAudit = async () => {
    setAuditRepairLoading(true);
    setAuditMessage(null);
    try {
      const res = await auditAPI.repairTamper();
      if (res.data.success) {
        setAuditMessage({
          type: 'success',
          text: res.data.result.message
        });
        await fetchAuditStatus();
      }
    } catch (err) {
      setAuditMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to restore audit ledger.'
      });
    } finally {
      setAuditRepairLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="pb-5 border-b border-slate-800">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
          <Bug className="w-4 h-4" />
          <span>Security & Adversarial Testing</span>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight mt-1">
          Tamper Simulation & Cryptographic Audit Lab
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Interactive evaluation sandbox to test SHA-256 bitstream corruption detection and hash-chain ledger integrity.
        </p>
      </div>

      {/* Admin Role Guard Banner */}
      {!isAdmin && (
        <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-600/40 text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600 flex items-center justify-center text-white shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-sm block text-white">Administrator Privileges Required</span>
              <p className="text-xs text-amber-300/80 mt-0.5">
                Per Challenge Specification (Section 2.H): Only authorized administrators can simulate or restore document and audit alterations.
              </p>
            </div>
          </div>
          <button
            onClick={() => login('admin@trustvault.io', 'TrustVault@2025')}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md transition-colors whitespace-nowrap self-start sm:self-center"
          >
            Switch to Admin Demo Account
          </button>
        </div>
      )}

      {/* Grid of 2 Adversarial Labs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* LAB 1: Physical File Bitstream Corruption Lab */}
        <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 shadow-xl flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
              <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Lab 1: Document Bitstream Verification</h2>
                <p className="text-xs text-slate-400">Inject raw byte corruptions on disk & observe detection</p>
              </div>
            </div>

            {/* Target Document Picker */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Select Target Document:
              </label>
              <select
                value={selectedDocId}
                onChange={(e) => {
                  setSelectedDocId(e.target.value);
                  setVerificationResult(null);
                  setDocMessage(null);
                }}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-blue-500 font-mono"
              >
                {documents.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title} ({d.original_filename})
                  </option>
                ))}
              </select>
            </div>

            {/* Document Baseline Card */}
            {selectedDoc && (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Cataloged SHA-256 Hash:</span>
                  <VerificationBadge status={selectedDoc.latest_verification_status || 'UNVERIFIED'} />
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 font-mono text-[11px] text-blue-400 break-all select-all border border-slate-800">
                  {selectedDoc.original_hash || 'No hash recorded'}
                </div>
              </div>
            )}

            {/* Status Messages */}
            {docMessage && (
              <div className={`p-3 rounded-xl text-xs flex items-center gap-2.5 ${
                docMessage.type === 'warning' ? 'bg-amber-500/10 border border-amber-500/30 text-amber-300' :
                docMessage.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300' :
                'bg-rose-500/10 border border-rose-500/30 text-rose-300'
              }`}>
                {docMessage.type === 'warning' ? <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" /> :
                 docMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" /> :
                 <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />}
                <span>{docMessage.text}</span>
              </div>
            )}

            {/* Verification Result Card */}
            {verificationResult && (
              <div className={`p-4 rounded-xl border space-y-2.5 text-xs ${
                verificationResult.match 
                  ? 'bg-emerald-950/20 border-emerald-500/40' 
                  : 'bg-rose-950/20 border-rose-500/40'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-bold flex items-center gap-1.5">
                    {verificationResult.match ? (
                      <span className="text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" /> VERIFIED AUTHENTIC
                      </span>
                    ) : (
                      <span className="text-rose-400 flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4" /> TAMPER DETECTED
                      </span>
                    )}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(verificationResult.verifiedAt).toLocaleTimeString()}
                  </span>
                </div>

                <div className="space-y-1 font-mono text-[11px]">
                  <div>
                    <span className="text-slate-400">Baseline Hash: </span>
                    <span className="text-slate-300 break-all">{verificationResult.originalHash}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Recalculated: </span>
                    <span className={verificationResult.match ? 'text-emerald-400 break-all' : 'text-rose-400 break-all'}>
                      {verificationResult.currentHash}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-300 leading-relaxed pt-1">
                  {verificationResult.explanation}
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <button
              onClick={handleSimulateDocTamper}
              disabled={tamperLoading || !isAdmin}
              className="px-3 py-2.5 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-300 font-semibold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-40"
            >
              {tamperLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bug className="w-3.5 h-3.5" />}
              <span>Corrupt Bytes</span>
            </button>

            <button
              onClick={handleVerifyDoc}
              disabled={verifyLoading}
              className="px-3 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-40"
            >
              {verifyLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
              <span>Verify SHA-256</span>
            </button>

            <button
              onClick={handleRestoreDoc}
              disabled={restoreLoading || !isAdmin}
              className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-semibold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-40"
            >
              {restoreLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
              <span>Restore Backup</span>
            </button>
          </div>
        </div>

        {/* LAB 2: Tamper-Evident Audit Ledger Lab */}
        <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 shadow-xl flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
              <div className="w-9 h-9 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Lab 2: Hash-Chained Audit Ledger</h2>
                <p className="text-xs text-slate-400">Simulate database row mutation & test chain validation</p>
              </div>
            </div>

            {/* Current Chain State Card */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Chain Cryptographic Status:</span>
                {chainReport ? (
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                    chainReport.isValid 
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' 
                      : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                  }`}>
                    {chainReport.status}
                  </span>
                ) : (
                  <span className="text-slate-500">Checking...</span>
                )}
              </div>

              {chainReport && (
                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-800/60 font-mono">
                  <div>
                    <span className="text-slate-500 block">Total Blocks:</span>
                    <span className="text-white font-bold">{chainReport.totalRecords}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Compromised Blocks:</span>
                    <span className={chainReport.compromisedCount > 0 ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                      {chainReport.compromisedCount}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Status Messages */}
            {auditMessage && (
              <div className={`p-3 rounded-xl text-xs flex items-center gap-2.5 ${
                auditMessage.type === 'warning' ? 'bg-amber-500/10 border border-amber-500/30 text-amber-300' :
                auditMessage.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300' :
                'bg-rose-500/10 border border-rose-500/30 text-rose-300'
              }`}>
                {auditMessage.type === 'warning' ? <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" /> :
                 auditMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" /> :
                 <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />}
                <span>{auditMessage.text}</span>
              </div>
            )}

            {/* Compromised Entries Breakdown */}
            {chainReport && chainReport.compromisedCount > 0 && (
              <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/40 text-xs space-y-2 max-h-48 overflow-y-auto">
                <span className="font-bold text-rose-400 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4" /> Compromised Ledger Blocks Pinpointed:
                </span>
                {chainReport.compromisedEntries.map((c, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-slate-900 border border-rose-900/50 space-y-1 font-mono text-[10px]">
                    <div className="flex justify-between text-rose-300 font-bold">
                      <span>Block #{c.sequenceNum} ({c.eventId})</span>
                      <span>{c.action}</span>
                    </div>
                    {c.reasons?.map((r, ri) => (
                      <p key={ri} className="text-rose-200/90 leading-tight">⚠ {r}</p>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {/* Educational Disclaimer */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
              <span className="font-bold text-slate-300 block mb-1">Defense-in-Depth Principle:</span>
              Hash chaining guarantees that any unauthorized modification or deletion in the past is mathematically evident.
              However, if an attacker controls the raw database engine, they could rewrite the entire ledger from Genesis.
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <button
              onClick={handleSimulateAuditTamper}
              disabled={auditTamperLoading || !isAdmin}
              className="px-3 py-2.5 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-300 font-semibold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-40"
            >
              {auditTamperLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bug className="w-3.5 h-3.5" />}
              <span>Tamper Audit</span>
            </button>

            <button
              onClick={fetchAuditStatus}
              disabled={chainLoading}
              className="px-3 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-40"
            >
              {chainLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              <span>Verify Chain</span>
            </button>

            <button
              onClick={handleRepairAudit}
              disabled={auditRepairLoading || !isAdmin}
              className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-semibold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-40"
            >
              {auditRepairLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
              <span>Repair Chain</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
