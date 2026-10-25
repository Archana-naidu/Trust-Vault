import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  FileText, 
  Download, 
  ShieldCheck, 
  ShieldAlert, 
  Share2, 
  Trash2, 
  Bug, 
  RotateCcw, 
  Clock, 
  User, 
  Copy, 
  Check, 
  FileCheck2, 
  History,
  AlertTriangle
} from 'lucide-react';
import { documentAPI, shareAPI } from '../services/api';
import VerificationBadge from '../components/VerificationBadge';
import ShareModal from '../components/ShareModal';
import TamperSimModal from '../components/TamperSimModal';
import Navbar from '../components/Navbar';

export default function DocumentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [doc, setDoc] = useState(null);
  const [shares, setShares] = useState([]);
  const [verificationHistory, setVerificationHistory] = useState([]);
  const [auditTrail, setAuditTrail] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isTamperModalOpen, setIsTamperModalOpen] = useState(false);
  const [copiedHash, setCopiedHash] = useState(null);

  const fetchDocDetails = async () => {
    setIsLoading(true);
    try {
      const res = await documentAPI.getDocumentById(id);
      if (res.data.success) {
        setDoc(res.data.document);
        setShares(res.data.shares || []);
        setVerificationHistory(res.data.verificationHistory || []);
        setAuditTrail(res.data.auditTrail || []);
      }
    } catch (err) {
      console.error('Error fetching document details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocDetails();
  }, [id]);

  const handleVerify = async () => {
    setIsVerifying(true);
    try {
      const res = await documentAPI.verifyDocument(id);
      setVerificationResult(res.data);
      // Refresh verification history and audit trail
      await fetchDocDetails();
    } catch (err) {
      alert(err.response?.data?.message || 'Verification failed.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDownload = async () => {
    try {
      await documentAPI.downloadDocument(doc.id, doc.original_filename);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to download document.');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete "${doc.title}"?`)) return;
    try {
      const res = await documentAPI.deleteDocument(doc.id);
      if (res.data.success) {
        navigate('/documents');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Delete operation failed.');
    }
  };

  const handleRevokeShare = async (shareId, userEmail) => {
    if (!window.confirm(`Revoke document access for ${userEmail}?`)) return;
    try {
      const res = await shareAPI.revokeShare(shareId);
      if (res.data.success) {
        setShares((prev) => prev.filter((s) => s.id !== shareId));
        await fetchDocDetails();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Revoke operation failed.');
    }
  };

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(key);
    setTimeout(() => setCopiedHash(null), 1500);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-mono">Loading cryptographic parameters...</p>
        </div>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="py-20 text-center space-y-4">
        <h3 className="text-base font-bold text-slate-800">Document Not Found</h3>
        <p className="text-xs text-slate-500">The requested document may have been deleted or access was revoked.</p>
        <Link to="/documents" className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl">
          Return to My Documents
        </Link>
      </div>
    );
  }

  const latestVerification = verificationResult || verificationHistory[0];

  return (
    <div className="space-y-6">
      {/* Back Button & Header */}
      <div>
        <Link
          to="/documents"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-3 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Documents</span>
        </Link>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
              <FileText className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight">
                  {doc.title}
                </h1>
                <VerificationBadge status={latestVerification?.status} />
              </div>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                <span>File: <strong>{doc.original_filename}</strong></span>
                <span>&bull;</span>
                <span>Size: <strong>{(doc.file_size / 1024).toFixed(1)} KB</strong></span>
                <span>&bull;</span>
                <span>Uploaded: <strong>{new Date(doc.created_at).toLocaleString()}</strong></span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleVerify}
              disabled={isVerifying}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isVerifying ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <ShieldCheck className="w-3.5 h-3.5" />
              )}
              <span>{isVerifying ? 'Recalculating...' : 'Verify Cryptographic Hash'}</span>
            </button>

            <button
              onClick={() => setIsTamperModalOpen(true)}
              className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
            >
              <Bug className="w-3.5 h-3.5 text-amber-600" />
              <span>Tamper Lab</span>
            </button>

            <button
              onClick={handleDownload}
              className="p-2 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl transition-colors"
              title="Download file"
            >
              <Download className="w-4 h-4" />
            </button>

            {doc.is_owner && (
              <>
                <button
                  onClick={() => setIsShareModalOpen(true)}
                  className="p-2 border border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 text-slate-700 hover:text-indigo-600 rounded-xl transition-colors"
                  title="Share document"
                >
                  <Share2 className="w-4 h-4" />
                </button>
                <button
                  onClick={handleDelete}
                  className="p-2 border border-slate-200 hover:bg-rose-50 hover:border-rose-200 text-slate-400 hover:text-rose-600 rounded-xl transition-colors"
                  title="Delete document"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Cryptographic Hash Verification Card */}
      <div className={`p-6 rounded-2xl border shadow-xs transition-all ${
        latestVerification?.status === 'TAMPER_DETECTED'
          ? 'bg-rose-50/50 border-rose-300 ring-2 ring-rose-500/20'
          : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className={`p-2 rounded-xl ${
              latestVerification?.status === 'TAMPER_DETECTED'
                ? 'bg-rose-600 text-white'
                : 'bg-emerald-600 text-white'
            }`}>
              {latestVerification?.status === 'TAMPER_DETECTED' ? (
                <ShieldAlert className="w-5 h-5" />
              ) : (
                <ShieldCheck className="w-5 h-5" />
              )}
            </span>
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                SHA-256 Cryptographic Hash Verification Engine
              </h3>
              <p className="text-xs text-slate-500">
                Exact bit-for-bit comparison between upload baseline and physical disk byte stream
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md ${
              latestVerification?.status === 'TAMPER_DETECTED'
                ? 'bg-rose-100 text-rose-800 animate-pulse'
                : 'bg-emerald-100 text-emerald-800'
            }`}>
              {latestVerification?.status === 'TAMPER_DETECTED' ? 'CRITICAL: TAMPER DETECTED' : 'CRYPTOGRAPHICALLY VERIFIED'}
            </span>
          </div>
        </div>

        {/* Verification Explanation Banner */}
        <div className={`p-4 rounded-xl text-xs leading-relaxed mb-4 ${
          latestVerification?.status === 'TAMPER_DETECTED'
            ? 'bg-rose-100/70 border border-rose-300 text-rose-900 font-medium'
            : 'bg-emerald-50 border border-emerald-200 text-emerald-900'
        }`}>
          {latestVerification?.verification_message || latestVerification?.explanation || 'Cryptographic verification confirmed. Baseline SHA-256 hash matches disk file byte stream.'}
        </div>

        {/* Hash Comparison Matrix */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Original Upload Baseline Hash */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <div className="flex items-center justify-between text-slate-400 font-semibold uppercase tracking-wider text-[10px] mb-1.5">
              <span>Original Cataloged Baseline SHA-256</span>
              <span className="text-blue-400 font-mono">AT UPLOAD</span>
            </div>
            <div className="font-hash text-xs text-blue-300 break-all select-all bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between gap-2">
              <span>{doc.original_hash}</span>
              <button
                onClick={() => copyToClipboard(doc.original_hash, 'orig')}
                className="text-slate-400 hover:text-white shrink-0"
              >
                {copiedHash === 'orig' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div className="mt-2 text-[11px] text-slate-400">
              Version 1 Baseline &bull; Never overwritten during audits
            </div>
          </div>

          {/* Current Recalculated Hash on Disk */}
          <div className={`p-4 rounded-xl border text-xs ${
            latestVerification?.status === 'TAMPER_DETECTED'
              ? 'bg-rose-950/80 border-rose-700/80'
              : 'bg-slate-900 border-slate-800'
          }`}>
            <div className="flex items-center justify-between text-slate-400 font-semibold uppercase tracking-wider text-[10px] mb-1.5">
              <span>Latest Recalculated SHA-256</span>
              <span className={latestVerification?.status === 'TAMPER_DETECTED' ? 'text-rose-400 font-mono font-bold' : 'text-emerald-400 font-mono font-bold'}>
                {latestVerification?.status === 'TAMPER_DETECTED' ? 'MISMATCH DETECTED' : 'EXACT MATCH'}
              </span>
            </div>
            <div className={`font-hash text-xs break-all select-all p-2.5 rounded-lg border flex items-center justify-between gap-2 ${
              latestVerification?.status === 'TAMPER_DETECTED'
                ? 'bg-rose-950 text-rose-300 border-rose-800'
                : 'bg-slate-950 text-emerald-300 border-slate-800'
            }`}>
              <span>{latestVerification?.recalculated_hash || latestVerification?.currentHash || doc.original_hash}</span>
              <button
                onClick={() => copyToClipboard(latestVerification?.recalculated_hash || doc.original_hash, 'curr')}
                className="text-slate-400 hover:text-white shrink-0"
              >
                {copiedHash === 'curr' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div className="mt-2 text-[11px] text-slate-400">
              Computed from live physical byte stream &bull; {latestVerification?.verified_at ? new Date(latestVerification.verified_at).toLocaleTimeString() : 'Verified on upload'}
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Sharing Permissions & Document Specific Audit Trail */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Sharing & Access Control List */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Access Control Matrix</h3>
              <p className="text-xs text-slate-400">Authorized personnel permitted to access this asset</p>
            </div>
            {doc.is_owner && (
              <button
                onClick={() => setIsShareModalOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Grant Access</span>
              </button>
            )}
          </div>

          <div className="space-y-2 flex-1">
            {/* Owner Row */}
            <div className="p-3 rounded-xl bg-purple-50/50 border border-purple-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-purple-600 text-white font-bold text-xs flex items-center justify-center">
                  {doc.owner_name?.charAt(0)}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">{doc.owner_name}</div>
                  <div className="text-[11px] text-slate-500 font-mono">{doc.owner_email}</div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-200 text-purple-800">
                Document Owner
              </span>
            </div>

            {/* Shared Users */}
            {shares.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                No external shares active. Restricted exclusively to owner.
              </div>
            ) : (
              shares.map((share) => (
                <div
                  key={share.id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center">
                      {share.full_name?.charAt(0)}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">{share.full_name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{share.email}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        share.permission === 'editor'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {share.permission}
                    </span>
                    {doc.is_owner && (
                      <button
                        onClick={() => handleRevokeShare(share.id, share.email)}
                        title="Revoke access"
                        className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Document-Specific Audit History */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Cryptographic Ledger Activity</h3>
              <p className="text-xs text-slate-400">Append-only audit blocks associated with this asset</p>
            </div>
            <Link
              to="/audit"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              Full Ledger &rarr;
            </Link>
          </div>

          <div className="space-y-2 flex-1 max-h-72 overflow-y-auto pr-1">
            {auditTrail.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">No audit records found for this document.</div>
            ) : (
              auditTrail.map((item) => (
                <div
                  key={item.id}
                  className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/70 text-xs flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 rounded">
                        #{item.sequence_num}
                      </span>
                      <span className="font-semibold text-slate-800">
                        {item.action.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 truncate mt-0.5">
                      by {item.user_email || 'System'} &bull; {new Date(item.timestamp).toLocaleDateString()} {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  <div className="font-hash text-[10px] text-slate-400 shrink-0">
                    {item.current_event_hash?.substring(0, 10)}...
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {isShareModalOpen && (
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          documentId={doc.id}
          documentTitle={doc.title}
          onShareUpdated={fetchDocDetails}
        />
      )}

      {/* Tamper Sim Modal */}
      {isTamperModalOpen && (
        <TamperSimModal
          isOpen={isTamperModalOpen}
          onClose={() => setIsTamperModalOpen(false)}
          document={doc}
          onTamperExecuted={fetchDocDetails}
        />
      )}
    </div>
  );
}
