import React from 'react';
import { Home, PlusCircle, ClipboardList, Bell } from 'lucide-react';

export type CitizenTab = 'home' | 'report' | 'cases' | 'alerts';

interface BottomNavProps {
  activeTab: CitizenTab;
  onChangeTab: (tab: CitizenTab) => void;
  unreadAlertsCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  unreadAlertsCount = 2,
}) => {
  const tabs: { id: CitizenTab; label: string; icon: React.ReactNode; isAction?: boolean }[] = [
    { id: 'home', label: 'Home', icon: <Home size={20} /> },
    { id: 'report', label: 'Report', icon: <PlusCircle size={22} />, isAction: true },
    { id: 'cases', label: 'Cases', icon: <ClipboardList size={20} /> },
    { id: 'alerts', label: 'Alerts', icon: <Bell size={20} /> },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-30 bg-white/95 backdrop-blur-md border-t border-[#E2E8F0] shadow-lift px-4 py-2">
      <div className="flex items-center justify-around">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;

          if (tab.isAction) {
            return (
              <button
                key={tab.id}
                onClick={() => onChangeTab(tab.id)}
                className="group -mt-5 flex flex-col items-center focus:outline-none"
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform group-hover:scale-105 active:scale-95 ${
                    isActive
                      ? 'bg-[#115E59] text-white ring-4 ring-teal-100'
                      : 'bg-[#0F766E] text-white hover:bg-[#115E59]'
                  }`}
                >
                  <PlusCircle size={26} className="transition-transform group-hover:rotate-90 duration-200" />
                </div>
                <span
                  className={`mt-1 text-[11px] font-semibold tracking-tight ${
                    isActive ? 'text-[#0F766E]' : 'text-[#334155]'
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`relative flex flex-col items-center py-1 px-3 rounded-xl transition-all ${
                isActive ? 'text-[#0F766E]' : 'text-[#64748B] hover:text-[#172033]'
              }`}
            >
              <div className="relative">
                {tab.icon}
                {tab.id === 'alerts' && unreadAlertsCount > 0 && (
                  <span className="absolute -top-1 -right-1.5 w-4 h-4 rounded-full bg-[#D97706] text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white">
                    {unreadAlertsCount}
                  </span>
                )}
              </div>
              <span className={`text-[11px] mt-1 ${isActive ? 'font-semibold' : 'font-medium'}`}>
                {tab.label}
              </span>
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-[#0F766E] mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
