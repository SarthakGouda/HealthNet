import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { MedicalRecordService } from '../../core/services/medical-record.service';
import { AuthService } from '../../core/services/auth-service';
import { MedicalRecordGetDto } from '../../core/models/medical-record.model';
import { LookupOption, LookupService } from '../../core/services/lookup.service';
import { IdPickerComponent } from '../../shared/components/id-picker/id-picker';

@Component({
  selector: 'app-medical-records',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, IdPickerComponent],
  templateUrl: './medical-records-component.html',
  styleUrl: './medical-records-component.css'
})
export class MedicalRecordsComponent implements OnInit {
  patients$!: Observable<LookupOption[]>;
  selectedPatientId: number | null = null;
  records: MedicalRecordGetDto[] = [];
  patientId: number | null = null;
  searchPatientId = '';
  isLoading = false;
  error = '';
  success = '';
  role = '';
  showForm = false;
  isSubmitting = false;

  addForm: FormGroup;
  editForm: FormGroup;
  manageForm: FormGroup;
  editingRecordId: number | null = null;
  todayISO = new Date().toISOString().split('T')[0];

  /**
   * Backend's GetMedicalRecords DTO doesn't carry a status field, so after we
   * close a record we have no server signal to read back. Keep a per-patient
   * set of recordIds we've just deactivated this session so the table can show
   * "Deactive" immediately. Cleared when the user switches patient.
   */
  private locallyDeactivated = new Set<number>();

  /**
   * GET /records returns MedicalRecordGetDto (no RecordId), but POST /records
   * and PUT /records return MedicalRecordResponseDto WITH the RecordId.
   * We remember each freshly returned RecordId keyed by (date|diagnosis|treatmentPlan)
   * so the list table can show real IDs for records created/edited in this session.
   */
  private knownRecordIds = new Map<string, number>();

  private recordKey(date: string, diagnosis: string, treatmentPlan: string): string {
    return `${(date || '').substring(0, 10)}|${(diagnosis || '').trim()}|${(treatmentPlan || '').trim()}`;
  }

  constructor(
    private medicalRecordService: MedicalRecordService,
    private authService: AuthService,
    private lookup: LookupService,
    private fb: FormBuilder
  ) {
    // Backend rule: diagnosis & treatmentPlan must contain at least one letter
    // (digit-only or symbol-only text is rejected with "must contain meaningful text").
    const hasLetter = (ctrl: any) => {
      const v = (ctrl.value || '').toString();
      if (!v.trim()) return null;                  // required validator handles empty
      return /[a-zA-Z]/.test(v) ? null : { noLetter: true };
    };
    this.addForm = this.fb.group({
      diagnosis:     ['', [Validators.required, Validators.minLength(3), hasLetter]],
      treatmentPlan: ['', [Validators.required, Validators.minLength(3), hasLetter]],
      date:          [this.todayISO, Validators.required]
    });
    this.editForm = this.fb.group({
      diagnosis:     ['', [Validators.required, Validators.minLength(3), hasLetter]],
      treatmentPlan: ['', [Validators.required, Validators.minLength(3), hasLetter]],
      date:          [this.todayISO, Validators.required]
    });
    this.manageForm = this.fb.group({
      recordId: [null, [Validators.required, Validators.min(1)]]
    });
  }

  startEditById(): void {
    if (this.manageForm.invalid) { this.manageForm.markAllAsTouched(); return; }
    const id = Number(this.manageForm.value.recordId);
    this.editingRecordId = id;
    this.editForm.reset({ date: this.todayISO });
  }

  deactivateById(): void {
    if (this.manageForm.invalid) { this.manageForm.markAllAsTouched(); return; }
    const id = Number(this.manageForm.value.recordId);
    this.deactivateRecord(id);
  }

  ngOnInit(): void {
    this.role = this.authService.getUserRole();
    this.patients$ = this.lookup.patients();
  }

  get canAdd(): boolean { return this.role === 'Doctor'; }
  get canMutate(): boolean { return this.role === 'Doctor'; }

  onPickPatient(id: number | null): void {
    this.selectedPatientId = id;
    // New patient → drop the local session caches from the previous one.
    this.locallyDeactivated.clear();
    this.knownRecordIds.clear();
    if (id != null && id > 0) {
      this.searchPatientId = String(id);
      this.onSearch();
    } else {
      this.patientId = null;
      this.records = [];
    }
  }

  onSearch(): void {
    const id = parseInt(this.searchPatientId, 10);
    if (isNaN(id) || id <= 0) { this.error = 'Please pick a patient.'; return; }
    this.patientId = id;
    this.error = '';
    this.isLoading = true;
    this.editingRecordId = null;
    this.medicalRecordService.getRecords(id).subscribe({
      next: (res: any) => {
        // Backend returns List<KeyValuePair<DateOnly, List<MedicalRecordGetDto>>>:
        // [{ key: "2026-05-14", value: [{date, diagnosis, treatmentPlan}, ...] }, ...]
        // We flatten it into a single MedicalRecordGetDto[] for the table.
        this.records = this.flattenRecords(res);
        this.isLoading = false;
      },
      error: (err) => {
        if (err.status === 404) {
          this.records = [];
          this.error = '';
        } else {
          this.error = err.error?.message || err.error || 'Failed to load records.';
          this.records = [];
        }
        this.isLoading = false;
      }
    });
  }

  /** Flatten any of the response shapes the backend might return. */
  private flattenRecords(res: any): MedicalRecordGetDto[] {
    const out: MedicalRecordGetDto[] = [];
    const list = Array.isArray(res) ? res : (res?.data ?? []);
    for (const item of list) {
      if (Array.isArray(item?.value)) {
        // KeyValuePair shape: { key, value: [...] }
        for (const r of item.value) out.push(this.mapRecord(r, item.key));
      } else if (Array.isArray(item)) {
        // Already a [[...], [...]] shape
        for (const r of item) out.push(this.mapRecord(r));
      } else {
        out.push(this.mapRecord(item));
      }
    }
    return out;
  }

  private mapRecord(r: any, fallbackDate?: string): MedicalRecordGetDto {
    const diagnosis     = r?.diagnosis     ?? r?.Diagnosis     ?? '';
    const treatmentPlan = r?.treatmentPlan ?? r?.TreatmentPlan ?? '';
    const date          = r?.date ?? r?.Date ?? fallbackDate ?? '';
    // RecordId resolution order:
    //   1. Whatever the backend sends (defensive — in case the GET DTO ever exposes it)
    //   2. The session cache populated from Add/Update responses
    //   3. 0 → renders as '—' in the table
    const cached = this.knownRecordIds.get(this.recordKey(date, diagnosis, treatmentPlan));
    const recordId = r?.recordId ?? r?.RecordId ?? cached ?? 0;
    // If we just deactivated this record in the current session, override the
    // server's silent default so the badge reads "Deactive".
    const localStatus = this.locallyDeactivated.has(recordId) ? 'Deactive' : null;
    return {
      recordId,
      patientId:     r?.patientId ?? this.patientId!,
      doctorId:      r?.doctorId ?? 0,
      doctorName:    r?.doctorName,
      diagnosis,
      treatmentPlan,
      date,
      status:        localStatus ?? r?.status ?? 'Active'
    };
  }

  onAdd(): void {
    if (!this.patientId || this.addForm.invalid) { this.addForm.markAllAsTouched(); return; }
    this.isSubmitting = true;
    this.error = '';
    const submitted = this.addForm.value;
    this.medicalRecordService.addRecord(this.patientId, submitted).subscribe({
      next: (res: any) => {
        const rid = res?.recordId ?? res?.RecordId;
        // Remember the RecordId for this exact diagnosis/treatment/date combo so the
        // list row can render it instead of '—'.
        if (rid) {
          const key = this.recordKey(submitted.date, submitted.diagnosis, submitted.treatmentPlan);
          this.knownRecordIds.set(key, Number(rid));
        }
        this.success = rid ? `Record #${rid} added.` : 'Record added.';
        this.isSubmitting = false;
        this.showForm = false;
        this.addForm.reset({ date: this.todayISO });
        this.onSearch();
        setTimeout(() => this.success = '', 4000);
      },
      error: (err) => {
        this.error = this.extractError(err, 'Failed to add record.');
        this.isSubmitting = false;
      }
    });
  }

  private extractError(err: any, fallback: string): string {
    if (!err) return fallback;
    if (typeof err.error === 'string' && err.error.trim()) return err.error;
    if (err.error?.message) return err.error.message;
    if (err.error?.title)   return err.error.title;
    if (err.error?.detail)  return err.error.detail;
    if (err.error?.errors)  return Object.values(err.error.errors).flat().join(' ');
    if (err.message) return err.message;
    return fallback;
  }

  startEdit(r: MedicalRecordGetDto): void {
    this.editingRecordId = r.recordId;
    this.showForm = false;
    this.editForm.patchValue({
      diagnosis: r.diagnosis,
      treatmentPlan: r.treatmentPlan,
      date: (r.date || this.todayISO).substring(0, 10)
    });
  }

  cancelEdit(): void { this.editingRecordId = null; }

  onSaveEdit(): void {
    if (!this.editingRecordId || this.editForm.invalid) { this.editForm.markAllAsTouched(); return; }
    this.isSubmitting = true;
    this.error = '';
    const editedId = this.editingRecordId;
    const submitted = this.editForm.value;
    this.medicalRecordService.updateRecord(editedId, submitted).subscribe({
      next: () => {
        // Re-key the cache with the new diagnosis/treatment/date so subsequent
        // list rebuilds still match this record.
        const key = this.recordKey(submitted.date, submitted.diagnosis, submitted.treatmentPlan);
        this.knownRecordIds.set(key, editedId);
        this.success = `Record #${editedId} updated.`;
        this.isSubmitting = false;
        this.editingRecordId = null;
        this.onSearch();
        setTimeout(() => this.success = '', 4000);
      },
      error: (err) => {
        this.error = this.extractError(err, 'Failed to update record.');
        this.isSubmitting = false;
      }
    });
  }

  deactivateRecord(id: number): void {
    if (!confirm('Deactivate this medical record?')) return;
    this.error = '';
    this.medicalRecordService.deactivateRecord(id).subscribe({
      next: () => {
        // Remember locally so the row can render with status="Deactive" even
        // though the backend's GET doesn't return a status field.
        this.locallyDeactivated.add(id);
        this.success = `Record #${id} deactivated.`;
        this.onSearch();
        setTimeout(() => this.success = '', 4000);
      },
      error: (err) => { this.error = this.extractError(err, 'Failed to deactivate record.'); }
    });
  }

  getStatusClass(s: string): string {
    const lower = (s || '').toLowerCase();
    return lower === 'open' || lower === 'active' ? 'badge-open' : 'badge-closed';
  }
  formatDate(d: string): string { return d ? new Date(d).toLocaleDateString('en-GB') : '—'; }
}
