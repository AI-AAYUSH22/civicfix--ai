import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  checkBackendHealth,
  getCases,
  getWorkOrders,
  getMunicipalStats,
  getWards,
  getContractors,
  createCitizenComplaint,
  validateCase,
  createWorkOrder,
  uploadEvidence,
  reviewVerification,
  ApiCase,
  ApiWorkOrder,
  ApiStats,
} from '@/services/api';
import { cases as mockCases, wards as mockWards } from '@/data/mockData';
import type { PotholeCase, WorkOrder } from '@/types';

interface AppContextType {
  backendConnected: boolean;
  loading: boolean;
  cases: PotholeCase[];
  workOrders: WorkOrder[];
  stats: ApiStats;
  wards: any[];
  contractors: any[];
  refreshData: () => Promise<void>;
  submitComplaint: (formData: FormData) => Promise<ApiCase>;
  ingestSocialHandler: (rawText: string, channel: 'REDDIT' | 'WHATSAPP', file?: File) => Promise<any>;
  validateCaseHandler: (caseId: string, action: 'VALIDATE' | 'REJECT', notes?: string) => Promise<void>;
  assignWorkOrderHandler: (caseId: string, contractorId: string, priority?: string) => Promise<void>;
  submitEvidenceHandler: (
    workOrderId: string,
    captureType: 'BEFORE' | 'AFTER',
    file: File,
    lat: number,
    lng: number
  ) => Promise<any>;
  submitExpenseMemoHandler: (formData: FormData) => Promise<any>;
  reviewVerificationHandler: (
    workOrderId: string,
    decision: 'APPROVE' | 'REJECT',
    notes?: string
  ) => Promise<void>;
}


const AppContext = createContext<AppContextType | undefined>(undefined);

// Helper to map backend ApiCase to frontend PotholeCase
function mapApiCaseToFrontend(c: ApiCase): PotholeCase {
  const beforeEv = c.evidence_files?.find((e) => e.capture_type === 'BEFORE' || e.capture_type === 'CITIZEN');
  const afterEv = c.evidence_files?.find((e) => e.capture_type === 'AFTER');

  return {
    id: c.id,
    wardId: c.ward_id || 'ward-12',
    location: c.location?.address || c.title,
    landmark: c.location?.landmark,
    city: 'Mumbai',
    coordinates: {
      x: 50,
      y: 50,
      lat: c.location?.latitude || 19.0178,
      lng: c.location?.longitude || 72.8478,
    },
    severity: (c.severity as any) || 'Medium',
    status: (c.status as any) || 'REPORTED',
    description: c.description,
    reportedDate: c.created_at,
    assignedDate: c.work_order ? c.created_at : undefined,
    deadline: c.work_order?.deadline,
    contractor: c.work_order?.contractor_name,
    beforeImage: beforeEv ? `http://localhost:8000/${beforeEv.storage_path}` : undefined,
    afterImage: afterEv ? `http://localhost:8000/${afterEv.storage_path}` : undefined,
    verification: c.verification
      ? {
          status: (c.verification.status === 'VERIFIED' ? 'Verified' : c.verification.status === 'NEEDS_REVIEW' ? 'Needs Review' : 'Not Verified'),
          score: Math.round(c.verification.score),
          summary: c.verification.summary,
          checks: c.verification.checks.map((ch) => ({
            label: ch.check_type,
            passed: ch.status === 'PASS',
            detail: ch.details?.message || `${ch.check_type} check ${ch.status}`,
          })),
        }
      : undefined,
  };
}

function mapApiWorkOrderToFrontend(wo: ApiWorkOrder): WorkOrder {
  return {
    id: wo.id,
    caseId: wo.case_id,
    title: wo.case_title || `Repair at ${wo.case_location || 'Assigned Location'}`,
    location: wo.case_location || 'Dadar West',
    ward: wo.ward_name || 'Ward 12',
    priority: (wo.priority as any) || 'Medium',
    status: (wo.status as any) || 'Assigned',
    assignedDate: wo.assigned_at?.split('T')[0] || '2026-09-20',
    dueDate: wo.deadline ? new Date(wo.deadline).toLocaleDateString() : 'In 48h',
    assignedContractor: wo.contractor_name || 'RoadWorks Unit A',
    beforePhotoCaptured: wo.before_photo_captured,
    afterPhotoCaptured: wo.after_photo_captured,
    coordinates: {
      lat: wo.assigned_latitude,
      lng: wo.assigned_longitude,
    },
  };
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [backendConnected, setBackendConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [cases, setCases] = useState<PotholeCase[]>(mockCases);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [stats, setStats] = useState<ApiStats>({
    totalActive: 6,
    pendingVerification: 2,
    underRepair: 2,
    resolvedThisMonth: 14,
  });
  const [wards, setWards] = useState<any[]>(mockWards);
  const [contractors, setContractors] = useState<any[]>([]);

  const refreshData = useCallback(async () => {
    try {
      const isHealthy = await checkBackendHealth();
      setBackendConnected(isHealthy);

      if (isHealthy) {
        const [apiCases, apiWos, apiStats, apiWards, apiContractors] = await Promise.all([
          getCases(),
          getWorkOrders(),
          getMunicipalStats().catch(() => null),
          getWards().catch(() => mockWards),
          getContractors().catch(() => []),
        ]);

        if (apiCases && apiCases.length > 0) {
          setCases(apiCases.map(mapApiCaseToFrontend));
        }
        if (apiWos) {
          setWorkOrders(apiWos.map(mapApiWorkOrderToFrontend));
        }
        if (apiStats) {
          setStats(apiStats);
        }
        if (apiWards) {
          setWards(apiWards);
        }
        if (apiContractors) {
          setContractors(apiContractors);
        }
      }
    } catch (err) {
      console.warn('Backend unavailable, operating in local demonstration mode:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
    const timer = setInterval(refreshData, 5000); // Polling for real-time updates
    return () => clearInterval(timer);
  }, [refreshData]);

  const submitComplaint = async (formData: FormData): Promise<ApiCase> => {
    const newCase = await createCitizenComplaint(formData);
    await refreshData();
    return newCase;
  };

  const validateCaseHandler = async (caseId: string, action: 'VALIDATE' | 'REJECT', notes?: string) => {
    await validateCase(caseId, action, notes);
    await refreshData();
  };

  const assignWorkOrderHandler = async (caseId: string, contractorId: string, priority: string = 'High') => {
    await createWorkOrder(caseId, contractorId, priority);
    await refreshData();
  };

  const submitEvidenceHandler = async (
    workOrderId: string,
    captureType: 'BEFORE' | 'AFTER',
    file: File,
    lat: number,
    lng: number
  ) => {
    const formData = new FormData();
    formData.append('work_order_id', workOrderId);
    formData.append('capture_type', captureType);
    formData.append('latitude', lat.toString());
    formData.append('longitude', lng.toString());
    formData.append('file', file);

    const result = await uploadEvidence(formData);
    await refreshData();
    return result;
  };

  const ingestSocialHandler = async (rawText: string, channel: 'REDDIT' | 'WHATSAPP', file?: File) => {
    const res = await (await import('@/services/api')).ingestSocialComplaint(rawText, channel, channel === 'REDDIT' ? 'u/mumbai_citizen' : '+91 98200 99999', file);
    await refreshData();
    return res;
  };

  const submitExpenseMemoHandler = async (formData: FormData) => {
    const res = await (await import('@/services/api')).submitExpenseMemo(formData);
    await refreshData();
    return res;
  };

  const reviewVerificationHandler = async (
    workOrderId: string,
    decision: 'APPROVE' | 'REJECT',
    notes?: string
  ) => {
    await reviewVerification(workOrderId, decision, notes);
    await refreshData();
  };

  return (
    <AppContext.Provider
      value={{
        backendConnected,
        loading,
        cases,
        workOrders,
        stats,
        wards,
        contractors,
        refreshData,
        submitComplaint,
        ingestSocialHandler,
        validateCaseHandler,
        assignWorkOrderHandler,
        submitEvidenceHandler,
        submitExpenseMemoHandler,
        reviewVerificationHandler,
      }}
    >
      {children}
    </AppContext.Provider>
  );

};

export function useApp(): AppContextType {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
