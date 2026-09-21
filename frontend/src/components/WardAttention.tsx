import { AlertTriangle } from 'lucide-react';
import type { Ward } from '@/types';

interface WardAttentionProps {
  wards: Ward[];
  onSelectWard?: (wardId: string) => void;
}

export default function WardAttention({ wards }: WardAttentionProps) {
  const sorted = [...wards].sort((a, b) => b.pendingCount - a.pendingCount).slice(0, 5);
  const max = sorted[0]?.pendingCount ?? 1;

  return (
    <div className="flex h-full flex-col rounded-xl2 border border-base-border bg-base-surface p-5 shadow-soft">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle size={16} className="text-amber-600" />
          <h2 className="text-sm font-semibold text-navy-700">Wards needing attention</h2>
        </div>
        <span className="text-[10px] font-mono text-[#64748B]">Citywide Telemetry</span>
      </div>

      <div className="flex flex-1 flex-col justify-between gap-3">
        {sorted.map((ward) => (
          <div
            key={ward.id}
            className="group flex items-center gap-3 rounded-lg px-1.5 py-1 text-left"
          >
            <div className="w-24 shrink-0 text-xs font-medium text-navy-600 truncate" title={ward.name}>
              {ward.name}
            </div>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-base-bg">
              <div
                className="h-full rounded-full bg-amber-500"
                style={{ width: `${Math.max((ward.pendingCount / max) * 100, 8)}%` }}
              />
            </div>
            <div className="w-8 shrink-0 text-right text-xs font-semibold text-navy-700">
              {ward.pendingCount}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
