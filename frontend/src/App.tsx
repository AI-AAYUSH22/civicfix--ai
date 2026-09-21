import { useState } from 'react';
import { AppProvider, useApp } from '@/context/AppContext';
import { CitizenProvider } from '@/context/CitizenContext';
import { SurfaceSwitcher } from '@/components/navigation/SurfaceSwitcher';
import { CitizenLayout } from '@/layouts/CitizenLayout';
import { ContractorLayout } from '@/layouts/ContractorLayout';
import { MunicipalLayout, MunicipalNavSection } from '@/layouts/MunicipalLayout';
import { CitizenHome } from '@/pages/citizen/CitizenHome';
import { ContractorHome } from '@/pages/contractor/ContractorHome';
import { MunicipalDashboardView } from '@/pages/municipal/MunicipalDashboardView';
import { DesignSystemShowcase } from '@/pages/showcase/DesignSystemShowcase';
import type { AppSurface } from '@/types';
import type { CitizenTab } from '@/components/navigation/BottomNav';

function AppContent() {
  const { backendConnected } = useApp();
  const [surface, setSurface] = useState<AppSurface>('municipal');

  // Citizen state
  const [citizenTab, setCitizenTab] = useState<CitizenTab>('home');

  // Contractor state
  const [contractorFilter, setContractorFilter] = useState<string>('all');

  // Municipal state
  const [municipalSection, setMunicipalSection] = useState<MunicipalNavSection>('dashboard');
  const selectedWard = 'Ward G/N — Dadar / Mahim';

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      {/* Top App Surface Switcher with Live Backend Status */}
      <div className="relative">
        <SurfaceSwitcher
          currentSurface={surface}
          onSelectSurface={(s) => setSurface(s)}
        />
        <div className="absolute right-4 top-3 hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white border border-[#E2E8F0] shadow-sm">
          <span
            className={`w-2 h-2 rounded-full ${
              backendConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
            }`}
          />
          <span className={backendConnected ? 'text-emerald-700' : 'text-amber-700'}>
            {backendConnected ? 'Backend Live (FastAPI + CV Engine)' : 'Local Demo Mode'}
          </span>
        </div>
      </div>

      {/* Surface Renderers */}
      <div className="flex-1">
        {surface === 'showcase' && <DesignSystemShowcase />}

        {surface === 'citizen' && (
          <CitizenLayout
            activeTab={citizenTab}
            onChangeTab={setCitizenTab}
          >
            {citizenTab === 'home' && <CitizenHome />}
            {citizenTab === 'report' && (
              <div className="p-4 bg-white rounded-2xl border border-[#E2E8F0] text-center py-10 space-y-3">
                <h3 className="font-bold text-base text-[#172033]">Citizen Reporting Flow</h3>
                <p className="text-xs text-[#64748B]">
                  Click the "+ Report a pothole" button on the Home tab to experience the full 5-step report flow with live GPS & photo upload.
                </p>
                <button
                  onClick={() => setCitizenTab('home')}
                  className="px-4 py-2 bg-[#0F766E] text-white rounded-xl text-xs font-semibold"
                >
                  Return to Home
                </button>
              </div>
            )}
            {citizenTab === 'cases' && (
              <div className="space-y-3">
                <h3 className="font-bold text-sm text-[#172033]">Your Submitted Complaints</h3>
                <CitizenHome />
              </div>
            )}
            {citizenTab === 'alerts' && (
              <div className="p-4 bg-white rounded-2xl border border-[#E2E8F0] space-y-3">
                <h3 className="font-bold text-sm text-[#172033]">Municipal Alerts & Updates</h3>
                <div className="space-y-2 text-xs">
                  <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-[#0F766E]">
                    <span className="font-bold block">Case CF-1023 Repair Started</span>
                    <span className="text-[11px] text-teal-800">
                      Contractor RoadWorks Unit A has arrived at MG Road, Dadar.
                    </span>
                  </div>
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800">
                    <span className="font-bold block">Case CF-1019 Verified by AI</span>
                    <span className="text-[11px] text-emerald-700">
                      Repair at Gokhale Road verified and closed.
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CitizenLayout>
        )}

        {surface === 'contractor' && (
          <ContractorLayout
            assignedCount={4}
            activeFilter={contractorFilter}
            onFilterChange={setContractorFilter}
            onOpenQuickCapture={() => alert('Launching Quick Camera Capture for active job')}
          >
            <ContractorHome filter={contractorFilter} />
          </ContractorLayout>
        )}

        {surface === 'municipal' && (
          <MunicipalLayout
            activeSection={municipalSection}
            onSelectSection={setMunicipalSection}
            selectedWard={selectedWard}
          >
            <MunicipalDashboardView activeSection={municipalSection} />
          </MunicipalLayout>
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <CitizenProvider>
        <AppContent />
      </CitizenProvider>
    </AppProvider>
  );
}
