import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateCaseRequest, CaseListDto, UpdateCaseDiagnosisRequest } from '../models/case.model';

@Injectable({ providedIn: 'root' })
export class CaseService {
  private readonly apiUrl = `${environment.apiUrl}/Cases`;

  constructor(private http: HttpClient) {}

  createCase(dto: CreateCaseRequest): Observable<any> {
    return this.http.post<any>(this.apiUrl, dto);
  }

  getAllCases(): Observable<CaseListDto[]> {
    return this.http.get<CaseListDto[]>(this.apiUrl);
  }

  getCaseById(id: number): Observable<CaseListDto> {
    return this.http.get<CaseListDto>(`${this.apiUrl}/${id}`);
  }

  updateCaseDiagnosis(id: number, dto: UpdateCaseDiagnosisRequest): Observable<any> {
    // Backend returns plain text "Case diagnosis updated successfully."
    return this.http.put(`${this.apiUrl}/${id}`, dto, { responseType: 'text' });
  }

  deleteCase(id: number): Observable<any> {
    // Backend returns plain text "Case marked as recovered and deleted successfully."
    return this.http.delete(`${this.apiUrl}/${id}`, { responseType: 'text' });
  }
}
