import React from 'react';
import { Check } from 'lucide-react';
import type { PotholeCase } from '@/types';

interface EvidenceSubmissionProps {
  caseData: PotholeCase;
  onSubmit?: () => void;
}

export const EvidenceSubmission: React.FC<EvidenceSubmissionProps> = ({ caseData, onSubmit }) => {
  const { beforeImage, afterImage } = caseData;
  const flags = [
    { label: 'Capture location', satisfied: !!caseData.coordinates },
    { label: 'Work order', satisfied: !!caseData.id },
    { label: 'Capture time', satisfied: !!caseData.reportedDate },
  ];

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <h2 className="text-xl font-semibold text-[#172033]">Evidence Submission</h2>
      {/* Image previews */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
          {beforeImage ? (
            <img src={beforeImage} alt="Before" className="object-cover w-full h-full" />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">No BEFORE image</div>
          )}
          <div className="absolute inset-0 flex items-center justify-center text-white text-sm font-medium bg-black bg-opacity-30">
            BEFORE
          </div>
        </div>
        <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
          {afterImage ? (
            <img src={afterImage} alt="After" className="object-cover w-full h-full" />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">No AFTER image</div>
          )}
          <div className="absolute inset-0 flex items-center justify-center text-white text-sm font-medium bg-black bg-opacity-30">
            AFTER
          </div>
        </div>
      </div>

      {/* Metadata flags */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-[#172033]">
        {flags.map((f) => (
          <div key={f.label} className="flex items-center gap-1">
            {f.satisfied ? <Check size={14} className="text-emerald-600" /> : <Check size={14} className="text-gray-400" />}
            <span>{f.label}</span>
          </div>
        ))}
      </div>

      {/* Submit button */}
      <div className="flex justify-end pt-2">
        <button
          onClick={onSubmit}
          className="px-4 py-2 bg-[#0F766E] text-white rounded-lg hover:bg-[#115E59] transition-colors"
        >
          Submit for verification
        </button>
      </div>
    </div>
  );
};
