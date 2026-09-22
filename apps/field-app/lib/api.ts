import type { ApiCase, ApiWorkOrder, ApiVerificationResult, ApiStats } from './types';

export const API_BASE_URL = 'http://localhost:8000/api/v1';
export const UPLOAD_BASE_URL = 'http://localhost:8000';

// Health
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/health`, { signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch {
    return false;
  }
}

// Municipal / Ops
export async function getMunicipalStats(): Promise<ApiStats> {
  const res = await fetch(`${API_BASE_URL}/municipal/stats`);
  if (!res.ok) throw new Error(`Stats fetch failed: ${res.statusText}`);
  return res.json();
}

export async function getWards(): Promise<any[]> {
  const res = await fetch(`${API_BASE_URL}/municipal/wards`);
  if (!res.ok) throw new Error(`Wards fetch failed: ${res.statusText}`);
  return res.json();
}

export async function getContractors(): Promise<any[]> {
  const res = await fetch(`${API_BASE_URL}/municipal/contractors`);
  if (!res.ok) throw new Error(`Contractors fetch failed: ${res.statusText}`);
  return res.json();
}

// Cases
export async function getCases(params?: { status?: string; ward_id?: string; city?: string }): Promise<ApiCase[]> {
  const query = new URLSearchParams();
  if (params?.status) query.append('status', params.status);
  if (params?.ward_id) query.append('ward_id', params.ward_id);
  if (params?.city) query.append('city', params.city);
  const res = await fetch(`${API_BASE_URL}/cases?${query.toString()}`);
  if (!res.ok) throw new Error(`Cases fetch failed: ${res.statusText}`);
  return res.json();
}

export async function getCaseDetail(caseId: string): Promise<ApiCase> {
  const res = await fetch(`${API_BASE_URL}/cases/${caseId}`);
  if (!res.ok) throw new Error(`Case detail fetch failed: ${res.statusText}`);
  return res.json();
}

export async function getCaseTimeline(caseId: string): Promise<any[]> {
  const res = await fetch(`${API_BASE_URL}/cases/${caseId}/timeline`);
  if (!res.ok) throw new Error(`Timeline fetch failed: ${res.statusText}`);
  return res.json();
}

export async function createCitizenComplaint(formData: FormData): Promise<ApiCase> {
  const res = await fetch(`${API_BASE_URL}/cases`, { method: 'POST', body: formData });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.detail || `Complaint submit failed: ${res.statusText}`);
  }
  return res.json();
}

export async function validateCase(caseId: string, action: 'VALIDATE' | 'REJECT', notes?: string): Promise<ApiCase> {
  const res = await fetch(`${API_BASE_URL}/cases/${caseId}/validate`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, notes }),
  });
  if (!res.ok) throw new Error(`Case validate failed: ${res.statusText}`);
  return res.json();
}

// Work Orders
export async function getWorkOrders(status?: string): Promise<ApiWorkOrder[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  const res = await fetch(`${API_BASE_URL}/work-orders${query}`);
  if (!res.ok) throw new Error(`Work orders fetch failed: ${res.statusText}`);
  return res.json();
}

export async function createWorkOrder(caseId: string, contractorId: string, priority = 'High'): Promise<ApiWorkOrder> {
  const res = await fetch(`${API_BASE_URL}/work-orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ case_id: caseId, contractor_id: contractorId, priority }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.detail || `Work order create failed: ${res.statusText}`);
  }
  return res.json();
}

// Evidence
export async function uploadEvidence(formData: FormData): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/evidence/upload`, { method: 'POST', body: formData });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.detail || `Evidence upload failed: ${res.statusText}`);
  }
  return res.json();
}

// Verification
export async function getVerification(workOrderId: string): Promise<ApiVerificationResult> {
  const res = await fetch(`${API_BASE_URL}/verification/${workOrderId}`);
  if (!res.ok) throw new Error(`Verification fetch failed: ${res.statusText}`);
  return res.json();
}

export async function reviewVerification(workOrderId: string, decision: 'APPROVE' | 'REJECT', notes?: string): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/verification/${workOrderId}/review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ decision, notes, engineer_name: 'Er. Rajesh Kulkarni' }),
  });
  if (!res.ok) throw new Error(`Review submit failed: ${res.statusText}`);
  return res.json();
}

// Social Ingest
export async function ingestSocialComplaint(rawText: string, channel: 'REDDIT' | 'WHATSAPP', reporterHandle = 'citizen_feed', file?: File): Promise<any> {
  const formData = new FormData();
  formData.append('raw_text', rawText);
  formData.append('channel', channel);
  formData.append('reporter_handle', reporterHandle);
  if (file) formData.append('photo', file);
  const res = await fetch(`${API_BASE_URL}/cases/social-ingest`, { method: 'POST', body: formData });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.detail || 'Social ingest failed');
  }
  return res.json();
}

// Expense Memos
export async function submitExpenseMemo(formData: FormData): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/memos`, { method: 'POST', body: formData });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.detail || 'Expense memo submit failed');
  }
  return res.json();
}

export async function getExpenseMemo(caseId: string): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/memos/${caseId}`);
  if (!res.ok) throw new Error(`Expense memo fetch failed: ${res.statusText}`);
  return res.json();
}

export async function approveExpenseMemo(memoId: string): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/memos/${memoId}/approve`, { method: 'PATCH' });
  if (!res.ok) throw new Error(`Payout approval failed: ${res.statusText}`);
  return res.json();
}
