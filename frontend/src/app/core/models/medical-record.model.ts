export interface MedicalRecordRequest {
  diagnosis: string;
  treatmentPlan: string;
  date: string;
}

export interface MedicalRecordGetDto {
  recordId: number;
  patientId: number;
  doctorId: number;
  doctorName?: string;
  diagnosis: string;
  treatmentPlan: string;
  date: string;
  status: string;
}
