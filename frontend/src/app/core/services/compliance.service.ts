import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateComplianceRecordRequest, ComplianceRecordFilter, UpdateComplianceRecordRequest, ComplianceRecordListDto } from '../models/compliance.model';

@Injectable({ providedIn: 'root' })
export class ComplianceService {
  private readonly apiUrl = `${environment.apiUrl}/ComplianceRecord`;

  constructor(private http: HttpClient) {}

  createRecord(dto: CreateComplianceRecordRequest): Observable<any> {
    return this.http.post<any>(this.apiUrl, dto);
  }

  getRecords(filter: ComplianceRecordFilter = {}): Observable<ComplianceRecordListDto[]> {
    let params = new HttpParams();
    if (filter.type)     params = params.set('type', filter.type);
    if (filter.result)   params = params.set('result', filter.result);
    if (filter.entityId) params = params.set('entityId', filter.entityId);
    return this.http.get<ComplianceRecordListDto[]>(this.apiUrl, { params });
  }

  updateRecord(id: number, dto: UpdateComplianceRecordRequest): Observable<any> {
    // Backend returns plain text "Compliance record updated successfully." — Angular's
    // default JSON parse would throw, which surfaces as "Update failed" in the UI.
    return this.http.put(`${this.apiUrl}/${id}`, dto, { responseType: 'text' });
  }

  deleteRecord(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, { responseType: 'text' });
  }

  getById(id: number): Observable<ComplianceRecordListDto> {
    return this.http.get<ComplianceRecordListDto>(`${this.apiUrl}/${id}`);
  }
}
