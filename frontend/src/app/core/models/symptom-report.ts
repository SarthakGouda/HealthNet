// What gets stored inside SymptomsJson string
export interface SymptomsJsonPayload {
  commonSymptoms: Record<string, boolean>;
  vitals: {
    temperature?: number | null;
    oxygenLevel?: number | null;
    heartRate?: number | null;
    bpSystolic?: number | null;
    bpDiastolic?: number | null;
    respiratoryRate?: number | null;
    weight?: number | null;
  };
  otherSymptoms: string;
}

// POST /api/v1/CitizenSymptomReporting
export interface SubmitSymptomReportRequest {
  symptomsJson: string;   // serialized SymptomsJsonPayload
  date: string;           // ISO datetime string
}

// Response from POST — only reportId
export interface SubmitSymptomReportResponse {
  reportId: number;
}

// Response from GET /mine
export interface SymptomReportResponse {
  reportId: number;
  citizenId?: number;
  citizenName?: string;
  symptomsJson: string;
  date: string;
  status: string;  // "Submitted" | "UnderReview" | "Reviewed" | "Closed"
}

// Paginated wrapper from backend
export interface PagedResponse<T> {
  items: T[];           
  pageNumber: number;
  pageSize: number;
  totalRecords: number;
  message?: string;
}
