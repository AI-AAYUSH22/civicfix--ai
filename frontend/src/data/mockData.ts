import type { Ward, PotholeCase } from '@/types';

export const wards: Ward[] = [
  { id: 'w8', name: 'Ward 8', city: 'Mumbai', pendingCount: 12 },
  { id: 'w12', name: 'Ward 12', city: 'Mumbai', pendingCount: 18 },
  { id: 'w15', name: 'Ward 15', city: 'Mumbai', pendingCount: 9 },
  { id: 'w21', name: 'Ward 21', city: 'Thane', pendingCount: 6 },
  { id: 'w24', name: 'Ward 24', city: 'Thane', pendingCount: 4 },
];

export const cases: PotholeCase[] = [
  {
    id: 'CF-1023',
    wardId: 'w12',
    location: 'MG Road, Ward 12',
    city: 'Mumbai',
    coordinates: { x: 42, y: 38, lat: 19.0170, lng: 72.8300 },
    severity: 'High',
    status: 'Under Repair',
    description:
      'Large pothole near the MG Road signal causing traffic slowdown during peak hours. Reported by three separate citizens within two days.',
    reportedDate: '2026-09-02',
    assignedDate: '2026-09-05',
    deadline: '2026-09-20',
    contractor: 'Shree Infra Works',
    beforeImage: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'CF-1024',
    wardId: 'w12',
    location: 'Link Road, near Metro Pillar 112',
    city: 'Mumbai',
    coordinates: { x: 55, y: 46, lat: 19.0200, lng: 72.8350 },
    severity: 'Medium',
    status: 'AI Verification',
    description:
      'Medium-depth pothole adjacent to metro construction barricade. Contractor has submitted before/after evidence, pending AI review.',
    reportedDate: '2026-08-28',
    assignedDate: '2026-09-01',
    deadline: '2026-09-15',
    contractor: 'Konkan Roadways',
    beforeImage: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'CF-1019',
    wardId: 'w8',
    location: 'SV Road, opp. Andheri Station',
    city: 'Mumbai',
    coordinates: { x: 30, y: 60, lat: 19.1190, lng: 72.8460 },
    severity: 'High',
    status: 'Verified',
    description:
      'Deep pothole at a busy pedestrian crossing. High footfall area, flagged as priority by ward engineer.',
    reportedDate: '2026-09-08',
    beforeImage: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'CF-1031',
    wardId: 'w8',
    location: 'JP Road, Versova Junction',
    city: 'Mumbai',
    coordinates: { x: 22, y: 50, lat: 19.1300, lng: 72.8200 },
    severity: 'Low',
    status: 'Reported',
    description: 'Minor surface crack reported by a citizen via the mobile app. Awaiting engineer review.',
    reportedDate: '2026-09-14',
    beforeImage: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'CF-1007',
    wardId: 'w15',
    location: 'Eastern Express Highway service road',
    city: 'Mumbai',
    coordinates: { x: 65, y: 30, lat: 19.0600, lng: 72.8900 },
    severity: 'Medium',
    status: 'Resolved',
    description:
      'Pothole on the service road repaired and verified. Before/after evidence matched with high confidence.',
    reportedDate: '2026-08-12',
    assignedDate: '2026-08-15',
    deadline: '2026-08-30',
    contractor: 'Konkan Roadways',
    beforeImage: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'CF-1028',
    wardId: 'w15',
    location: 'Powai Lake Road',
    city: 'Mumbai',
    coordinates: { x: 70, y: 42, lat: 19.1200, lng: 72.9000 },
    severity: 'Low',
    status: 'Assigned',
    description: 'Small pothole near the lake promenade footpath entrance. Assigned to contractor this week.',
    reportedDate: '2026-09-10',
    assignedDate: '2026-09-13',
    deadline: '2026-09-25',
    contractor: 'Shree Infra Works',
    beforeImage: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'CF-1041',
    wardId: 'w21',
    location: 'Ghodbunder Road, near Kasarvadavali',
    city: 'Thane',
    coordinates: { x: 48, y: 22, lat: 19.2600, lng: 72.9700 },
    severity: 'High',
    status: 'Under Repair',
    description: 'Cluster of potholes formed after recent rainfall, affecting two-lane traffic flow.',
    reportedDate: '2026-09-06',
    assignedDate: '2026-09-09',
    deadline: '2026-09-22',
    contractor: 'Thane Municipal Works',
    beforeImage: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'CF-1044',
    wardId: 'w21',
    location: 'Pokhran Road No. 2',
    city: 'Thane',
    coordinates: { x: 40, y: 35, lat: 19.2200, lng: 72.9600 },
    severity: 'Medium',
    status: 'Reported',
    description: 'Reported via WhatsApp bot integration mock — pending engineer verification.',
    reportedDate: '2026-09-15',
    beforeImage: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'CF-1036',
    wardId: 'w24',
    location: 'Majiwada Circle approach road',
    city: 'Thane',
    coordinates: { x: 58, y: 55, lat: 19.2150, lng: 72.9750 },
    severity: 'Low',
    status: 'Resolved',
    description: 'Small pothole near the circle, resolved and verified within SLA.',
    reportedDate: '2026-08-20',
    assignedDate: '2026-08-22',
    deadline: '2026-09-02',
    contractor: 'Thane Municipal Works',
    beforeImage: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=400&q=80'
  },
];

export function getCasesByWard(wardId: string | 'all'): PotholeCase[] {
  if (wardId === 'all') return cases;
  return cases.filter((c) => c.wardId === wardId);
}

export function getWardById(wardId: string): Ward | undefined {
  return wards.find((w) => w.id === wardId);
}
