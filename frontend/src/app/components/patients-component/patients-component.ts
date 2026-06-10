import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { PatientService } from '../../core/services/patient.service';
import { AuthService } from '../../core/services/auth-service';
import { PatientResponse } from '../../core/models/patient.model';

@Component({
  selector: 'app-patients',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './patients-component.html',
  styleUrl: './patients-component.css'
})
export class PatientsComponent implements OnInit {
  patients: PatientResponse[] = [];
  isLoading = false;
  error = '';
  success = '';
  searchName = '';
  searchStatus: '' | 'Active' | 'InActive' = '';
  showForm = false;
  isSubmitting = false;
  role = '';

  registerForm: FormGroup;
  editForm: FormGroup;
  editingId: number | null = null;
  detailPatient: PatientResponse | null = null;

  // Page state
  pageNumber = 1;
  pageSize = 10;
  totalRecords = 0;

  private static readonly PHONE = /^\d{10}$/;

  constructor(
    private patientService: PatientService,
    private authService: AuthService,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      name:        ['', [Validators.required, Validators.minLength(2)]],
      dob:         ['', Validators.required],
      gender:      ['', Validators.required],
      address:     ['', Validators.required],
      contactInfo: ['', [Validators.required, Validators.pattern(PatientsComponent.PHONE)]]
    });
    this.editForm = this.fb.group({
      name:        ['', [Validators.required, Validators.minLength(2)]],
      dob:         ['', Validators.required],
      gender:      ['', Validators.required],
      address:     ['', Validators.required],
      contactInfo: ['', [Validators.required, Validators.pattern(PatientsComponent.PHONE)]]
    });
  }

  ngOnInit(): void {
    this.role = this.authService.getUserRole();
    this.loadPatients();
  }

  get canRegister(): boolean {
    return ['Admin', 'Doctor', 'Public Health Officer'].includes(this.role);
  }

  get canEdit(): boolean {
    return ['Admin', 'Doctor'].includes(this.role);
  }

  loadPatients(): void {
    this.isLoading = true;
    this.error = '';
    this.patientService
      .searchPatients({
        name: this.searchName || undefined,
        status: this.searchStatus || undefined,
        pageNumber: this.pageNumber,
        pageSize: this.pageSize
      })
      .subscribe({
        next: (res: any) => {
          let list: any[];
          if (Array.isArray(res)) {
            list = res;
            this.totalRecords = res.length;
          } else {
            list = res?.items ?? res?.data ?? [];
            this.totalRecords = res?.totalRecords ?? list.length;
          }
          // Newest first
          this.patients = [...list].sort((a: any, b: any) => (b.patientId ?? 0) - (a.patientId ?? 0));
          console.log('Loaded patients:', this.patients);
          this.isLoading = false;
        },
        error: (err) => {
          this.error = err.error?.message || err.error || 'Failed to load patients.';
          this.isLoading = false;
        }
      });
  }

  onSearch(): void { this.pageNumber = 1; this.loadPatients(); }
  onClearFilters(): void { this.searchName = ''; this.searchStatus = ''; this.pageNumber = 1; this.loadPatients(); }

  changePage(delta: number): void {
    const next = this.pageNumber + delta;
    if (next < 1) return;
    if (delta > 0 && this.patients.length < this.pageSize) return;
    this.pageNumber = next;
    this.loadPatients();
  }

  onRegister(): void {
    if (this.registerForm.invalid) { this.registerForm.markAllAsTouched(); return; }
    this.isSubmitting = true;
    this.patientService.registerPatient(this.registerForm.value).subscribe({
      next: () => {
        this.success = 'Patient registered successfully!';
        this.isSubmitting = false;
        this.showForm = false;
        this.registerForm.reset();
        this.loadPatients();
        setTimeout(() => this.success = '', 3000);
      },
      error: (err) => {
        this.error = err.error?.message || err.error || 'Failed to register patient.';
        this.isSubmitting = false;
      }
    });
  }

  startEdit(p: PatientResponse): void {
    this.editingId = p.patientId;
    this.editForm.patchValue({
      name: p.name,
      dob: p.dob?.substring(0, 10),
      gender: p.gender,
      address: p.address,
      contactInfo: p.contactInfo
    });
  }

  cancelEdit(): void { this.editingId = null; }

  onSaveEdit(): void {
    if (!this.editingId || this.editForm.invalid) { this.editForm.markAllAsTouched(); return; }
    this.isSubmitting = true;
    this.patientService.updatePatient(this.editingId, this.editForm.value).subscribe({
      next: () => {
        this.success = 'Patient updated.';
        this.isSubmitting = false;
        this.editingId = null;
        this.loadPatients();
        setTimeout(() => this.success = '', 3000);
      },
      error: (err) => {
        this.error = err.error?.message || err.error || 'Failed to update patient.';
        this.isSubmitting = false;
      }
    });
  }

  viewDetail(id: number): void {
    this.patientService.getPatientById(id).subscribe({
      next: (p) => { this.detailPatient = p; },
      error: (err) => { this.error = err.error?.message || 'Failed to load patient.'; }
    });
  }

  closeDetail(): void { this.detailPatient = null; }

  deactivate(p: PatientResponse): void {
    if (!confirm(`Deactivate patient "${p.name}" (#${p.patientId})?`)) return;
    this.error = '';
    this.patientService.deactivatePatient(p.patientId).subscribe({
      next: (msg: string) => {
        // Optimistic flip — the row's badge switches to Inactive before the
        // refetch comes back. Surface the backend's plain-text message verbatim.
        const idx = this.patients.findIndex(x => x.patientId === p.patientId);
        if (idx >= 0) this.patients[idx] = { ...this.patients[idx], status: 'InActive' } as PatientResponse;
        this.success = (msg && msg.trim()) ? msg : `Patient #${p.patientId} deactivated.`;
        this.loadPatients();
        setTimeout(() => this.success = '', 4000);
      },
      error: (err) => {
        // Backend rejects with plain-text or { message } — handle both.
        this.error = (typeof err.error === 'string' && err.error.trim())
          ? err.error
          : (err.error?.message || 'Failed to deactivate.');
      }
    });
  }

  formatDate(d: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-GB');
  }

  getStatusClass(s: string): string {
    return s === 'Active' ? 'badge-active' : 'badge-inactive';
  }
}
