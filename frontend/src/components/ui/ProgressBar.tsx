import React from 'react';

interface ProgressBarProps {
  percentage: number;
  color?: string; // Tailwind color class suffix, e.g., 'green-500'
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ percentage, color = 'green-500' }) => {
  const clamped = Math.min(100, Math.max(0, percentage));
  return (
    <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
      <div
        className={`h-2.5 ${color} transition-all duration-500`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
};
