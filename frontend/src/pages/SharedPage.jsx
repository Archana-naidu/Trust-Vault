import React, { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { Share2, Download, FileCheck, ExternalLink, FileText, Clock, RefreshCw } from 'lucide-react';
import { documentAPI } from '../services/api';
import VerificationBadge from '../components/VerificationBadge';
import Navbar from '../components/Navbar';

export default function SharedPage() {
  const { openUpload } = useOutletContext();
  const [sharedDocs, setSharedDocs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [verifyingDocId, setVerifyingDocId] = useState(null);

  const fetchSharedDocs = async () => {
    setIsLoading(true);
    try {
      const res = await documentAPI.getDocuments({ filter: 'shared' });
      if (res.data.success) {
        setSharedDocs(res.data.documents || []);
      }
    } catch (err) {
      console.error('Failed to load shared documents:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSharedDocs();
  }, []);

  const handleVerify = async (docId) => {
    setVerifyingDocId(docId);
    try {
      const res = await documentAPI.verifyDocument(docId);
      await fetchSharedDocs();
      alert(`Cryptographic Verification Result: ${res.data.status}\n${res.data.explanation}`);
    } catch (err) {
      alert(err.response?.data?.message || 'Verification failed.');
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

  return (
    <div className="space-y-6">
      <Navbar
        title="Documents Shared with You"
        subtitle="Confidential assets delegated by other vault users with cryptographic verification"
        onOpenUpload={openUpload}
      />

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <Share2 className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold text-slate-800">
              Shared Assets ({sharedDocs.length})
            </span>
          </div>

          <button
            onClick={fetchSharedDocs}
            className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {isLoading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-400 font-mono">Querying delegated authorizations...</p>
          </div>
        ) : sharedDocs.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-400 flex items-center justify-center mx-auto">
              <Share2 className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">No Shared Documents</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No other users have granted you access to documents yet. When an owner shares an asset with your email, it will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Document Title</th>
                  <th className="py-3.5 px-4">Owner & Delegator</th>
                  <th className="py-3.5 px-4">Your Rights</th>
                  <th className="py-3.5 px-4">Integrity Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sharedDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
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
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{doc.owner_name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{doc.owner_email}</div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          doc.user_permission === 'editor'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}
                      >
                        {doc.user_permission}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <VerificationBadge status={doc.latest_verification_status} />
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleVerify(doc.id)}
                          disabled={verifyingDocId === doc.id}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 text-xs font-semibold transition-colors flex items-center gap-1"
                        >
                          {verifyingDocId === doc.id ? (
                            <div className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                          )}
                          <span>Verify</span>
                        </button>

                        <button
                          onClick={() => handleDownload(doc)}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
                          title="Download document"
                        >
                          <Download className="w-4 h-4" />
                        </button>

                        <Link
                          to={`/documents/${doc.id}`}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition-colors"
                          title="View Details"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
