import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { combineLatest, map, Observable } from 'rxjs';
import { CaseService } from '../../core/services/case.service';
import { AuthService } from '../../core/services/auth-service';
import { CaseListDto } from '../../core/models/case.model';
import { LookupOption, LookupService } from '../../core/services/lookup.service';
import { IdPickerComponent } from '../../shared/components/id-picker/id-picker';

@Component({
  selector: 'app-cases',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, IdPickerComponent],
  templateUrl: './cases-component.html',
  styleUrl: './cases-component.css'
})
export class CasesComponent implements OnInit {
  cases: CaseListDto[] = [];
  reportOptions$!: Observable<LookupOption[]>;
  isLoading = false;
  error = '';
  success = '';
  role = '';
  showCreateForm = false;
  isSubmitting = false;
  editingCaseId: number | null = null;

  createForm: FormGroup;
  editForm: FormGroup;

  constructor(
    private caseService: CaseService,
    private authService: AuthService,
    private lookup: LookupService,
    private fb: FormBuilder
  ) {
    // Diagnosis rules mirror backend: non-empty, not the placeholder "string", not all digits.
    const notPlaceholder = (ctrl: any) => {
      const v = (ctrl.value || '').toString().trim();
      if (!v) return null;
      if (v.toLowerCase() === 'string') return { placeholder: true };
      if (/^\d+$/.test(v))              return { allDigits: true };
      return null;
    };
    this.createForm = this.fb.group({
      reportId:  [null, [Validators.required, Validators.min(1)]],
      diagnosis: ['', [Validators.required, Validators.minLength(3), notPlaceholder]],
      status:    [false, Validators.required]
    });
    this.editForm = this.fb.group({
      diagnosis: ['', [Validators.required, Validators.minLength(3), notPlaceholder]]
    });
  }

  ngOnInit(): void {
    this.role = this.authService.getUserRole();
    // Pair reports with existing cases — hide reports whose citizen already has a case,
    // since the backend rejects duplicates with "Case already exists for this citizen".
    this.reportOptions$ = combineLatest([
      this.lookup.symptomReports(),
      this.lookup.cases()
    ]).pipe(
      map(([reports, cases]) => {
        const claimed = new Set<number>(
          cases.map(c => c.meta?.['citizenId']).filter((n: any) => typeof n === 'number')
        );
        return reports.filter(r => {
          const cid = r.meta?.['citizenId'];
          return cid == null || !claimed.has(cid);
        });
      })
    );
    this.loadCases();
  }

  get canCreate(): boolean { return ['Doctor', 'Admin'].includes(this.role); }
  get canEdit(): boolean   { return ['Doctor', 'Admin'].includes(this.role); }
  get canDelete(): boolean { return ['Doctor', 'Admin'].includes(this.role); }

  loadCases(): void {
    this.isLoading = true;
    this.error = '';
    this.caseService.getAllCases().subscribe({
      next: (res: any) => {
        const list = Array.isArray(res) ? res : (res?.data ?? res?.items ?? []);
        // Newest first — caseId descending
        this.cases = [...list].sort((a: any, b: any) => (b.caseId ?? 0) - (a.caseId ?? 0));
        this.isLoading = false;
      },
      error: (err) => {
        // Backend returns 404 when there are no cases — treat as empty list, not an error
        if (err.status === 404) {
          this.cases = [];
          this.error = '';
        } else {
          this.error = err.error?.message || err.error || 'Failed to load cases.';
        }
        this.isLoading = false;
      }
    });
  }

  /** Extract a human-readable message from an HttpErrorResponse — handles plain text, JSON {message}, ProblemDetails. */
  private extractError(err: any, fallback: string): string {
    if (!err) return fallback;
    if (typeof err.error === 'string' && err.error.trim()) return err.error;
    if (err.error?.message) return err.error.message;
    if (err.error?.title)   return err.error.title;
    if (err.error?.detail)  return err.error.detail;
    if (err.error?.errors) {
      return Object.values(err.error.errors).flat().join(' ');
    }
    if (err.message) return err.message;
    return fallback;
  }

  onCreate(): void {
    this.error = '';
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      const d = this.createForm.get('diagnosis');
      if (d?.errors?.['placeholder']) this.error = 'Please write an actual diagnosis (not "string").';
      else if (d?.errors?.['allDigits']) this.error = 'Diagnosis cannot be only digits.';
      return;
    }
    this.isSubmitting = true;
    // Cast status to boolean so the API gets a real bool, not undefined
    const payload = {
      reportId:  Number(this.createForm.value.reportId),
      diagnosis: (this.createForm.value.diagnosis ?? '').toString().trim(),
      status:    this.createForm.value.status === true
    };
    this.caseService.createCase(payload).subscribe({
      next: () => {
        this.success = 'Case created successfully!';
        this.isSubmitting = false;
        this.showCreateForm = false;
        this.createForm.reset({ status: false });
        this.loadCases();
        setTimeout(() => this.success = '', 3000);
      },
      error: (err) => {
        this.error = this.extractError(err, 'Failed to create case.');
        this.isSubmitting = false;
      }
    });
  }

  startEdit(c: CaseListDto): void {
    this.editingCaseId = c.caseId;
    this.editForm.patchValue({ diagnosis: c.diagnosis });
  }

  onEdit(): void {
    if (!this.editingCaseId || this.editForm.invalid) { this.editForm.markAllAsTouched(); return; }
    this.error = '';
    this.caseService.updateCaseDiagnosis(this.editingCaseId, this.editForm.value).subscribe({
      next: () => {
        this.success = 'Case updated.';
        this.editingCaseId = null;
        this.loadCases();
        setTimeout(() => this.success = '', 2000);
      },
      error: (err) => { this.error = this.extractError(err, 'Update failed.'); }
    });
  }

  deleteCase(id: number): void {
    if (!confirm('Mark case as recovered and delete?')) return;
    this.error = '';
    this.caseService.deleteCase(id).subscribe({
      next: () => { this.success = 'Case deleted.'; this.loadCases(); setTimeout(() => this.success = '', 2500); },
      error: (err) => { this.error = this.extractError(err, 'Delete failed.'); }
    });
  }

  formatDate(d: string): string { return d ? new Date(d).toLocaleDateString('en-GB') : '—'; }
  getStatusClass(s: boolean): string { return s ? 'badge-recovered' : 'badge-active'; }
  getStatusLabel(s: boolean): string { return s ? 'Recovered' : 'Under Treatment'; }
}
