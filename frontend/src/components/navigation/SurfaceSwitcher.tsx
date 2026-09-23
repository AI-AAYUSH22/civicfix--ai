import React from 'react';
import { Smartphone, HardHat, Building2, Palette, MessageSquare } from 'lucide-react';
import type { AppSurface } from '@/types';

interface SurfaceSwitcherProps {
  currentSurface: AppSurface;
  onSelectSurface: (surface: AppSurface) => void;
}

export const SurfaceSwitcher: React.FC<SurfaceSwitcherProps> = ({
  currentSurface,
  onSelectSurface,
}) => {
  const surfaces: { id: AppSurface; label: string; icon: React.ReactNode; badge?: string }[] = [
    {
      id: 'landing',
      label: 'Home',
      icon: <Building2 size={16} />,
      badge: 'Portal',
    },
    {
      id: 'citizen',
      label: 'Citizen App',
      icon: <Smartphone size={16} />,
      badge: 'Mobile',
    },
    {
      id: 'whatsapp',
      label: 'WhatsApp Bot',
      icon: <MessageSquare size={16} />,
      badge: 'AI Bot',
    },
    {
      id: 'contractor',
      label: 'Contractor App',
      icon: <HardHat size={16} />,
      badge: 'Field',
    },
    {
      id: 'municipal',
      label: 'Municipal Web',
      icon: <Building2 size={16} />,
      badge: 'Operations',
    },
    {
      id: 'showcase',
      label: 'Design System & Atoms',
      icon: <Palette size={16} />,
      badge: 'Phase 1',
    },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#172033] text-white border-b border-slate-800 shadow-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-[#0F766E] flex items-center justify-center font-bold text-white text-sm shadow-sm">
            CF
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm tracking-tight text-white">CivicFix AI</span>
              <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-mono bg-teal-950 text-teal-300 border border-teal-800">
                Phase 1 Scaffolding
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Government-grade trust with consumer-app simplicity
            </p>
          </div>
        </div>

        {/* Switcher tabs */}
        <div className="flex items-center bg-[#0F172A] p-1 rounded-xl border border-slate-800">
          {surfaces.map((s) => {
            const isActive = currentSurface === s.id;
            return (
              <button
                key={s.id}
                onClick={() => onSelectSurface(s.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-[#0F766E] text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                {s.icon}
                <span className="hidden xs:inline">{s.label}</span>
                {s.badge && (
                  <span
                    className={`hidden md:inline-block text-[9px] uppercase px-1 rounded ${
                      isActive ? 'bg-[#115E59] text-teal-100' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {s.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};

export default SurfaceSwitcher;
