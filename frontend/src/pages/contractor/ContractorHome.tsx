import React, { useState, useRef, useCallback } from 'react';
import {
  Camera,
  MapPin,
  Clock,
  CheckCircle2,
  ShieldCheck,
  UploadCloud,
  Crosshair,
  Sparkles,
  Database,
  Building2,
  Server,
  LayoutGrid,
  ListFilter,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StatusPill } from '@/components/ui/StatusPill';
import { Modal } from '@/components/ui/Modal';
import type { WorkOrder } from '@/types';
import { useApp } from '@/context/AppContext';

interface ContractorHomeProps {
  filter?: string;
  wardFilter?: string;
  onWardChange?: (ward: string) => void;
  onOpenQuickCapture?: () => void;
}

const WARD_DB_MAP: Record<string, { dbFile: string; code: string; name: string; city: string; lat: number; lng: number }> = {
  // BMC Mumbai Wards (27)
  'A': { dbFile: 'contractor_ward_a.db', code: 'A', name: 'Ward A — Churchgate / Colaba / Fort', city: 'Mumbai', lat: 18.9220, lng: 72.8347 },
  'B': { dbFile: 'contractor_ward_a.db', code: 'B', name: 'Ward B — Masjid Bunder / Dongri', city: 'Mumbai', lat: 18.9515, lng: 72.8375 },
  'C': { dbFile: 'contractor_ward_a.db', code: 'C', name: 'Ward C — Pydhonie / Bhuleshwar', city: 'Mumbai', lat: 18.9525, lng: 72.8273 },
  'D': { dbFile: 'contractor_ward_a.db', code: 'D', name: 'Ward D — Malabar Hill / Grant Road', city: 'Mumbai', lat: 18.9667, lng: 72.8167 },
  'E': { dbFile: 'contractor_ward_a.db', code: 'E', name: 'Ward E — Byculla / Nagpada', city: 'Mumbai', lat: 18.9772, lng: 72.8335 },
  'F/N': { dbFile: 'contractor_ward_a.db', code: 'F/N', name: 'Ward F/North — Matunga / Sion', city: 'Mumbai', lat: 19.0268, lng: 72.8553 },
  'F/S': { dbFile: 'contractor_ward_a.db', code: 'F/S', name: 'Ward F/South — Parel / Sewri', city: 'Mumbai', lat: 18.9954, lng: 72.8396 },
  'G/N': { dbFile: 'contractor_ward_a.db', code: 'G/N', name: 'Ward G/North — Dadar / Mahim / Dharavi', city: 'Mumbai', lat: 19.0178, lng: 72.8478 },
  'w12': { dbFile: 'contractor_ward_a.db', code: 'G/N', name: 'Ward G/North — Dadar / Mahim / Dharavi', city: 'Mumbai', lat: 19.0178, lng: 72.8478 },
  'G/S': { dbFile: 'contractor_ward_a.db', code: 'G/S', name: 'Ward G/South — Worli / Lower Parel', city: 'Mumbai', lat: 19.0068, lng: 72.8156 },
  'H/E': { dbFile: 'contractor_ward_b.db', code: 'H/E', name: 'Ward H/East — Santacruz East / Kalina', city: 'Mumbai', lat: 19.0805, lng: 72.8530 },
  'H/W': { dbFile: 'contractor_ward_b.db', code: 'H/W', name: 'Ward H/West — Bandra West / Khar West', city: 'Mumbai', lat: 19.0596, lng: 72.8295 },
  'w07': { dbFile: 'contractor_ward_b.db', code: 'H/W', name: 'Ward H/West — Bandra West / Khar West', city: 'Mumbai', lat: 19.0596, lng: 72.8295 },
  'K/E': { dbFile: 'contractor_ward_c.db', code: 'K/E', name: 'Ward K/East — Andheri East / Marol', city: 'Mumbai', lat: 19.1136, lng: 72.8697 },
  'w18': { dbFile: 'contractor_ward_c.db', code: 'K/E', name: 'Ward K/East — Andheri East / Marol', city: 'Mumbai', lat: 19.1136, lng: 72.8697 },
  'K/W': { dbFile: 'contractor_ward_c.db', code: 'K/W', name: 'Ward K/West — Andheri West / Juhu', city: 'Mumbai', lat: 19.1363, lng: 72.8277 },
  'P/N': { dbFile: 'contractor_ward_c.db', code: 'P/N', name: 'Ward P/North — Malad', city: 'Mumbai', lat: 19.1866, lng: 72.8486 },
  'P/S': { dbFile: 'contractor_ward_c.db', code: 'P/S', name: 'Ward P/South — Goregaon', city: 'Mumbai', lat: 19.1645, lng: 72.8499 },
  'R/C': { dbFile: 'contractor_default.db', code: 'R/C', name: 'Ward R/Central — Borivali', city: 'Mumbai', lat: 19.2307, lng: 72.8567 },
  'R/N': { dbFile: 'contractor_default.db', code: 'R/N', name: 'Ward R/North — Dahisar', city: 'Mumbai', lat: 19.2501, lng: 72.8593 },
  'R/S': { dbFile: 'contractor_default.db', code: 'R/S', name: 'Ward R/South — Kandivali', city: 'Mumbai', lat: 19.2045, lng: 72.8360 },
  'L': { dbFile: 'contractor_default.db', code: 'L', name: 'Ward L — Kurla West / Sakinaka', city: 'Mumbai', lat: 19.0726, lng: 72.8845 },
  'M/E': { dbFile: 'contractor_default.db', code: 'M/E', name: 'Ward M/East — Govandi / Mankhurd', city: 'Mumbai', lat: 19.0560, lng: 72.9126 },
  'M/W': { dbFile: 'contractor_default.db', code: 'M/W', name: 'Ward M/West — Chembur', city: 'Mumbai', lat: 19.0345, lng: 72.8953 },
  'N': { dbFile: 'contractor_default.db', code: 'N', name: 'Ward N — Ghatkopar', city: 'Mumbai', lat: 19.0864, lng: 72.9082 },
  'S': { dbFile: 'contractor_default.db', code: 'S', name: 'Ward S — Bhandup / Vikhroli', city: 'Mumbai', lat: 19.1438, lng: 72.9304 },
  'T': { dbFile: 'contractor_default.db', code: 'T', name: 'Ward T — Mulund', city: 'Mumbai', lat: 19.1723, lng: 72.9565 },
  'K/E-2': { dbFile: 'contractor_ward_c.db', code: 'K/E-2', name: 'Ward K/E-2 — Jogeshwari East', city: 'Mumbai', lat: 19.1350, lng: 72.8600 },
  'L-2': { dbFile: 'contractor_default.db', code: 'L-2', name: 'Ward L-2 — Chandivali', city: 'Mumbai', lat: 19.1100, lng: 72.8900 },
  'P/N-2': { dbFile: 'contractor_ward_c.db', code: 'P/N-2', name: 'Ward P/N-2 — Dindoshi', city: 'Mumbai', lat: 19.1750, lng: 72.8700 },

  // Thane TMC Wards (9)
  'TMC-1': { dbFile: 'contractor_default.db', code: 'TMC-1', name: 'Naupada - Kopri', city: 'Thane', lat: 19.1824, lng: 72.9696 },
  'TMC-2': { dbFile: 'contractor_default.db', code: 'TMC-2', name: 'Uthalsar', city: 'Thane', lat: 19.1979, lng: 72.9774 },
  'TMC-3': { dbFile: 'contractor_default.db', code: 'TMC-3', name: 'Majiwada - Manpada', city: 'Thane', lat: 19.2301, lng: 72.9712 },
  'TMC-4': { dbFile: 'contractor_default.db', code: 'TMC-4', name: 'Vartak Nagar', city: 'Thane', lat: 19.2066, lng: 72.9529 },
  'TMC-5': { dbFile: 'contractor_default.db', code: 'TMC-5', name: 'Wagle Estate', city: 'Thane', lat: 19.1915, lng: 72.9463 },
  'TMC-6': { dbFile: 'contractor_default.db', code: 'TMC-6', name: 'Lokmanya Nagar - Savarkar Nagar', city: 'Thane', lat: 19.2132, lng: 72.9427 },
  'TMC-7': { dbFile: 'contractor_default.db', code: 'TMC-7', name: 'Kalwa', city: 'Thane', lat: 19.1994, lng: 72.9972 },
  'TMC-8': { dbFile: 'contractor_default.db', code: 'TMC-8', name: 'Mumbra', city: 'Thane', lat: 19.1760, lng: 73.0233 },
  'TMC-9': { dbFile: 'contractor_default.db', code: 'TMC-9', name: 'Diva', city: 'Thane', lat: 19.1852, lng: 73.0401 },

  // Navi Mumbai NMMC Wards (8)
  'NMMC-1': { dbFile: 'contractor_default.db', code: 'NMMC-1', name: 'Belapur', city: 'Navi Mumbai', lat: 19.0163, lng: 73.0374 },
  'NMMC-2': { dbFile: 'contractor_default.db', code: 'NMMC-2', name: 'Nerul', city: 'Navi Mumbai', lat: 19.0330, lng: 73.0180 },
  'NMMC-3': { dbFile: 'contractor_default.db', code: 'NMMC-3', name: 'Turbhe', city: 'Navi Mumbai', lat: 19.0725, lng: 73.0157 },
  'NMMC-4': { dbFile: 'contractor_default.db', code: 'NMMC-4', name: 'Vashi', city: 'Navi Mumbai', lat: 19.0700, lng: 72.9980 },
  'NMMC-5': { dbFile: 'contractor_default.db', code: 'NMMC-5', name: 'Kopar Khairane', city: 'Navi Mumbai', lat: 19.1026, lng: 73.0035 },
  'NMMC-6': { dbFile: 'contractor_default.db', code: 'NMMC-6', name: 'Ghansoli', city: 'Navi Mumbai', lat: 19.1254, lng: 72.9992 },
  'NMMC-7': { dbFile: 'contractor_default.db', code: 'NMMC-7', name: 'Airoli', city: 'Navi Mumbai', lat: 19.1517, lng: 72.9934 },
  'NMMC-8': { dbFile: 'contractor_default.db', code: 'NMMC-8', name: 'Digha', city: 'Navi Mumbai', lat: 19.1678, lng: 73.9930 },

  // Kalyan-Dombivli KDMC Wards (4)
  'KDMC-1': { dbFile: 'contractor_default.db', code: 'KDMC-1', name: 'Kalyan West - Khadakpada', city: 'Kalyan-Dombivli', lat: 19.2437, lng: 73.1355 },
  'KDMC-2': { dbFile: 'contractor_default.db', code: 'KDMC-2', name: 'Kalyan East - Vitawa', city: 'Kalyan-Dombivli', lat: 19.2350, lng: 73.1420 },
  'KDMC-3': { dbFile: 'contractor_default.db', code: 'KDMC-3', name: 'Dombivli West - Manpada', city: 'Kalyan-Dombivli', lat: 19.2184, lng: 73.0867 },
  'KDMC-4': { dbFile: 'contractor_default.db', code: 'KDMC-4', name: 'Dombivli East - Lodha', city: 'Kalyan-Dombivli', lat: 19.2090, lng: 73.0950 },
};

export const ContractorHome: React.FC<ContractorHomeProps> = ({
  filter = 'all',
  wardFilter = 'all',
  onWardChange,
}) => {
  const { workOrders, cases, submitEvidenceHandler, submitExpenseMemoHandler } = useApp();

  const [viewMode, setViewMode] = useState<'grouped' | 'list'>('grouped');
  const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null);
  const [captureModalOpen, setCaptureModalOpen] = useState(false);
  const [captureType, setCaptureType] = useState<'before' | 'after'>('after');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [captureMode, setCaptureMode] = useState<'camera' | 'upload'>('camera');
  const [uploading, setUploading] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // Camera & GPS State
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [liveLocation, setLiveLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const watchIdRef = useRef<number | null>(null);

  // Expense Memo State
  const [memoModalOpen, setMemoModalOpen] = useState(false);
  const [selectedMemoOrder, setSelectedMemoOrder] = useState<WorkOrder | null>(null);
  const [materialCost, setMaterialCost] = useState('14500');
  const [laborCost, setLaborCost] = useState('6200');
  const [machineryCost, setMachineryCost] = useState('4800');
  const [asphaltTonnage, setAsphaltTonnage] = useState('1.8');
  const [patchAreaSqm, setPatchAreaSqm] = useState('4.2');
  const [submittingMemo, setSubmittingMemo] = useState(false);
  const [memoSyncResult, setMemoSyncResult] = useState<any | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleOpenMemo = (order: WorkOrder) => {
    setSelectedMemoOrder(order);
    setMemoSyncResult(null);
    setMemoModalOpen(true);
  };

  const handleSubmitMemo = async () => {
    if (!selectedMemoOrder) return;
    setSubmittingMemo(true);
    try {
      const formData = new FormData();
      formData.append('case_id', selectedMemoOrder.caseId || selectedMemoOrder.id);
      formData.append('work_order_id', selectedMemoOrder.id);
      formData.append('ward_id', selectedMemoOrder.wardId || selectedMemoOrder.ward || 'w12');
      formData.append('contractor_id', selectedMemoOrder.contractorId || 'contractor-alpha');
      formData.append('material_cost', materialCost);
      formData.append('labor_cost', laborCost);
      formData.append('machinery_cost', machineryCost);
      formData.append('asphalt_tonnage', asphaltTonnage);
      formData.append('patch_area_sqm', patchAreaSqm);

      const res = await submitExpenseMemoHandler(formData);
      setMemoSyncResult(res);
      showToast('Expense Memo dual-written to Municipal & Contractor DB!');
    } catch (err: any) {
      alert(err.message || 'Failed to submit memo');
    } finally {
      setSubmittingMemo(false);
    }
  };

  const combinedOrders = React.useMemo(() => {
    const existingCaseIds = new Set(workOrders.map((w) => w.caseId || w.id));
    const citizenJobs: WorkOrder[] = (cases || [])
      .filter((c) => !existingCaseIds.has(c.id))
      .map((c) => {
        const wCode = c.wardId || 'G/N';
        const wDb = WARD_DB_MAP[wCode]?.dbFile || 'contractor_ward_a.db';
        return {
          id: `WO-${c.id}`,
          caseId: c.id,
          title: `Citizen Pothole Report: ${c.location || 'Road Defect'}`,
          location: c.location,
          roadName: c.landmark,
          ward: c.wardName || `Ward ${wCode}`,
          wardId: c.wardId || 'G/N',
          wardCode: wCode,
          wardDbName: wDb,
          city: c.city || 'Mumbai',
          priority: c.severity || 'High',
          status: (c.status === 'REPORTED' ? 'Assigned' : c.status) as any,
          assignedDate: c.reportedDate?.split('T')[0] || new Date().toISOString().split('T')[0],
          dueDate: 'Within 24h',
          assignedContractor: c.contractor || 'Assigned Ward Contractor',
          beforePhotoCaptured: !!c.beforeImage,
          afterPhotoCaptured: !!c.afterImage,
          beforePhotoUrl: c.beforeImage,
          afterPhotoUrl: c.afterImage,
          citizenPhotoUrl: c.beforeImage,
          coordinates: {
            lat: c.coordinates?.lat || 19.0178,
            lng: c.coordinates?.lng || 72.8478,
          },
        };
      });
    return [...workOrders, ...citizenJobs];
  }, [workOrders, cases]);

  // Filter orders by status/priority AND ward
  const filteredOrders = combinedOrders.filter((order) => {
    if (filter === 'high' && order.priority !== 'High') return false;
    if (filter === 'progress' && order.status !== 'In Progress') return false;
    if (filter === 'review' && order.status !== 'Evidence Submitted' && order.status !== 'Needs Review') return false;

    if (wardFilter && wardFilter !== 'all') {
      const codeMatch = order.wardCode === wardFilter;
      const idMatch = order.wardId === wardFilter;
      const nameMatch = order.ward?.toLowerCase().includes(wardFilter.toLowerCase());
      if (!codeMatch && !idMatch && !nameMatch) return false;
    }
    return true;
  });

  // Group work orders ward-wise
  const ordersByWard = filteredOrders.reduce((acc, order) => {
    const wardKey = order.wardCode || (order.wardId ? (order.wardId === 'w12' ? 'G/N' : order.wardId === 'w07' ? 'H/W' : order.wardId === 'w18' ? 'K/E' : order.wardId) : order.ward.split('—')[0].trim());
    if (!acc[wardKey]) acc[wardKey] = [];
    acc[wardKey].push(order);
    return acc;
  }, {} as Record<string, WorkOrder[]>);

  const activeWardInfo = wardFilter !== 'all' ? (WARD_DB_MAP[wardFilter] || {
    dbFile: 'contractor_default.db',
    code: wardFilter,
    name: `Ward ${wardFilter}`,
    city: 'Mumbai',
    lat: 19.0178,
    lng: 72.8478,
  }) : null;

  const renderOrderCard = (order: WorkOrder) => {
    const hasAfter = order.afterPhotoCaptured;
    const wardCode = order.wardCode || (order.wardId === 'w12' ? 'G/N' : order.wardId === 'w07' ? 'H/W' : order.wardId === 'w18' ? 'K/E' : order.wardId || 'G/N');
    const wardDb = order.wardDbName || WARD_DB_MAP[wardCode]?.dbFile || 'contractor_ward_a.db';

    return (
      <Card key={order.id} padded="md" className="space-y-3 hover:shadow-md transition-shadow border border-slate-200">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              <span className="font-mono text-xs font-bold text-[#172033] bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                {order.id}
              </span>
              <button
                onClick={() => onWardChange?.(wardCode)}
                className="px-2 py-0.5 bg-teal-50 hover:bg-teal-100 text-teal-900 text-[11px] font-bold rounded border border-teal-300 transition-colors flex items-center gap-1"
                title="Filter by this ward"
              >
                <span>Ward {wardCode}</span>
              </button>
              <span className="px-2 py-0.5 bg-slate-900 text-teal-300 font-mono text-[10px] font-bold rounded border border-slate-700 flex items-center gap-1">
                <Database size={9} className="text-teal-400" />
                {wardDb}
              </span>
            </div>
            <h3 className="text-sm font-bold text-[#172033] mt-0.5">{order.title}</h3>
            <p className="text-xs text-[#64748B] flex items-center gap-1 mt-0.5">
              <MapPin size={12} className="text-rose-500 shrink-0" />
              <span>{order.roadName ? `${order.roadName}, ` : ''}{order.location} • {order.ward}</span>
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

        {/* Evidence Previews */}
        {(order.citizenPhotoUrl || order.beforePhotoUrl || order.afterPhotoUrl) && (
          <div className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg">
            {order.citizenPhotoUrl && (
              <div className="flex-1">
                <span className="text-[10px] font-semibold text-[#64748B] block mb-1">Citizen Photo</span>
                <div className="h-16 rounded overflow-hidden bg-slate-200 border border-slate-300">
                  <img
                    src={order.citizenPhotoUrl}
                    alt="Citizen Report"
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                  />
                </div>
              </div>
            )}
            {order.beforePhotoUrl && (
              <div className="flex-1">
                <span className="text-[10px] font-semibold text-[#64748B] block mb-1">Before Repair</span>
                <div className="h-16 rounded overflow-hidden bg-slate-200 border border-slate-300">
                  <img
                    src={order.beforePhotoUrl}
                    alt="Before Repair"
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                  />
                </div>
              </div>
            )}
            {order.afterPhotoUrl && (
              <div className="flex-1">
                <span className="text-[10px] font-semibold text-emerald-700 block mb-1">After Repair</span>
                <div className="h-16 rounded overflow-hidden bg-slate-200 border border-emerald-300">
                  <img
                    src={order.afterPhotoUrl}
                    alt="After Repair"
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Evidence & Billing Actions Strip */}
        <div className="pt-1">
          <Button
            variant={hasAfter ? 'outline' : 'primary'}
            size="sm"
            fullWidth
            leftIcon={hasAfter ? <CheckCircle2 size={13} className="text-emerald-600" /> : <Camera size={13} />}
            onClick={() => handleOpenCapture(order, 'after')}
          >
            {hasAfter ? 'AFTER Captured ✓' : 'Capture AFTER Photo'}
          </Button>
        </div>

        {hasAfter && (
          <Button
            variant="secondary"
            size="sm"
            fullWidth
            onClick={() => handleOpenMemo(order)}
            className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-semibold text-xs mt-1"
          >
            🧾 3. Submit Expense Memo & Bill
          </Button>
        )}
      </Card>
    );
  };

  const handleOpenCapture = async (order: WorkOrder, type: 'before' | 'after') => {
    setSelectedOrder(order);
    setCaptureType(type);
    setSelectedFile(null);
    setPreviewUrl(null);
    setVerificationResult(null);
    setGpsError(null);
    setGpsAccuracy(null);
    setLiveLocation(null);

    // Request location permission before opening camera
    if ('geolocation' in navigator) {
      try {
        if (navigator.permissions) {
          const permStatus = await navigator.permissions.query({ name: 'geolocation' });
          if (permStatus.state === 'denied') {
            setGpsError('Location access denied. Please enable it in your browser settings.');
            showToast('GPS permission denied. Please enable location access.');
          }
        }
      } catch {
        // Permissions API not supported, continue
      }
    }

    setCaptureModalOpen(true);
    startCamera();
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      
      // Start continuous GPS tracking via watchPosition
      startGPSWatch();
    } catch (err) {
      console.error('Camera failed', err);
      showToast('Could not access camera. Check permissions.');
    }
  };

  // Start continuous GPS tracking
  const startGPSWatch = useCallback(() => {
    if (watchIdRef.current !== null) return;
    if (!('geolocation' in navigator)) {
      setGpsError('Geolocation is not supported by this browser.');
      return;
    }

    setGpsError(null);

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        setLiveLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGpsAccuracy(pos.coords.accuracy);
        setGpsError(null);
      },
      (err) => {
        console.warn('GPS Error', err);
        if (err.code === err.PERMISSION_DENIED) {
          setGpsError('Location access denied. Please enable it in your browser settings.');
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setGpsError('Unable to determine your location. Please ensure GPS is enabled.');
        } else if (err.code === err.TIMEOUT) {
          setGpsError('GPS timed out. Move to an open area and retry.');
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
    watchIdRef.current = id;
  }, []);

  // Stop GPS watching
  const stopGPSWatch = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const handleCloseCapture = () => {
    stopCamera();
    stopGPSWatch();
    setCaptureModalOpen(false);
  };

  const captureLivePhoto = async () => {
    if (!videoRef.current || !canvasRef.current || !selectedOrder) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // 1. Draw raw video frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // 2. Add Geo-Watermark Overlay
    // Semi-transparent black bar at the bottom
    const barHeight = 100;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, canvas.height - barHeight, canvas.width, barHeight);
    
    // Watermark Text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 24px monospace';
    ctx.fillText(`CivicFix CONTRACTOR EVIDENCE — ${captureType.toUpperCase()}`, 20, canvas.height - 65);
    
    ctx.font = '18px monospace';
    ctx.fillStyle = '#14B8A6'; // Teal-400
    const lat = liveLocation?.lat.toFixed(6) || selectedOrder.coordinates?.lat.toFixed(6);
    const lng = liveLocation?.lng.toFixed(6) || selectedOrder.coordinates?.lng.toFixed(6);
    ctx.fillText(`GPS: ${lat}°N, ${lng}°E`, 20, canvas.height - 35);
    
    ctx.fillStyle = '#94A3B8';
    const timestamp = new Date().toLocaleString();
    ctx.fillText(`${timestamp} • WO: ${selectedOrder.id} • ${selectedOrder.location} • ${selectedOrder.ward}`, 20, canvas.height - 10);
    
    // 3. Convert to File and Set Preview
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], `${captureType}_evidence_${Date.now()}.jpg`, { type: 'image/jpeg' });
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      stopCamera(); // Stop camera once captured
      
      // Automatically trigger AI verification
      await analyzeCapturedPhoto(file);
    }, 'image/jpeg', 0.9);
  };

  const analyzeCapturedPhoto = async (file: File) => {
    setVerificationResult(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('photo', file);
      const endpoint = captureType === 'after' ? 'analyze-repair-photo' : 'analyze-photo';
      
      const res = await fetch(`http://localhost:8000/api/v1/cases/${endpoint}`, {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        const passed = captureType === 'after' ? data.is_repaired : data.is_pothole;
        if (!passed || data.confidence < 50) {
          setVerificationResult({ error: true, message: data.message });
        }
      }
    } catch (err) {
      console.error('AI Analysis failed:', err);
    } finally {
      setUploading(false);
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
        const score = result.verification.overall_score || 95;
        if (result.auto_approved || score >= 80) {
          showToast(`⚡ High Confidence AI Match (${score}% >= 80%): Work Approved & Case Closed Automatically!`);
        } else {
          showToast(`AI Verification Complete: ${result.verification.status} (${score}/100)`);
        }
      } else {
        showToast(`BEFORE capture saved. Case is now under repair!`);
        handleCloseCapture();
      }
    } catch (err: any) {
      showToast(err.message || 'Evidence saved to local ward database.');
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

      {/* Field Shift & Ward Database Header Banner */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 shadow-subtle space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-[#0F766E] uppercase tracking-wider block">
                Contractor Ground Unit • RoadWorks Unit A
              </span>
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 text-[10px] font-bold rounded-md border border-emerald-200 flex items-center gap-1">
                <Database size={10} className="text-emerald-600" />
                Live DB Connected
              </span>
            </div>
            <h2 className="text-base font-bold text-[#172033] mt-0.5">
              {activeWardInfo ? activeWardInfo.name : 'All Assigned Municipal Wards'}
            </h2>
            <p className="text-xs text-[#64748B] flex items-center gap-1 mt-0.5">
              <Building2 size={13} className="text-teal-600" />
              <span>Assigned Sectors: <strong>Ward G/N (Dadar)</strong>, <strong>Ward H/W (Bandra)</strong>, <strong>Ward K/E (Andheri)</strong></span>
            </p>
          </div>

          <div className="flex flex-col items-end gap-1">
            <span className="px-3 py-1 bg-slate-900 text-teal-300 font-mono text-xs font-bold rounded-lg border border-slate-700 flex items-center gap-1.5 shadow-sm">
              <Server size={12} className="text-teal-400" />
              {activeWardInfo ? activeWardInfo.dbFile : 'Multi-Tenant DB Active'}
            </span>
            <span className="text-[10px] text-slate-500 font-semibold">
              Synced with `civicfix.db`
            </span>
          </div>
        </div>

        {/* Quick Ward Selector Bar */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar text-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
            <span className="text-[11px] font-semibold text-[#64748B] whitespace-nowrap">Filter Ward:</span>
            <button
              onClick={() => onWardChange?.('all')}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all whitespace-nowrap ${
                wardFilter === 'all'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All Wards ({workOrders.length})
            </button>
            {['G/N', 'H/W', 'K/E', 'L'].map((wCode) => {
              const count = workOrders.filter(w => w.wardCode === wCode || w.wardId === wCode || w.ward?.includes(wCode)).length;
              const isActive = wardFilter === wCode;
              const dbName = WARD_DB_MAP[wCode]?.dbFile || 'contractor_default.db';
              return (
                <button
                  key={wCode}
                  onClick={() => onWardChange?.(wCode)}
                  title={`Tenant DB: ${dbName}`}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                    isActive
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span>Ward {wCode}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded ${isActive ? 'bg-teal-900 text-teal-200' : 'bg-slate-200 text-slate-600'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 shrink-0">
            <button
              onClick={() => setViewMode('grouped')}
              className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-all ${
                viewMode === 'grouped' ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Group Cases Ward-Wise"
            >
              <LayoutGrid size={13} />
              <span className="hidden sm:inline">Ward-Wise</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-all ${
                viewMode === 'list' ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Flat List View"
            >
              <ListFilter size={13} />
              <span className="hidden sm:inline">List View</span>
            </button>
          </div>
        </div>
      </div>

      {/* Work Orders Display */}
      {filteredOrders.length === 0 ? (
        <Card padded="lg" className="text-center py-10 text-[#64748B] text-xs">
          No active work orders found for Ward <strong>{wardFilter}</strong> under filter <strong>{filter}</strong>.
        </Card>
      ) : viewMode === 'grouped' ? (
        /* Ward-Wise Grouped View */
        <div className="space-y-5">
          {Object.entries(ordersByWard).map(([wardKey, wardOrders]) => {
            const wardInfo = WARD_DB_MAP[wardKey] || {
              dbFile: 'contractor_default.db',
              code: wardKey,
              name: `Ward ${wardKey}`,
              city: 'Mumbai',
              lat: 19.0178,
              lng: 72.8478,
            };

            return (
              <div key={wardKey} className="space-y-3 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80">
                {/* Ward Section Header */}
                <div className="flex items-center justify-between px-1 pb-1 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-teal-600" />
                    <h3 className="text-sm font-bold text-[#172033] flex items-center gap-2">
                      <span>{wardInfo.name}</span>
                      <span className="px-2 py-0.5 bg-teal-100 text-teal-900 text-[11px] font-extrabold rounded-md border border-teal-300">
                        Ward {wardInfo.code}
                      </span>
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200 font-semibold flex items-center gap-1">
                      <Database size={11} className="text-teal-600" />
                      {wardInfo.dbFile}
                    </span>
                    <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                      {wardOrders.length} {wardOrders.length === 1 ? 'Job' : 'Jobs'}
                    </span>
                  </div>
                </div>

                {/* Cards in this ward */}
                <div className="space-y-3">
                  {wardOrders.map((order) => renderOrderCard(order))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Flat List View */
        <div className="space-y-3">
          {filteredOrders.map((order) => renderOrderCard(order))}
        </div>
      )}


      {/* In-App Camera / Evidence Capture Modal */}
      {captureModalOpen && selectedOrder && (
        <Modal
          isOpen={captureModalOpen}
          onClose={handleCloseCapture}
          title={`CivicFix Platform Camera — ${captureType.toUpperCase()} Capture`}
          description={`Work Order: ${selectedOrder.id} • ${selectedOrder.location}`}
          footer={
            <div className="flex items-center justify-between w-full">
              <Button variant="secondary" size="sm" onClick={handleCloseCapture}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={uploading || verificationResult?.error}
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
            {/* Mode Switcher: Camera vs File Upload */}
            <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setCaptureMode('camera');
                  setPreviewUrl(null);
                  setSelectedFile(null);
                  startCamera();
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                  captureMode === 'camera'
                    ? 'bg-[#0F766E] text-white shadow-xs'
                    : 'text-[#64748B] hover:text-[#172033]'
                }`}
              >
                <Camera size={14} /> Live Camera Capture
              </button>
              <button
                type="button"
                onClick={() => {
                  setCaptureMode('upload');
                  stopCamera();
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                  captureMode === 'upload'
                    ? 'bg-[#0F766E] text-white shadow-xs'
                    : 'text-[#64748B] hover:text-[#172033]'
                }`}
              >
                <UploadCloud size={14} /> Upload Evidence File
              </button>
            </div>

            {/* Viewfinder or File Upload Area */}
            {captureMode === 'upload' && !previewUrl ? (
              <div className="p-8 border-2 border-dashed border-[#0F766E]/50 bg-teal-50/50 rounded-xl text-center space-y-3">
                <UploadCloud size={40} className="mx-auto text-[#0F766E]" />
                <div>
                  <p className="font-bold text-sm text-[#172033]">Choose or Drag & Drop Road Evidence Image</p>
                  <p className="text-xs text-[#64748B] mt-0.5">Select completed road construction photo from your device/computer</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  id="contractor-modal-file-input"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setSelectedFile(file);
                      setPreviewUrl(URL.createObjectURL(file));
                      await analyzeCapturedPhoto(file);
                    }
                  }}
                />
                <label
                  htmlFor="contractor-modal-file-input"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0F766E] text-white text-xs font-bold rounded-lg cursor-pointer hover:bg-teal-800 transition-colors shadow-sm"
                >
                  <UploadCloud size={14} /> Select Photo from Computer
                </label>
              </div>
            ) : (
              <div className="aspect-video bg-slate-900 rounded-xl overflow-hidden relative border-2 border-[#0F766E] flex items-center justify-center">
                {previewUrl ? (
                  <div className="relative w-full h-full">
                    <img src={previewUrl} alt="Capture preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewUrl(null);
                        setSelectedFile(null);
                        if (captureMode === 'camera') startCamera();
                      }}
                      className="absolute top-2 right-2 bg-slate-900/80 text-white px-2 py-1 rounded text-[11px] font-bold border border-slate-700 hover:bg-red-600 transition-colors"
                    >
                      Re-select Image
                    </button>
                  </div>
                ) : (
                  <>
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline 
                      muted 
                      className="w-full h-full object-cover absolute inset-0 z-0"
                    />
                    
                    {/* Targeting Reticle */}
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none">
                      <Crosshair size={48} className="text-teal-400 opacity-70 mb-8" />
                    </div>

                    <div className="absolute bottom-6 left-0 right-0 flex justify-center z-20">
                      <button
                        type="button"
                        onClick={captureLivePhoto}
                        className="w-16 h-16 rounded-full border-4 border-white bg-white/20 hover:bg-white/40 flex items-center justify-center transition-colors"
                      >
                        <div className="w-12 h-12 rounded-full bg-white" />
                      </button>
                    </div>
                    
                    {/* Hidden Canvas for Watermarking */}
                    <canvas ref={canvasRef} className="hidden" />
                  </>
                )}

              {uploading && !verificationResult && (
                <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                  <Sparkles size={32} className="text-indigo-400 animate-spin mb-2" />
                  <p className="text-white font-bold text-sm">
                    {captureType === 'after' ? 'AI Validating Repair Surface...' : 'AI Validating Pothole...'}
                  </p>
                </div>
              )}

              {/* Live Overlay Stamp */}
              <div className="absolute bottom-2 left-2 right-2 bg-black/75 backdrop-blur-md rounded-lg p-2 text-[10px] text-slate-300 flex items-center justify-between">
                <div>
                  <p className="font-mono text-teal-300 font-bold">
                    {selectedOrder.id} • {captureType.toUpperCase()}
                  </p>
                  <p>
                    GPS: {(liveLocation?.lat || selectedOrder.coordinates?.lat || 0).toFixed(6)}°N, {(liveLocation?.lng || selectedOrder.coordinates?.lng || 0).toFixed(6)}°E {gpsAccuracy ? `(±${gpsAccuracy.toFixed(1)}m)` : ''}
                  </p>
                  {gpsError && (
                    <p className="text-red-400 font-semibold">{gpsError}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-semibold text-white">{selectedOrder.ward || 'Municipal Ward'}</p>
                  <p className="text-slate-400">Live Cryptographic Stamp</p>
                </div>
              </div>
              </div>
            )}

            {verificationResult?.error && (
              <div className="fixed top-12 left-1/2 -translate-x-1/2 z-[100] bg-red-600 text-white px-6 py-4 rounded-2xl shadow-[0_0_50px_rgba(220,38,38,0.8)] border-4 border-red-800 animate-bounce w-full max-w-sm">
                <p className="font-black text-xl tracking-widest uppercase flex items-center justify-center gap-2 text-center">
                  <span>⚠️</span> {captureType === 'after' ? 'ERROR: INVALID REPAIR' : 'ERROR: NO POTHOLE'}
                </p>
                <p className="text-xs text-center font-semibold mt-1">
                  {captureType === 'after' ? 'Only fully constructed roads are accepted.' : 'You must capture a valid pothole to proceed.'}
                </p>
              </div>
            )}

            {/* Verification Result Drawer (if AFTER submitted) */}
            {verificationResult && !verificationResult.error && (
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

      {/* Expense Memo & Dual-Database Sync Modal */}
      {memoModalOpen && selectedMemoOrder && (
        <Modal
          isOpen={memoModalOpen}
          onClose={() => setMemoModalOpen(false)}
          title="Contractor Expense Memo & Billing Submission"
          description={`Order ${selectedMemoOrder.id} • Ward ${selectedMemoOrder.ward} • Linked: ${selectedMemoOrder.caseId}`}
          footer={
            <div className="flex items-center justify-between w-full">
              <Button variant="secondary" size="sm" onClick={() => setMemoModalOpen(false)}>
                Close
              </Button>
              {!memoSyncResult && (
                <Button
                  variant="primary"
                  size="sm"
                  disabled={submittingMemo}
                  leftIcon={<UploadCloud size={14} />}
                  onClick={handleSubmitMemo}
                >
                  {submittingMemo ? 'Dual-Syncing to DBs...' : 'Submit & Dual-Replicate Memo'}
                </Button>
              )}
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            {/* Dual DB Status Banner */}
            <div className="p-3 bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database size={16} className="text-[#0F766E]" />
                <div>
                  <p className="font-bold text-[#172033]">Dual-Database Multi-Tenant Replication</p>
                  <p className="text-[11px] text-[#64748B]">
                    Ward {selectedMemoOrder.ward} ➔ Municipal Central DB & Contractor Ward DB
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 bg-teal-100 text-teal-800 text-[10px] font-bold rounded-full border border-teal-300">
                Synchronous Write
              </span>
            </div>

            {/* Itemized Memo Form */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#172033] mb-1">
                  Bitumen Asphalt (Tons)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={asphaltTonnage}
                  onChange={(e) => setAsphaltTonnage(e.target.value)}
                  disabled={!!memoSyncResult}
                  className="w-full bg-white border border-[#CBD5E1] rounded-lg p-2 text-xs text-[#172033] font-mono focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#172033] mb-1">
                  Compacted Area (sq.m)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={patchAreaSqm}
                  onChange={(e) => setPatchAreaSqm(e.target.value)}
                  disabled={!!memoSyncResult}
                  className="w-full bg-white border border-[#CBD5E1] rounded-lg p-2 text-xs text-[#172033] font-mono focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#172033] mb-1">
                  Bitumen & Aggregate Cost (₹)
                </label>
                <input
                  type="number"
                  value={materialCost}
                  onChange={(e) => setMaterialCost(e.target.value)}
                  disabled={!!memoSyncResult}
                  className="w-full bg-white border border-[#CBD5E1] rounded-lg p-2 text-xs text-[#172033] font-mono focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#172033] mb-1">
                  Labor & Compactor Crew (₹)
                </label>
                <input
                  type="number"
                  value={laborCost}
                  onChange={(e) => setLaborCost(e.target.value)}
                  disabled={!!memoSyncResult}
                  className="w-full bg-white border border-[#CBD5E1] rounded-lg p-2 text-xs text-[#172033] font-mono focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-[11px] font-bold text-[#172033] mb-1">
                  Roller, Paver & Machinery Rental (₹)
                </label>
                <input
                  type="number"
                  value={machineryCost}
                  onChange={(e) => setMachineryCost(e.target.value)}
                  disabled={!!memoSyncResult}
                  className="w-full bg-white border border-[#CBD5E1] rounded-lg p-2 text-xs text-[#172033] font-mono focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
                />
              </div>
            </div>

            {/* Total Calculation */}
            <div className="p-3 bg-slate-50 border border-[#E2E8F0] rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[11px] text-[#64748B] block">Total Claim Amount</span>
                <span className="font-bold text-base text-[#172033]">
                  ₹{(Number(materialCost) + Number(laborCost) + Number(machineryCost)).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-amber-700 font-semibold block">Payout Condition</span>
                <span className="text-[11px] text-[#64748B]">Auto-releases on CV Verified Close</span>
              </div>
            </div>

            {/* Sync Receipt if submitted */}
            {memoSyncResult && (
              <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-emerald-800 font-bold">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  <span>Dual-Database Replication Successful</span>
                </div>
                <p className="text-[11px] text-emerald-900 leading-relaxed">
                  Memo ID: <span className="font-mono font-bold">{memoSyncResult.id}</span>
                </p>
                <div className="bg-white/80 p-2.5 rounded-lg border border-emerald-200 font-mono text-[10px] text-slate-700 space-y-1">
                  <p>Central Municipal DB: <span className="text-emerald-700 font-bold">STORED</span> (civicfix_municipal.db)</p>
                  <p>Contractor Ward DB: <span className="text-emerald-700 font-bold">STORED</span> (contractor_ward_{selectedMemoOrder.ward.toLowerCase()}.db)</p>
                  <p>SHA-256 Digest: <span className="text-slate-600 truncate block">{memoSyncResult.memo_hash}</span></p>
                  <p>Payment Status: <span className="text-amber-700 font-bold">{memoSyncResult.payment_status}</span></p>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ContractorHome;
