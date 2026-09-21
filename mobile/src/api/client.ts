import { Platform } from 'react-native';

// When running on Android emulator: 'http://10.0.2.2:8000/api/v1'
// When running on iOS simulator or web: 'http://localhost:8000/api/v1'
// When testing on real device via Expo Go: use machine LAN IP (e.g. 'http://192.168.1.100:8000/api/v1')
export const API_BASE_URL = Platform.select({
  android: 'http://10.0.2.2:8000/api/v1',
  default: 'http://localhost:8000/api/v1',
});

export async function submitMobileComplaint(formData: FormData) {
  const res = await fetch(`${API_BASE_URL}/cases`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.detail || 'Failed to submit complaint');
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
    throw new Error(errorData?.detail || 'Evidence upload failed');
  }
  return res.json();
}
