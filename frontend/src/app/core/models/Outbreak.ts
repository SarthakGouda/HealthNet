export interface CreateOutbreakRequest {
  disease: string;
  location: string;
  severity: string;
  startDate: string;
  endDate: string;
  status: boolean;
}

export interface CreateOutbreakResponse {
  success: boolean;
  message: string;
  outbreakId?: number;
}

export interface GetOutbreakResponse {
  outbreakId: number;
  disease: string;
  location: string;
  startDate: string;
  endDate: string;
  severity: string;
  status: boolean;
}

export interface UpdateOutbreakRequest {
  severity: string;
  endDate: string;
  status: boolean;
}

export interface UpdateOutbreakResponse {
  success: boolean;
  message: string;
}

export interface DeleteOutbreakResponse {
  success: boolean;
  message: string;
}

// ── Reporting & Analytics ─────────────────────────────────────
export interface OutbreakAnalyticsRequest {
  startDate?: string;
  endDate?: string;
  status?: string;   // 'Active' | 'InActive'
  region?: string;
}

export interface OutbreakAnalyticsResponse {
  success: boolean;
  message: string;
  totalOutbreaks: number;
  activeOutbreaks: number;
  resolvedOutbreaks: number;
  generatedDate: string;
  data: GetOutbreakResponse[];
}