import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { ComplianceService } from '../../core/services/compliance.service';
import { AuthService } from '../../core/services/auth-service';
import { ComplianceRecordListDto } from '../../core/models/compliance.model';
import { LookupOption, LookupService } from '../../core/services/lookup.service';
import { IdPickerComponent } from '../../shared/components/id-picker/id-picker';

interface ResultOption {
  value: string;          // Wire value sent to API
  label: string;          // Display label
  cssClass: string;       // Badge class
}

@Component({
  selector: 'app-compliance-records',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, IdPickerComponent],
  templateUrl: './compliance-record-component.html',
  styleUrl: './compliance-record-component.css'
})
export class ComplianceRecordComponent implements OnInit {
  records: ComplianceRecordListDto[] = [];
  isLoading = false;
  error = '';
  success = '';
  role = '';
  showForm = false;
  isSubmitting = false;
  editingId: number | null = null;
  detail: ComplianceRecordListDto | null = null;

  typeFilter = '';
  resultFilter = '';
  entityIdFilter: number | null = null;

  createForm: FormGroup;
  editForm: FormGroup;
  searchByIdForm: FormGroup;

  types = [
    { value: 'case',     label: 'Case' },
    { value: 'test',     label: 'Lab Test' },
    { value: 'outbreak', label: 'Outbreak' }
  ];

  results: ResultOption[] = [
    { value: 'compliant',           label: 'Compliant',            cssClass: 'badge-compliant' },
    { value: 'non compliant',       label: 'Non-Compliant',        cssClass: 'badge-non' },
    { value: 'partially compliant', label: 'Partially Compliant',  cssClass: 'badge-partial' },
    { value: 'pending review',      label: 'Pending Review',       cssClass: 'badge-pending' }
  ];

  entityOptions$: Observable<LookupOption[]> = of([]);

  constructor(
    private complianceService: ComplianceService,
    private authService: AuthService,
    private lookup: LookupService,
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.createForm = this.fb.group({
      entityId: [null, [Validators.required, Validators.min(1)]],
      type:     ['', Validators.required],
      result:   ['', Validators.required],
      notes:    ['', [Validators.required, Validators.minLength(3)]]
    });
    this.editForm = this.fb.group({
      result: ['', Validators.required],
      notes:  ['', [Validators.required, Validators.minLength(3)]]
    });
    this.searchByIdForm = this.fb.group({
      complianceId: [null, [Validators.required, Validators.min(1)]]
    });
  }

  ngOnInit(): void {
    this.role = this.authService.getUserRole();
    if (this.route.snapshot.url.some(s => s.path === 'new')) {
      this.showForm = true;
    }
    // Swap entity dropdown when the user picks a Type
    this.createForm.get('type')?.valueChanges.subscribe((t: string) => {
      // Reset previously chosen ID so it can't refer to a different entity kind
      this.createForm.patchValue({ entityId: null });
      this.entityOptions$ = this.optionsForType(t);
    });
    this.loadRecords();
  }

  private optionsForType(type: string): Observable<LookupOption[]> {
    switch ((type || '').toLowerCase()) {
      case 'case':     return this.lookup.cases();
      case 'test':     return this.lookup.labTests();
      case 'outbreak': return this.lookup.outbreaks();
      default:         return of([]);
    }
  }

  loadRecords(): void {
    this.isLoading = true;
    this.error = '';
    const filter: any = {};
    if (this.typeFilter)    filter.type     = this.typeFilter;
    if (this.resultFilter)  filter.result   = this.resultFilter;
    if (this.entityIdFilter != null) filter.entityId = this.entityIdFilter;
    this.complianceService.getRecords(filter).subscribe({
      next: (res: any) => {
        const list = Array.isArray(res) ? res : (res?.data ?? res?.items ?? []);
        // Newest first — complianceId descending
        this.records = [...list].sort((a: any, b: any) => (b.complianceId ?? 0) - (a.complianceId ?? 0));
        this.isLoading = false;
      },
      error: (err) => {
        this.error = err.error?.message || err.error || 'Failed to load records.';
        this.records = [];
        this.isLoading = false;
      }
    });
  }

  resetFilters(): void {
    this.typeFilter = '';
    this.resultFilter = '';
    this.entityIdFilter = null;
    this.loadRecords();
  }

  onCreate(): void {
    if (this.createForm.invalid) { this.createForm.markAllAsTouched(); return; }
    this.isSubmitting = true;
    this.complianceService.createRecord(this.createForm.value).subscribe({
      next: (res: any) => {
        this.success = `Compliance record #${res?.complianceId ?? ''} created.`;
        this.isSubmitting = false;
        this.showForm = false;
        this.createForm.reset();
        this.loadRecords();
        setTimeout(() => this.success = '', 3000);
      },
      error: (err) => {
        this.error = err.error?.message || err.error || 'Failed to create.';
        this.isSubmitting = false;
      }
    });
  }

  startEdit(r: ComplianceRecordListDto): void {
    this.editingId = r.complianceId;
    this.showForm = false;
    this.editForm.patchValue({
      result: this.normalizeResult(r.result),
      notes:  r.notes
    });
  }

  onEdit(): void {
    if (!this.editingId || this.editForm.invalid) { this.editForm.markAllAsTouched(); return; }
    this.isSubmitting = true;
    this.complianceService.updateRecord(this.editingId, this.editForm.value).subscribe({
      next: () => {
        this.success = 'Compliance record updated.';
        this.editingId = null;
        this.isSubmitting = false;
        this.loadRecords();
        setTimeout(() => this.success = '', 3000);
      },
      error: (err) => {
        console.log("Error : ",err);
        this.error = err.error?.message || err.error || 'Update failed.';
        this.isSubmitting = false;
      }
    });
  }

  // Backend supports GET /{id} — fetch fresh & open modal
  viewById(id: number): void {
    // Reuse current list if present, otherwise refetch + filter client-side
    const local = this.records.find(r => r.complianceId === id);
    if (local) { this.detail = local; return; }
    this.complianceService.getRecords({ entityId: undefined }).subscribe({
      next: (rows: any) => {
        const list: ComplianceRecordListDto[] = Array.isArray(rows) ? rows : (rows?.data ?? []);
        this.detail = list.find(r => r.complianceId === id) || null;
        if (!this.detail) this.error = `No record found with ID ${id}.`;
      },
      error: () => { this.error = `No record found with ID ${id}.`; }
    });
  }

  onSearchById(): void {
    if (this.searchByIdForm.invalid) return;
    this.viewById(Number(this.searchByIdForm.value.complianceId));
  }

  closeDetail(): void { this.detail = null; }

  deleteRecord(id: number): void {
    if (!confirm('Delete this compliance record?')) return;
    this.complianceService.deleteRecord(id).subscribe({
      next: () => { this.success = 'Compliance record deleted.'; this.loadRecords(); setTimeout(() => this.success = '', 3000); },
      error: (err) => { this.error = err.error?.message || err.error || 'Delete failed.'; }
    });
  }

  private normalizeResult(r: string): string {
    const lower = (r || '').trim().toLowerCase();
    // Common server-side variants → wire value
    if (lower.startsWith('non'))       return 'non compliant';
    if (lower.startsWith('partial'))   return 'partially compliant';
    if (lower.startsWith('pending'))   return 'pending review';
    if (lower.startsWith('comp'))      return 'compliant';
    return lower;
  }

  resultLabel(r: string): string {
    const v = this.normalizeResult(r);
    return this.results.find(o => o.value === v)?.label || r;
  }

  getResultClass(r: string): string {
    const v = this.normalizeResult(r);
    return this.results.find(o => o.value === v)?.cssClass || 'badge-pending';
  }

  typeLabel(t: string): string {
    return this.types.find(x => x.value === (t || '').toLowerCase())?.label || t;
  }

  formatDate(d: string): string { return d ? new Date(d).toLocaleDateString('en-GB') : '—'; }
}
