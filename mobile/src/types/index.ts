export type CivicStatus =
  | 'REPORTED'
  | 'ASSIGNED'
  | 'GROUND_LOCKED'
  | 'REPAIRING'
  | 'REPAIRED_PENDING_VAL'
  | 'VERIFIED_CLOSED'
  | 'FLAGGED_ANOMALY'
  | 'NEEDS_REVIEW'
  | 'CLOSED';

export type Severity = 'Low' | 'Medium' | 'High';

export interface PotholeCase {
  id: string;
  wardId: string;
  location: string;
  landmark?: string;
  severity: Severity;
  status: CivicStatus;
  description: string;
  reportedDate: string;
  contractor?: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export interface WorkOrder {
  id: string;
  caseId: string;
  title: string;
  location: string;
  ward: string;
  priority: 'High' | 'Medium' | 'Low';
  status: string;
  dueDate: string;
  beforePhotoCaptured?: boolean;
  afterPhotoCaptured?: boolean;
  coordinates: {
    lat: number;
    lng: number;
  };
}
