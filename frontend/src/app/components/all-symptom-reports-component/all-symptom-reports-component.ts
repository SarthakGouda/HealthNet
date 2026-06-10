import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SymptomReportService } from '../../core/services/symptom-report';
import { AuthService } from '../../core/services/auth-service';
import { SymptomReportResponse, SymptomsJsonPayload } from '../../core/models/symptom-report';

@Component({
  selector: 'app-all-symptom-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './all-symptom-reports-component.html',
  styleUrl: './all-symptom-reports-component.css'
})
export class AllSymptomReportsComponent implements OnInit {
  reports: SymptomReportResponse[] = [];
  isLoading = false;
  error = '';
  success = '';
  role = '';
  selectedStatus = '';
  pageNumber = 1;
  pageSize = 10;
  totalRecords = 0;
  totalPages = 0;

  symptomLabels: Record<string, string> = {
    fever:'Fever',cough:'Cough',headache:'Headache',fatigue:'Fatigue',
    soreThroat:'Sore Throat',shortnessOfBreath:'Shortness of Breath',
    bodyAche:'Body Ache',nausea:'Nausea',vomiting:'Vomiting',diarrhea:'Diarrhea',
    chills:'Chills',lossOfTasteOrSmell:'Loss of Taste/Smell'
  };

  constructor(
    private symptomReportService: SymptomReportService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.role = this.authService.getUserRole();
    this.loadReports();
  }

  get canChangeStatus(): boolean { return ['Doctor', 'Admin', 'Public Health Officer'].includes(this.role); }

  loadReports(): void {
    this.isLoading = true;
    const params: any = { pageNumber: this.pageNumber, pageSize: this.pageSize };
    if (this.selectedStatus) params.status = this.selectedStatus;

    // Doctor/Researcher/Admin use GET /CitizenSymptomReporting (all)
    this.symptomReportService.getAllReports(params).subscribe({
      next: (res: any) => {
        const list = res?.items ?? res?.data ?? [];
        // Newest first — reportId descending
        this.reports = [...list].sort((a: any, b: any) => (b.reportId ?? 0) - (a.reportId ?? 0));
        this.totalRecords = res?.totalRecords ?? this.reports.length;
        this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
        this.isLoading = false;
      },
      error: (err) => { this.error = err.error?.message || 'Failed to load reports.'; this.isLoading = false; }
    });
  }

  updateStatus(reportId: number, status: string): void {
    this.error = '';
    this.symptomReportService.updateReportStatus(reportId, status).subscribe({
      next: () => {
        this.success = `Report #${reportId} → ${status}.`;
        // Optimistic update so the badge changes immediately
        const r = this.reports.find(x => x.reportId === reportId);
        if (r) r.status = status;
        setTimeout(() => this.success = '', 2500);
      },
      error: (err) => {
        const msg = typeof err.error === 'string' ? err.error
          : (err.error?.message || err.error?.title || 'Failed to update status.');
        this.error = msg;
      }
    });
  }

  deleteReport(reportId: number): void {
    if (!confirm('Delete this symptom report?')) return;
    this.symptomReportService.deleteReport(reportId).subscribe({
      next: () => { this.success = 'Report deleted.'; this.loadReports(); },
      error: (err) => { this.error = err.error?.message || 'Delete failed.'; }
    });
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.pageNumber = page;
    this.loadReports();
  }

  get pages(): number[] {
    const s = Math.max(1, this.pageNumber - 2);
    const e = Math.min(this.totalPages, this.pageNumber + 2);
    const r = [];
    for (let i = s; i <= e; i++) r.push(i);
    return r;
  }

  parsedSymptoms(json: string): string[] {
    try {
      const p: SymptomsJsonPayload = JSON.parse(json);
      return Object.entries(p.commonSymptoms ?? {}).filter(([,v]) => v).map(([k]) => this.symptomLabels[k] ?? k).slice(0, 3);
    } catch { return []; }
  }

  getStatusClass(s: string): string {
    const m: Record<string,string> = { Submitted:'badge-submitted', UnderReview:'badge-review', Reviewed:'badge-reviewed', Closed:'badge-closed' };
    return m[s] ?? 'badge-submitted';
  }
  formatDate(d: string): string { return d ? new Date(d).toLocaleDateString('en-GB') : '—'; }
}
