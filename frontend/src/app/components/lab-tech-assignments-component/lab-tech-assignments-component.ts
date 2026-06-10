import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LabTestService } from '../../core/services/lab-test.service';
import { TokenService } from '../../core/services/token-service';
import { LabTest } from '../../core/models/lab-test.model';

@Component({
  selector: 'app-lab-tech-assignments',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './lab-tech-assignments-component.html',
  styleUrl: './lab-tech-assignments-component.css'
})
export class LabTechAssignmentsComponent implements OnInit {

  tests: LabTest[] = [];
  filtered: LabTest[] = [];
  myUserId = 0;
  isLoading = false;
  error = '';

  typeFilter = '';
  statusFilter: '' | 'Pending' | 'Completed' = '';
  dateFilter = '';

  typeOptions = ['Blood', 'Swab', 'X-Ray'];

  constructor(
    private labTestService: LabTestService,
    private tokenService: TokenService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.myUserId = this.tokenService.getUserId();
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.error = '';
    const filter: any = {};
    if (this.typeFilter)   filter.type   = this.typeFilter;
    if (this.statusFilter) filter.status = this.statusFilter;
    if (this.dateFilter)   filter.date   = this.dateFilter;
    this.labTestService.getLabTests(filter).subscribe({
      next: (res: any) => {
        const raw: LabTest[] = res?.data ?? res?.items ?? [];
        // Newest first — testId descending
        const all = [...raw].sort((a: any, b: any) => (b.testId ?? 0) - (a.testId ?? 0));
        this.tests = all;
        this.filtered = all.filter(t => Number(t.technicianId) === Number(this.myUserId));
        this.isLoading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load assignments.';
        this.isLoading = false;
      }
    });
  }

  clearFilters(): void { this.typeFilter = ''; this.statusFilter = ''; this.dateFilter = ''; this.load(); }

  statusBadge(s: boolean): string { return s ? 'badge-completed' : 'badge-pending'; }
  statusLabel(s: boolean): string { return s ? 'Completed' : 'Pending'; }
  formatDate(d: string): string { return d ? new Date(d).toLocaleDateString('en-GB') : '—'; }

  goUpload(testId: number): void {
    this.router.navigate(['/lab-tests/upload-report'], { queryParams: { testId } });
  }
}
