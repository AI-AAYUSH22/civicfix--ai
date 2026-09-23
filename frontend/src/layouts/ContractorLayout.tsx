import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HardHat, Camera, Wifi, Navigation, Database, Layers } from 'lucide-react';
import { pageVariants } from '@/animations';
import { Button } from '@/components/ui/Button';
import { useApp } from '@/context/AppContext';

interface ContractorLayoutProps {
  children: React.ReactNode;
  assignedCount?: number;
  activeFilter?: string;
  onFilterChange?: (filter: string) => void;
  selectedWard?: string;
  onWardChange?: (ward: string) => void;
  onOpenQuickCapture?: () => void;
}

export const ContractorLayout: React.FC<ContractorLayoutProps> = ({
  children,
  assignedCount = 4,
  activeFilter = 'all',
  onFilterChange,
  selectedWard = 'all',
  onWardChange,
  onOpenQuickCapture,
}) => {
  const { wards, workOrders } = useApp();

  const filters = [
    { id: 'all', label: 'All Jobs', count: assignedCount },
    { id: 'high', label: 'High Priority', count: workOrders.filter(w => w.priority === 'High').length || 2 },
    { id: 'progress', label: 'In Progress', count: workOrders.filter(w => w.status === 'In Progress').length || 1 },
    { id: 'review', label: 'Needs Review', count: workOrders.filter(w => w.status === 'Needs Review' || w.status === 'Evidence Submitted').length || 1 },
  ];

  // Ward options derived from wards list & work orders
  const availableWards = wards.length > 0 ? wards : [
    { id: 'G/N', name: 'Ward G/N — Dadar / Mahim', code: 'G/N', city: 'Mumbai', pendingCount: 18 },
    { id: 'H/W', name: 'Ward H/W — Bandra West', code: 'H/W', city: 'Mumbai', pendingCount: 14 },
    { id: 'K/E', name: 'Ward K/E — Andheri East', code: 'K/E', city: 'Mumbai', pendingCount: 16 },
    { id: 'L', name: 'Ward L — Kurla West', code: 'L', city: 'Mumbai', pendingCount: 15 },
  ];

  return (
    <div className="min-h-screen bg-[#F1F5F9] py-0 md:py-6 flex flex-col items-center justify-start">
      {/* Contractor Container Shell */}
      <div className="w-full max-w-2xl bg-[#F8FAFC] min-h-screen md:min-h-[860px] md:border md:border-[#CBD5E1] md:rounded-[28px] md:shadow-xl overflow-hidden relative flex flex-col">
        {/* Contractor Field Header */}
        <header className="bg-[#172033] text-white px-5 py-4 sticky top-0 z-20 shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#0F766E] flex items-center justify-center text-white shadow-inner font-bold">
                <HardHat size={22} />
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-xs text-teal-300 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>RoadWorks Unit A • On-Duty</span>
                </div>
                <h1 className="text-base font-bold text-white tracking-tight">
                  CivicFix Contractor Field
                </h1>
              </div>
            </div>

            {/* Assigned badge & DB connection status */}
            <div className="flex items-center gap-2">
              <div className="bg-[#0F172A] border border-slate-700/80 rounded-xl px-3 py-1.5 text-right">
                <span className="text-[10px] text-slate-400 block uppercase tracking-wider">
                  Assigned Jobs
                </span>
                <span className="text-lg font-bold text-teal-400 leading-none">
                  {workOrders.length || assignedCount}
                </span>
              </div>
            </div>
          </div>

          {/* Quick status & Database connectivity bar */}
          <div className="mt-3 pt-2.5 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-emerald-400 font-medium">
                <Wifi size={13} />
                GPS Active
              </span>
              <span className="flex items-center gap-1 text-teal-300 bg-teal-950/80 border border-teal-500/30 px-2 py-0.5 rounded text-[11px]">
                <Database size={12} className="text-teal-400" />
                <span>Multi-DB Connected</span>
              </span>
            </div>

            {/* Ward Selector Dropdown in Header */}
            {onWardChange && (
              <div className="flex items-center gap-1.5">
                <Layers size={13} className="text-teal-400" />
                <select
                  value={selectedWard}
                  onChange={(e) => onWardChange(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-teal-200 text-xs rounded-lg px-2.5 py-1 font-semibold focus:outline-none focus:border-teal-500"
                >
                  <option value="all">📍 All Wards ({availableWards.length})</option>
                  {availableWards.map((w) => (
                    <option key={w.id} value={w.code || w.id}>
                      {w.code ? `Ward ${w.code}` : w.name.split('—')[0]} ({w.name.split('—')[1] || w.name})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Filter tabs */}
          {onFilterChange && (
            <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {filters.map((f) => {
                const isActive = activeFilter === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => onFilterChange(f.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-[#0F766E] text-white shadow-sm'
                        : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>{f.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        isActive ? 'bg-teal-900 text-teal-200' : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {f.count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </header>

        {/* Scrollable Work Order List / Content */}
        <main className="flex-1 overflow-y-auto px-4 py-5 pb-24">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeFilter}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-4"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Contractor Fixed Bottom Action Dock */}
        <footer className="fixed bottom-0 left-0 right-0 max-w-2xl mx-auto bg-white/95 backdrop-blur-md border-t border-[#E2E8F0] px-4 py-3 shadow-lift z-30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-xs text-[#64748B] font-medium">
              4 Active Work Orders
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Navigation size={14} />}
              onClick={() => alert('Route optimization: 4 stops ordered by proximity')}
            >
              Route Map
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Camera size={14} />}
              onClick={onOpenQuickCapture}
            >
              Capture Evidence
            </Button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default ContractorLayout;
