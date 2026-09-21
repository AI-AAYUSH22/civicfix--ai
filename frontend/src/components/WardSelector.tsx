import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import type { Ward } from '@/types';

interface WardSelectorProps {
  wards: Ward[];
  selectedWardId: string | 'all';
  onChange: (wardId: string | 'all') => void;
}

export default function WardSelector({ wards, selectedWardId, onChange }: WardSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const selectedLabel =
    selectedWardId === 'all' ? 'All Wards' : wards.find((w) => w.id === selectedWardId)?.name ?? 'Select ward';

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-lg border border-base-border bg-base-surface px-3.5 py-2 text-sm font-medium text-navy-700 shadow-soft transition-colors hover:border-navy-100"
      >
        {selectedLabel}
        <ChevronDown size={16} className={`text-navy-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 z-40 mt-1.5 w-52 overflow-hidden rounded-xl border border-base-border bg-base-surface py-1 shadow-lift">
          <button
            onClick={() => {
              onChange('all');
              setOpen(false);
            }}
            className="flex w-full items-center justify-between px-3.5 py-2 text-left text-sm text-navy-600 hover:bg-base-bg"
          >
            All Wards
            {selectedWardId === 'all' && <Check size={14} className="text-teal-500" />}
          </button>
          <div className="my-1 h-px bg-base-border" />
          {wards.map((ward) => (
            <button
              key={ward.id}
              onClick={() => {
                onChange(ward.id);
                setOpen(false);
              }}
              className="flex w-full items-center justify-between px-3.5 py-2 text-left text-sm text-navy-600 hover:bg-base-bg"
            >
              <span>
                {ward.name} <span className="text-navy-400">· {ward.city}</span>
              </span>
              {selectedWardId === ward.id && <Check size={14} className="text-teal-500" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
