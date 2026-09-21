// CivicFix AI Central API Client

export const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000/api/v1';
export const UPLOAD_BASE_URL = 'http://localhost:8000';

export interface ApiCase {
  id: string;
  title: string;
  description: string;
  severity: 'Low' | 'Medium' | 'High';
  status: string;
  ward_id?: string;
  ward_name?: string;
  road_id?: string;
  road_name?: string;
  location?: {
    latitude: number;
    longitude: number;
    address: string;
    landmark?: string;
  };
  evidence_files?: Array<{
    id: string;
    capture_type: 'BEFORE' | 'AFTER' | 'CITIZEN';
    storage_path: string;
    file_name: string;
    captured_at?: string;
  }>;
  work_order?: {
    id: string;
    status: string;
    contractor_id?: string;
    contractor_name?: string;
    deadline?: string;
  };
  verification?: {
    id: string;
    status: string;
    score: number;
    summary?: string;
    checks: Array<{
      check_type: string;
      status: string;
      score: number;
      details?: Record<string, any>;
    }>;
  };
  created_at: string;
  updated_at: string;
}

export interface ApiWorkOrder {
  id: string;
  case_id: string;
  contractor_id?: string;
  contractor_name?: string;
  contractor_company?: string;
  assigned_latitude: number;
  assigned_longitude: number;
  priority: 'High' | 'Medium' | 'Low';
  status: string;
  assigned_at: string;
  deadline?: string;
  completed_at?: string;
  case_title?: string;
  case_description?: string;
  case_location?: string;
  landmark?: string;
  ward_name?: string;
  before_photo_captured?: boolean;
  before_photo_url?: string;
  after_photo_captured?: boolean;
  after_photo_url?: string;
  citizen_photo_url?: string;
}

export interface ApiVerificationResult {
  id: string;
  case_id: string;
  work_order_id: string;
  overall_score: number;
  status: 'VERIFIED' | 'NEEDS_REVIEW' | 'NOT_VERIFIED';
  summary?: string;
  started_at: string;
  completed_at: string;
  checks: Array<{
    check_type: string;
    status: 'PASS' | 'REVIEW' | 'FAIL';
    score: number;
    confidence: number;
    details?: Record<string, any>;
  }>;
}

export interface ApiStats {
  totalActive: number;
  pendingVerification: number;
  underRepair: number;
  resolvedThisMonth: number;
}

export interface ApiTimelineItem {
  id: string;
  action: string;
  actor_name: string;
  actor_role: string;
  timestamp: string;
  details: Record<string, any>;
}

// ----------------- API METHODS -----------------

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/health`, { signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch {
    return false;
  }
}

export async function getMunicipalStats(): Promise<ApiStats> {
  const res = await fetch(`${API_BASE_URL}/municipal/stats`);
  if (!res.ok) throw new Error(`Failed to load stats: ${res.statusText}`);
  return res.json();
}

export async function getWards(): Promise<any[]> {
  const res = await fetch(`${API_BASE_URL}/municipal/wards`);
  if (!res.ok) throw new Error(`Failed to load wards: ${res.statusText}`);
  return res.json();
}

export async function getContractors(): Promise<any[]> {
  const res = await fetch(`${API_BASE_URL}/municipal/contractors`);
  if (!res.ok) throw new Error(`Failed to load contractors: ${res.statusText}`);
  return res.json();
}

export async function getCases(params?: { status?: string; ward_id?: string; city?: string }): Promise<ApiCase[]> {
  const query = new URLSearchParams();
  if (params?.status) query.append('status', params.status);
  if (params?.ward_id) query.append('ward_id', params.ward_id);
  if (params?.city) query.append('city', params.city);

  const res = await fetch(`${API_BASE_URL}/cases?${query.toString()}`);
  if (!res.ok) throw new Error(`Failed to load cases: ${res.statusText}`);
  return res.json();
}

export async function getCaseDetail(caseId: string): Promise<ApiCase> {
  const res = await fetch(`${API_BASE_URL}/cases/${caseId}`);
  if (!res.ok) throw new Error(`Failed to load case detail: ${res.statusText}`);
  return res.json();
}

export async function getCaseTimeline(caseId: string): Promise<ApiTimelineItem[]> {
  const res = await fetch(`${API_BASE_URL}/cases/${caseId}/timeline`);
  if (!res.ok) throw new Error(`Failed to load timeline: ${res.statusText}`);
  return res.json();
}

export async function createCitizenComplaint(formData: FormData): Promise<ApiCase> {
  const res = await fetch(`${API_BASE_URL}/cases`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.detail || `Failed to submit complaint: ${res.statusText}`);
  }
  return res.json();
}

export async function validateCase(caseId: string, action: 'VALIDATE' | 'REJECT', notes?: string): Promise<ApiCase> {
  const res = await fetch(`${API_BASE_URL}/cases/${caseId}/validate`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, notes }),
  });
  if (!res.ok) throw new Error(`Failed to validate case: ${res.statusText}`);
  return res.json();
}

export async function getWorkOrders(status?: string): Promise<ApiWorkOrder[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  const res = await fetch(`${API_BASE_URL}/work-orders${query}`);
  if (!res.ok) throw new Error(`Failed to load work orders: ${res.statusText}`);
  return res.json();
}

export async function createWorkOrder(caseId: string, contractorId: string, priority: string = 'High'): Promise<ApiWorkOrder> {
  const res = await fetch(`${API_BASE_URL}/work-orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ case_id: caseId, contractor_id: contractorId, priority }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.detail || `Failed to create work order: ${res.statusText}`);
  }
  return res.json();
}

export async function uploadEvidence(formData: FormData): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/evidence/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.detail || `Evidence upload failed: ${res.statusText}`);
  }
  return res.json();
}

export async function getVerification(workOrderId: string): Promise<ApiVerificationResult> {
  const res = await fetch(`${API_BASE_URL}/verification/${workOrderId}`);
  if (!res.ok) throw new Error(`Failed to fetch verification: ${res.statusText}`);
  return res.json();
}

export async function reviewVerification(
  workOrderId: string,
  decision: 'APPROVE' | 'REJECT',
  notes?: string
): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/verification/${workOrderId}/review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ decision, notes, engineer_name: 'Er. Rajesh Kulkarni' }),
  });
  if (!res.ok) throw new Error(`Failed to submit review: ${res.statusText}`);
  return res.json();
}
