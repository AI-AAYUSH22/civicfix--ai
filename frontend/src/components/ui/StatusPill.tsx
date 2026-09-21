import React from 'react';
import type { CivicStatus } from '@/types';

export interface StatusPillProps {
  status: CivicStatus | string;
  size?: 'sm' | 'md';
  pulse?: boolean;
  className?: string;
}

interface StatusConfig {
  label: string;
  bg: string;
  text: string;
  border: string;
  dot: string;
  pulseDot?: boolean;
}

const statusMap: Record<string, StatusConfig> = {
  // Core status specifications
  REPORTED: {
    label: 'REPORTED',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    dot: 'bg-slate-500',
  },
  VALIDATED: {
    label: 'VALIDATED',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    dot: 'bg-blue-500',
  },
  ASSIGNED: {
    label: 'ASSIGNED',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    dot: 'bg-blue-500',
  },
  GROUND_LOCKED: {
    label: 'GROUND LOCKED',
    bg: 'bg-cyan-50',
    text: 'text-cyan-800',
    border: 'border-cyan-200',
    dot: 'bg-cyan-600',
    pulseDot: true,
  },
  REPAIRING: {
    label: 'REPAIRING',
    bg: 'bg-teal-50',
    text: 'text-teal-700',
    border: 'border-teal-200',
    dot: 'bg-teal-600',
    pulseDot: true,
  },
  REPAIRED_PENDING_VAL: {
    label: 'REPAIRED (PENDING VAL)',
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
    dot: 'bg-indigo-600',
    pulseDot: true,
  },
  VERIFICATION: {
    label: 'VERIFICATION',
    bg: 'bg-teal-50',
    text: 'text-teal-700',
    border: 'border-teal-200',
    dot: 'bg-teal-600',
    pulseDot: true,
  },
  FLAGGED_ANOMALY: {
    label: 'FLAGGED ANOMALY',
    bg: 'bg-rose-100',
    text: 'text-rose-800',
    border: 'border-rose-300',
    dot: 'bg-rose-600',
    pulseDot: true,
  },
  VERIFIED_CLOSED: {
    label: 'VERIFIED & CLOSED',
    bg: 'bg-emerald-100',
    text: 'text-emerald-800',
    border: 'border-emerald-300',
    dot: 'bg-emerald-600',
  },
  VERIFIED: {
    label: 'VERIFIED',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-600',
  },
  'NEEDS REVIEW': {
    label: 'NEEDS REVIEW',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
  },
  'NOT VERIFIED': {
    label: 'NOT VERIFIED',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    dot: 'bg-rose-600',
  },
  CLOSED: {
    label: 'CLOSED',
    bg: 'bg-slate-50',
    text: 'text-slate-600',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
  },

  // Title-case mappings
  Reported: {
    label: 'Reported',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    dot: 'bg-slate-500',
  },
  Validated: {
    label: 'Validated',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    dot: 'bg-blue-500',
  },
  Assigned: {
    label: 'Assigned',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    dot: 'bg-blue-500',
  },
  'Under Repair': {
    label: 'Under Repair',
    bg: 'bg-teal-50',
    text: 'text-teal-700',
    border: 'border-teal-200',
    dot: 'bg-teal-600',
    pulseDot: true,
  },
  'AI Verification': {
    label: 'AI Verification',
    bg: 'bg-teal-50',
    text: 'text-teal-700',
    border: 'border-teal-200',
    dot: 'bg-teal-600',
    pulseDot: true,
  },
  'Needs Review': {
    label: 'Needs Review',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
  },
  'Not Verified': {
    label: 'Not Verified',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    dot: 'bg-rose-600',
  },
  Verified: {
    label: 'Verified',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-600',
  },
  Resolved: {
    label: 'Resolved',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-600',
  },
};

export const StatusPill: React.FC<StatusPillProps> = ({
  status,
  size = 'md',
  pulse = false,
  className = '',
}) => {
  const normalizedKey = typeof status === 'string' ? status.trim() : '';
  const config =
    statusMap[normalizedKey] ||
    statusMap[normalizedKey.toUpperCase()] || {
      label: status,
      bg: 'bg-slate-100',
      text: 'text-slate-700',
      border: 'border-slate-200',
      dot: 'bg-slate-400',
    };

  const shouldPulse = pulse || config.pulseDot;

  const sizeClasses =
    size === 'sm'
      ? 'px-2 py-0.5 text-[11px] gap-1.5'
      : 'px-2.5 py-1 text-xs gap-2';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border tracking-wide transition-colors ${config.bg} ${config.text} ${config.border} ${sizeClasses} ${className}`}
    >
      <span className="relative flex h-2 w-2 items-center justify-center shrink-0">
        {shouldPulse && (
          <span
            className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${config.dot}`}
          />
        )}
        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${config.dot}`} />
      </span>
      <span>{config.label}</span>
    </span>
  );
};

export default StatusPill;
