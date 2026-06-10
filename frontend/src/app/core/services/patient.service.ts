import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RegisterPatientRequest, PatientResponse, PatientSearchDto, PagedPatientResponse } from '../models/patient.model';

@Injectable({ providedIn: 'root' })
export class PatientService {
  private readonly apiUrl = `${environment.apiUrl}/Patient`;

  constructor(private http: HttpClient) {}

  searchPatients(dto: PatientSearchDto = {}): Observable<any> {
    let params = new HttpParams();
    if (dto.name)       params = params.set('name', dto.name);
    if (dto.status)     params = params.set('status', dto.status);
    if (dto.pageNumber) params = params.set('pageNumber', dto.pageNumber);
    if (dto.pageSize)   params = params.set('pageSize', dto.pageSize ?? 10);
    return this.http.get<any>(this.apiUrl, { params });
  }

  getPatientById(id: number): Observable<PatientResponse> {
    return this.http.get<PatientResponse>(`${this.apiUrl}/${id}`);
  }

  registerPatient(dto: RegisterPatientRequest): Observable<any> {
    return this.http.post<any>(this.apiUrl, dto);
  }

  updatePatient(id: number, dto: Partial<RegisterPatientRequest>): Observable<any> {
    // PUT returns { message: '...' } JSON — keep default parse.
    return this.http.put<any>(`${this.apiUrl}/${id}`, dto);
  }

  deactivatePatient(id: number): Observable<string> {
    // Backend returns `Ok(result.Message)` — plain text, not JSON.
    // Without responseType:'text' Angular tries JSON.parse and throws,
    // which makes successful deactivates look like failures in the UI.
    return this.http.patch(`${this.apiUrl}/${id}/deactivate`, {}, { responseType: 'text' });
  }
}
