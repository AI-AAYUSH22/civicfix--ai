import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, ShieldCheck, Smartphone, Monitor } from 'lucide-react';
import { BottomNav, CitizenTab } from '@/components/navigation/BottomNav';
import { pageVariants } from '@/animations';

interface CitizenLayoutProps {
  children: React.ReactNode;
  activeTab: CitizenTab;
  onChangeTab: (tab: CitizenTab) => void;
  headerTitle?: string;
  headerSubtitle?: string;
}

export const CitizenLayout: React.FC<CitizenLayoutProps> = ({
  children,
  activeTab,
  onChangeTab,
  headerTitle = 'Good morning, Citizen',
  headerSubtitle = 'Report road issues anywhere across the city for instant repair',
}) => {
  const [frameMode, setFrameMode] = useState<boolean>(true);

  return (
    <div className="min-h-screen bg-[#F1F5F9] py-0 md:py-6 flex flex-col items-center justify-start">
      {/* Device Viewport Toggle on Desktop */}
      <div className="hidden md:flex items-center gap-2 mb-3 bg-white px-3 py-1.5 rounded-full border border-[#E2E8F0] shadow-subtle text-xs text-[#64748B]">
        <span>Citizen Mobile Experience:</span>
        <button
          onClick={() => setFrameMode(true)}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
            frameMode
              ? 'bg-[#0F766E] text-white'
              : 'text-[#64748B] hover:text-[#172033]'
          }`}
        >
          <Smartphone size={13} />
          <span>Mobile Bezel</span>
        </button>
        <button
          onClick={() => setFrameMode(false)}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
            !frameMode
              ? 'bg-[#0F766E] text-white'
              : 'text-[#64748B] hover:text-[#172033]'
          }`}
        >
          <Monitor size={13} />
          <span>Full Width</span>
        </button>
      </div>

      {/* Main Container Shell */}
      <div
        className={`w-full ${
          frameMode
            ? 'max-w-md bg-[#F8FAFC] min-h-[844px] md:border md:border-[#CBD5E1] md:rounded-[36px] md:shadow-2xl overflow-hidden relative flex flex-col'
            : 'max-w-xl bg-[#F8FAFC] min-h-screen relative flex flex-col'
        }`}
      >
        {/* Status Bar simulation on mobile bezel */}
        {frameMode && (
          <div className="hidden md:flex items-center justify-between px-6 pt-3 pb-1 text-[11px] font-semibold text-[#172033]">
            <span>9:41</span>
            <div className="w-20 h-4 bg-slate-900 rounded-full mx-auto" />
            <div className="flex items-center gap-1 text-[10px]">
              <span>5G</span>
              <span>100%</span>
            </div>
          </div>
        )}

        {/* Citizen Top App Header */}
        <header className="bg-white border-b border-[#E2E8F0] px-5 py-4 sticky top-0 z-20 shadow-subtle">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#0F766E] text-white flex items-center justify-center font-bold text-xs shadow-sm">
                CF
              </div>
              <div>
                <h1 className="text-sm font-bold text-[#172033] leading-tight">
                  CivicFix Citizen
                </h1>
                <p className="text-[11px] text-[#0F766E] font-medium">
                  Citywide Reporting Portal
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-50 text-[10px] font-medium text-[#0F766E] border border-teal-200">
                <ShieldCheck size={11} />
                <span>Verified Portal</span>
              </span>
              <button
                onClick={() => onChangeTab('alerts')}
                className="relative p-2 rounded-xl text-[#64748B] hover:text-[#172033] hover:bg-[#F1F5F9] transition-colors"
                aria-label="View notifications"
              >
                <Bell size={18} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#D97706]" />
              </button>
            </div>
          </div>

          {/* Subheader greeting */}
          {activeTab === 'home' && (
            <div className="mt-3 pt-3 border-t border-[#F1F5F9]">
              <h2 className="text-base font-bold text-[#172033]">{headerTitle}</h2>
              <p className="text-xs text-[#64748B] mt-0.5">{headerSubtitle}</p>
            </div>
          )}
        </header>

        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-y-auto px-4 py-5 pb-28">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="w-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Citizen Bottom Navigation */}
        <BottomNav activeTab={activeTab} onChangeTab={onChangeTab} />
      </div>
    </div>
  );
};

export default CitizenLayout;
