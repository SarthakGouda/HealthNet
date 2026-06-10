import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { LabTestService } from '../../core/services/lab-test.service';
import { AuthService } from '../../core/services/auth-service';
import { LabTest, UpdateLabTestRequest } from '../../core/models/lab-test.model';
import { LookupOption, LookupService } from '../../core/services/lookup.service';
import { IdPickerComponent } from '../../shared/components/id-picker/id-picker';

@Component({
  selector: 'app-lab-test-edit-component',
  standalone: true,
  imports: [CommonModule, FormsModule, IdPickerComponent],
  templateUrl: './lab-test-edit-component.html',
  styleUrl: './lab-test-edit-component.css'
})
export class LabTestEditComponent implements OnInit {

  private labTestService = inject(LabTestService);
  private authService    = inject(AuthService);
  private route          = inject(ActivatedRoute);
  private router         = inject(Router);
  private lookup         = inject(LookupService);

  technicians$!: Observable<LookupOption[]>;

  testId: number       = 0;
  labTest: LabTest | null = null;
  userRole: string | null = null;

  // Form fields — pre-populated from existing test
  selectedType: string        = '';
  technicianId: number | null = null;

  // State
  isLoading: boolean    = false;
  isSubmitting: boolean = false;
  successMsg: string | null = null;
  errorMsg: string | null   = null;
  loadError: string | null  = null;

  // Validation errors
  typeError: string | null         = null;
  technicianIdError: string | null = null;

  typeOptions: string[] = ['Blood', 'Swab', 'X-Ray'];

  isDoctor: boolean = false;

  ngOnInit(): void {
    this.testId       = Number(this.route.snapshot.paramMap.get('id'));
    this.userRole     = this.authService.getUserRole();
    this.isDoctor     = this.userRole === 'Doctor';
    this.technicians$ = this.lookup.technicians();
    this.loadLabTest();
  }

  loadLabTest(): void {
    this.isLoading  = true;
    this.loadError  = null;

    this.labTestService.getLabTests().subscribe({
      next: (res) => {
        this.labTest   = res.data.find(t => t.testId === this.testId) || null;
        this.isLoading = false;

        if (!this.labTest) {
          this.loadError = `Lab test #${this.testId} not found.`;
          return;
        }

        // Check if test is completed
        if (this.labTest.status) {
          this.loadError = 'This lab test is already completed and cannot be modified.';
          return;
        }

        // Pre-populate form
        this.selectedType = this.labTest.type;
        this.technicianId = this.labTest.technicianId;
      },
      error: (err) => {
        this.loadError = err.error?.message || 'Failed to load lab test.';
        this.isLoading = false;
      }
    });
  }

  validateForm(): boolean {
    let valid = true;
    this.typeError         = null;
    this.technicianIdError = null;

    if (!this.selectedType) {
      this.typeError = 'Please select a test type.';
      valid = false;
    }

    // Only Doctor can update technicianId
    if (this.isDoctor && (!this.technicianId || this.technicianId <= 0)) {
      this.technicianIdError = 'Technician ID must be greater than 0.';
      valid = false;
    }

    return valid;
  }

  onSubmit(): void {
    this.successMsg = null;
    this.errorMsg   = null;

    if (!this.validateForm()) return;

    // Check nothing changed
    if (this.selectedType === this.labTest?.type &&
        this.technicianId === this.labTest?.technicianId) {
      this.errorMsg = 'No changes detected. Please modify at least one field.';
      return;
    }

    this.isSubmitting = true;

    const request: UpdateLabTestRequest = {};
    if (this.selectedType !== this.labTest?.type)
      request.type = this.selectedType;
    if (this.isDoctor && this.technicianId !== this.labTest?.technicianId)
      request.technicianId = this.technicianId!;

    this.labTestService.updateLabTest(this.testId, request).subscribe({
      next: (res) => {
        this.successMsg   = `Lab test #${this.testId} updated successfully!`;
        this.isSubmitting = false;
        // Update local copy
        if (this.labTest) {
          this.labTest.type         = res.data.type;
          this.labTest.technicianId = res.data.technicianId;
        }
      },
      error: (err) => {
        this.errorMsg     = err.error?.message || 'Failed to update lab test.';
        this.isSubmitting = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/lab-tests', this.testId]);
  }
}