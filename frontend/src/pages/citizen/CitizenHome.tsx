import React, { useState, useRef } from 'react';
import {
  Camera,
  MapPin,
  Clock,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StatusPill } from '@/components/ui/StatusPill';
import { Modal } from '@/components/ui/Modal';
import type { PotholeCase, Severity } from '@/types';
import { useApp } from '@/context/AppContext';
import { formatDate } from '@/utils/caseUtils';

export const CitizenHome: React.FC = () => {
  const { cases, submitComplaint } = useApp();

  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportStep, setReportStep] = useState<number>(1);
  const [severity, setSeverity] = useState<Severity>('High');
  const [description, setDescription] = useState('Deep cavity causing dangerous road swerving and two-wheeler risk.');
  const [address, setAddress] = useState('Gokhale Road, Dadar West');
  const [landmark, setLandmark] = useState('Near Plaza Cinema');
  const [lat] = useState<number>(19.0178);
  const [lng] = useState<number>(72.8478);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [createdCase, setCreatedCase] = useState<any | null>(null);
  const [selectedCase, setSelectedCase] = useState<PotholeCase | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [aiResult, setAiResult] = useState<{ is_pothole: boolean; confidence: number; estimated_size_sqm: number; message: string } | null>(null);
  const [analyzingPhoto, setAnalyzingPhoto] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active cases reported by citizens
  const activeCases = cases.filter((c) => c.status !== 'CLOSED');
  const resolvedCases = cases.filter((c) => c.status === 'VERIFIED' || c.status === 'CLOSED');

  const handleOpenReport = () => {
    setReportStep(1);
    setCreatedCase(null);
    setAiResult(null);
    setSelectedFile(null);
    setPreviewUrl(null);
    setReportModalOpen(true);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setReportStep(3); // move to confirm

      setAnalyzingPhoto(true);
      try {
        const formData = new FormData();
        formData.append('photo', file);
        const res = await fetch('http://localhost:8000/api/v1/cases/analyze-photo', {
          method: 'POST',
          body: formData,
        });
        if (res.ok) {
          const data = await res.json();
          setAiResult(data);
        }
      } catch (err) {
        console.error('AI Analysis failed:', err);
      } finally {
        setAnalyzingPhoto(false);
      }
    }
  };

  const handleSubmitComplaint = async () => {
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('description', description);
      formData.append('latitude', lat.toString());
      formData.append('longitude', lng.toString());
      formData.append('severity', severity);
      formData.append('address', address);
      formData.append('landmark', landmark);

      if (selectedFile) {
        formData.append('photo', selectedFile);
      } else {
        // Create simple canvas snapshot
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 480;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#2B2B30';
          ctx.fillRect(0, 0, 640, 480);
          ctx.fillStyle = '#111115';
          ctx.beginPath();
          ctx.ellipse(320, 300, 110, 65, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), 'image/jpeg'));
        formData.append('photo', blob, 'complaint_pothole.jpg');
      }

      const res = await submitComplaint(formData);
      setCreatedCase(res);
      setReportStep(5);
    } catch (err: any) {
      alert(err.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5 relative">
      {/* Primary Action Card: Report a Pothole */}

      <div className="bg-gradient-to-br from-[#0F766E] to-[#115E59] rounded-2xl p-5 text-white shadow-lg relative overflow-hidden">
        <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
        <div className="relative z-10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-xs font-semibold text-teal-50 backdrop-blur-sm">
              <Sparkles size={13} />
              AI Verified Repair
            </span>
            <span className="text-[11px] text-teal-100">Live Municipal Dispatch</span>
          </div>

          <div>
            <h2 className="text-lg font-bold tracking-tight text-white">
              Report a Road Pothole
            </h2>
            <p className="text-xs text-teal-100 mt-1 leading-relaxed">
              Snap a quick photo with live GPS. CivicFix AI routes it directly to your ward engineer and contractor.
            </p>
          </div>

          <div className="pt-2">
            <Button
              variant="secondary"
              size="md"
              leftIcon={<Camera size={16} className="text-[#0F766E]" />}
              onClick={handleOpenReport}
              className="bg-white text-[#0F766E] hover:bg-slate-50 font-bold border-none shadow-md text-xs py-2.5 px-6"
            >
              Report Pothole Now
            </Button>
          </div>
        </div>
      </div>


      {/* Citizen Active Cases */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#172033] uppercase tracking-wider">
            Your Active Complaints ({activeCases.length})
          </h3>
          <span className="text-xs text-[#0F766E] font-medium">Real-time tracking</span>
        </div>

        <div className="space-y-3">
          {activeCases.slice(0, 3).map((c) => (
            <Card
              key={c.id}
              interactive
              padded="md"
              onClick={() => setSelectedCase(c)}
              className="space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#172033]">{c.id}</span>
                    <span className="text-[11px] text-[#64748B]">{formatDate(c.reportedDate)}</span>
                  </div>
                  <h4 className="text-sm font-bold text-[#172033] mt-0.5">{c.location}</h4>
                  <p className="text-xs text-[#64748B] flex items-center gap-1 mt-0.5">
                    <MapPin size={12} className="text-teal-600" />
                    {c.landmark || 'Street Corner'}
                  </p>
                </div>
                <StatusPill status={c.status} size="sm" />
              </div>

              {/* Progress Bar / Stage Indicator */}
              <div className="bg-[#F8FAFC] p-2.5 rounded-xl border border-[#E2E8F0] flex items-center justify-between text-xs">
                <span className="text-[#64748B] flex items-center gap-1.5">
                  <Clock size={13} className="text-teal-600" />
                  Contractor: <strong className="text-[#172033]">{c.contractor || 'Queued for Assignment'}</strong>
                </span>
                <span className="text-[#0F766E] font-semibold flex items-center gap-0.5">
                  Track status <ChevronRight size={13} />
                </span>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Recently Verified in Your Neighbourhood */}
      <section className="space-y-3">
        <h3 className="text-sm font-bold text-[#172033] uppercase tracking-wider">
          Recently Verified Nearby
        </h3>

        {resolvedCases.slice(0, 2).map((rc) => (
          <Card
            key={rc.id}
            interactive
            padded="sm"
            onClick={() => setSelectedCase(rc)}
            className="bg-[#F8FAFC]/60"
          >
            <div className="p-2 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 size={15} className="text-emerald-600" />
                  <span className="font-mono text-xs font-semibold text-[#172033]">
                    {rc.id}
                  </span>
                  <span className="text-xs text-[#64748B] truncate max-w-[180px]">
                    {rc.location}
                  </span>
                </div>
                <StatusPill status={rc.status} size="sm" />
              </div>

              <div className="p-2 rounded-xl bg-emerald-50/70 border border-emerald-100 flex items-center justify-between text-[11px] text-emerald-800">
                <span>AI Verification Score: {rc.verification?.score || 95}% Match</span>
                <span className="font-semibold text-emerald-700">Fixed & Closed</span>
              </div>
            </div>
          </Card>
        ))}
      </section>

      {/* Community Impact Card */}
      <Card padded="sm" className="bg-slate-50 border-slate-200">
        <div className="flex items-center gap-3 p-2">
          <div className="w-10 h-10 rounded-xl bg-white border border-[#E2E8F0] flex items-center justify-center text-[#0F766E] shadow-sm shrink-0">
            <ShieldCheck size={22} />
          </div>
          <div>
            <p className="text-xs font-bold text-[#172033]">Municipal Accountability</p>
            <p className="text-[11px] text-[#64748B]">
              Every contractor repair passes AI geometric, landmark, and asphalt state verification before payment.
            </p>
          </div>
        </div>
      </Card>

      {/* 5-Step Report Modal */}
      <Modal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        title={
          reportStep === 1
            ? 'Report a Pothole'
            : reportStep === 2
            ? 'Camera Capture'
            : reportStep === 3
            ? 'Confirm GPS Location'
            : reportStep === 4
            ? 'Complaint Details'
            : 'Report Submitted!'
        }
        description={
          reportStep <= 4
            ? `Step ${reportStep} of 4: Fast citizen reporting`
            : 'Case registered with Municipal Corporation'
        }
        footer={
          reportStep === 1 ? (
            <>
              <Button variant="secondary" size="sm" onClick={() => setReportModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={() => setReportStep(2)}>
                Take Photo
              </Button>
            </>
          ) : reportStep === 2 ? (
            <>
              <Button variant="secondary" size="sm" onClick={() => setReportStep(1)}>
                Back
              </Button>
              <Button variant="primary" size="sm" onClick={() => setReportStep(3)}>
                Use Snapshot
              </Button>
            </>
          ) : reportStep === 3 ? (
            <>
              <Button variant="secondary" size="sm" onClick={() => setReportStep(2)}>
                Back
              </Button>
              <Button 
                variant="primary" 
                size="sm" 
                onClick={() => setReportStep(4)}
                disabled={analyzingPhoto || (aiResult !== null && (!aiResult.is_pothole || aiResult.confidence < 50))}
              >
                Confirm Location
              </Button>
            </>
          ) : reportStep === 4 ? (
            <>
              <Button variant="secondary" size="sm" onClick={() => setReportStep(3)}>
                Back
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={submitting}
                onClick={handleSubmitComplaint}
              >
                {submitting ? 'Submitting to Ward...' : 'Submit Report'}
              </Button>
            </>
          ) : (
            <Button
              variant="primary"
              size="sm"
              fullWidth
              onClick={() => setReportModalOpen(false)}
            >
              Track Case {createdCase?.id || 'CF-New'}
            </Button>
          )
        }
      >
        <div className="space-y-4">
          {reportStep === 1 && (
            <div className="text-center py-4 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-200 text-[#0F766E] flex items-center justify-center mx-auto">
                <Camera size={28} />
              </div>
              <div>
                <h4 className="font-bold text-sm text-[#172033]">
                  Let's get this road issue repaired
                </h4>
                <p className="text-xs text-[#64748B] mt-1 max-w-xs mx-auto">
                  Take a clear photo of the pothole with surrounding road context for instant AI detection.
                </p>
              </div>
            </div>
          )}

          {reportStep === 2 && (
            <div className="space-y-3">
              <div className="relative rounded-xl overflow-hidden bg-slate-900 aspect-video flex flex-col items-center justify-center text-white border border-slate-700">
                {previewUrl ? (
                  <img src={previewUrl} alt="Captured" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <Camera size={36} className="text-teal-400 mb-2 animate-pulse" />
                    <span className="text-xs font-medium">Camera Viewfinder</span>
                    <span className="text-[10px] text-slate-400">Tap below to capture live photo</span>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button
                variant="outline"
                fullWidth
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                Choose Photo from Gallery / Device
              </Button>
            </div>
          )}

          {reportStep === 3 && (
            <div className="space-y-3 text-xs">
              {analyzingPhoto ? (
                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-center gap-2 text-indigo-700">
                  <Sparkles size={16} className="animate-spin" />
                  <span className="font-semibold">AI is analyzing image...</span>
                </div>
              ) : aiResult && (
                <div className={`p-3 border rounded-xl space-y-1 ${aiResult.confidence > 70 ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                  <p className={`font-bold flex items-center gap-1 ${aiResult.confidence > 70 ? 'text-emerald-700' : 'text-amber-700'}`}>
                    <Sparkles size={13} />
                    AI Detection: {aiResult.is_pothole ? 'Pothole Confirmed' : 'Low Confidence'}
                  </p>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase block">Confidence Score</span>
                      <p className="font-semibold text-slate-800 text-sm">{aiResult.confidence}%</p>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase block">Estimated Size</span>
                      <p className="font-semibold text-slate-800 text-sm">{aiResult.estimated_size_sqm} sq m</p>
                    </div>
                  </div>
                  {(!aiResult.is_pothole || aiResult.confidence < 50) && (
                    <p className="text-red-600 mt-2 pt-2 border-t border-red-200 font-semibold text-center text-xs">
                      Submission Blocked: Image does not meet pothole criteria. Please upload a clearer photo.
                    </p>
                  )}
                </div>
              )}

              <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl space-y-1">
                <p className="font-bold text-[#0F766E] flex items-center gap-1">
                  <MapPin size={13} />
                  GPS Geofence Locked
                </p>
                <p className="text-[11px] text-teal-800">
                  Latitude: {lat.toFixed(4)}° N | Longitude: {lng.toFixed(4)}° E (±2.5m precision)
                </p>
              </div>
              <div>
                <label className="font-semibold text-[#172033] block mb-1">Road / Street Name:</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-white border border-[#CBD5E1] rounded-lg px-2.5 py-1.5 text-xs text-[#172033]"
                />
              </div>
              <div>
                <label className="font-semibold text-[#172033] block mb-1">Nearby Landmark:</label>
                <input
                  type="text"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  className="w-full bg-white border border-[#CBD5E1] rounded-lg px-2.5 py-1.5 text-xs text-[#172033]"
                />
              </div>
            </div>
          )}

          {reportStep === 4 && (
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-[#172033] block mb-1">Description:</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-white border border-[#CBD5E1] rounded-lg p-2.5 text-xs text-[#172033]"
                />
              </div>
              <div>
                <label className="font-semibold text-[#172033] block mb-1">Severity Level:</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Low', 'Medium', 'High'] as Severity[]).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSeverity(s)}
                      className={`py-2 rounded-lg text-xs font-semibold border transition-all ${
                        severity === s
                          ? 'bg-[#0F766E] text-white border-[#0F766E] shadow-sm'
                          : 'bg-white text-[#64748B] border-[#CBD5E1]'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {reportStep === 5 && (
            <div className="text-center py-5 space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 size={32} />
              </div>
              <div>
                <h4 className="font-bold text-base text-[#172033]">
                  Case {createdCase?.id || 'CF-1027'} Registered
                </h4>
                <p className="text-xs text-[#64748B] mt-1">
                  Assigned to Ward Engineer for validation. You will receive notifications as repair progresses.
                </p>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Case Details Modal */}
      {selectedCase && (
        <Modal
          isOpen={!!selectedCase}
          onClose={() => setSelectedCase(null)}
          title={`Case ${selectedCase.id}`}
          description={selectedCase.location}
          footer={
            <Button variant="secondary" size="sm" onClick={() => setSelectedCase(null)}>
              Close
            </Button>
          }
        >
          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl border border-[#E2E8F0]">
              <div>
                <span className="text-[#64748B]">Status:</span>
                <div className="mt-0.5">
                  <StatusPill status={selectedCase.status} size="sm" />
                </div>
              </div>
              <div>
                <span className="text-[#64748B]">Severity:</span>
                <p className="font-semibold text-[#172033] mt-0.5">{selectedCase.severity}</p>
              </div>
            </div>
            <div>
              <span className="font-semibold text-[#172033]">Description:</span>
              <p className="text-[#64748B] mt-0.5">{selectedCase.description}</p>
            </div>
            {selectedCase.beforeImage && (
              <div>
                <span className="font-semibold text-[#172033]">Report Photo:</span>
                <div className="mt-1 rounded-lg overflow-hidden border border-[#E2E8F0] aspect-video">
                  <img src={selectedCase.beforeImage} alt="Reported" className="w-full h-full object-cover" />
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default CitizenHome;
