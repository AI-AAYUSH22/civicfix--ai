import { Map } from 'lucide-react';
import type { PotholeCase } from '@/types';
import { markerColor } from '@/utils/caseUtils';

interface CityMapPlaceholderProps {
  cases: PotholeCase[];
  city: 'Mumbai' | 'Thane';
}

const legend = [
  { label: 'Pending', color: '#D6483F' },
  { label: 'Under repair', color: '#E8A33D' },
  { label: 'Verification', color: '#1D3B65' },
  { label: 'Resolved', color: '#2E9E6D' },
];

export default function CityMapPlaceholder({ cases, city }: CityMapPlaceholderProps) {
  const cityCases = cases.filter((c) => c.city === city);

  return (
    <div className="flex h-full flex-col rounded-xl2 border border-base-border bg-base-surface p-5 shadow-soft">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Map size={16} className="text-navy-500" />
          <h2 className="text-sm font-semibold text-navy-700">City map — {city}</h2>
        </div>
        <div className="flex items-center gap-3">
          {legend.map((item) => (
            <div key={item.label} className="flex items-center gap-1.5 text-xs text-navy-400">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
              {item.label}
            </div>
          ))}
        </div>
      </div>

      <div className="relative min-h-[260px] flex-1 overflow-hidden rounded-lg bg-navy-50">
        {/* Mock street grid to suggest a map surface without pulling in real map infra yet */}
        <svg className="absolute inset-0 h-full w-full opacity-40" preserveAspectRatio="none">
          {Array.from({ length: 6 }).map((_, i) => (
            <line
              key={`h${i}`}
              x1="0"
              y1={`${(i + 1) * 14}%`}
              x2="100%"
              y2={`${(i + 1) * 14}%`}
              stroke="#D6DEEA"
              strokeWidth="1"
            />
          ))}
          {Array.from({ length: 8 }).map((_, i) => (
            <line
              key={`v${i}`}
              x1={`${(i + 1) * 11}%`}
              y1="0"
              x2={`${(i + 1) * 11}%`}
              y2="100%"
              stroke="#D6DEEA"
              strokeWidth="1"
            />
          ))}
        </svg>

        {cityCases.map((c) => (
          <div
            key={c.id}
            className="group absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer"
            style={{ left: `${c.coordinates.x}%`, top: `${c.coordinates.y}%` }}
            title={`${c.id} — ${c.location}`}
          >
            <span
              className="block h-3 w-3 rounded-full ring-4 ring-white transition-transform group-hover:scale-125"
              style={{ backgroundColor: markerColor(c.status) }}
            />
          </div>
        ))}

        <div className="absolute bottom-3 right-3 rounded-md bg-white/90 px-2.5 py-1 text-[11px] text-navy-400 shadow-soft">
          Mock coordinates · interactive map arrives in a later phase
        </div>
      </div>
    </div>
  );
}
