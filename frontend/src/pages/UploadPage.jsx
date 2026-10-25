import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UploadCloud, 
  FileText, 
  Lock, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ArrowLeft, 
  ShieldCheck,
  FileCheck
} from 'lucide-react';
import { documentAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function UploadPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [successResult, setSuccessResult] = useState(null);

  const isViewer = user?.role === 'viewer';

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      if (!title) {
        setTitle(selected.name.replace(/\.[^/.]+$/, ''));
      }
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a document file to upload.');
      return;
    }
    if (!title.trim()) {
      setError('Document title is required.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setError('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title.trim());
    formData.append('description', description.trim());

    try {
      const res = await documentAPI.uploadDocument(formData, (progressEvent) => {
        if (progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percent);
        }
      });

      if (res.data.success) {
        setSuccessResult(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload document.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 pb-5 border-b border-slate-800">
        <button
          onClick={() => navigate('/documents')}
          className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400">
            <UploadCloud className="w-4 h-4" />
            <span>Secure Ingestion</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1">
            Upload & Cryptographically Index Document
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            PDF, DOCX, TXT, PNG, JPG • Auto SHA-256 Bitstream Fingerprinting
          </p>
        </div>
      </div>

      {/* Viewer Guard */}
      {isViewer && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-3">
          <Lock className="w-5 h-5 shrink-0 text-amber-400" />
          <div>
            <span className="font-bold block">Viewer Role Limitation</span>
            <p className="text-amber-400/80 mt-0.5">
              Your account currently holds Viewer privileges. Only Document Owners, Editors, and Administrators can upload new files.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successResult ? (
        <div className="p-6 rounded-2xl bg-emerald-950/20 border border-emerald-500/40 text-xs space-y-4 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Document Successfully Indexed!</h2>
              <p className="text-emerald-400 font-mono text-[11px]">
                SHA-256 Cryptographic Baseline Registered & Linked to Audit Chain
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <div>
              <span className="text-slate-400 block font-semibold text-[10px] uppercase tracking-wider">
                Document Title:
              </span>
              <span className="text-white font-medium">{successResult.document.title}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-semibold text-[10px] uppercase tracking-wider">
                SHA-256 Digest:
              </span>
              <span className="text-blue-400 font-mono break-all select-all">
                {successResult.sha256Hash}
              </span>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => navigate(`/documents/${successResult.document.id}`)}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-colors"
            >
              View Document Details & Verification
            </button>
            <button
              onClick={() => {
                setSuccessResult(null);
                setFile(null);
                setTitle('');
                setDescription('');
              }}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
            >
              Upload Another Document
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-5">
          {/* File Dropzone */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              File Attachment
            </label>
            <label className="border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer bg-slate-950/60 hover:bg-slate-950 transition-all group">
              <input
                type="file"
                disabled={isViewer || isUploading}
                onChange={handleFileChange}
                accept=".pdf,.docx,.txt,.png,.jpg,.jpeg"
                className="hidden"
              />
              <div className="w-12 h-12 rounded-xl bg-slate-900 group-hover:bg-blue-600/20 text-slate-400 group-hover:text-blue-400 flex items-center justify-center transition-colors mb-3">
                <UploadCloud className="w-6 h-6" />
              </div>
              {file ? (
                <div className="text-center space-y-1">
                  <span className="text-xs font-bold text-white flex items-center justify-center gap-1.5">
                    <FileCheck className="w-4 h-4 text-emerald-400" />
                    {file.name}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {(file.size / 1024).toFixed(1)} KB • {file.type || 'application/octet-stream'}
                  </span>
                </div>
              ) : (
                <div className="text-center space-y-1">
                  <span className="text-xs font-semibold text-slate-200">
                    Click to select or drag PDF, DOCX, TXT, PNG, JPG file
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    Maximum upload size: 15 MB
                  </span>
                </div>
              )}
            </label>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Document Title *
            </label>
            <input
              type="text"
              required
              disabled={isViewer || isUploading}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Master Services Agreement 2026"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Description / Cryptographic Scope (Optional)
            </label>
            <textarea
              rows={3}
              disabled={isViewer || isUploading}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide context or classification details for this record..."
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500 resize-none"
            />
          </div>

          {/* Progress bar */}
          {isUploading && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-mono text-slate-400">
                <span>Computing SHA-256 bitstream...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/documents')}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isViewer || isUploading || !file}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 disabled:opacity-40"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Hashing & Cataloging...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Upload & Catalog Baseline</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
