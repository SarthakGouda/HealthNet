import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreateOutbreakRequest,
  CreateOutbreakResponse,
  GetOutbreakResponse,
  OutbreakAnalyticsRequest,
  OutbreakAnalyticsResponse,
  UpdateOutbreakRequest,
  UpdateOutbreakResponse,
  DeleteOutbreakResponse
} from '../models/Outbreak';
import {
  AddEpidemiologyRequest,
  EpidemiologyMutationResponse,
  EpidemiologyResponse,
  UpdateEpidemiologyRequest
} from '../models/epidemiology.model';

@Injectable({ providedIn: 'root' })
export class OutbreakService {

  private readonly baseUrl = `${environment.apiUrl}/OutbreakMonitoring`;
  private readonly reportingUrl = `${environment.apiUrl}/ReportingAndAnalytics`;

  constructor(private http: HttpClient) {}

  // ── Outbreak ────────────────────────────────────────────────
  createOutbreak(request: CreateOutbreakRequest): Observable<CreateOutbreakResponse> {
    return this.http.post<CreateOutbreakResponse>(this.baseUrl, request);
  }

  getAllActiveOutbreaks(): Observable<GetOutbreakResponse[]> {
    return this.http.get<GetOutbreakResponse[]>(`${this.baseUrl}/active`);
  }

  getOutbreakById(id: number): Observable<GetOutbreakResponse> {
    return this.http.get<GetOutbreakResponse>(`${this.baseUrl}/${id}`);
  }

  updateOutbreak(id: number, request: UpdateOutbreakRequest): Observable<UpdateOutbreakResponse> {
    return this.http.patch<UpdateOutbreakResponse>(`${this.baseUrl}/${id}`, request);
  }

  deleteOutbreak(id: number): Observable<DeleteOutbreakResponse> {
    return this.http.delete<DeleteOutbreakResponse>(`${this.baseUrl}/${id}`);
  }

  getOutbreakAnalytics(filters: OutbreakAnalyticsRequest): Observable<OutbreakAnalyticsResponse> {
    let params = new HttpParams();
    if (filters.startDate) params = params.set('startDate', filters.startDate);
    if (filters.endDate)   params = params.set('endDate',   filters.endDate);
    if (filters.status)    params = params.set('status',    filters.status);
    if (filters.region)    params = params.set('region',    filters.region);
    return this.http.get<OutbreakAnalyticsResponse>(`${this.reportingUrl}/outbreaks`, { params });
  }

  // ── Epidemiology ────────────────────────────────────────────
  addEpidemiology(outbreakId: number, request: AddEpidemiologyRequest): Observable<EpidemiologyMutationResponse> {
    return this.http.put<EpidemiologyMutationResponse>(
      `${this.baseUrl}/${outbreakId}/epidemiology`,
      request
    );
  }

  getAllEpidemiology(): Observable<EpidemiologyResponse[]> {
    return this.http.get<EpidemiologyResponse[]>(`${this.baseUrl}/epidemiology`);
  }

  getEpidemiologyById(epiId: number): Observable<EpidemiologyResponse> {
    return this.http.get<EpidemiologyResponse>(`${this.baseUrl}/epidemiology/${epiId}`);
  }

  updateEpidemiology(epiId: number, request: UpdateEpidemiologyRequest): Observable<EpidemiologyMutationResponse> {
    return this.http.patch<EpidemiologyMutationResponse>(
      `${this.baseUrl}/epidemiology/${epiId}`,
      request
    );
  }

  deleteEpidemiology(epiId: number): Observable<EpidemiologyMutationResponse> {
    return this.http.delete<EpidemiologyMutationResponse>(`${this.baseUrl}/epidemiology/${epiId}`);
  }
}
