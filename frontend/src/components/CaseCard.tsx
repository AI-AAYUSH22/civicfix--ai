import { MapPin, ChevronRight } from 'lucide-react';
import type { PotholeCase } from '@/types';
import { statusStyles, severityStyles, formatDate } from '@/utils/caseUtils';
import ChannelBadge from '@/components/ui/ChannelBadge';

interface CaseCardProps {
  potholeCase: PotholeCase;
  onOpen: (caseId: string) => void;
}

export default function CaseCard({ potholeCase, onOpen }: CaseCardProps) {
  const status = statusStyles[potholeCase.status];
  const severity = severityStyles[potholeCase.severity];

  return (
    <button
      onClick={() => onOpen(potholeCase.id)}
      className="group flex w-full items-center gap-4 rounded-lg border border-transparent px-3 py-3.5 text-left transition-colors hover:border-base-border hover:bg-base-bg"
    >
      <div className="w-20 shrink-0">
        <p className="font-display text-sm font-semibold text-navy-700">{potholeCase.id}</p>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-sm text-navy-600">
          <MapPin size={13} className="shrink-0 text-navy-400" />
          <span className="truncate">{potholeCase.location}</span>
        </div>
        <p className="mt-0.5 text-xs text-navy-400">Reported {formatDate(potholeCase.reportedDate)}</p>
      </div>

      <div className="hidden shrink-0 sm:block">
        <ChannelBadge channel={potholeCase.channel} size="sm" />
      </div>

      <div className={`hidden shrink-0 rounded-full px-2.5 py-1 text-xs font-medium sm:block ${severity.bg} ${severity.text}`}>
        {potholeCase.severity}
      </div>

      <div className={`flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${status.bg} ${status.text}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
        {potholeCase.status}
      </div>

      <ChevronRight size={16} className="shrink-0 text-navy-400 opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  );
}
