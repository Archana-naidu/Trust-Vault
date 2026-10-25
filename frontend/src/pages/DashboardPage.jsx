import React, { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { 
  FolderLock, 
  Share2, 
  Download, 
  ShieldCheck, 
  ShieldAlert, 
  Clock, 
  Plus, 
  ArrowUpRight, 
  Activity, 
  FileText,
  FileCheck,
  CheckCircle2,
  Bug
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip as RechartsTooltip, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid 
} from 'recharts';
import { dashboardAPI, documentAPI } from '../services/api';
import StatCard from '../components/StatCard';
import VerificationBadge from '../components/VerificationBadge';
import Navbar from '../components/Navbar';

export default function DashboardPage() {
  const { openUpload, uploadSuccessTrigger } = useOutletContext();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [verifyingDocId, setVerifyingDocId] = useState(null);

  const fetchDashboardData = async () => {
    try {
      const res = await dashboardAPI.getStats();
      if (res.data.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [uploadSuccessTrigger]);

  const handleQuickVerify = async (docId) => {
    setVerifyingDocId(docId);
    try {
      await documentAPI.verifyDocument(docId);
      // Refresh dashboard stats after verification
      await fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Verification failed');
    } finally {
      setVerifyingDocId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-mono">Aggregating real-time cryptographic vault metrics...</p>
        </div>
      </div>
    );
  }

  const stats = data?.stats || {
    totalDocuments: 0,
    documentsShared: 0,
    documentsReceived: 0,
    verifiedDocuments: 0,
    tamperingAlerts: 0,
    totalAuditEvents: 0
  };

  const verificationChartData = data?.charts?.verificationStatus || [];
  const activityDistribution = data?.charts?.activityDistribution || [];
  const recentDocs = data?.recentDocuments || [];
  const recentActs = data?.recentActivities || [];

  return (
    <div className="space-y-6">
      <Navbar
        title="Security Intelligence Dashboard"
        subtitle="Real-time database statistics & cryptographic integrity monitoring"
        onOpenUpload={openUpload}
      />

      {/* Top Statistic Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          title="Total Documents"
          value={stats.totalDocuments}
          icon={FolderLock}
          color="blue"
          subtitle="Accessible documents"
        />
        <StatCard
          title="Shared Out"
          value={stats.documentsShared}
          icon={Share2}
          color="purple"
          subtitle="Shared with peers"
        />
        <StatCard
          title="Received"
          value={stats.documentsReceived}
          icon={Download}
          color="indigo"
          subtitle="Shared with you"
        />
        <StatCard
          title="Verified"
          value={stats.verifiedDocuments}
          icon={ShieldCheck}
          color="emerald"
          subtitle="Bit-for-bit authentic"
        />
        <StatCard
          title="Tamper Alerts"
          value={stats.tamperingAlerts}
          icon={ShieldAlert}
          color="rose"
          alert={stats.tamperingAlerts > 0}
          subtitle={stats.tamperingAlerts > 0 ? "Adversarial discrepancy!" : "0 corrupted files"}
        />
        <StatCard
          title="Audit Blocks"
          value={stats.totalAuditEvents}
          icon={Activity}
          color="amber"
          subtitle="Chained log entries"
        />
      </div>

      {/* Charts Section */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Verification Status Donut */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-800">Document Integrity Health</h3>
              <p className="text-xs text-slate-400">Current vault cryptographic posture</p>
            </div>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <ShieldCheck className="w-4 h-4" />
            </span>
          </div>

          <div className="flex-1 h-56 min-h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={verificationChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {verificationChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-center">
            {verificationChartData.map((item, idx) => (
              <div key={idx} className="space-y-0.5">
                <div className="text-[10px] font-semibold text-slate-400 uppercase truncate">{item.name}</div>
                <div className="text-base font-extrabold" style={{ color: item.color }}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Audit Activity Distribution Bar Chart */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-800">Audit Ledger Event Distribution</h3>
              <p className="text-xs text-slate-400">Cryptographically hashed actions recorded in chain</p>
            </div>
            <Link
              to="/audit"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>Inspect Chain</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex-1 h-56 min-h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activityDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="action" 
                  tick={{ fontSize: 10, fill: '#64748b' }} 
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} allowDecimals={false} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tables: Recent Documents & Recent Security Audit Activities */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Uploads */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-800">Recent Vault Documents</h3>
              <p className="text-xs text-slate-400">Directly cataloged with SHA-256 baseline</p>
            </div>
            <Link
              to="/documents"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentDocs.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">No documents found in vault.</div>
          ) : (
            <div className="divide-y divide-slate-100 flex-1">
              {recentDocs.map((doc) => (
                <div key={doc.id} className="py-3 flex items-center justify-between gap-3 group">
                  <div className="min-w-0 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <Link
                        to={`/documents/${doc.id}`}
                        className="text-xs font-bold text-slate-800 hover:text-blue-600 truncate block transition-colors"
                      >
                        {doc.title}
                      </Link>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span className="font-mono uppercase">{doc.file_extension}</span>
                        <span>&bull;</span>
                        <span>{(doc.file_size / 1024).toFixed(1)} KB</span>
                        <span>&bull;</span>
                        <span>{doc.owner_name}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <VerificationBadge status={doc.verification_status} />
                    <button
                      onClick={() => handleQuickVerify(doc.id)}
                      disabled={verifyingDocId === doc.id}
                      title="Run SHA-256 Bitstream Verification"
                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-blue-50 hover:border-blue-300 text-slate-600 hover:text-blue-600 transition-colors"
                    >
                      {verifyingDocId === doc.id ? (
                        <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <FileCheck className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Security Activities from Audit Trail */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-800">Recent Security Activities</h3>
              <p className="text-xs text-slate-400">Latest immutable entries committed to hash chain</p>
            </div>
            <Link
              to="/audit"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>Audit Ledger</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentActs.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">No audit events recorded yet.</div>
          ) : (
            <div className="divide-y divide-slate-100 flex-1">
              {recentActs.map((act) => (
                <div key={act.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                        #{act.sequence_num}
                      </span>
                      <span className="font-semibold text-slate-800">
                        {act.action.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 truncate mt-0.5">
                      {act.document_name || act.user_email || 'System Operation'}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-hash text-[10px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                      {act.current_event_hash?.substring(0, 10)}...
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
