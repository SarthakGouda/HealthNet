import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { OutbreakService } from '../../../core/services/outbreak-service';
import {
  GetOutbreakResponse,
  UpdateOutbreakRequest
} from '../../../core/models/Outbreak';

// EndDate must not be earlier than StartDate (the StartDate comes from the loaded outbreak).
function endNotBeforeStart(startDate: () => string | null) {
  return (control: AbstractControl): ValidationErrors | null => {
    const start = startDate();
    if (!start || !control.value) return null;
    return new Date(control.value) >= new Date(start)
      ? null
      : { endBeforeStart: true };
  };
}

// EndDate must not be in the future.
function notFutureDate(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return new Date(control.value) <= today ? null : { futureDate: true };
}

@Component({
  selector: 'app-outbreak-update',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './outbreak-update.html',
  styleUrls: ['./outbreak-update.css']
})
export class OutbreakUpdateComponent implements OnInit {

  outbreakId!: number;
  outbreak: GetOutbreakResponse | null = null;

  form!: FormGroup;
  severityOptions = ['High', 'Medium', 'Low'];

  isLoading = false;
  isSaving = false;
  apiError = '';
  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private outbreakService: OutbreakService
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.outbreakId = Number(idParam);

    if (!this.outbreakId || isNaN(this.outbreakId)) {
      this.apiError = 'Invalid outbreak id.';
      return;
    }

    this.form = this.fb.group({
      severity: ['', Validators.required],
      endDate:  ['', [Validators.required, notFutureDate, endNotBeforeStart(() => this.outbreak?.startDate || null)]],
      status:   [true]
    });

    this.loadOutbreak();
  }

  loadOutbreak(): void {
    this.isLoading = true;
    this.apiError = '';

    this.outbreakService.getOutbreakById(this.outbreakId).subscribe({
      next: (data) => {
        this.isLoading = false;
        this.outbreak = data;
        if (!data) {
          this.apiError = 'Outbreak not found.';
          return;
        }
        if (!data.status) {
          this.apiError = 'This outbreak is closed and cannot be updated.';
        }
        this.form.patchValue({
          severity: this.normaliseSeverity(data.severity),
          endDate:  this.toDateInput(data.endDate),
          status:   data.status
        });
      },
      error: (err) => {
        this.isLoading = false;
        this.apiError =
          typeof err.error === 'string'
            ? err.error
            : err.error?.message || 'Failed to load outbreak.';
      }
    });
  }

  get severity()  { return this.form.get('severity')!; }
  get endDate()   { return this.form.get('endDate')!; }
  get status()    { return this.form.get('status')!; }

  onSubmit(): void {
    this.apiError = '';
    this.successMessage = '';

    if (!this.outbreak) {
      this.apiError = 'No outbreak loaded.';
      return;
    }
    if (!this.outbreak.status) {
      this.apiError = 'This outbreak is closed and cannot be updated.';
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.value;
    const request: UpdateOutbreakRequest = {
      severity: v.severity,
      endDate:  new Date(v.endDate).toISOString(),
      status:   !!v.status
    };

    this.isSaving = true;
    this.outbreakService.updateOutbreak(this.outbreakId, request).subscribe({
      next: (res) => {
        this.isSaving = false;
        if (res.success) {
          this.successMessage = res.message || 'Outbreak updated successfully.';
          setTimeout(() => this.router.navigate(['/outbreaks']), 1500);
        } else {
          this.apiError = res.message || 'Update failed.';
        }
      },
      error: (err) => {
        this.isSaving = false;
        this.apiError =
          typeof err.error === 'string'
            ? err.error
            : err.error?.message || 'Update failed. Please try again.';
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/outbreaks']);
  }

  // ── Helpers ─────────────────────────────────────────────────────
  private normaliseSeverity(s: string): string {
    if (!s) return '';
    const lower = s.toLowerCase();
    if (lower === 'high')   return 'High';
    if (lower === 'medium') return 'Medium';
    if (lower === 'low')    return 'Low';
    return s;
  }

  private toDateInput(iso: string): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  formatDate(iso: string): string {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-GB');
  }
}
