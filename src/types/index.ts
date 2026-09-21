export type Severity = 'Low' | 'Medium' | 'High';

export type CivicStatus =
  | 'REPORTED'
  | 'VALIDATED'
  | 'ASSIGNED'
  | 'REPAIRING'
  | 'VERIFICATION'
  | 'VERIFIED'
  | 'NEEDS REVIEW'
  | 'NEEDS_REVIEW'
  | 'NOT VERIFIED'
  | 'NOT_VERIFIED'
  | 'REJECTED'
  | 'CLOSED'
  // Title-case / legacy mappings
  | 'Reported'
  | 'Validated'
  | 'Assigned'
  | 'Under Repair'
  | 'AI Verification'
  | 'Needs Review'
  | 'Not Verified'
  | 'Verified'
  | 'Resolved'
  | 'Closed';

export type CaseStatus = CivicStatus;

export interface Ward {
  id: string;
  name: string;
  city: 'Mumbai' | 'Thane';
  pendingCount: number;
}

export interface VerificationCheck {
  label: string;
  passed: boolean;
  detail: string;
}

export interface RepairVerification {
  status: 'Verified' | 'Needs Review' | 'Not Verified';
  score?: number; // 0-100
  checks: VerificationCheck[];
  summary?: string;
  verifiedAt?: string;
}

export interface PotholeCase {
  id: string;
  wardId: string;
  location: string;
  landmark?: string;
  city: 'Mumbai' | 'Thane';
  coordinates: { x: number; y: number; lat?: number; lng?: number };
  severity: Severity;
  status: CaseStatus;
  description: string;
  reportedDate: string;
  assignedDate?: string;
  deadline?: string;
  contractor?: string;
  contractorUnit?: string;
  beforeImage?: string;
  afterImage?: string;
  verification?: RepairVerification;
  citizenName?: string;
}

export interface WorkOrder {
  id: string;
  caseId: string;
  title: string;
  location: string;
  ward: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Assigned' | 'In Progress' | 'Evidence Submitted' | 'Verified' | 'Needs Review' | 'Not Verified' | 'Closed';
  assignedDate: string;
  dueDate: string;
  assignedContractor: string;
  beforePhotoCaptured?: boolean;
  afterPhotoCaptured?: boolean;
  coordinates?: { lat: number; lng: number };
}

export interface DashboardStats {
  totalActive: number;
  pendingVerification: number;
  underRepair: number;
  resolvedThisMonth: number;
}

export type AppSurface = 'citizen' | 'contractor' | 'municipal' | 'showcase' | 'evidence' | 'verification';
