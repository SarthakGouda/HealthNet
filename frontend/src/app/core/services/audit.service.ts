import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreateAuditRequest,
  UpdateAuditRequest,
  AuditListDto,
  AuditFilterDto
} from '../models/audit.model';

@Injectable({ providedIn: 'root' })
export class AuditService {
  private readonly apiUrl = `${environment.apiUrl}/Audit`;

  constructor(private http: HttpClient) {}

  createAudit(dto: CreateAuditRequest): Observable<any> {
    return this.http.post<any>(this.apiUrl, dto);
  }

  getAudits(filter: AuditFilterDto = {}): Observable<AuditListDto[]> {
    let params = new HttpParams();
    if (filter.auditId   != null) params = params.set('auditId',   filter.auditId);
    if (filter.officerId != null) params = params.set('officerId', filter.officerId);
    if (filter.scope)             params = params.set('scope',     filter.scope);
    if (filter.findings)          params = params.set('findings',  filter.findings);
    if (filter.date)              params = params.set('date',      filter.date);
    return this.http.get<AuditListDto[]>(this.apiUrl, { params });
  }

  getAuditById(id: number): Observable<AuditListDto> {
    return this.http.get<AuditListDto>(`${this.apiUrl}/${id}`);
  }

  updateAudit(id: number, dto: UpdateAuditRequest): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, dto, { responseType: 'text' });
  }

  deleteAudit(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, { responseType: 'text' });
  }

  closeAudit(id: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}`, {}, { responseType: 'text' });
  }
}
