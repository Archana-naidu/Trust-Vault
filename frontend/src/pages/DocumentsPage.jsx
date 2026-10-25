import React, { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { 
  FolderLock, 
  Search, 
  Filter, 
  Upload, 
  Download, 
  Trash2, 
  Share2, 
  FileCheck, 
  ShieldCheck, 
  ShieldAlert, 
  Bug, 
  ExternalLink, 
  FileText,
  Clock,
  Copy,
  Check,
  RefreshCw
} from 'lucide-react';
import { documentAPI } from '../services/api';
import VerificationBadge from '../components/VerificationBadge';
import ShareModal from '../components/ShareModal';
import TamperSimModal from '../components/TamperSimModal';
import Navbar from '../components/Navbar';

export default function DocumentsPage() {
  const { openUpload, uploadSuccessTrigger } = useOutletContext();
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [extensionFilter, setExtensionFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [tabFilter, setTabFilter] = useState('all'); // 'all', 'owned', 'shared'

  // Modal states
  const [shareDoc, setShareDoc] = useState(null);
  const [tamperDoc, setTamperDoc] = useState(null);
  const [verifyingDocId, setVerifyingDocId] = useState(null);
  const [copiedHash, setCopiedHash] = useState(null);

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const res = await documentAPI.getDocuments({
        search: search || undefined,
        extension: extensionFilter !== 'all' ? extensionFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        filter: tabFilter !== 'all' ? tabFilter : undefined
      });
      if (res.data.success) {
        setDocuments(res.data.documents || []);
      }
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [extensionFilter, statusFilter, tabFilter, uploadSuccessTrigger]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchDocuments();
  };

  const handleVerify = async (docId) => {
    setVerifyingDocId(docId);
    try {
      const res = await documentAPI.verifyDocument(docId);
      // Refresh documents to show new verification status
      await fetchDocuments();
      if (res.data.match) {
        alert(`Cryptographic Verification Confirmed!\nStatus: VERIFIED\nFile SHA-256 matches cataloged baseline hash bit-for-bit.`);
      } else {
        alert(`CRITICAL ALERT: TAMPER DETECTED!\nThe file on disk has been modified or corrupted!\nOriginal Hash:     ${res.data.originalHash}\nRecalculated Hash: ${res.data.currentHash}`);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Verification execution failed.');
    } finally {
      setVerifyingDocId(null);
    }
  };

  const handleDownload = async (doc) => {
    try {
      await documentAPI.downloadDocument(doc.id, doc.original_filename);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to download document.');
    }
  };

  const handleDelete = async (docId, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"? This action will be recorded in the audit trail.`)) return;

    try {
      const res = await documentAPI.deleteDocument(docId);
      if (res.data.success) {
        setDocuments((prev) => prev.filter((d) => d.id !== docId));
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Delete operation failed.');
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(id);
    setTimeout(() => setCopiedHash(null), 1500);
  };

  return (
    <div className="space-y-6">
      <Navbar
        title="Confidential Documents"
        subtitle="Manage, verify, share and monitor cryptographically protected assets"
        onOpenUpload={openUpload}
      />

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
        {/* Tab Selection */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setTabFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                tabFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Documents
            </button>
            <button
              onClick={() => setTabFilter('owned')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                tabFilter === 'owned' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              My Uploads
            </button>
            <button
              onClick={() => setTabFilter('shared')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                tabFilter === 'shared' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Shared with Me
            </button>
          </div>

          <button
            onClick={fetchDocuments}
            className="p-2 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-colors"
            title="Refresh document list"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Dropdown Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[240px] relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title or original filename..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </form>

          {/* Extension Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Format:</span>
            <select
              value={extensionFilter}
              onChange={(e) => setExtensionFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-hidden"
            >
              <option value="all">All Types</option>
              <option value=".pdf">PDF Document</option>
              <option value=".docx">DOCX Word</option>
              <option value=".txt">TXT Plaintext</option>
              <option value=".png">PNG Image</option>
              <option value=".jpg">JPG Image</option>
            </select>
          </div>

          {/* Verification Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-hidden"
            >
              <option value="all">All Statuses</option>
              <option value="VERIFIED">Verified Authentic</option>
              <option value="TAMPER_DETECTED">Tamper Alert</option>
            </select>
          </div>
        </div>
      </div>

      {/* Document List / Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-400 font-mono">Loading encrypted document index...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <FolderLock className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">No Documents Found</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No documents matched your active search or filters. Deposit a new confidential file to begin.
            </p>
            <button
              onClick={openUpload}
              className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors"
            >
              Upload Document Now
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Document Details</th>
                  <th className="py-3.5 px-4">Cryptographic Fingerprint (SHA-256)</th>
                  <th className="py-3.5 px-4">Integrity Status</th>
                  <th className="py-3.5 px-4">Access Rights</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Title & Metadata */}
                    <td className="py-3.5 px-4 min-w-[220px]">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <Link
                            to={`/documents/${doc.id}`}
                            className="font-bold text-slate-900 hover:text-blue-600 truncate block text-xs"
                          >
                            {doc.title}
                          </Link>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <span className="font-mono uppercase font-semibold text-slate-600">{doc.file_extension}</span>
                            <span>&bull;</span>
                            <span>{(doc.file_size / 1024).toFixed(1)} KB</span>
                            <span>&bull;</span>
                            <span className="truncate">by {doc.owner_name}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* SHA-256 Hash */}
                    <td className="py-3.5 px-4 min-w-[200px]">
                      <div className="flex items-center gap-1.5 font-hash text-[11px] text-slate-600 bg-slate-50 py-1 px-2 rounded border border-slate-200 max-w-fit">
                        <span>{doc.original_hash?.substring(0, 16)}...</span>
                        <button
                          onClick={() => copyToClipboard(doc.original_hash, doc.id)}
                          title="Copy full 64-char SHA-256 hash"
                          className="text-slate-400 hover:text-blue-600 p-0.5"
                        >
                          {copiedHash === doc.id ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">
                        Cataloged: {new Date(doc.created_at).toLocaleDateString()}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <VerificationBadge status={doc.latest_verification_status} />
                      {doc.latest_verified_at && (
                        <div className="text-[10px] text-slate-400 mt-1">
                          Checked {new Date(doc.latest_verified_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                    </td>

                    {/* Permission */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          doc.is_owner
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : doc.user_permission === 'editor'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {doc.is_owner ? 'Owner' : doc.user_permission}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Verify Button */}
                        <button
                          onClick={() => handleVerify(doc.id)}
                          disabled={verifyingDocId === doc.id}
                          title="Verify Physical File Bitstream Integrity"
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-emerald-50 hover:border-emerald-300 text-slate-700 hover:text-emerald-700 text-xs font-semibold transition-colors flex items-center gap-1.5"
                        >
                          {verifyingDocId === doc.id ? (
                            <div className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                          )}
                          <span>Verify</span>
                        </button>

                        {/* Tamper Test Sandbox Button */}
                        <button
                          onClick={() => setTamperDoc(doc)}
                          title="Adversarial Tamper Simulation Lab"
                          className="px-2.5 py-1.5 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold transition-colors flex items-center gap-1"
                        >
                          <Bug className="w-3.5 h-3.5 text-amber-600" />
                          <span>Tamper Test</span>
                        </button>

                        {/* Download */}
                        <button
                          onClick={() => handleDownload(doc)}
                          title="Download authorized physical file"
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                        </button>

                        {/* Share (Owner only) */}
                        {doc.is_owner && (
                          <button
                            onClick={() => setShareDoc(doc)}
                            title="Share document"
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 text-slate-600 hover:text-indigo-600 transition-colors"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                        )}

                        {/* View Details */}
                        <Link
                          to={`/documents/${doc.id}`}
                          title="View Full Cryptographic Audit & Details"
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-blue-50 hover:border-blue-200 text-slate-600 hover:text-blue-600 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>

                        {/* Delete (Owner only) */}
                        {doc.is_owner && (
                          <button
                            onClick={() => handleDelete(doc.id, doc.title)}
                            title="Delete document"
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 hover:border-rose-200 text-slate-400 hover:text-rose-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Share Modal */}
      {shareDoc && (
        <ShareModal
          isOpen={!!shareDoc}
          onClose={() => setShareDoc(null)}
          documentId={shareDoc.id}
          documentTitle={shareDoc.title}
          onShareUpdated={fetchDocuments}
        />
      )}

      {/* Tamper Simulation Sandbox Modal */}
      {tamperDoc && (
        <TamperSimModal
          isOpen={!!tamperDoc}
          onClose={() => setTamperDoc(null)}
          document={tamperDoc}
          onTamperExecuted={fetchDocuments}
        />
      )}
    </div>
  );
}
