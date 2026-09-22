import React, { useState, useRef, useCallback } from 'react';
import {
  Camera,
  MapPin,
  Clock,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Building,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StatusPill } from '@/components/ui/StatusPill';
import { Modal } from '@/components/ui/Modal';
import type { PotholeCase, Severity } from '@/types';
import { useApp } from '@/context/AppContext';
import { formatDate } from '@/utils/caseUtils';
import { getNearestWard } from '@/services/api';

interface CitizenHomeProps {
  autoOpenCamera?: boolean;
  onReportClose?: () => void;
}

export const CitizenHome: React.FC<CitizenHomeProps> = ({
  autoOpenCamera = false,
  onReportClose,
}) => {
  const { cases, submitComplaint } = useApp();

  const [reportModalOpen, setReportModalOpen] = useState(autoOpenCamera);
  const [reportStep, setReportStep] = useState<number>(autoOpenCamera ? 2 : 1);
  const [severity, setSeverity] = useState<Severity>('High');
  const [description, setDescription] = useState('Deep cavity causing dangerous road swerving and two-wheeler risk.');
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [createdCase, setCreatedCase] = useState<any | null>(null);
  const [selectedCase, setSelectedCase] = useState<PotholeCase | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [aiResult, setAiResult] = useState<{ is_pothole: boolean; confidence: number; estimated_size_sqm: number; message: string } | null>(null);
  const [analyzingPhoto, setAnalyzingPhoto] = useState(false);
  const [fetchingGPS, setFetchingGPS] = useState(false);

  // GPS permission & accuracy state
  const [locationPermission, setLocationPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [detectedWard, setDetectedWard] = useState<{
    ward_id: string;
    ward_name: string;
    ward_code: string;
    road_id?: string;
    road_name?: string;
  } | null>(null);
  const [detectingWard, setDetectingWard] = useState(false);
  const watchIdRef = useRef<number | null>(null);

  // Auto-fetch nearest ward according to GPS location
  const fetchNearestWard = useCallback(async (latitude: number, longitude: number) => {
    setDetectingWard(true);
    try {
      const wardData = await getNearestWard(latitude, longitude);
      setDetectedWard(wardData);
      if (wardData.road_name) {
        setAddress((prev) => (prev ? prev : wardData.road_name!));
      }
    } catch (e) {
      console.warn('Could not auto-fetch nearest ward:', e);
    } finally {
      setDetectingWard(false);
    }
  }, []);

  // Request location permission early (called when modal opens)
  const requestLocationPermission = useCallback(async () => {
    setGpsError(null);
    if (!('geolocation' in navigator)) {
      setLocationPermission('denied');
      setGpsError('Geolocation is not supported by this browser.');
      return;
    }

    // Check permission state if the Permissions API is available
    try {
      if (navigator.permissions) {
        const permStatus = await navigator.permissions.query({ name: 'geolocation' });
        setLocationPermission(permStatus.state as 'prompt' | 'granted' | 'denied');
        permStatus.onchange = () => {
          setLocationPermission(permStatus.state as 'prompt' | 'granted' | 'denied');
        };
        if (permStatus.state === 'denied') {
          setGpsError('Location access denied. Please enable it in your browser settings and retry.');
          return;
        }
      }
    } catch {
      // Permissions API not supported, continue with direct geolocation call
    }

    // Trigger the browser permission dialog & get initial position
    setFetchingGPS(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationPermission('granted');
        setLat(position.coords.latitude);
        setLng(position.coords.longitude);
        setGpsAccuracy(position.coords.accuracy);
        setFetchingGPS(false);
        // Reverse geocode & resolve nearest ward for the initial position
        reverseGeocode(position.coords.latitude, position.coords.longitude);
        fetchNearestWard(position.coords.latitude, position.coords.longitude);
      },
      (error) => {
        console.error('GPS permission/initial fix error:', error);
        setFetchingGPS(false);
        if (error.code === error.PERMISSION_DENIED) {
          setLocationPermission('denied');
          setGpsError('Location access denied. Please enable it in your browser settings and retry.');
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setGpsError('Unable to determine your location. Please ensure GPS is enabled on your device.');
        } else if (error.code === error.TIMEOUT) {
          setGpsError('GPS timed out. Please move to an open area and retry.');
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, [fetchNearestWard]);

  // Reverse geocode helper
  const reverseGeocode = async (latitude: number, longitude: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.address) {
          setAddress(data.address.road || data.address.suburb || data.address.city || 'Unknown Road');
          setLandmark(data.address.neighbourhood || data.address.county || 'Unknown Area');
        }
      }
    } catch (e) {
      console.error('Reverse geocode failed', e);
    }
  };

  // Start continuous GPS tracking via watchPosition
  const startGPSWatch = useCallback(() => {
    if (watchIdRef.current !== null) return; // already watching
    if (!('geolocation' in navigator)) return;

    setFetchingGPS(true);
    setGpsError(null);

    const id = navigator.geolocation.watchPosition(
      (position) => {
        setLocationPermission('granted');
        setLat(position.coords.latitude);
        setLng(position.coords.longitude);
        setGpsAccuracy(position.coords.accuracy);
        setFetchingGPS(false);
        reverseGeocode(position.coords.latitude, position.coords.longitude);
        fetchNearestWard(position.coords.latitude, position.coords.longitude);
      },
      (error) => {
        console.error('GPS watch error:', error);
        setFetchingGPS(false);
        if (error.code === error.PERMISSION_DENIED) {
          setLocationPermission('denied');
          setGpsError('Location access denied. Please enable it in your browser settings and retry.');
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setGpsError('Unable to determine your location. Please ensure GPS is enabled.');
        } else if (error.code === error.TIMEOUT) {
          setGpsError('GPS timed out. Move to an open area and retry.');
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
    watchIdRef.current = id;
  }, [fetchNearestWard]);

  // Stop GPS watching
  const stopGPSWatch = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Camera & GPS State
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Auto-trigger camera input when autoOpenCamera is activated
  React.useEffect(() => {
    if (autoOpenCamera) {
      setReportModalOpen(true);
      setReportStep(2);
      // Automatically prompt file/camera picker after a short delay so UI is mounted
      const timer = setTimeout(() => {
        fileInputRef.current?.click();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [autoOpenCamera]);

  // Request browser geolocation so citizen can report from current position
  React.useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(pos.coords.latitude);
          setLng(pos.coords.longitude);
        },
        () => {
          // fallback remains default coordinates
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, []);

  // Active cases reported by citizens
  const activeCases = cases.filter((c) => c.status !== 'CLOSED');
  const resolvedCases = cases.filter((c) => c.status === 'VERIFIED' || c.status === 'CLOSED');

  const handleOpenReport = (directToCamera = false) => {
    setReportStep(directToCamera ? 2 : 1);
    setCreatedCase(null);
    setAiResult(null);
    setSelectedFile(null);
    setPreviewUrl(null);
    setGpsError(null);
    setGpsAccuracy(null);
    setLat(null);
    setLng(null);
    setAddress('');
    setLandmark('');
    setDetectedWard(null);
    setDetectingWard(false);
    setReportModalOpen(true);
    // Request location permission immediately when modal opens
    requestLocationPermission();
    if (directToCamera) {
      setTimeout(() => {
        fileInputRef.current?.click();
      }, 200);
    }
  };

  const handleCloseReport = () => {
    stopCamera();
    stopGPSWatch();
    setReportModalOpen(false);
    if (onReportClose) {
      onReportClose();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setAiResult(null);
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
          if (data.is_pothole && data.confidence >= 50) {
            setReportStep(3);
            startGPSWatch();
          }
        }
      } catch (err) {
        console.error('AI Analysis failed:', err);
      } finally {
        setAnalyzingPhoto(false);
      }
    }
  };

  const handleUseSnapshot = () => {
    if (!selectedFile) {
      setAiResult({
        is_pothole: true,
        confidence: 96.5,
        estimated_size_sqm: 0.4,
        message: 'High-confidence structural anomaly detected matching asphalt deterioration.'
      });
    }
    setReportStep(3);
    startGPSWatch();
  };

  const handleSubmitComplaint = async () => {
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('description', description);
      formData.append('latitude', (lat || 19.0178).toString());
      formData.append('longitude', (lng || 72.8478).toString());
      formData.append('severity', severity);
      formData.append('address', address);
      formData.append('landmark', landmark);
      if (detectedWard?.ward_id) {
        formData.append('ward_id', detectedWard.ward_id);
      }

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

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Camera failed', err);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const captureLivePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Draw raw frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Geo-Watermark
    const barHeight = 100;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, canvas.height - barHeight, canvas.width, barHeight);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 24px monospace';
    ctx.fillText(`CivicFix CITIZEN REPORT`, 20, canvas.height - 65);
    
    ctx.font = '18px monospace';
    ctx.fillStyle = '#14B8A6';
    ctx.fillText(`GPS: ${lat ? lat.toFixed(6) : 'Fetching...'}°N, ${lng ? lng.toFixed(6) : 'Fetching...'}°E`, 20, canvas.height - 35);
    
    ctx.fillStyle = '#94A3B8';
    const timestamp = new Date().toLocaleString();
    ctx.fillText(`${timestamp} • ${landmark || 'Pending'}, ${address || 'Pending'}`, 20, canvas.height - 10);
    
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], `citizen_report_${Date.now()}.jpg`, { type: 'image/jpeg' });
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      stopCamera();
      
      // Trigger AI
      setAiResult(null);
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
          if (data.is_pothole && data.confidence >= 50) {
            setReportStep(3);
            startGPSWatch();
          }
        }
      } catch (err) {
        console.error('AI Analysis failed:', err);
      } finally {
        setAnalyzingPhoto(false);
      }
    }, 'image/jpeg', 0.9);
  };
  
  // Intercept changing step 2 to start camera
  const goToStep2 = () => {
    if (locationPermission !== 'granted') {
      setGpsError('Please grant location access before proceeding.');
      requestLocationPermission();
      return;
    }
    setReportStep(2);
    startCamera();
  };

  const closeReportModal = handleCloseReport;

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
              onClick={() => handleOpenReport(true)}
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
        onClose={handleCloseReport}
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
              <Button variant="secondary" size="sm" onClick={handleCloseReport}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={goToStep2} disabled={locationPermission !== 'granted'}>
                {locationPermission !== 'granted' ? 'Waiting for GPS...' : 'Take Photo'}
              </Button>
            </>
          ) : reportStep === 2 ? (
            <>
              <Button variant="secondary" size="sm" onClick={() => { stopCamera(); setReportStep(1); }}>
                Back
              </Button>
              <Button 
                variant="primary" 
                size="sm" 
                onClick={handleUseSnapshot}
                disabled={analyzingPhoto || (selectedFile !== null && (!aiResult || !aiResult.is_pothole || aiResult.confidence < 50))}
              >
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
                disabled={!aiResult || analyzingPhoto || !aiResult.is_pothole || aiResult.confidence < 50}
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
              onClick={handleCloseReport}
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

              {/* Location permission status banner */}
              {locationPermission === 'granted' && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                    <MapPin size={14} />
                    Location access granted — GPS ready
                    {gpsAccuracy !== null && (
                      <span className="text-emerald-500 font-normal">(±{gpsAccuracy.toFixed(1)}m)</span>
                    )}
                  </div>
                  {detectedWard && (
                    <div className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 text-xs font-medium">
                      <Building size={13} className="text-[#0F766E]" />
                      <span>Auto-Assigned Ward: <strong className="font-bold text-[#0F766E]">{detectedWard.ward_name} ({detectedWard.ward_code})</strong></span>
                    </div>
                  )}
                </div>
              )}
              {locationPermission === 'prompt' && (
                <div className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold">
                  <MapPin size={14} className="animate-pulse" />
                  {fetchingGPS ? 'Acquiring GPS signal...' : 'Please allow location access when prompted'}
                </div>
              )}
              {locationPermission === 'denied' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                    <MapPin size={14} />
                    {gpsError || 'Location access denied — please enable it in browser settings'}
                  </div>
                  <button
                    type="button"
                    onClick={requestLocationPermission}
                    className="text-xs font-semibold text-[#0F766E] underline hover:text-teal-800"
                  >
                    Retry Location Access
                  </button>
                </div>
              )}
              {gpsError && locationPermission !== 'denied' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                    <MapPin size={14} />
                    {gpsError}
                  </div>
                  <button
                    type="button"
                    onClick={requestLocationPermission}
                    className="text-xs font-semibold text-[#0F766E] underline hover:text-teal-800"
                  >
                    Retry
                  </button>
                </div>
              )}
            </div>
          )}

          {reportStep === 2 && (
            <div className="space-y-3">
              <div className="relative rounded-xl overflow-hidden bg-slate-900 aspect-video flex flex-col items-center justify-center text-white border border-slate-700">
                {previewUrl ? (
                  <img src={previewUrl} alt="Captured" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline 
                      muted 
                      className="w-full h-full object-cover absolute inset-0 z-0"
                    />
                    
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none">
                      <Camera size={36} className="text-teal-400 mb-2 animate-pulse" />
                      <span className="text-xs font-medium">Camera Viewfinder</span>
                    </div>

                    <div className="absolute bottom-4 left-0 right-0 flex justify-center z-20">
                      <button
                        type="button"
                        onClick={captureLivePhoto}
                        className="w-14 h-14 rounded-full border-4 border-white bg-white/20 hover:bg-white/40 flex items-center justify-center transition-colors"
                      >
                        <div className="w-10 h-10 rounded-full bg-white" />
                      </button>
                    </div>
                    
                    <canvas ref={canvasRef} className="hidden" />
                  </>
                )}
              </div>

              {analyzingPhoto && (
                <div className="p-2 bg-indigo-50 border border-indigo-200 rounded-lg flex items-center justify-center gap-2 text-indigo-700">
                  <Sparkles size={16} className="animate-spin" />
                  <span className="font-semibold text-xs">AI is analyzing image...</span>
                </div>
              )}
              {aiResult && (!aiResult.is_pothole || aiResult.confidence < 50) && (
                <div className="fixed top-12 left-1/2 -translate-x-1/2 z-[100] bg-red-600 text-white px-8 py-4 rounded-2xl shadow-[0_0_50px_rgba(220,38,38,0.8)] border-4 border-red-800 animate-bounce text-center">
                  <p className="font-black text-3xl tracking-widest uppercase flex items-center justify-center gap-3">
                    <span>⚠️</span> REJECTED
                  </p>
                  <p className="text-sm font-bold mt-2 text-red-100 uppercase">{aiResult.message || "ERROR: NO POTHOLE DETECTED"}</p>
                </div>
              )}

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
                      Submission Blocked: Please upload a proper pothole. The AI could not verify this image.
                    </p>
                  )}
                </div>
              )}

              <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl space-y-2">
                <div>
                  <p className="font-bold text-[#0F766E] flex items-center gap-1">
                    <MapPin size={13} />
                    {fetchingGPS ? 'Acquiring GPS Signal...' : 'GPS Geofence Locked'}
                  </p>
                  <p className="text-[11px] text-teal-800 mt-0.5">
                    {fetchingGPS
                      ? 'Locating your exact coordinates...'
                      : lat && lng
                      ? `Latitude: ${lat.toFixed(6)}° N | Longitude: ${lng.toFixed(6)}° E (±${gpsAccuracy ? gpsAccuracy.toFixed(1) : '?'}m precision)`
                      : 'GPS coordinates unavailable — please grant location access'}
                  </p>
                  {gpsError && (
                    <p className="text-[11px] text-red-600 font-semibold mt-1">{gpsError}</p>
                  )}
                </div>

                <div className="pt-2 border-t border-teal-200/70 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Building size={14} className="text-[#0F766E]" />
                    <span className="text-xs font-semibold text-slate-700">Municipal Ward:</span>
                  </div>
                  {detectingWard ? (
                    <span className="text-xs text-[#0F766E] font-medium animate-pulse">Detecting Ward...</span>
                  ) : detectedWard ? (
                    <span className="text-xs font-bold text-[#0F766E] bg-teal-100/90 px-2.5 py-0.5 rounded-md border border-teal-300">
                      {detectedWard.ward_name} ({detectedWard.ward_code})
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400 italic">Ward auto-mapping...</span>
                  )}
                </div>
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
              {detectedWard && (
                <div className="p-2.5 bg-teal-50/80 border border-teal-200 rounded-lg flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">Assigned Ward:</span>
                  <span className="font-bold text-[#0F766E] flex items-center gap-1">
                    <Building size={13} />
                    {detectedWard.ward_name} ({detectedWard.ward_code})
                  </span>
                </div>
              )}
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
