import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  SubmitSymptomReportRequest,
  SubmitSymptomReportResponse,
  SymptomReportResponse,
  PagedResponse
} from '../models/symptom-report';

@Injectable({ providedIn: 'root' })
export class SymptomReportService {

  private readonly apiUrl = `${environment.apiUrl}/CitizenSymptomReporting`;

  constructor(private http: HttpClient) { }

  submitReport(request: SubmitSymptomReportRequest): Observable<SubmitSymptomReportResponse> {
    return this.http.post<SubmitSymptomReportResponse>(this.apiUrl, request);
  }

  getMyReports(pageNumber = 1, pageSize = 10): Observable<PagedResponse<SymptomReportResponse>> {
    const params = new HttpParams()
      .set('pageNumber', pageNumber)
      .set('pageSize', pageSize);
    return this.http.get<PagedResponse<SymptomReportResponse>>(`${this.apiUrl}/mine`, { params });
  }

  getAllReports(queryParams: Record<string, unknown> = {}): Observable<any> {
    let p = new HttpParams();
    Object.entries(queryParams).forEach(([k, v]) => {
      if (v != null && v !== '') p = p.set(k, v as string);
    });
    return this.http.get<any>(this.apiUrl, { params: p });
  }

  updateReportStatus(id: number, status: string | number): Observable<any> {
    const map: Record<string, number> = { Submitted: 1, UnderReview: 2, Reviewed: 3, Closed: 4 };
    const numeric = typeof status === 'number' ? status : (map[status] ?? 1);
    // Backend returns plain-text ("Status updated successfully."), not JSON —
    // so we have to set responseType: 'text' or HttpClient throws a parse error.
    return this.http.patch(`${this.apiUrl}/${id}`, {
      Status: numeric,
      status: numeric
    }, { responseType: 'text' });
  }

  deleteReport(id: number): Observable<any> {
    // Backend returns a plain JSON object { message: "..." } — keep default parsing.
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}
