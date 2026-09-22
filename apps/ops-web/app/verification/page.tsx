"use client";

import { useEffect, useState } from "react";
import { getCases, reviewVerification } from "@/lib/api";
import type { ApiCase } from "@/lib/types";

export default function VerificationPage() {
  const [cases, setCases] = useState<ApiCase[]>([]);
  const [processing, setProcessing] = useState<string | null>(null);
  const [reworkNotes, setReworkNotes] = useState("");
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const data = await getCases({ status: "NEEDS_REVIEW" });
      setCases(data);
    } catch (err) {
      console.error(err);
    }
  }

  const handleReview = async (workOrderId: string, decision: 'APPROVE' | 'REJECT') => {
    if (!workOrderId) return;
    setProcessing(workOrderId);
    try {
      await reviewVerification(workOrderId, decision, decision === 'REJECT' ? reworkNotes : undefined);
      setRejectingId(null);
      setReworkNotes("");
      load();
    } catch (err) {
      console.error(err);
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">AI Verification Review</h1>
      
      {cases.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center text-slate-500">
          No cases pending review.
        </div>
      ) : (
        <div className="space-y-6">
          {cases.map(c => {
            const wo = c.work_order;
            if (!wo) return null;
            return (
              <div key={c.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                  <div>
                    <h2 className="font-semibold text-slate-800">Case #{c.id.substring(0, 8)}</h2>
                    <p className="text-sm text-slate-500">{c.location?.address} • {wo.contractor_name}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setRejectingId(wo.id)}
                      disabled={processing === wo.id}
                      className="px-4 py-2 text-sm font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100"
                    >
                      Reject (Rework)
                    </button>
                    <button
                      onClick={() => handleReview(wo.id, 'APPROVE')}
                      disabled={processing === wo.id}
                      className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700"
                    >
                      {processing === wo.id ? 'Processing...' : 'Approve'}
                    </button>
                  </div>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-slate-700">Before Image</h3>
                    <div className="aspect-video bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center overflow-hidden">
                      {c.evidence_files?.find(f => f.capture_type === 'BEFORE') ? (
                        <img src={c.evidence_files.find(f => f.capture_type === 'BEFORE')?.storage_path} alt="Before" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-slate-400">No image</span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-slate-700">After Image</h3>
                    <div className="aspect-video bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center overflow-hidden">
                      {c.evidence_files?.find(f => f.capture_type === 'AFTER') ? (
                        <img src={c.evidence_files.find(f => f.capture_type === 'AFTER')?.storage_path} alt="After" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-slate-400">No image</span>
                      )}
                    </div>
                  </div>
                </div>

                {c.verification && (
                  <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
                    <h3 className="text-sm font-medium text-slate-700 mb-3">AI Verification Checks (Score: {c.verification.score})</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {c.verification.checks.map((chk, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          {chk.status === 'PASS' ? (
                            <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-[10px]">✓</span>
                          ) : (
                            <span className="w-4 h-4 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-[10px]">✕</span>
                          )}
                          <span className="text-slate-700 capitalize">{chk.check_type.replace('_', ' ')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {rejectingId && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-slate-200">
              <h3 className="font-semibold text-slate-800">Reject & Request Rework</h3>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Rework Notes</label>
                <textarea
                  value={reworkNotes}
                  onChange={e => setReworkNotes(e.target.value)}
                  className="w-full border-slate-300 rounded-lg shadow-sm text-sm"
                  rows={4}
                  placeholder="Explain what needs to be fixed..."
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setRejectingId(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleReview(rejectingId, 'REJECT')}
                  className="px-4 py-2 text-sm font-medium text-white bg-rose-600 rounded-lg hover:bg-rose-700"
                >
                  Confirm Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
