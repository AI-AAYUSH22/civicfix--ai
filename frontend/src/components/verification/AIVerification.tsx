import React from 'react';
import { ProgressBar } from '@/components/ui/ProgressBar';
import type { RepairVerification } from '@/types';
import { CheckCircle2, XCircle } from 'lucide-react';

interface AIVerificationProps {
  verification: RepairVerification;
}

export const AIVerification: React.FC<AIVerificationProps> = ({ verification }) => {
  const { status, score, checks } = verification;
  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6 bg-white rounded-xl shadow">
      <h2 className="text-xl font-semibold text-[#172033]">AI Verification</h2>
      <div className="flex items-center gap-2 text-sm">
        <span className="font-medium">Overall Status:</span>
        <span className={`px-2 py-0.5 rounded ${status === 'Verified' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
          {status.toUpperCase()}
        </span>
      </div>
      {typeof score === 'number' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Verification Score</span>
            <span>{score}%</span>
          </div>
          <ProgressBar percentage={score} />
        </div>
      )}
      <div className="space-y-3">
        {checks.map((c) => (
          <div key={c.label} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1">
              {c.passed ? (
                <CheckCircle2 size={14} className="text-emerald-600" />
              ) : (
                <XCircle size={14} className="text-rose-600" />
              )}
              <span>{c.label}</span>
            </div>
            <span className="text-gray-500">{c.detail}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
