import React from 'react';

export type Status = 'REPORTED' | 'VALIDATED' | 'ASSIGNED' | 'REPAIRING' | 'VERIFICATION' | 'VERIFIED' | 'NEEDS REVIEW' | 'NOT VERIFIED' | 'CLOSED';

interface StatusPillProps {
  status: Status;
}

const statusColors: Record<Status, string> = {
  REPORTED: 'bg-gray-100 text-gray-800',
  VALIDATED: 'bg-blue-100 text-blue-800',
  ASSIGNED: 'bg-indigo-100 text-indigo-800',
  REPAIRING: 'bg-yellow-100 text-yellow-800',
  VERIFICATION: 'bg-purple-100 text-purple-800',
  VERIFIED: 'bg-green-100 text-green-800',
  'NEEDS REVIEW': 'bg-orange-100 text-orange-800',
  'NOT VERIFIED': 'bg-red-100 text-red-800',
  CLOSED: 'bg-gray-200 text-gray-600',
};

export const StatusPill: React.FC<StatusPillProps> = ({ status }) => {
  const classes = `inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[status]}`;
  return <span className={classes}>{status}</span>;
};
