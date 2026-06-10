export interface AddEpidemiologyRequest {
  metricsJSON: string;
  date: string;
  status: boolean;
}

export interface UpdateEpidemiologyRequest {
  metricsJSON: string;
  date: string;
  status: boolean;
}

export interface EpidemiologyResponse {
  epiId: number;
  outbreakId: number;
  metricsJSON: string;
  date: string;
  status: boolean;
}

export interface EpidemiologyMutationResponse {
  success: boolean;
  message: string;
  epiId?: number;
}

export interface EpidemiologyMetrics {
  infectedCount?: number | null;
  recoveredCount?: number | null;
  deathCount?: number | null;
  hospitalizedCount?: number | null;
  vaccinatedCount?: number | null;
  notes?: string;
}
