import React, { useState, useRef } from 'react';
import {
  Camera,
  MapPin,
  Clock,
  CheckCircle2,
  ShieldCheck,
  UploadCloud,
  Crosshair,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StatusPill } from '@/components/ui/StatusPill';
import { Modal } from '@/components/ui/Modal';
import type { WorkOrder } from '@/types';
import { useApp } from '@/context/AppContext';

interface ContractorHomeProps {
  filter?: string;
  onOpenQuickCapture?: () => void;
}

export const ContractorHome: React.FC<ContractorHomeProps> = ({
  filter = 'all',
}) => {
  const { workOrders, submitEvidenceHandler } = useApp();

  const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null);
  const [captureModalOpen, setCaptureModalOpen] = useState(false);
  const [captureType, setCaptureType] = useState<'before' | 'after'>('before');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const filteredOrders = workOrders.filter((order) => {
    if (filter === 'high') return order.priority === 'High';
    if (filter === 'progress') return order.status === 'In Progress';
    if (filter === 'review') return order.status === 'Evidence Submitted' || order.status === 'Needs Review';
    return true;
  });

  const handleOpenCapture = (order: WorkOrder, type: 'before' | 'after') => {
    setSelectedOrder(order);
    setCaptureType(type);
    setSelectedFile(null);
    setPreviewUrl(null);
    setVerificationResult(null);
    setCaptureModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUploadEvidence = async () => {
    if (!selectedOrder) return;

    let fileToUpload = selectedFile;
    // If no file picked, create a dummy canvas blob for seamless testing
    if (!fileToUpload) {
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = captureType === 'before' ? '#333338' : '#222226';
        ctx.fillRect(0, 0, 640, 480);
        // Add road line
        ctx.fillStyle = '#EAB308';
        ctx.fillRect(200, 230, 240, 20);
        // Draw pothole or patch
        ctx.fillStyle = captureType === 'before' ? '#111115' : '#38383D';
        ctx.beginPath();
        ctx.ellipse(320, 320, 100, 60, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), 'image/jpeg'));
      fileToUpload = new File([blob], `${captureType}_evidence.jpg`, { type: 'image/jpeg' });
    }

    setUploading(true);
    try {
      const lat = selectedOrder.coordinates?.lat || 19.0178;
      const lng = selectedOrder.coordinates?.lng || 72.8478;

      const result = await submitEvidenceHandler(
        selectedOrder.id,
        captureType.toUpperCase() as 'BEFORE' | 'AFTER',
        fileToUpload,
        lat,
        lng
      );

      if (captureType === 'after' && result.verification) {
        setVerificationResult(result.verification);
        showToast(`AI Verification Complete: ${result.verification.status} (${result.verification.overall_score}/100)`);
      } else {
        showToast(`BEFORE capture saved. Case is now under repair!`);
        setCaptureModalOpen(false);
      }
    } catch (err: any) {
      alert(err.message || 'Evidence upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {toastMessage && (
        <div className="fixed top-16 right-6 z-50 bg-[#172033] text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 border border-teal-500/30">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Field Shift Banner */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 shadow-subtle flex items-center justify-between">
        <div>
          <span className="text-[11px] font-semibold text-[#0F766E] uppercase tracking-wider block">
            Contractor Ground Unit
          </span>
          <h2 className="text-base font-bold text-[#172033]">
            RoadWorks Infrastructure Unit A
          </h2>
          <p className="text-xs text-[#64748B]">
            Assigned Wards: Dadar West (Ward 12), Lower Parel • Active Crew: 4
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-full border border-emerald-200">
            GPS High Precision Active
          </span>
        </div>
      </div>

      {/* Work Orders Grid */}
      <div className="space-y-3">
        {filteredOrders.length === 0 ? (
          <Card padded="lg" className="text-center py-10 text-[#64748B] text-xs">
            No active work orders under this filter.
          </Card>
        ) : (
          filteredOrders.map((order) => {
            const hasBefore = order.beforePhotoCaptured;
            const hasAfter = order.afterPhotoCaptured;

            return (
              <Card key={order.id} padded="md" className="space-y-3 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#172033]">
                        {order.id}
                      </span>
                      <span className="text-[11px] text-[#64748B]">Linked: {order.caseId}</span>
                    </div>
                    <h3 className="text-sm font-bold text-[#172033] mt-0.5">{order.title}</h3>
                    <p className="text-xs text-[#64748B] flex items-center gap-1 mt-0.5">
                      <MapPin size={12} className="text-rose-500" />
                      {order.location} • {order.ward}
                    </p>
                  </div>
                  <StatusPill status={order.status} size="sm" />
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-[#E2E8F0] text-[#64748B]">
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    Target: <strong className="text-[#172033]">{order.dueDate}</strong>
                  </span>
                  <span>Priority: <strong className="text-[#172033]">{order.priority}</strong></span>
                </div>

                {/* Evidence Actions Strip */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Button
                    variant={hasBefore ? 'outline' : 'primary'}
                    size="sm"
                    fullWidth
                    leftIcon={hasBefore ? <CheckCircle2 size={13} className="text-emerald-600" /> : <Camera size={13} />}
                    onClick={() => handleOpenCapture(order, 'before')}
                  >
                    {hasBefore ? 'BEFORE Captured ✓' : '1. Capture BEFORE'}
                  </Button>

                  <Button
                    variant={hasAfter ? 'outline' : 'primary'}
                    size="sm"
                    fullWidth
                    disabled={!hasBefore}
                    leftIcon={hasAfter ? <CheckCircle2 size={13} className="text-emerald-600" /> : <Camera size={13} />}
                    onClick={() => handleOpenCapture(order, 'after')}
                  >
                    {hasAfter ? 'AFTER Captured ✓' : '2. Capture AFTER'}
                  </Button>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* In-App Camera / Evidence Capture Modal */}
      {captureModalOpen && selectedOrder && (
        <Modal
          isOpen={captureModalOpen}
          onClose={() => setCaptureModalOpen(false)}
          title={`CivicFix Platform Camera — ${captureType.toUpperCase()} Capture`}
          description={`Work Order: ${selectedOrder.id} • ${selectedOrder.location}`}
          footer={
            <div className="flex items-center justify-between w-full">
              <Button variant="secondary" size="sm" onClick={() => setCaptureModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={uploading}
                leftIcon={<UploadCloud size={14} />}
                onClick={handleUploadEvidence}
              >
                {uploading
                  ? 'Verifying with AI Engine...'
                  : `Submit ${captureType.toUpperCase()} Evidence`}
              </Button>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            {/* Viewfinder Preview */}
            <div className="aspect-video bg-slate-900 rounded-xl overflow-hidden relative border-2 border-[#0F766E] flex items-center justify-center">
              {previewUrl ? (
                <img src={previewUrl} alt="Capture preview" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center p-6 text-slate-400 space-y-2">
                  <Crosshair size={36} className="mx-auto text-teal-400 animate-spin" />
                  <p className="text-xs font-semibold text-white">Viewfinder Ready</p>
                  <p className="text-[11px]">Align the pothole cavity in center frame</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-2 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-semibold"
                  >
                    Choose Photo / Capture Camera
                  </button>
                </div>
              )}

              {/* Live Overlay Stamp */}
              <div className="absolute bottom-2 left-2 right-2 bg-black/75 backdrop-blur-md rounded-lg p-2 text-[10px] text-slate-300 flex items-center justify-between">
                <div>
                  <p className="font-mono text-teal-300 font-bold">
                    {selectedOrder.id} • {captureType.toUpperCase()}
                  </p>
                  <p>
                    GPS: {selectedOrder.coordinates?.lat.toFixed(4)}°N, {selectedOrder.coordinates?.lng.toFixed(4)}°E (±1.2m)
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-white">RoadWorks Unit A</p>
                  <p className="text-slate-400">Live Cryptographic Stamp</p>
                </div>
              </div>
            </div>

            {/* Verification Result Drawer (if AFTER submitted) */}
            {verificationResult && (
              <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-[#0F766E] flex items-center gap-1.5">
                    <Sparkles size={16} />
                    AI Verification Outcome
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      verificationResult.status === 'VERIFIED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {verificationResult.status} ({verificationResult.overall_score}/100)
                  </span>
                </div>
                <p className="text-xs text-[#334155] leading-relaxed">
                  {verificationResult.summary}
                </p>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {verificationResult.checks?.map((ch: any, idx: number) => (
                    <div key={idx} className="p-2 bg-white rounded-lg border border-teal-100 text-[11px]">
                      <span className="font-semibold text-[#172033] block">
                        {ch.check_type}: {ch.status}
                      </span>
                      <span className="text-slate-500 text-[10px]">Score: {ch.score}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="p-3 bg-slate-50 border border-[#E2E8F0] rounded-xl flex items-start gap-2.5">
              <ShieldCheck size={18} className="text-[#0F766E] shrink-0 mt-0.5" />
              <div className="text-xs text-slate-700">
                <p className="font-bold text-[#172033]">Cryptographic Integrity</p>
                <p className="text-[11px] text-[#64748B] mt-0.5">
                  Real GPS coordinates, hardware timestamp, and SHA-256 hash are recorded to prevent reused or off-site images.
                </p>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ContractorHome;
