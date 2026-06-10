import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SymptomReportService } from '../../core/services/symptom-report';
import { SymptomReportResponse, SymptomsJsonPayload } from '../../core/models/symptom-report';
import { UserService } from '../../core/services/user/user-service';
import { TokenService } from '../../core/services/token-service';

@Component({
  selector: 'app-citizenhome-component',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './citizenhome-component.html',
  styleUrl: './citizenhome-component.css'
})
export class CitizenhomeComponent implements OnInit {

  today = new Date();
  citizenName = 'Citizen';
  isLoading = false;
  recentReports: SymptomReportResponse[] = [];
  allReports: SymptomReportResponse[] = [];
  totalReports = 0;
  activeFilter: string | null = null;

  symptomLabels: Record<string, string> = {
    fever:              'Fever',
    cough:              'Cough',
    headache:           'Headache',
    fatigue:            'Fatigue',
    soreThroat:         'Sore Throat',
    shortnessOfBreath:  'Shortness of Breath',
    bodyAche:           'Body Ache',
    nausea:             'Nausea',
    vomiting:           'Vomiting',
    diarrhea:           'Diarrhea',
    chills:             'Chills',
    lossOfTasteOrSmell: 'Loss of Taste/Smell'
  };

  outbreakAlerts = [
    { disease: 'Influenza A',   location: 'Chennai, Tamil Nadu',    severity: 'MODERATE', date: '2026-05-08', cases: 142 },
    { disease: 'Dengue Fever',  location: 'Mumbai, Maharashtra',    severity: 'HIGH',     date: '2026-05-07', cases: 389 },
    { disease: 'Conjunctivitis',location: 'Bengaluru, Karnataka',   severity: 'LOW',      date: '2026-05-06', cases: 67  }
  ];

  healthTips = [
    { icon: 'ti-droplet',      tip: 'Drink at least 8 glasses of water daily',        color: '#185FA5' },
    { icon: 'ti-shield-check', tip: 'Wash hands frequently for at least 20 seconds',  color: '#0F6E56' },
    { icon: 'ti-moon',         tip: 'Get 7–9 hours of sleep each night',              color: '#534AB7' },
    { icon: 'ti-walk',         tip: 'Exercise for at least 30 minutes daily',         color: '#854F0B' }
  ];

  constructor(
    private router: Router,
    private userService: UserService,
    private tokenService: TokenService,
    private symptomReportService: SymptomReportService
  ) {}

  ngOnInit(): void {
    const email = this.tokenService.getUserEmail();
    const userId = this.tokenService.getUserId();
    if (userId) {
      this.userService.getUserData(userId).subscribe({
        next: (res: any) => {
          this.citizenName = res?.name ?? email ?? 'Citizen';
        },
        error: () => {
          this.citizenName = email ?? 'Citizen';
        }
      });
    }
    this.loadRecentReports();
  }

  loadRecentReports(): void {
  this.isLoading = true;
  this.symptomReportService.getMyReports(1, 100).subscribe({
    next: (res) => {
      this.allReports   = res.items ?? [];
      this.totalReports = res.totalRecords;
      this.recentReports = [...this.allReports].reverse().slice(0, 3);  // ← reverse then take 3
      this.isLoading = false;
    },
    error: () => {
      this.isLoading = false;
    }
  });
}

  get submittedCount(): number {
    return this.allReports.filter(r => r.status === 'Submitted').length;
  }

  get underReviewCount(): number {
    return this.allReports.filter(r => r.status === 'UnderReview').length;
  }

  get reviewedCount(): number {
    return this.allReports.filter(r => r.status === 'Reviewed').length;
  }

  parsedSymptoms(symptomsJson: string): string[] {
    try {
      const parsed: SymptomsJsonPayload = JSON.parse(symptomsJson);
      return Object.entries(parsed.commonSymptoms ?? {})
        .filter(([, val]) => val)
        .map(([key]) => this.symptomLabels[key] ?? key)
        .slice(0, 3);
    } catch { return []; }
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      Submitted:   'badge-submitted',
      UnderReview: 'badge-review',
      Reviewed:    'badge-reviewed',
      Closed:      'badge-closed'
    };
    return map[status] ?? 'badge-submitted';
  }

  getSeverityClass(severity: string): string {
    const map: Record<string, string> = {
      LOW:      'sev-low',
      MODERATE: 'sev-moderate',
      HIGH:     'sev-high'
    };
    return map[severity] ?? 'sev-low';
  }

  navigateTo(path: string): void {
    this.router.navigate([path]);
  }

  navigateToHistoryWithFilter(status: string | null): void {
    if (status) {
      this.router.navigate(['/symptom-history'], { queryParams: { status } });
    } else {
      this.router.navigate(['/symptom-history']);
    }
  }

  get currentTime(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }
}
