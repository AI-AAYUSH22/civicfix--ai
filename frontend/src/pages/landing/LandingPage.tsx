import React from 'react';
import {
  ShieldCheck,
  Building2,
  HardHat,
  Smartphone,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import type { AppSurface } from '@/types';

interface LandingPageProps {
  onGoToLogin: () => void;
  onSelectSurface: (surface: AppSurface) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onGoToLogin,
  onSelectSurface,
}) => {
  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-100 flex flex-col justify-between selection:bg-[#0F766E] selection:text-white relative overflow-hidden">
      {/* Dynamic Background Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] bg-gradient-to-b from-teal-500/10 via-teal-900/5 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute top-1/4 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -left-40 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Navigation Header */}
      <header className="max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0F766E] to-[#115E59] text-white flex items-center justify-center font-bold text-base shadow-lg shadow-teal-950">
            CF
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight text-white">CivicFix AI</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-teal-950 text-teal-300 border border-teal-800">
                MCGM Mumbai
              </span>
            </div>
            <p className="text-xs text-slate-400">Decentralized Road Repair & AI Verification</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onSelectSurface('citizen')}
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
          >
            <Smartphone size={14} className="text-teal-400" />
            <span>Citizen Portal</span>
          </button>
          <button
            onClick={() => onSelectSurface('contractor')}
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
          >
            <HardHat size={14} className="text-amber-400" />
            <span>Contractor App</span>
          </button>
          <button
            onClick={onGoToLogin}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-bold transition-all shadow-md shadow-teal-950 hover:shadow-teal-900 group"
          >
            <Building2 size={15} />
            <span>Municipal Engineer Login</span>
            <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto w-full px-6 py-12 lg:py-20 relative z-10 space-y-16">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-950/80 border border-teal-800 text-teal-300 text-xs font-semibold backdrop-blur-md">
            <Sparkles size={14} className="text-teal-400" />
            <span>Automated Computer Vision & Dual-DB Proof of Repair</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.15]">
            Accountable Road Repairs for{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-teal-400 via-emerald-300 to-teal-200">
              Modern Municipalities
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            CivicFix AI verifies road cavity repairs using camera perspective homography, landmark
            geometry, and immutable audit trails. Assigned ward engineers access only their jurisdiction
            with automated employee assignment.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onGoToLogin}
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-[#0F766E] hover:bg-[#115E59] text-white font-bold text-sm transition-all shadow-xl shadow-teal-950/80 flex items-center justify-center gap-2.5 group"
            >
              <Building2 size={18} />
              <span>Sign In with Employee ID</span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => onSelectSurface('citizen')}
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-sm transition-all flex items-center justify-center gap-2"
            >
              <Smartphone size={18} className="text-teal-400" />
              <span>Report Pothole as Citizen</span>
            </button>
          </div>
        </div>

        {/* 3 Role Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          {/* Pillar 1: Municipal Engineer */}
          <div className="bg-[#172033]/80 border border-slate-700/70 rounded-3xl p-7 space-y-4 hover:border-teal-500/50 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-teal-950 border border-teal-800 flex items-center justify-center text-teal-400">
              <Building2 size={24} />
            </div>
            <h3 className="text-lg font-bold text-white">Ward Engineer Control</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Login via Municipal Employee ID. Ward is automatically bound to the engineer's official
              jurisdiction without manual ward picker, keeping historical assignments intact.
            </p>
            <ul className="space-y-2 text-xs text-slate-300 pt-2 border-t border-slate-800">
              <li className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-teal-400 shrink-0" />
                <span>Single-Ward Jurisdiction Lock</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-teal-400 shrink-0" />
                <span>Real-Time Case Validation & Work Orders</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-teal-400 shrink-0" />
                <span>AI Verification Review & Contractor Payouts</span>
              </li>
            </ul>
            <div className="pt-2">
              <button
                onClick={onGoToLogin}
                className="w-full py-2.5 rounded-xl bg-teal-900/40 hover:bg-teal-900/60 border border-teal-700 text-teal-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Access Engineer Portal</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>

          {/* Pillar 2: Contractor Field Dispatch */}
          <div className="bg-[#172033]/80 border border-slate-700/70 rounded-3xl p-7 space-y-4 hover:border-amber-500/50 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-amber-950 border border-amber-800 flex items-center justify-center text-amber-400">
              <HardHat size={24} />
            </div>
            <h3 className="text-lg font-bold text-white">Contractor Live Operations</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every contractor operates under a unique Contractor ID. Work orders and evidence are
              permanently bound to the contractor with hardware camera and live GPS geofencing.
            </p>
            <ul className="space-y-2 text-xs text-slate-300 pt-2 border-t border-slate-800">
              <li className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-amber-400 shrink-0" />
                <span>In-App Camera Capture (Before / After)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-amber-400 shrink-0" />
                <span>Hardware GPS Spatial Verification (±15m)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-amber-400 shrink-0" />
                <span>Dual-Database Offline Replication</span>
              </li>
            </ul>
            <div className="pt-2">
              <button
                onClick={() => onSelectSurface('contractor')}
                className="w-full py-2.5 rounded-xl bg-amber-900/30 hover:bg-amber-900/50 border border-amber-700 text-amber-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Launch Contractor App</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>

          {/* Pillar 3: Citizen Citywide Portal */}
          <div className="bg-[#172033]/80 border border-slate-700/70 rounded-3xl p-7 space-y-4 hover:border-blue-500/50 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-blue-950 border border-blue-800 flex items-center justify-center text-blue-400">
              <Smartphone size={24} />
            </div>
            <h3 className="text-lg font-bold text-white">Citizen Citywide Reporting</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Citizens can report potholes from anywhere in Mumbai. Quick camera capture locks GPS and
              dispatches complaints directly to municipal authorities in seconds.
            </p>
            <ul className="space-y-2 text-xs text-slate-300 pt-2 border-t border-slate-800">
              <li className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-blue-400 shrink-0" />
                <span>Report From Any Location / Ward</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-blue-400 shrink-0" />
                <span>Direct Camera Shortcut for 1-Tap Upload</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-blue-400 shrink-0" />
                <span>Live Status Tracker & Resolution Proof</span>
              </li>
            </ul>
            <div className="pt-2">
              <button
                onClick={() => onSelectSurface('citizen')}
                className="w-full py-2.5 rounded-xl bg-blue-900/30 hover:bg-blue-900/50 border border-blue-700 text-blue-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Open Citizen Portal</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </div>

        {/* Security & Audit Guarantee Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-[#131E32] to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 text-xs font-semibold text-teal-400">
              <ShieldCheck size={16} />
              <span>Immutable Municipal Audit Log</span>
            </div>
            <h4 className="text-lg font-bold text-white">
              End-to-End Traceability for Every Tax Rupee Spent
            </h4>
            <p className="text-xs text-slate-400 max-w-2xl">
              Every step—from citizen complaint, engineer ward routing, contractor dispatch, before/after
              photos, to OpenCV homography match—is signed and permanently recorded in the municipal audit log.
            </p>
          </div>
          <button
            onClick={onGoToLogin}
            className="shrink-0 px-6 py-3 rounded-xl bg-white text-[#172033] hover:bg-slate-100 font-bold text-xs transition-colors shadow-lg"
          >
            Sign In to Ward Dashboard
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 max-w-7xl mx-auto w-full px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 relative z-10">
        <div>© 2026 CivicFix AI • Brihanmumbai Municipal Corporation (MCGM) Project</div>
        <div className="flex items-center gap-4 text-[11px]">
          <span>Hackathon Demo Registry</span>
          <span>•</span>
          <span>SIFT Homography Active</span>
          <span>•</span>
          <span>27 Mumbai Wards</span>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
