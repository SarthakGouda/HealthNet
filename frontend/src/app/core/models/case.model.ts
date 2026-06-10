export interface CreateCaseRequest {
  reportId: number;
  diagnosis: string;
  status?: boolean;
}

export interface CaseListDto {
  caseId: number;
  citizenId: number;
  citizenName?: string;
  doctorId: number;
  doctorName?: string;
  diagnosis: string;
  date: string;
  status: boolean;
}

export interface UpdateCaseDiagnosisRequest {
  diagnosis: string;
}
