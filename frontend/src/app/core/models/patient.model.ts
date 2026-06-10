export interface RegisterPatientRequest {
  name: string;
  dob: string;
  gender: string;
  address: string;
  contactInfo: string;
}

export interface PatientResponse {
  patientId: number;
  name: string;
  dob: string;
  gender: string;
  address: string;
  contactInfo: string;
  status: string;
}

export interface PatientSearchDto {
  name?: string;
  status?: string;
  pageNumber?: number;
  pageSize?: number;
}

export interface PagedPatientResponse {
  items: PatientResponse[];
  totalRecords: number;
  pageNumber: number;
  pageSize: number;
}
