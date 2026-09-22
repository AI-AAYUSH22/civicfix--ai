import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  ArrowRight,
  AlertCircle,
  Building2,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';

interface MunicipalLoginProps {
  onSuccess: () => void;
  onBackToLanding: () => void;
}

export const MunicipalLogin: React.FC<MunicipalLoginProps> = ({
  onSuccess,
  onBackToLanding,
}) => {
  const { loginEngineer } = useApp();
  const [employeeId, setEmployeeId] = useState('BMC-ENG-4001');
  const [password, setPassword] = useState('Engineer@123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!employeeId.trim() || !password) {
      setError('Please provide Employee ID and Password.');
      return;
    }

    setLoading(true);
    try {
      await loginEngineer(employeeId.trim(), password);
      onSuccess();
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Check your Employee ID and password.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = (id: string, pw: string) => {
    setEmployeeId(id);
    setPassword(pw);
  };

  return (
    <div className="min-h-screen bg-[#0B1120] flex flex-col justify-between p-4 sm:p-8 relative overflow-hidden font-sans">
      {/* Dynamic Background Glow Elements */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-teal-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Bar */}
      <header className="max-w-6xl mx-auto w-full flex items-center justify-between z-10 py-2">
        <button
          onClick={onBackToLanding}
          className="flex items-center gap-2.5 text-slate-300 hover:text-white transition-colors group focus:outline-none"
        >
          <div className="w-8 h-8 rounded-lg bg-[#0F766E] flex items-center justify-center font-bold text-white text-xs shadow-md group-hover:scale-105 transition-transform">
            CF
          </div>
          <span className="font-bold text-sm text-white tracking-tight">CivicFix AI</span>
          <span className="text-xs text-slate-500 font-mono hidden sm:inline">← Back to Portal</span>
        </button>

        <div className="flex items-center gap-2 text-[11px] font-medium text-teal-400 bg-teal-950/60 px-3 py-1 rounded-full border border-teal-800">
          <ShieldCheck size={13} />
          <span>MCGM Official Gateway</span>
        </div>
      </header>

      {/* Center Auth Card */}
      <main className="max-w-md w-full mx-auto z-10 my-8">
        <div className="bg-[#172033]/90 backdrop-blur-xl border border-slate-700/80 rounded-3xl p-7 sm:p-9 shadow-2xl space-y-6 relative">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-teal-950 border border-teal-700/60 text-teal-400 flex items-center justify-center mx-auto shadow-inner">
              <Building2 size={24} />
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Municipal Engineer Login
            </h2>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Sign in with your Municipal Employee ID. Your assigned ward dashboard will load automatically.
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3.5 rounded-xl bg-red-950/70 border border-red-800/80 flex items-start gap-2.5 text-xs text-red-200 animate-fadeIn">
              <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Clean Sign In Form: strictly Employee ID, Password, and Sign In */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Employee ID
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  placeholder="e.g. BMC-ENG-4001"
                  required
                  autoFocus
                  className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:border-transparent transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-[#0F766E] hover:bg-[#115E59] active:bg-[#0D5F58] text-white font-semibold text-sm transition-all shadow-lg flex items-center justify-center gap-2 group disabled:opacity-50 disabled:pointer-events-none mt-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying Registry & Ward...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Ward Dashboard</span>
                  <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials for Hackathon Evaluators */}
          <div className="pt-4 border-t border-slate-800/80 space-y-2">
            <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
              Demo Hackathon Registry Accounts
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickDemo('BMC-ENG-4001', 'Engineer@123')}
                className="p-2 text-left bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-xl transition-colors"
              >
                <p className="font-semibold text-slate-200">Er. Rajesh Kulkarni</p>
                <p className="text-[10px] text-teal-400">BMC-ENG-4001 • Ward G/N</p>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('BMC-ADM-1001', 'Admin@123')}
                className="p-2 text-left bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-xl transition-colors"
              >
                <p className="font-semibold text-slate-200">Commissioner Office</p>
                <p className="text-[10px] text-amber-400">BMC-ADM-1001 • Citywide</p>
              </button>
            </div>
          </div>

          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
            <Lock size={14} className="text-teal-400 shrink-0" />
            <span>Ward selection is automatic based on official employee assignment.</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto w-full text-center text-[11px] text-slate-500 py-2 z-10">
        CivicFix AI Municipal Gateway • Brihanmumbai Municipal Corporation (MCGM) Registry
      </footer>
    </div>
  );
};

export default MunicipalLogin;
