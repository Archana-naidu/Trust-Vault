import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  LayoutDashboard, 
  FolderLock, 
  UploadCloud,
  Share2, 
  History, 
  Users,
  Bug,
  LogOut, 
  ExternalLink,
  ShieldAlert,
  Building2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'My Documents', path: '/documents', icon: FolderLock },
    { name: 'Upload Document', path: '/upload', icon: UploadCloud },
    { name: 'Shared with Me', path: '/shared', icon: Share2 },
    { name: 'Audit Trail', path: '/audit', icon: History },
    { name: 'User Management', path: '/users', icon: Users },
    { name: 'Tamper Simulation', path: '/tamper-lab', icon: Bug, badge: 'Adversarial' }
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleBadge = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">Admin</span>;
      case 'owner':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">Owner</span>;
      case 'editor':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">Editor</span>;
      case 'viewer':
      default:
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-500/20 text-slate-300 border border-slate-500/30">Viewer</span>;
    }
  };

  return (
    <aside className="w-64 bg-[#0b132b] text-slate-300 flex flex-col border-r border-slate-800 shrink-0 min-h-screen select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 gap-3 border-b border-slate-800/80 bg-[#080d1e]">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-md shadow-blue-500/20 text-white">
          <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
        </div>
        <div>
          <span className="font-bold text-lg tracking-tight text-white flex items-center gap-1.5">
            TRUST<span className="text-blue-400 font-extrabold">VAULT</span>
          </span>
          <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block -mt-1 font-semibold">
            Tamper-Evident Security
          </span>
        </div>
      </div>

      {/* Multi-Tenant Organization Banner */}
      <div className="mx-4 my-3 p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
          <Building2 className="w-3.5 h-3.5 text-blue-400" />
          <span className="truncate">{user?.organization_name || 'TrustVault Corp'}</span>
        </div>
        <div className="flex items-center justify-between pt-0.5">
          <span className="text-[10px] text-slate-500 font-mono">Tenant Realm</span>
          {getRoleBadge(user?.role)}
        </div>
      </div>

      {/* Main Navigation Links */}
      <nav className="flex-1 px-3 space-y-1">
        <div className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Vault Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`
              }
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.name}</span>
              </div>
              {item.badge && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}

        <div className="px-3 pt-5 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Architecture
        </div>
        <NavLink
          to="/"
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
        >
          <ExternalLink className="w-4 h-4 shrink-0 text-slate-500" />
          <span>Landing & Threat Model</span>
        </NavLink>
      </nav>

      {/* User Info & Logout Footer */}
      <div className="p-4 border-t border-slate-800/80 bg-[#080d1e]/80">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold uppercase shadow-sm shrink-0">
              {user?.full_name?.charAt(0) || 'U'}
            </div>
            <div className="min-w-0">
              <span className="block text-xs font-semibold text-white truncate leading-tight">
                {user?.full_name || 'Authenticated User'}
              </span>
              <span className="block text-[10px] text-slate-400 font-mono truncate leading-tight mt-0.5">
                {user?.email || 'user@trustvault.io'}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Sign Out"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800/60 transition-colors shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
