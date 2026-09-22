import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  LayoutDashboard,
  FolderKanban,
  Sparkles,
  Users,
  Search,
  Bell,
  Building2,
  Menu,
  X,
} from 'lucide-react';
import { pageVariants } from '@/animations';

export type MunicipalNavSection =
  | 'dashboard'
  | 'cases'
  | 'verification'
  | 'contractors';

interface MunicipalLayoutProps {
  children: React.ReactNode;
  activeSection: MunicipalNavSection;
  onSelectSection: (section: MunicipalNavSection) => void;
  selectedWard?: string;
}

export const MunicipalLayout: React.FC<MunicipalLayoutProps> = ({
  children,
  activeSection,
  onSelectSection,
  selectedWard = 'Ward G/N — Dadar West / Mahim',
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: {
    id: MunicipalNavSection;
    label: string;
    icon: React.ReactNode;
    badge?: string;
    badgeColor?: string;
  }[] = [
    {
      id: 'dashboard',
      label: 'Ward Overview',
      icon: <LayoutDashboard size={18} />,
    },
    {
      id: 'cases',
      label: 'Case Management',
      icon: <FolderKanban size={18} />,
      badge: 'Active',
      badgeColor: 'bg-slate-700 text-slate-200',
    },
    {
      id: 'verification',
      label: 'AI Verification Queue',
      icon: <Sparkles size={18} />,
      badge: 'Review',
      badgeColor: 'bg-[#0F766E] text-white',
    },
    {
      id: 'contractors',
      label: 'Contractors & Teams',
      icon: <Users size={18} />,
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row">
      {/* Mobile Sidebar Toggle Header */}
      <div className="md:hidden bg-[#172033] text-white px-4 py-3 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#0F766E] text-white flex items-center justify-center font-bold text-sm">
            CF
          </div>
          <div>
            <span className="font-semibold text-sm">CivicFix Municipal</span>
            <span className="text-[11px] text-slate-400 block">{selectedWard}</span>
          </div>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Desktop Civic Sidebar */}
      <aside
        className={`fixed md:sticky top-0 bottom-0 left-0 z-30 w-64 bg-[#172033] text-slate-300 flex flex-col border-r border-slate-800 transition-transform duration-200 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Sidebar Brand / Ward Seal */}
        <div className="p-5 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0F766E] text-white flex items-center justify-center font-bold text-base shadow-md">
              CF
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="font-bold text-sm text-white tracking-tight">CivicFix AI</h2>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-teal-900/60 text-teal-300 border border-teal-700/50">
                  BMC
                </span>
              </div>
              <p className="text-xs text-slate-400">Municipal Operations</p>
            </div>
          </div>


        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Operational Views
          </div>
          {navItems.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectSection(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-colors text-left ${
                  isActive
                    ? 'bg-[#0F766E] text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={isActive ? 'text-white' : 'text-slate-400'}>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                      isActive ? 'bg-[#115E59] text-teal-100' : item.badgeColor || 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* System & AI Verification Health Status */}
        <div className="p-4 border-t border-slate-800/80 bg-[#0F172A]/50">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-400 font-medium">AI Verification Engine</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              99.2%
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div className="bg-[#0F766E] h-1.5 rounded-full" style={{ width: '92%' }} />
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Automated visual GPS & repair verification active.
          </p>
        </div>
      </aside>

      {/* Main Operational Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="bg-white border-b border-[#E2E8F0] px-4 sm:px-8 py-3.5 sticky top-0 z-20 shadow-subtle flex items-center justify-between gap-4">
          {/* Search bar */}
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <div className="relative w-full">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"
              />
              <input
                type="text"
                placeholder="Search case ID, road name, contractor..."
                className="w-full pl-9 pr-12 py-2 text-xs sm:text-sm bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] text-[#172033]"
              />
              <span className="hidden sm:inline-block absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-[#94A3B8] font-mono bg-white px-1.5 py-0.5 rounded border border-[#E2E8F0]">
                ⌘K
              </span>
            </div>
          </div>

          {/* Right Header Tools */}
          <div className="flex items-center gap-3">
            {/* Ward Jurisdictional Badge (Locked for Ward Engineer) */}
            <div
              className="hidden lg:flex items-center gap-2 bg-[#F1F5F9] px-3 py-1.5 rounded-xl border border-[#E2E8F0] text-xs font-medium text-[#172033]"
              title="Your assigned municipal jurisdiction"
            >
              <span className="text-[#64748B]">Assigned Ward:</span>
              <span className="font-semibold text-[#0F766E]">{selectedWard}</span>
            </div>

            {/* Notifications */}
            <button
              className="relative p-2 rounded-xl text-[#64748B] hover:text-[#172033] hover:bg-[#F1F5F9] transition-colors"
              aria-label="Alerts"
            >
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#D97706]" />
            </button>

            {/* Officer Profile */}
            <div className="flex items-center gap-2.5 pl-2 border-l border-[#E2E8F0]">
              <div className="w-8 h-8 rounded-full bg-[#172033] text-white flex items-center justify-center font-semibold text-xs">
                RS
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold text-[#172033] leading-none">
                  Eng. R. Shinde
                </p>
                <p className="text-[11px] text-[#64748B] mt-0.5">Ward Engineer</p>
              </div>
            </div>
          </div>
        </header>

        {/* Workspace Content */}
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="max-w-7xl mx-auto"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default MunicipalLayout;
