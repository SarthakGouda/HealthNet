import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MedicalRecordRequest, MedicalRecordGetDto } from '../models/medical-record.model';

@Injectable({ providedIn: 'root' })
export class MedicalRecordService {
  private readonly apiUrl = `${environment.apiUrl}/MedicalRecord`;

  constructor(private http: HttpClient) {}

  addRecord(patientId: number, dto: MedicalRecordRequest): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${patientId}/records`, dto);
  }

  getRecords(patientId: number): Observable<MedicalRecordGetDto[]> {
    return this.http.get<MedicalRecordGetDto[]>(`${this.apiUrl}/${patientId}/records`);
  }

  updateRecord(recordId: number, dto: MedicalRecordRequest): Observable<any> {
    return this.http.put(`${this.apiUrl}/${recordId}`, dto, { responseType: 'text' });
  }

  deactivateRecord(recordId: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${recordId}/close`, {}, { responseType: 'text' });
  }
}
