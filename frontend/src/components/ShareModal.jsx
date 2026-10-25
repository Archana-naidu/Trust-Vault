import React, { useState, useEffect } from 'react';
import { X, Share2, UserCheck, Shield, Trash2, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { documentAPI, shareAPI, authAPI } from '../services/api';

export default function ShareModal({ isOpen, onClose, documentId, documentTitle, onShareUpdated }) {
  const [users, setUsers] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState('');
  const [permission, setPermission] = useState('viewer');
  const [activeShares, setActiveShares] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (isOpen && documentId) {
      loadData();
    }
  }, [isOpen, documentId]);

  const loadData = async () => {
    setIsLoading(true);
    setStatusMessage({ type: '', text: '' });
    try {
      const [usersRes, docRes] = await Promise.all([
        authAPI.getUsers(),
        documentAPI.getDocumentById(documentId)
      ]);
      if (usersRes.data.success) {
        setUsers(usersRes.data.users);
      }
      if (docRes.data.success) {
        setActiveShares(docRes.data.shares || []);
      }
    } catch (err) {
      console.error('Error loading share data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleShare = async (e) => {
    e.preventDefault();
    if (!selectedEmail.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter or select a recipient email.' });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage({ type: '', text: '' });

    try {
      const res = await documentAPI.shareDocument(documentId, {
        email: selectedEmail.trim(),
        permission
      });

      if (res.data.success) {
        setStatusMessage({ type: 'success', text: res.data.message });
        setSelectedEmail('');
        // Reload shares
        const docRes = await documentAPI.getDocumentById(documentId);
        if (docRes.data.success) {
          setActiveShares(docRes.data.shares || []);
        }
        if (onShareUpdated) onShareUpdated();
      }
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to share document.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevoke = async (shareId, userEmail) => {
    if (!window.confirm(`Revoke document access for ${userEmail}?`)) return;

    try {
      const res = await shareAPI.revokeShare(shareId);
      if (res.data.success) {
        setStatusMessage({ type: 'success', text: res.data.message });
        setActiveShares((prev) => prev.filter((s) => s.id !== shareId));
        if (onShareUpdated) onShareUpdated();
      }
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to revoke access.'
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Access Control & Sharing</h3>
              <p className="text-xs text-slate-400 truncate max-w-xs">{documentTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Status Message */}
          {statusMessage.text && (
            <div
              className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                statusMessage.type === 'error'
                  ? 'bg-rose-50 border border-rose-200 text-rose-700'
                  : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
              }`}
            >
              {statusMessage.type === 'error' ? (
                <AlertCircle className="w-4 h-4 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Add Share Form */}
          <form onSubmit={handleShare} className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Grant Authorized Access
            </label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="email"
                  list="registered-users"
                  placeholder="Enter recipient email address..."
                  value={selectedEmail}
                  onChange={(e) => setSelectedEmail(e.target.value)}
                  className="flex-1 px-3.5 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                />
                <datalist id="registered-users">
                  {users.map((u) => (
                    <option key={u.id} value={u.email}>
                      {u.full_name} ({u.role})
                    </option>
                  ))}
                </datalist>

                <select
                  value={permission}
                  onChange={(e) => setPermission(e.target.value)}
                  className="px-3 py-2 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-hidden"
                >
                  <option value="viewer">Viewer (Read & Verify)</option>
                  <option value="editor">Editor (Modify & Upload)</option>
                </select>
              </div>

              {/* Quick Select Chips */}
              {users.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Quick Select:</span>
                  {users.slice(0, 3).map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => setSelectedEmail(u.email)}
                      className="px-2 py-0.5 rounded text-[11px] bg-slate-200 hover:bg-indigo-100 hover:text-indigo-700 text-slate-700 transition-colors"
                    >
                      {u.email}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !selectedEmail}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Shield className="w-3.5 h-3.5" />}
              <span>Commit Cryptographic Access Grant</span>
            </button>
          </form>

          {/* Active Shares List */}
          <div>
            <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Active Authorized Users ({activeShares.length})
            </h4>

            {isLoading ? (
              <div className="py-6 text-center text-xs text-slate-400">Loading authorized users...</div>
            ) : activeShares.length === 0 ? (
              <div className="py-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <p className="text-xs text-slate-500">Only the document owner currently has access.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {activeShares.map((share) => (
                  <div
                    key={share.id}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-white text-xs hover:border-slate-300 transition-colors"
                  >
                    <div className="min-w-0 flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center shrink-0">
                        {share.full_name?.charAt(0) || 'U'}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-800 truncate">{share.full_name}</div>
                        <div className="text-[11px] text-slate-500 font-mono truncate">{share.email}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          share.permission === 'editor'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {share.permission}
                      </span>
                      <button
                        onClick={() => handleRevoke(share.id, share.email)}
                        title="Revoke access"
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
