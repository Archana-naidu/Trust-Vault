import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  Lock, 
  FileCheck2, 
  History, 
  Share2, 
  AlertTriangle, 
  ArrowRight, 
  Terminal, 
  Cpu, 
  CheckCircle2, 
  Database,
  ExternalLink,
  Layers
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-blue-600 selection:text-white">
      {/* Top Navigation */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white">
              <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-white flex items-center gap-1">
              TRUST<span className="text-blue-400">VAULT</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-blue-400 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-blue-400 transition-colors">How It Works</a>
            <a href="#architecture" className="hover:text-blue-400 transition-colors">Cryptographic Architecture</a>
          </nav>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition-all flex items-center gap-2"
              >
                <span>Enter Vault Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-32 overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-blue-600/15 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[250px] bg-purple-600/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/40 border border-blue-700/50 text-blue-300 text-xs font-semibold uppercase tracking-wider mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Cryptographic Document Vault &bull; Hiring Challenge Demo</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight md:leading-none">
            Secure Document Sharing with a{' '}
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
              Tamper-Evident System
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            TrustVault combines <strong>SHA-256 bitstream cryptographic hashing</strong> with an <strong>append-only hash-chained audit ledger</strong> to guarantee document authenticity and instantly detect unauthorized alterations.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              to={isAuthenticated ? "/dashboard" : "/login"}
              className="px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2 active:scale-95"
            >
              <span>Launch Live Application</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <a
              href="#architecture"
              className="px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold text-sm border border-slate-800 transition-all flex items-center gap-2"
            >
              <span>View Cryptographic Proof</span>
              <ExternalLink className="w-4 h-4 text-slate-500" />
            </a>
          </div>

          {/* Quick Demo Credentials Box */}
          <div className="mt-10 p-4 max-w-xl mx-auto rounded-xl bg-slate-900/90 border border-slate-800 text-left font-mono text-xs">
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-bold mb-2 flex items-center justify-between">
              <span>Quick Evaluator Demo Credentials</span>
              <span className="text-emerald-400 font-semibold">PRE-SEEDED & READY</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300">
              <div className="p-2 rounded bg-slate-950 border border-slate-800/80">
                <span className="text-blue-400 block font-bold">Admin Officer:</span>
                <span>admin@trustvault.io</span>
                <span className="block text-slate-500 text-[10px]">Pass: TrustVault@2025</span>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800/80">
                <span className="text-purple-400 block font-bold">Security Lead (Alice):</span>
                <span>alice@trustvault.io</span>
                <span className="block text-slate-500 text-[10px]">Pass: Alice@2025</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security Pillars */}
      <section id="features" className="py-20 border-t border-slate-900 bg-slate-950/60">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-blue-400 uppercase tracking-widest">
              Engineered for Enterprise Defense
            </h2>
            <p className="mt-2 text-3xl font-extrabold text-white">
              Core Security Architecture Pillars
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-blue-500/40 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-blue-600/10 text-blue-400 flex items-center justify-center mb-4 border border-blue-500/20">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-white mb-2">SHA-256 Bitstream Verification</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Every document receives an immutable 256-bit cryptographic fingerprint computed directly from physical file bytes during upload and re-verified on-demand.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-purple-500/40 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-purple-600/10 text-purple-400 flex items-center justify-center mb-4 border border-purple-500/20">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-white mb-2">Hash-Chained Audit Ledger</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                All platform events (upload, download, share, verify) are chained via previous event hashes, preventing hidden log deletions or post-facto row alteration.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-emerald-500/40 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-emerald-600/10 text-emerald-400 flex items-center justify-center mb-4 border border-emerald-500/20">
                <Share2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-white mb-2">Granular Role-Based Sharing</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Enforce Viewer or Editor authorization on the server. Unauthorized access or downloading by uninvited users is strictly rejected with 403 Forbidden.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-amber-500/40 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-amber-600/10 text-amber-400 flex items-center justify-center mb-4 border border-amber-500/20">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-white mb-2">Safe Vault Storage</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Files are stored outside public web roots with UUID filenames, protected by path-traversal sanitization and authenticated streaming download endpoints.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Flow */}
      <section id="how-it-works" className="py-20 bg-slate-900/40 border-t border-slate-900">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
              Zero-Trust Verification Workflow
            </h2>
            <p className="mt-2 text-3xl font-extrabold text-white">
              How TrustVault Guarantees Document Authenticity
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6 relative">
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 relative">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center mb-3">
                1
              </div>
              <h4 className="font-bold text-sm text-white mb-1">Upload & Baseline Hash</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                File is uploaded; backend reads raw bytes and computes SHA-256 fingerprint $H_0$. Original hash is permanently bound to Version 1.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 relative">
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center mb-3">
                2
              </div>
              <h4 className="font-bold text-sm text-white mb-1">Chained Audit Commit</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                 Upload metadata is linked to the previous block hash:
                 H[n] = SHA-256(H[n-1] || Metadata). Stored in sequential SQLite ledger.              
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 relative">
              <div className="w-8 h-8 rounded-full bg-purple-600 text-white font-bold text-xs flex items-center justify-center mb-3">
                3
              </div>
              <h4 className="font-bold text-sm text-white mb-1">Authorized Sharing</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Owner grants Viewer or Editor rights to specific registered emails. Access grants and revocations are logged as audit chain events.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 relative">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center mb-3">
                4
              </div>
              <h4 className="font-bold text-sm text-white mb-1">On-Demand Verification</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                User clicks Verify: system reads file from disk, recalculates SHA-256. If equal: <strong>VERIFIED</strong>. If even 1 bit altered: <strong>TAMPER DETECTED</strong>.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Cryptographic Architecture & Honest Limitations */}
      <section id="architecture" className="py-20 border-t border-slate-900 bg-slate-950">
        <div className="max-w-4xl mx-auto px-6">
          <div className="p-8 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-6">
            <div className="flex items-center gap-3">
              <Terminal className="w-6 h-6 text-blue-400" />
              <h3 className="text-xl font-bold text-white">
                Cryptographic Formulation & Threat Model Analysis
              </h3>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed font-mono bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="text-blue-400 font-bold uppercase tracking-wider">
                Recurrence Relation for Hash-Chained Audit Blocks:
              </div>
              <div className="text-emerald-300 text-sm overflow-x-auto select-all py-1">
                H[n] = SHA-256( H[n-1] || Seq || Timestamp || UserID || Action || DocID || CanonicalDetails )
              </div>
              <div className="text-slate-400">
                Where H[0] = 0000000000000000000000000000000000000000000000000000000000000000 (Genesis Block)
              </div>
            </div>

            {/* Honest Limitation Analysis */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-amber-500/30 text-xs text-slate-300 space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Security Engineering Note: Limitations of Local Hash Chains</span>
              </div>
              <p className="leading-relaxed">
                A hash chain ensures that an attacker who alters or removes a row cannot do so without changing that row's hash and breaking all subsequent links. However, an attacker with full database administrator access could theoretically recalculate the entire chain forward from the point of modification.
              </p>
              <p className="leading-relaxed text-slate-400">
                <strong>Industry Strengthening Solutions:</strong> To achieve true immutable non-repudiation in multi-tenant enterprise clouds, local hash chains should be paired with:
                (1) <em>RFC 3161 Trusted Digital Timestamps</em> from an external Certificate Authority, 
                (2) <em>Periodic Merkle Root Anchoring</em> into an external public ledger (e.g. Bitcoin, Ethereum, or RFC 6962 Certificate Transparency logs), and 
                (3) <em>Hardware Security Modules (HSM)</em> with asymmetric private key signing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-slate-900 bg-slate-950 text-center text-xs text-slate-500">
        <p>TrustVault &bull; Secure Document Management & Tamper-Evident Architecture</p>
        <p className="mt-1 font-mono text-[11px] text-slate-600">Built for Company Hiring Challenge Demonstration</p>
      </footer>
    </div>
  );
}
