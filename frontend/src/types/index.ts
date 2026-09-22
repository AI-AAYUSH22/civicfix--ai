export type Severity = 'Low' | 'Medium' | 'High';

export type CivicStatus =
  | 'REPORTED'
  | 'VALIDATED'
  | 'ASSIGNED'
  | 'GROUND_LOCKED'
  | 'REPAIRING'
  | 'VERIFICATION'
  | 'REPAIRED_PENDING_VAL'
  | 'FLAGGED_ANOMALY'
  | 'VERIFIED_CLOSED'
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
  | 'Ground Locked'
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
  city: 'Mumbai' | 'Thane' | 'Navi Mumbai';
  pendingCount: number;
}

export interface VerificationCheck {
  label: string;
  passed: boolean;
  detail: string;
}

export interface RepairVerification {
  status: 'Verified' | 'Needs Review' | 'Not Verified' | 'VERIFIED_CLOSED' | 'FLAGGED_ANOMALY';
  score?: number; // 0-100
  checks: VerificationCheck[];
  summary?: string;
  verifiedAt?: string;
}

export interface ExpenseMemoItem {
  id: string;
  case_id: string;
  work_order_id: string;
  ward_id: string;
  material_cost: number;
  labor_cost: number;
  machinery_cost: number;
  total_amount: number;
  asphalt_tonnage?: number;
  patch_area_sqm?: number;
  memo_hash: string;
  payment_status: 'APPROVED' | 'HOLD_PENDING_CV' | 'DISBURSED' | 'SUBMITTED';
  ai_verified: boolean;
  submitted_at?: string;
  approved_at?: string;
}

export interface PotholeCase {
  id: string;
  wardId: string;
  location: string;
  landmark?: string;
  city: 'Mumbai' | 'Thane' | 'Navi Mumbai';
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
  channel?: 'APP' | 'WHATSAPP' | 'REDDIT';
  expenseMemo?: ExpenseMemoItem;
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
  contractorId?: string;
  beforePhotoCaptured?: boolean;
  afterPhotoCaptured?: boolean;
  beforePhotoUrl?: string;
  afterPhotoUrl?: string;
  citizenPhotoUrl?: string;
  coordinates?: { lat: number; lng: number };
}

export interface DashboardStats {
  totalActive: number;
  pendingVerification: number;
  underRepair: number;
  resolvedThisMonth: number;
}

export type AppSurface = 'landing' | 'login' | 'citizen' | 'contractor' | 'municipal' | 'showcase' | 'evidence' | 'verification';
