import { Injectable, inject } from '@angular/core';
import { Observable, of, shareReplay, map, catchError } from 'rxjs';
import { PatientService } from './patient.service';
import { UserService } from './user/user-service';
import { CaseService } from './case.service';
import { LabTestService } from './lab-test.service';
import { OutbreakService } from './outbreak-service';
import { SymptomReportService } from './symptom-report';

/**
 * A single dropdown option — `value` is the ID, `label` is what the user sees,
 * `sub` is an optional secondary line (date / status / role).
 */
export interface LookupOption {
  value: number;
  label: string;
  sub?: string;
  /** Free-form bag for extra context (e.g. citizenId on symptom-report options) */
  meta?: Record<string, any>;
}

/**
 * Loads & caches lookup lists so every component can drop in a dropdown
 * instead of asking the user to type an ID.
 *
 * Cache lifetime: until `refresh(kind)` is called. Lists are usually small
 * enough to keep in memory for a session.
 */
@Injectable({ providedIn: 'root' })
export class LookupService {

  private patientService    = inject(PatientService);
  private userService       = inject(UserService);
  private caseService       = inject(CaseService);
  private labTestService    = inject(LabTestService);
  private outbreakService   = inject(OutbreakService);
  private symptomService    = inject(SymptomReportService);

  // ── cached observables ─────────────────────────────────────────
  private _patients$?:   Observable<LookupOption[]>;
  private _techs$?:      Observable<LookupOption[]>;
  private _users$?:      Observable<LookupOption[]>;
  private _cases$?:      Observable<LookupOption[]>;
  private _labTests$?:   Observable<LookupOption[]>;
  private _outbreaks$?:  Observable<LookupOption[]>;
  private _reports$?:    Observable<LookupOption[]>;

  // ── Patients (active) ──────────────────────────────────────────
  patients(): Observable<LookupOption[]> {
    if (!this._patients$) {
      this._patients$ = this.patientService.searchPatients({ pageSize: 200 }).pipe(
        map((res: any) => {
          const list = Array.isArray(res) ? res : (res?.items ?? res?.data ?? []);
          return list.map((p: any) => ({
            value: p.patientId,
            label: `#${p.patientId} · ${p.name}`,
            sub: `${p.gender || ''} · ${p.status || ''}`.trim()
          }));
        }),
        catchError(() => of([])),
        shareReplay(1)
      );
    }
    return this._patients$;
  }

  // ── All users (for admin/officer pickers) ──────────────────────
  private users(): Observable<LookupOption[]> {
    if (!this._users$) {
      this._users$ = this.userService.getAllUsers().pipe(
        map((res: any) => {
          const list = Array.isArray(res) ? res : (res?.data ?? []);
          return list.map((u: any) => ({
            value: u.userId,
            label: `#${u.userId} · ${u.name}`,
            sub: `${u.roleName || ''}`,
            roleName: u.roleName,
            status: u.status
          })) as any[];
        }),
        catchError(() => of([])),
        shareReplay(1)
      );
    }
    return this._users$;
  }

  // ── Lab technicians only ───────────────────────────────────────
  technicians(): Observable<LookupOption[]> {
    if (!this._techs$) {
      this._techs$ = this.users().pipe(
        map((users: any[]) => users
          .filter(u => (u.roleName || '').trim() === 'Lab Technician' && u.status !== false)
          .map(u => ({ value: u.value, label: u.label, sub: u.sub }))
        ),
        shareReplay(1)
      );
    }
    return this._techs$;
  }

  // ── Cases ──────────────────────────────────────────────────────
  cases(): Observable<LookupOption[]> {
    if (!this._cases$) {
      this._cases$ = this.caseService.getAllCases().pipe(
        map((res: any) => {
          const list = Array.isArray(res) ? res : (res?.data ?? res?.items ?? []);
          return list.map((c: any) => ({
            value: c.caseId,
            label: `#${c.caseId} · ${c.diagnosis || 'Case'}`,
            sub: `Citizen #${c.citizenId} · ${c.status ? 'Recovered' : 'Under Treatment'}`,
            meta: { citizenId: c.citizenId ?? null }
          }));
        }),
        catchError(() => of([])),
        shareReplay(1)
      );
    }
    return this._cases$;
  }

  // ── Lab tests ──────────────────────────────────────────────────
  labTests(): Observable<LookupOption[]> {
    if (!this._labTests$) {
      this._labTests$ = this.labTestService.getLabTests().pipe(
        map((res: any) => {
          const list = res?.data ?? res?.items ?? [];
          return list.map((t: any) => ({
            value: t.testId,
            label: `#${t.testId} · ${t.type}`,
            sub: `Patient #${t.patientId} · ${t.status ? 'Completed' : 'Pending'}`
          }));
        }),
        catchError(() => of([])),
        shareReplay(1)
      );
    }
    return this._labTests$;
  }

  // ── Outbreaks (active) ─────────────────────────────────────────
  outbreaks(): Observable<LookupOption[]> {
    if (!this._outbreaks$) {
      this._outbreaks$ = this.outbreakService.getAllActiveOutbreaks().pipe(
        map((rows: any[]) => (rows || []).map(o => ({
          value: o.outbreakId,
          label: `#${o.outbreakId} · ${o.disease}`,
          sub: `${o.location} · ${o.severity}`
        }))),
        catchError(() => of([])),
        shareReplay(1)
      );
    }
    return this._outbreaks$;
  }

  // ── Symptom reports ────────────────────────────────────────────
  symptomReports(): Observable<LookupOption[]> {
    if (!this._reports$) {
      this._reports$ = this.symptomService.getAllReports({ pageNumber: 1, pageSize: 200 }).pipe(
        map((res: any) => {
          const list = res?.items ?? res?.data ?? [];
          return list.map((r: any) => ({
            value: r.reportId,
            label: `#${r.reportId} · ${r.citizenName || ('Citizen ' + r.citizenId)}`,
            sub: `${r.date ? new Date(r.date).toLocaleDateString('en-GB') : ''} · ${r.status || ''}`,
            meta: { citizenId: r.citizenId ?? null, citizenName: r.citizenName ?? null }
          }));
        }),
        catchError(() => of([])),
        shareReplay(1)
      );
    }
    return this._reports$;
  }

  /** Invalidate a cached list so the next subscriber refetches. */
  refresh(kind: 'patients' | 'technicians' | 'users' | 'cases' | 'labTests' | 'outbreaks' | 'symptomReports'): void {
    switch (kind) {
      case 'patients':       this._patients$  = undefined; break;
      case 'technicians':    this._techs$     = undefined; this._users$ = undefined; break;
      case 'users':          this._users$     = undefined; this._techs$ = undefined; break;
      case 'cases':          this._cases$     = undefined; break;
      case 'labTests':       this._labTests$  = undefined; break;
      case 'outbreaks':      this._outbreaks$ = undefined; break;
      case 'symptomReports': this._reports$   = undefined; break;
    }
  }
}
