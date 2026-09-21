import { ListChecks } from 'lucide-react';
import type { PotholeCase } from '@/types';
import CaseCard from './CaseCard';

interface CaseListProps {
  cases: PotholeCase[];
  onOpenCase: (caseId: string) => void;
}

export default function CaseList({ cases, onOpenCase }: CaseListProps) {
  return (
    <div className="rounded-xl2 border border-base-border bg-base-surface p-5 shadow-soft">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ListChecks size={16} className="text-navy-500" />
          <h2 className="text-sm font-semibold text-navy-700">Active &amp; recent cases</h2>
        </div>
        <span className="text-xs text-navy-400">{cases.length} cases</span>
      </div>

      {cases.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-1 py-12 text-center">
          <p className="text-sm font-medium text-navy-600">No cases in this ward yet</p>
          <p className="text-xs text-navy-400">New citizen reports will appear here automatically.</p>
        </div>
      ) : (
        <div className="divide-y divide-base-border">
          {cases.map((c) => (
            <CaseCard key={c.id} potholeCase={c} onOpen={onOpenCase} />
          ))}
        </div>
      )}
    </div>
  );
}
