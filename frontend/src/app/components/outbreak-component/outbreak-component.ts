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
import { Router, RouterModule } from '@angular/router';
import { OutbreakService } from '../../core/services/outbreak-service';

// ── Custom validator: no special characters ──────────────────
function noSpecialChars(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (!value) return null;
  return /^[a-zA-Z0-9 ]+$/.test(value) ? null : { specialChars: true };
}

// ── Custom validator: date must not be future ────────────────
function notFutureDate(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return new Date(control.value) <= today ? null : { futureDate: true };
}

// ── Group validator: endDate must be after startDate ─────────
function endAfterStart(group: AbstractControl): ValidationErrors | null {
  const start = group.get('startDate')?.value;
  const end = group.get('endDate')?.value;
  if (!start || !end) return null;
  return new Date(end) > new Date(start) ? null : { endBeforeStart: true };
}

@Component({
  selector: 'app-outbreak-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './outbreak-form.component.html',
  styleUrls: ['./outbreak-form.component.css']
})
export class OutbreakFormComponent implements OnInit {

  outbreakForm!: FormGroup;
  isLoading = false;
  apiError = '';
  successMessage = '';
  today = new Date().toISOString().split('T')[0];
  severityOptions = ['High', 'Medium', 'Low'];

  constructor(
    private fb: FormBuilder,
    private outbreakService: OutbreakService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.outbreakForm = this.fb.group(
      {
        disease:   ['', [Validators.required, noSpecialChars]],
        location:  ['', [Validators.required, Validators.minLength(3), noSpecialChars]],
        severity:  ['', Validators.required],
        startDate: ['', [Validators.required, notFutureDate]],
        endDate:   ['', [Validators.required, notFutureDate]]
      },
      { validators: endAfterStart }
    );
  }

  // ── Getters for template ─────────────────────────────────────
  get disease()   { return this.outbreakForm.get('disease')!; }
  get location()  { return this.outbreakForm.get('location')!; }
  get severity()  { return this.outbreakForm.get('severity')!; }
  get startDate() { return this.outbreakForm.get('startDate')!; }
  get endDate()   { return this.outbreakForm.get('endDate')!; }

  onSubmit(): void {
    this.apiError = '';
    this.successMessage = '';

    if (this.outbreakForm.invalid) {
      this.outbreakForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const v = this.outbreakForm.value;

    const request = {
      disease:   v.disease.trim(),
      location:  v.location.trim(),
      severity:  v.severity,
      startDate: new Date(v.startDate).toISOString(),
      endDate:   new Date(v.endDate).toISOString(),
      status:    true
    };

    this.outbreakService.createOutbreak(request).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success) {
          this.successMessage = `Outbreak declared successfully! ID: ${res.outbreakId}`;
          setTimeout(() => this.router.navigate(['/outbreaks']), 1800);
        } else {
          this.apiError = res.message;
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.apiError =
          typeof err.error === 'string'
            ? err.error
            : err.error?.message || 'Something went wrong. Please try again.';
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/outbreaks']);
  }
}