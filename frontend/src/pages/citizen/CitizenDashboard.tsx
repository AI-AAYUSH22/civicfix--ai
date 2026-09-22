import React from 'react';
import { CitizenLayout } from '@/layouts/CitizenLayout';
import { CitizenHome } from '@/pages/citizen/CitizenHome';
import type { CitizenTab } from '@/components/navigation/BottomNav';

export const CitizenDashboard: React.FC = () => {
  const [citizenTab, setCitizenTab] = React.useState<CitizenTab>('home');

  return (
    <CitizenLayout activeTab={citizenTab} onChangeTab={setCitizenTab}>
      {citizenTab === 'home' && <CitizenHome />}
      {citizenTab === 'report' && (
        <CitizenHome autoOpenCamera={true} onReportClose={() => setCitizenTab('home')} />
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
            {/* Placeholder alerts */}
            <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-[#0F766E]">
              <span className="font-bold block">Case CF-1023 Repair Started</span>
              <span className="text-[11px] text-teal-800">Contractor RoadWorks Unit A has arrived at MG Road, Dadar.</span>
            </div>
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800">
              <span className="font-bold block">Case CF-1019 Verified by AI</span>
              <span className="text-[11px] text-emerald-700">Repair at Gokhale Road verified and closed.</span>
            </div>
          </div>
        </div>
      )}
    </CitizenLayout>
  );
};
