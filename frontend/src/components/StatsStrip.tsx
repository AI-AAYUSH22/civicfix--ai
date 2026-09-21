import { ClipboardList, Hammer, ScanEye, CheckCircle2 } from 'lucide-react';
import type { DashboardStats } from '@/types';

interface StatsStripProps {
  stats: DashboardStats;
}

export default function StatsStrip({ stats }: StatsStripProps) {
  const items = [
    { label: 'Active cases', value: stats.totalActive, icon: ClipboardList, tone: 'text-navy-500' },
    { label: 'Under repair', value: stats.underRepair, icon: Hammer, tone: 'text-amber-600' },
    { label: 'Pending AI verification', value: stats.pendingVerification, icon: ScanEye, tone: 'text-navy-500' },
    { label: 'Resolved this month', value: stats.resolvedThisMonth, icon: CheckCircle2, tone: 'text-success-600' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-center gap-3 rounded-xl border border-base-border bg-base-surface px-4 py-3.5 shadow-soft"
        >
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-base-bg ${item.tone}`}>
            <item.icon size={17} />
          </div>
          <div>
            <p className="font-display text-xl font-semibold leading-none text-navy-700">{item.value}</p>
            <p className="mt-1 text-xs text-navy-400">{item.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
