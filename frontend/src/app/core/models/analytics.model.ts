export interface CaseAnalyticsResponse {
  success: boolean;
  message?: string;
  totalCases: number;
  activecases: number;
  inActiveCases: number;
  resolvedCasesPercentage: number;
  data?: any[];
}

export interface PatientAnalyticsResponse {
  success: boolean;
  message?: string;
  totalPatients: number;
  activePatients: number;
  inActivePatients: number;
  data: any[];
}

export interface ComplianceMetricsResponse {
  success: boolean;
  message?: string;
  completeDocPercentage: number;
  totalCompliances: number;
  compliantRecords: number;
  nonCompliantRecords: number;
  partiallyCompliantRecords: number;
  pendingReviewRecords: number;
  data?: any[];
}

export interface OutbreakAnalyticsResponse {
  success: boolean;
  message?: string;
  totalOutbreaks: number;
  activeOutbreaks: number;
  resolvedOutbreaks: number;
  generatedDate: string;
  data: any[];
}

export interface EpidemiologicalAnalyticsResponse {
  success: boolean;
  message?: string;
  totalEpidemiologies: number;
  activeEpidemiologies: number;
  activeOutbreaks: number;
  inActiveOutbreaks: number;
  epidemiologyResponses?: any[];
}
