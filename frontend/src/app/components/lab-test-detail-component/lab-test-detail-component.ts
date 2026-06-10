import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LabTest, LabReport, LabTestFilter } from '../../core/models/lab-test.model';
import { LabTestService } from '../../core/services/lab-test.service';
import { AuthService } from '../../core/services/auth-service';

@Component({
  selector: 'app-lab-test-detail-component',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './lab-test-detail-component.html',
  styleUrl: './lab-test-detail-component.css'
})
export class LabTestDetailComponent implements OnInit {

  private labTestService = inject(LabTestService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);

  testId: number = 0;
  labTest: LabTest | null = null;
  reports: LabReport[] = [];
  canEdit: boolean = false;

  isLoadingTest: boolean = false;
  isLoadingReports: boolean = false;
  isDownloading: boolean = false;

  testError: string | null = null;
  reportError: string | null = null;
  downloadError: string | null = null;

  ngOnInit(): void {
    this.testId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadLabTest();
    this.loadReports();
    const role = this.authService.getUserRole();
    this.canEdit = role === 'Doctor' || role === 'Lab Technician';
  }

  loadLabTest(): void {
    this.isLoadingTest = true;
    this.testError = null;

    const filter: LabTestFilter = {};
    this.labTestService.getLabTests(filter).subscribe({
      next: (res) => {
        this.labTest = res.data.find(t => t.testId === this.testId) || null;
        this.isLoadingTest = false;
        if (!this.labTest) this.testError = `Lab test #${this.testId} not found.`;
      },
      error: (err) => {
        this.testError = err.error?.message || 'Failed to load lab test.';
        this.isLoadingTest = false;
      }
    });
  }

  loadReports(): void {
    this.isLoadingReports = true;
    this.reportError = null;

    this.labTestService.getReportsByTestId(this.testId).subscribe({
      next: (res) => {
        this.reports = res.data.reports;
        this.isLoadingReports = false;
      },
      error: (err) => {
        // 404 means no reports yet — not an error
        if (err.status === 404) {
          this.reports = [];
          this.isLoadingReports = false;
        } else {
          this.reportError = err.error?.message || 'Failed to load reports.';
          this.isLoadingReports = false;
        }
      }
    });
  }

  downloadReport(): void {
    this.isDownloading = true;
    this.downloadError = null;

    this.labTestService.downloadReport(this.testId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `labtest_${this.testId}_report`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.isDownloading = false;
      },
      error: (err) => {
        this.downloadError = err.error?.message || 'Failed to download report.';
        this.isDownloading = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/lab-tests']);
  }

  getStatusLabel(status: boolean): string {
    return status ? 'Completed' : 'Pending';
  }

  getStatusClass(status: boolean): string {
    return status ? 'badge-completed' : 'badge-pending';
  }

  getReportStatusLabel(status: boolean): string {
    return status ? 'Verified' : 'Not Verified';
  }

  getReportStatusClass(status: boolean): string {
    return status ? 'badge-verified' : 'badge-unverified';
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  }
  navigateToEdit(): void {
  this.router.navigate(['/lab-tests', this.testId, 'edit']);
  }
}