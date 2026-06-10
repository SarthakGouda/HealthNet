import { Component, inject, OnInit } from '@angular/core';
import { LabTestService } from '../../core/services/lab-test.service';
import { Router } from '@angular/router';
import { CreateLabTestRequest } from '../../core/models/lab-test.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { LookupOption, LookupService } from '../../core/services/lookup.service';
import { IdPickerComponent } from '../../shared/components/id-picker/id-picker';

@Component({
  selector: 'app-lab-test-create-component',
  standalone: true,
  imports: [CommonModule, FormsModule, IdPickerComponent],
  templateUrl: './lab-test-create-component.html',
  styleUrl: './lab-test-create-component.css',
})
export class LabTestCreateComponent implements OnInit {
  private labTestService = inject(LabTestService);
  private router = inject(Router);
  private lookup = inject(LookupService);

  patients$!: Observable<LookupOption[]>;
  technicians$!: Observable<LookupOption[]>;

  ngOnInit(): void {
    this.patients$    = this.lookup.patients();
    this.technicians$ = this.lookup.technicians();
  }

  // Form fields
  patientId: number | null = null;
  selectedType: string = '';
  technicianId: number | null = null;

  // State
  isSubmitting: boolean = false;
  successMsg: string | null = null;
  errorMsg: string | null = null;

  // Validation errors
  patientIdError: string | null = null;
  typeError: string | null = null;
  technicianIdError: string | null = null;

  // Dropdown options — hardcoded as per backend
  typeOptions: string[] = ['Blood', 'Swab', 'X-Ray'];

  validateForm(): boolean {
    let valid = true;

    // Reset errors
    this.patientIdError = null;
    this.typeError = null;
    this.technicianIdError = null;

    if (!this.patientId || this.patientId <= 0) {
      this.patientIdError = 'Patient ID must be greater than 0.';
      valid = false;
    }

    if (!this.selectedType) {
      this.typeError = 'Please select a test type.';
      valid = false;
    }

    if (!this.technicianId || this.technicianId <= 0) {
      this.technicianIdError = 'Technician ID must be greater than 0.';
      valid = false;
    }

    return valid;
  }

  onSubmit(): void {
    this.successMsg = null;
    this.errorMsg = null;

    if (!this.validateForm()) return;

    this.isSubmitting = true;

    const request: CreateLabTestRequest = {
      patientId: this.patientId!,
      type: this.selectedType,
      technicianId: this.technicianId!
    };

    this.labTestService.createLabTest(request).subscribe({
      next: (res) => {
        this.successMsg = `Lab test created successfully! Test ID: #${res.data.testId}`;
        this.isSubmitting = false;
        this.resetForm();
      },
      error: (err) => {
        this.errorMsg = err.error?.message || 'Failed to create lab test.';
        this.isSubmitting = false;
      }
    });
  }

  resetForm(): void {
    this.patientId = null;
    this.selectedType = '';
    this.technicianId = null;
    this.patientIdError = null;
    this.typeError = null;
    this.technicianIdError = null;
  }

  goBack(): void {
    this.router.navigate(['/lab-tests']);
  }
}
