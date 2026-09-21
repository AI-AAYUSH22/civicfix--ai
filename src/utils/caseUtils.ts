import type { PotholeCase, CaseStatus, Severity, DashboardStats } from '@/types';

export function computeStats(cases: PotholeCase[]): DashboardStats {
  return {
    totalActive: cases.filter((c) => c.status !== 'Resolved' && c.status !== 'Closed' && c.status !== 'CLOSED').length,
    pendingVerification: cases.filter((c) => c.status === 'AI Verification' || c.status === 'VERIFICATION').length,
    underRepair: cases.filter((c) => c.status === 'Under Repair' || c.status === 'REPAIRING').length,
    resolvedThisMonth: cases.filter((c) => c.status === 'Resolved' || c.status === 'Verified' || c.status === 'VERIFIED' || c.status === 'CLOSED').length,
  };
}

const defaultStatusStyle = { bg: 'bg-slate-100', text: 'text-slate-700', dot: 'bg-slate-500' };

export const statusStyles: Record<string, { bg: string; text: string; dot: string }> = {
  Reported: { bg: 'bg-slate-100', text: 'text-slate-700', dot: 'bg-slate-400' },
  REPORTED: { bg: 'bg-slate-100', text: 'text-slate-700', dot: 'bg-slate-400' },
  Validated: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  VALIDATED: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  Assigned: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  ASSIGNED: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  'Under Repair': { bg: 'bg-teal-50', text: 'text-teal-700', dot: 'bg-teal-600' },
  REPAIRING: { bg: 'bg-teal-50', text: 'text-teal-700', dot: 'bg-teal-600' },
  'AI Verification': { bg: 'bg-teal-50', text: 'text-teal-700', dot: 'bg-teal-600' },
  VERIFICATION: { bg: 'bg-teal-50', text: 'text-teal-700', dot: 'bg-teal-600' },
  'Needs Review': { bg: 'bg-amber-50', text: 'text-amber-800', dot: 'bg-amber-500' },
  'NEEDS REVIEW': { bg: 'bg-amber-50', text: 'text-amber-800', dot: 'bg-amber-500' },
  'Not Verified': { bg: 'bg-rose-50', text: 'text-rose-700', dot: 'bg-rose-600' },
  'NOT VERIFIED': { bg: 'bg-rose-50', text: 'text-rose-700', dot: 'bg-rose-600' },
  Verified: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-600' },
  VERIFIED: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-600' },
  Resolved: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-600' },
  Closed: { bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' },
  CLOSED: { bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' },
};

export function getStatusStyle(status: string) {
  return statusStyles[status] || defaultStatusStyle;
}

export const severityStyles: Record<Severity, { text: string; bg: string }> = {
  Low: { text: 'text-navy-400', bg: 'bg-navy-50' },
  Medium: { text: 'text-amber-600', bg: 'bg-amber-50' },
  High: { text: 'text-crit-600', bg: 'bg-crit-50' },
};

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function markerColor(status: CaseStatus): string {
  switch (status) {
    case 'Reported':
    case 'REPORTED':
      return '#DC2626';
    case 'Under Repair':
    case 'REPAIRING':
    case 'Assigned':
    case 'ASSIGNED':
      return '#D97706';
    case 'AI Verification':
    case 'VERIFICATION':
      return '#0F766E';
    case 'Verified':
    case 'VERIFIED':
    case 'Resolved':
    case 'CLOSED':
    case 'Closed':
      return '#16A34A';
    default:
      return '#172033';
  }
}
