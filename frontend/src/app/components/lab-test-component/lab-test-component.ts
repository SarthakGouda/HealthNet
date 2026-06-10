import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LabTest, LabTestFilter } from '../../core/models/lab-test.model';
import { LabTestService } from '../../core/services/lab-test.service';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth-service';

@Component({
  selector: 'app-lab-test-component',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './lab-test-component.html',
  styleUrl: './lab-test-component.css'
})
export class LabTestComponent implements OnInit {

  private labTestService = inject(LabTestService);
  private router = inject(Router);
  private authService = inject(AuthService);

  labTests: LabTest[] = [];
  isLoading: boolean = false;
  errorMsg: string | null = null;
  canCreate: boolean = false;

  // Filter fields
  selectedType: string = '';
  selectedStatus: string = '';
  selectedDate: string = '';

  // Dropdown options
  typeOptions: string[] = ['Blood', 'Swab', 'X-Ray'];
  statusOptions: string[] = ['Pending', 'Completed'];

  ngOnInit(): void {
    const role = this.authService.getUserRole();
    this.canCreate = role === 'Doctor' || role === 'Lab Technician';
    this.loadLabTests();
  }

  loadLabTests(): void {
    this.isLoading = true;
    this.errorMsg = null;

    const filter: LabTestFilter = {};
    if (this.selectedType) filter.type = this.selectedType;
    if (this.selectedStatus) filter.status = this.selectedStatus;
    if (this.selectedDate) filter.date = this.selectedDate;

    this.labTestService.getLabTests(filter).subscribe({
      next: (res) => {
        // Newest first — testId descending
        this.labTests = [...(res.data || [])].sort((a: any, b: any) => (b.testId ?? 0) - (a.testId ?? 0));
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMsg = err.error?.message || 'Failed to load lab tests.';
        this.isLoading = false;
      }
    });
  }

  applyFilters(): void {
    this.loadLabTests();
  }

  clearFilters(): void {
    this.selectedType = '';
    this.selectedStatus = '';
    this.selectedDate = '';
    this.loadLabTests();
  }

  getStatusLabel(status: boolean): string {
    return status ? 'Completed' : 'Pending';
  }

  getStatusClass(status: boolean): string {
    return status ? 'badge-completed' : 'badge-pending';
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  }
  getPendingCount(): number {
    return this.labTests.filter(t => !t.status).length;
  }

  getCompletedCount(): number {
    return this.labTests.filter(t => t.status).length;
  }

  getTypeCount(type: string): number {
    return this.labTests.filter(t => t.type === type).length;
  }

  viewDetails(testId: number): void {
    this.router.navigate(['/lab-tests', testId]);
  }

  navigateToCreate(): void {
  this.router.navigate(['/lab-tests/create']);
  }
}
