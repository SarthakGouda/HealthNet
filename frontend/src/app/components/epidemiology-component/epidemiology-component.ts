import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { OutbreakService } from '../../core/services/outbreak-service';
import { AuthService } from '../../core/services/auth-service';
import { EpidemiologyResponse } from '../../core/models/epidemiology.model';
import { GetOutbreakResponse } from '../../core/models/Outbreak';

/** Shape of the MetricsJSON payload the backend stores.
 *  Keys must be exactly: cases, recoveries, RtNow. */
interface MetricsForm {
  cases:      number | null;   // Total cases for the period
  recoveries: number | null;   // Total recoveries
  RtNow:      number | null;   // Effective reproduction number at time of report
}

@Component({
  selector: 'app-epidemiology',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './epidemiology-component.html',
  styleUrl: './epidemiology-component.css'
})
export class EpidemiologyComponent implements OnInit {

  records: EpidemiologyResponse[] = [];
  filtered: EpidemiologyResponse[] = [];
  outbreaks: GetOutbreakResponse[] = [];
  outbreakMap: Record<number, GetOutbreakResponse> = {};

  isLoading = false;
  error = '';
  success = '';
  role = '';

  outbreakFilter: '' | number = '';
  statusFilter: '' | 'Active' | 'Inactive' = '';
  search = '';

  showForm = false;
  isSubmitting = false;
  editingId: number | null = null;
  detail: EpidemiologyResponse | null = null;

  createForm: FormGroup;
  editForm: FormGroup;
  todayISO = new Date().toISOString().split('T')[0];

  constructor(
    private outbreakService: OutbreakService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder
  ) {
    // Backend MetricsJSON must contain exactly: cases, recoveries, RtNow.
    //   cases / recoveries — non-negative integers, both required.
    //   RtNow              — effective reproduction number, decimal, ≥0.
    this.createForm = this.fb.group({
      outbreakId: [null,          [Validators.required, Validators.min(1)]],
      date:       [this.todayISO, Validators.required],
      cases:      [null,          [Validators.required, Validators.min(0)]],
      recoveries: [null,          [Validators.required, Validators.min(0)]],
      RtNow:      [null,          [Validators.required, Validators.min(0)]]
    });
    this.editForm = this.fb.group({
      date:       [this.todayISO, Validators.required],
      status:     [true,           Validators.required],
      cases:      [null,          [Validators.required, Validators.min(0)]],
      recoveries: [null,          [Validators.required, Validators.min(0)]],
      RtNow:      [null,          [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    this.role = this.authService.getUserRole();
    const preselect = this.route.snapshot.queryParamMap.get('outbreakId');
    if (preselect) {
      this.createForm.patchValue({ outbreakId: Number(preselect) });
      this.showForm = true;
    }
    this.loadOutbreaks();
    this.loadAll();
  }

  get canMutate(): boolean { return ['Admin', 'Doctor', 'Public Health Officer'].includes(this.role); }

  loadOutbreaks(): void {
    this.outbreakService.getAllActiveOutbreaks().subscribe({
      next: (rows) => {
        this.outbreaks = rows || [];
        this.outbreakMap = {};
        this.outbreaks.forEach(o => this.outbreakMap[o.outbreakId] = o);
      },
      error: () => { /* non-fatal */ }
    });
  }

  loadAll(): void {
    this.isLoading = true;
    this.error = '';
    this.outbreakService.getAllEpidemiology().subscribe({
      next: (rows) => {
        // Newest first — epiId descending
        this.records = [...(rows || [])].sort((a: any, b: any) => (b.epiId ?? 0) - (a.epiId ?? 0));
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load epidemiology records.';
        this.isLoading = false;
      }
    });
  }

  applyFilters(): void {
    const q = (this.search || '').toLowerCase().trim();
    this.filtered = this.records.filter(r => {
      const matchesOutbreak = !this.outbreakFilter || r.outbreakId === Number(this.outbreakFilter);
      const matchesStatus   = !this.statusFilter
        || (this.statusFilter === 'Active'   && r.status)
        || (this.statusFilter === 'Inactive' && !r.status);
      const matchesText = !q
        || (r.metricsJSON || '').toLowerCase().includes(q)
        || (this.outbreakMap[r.outbreakId]?.disease  || '').toLowerCase().includes(q)
        || (this.outbreakMap[r.outbreakId]?.location || '').toLowerCase().includes(q);
      return matchesOutbreak && matchesStatus && matchesText;
    });
  }

  resetFilters(): void {
    this.search = ''; this.outbreakFilter = ''; this.statusFilter = '';
    this.applyFilters();
  }

  // ── Create ───────────────────────────────────────────────────
  openCreate(): void {
    this.editingId = null;
    this.createForm.reset({ outbreakId: null, date: this.todayISO });
    this.showForm = true;
  }

  onCreate(): void {
    if (this.createForm.invalid) { this.createForm.markAllAsTouched(); return; }
    const v = this.createForm.value;
    const metrics = this.buildMetricsJson(v);
    this.isSubmitting = true;
    // New epi records default to status:true (active monitoring) — matches the backend default.
    this.outbreakService.addEpidemiology(Number(v.outbreakId), {
      metricsJSON: metrics,
      date: new Date(v.date).toISOString(),
      status: true
    }).subscribe({
      next: (res) => {
        this.success = res?.message || `Epidemiology #${res?.epiId ?? ''} created.`;
        this.isSubmitting = false;
        this.showForm = false;
        this.loadAll();
        setTimeout(() => this.success = '', 3000);
      },
      error: (err) => {
        this.error = err.error?.message || err.error || 'Failed to create epidemiology.';
        this.isSubmitting = false;
      }
    });
  }

  // ── Update ───────────────────────────────────────────────────
  startEdit(r: EpidemiologyResponse): void {
    this.editingId = r.epiId;
    const m = this.parseMetrics(r.metricsJSON);
    this.editForm.patchValue({
      date:       (r.date || this.todayISO).substring(0, 10),
      status:     !!r.status,
      cases:      m.cases,
      recoveries: m.recoveries,
      RtNow:      m.RtNow
    });
    this.showForm = false;
  }

  cancelEdit(): void { this.editingId = null; }

  onSaveEdit(): void {
    if (!this.editingId || this.editForm.invalid) { this.editForm.markAllAsTouched(); return; }
    const v = this.editForm.value;
    this.isSubmitting = true;
    this.outbreakService.updateEpidemiology(this.editingId, {
      metricsJSON: this.buildMetricsJson(v),
      date: new Date(v.date).toISOString(),
      status: !!v.status
    }).subscribe({
      next: (res) => {
        this.success = res?.message || 'Epidemiology updated.';
        this.editingId = null;
        this.isSubmitting = false;
        this.loadAll();
        setTimeout(() => this.success = '', 3000);
      },
      error: (err) => {
        this.error = err.error?.message || err.error || 'Update failed.';
        this.isSubmitting = false;
      }
    });
  }

  // ── View ─────────────────────────────────────────────────────
  view(epiId: number): void {
    this.outbreakService.getEpidemiologyById(epiId).subscribe({
      next: (r) => { this.detail = r; },
      error: (err) => { this.error = err.error?.message || 'Not found.'; }
    });
  }
  closeDetail(): void { this.detail = null; }

  // ── Delete ───────────────────────────────────────────────────
  remove(r: EpidemiologyResponse): void {
    if (!confirm(`Delete epidemiology record #${r.epiId}?`)) return;
    this.outbreakService.deleteEpidemiology(r.epiId).subscribe({
      next: (res) => { this.success = res?.message || 'Deleted.'; this.loadAll(); setTimeout(() => this.success = '', 3000); },
      error: (err) => { this.error = err.error?.message || err.error || 'Delete failed.'; }
    });
  }

  // ── Helpers ──────────────────────────────────────────────────
  private buildMetricsJson(v: any): string {
    // Backend column expects exactly these three keys.
    const m: MetricsForm = {
      cases:      v.cases      != null ? Number(v.cases)      : null,
      recoveries: v.recoveries != null ? Number(v.recoveries) : null,
      RtNow:      v.RtNow      != null ? Number(v.RtNow)      : null
    };
    return JSON.stringify(m);
  }

  parseMetrics(json: string | undefined): MetricsForm {
    const blank: MetricsForm = { cases: null, recoveries: null, RtNow: null };
    if (!json) return blank;
    try {
      const o = JSON.parse(json);
      return {
        // Accept old-shape (infectedCount/recoveredCount) too, in case some rows pre-date this schema.
        cases:      o.cases      ?? o.infectedCount  ?? null,
        recoveries: o.recoveries ?? o.recoveredCount ?? null,
        RtNow:      o.RtNow      ?? o.rtNow          ?? null
      };
    } catch { return blank; }
  }

  outbreakLabel(id: number): string {
    const o = this.outbreakMap[id];
    return o ? `#${o.outbreakId} · ${o.disease} (${o.location})` : `Outbreak #${id}`;
  }

  badge(active: boolean): string { return active ? 'badge-active' : 'badge-inactive'; }
  label(active: boolean): string { return active ? 'Monitoring' : 'Inactive'; }
  formatDate(d: string): string { return d ? new Date(d).toLocaleDateString('en-GB') : '—'; }
  metricsPreview(json: string): string {
    const m = this.parseMetrics(json);
    const parts: string[] = [];
    if (m.cases      != null) parts.push(`Cases: ${m.cases}`);
    if (m.recoveries != null) parts.push(`Recoveries: ${m.recoveries}`);
    if (m.RtNow      != null) parts.push(`Rt: ${m.RtNow}`);
    return parts.join(' · ') || '—';
  }
}
