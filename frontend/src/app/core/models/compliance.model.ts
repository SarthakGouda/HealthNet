export interface CreateComplianceRecordRequest {
  entityId: number;
  type: string;
  result: string;
  notes: string;
}

export interface ComplianceRecordListDto {
  complianceId: number;
  entityId: number;
  type: string;
  result: string;
  date: string;
  notes: string;
  isDeleted: boolean;
}

export interface ComplianceRecordFilter {
  type?: string;
  result?: string;
  entityId?: number;
}

export interface UpdateComplianceRecordRequest {
  result: string;
  notes: string;
}
