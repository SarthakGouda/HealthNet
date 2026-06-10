export interface LabTest {
  testId: number;
  patientId: number;
  type: string;
  date: string;
  technicianId: number;
  status: boolean;
}

export interface LabTestFilter {
  type?: string;
  status?: string;
  date?: string;
}

export interface LabTestResponse {
  success: boolean;
  count: number;
  data: LabTest[];
}

export interface LabReport {
  reportId: number;
  testId: number;
  fileURI: string;
  date: string;
  status: boolean;
}

export interface LabReportResponse {
  success: boolean;
  data: {
    testId: number;
    patientId: number;
    type: string;
    date: string;
    technicianId: number;
    testStatus: boolean;
    reports: LabReport[];
  };
}

export interface CreateLabTestRequest {
  patientId: number;
  type: string;
  technicianId: number;
}

export interface CreateLabTestResponse {
  success: boolean;
  message: string;
  data: LabTest;
}

export interface UpdateLabTestRequest {
  type?: string;
  technicianId?: number;
}

export interface UpdateLabTestResponse {
  success: boolean;
  message: string;
  data: LabTest;
  patientId: number;
  type: string;
  technicianId: number;
}