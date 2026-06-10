import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CaseAnalyticsResponse, PatientAnalyticsResponse, ComplianceMetricsResponse, OutbreakAnalyticsResponse, EpidemiologicalAnalyticsResponse } from '../models/analytics.model';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly apiUrl = `${environment.apiUrl}/ReportingAndAnalytics`;

  constructor(private http: HttpClient) {}

  getCaseAnalytics(filters: any = {}): Observable<CaseAnalyticsResponse> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params = params.set(k, v as string); });
    return this.http.get<CaseAnalyticsResponse>(`${this.apiUrl}/cases`, { params });
  }

  getPatientAnalytics(filters: any = {}): Observable<PatientAnalyticsResponse> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params = params.set(k, v as string); });
    return this.http.get<PatientAnalyticsResponse>(`${this.apiUrl}/patients`, { params });
  }

  getComplianceMetrics(filters: any = {}): Observable<ComplianceMetricsResponse> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params = params.set(k, v as string); });
    return this.http.get<ComplianceMetricsResponse>(`${this.apiUrl}/compliance`, { params });
  }

  getOutbreakAnalytics(filters: any = {}): Observable<OutbreakAnalyticsResponse> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params = params.set(k, v as string); });
    return this.http.get<OutbreakAnalyticsResponse>(`${this.apiUrl}/outbreaks`, { params });
  }

  getEpidemiologicalAnalytics(filters: any = {}): Observable<EpidemiologicalAnalyticsResponse> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params = params.set(k, v as string); });
    return this.http.get<EpidemiologicalAnalyticsResponse>(`${this.apiUrl}/epidemiology`, { params });
  }
}
