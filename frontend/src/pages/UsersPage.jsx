import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Shield, 
  UserCheck, 
  UserX, 
  ShieldAlert, 
  Key, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Building2,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../services/api';

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [updatingUserId, setUpdatingUserId] = useState(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await userAPI.listUsers();
      if (res.data.success) {
        setUsers(res.data.users);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load organization users.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    setUpdatingUserId(userId);
    setError('');
    setSuccessMsg('');
    try {
      const res = await userAPI.updateRole(userId, newRole);
      if (res.data.success) {
        setSuccessMsg(res.data.message);
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user role.');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleDeleteUser = async (userId, email) => {
    if (!window.confirm(`Are you sure you want to remove user "${email}" from the organization?`)) {
      return;
    }
    setError('');
    setSuccessMsg('');
    try {
      const res = await userAPI.deleteUser(userId);
      if (res.data.success) {
        setSuccessMsg(res.data.message);
        setUsers(prev => prev.filter(u => u.id !== userId));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove user.');
    }
  };

  const getRoleBadge = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">Admin</span>;
      case 'owner':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">Owner</span>;
      case 'editor':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">Editor</span>;
      case 'viewer':
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-500/15 text-slate-300 border border-slate-500/30">Viewer</span>;
    }
  };

  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400">
            <Building2 className="w-4 h-4" />
            <span>Organization Governance</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1">
            User Management & RBAC Authority
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Isolated tenant directory for <span className="text-slate-200 font-semibold">{currentUser?.organization_name || 'TrustVault'}</span>
          </p>
        </div>

        <button
          onClick={fetchUsers}
          disabled={isLoading}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 font-medium transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Admin Notice or RBAC Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-1">
          <div className="flex items-center gap-2 text-amber-400 font-bold">
            <Shield className="w-4 h-4" />
            <span>Admin</span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Full governance, tenant user management, audit repair, and adversarial tamper testing.
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-1">
          <div className="flex items-center gap-2 text-blue-400 font-bold">
            <UserCheck className="w-4 h-4" />
            <span>Owner</span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Upload new documents, manage permissions, share with users, verify hashes, and delete owned files.
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-1">
          <div className="flex items-center gap-2 text-purple-400 font-bold">
            <Key className="w-4 h-4" />
            <span>Editor</span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Access permitted documents, verify cryptographic integrity, and download authorized files.
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-1">
          <div className="flex items-center gap-2 text-slate-300 font-bold">
            <Users className="w-4 h-4" />
            <span>Viewer</span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Read-only access: view metadata, download permitted files, and trigger cryptographic verification.
          </p>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Non-admin warning if visited by non-admin */}
      {!isAdmin && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 shrink-0 text-amber-400" />
          <div>
            <span className="font-bold block">View-Only Access</span>
            <p className="text-amber-400/80 mt-0.5">
              Only authorized Administrators can modify user roles or remove users from the organization.
            </p>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-bold text-white">Registered Tenant Users</h2>
          </div>
          <span className="text-xs font-mono text-slate-400">{users.length} enrolled identity blocks</span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-500 text-xs space-y-2">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-500" />
            <p>Loading tenant directory...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No users found in this organization.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Current Role</th>
                  <th className="py-3 px-4">Enrolled At</th>
                  {isAdmin && <th className="py-3 px-4 text-right">Role Management</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {users.map((u) => {
                  const isCurrent = u.id === currentUser?.id;
                  const isUpdating = updatingUserId === u.id;

                  return (
                    <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4 font-medium text-white flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white text-[11px] font-bold uppercase shadow-xs">
                          {u.full_name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <span>{u.full_name}</span>
                          {isCurrent && (
                            <span className="ml-2 text-[10px] text-blue-400 font-mono">(You)</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">
                        {u.email}
                      </td>
                      <td className="py-3.5 px-4">
                        {getRoleBadge(u.role)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 text-[11px] font-mono">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}
                      </td>
                      {isAdmin && (
                        <td className="py-3.5 px-4 text-right space-x-2">
                          <select
                            value={u.role}
                            disabled={isUpdating || (isCurrent && u.role === 'admin')}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            className="bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded-lg px-2.5 py-1 focus:outline-hidden focus:border-blue-500 disabled:opacity-50"
                          >
                            <option value="owner">Owner</option>
                            <option value="editor">Editor</option>
                            <option value="viewer">Viewer</option>
                            <option value="admin">Admin</option>
                          </select>

                          {!isCurrent && (
                            <button
                              onClick={() => handleDeleteUser(u.id, u.email)}
                              className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                              title="Remove User"
                            >
                              <UserX className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
