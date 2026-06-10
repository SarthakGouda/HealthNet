import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SymptomReportService } from '../../core/services/symptom-report';
import { AuthService } from '../../core/services/auth-service';
import { ActivatedRoute } from '@angular/router';
import { SymptomReportResponse, SymptomsJsonPayload } from '../../core/models/symptom-report';

@Component({
  selector: 'app-symptom-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './symptomhistory-component.html',
  styleUrl: './symptomhistory-component.css'
})
export class SymptomHistoryComponent implements OnInit {

  reports: SymptomReportResponse[] = [];
  isLoading = false;
  errorMessage = '';
  activeFilter: string | null = null;
  filterLabel: string | null = null;

  pageNumber = 1;
  pageSize = 10;
  totalRecords = 0;
  totalPages = 0;

  symptomLabels: Record<string, string> = {
    fever: 'Fever',
    cough: 'Cough',
    headache: 'Headache',
    fatigue: 'Fatigue',
    soreThroat: 'Sore Throat',
    shortnessOfBreath: 'Shortness of Breath',
    bodyAche: 'Body Ache',
    nausea: 'Nausea',
    vomiting: 'Vomiting',
    diarrhea: 'Diarrhea',
    chills: 'Chills',
    lossOfTasteOrSmell: 'Loss of Taste/Smell'
  };

  constructor(
    private symptomReportService: SymptomReportService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute 
  ) { }

  ngOnInit(): void {
  this.route.queryParams.subscribe(params => {
    this.activeFilter = params['status'] ?? null;
    this.filterLabel = this.activeFilter;
    this.pageNumber = 1;
    this.loadReports();
  });
}

 loadReports(): void {
  this.isLoading = true;
  this.errorMessage = '';
  this.symptomReportService.getMyReports(this.pageNumber, this.pageSize).subscribe({
    next: (res) => {
      const allReports = res.items ?? [];
      this.reports = this.activeFilter
        ? allReports.filter(r => r.status === this.activeFilter)
        : allReports;
      this.totalRecords = this.activeFilter ? this.reports.length : res.totalRecords;
      this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
      this.isLoading = false;
    },
    error: (err) => {
      this.isLoading = false;
      if (err.status === 401) {
        this.errorMessage = 'Session expired. Please log in again.';
        this.router.navigate(['/login']);
      } else {
        this.errorMessage = 'Failed to load reports. Please try again.';
      }
    }
  });
}
  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.pageNumber = page;
    this.loadReports();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  get pages(): number[] {
    const range: number[] = [];
    const start = Math.max(1, this.pageNumber - 2);
    const end = Math.min(this.totalPages, this.pageNumber + 2);
    for (let i = start; i <= end; i++) range.push(i);
    return range;
  }

  get startRecord(): number {
    return (this.pageNumber - 1) * this.pageSize + 1;
  }

  get endRecord(): number {
    return Math.min(this.pageNumber * this.pageSize, this.totalRecords);
  }

  parsedSymptoms(symptomsJson: string): string[] {
    try {
      const parsed: SymptomsJsonPayload = JSON.parse(symptomsJson);
      return Object.entries(parsed.commonSymptoms)
        .filter(([, val]) => val)
        .map(([key]) => this.symptomLabels[key] ?? key);
    } catch {
      return [];
    }
  }

  parsedVitals(symptomsJson: string): string | null {
    try {
      const parsed: SymptomsJsonPayload = JSON.parse(symptomsJson);
      const v = parsed.vitals;
      const parts: string[] = [];
      if (v?.['temperature']) parts.push(`${v['temperature']}°F`);
      if (v?.['oxygenLevel']) parts.push(`SpO₂ ${v['oxygenLevel']}%`);
      if (v?.['heartRate']) parts.push(`${v['heartRate']} BPM`);
      if (v?.['bpSystolic']) parts.push(`${v['bpSystolic']}/${v['bpDiastolic']} mmHg`);
      return parts.length ? parts.join(' · ') : null;
    } catch {
      return null;
    }
  }

  parsedNotes(symptomsJson: string): string | null {
    try {
      const parsed: SymptomsJsonPayload = JSON.parse(symptomsJson);
      return parsed.otherSymptoms || null;
    } catch {
      return null;
    }
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      Submitted: 'status-submitted',
      UnderReview: 'status-underreview',
      Reviewed: 'status-reviewed',
      Closed: 'status-closed'
    };
    return map[status] ?? 'status-submitted';
  }

  navigateToReport(): void {
    this.router.navigate(['/symptom-report']);
  }
  navigateTo(path: string): void {
    this.router.navigate([path]);
  }
}
