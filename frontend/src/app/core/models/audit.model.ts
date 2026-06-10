export interface CreateAuditRequest {
  scope: string;
  findings: string;
  status?: boolean;
}

export interface UpdateAuditRequest {
  scope: string;
  findings: string;
}

export interface AuditListDto {
  auditId: number;
  officerId: number;
  officerName?: string;
  scope: string;
  findings: string;
  date: string;
  status: boolean;
}

export interface AuditFilterDto {
  auditId?: number;
  officerId?: number;
  scope?: string;
  findings?: string;
  date?: string;
}
