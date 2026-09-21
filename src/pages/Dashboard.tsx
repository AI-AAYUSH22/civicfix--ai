import { useMemo, useState } from 'react';
import Header from '@/components/Header';
import WardSelector from '@/components/WardSelector';
import StatsStrip from '@/components/StatsStrip';
import WardAttention from '@/components/WardAttention';
import CityMapPlaceholder from '@/components/CityMapPlaceholder';
import CaseList from '@/components/CaseList';
import { wards, getCasesByWard } from '@/data/mockData';
import { computeStats } from '@/utils/caseUtils';

export default function Dashboard() {
  const [selectedWardId, setSelectedWardId] = useState<string | 'all'>('all');
  const [mapCity, setMapCity] = useState<'Mumbai' | 'Thane'>('Mumbai');

  const filteredCases = useMemo(() => getCasesByWard(selectedWardId), [selectedWardId]);
  const stats = useMemo(() => computeStats(filteredCases), [filteredCases]);

  function handleOpenCase(caseId: string) {
    // Case detail view arrives in Phase 2.
    console.log('Open case', caseId);
  }

  function handleSelectWardFromAttention(wardId: string) {
    setSelectedWardId(wardId);
  }

  return (
    <div className="min-h-screen bg-base-bg">
      <Header />

      <main className="mx-auto max-w-[1440px] px-6 py-6">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Ward Dashboard</h1>
            <p className="mt-0.5 text-sm text-navy-400">
              Track reported potholes, repairs in progress, and verified fixes across your wards.
            </p>
          </div>
          <WardSelector wards={wards} selectedWardId={selectedWardId} onChange={setSelectedWardId} />
        </div>

        <div className="mb-6">
          <StatsStrip stats={stats} />
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="mb-2 flex items-center gap-1.5 rounded-lg bg-base-surface p-1 shadow-soft w-fit">
              {(['Mumbai', 'Thane'] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => setMapCity(c)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    mapCity === c ? 'bg-navy-600 text-white' : 'text-navy-400 hover:text-navy-600'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
            <div className="h-[360px]">
              <CityMapPlaceholder cases={filteredCases} city={mapCity} />
            </div>
          </div>

          <WardAttention wards={wards} onSelectWard={handleSelectWardFromAttention} />
        </div>

        <CaseList cases={filteredCases} onOpenCase={handleOpenCase} />
      </main>
    </div>
  );
}
