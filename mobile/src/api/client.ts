import { Platform } from 'react-native';

// Default target:
// Android emulator uses 10.0.2.2
// Web / iOS simulator uses localhost
// Set this to your local Wi-Fi IP (e.g. 'http://192.168.1.15:8000/api/v1') if testing on a physical phone via Expo Go
export let API_BASE_URL = Platform.select({
  android: 'http://10.0.2.2:8000/api/v1',
  default: 'http://localhost:8000/api/v1',
});

export function setCustomApiBaseUrl(url: string) {
  API_BASE_URL = url;
}

export async function submitMobileComplaint(formData: FormData) {
  const res = await fetch(`${API_BASE_URL}/cases`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.detail || `Failed to submit complaint (${res.status})`);
  }
  return res.json();
}

export async function fetchMobileWorkOrders(contractorId?: string) {
  const query = contractorId ? `?contractor_id=${encodeURIComponent(contractorId)}` : '';
  const res = await fetch(`${API_BASE_URL}/work-orders${query}`);
  if (!res.ok) throw new Error('Failed to fetch work orders');
  return res.json();
}

export async function uploadMobileEvidence(formData: FormData) {
  const res = await fetch(`${API_BASE_URL}/evidence/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.detail || `Evidence upload failed (${res.status})`);
  }
  return res.json();
}
