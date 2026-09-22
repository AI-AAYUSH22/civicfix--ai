import { useState } from 'react';
import { AppProvider, useApp } from '@/context/AppContext';
import { CitizenProvider } from '@/context/CitizenContext';
import { SurfaceSwitcher } from '@/components/navigation/SurfaceSwitcher';
// Duplicate import removed
import { CitizenDashboard } from '@/pages/citizen/CitizenDashboard';
import { ContractorDashboard } from '@/pages/contractor/ContractorDashboard';
// Duplicate import removed


import { MunicipalLayout, MunicipalNavSection } from '@/layouts/MunicipalLayout';


import { MunicipalDashboardView } from '@/pages/municipal/MunicipalDashboardView';
import { MunicipalLogin } from '@/pages/municipal/MunicipalLogin';
import { LandingPage } from '@/pages/landing/LandingPage';
import { DesignSystemShowcase } from '@/pages/showcase/DesignSystemShowcase';
import type { AppSurface } from '@/types';


function AppContent() {
  const { backendConnected, currentUser, logout } = useApp();
  const [surface, setSurface] = useState<AppSurface>('landing');



  // Municipal state
  const [municipalSection, setMunicipalSection] = useState<MunicipalNavSection>('dashboard');

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      {/* Top App Surface Switcher with Live Backend Status (hidden on standalone login to preserve clean focus) */}
      {surface !== 'login' && (
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
      )}

      {/* Surface Renderers */}
      <div className="flex-1">
        {surface === 'landing' && (
          <LandingPage
            onGoToLogin={() => setSurface('login')}
            onSelectSurface={(s) => setSurface(s)}
          />
        )}

        {surface === 'login' && (
          <MunicipalLogin
            onSuccess={() => setSurface('municipal')}
            onBackToLanding={() => setSurface('landing')}
          />
        )}

        {surface === 'showcase' && <DesignSystemShowcase />}

        {surface === 'citizen' && <CitizenDashboard />}


        {surface === 'contractor' && <ContractorDashboard />}

        {surface === 'municipal' && (
          <MunicipalLayout
            activeSection={municipalSection}
            onSelectSection={setMunicipalSection}
            selectedWard={currentUser?.assigned_ward?.ward_name || 'Ward G/N — Dadar / Mahim'}
            userName={currentUser?.name || 'Er. Rajesh Kulkarni'}
            employeeId={currentUser?.employee_id || 'BMC-ENG-4001'}
            onLogout={() => {
              logout();
              setSurface('landing');
            }}
          >
            <MunicipalDashboardView
              activeSection={municipalSection}
              assignedWardId={currentUser?.assigned_ward?.ward_id}
              assignedWardName={currentUser?.assigned_ward?.ward_name}
            />
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
