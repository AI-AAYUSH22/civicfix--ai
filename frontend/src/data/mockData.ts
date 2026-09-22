import type { Ward, PotholeCase } from '@/types';

export const wards: Ward[] = [
  { id: 'A', name: 'Ward A - Churchgate, Colaba, Fort', city: 'Mumbai', pendingCount: 12 },
  { id: 'B', name: 'Ward B - Masjid Bunder, Dongri', city: 'Mumbai', pendingCount: 12 },
  { id: 'C', name: 'Ward C - Pydhonie, Bhuleshwar', city: 'Mumbai', pendingCount: 12 },
  { id: 'D', name: 'Ward D - Malabar Hill, Grant Road', city: 'Mumbai', pendingCount: 12 },
  { id: 'E', name: 'Ward E - Byculla, Nagpada', city: 'Mumbai', pendingCount: 12 },
  { id: 'F/N', name: 'Ward F/North - Matunga, Sion', city: 'Mumbai', pendingCount: 12 },
  { id: 'F/S', name: 'Ward F/South - Parel, Sewri', city: 'Mumbai', pendingCount: 12 },
  { id: 'G/N', name: 'Ward G/North - Dadar, Dharavi', city: 'Mumbai', pendingCount: 12 },
  { id: 'G/S', name: 'Ward G/South - Worli, Lower Parel', city: 'Mumbai', pendingCount: 12 },
  { id: 'H/E', name: 'Ward H/East - Santacruz East, Kalina', city: 'Mumbai', pendingCount: 12 },
  { id: 'H/W', name: 'Ward H/West - Bandra West', city: 'Mumbai', pendingCount: 12 },
  { id: 'K/E', name: 'Ward K/East - Andheri East', city: 'Mumbai', pendingCount: 12 },
  { id: 'K/W', name: 'Ward K/West - Andheri West', city: 'Mumbai', pendingCount: 12 },
  { id: 'P/N', name: 'Ward P/North - Malad', city: 'Mumbai', pendingCount: 12 },
  { id: 'P/S', name: 'Ward P/South - Goregaon', city: 'Mumbai', pendingCount: 12 },
  { id: 'R/C', name: 'Ward R/Central - Borivali', city: 'Mumbai', pendingCount: 12 },
  { id: 'R/N', name: 'Ward R/North - Dahisar', city: 'Mumbai', pendingCount: 12 },
  { id: 'R/S', name: 'Ward R/South - Kandivali', city: 'Mumbai', pendingCount: 12 },
  { id: 'L', name: 'Ward L - Kurla, Sakinaka', city: 'Mumbai', pendingCount: 12 },
  { id: 'M/E', name: 'Ward M/East - Govandi, Mankhurd', city: 'Mumbai', pendingCount: 12 },
  { id: 'M/W', name: 'Ward M/West - Chembur', city: 'Mumbai', pendingCount: 12 },
  { id: 'N', name: 'Ward N - Ghatkopar', city: 'Mumbai', pendingCount: 12 },
  { id: 'S', name: 'Ward S - Bhandup, Vikhroli', city: 'Mumbai', pendingCount: 12 },
  { id: 'T', name: 'Ward T - Mulund', city: 'Mumbai', pendingCount: 12 },
  { id: 'TMC-1', name: 'Naupada - Kopri', city: 'Thane', pendingCount: 4 },
  { id: 'TMC-2', name: 'Uthalsar', city: 'Thane', pendingCount: 4 },
  { id: 'TMC-3', name: 'Majiwada - Manpada', city: 'Thane', pendingCount: 4 },
  { id: 'TMC-4', name: 'Vartak Nagar', city: 'Thane', pendingCount: 4 },
  { id: 'TMC-5', name: 'Wagle Estate', city: 'Thane', pendingCount: 4 },
  { id: 'TMC-6', name: 'Lokmanya Nagar - Savarkar Nagar', city: 'Thane', pendingCount: 4 },
  { id: 'TMC-7', name: 'Kalwa', city: 'Thane', pendingCount: 4 },
  { id: 'TMC-8', name: 'Mumbra', city: 'Thane', pendingCount: 4 },
  { id: 'TMC-9', name: 'Diva', city: 'Thane', pendingCount: 4 },
  { id: 'NMMC-1', name: 'Belapur', city: 'Navi Mumbai', pendingCount: 12 },
  { id: 'NMMC-2', name: 'Nerul', city: 'Navi Mumbai', pendingCount: 12 },
  { id: 'NMMC-3', name: 'Turbhe', city: 'Navi Mumbai', pendingCount: 12 },
  { id: 'NMMC-4', name: 'Vashi', city: 'Navi Mumbai', pendingCount: 12 },
  { id: 'NMMC-5', name: 'Kopar Khairane', city: 'Navi Mumbai', pendingCount: 12 },
  { id: 'NMMC-6', name: 'Ghansoli', city: 'Navi Mumbai', pendingCount: 12 },
  { id: 'NMMC-7', name: 'Airoli', city: 'Navi Mumbai', pendingCount: 12 },
  { id: 'NMMC-8', name: 'Digha', city: 'Navi Mumbai', pendingCount: 12 },
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
  {
    id: 'CF-1025',
    wardId: 'v11',
    location: 'Palm Beach Road',
    city: 'Navi Mumbai',
    coordinates: { x: 45, y: 55, lat: 19.0700, lng: 72.9980 },
    severity: 'Medium',
    status: 'AI Verification',
    description: 'Pothole on Palm Beach Road causing traffic slowdowns near the junction.',
    reportedDate: '2026-09-15',
    assignedDate: '2026-09-16',
    deadline: '2026-09-30',
    contractor: 'Navi Mumbai Infra',
    beforeImage: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=400&q=80'
  }
];

export function getCasesByWard(wardId: string | 'all'): PotholeCase[] {
  if (wardId === 'all') return cases;
  return cases.filter((c) => c.wardId === wardId);
}

export function getWardById(wardId: string): Ward | undefined {
  return wards.find((w) => w.id === wardId);
}
