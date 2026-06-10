import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth-service';
import { TokenService } from '../../core/services/token-service';
import { UserService } from '../../core/services/user/user-service';
import { CaseService } from '../../core/services/case.service';
import { LabTestService } from '../../core/services/lab-test.service';
import { OutbreakService } from '../../core/services/outbreak-service';
import { ComplianceService } from '../../core/services/compliance.service';
import { PatientService } from '../../core/services/patient.service';

interface RoleStat { icon: string; tint: string; color: string; label: string; value: number | string; sub?: string; }

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard-home-component.html',
  styleUrl: './dashboard-home-component.css'
})
export class DashboardHomeComponent implements OnInit {
  role = '';
  userName = '';
  today = new Date();

  // Role-relevant stats shown above the action tiles.
  stats: RoleStat[] = [];
  isStatsLoading = false;
  tip = '';

  get currentTime(): string {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  }

  roleActions: Record<string, Array<{icon: string; label: string; sub: string; route: string; color: string; bg: string}>> = {
    Doctor: [
      { icon: 'ti-users',          label: 'Patients',         sub: 'Manage patient registry',        route: '/patients',             color: '#185FA5', bg: '#E6F1FB' },
      { icon: 'ti-stethoscope',    label: 'Cases',            sub: 'Log and manage cases',            route: '/cases',                color: '#0F6E56', bg: '#E1F5EE' },
      { icon: 'ti-heartbeat',      label: 'Medical Records',  sub: 'Patient medical history',        route: '/medical-records',      color: '#854F0B', bg: '#FAEEDA' },
      { icon: 'ti-clipboard-text', label: 'Symptom Reports',  sub: 'All citizen reports',            route: '/all-symptom-reports',  color: '#533AB7', bg: '#EEEDFE' },
      { icon: 'ti-flask',          label: 'Lab Tests',        sub: 'Manage lab testing',             route: '/lab-tests',            color: '#0C447C', bg: '#E6F1FB' },
      { icon: 'ti-virus',          label: 'Outbreaks',        sub: 'Monitor disease outbreaks',      route: '/outbreaks',            color: '#791F1F', bg: '#FCEBEB' },
    ],
    'Public Health Officer': [
      { icon: 'ti-virus',          label: 'Outbreaks',        sub: 'Monitor and manage outbreaks',   route: '/outbreaks',            color: '#791F1F', bg: '#FCEBEB' },
      { icon: 'ti-stethoscope',    label: 'Cases',            sub: 'Review all cases',               route: '/cases',                color: '#0F6E56', bg: '#E1F5EE' },
      { icon: 'ti-users',          label: 'Patients',         sub: 'Patient registry',               route: '/patients',             color: '#185FA5', bg: '#E6F1FB' },
      { icon: 'ti-clipboard-check',label: 'Audit',            sub: 'Create and manage audits',       route: '/audit',                color: '#533AB7', bg: '#EEEDFE' },
      { icon: 'ti-chart-bar',      label: 'Analytics',        sub: 'Epidemiological insights',       route: '/analytics',            color: '#854F0B', bg: '#FAEEDA' },
    ],
    Researcher: [
      { icon: 'ti-chart-bar',      label: 'Analytics',        sub: 'Data analysis and reports',      route: '/analytics',            color: '#854F0B', bg: '#FAEEDA' },
      { icon: 'ti-clipboard-text', label: 'Symptom Reports',  sub: 'All citizen symptom data',       route: '/all-symptom-reports',  color: '#533AB7', bg: '#EEEDFE' },
      { icon: 'ti-flask',          label: 'Lab Reports',      sub: 'Diagnostic lab data',            route: '/lab-tests',            color: '#0C447C', bg: '#E6F1FB' },
    ],
    'Compliance Officer': [
      { icon: 'ti-shield-check',   label: 'Compliance Records', sub: 'Policy compliance tracking', route: '/compliance-records',   color: '#791F1F', bg: '#FCEBEB' },
      { icon: 'ti-clipboard-check',label: 'Audit',            sub: 'Audit management',               route: '/audit',                color: '#533AB7', bg: '#EEEDFE' },
      { icon: 'ti-chart-bar',      label: 'Analytics',        sub: 'Compliance metrics',             route: '/analytics',            color: '#854F0B', bg: '#FAEEDA' },
    ],
    'Lab Technician': [
      { icon: 'ti-flask',          label: 'Lab Tests',        sub: 'Manage lab tests',               route: '/lab-tests',            color: '#0C447C', bg: '#E6F1FB' },
      { icon: 'ti-clipboard-data', label: 'My Assignments',   sub: 'Tests assigned to me',           route: '/lab-tests/my-assignments', color: '#854F0B', bg: '#FAEEDA' },
      { icon: 'ti-upload',         label: 'Upload Report',    sub: 'Upload a signed lab report',     route: '/lab-tests/upload-report',  color: '#0F6E56', bg: '#E1F5EE' },
      { icon: 'ti-users',          label: 'Patients',         sub: 'Find a patient',                 route: '/patients',             color: '#185FA5', bg: '#E6F1FB' },
    ],
    Admin: [
      { icon: 'ti-users-group',    label: 'User Management',  sub: 'Manage all users',               route: '/home/admin',           color: '#0C447C', bg: '#E6F1FB' },
      { icon: 'ti-chart-bar',      label: 'Analytics',        sub: 'System-wide insights',           route: '/analytics',            color: '#854F0B', bg: '#FAEEDA' },
      { icon: 'ti-shield-check',   label: 'Compliance',       sub: 'Policy tracking',                route: '/compliance-records',   color: '#791F1F', bg: '#FCEBEB' },
      { icon: 'ti-stethoscope',    label: 'Cases',            sub: 'All disease cases',              route: '/cases',                color: '#0F6E56', bg: '#E1F5EE' },
    ],
  };

  // Role-specific tip / pro-tip line shown above the action tiles.
  private roleTips: Record<string, string> = {
    Doctor:                 'Triage new symptom reports promptly, then convert eligible ones into cases.',
    'Public Health Officer':'A fresh outbreak today saves a hundred cases tomorrow. Watch the active list.',
    Researcher:             'Use the Analytics tab for epidemiology trends — every chart is filterable.',
    'Compliance Officer':   'Review Pending Review records first — fastest path back to compliance.',
    'Lab Technician':       'Check "My Assignments" for pending tests and upload reports as they complete.',
    Admin:                  'Active members and role distribution are on the Admin dashboard.'
  };

  get actions() { return this.roleActions[this.role] ?? []; }

  get roleSubtitle(): string {
    const m: Record<string, string> = {
      Doctor: 'Patient care, case management, and lab oversight',
      'Public Health Officer': 'Outbreak monitoring, compliance, and analytics',
      Researcher: 'Epidemiological data analysis and reporting',
      'Compliance Officer': 'Policy compliance monitoring and audits',
      'Lab Technician': 'Laboratory testing and diagnostic reports',
      Admin: 'Full system access and user management',
    };
    return m[this.role] ?? 'HealthNet Dashboard';
  }

  get roleIcon(): string {
    const m: Record<string, string> = {
      Doctor: 'ti-stethoscope', 'Public Health Officer': 'ti-building-hospital',
      Researcher: 'ti-microscope', 'Compliance Officer': 'ti-shield-check',
      'Lab Technician': 'ti-flask', Admin: 'ti-settings'
    };
    return m[this.role] ?? 'ti-home';
  }

  constructor(
    private authService: AuthService,
    private tokenService: TokenService,
    private userService: UserService,
    private caseService: CaseService,
    private labTestService: LabTestService,
    private outbreakService: OutbreakService,
    private complianceService: ComplianceService,
    private patientService: PatientService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.role = this.authService.getUserRole();
    this.tip = this.roleTips[this.role] || '';
    const userId = this.tokenService.getUserId();
    if (userId) {
      this.userService.getUserData(userId).subscribe({
        next: (res: any) => { this.userName = res?.name ?? this.tokenService.getUserEmail() ?? ''; },
        error: () => { this.userName = this.tokenService.getUserEmail() ?? ''; }
      });
    }
    // Admin gets its own dedicated dashboard with KPI cards.
    if (this.role === 'Admin') { this.router.navigate(['/home/admin']); return; }

    this.loadRoleStats();
  }

  navigateTo(route: string): void { this.router.navigate([route]); }

  /** Fire role-specific GET calls and roll results into the stats strip. */
  private loadRoleStats(): void {
    this.isStatsLoading = true;
    switch (this.role) {
      case 'Doctor':                this.loadDoctorStats();      break;
      case 'Public Health Officer': this.loadPHOStats();          break;
      case 'Lab Technician':        this.loadLabStats();          break;
      case 'Compliance Officer':    this.loadComplianceStats();   break;
      case 'Researcher':            this.loadResearcherStats();   break;
      default:                      this.isStatsLoading = false;
    }
  }

  private safeArr(res: any): any[] {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    return res.data ?? res.items ?? [];
  }

  private loadDoctorStats(): void {
    let done = 0;
    const finish = () => { if (++done >= 3) this.isStatsLoading = false; };

    this.patientService.searchPatients({ pageSize: 200 }).subscribe({
      next: (res: any) => {
        const list = this.safeArr(res);
        this.stats.push({
          icon: 'ti-users', tint: '#E6F1FB', color: '#185FA5',
          label: 'Patients', value: list.length, sub: 'in registry'
        });
        finish();
      },
      error: () => finish()
    });

    this.caseService.getAllCases().subscribe({
      next: (res: any) => {
        const list = this.safeArr(res);
        const active = list.filter((c: any) => !c.status).length;
        this.stats.push({
          icon: 'ti-stethoscope', tint: '#E1F5EE', color: '#0F6E56',
          label: 'Cases', value: list.length, sub: `${active} under treatment`
        });
        finish();
      },
      error: (err: any) => {
        if (err?.status === 404) {
          this.stats.push({ icon: 'ti-stethoscope', tint: '#E1F5EE', color: '#0F6E56', label: 'Cases', value: 0, sub: 'no cases yet' });
        }
        finish();
      }
    });

    this.labTestService.getLabTests({ status: 'Pending' }).subscribe({
      next: (res: any) => {
        const list = this.safeArr(res);
        this.stats.push({
          icon: 'ti-flask', tint: '#FAEEDA', color: '#854F0B',
          label: 'Lab Tests', value: list.length, sub: 'pending'
        });
        finish();
      },
      error: () => finish()
    });
  }

  private loadPHOStats(): void {
    let done = 0;
    const finish = () => { if (++done >= 2) this.isStatsLoading = false; };

    this.outbreakService.getAllActiveOutbreaks().subscribe({
      next: (rows: any) => {
        const list = Array.isArray(rows) ? rows : [];
        this.stats.push({
          icon: 'ti-virus', tint: '#FCEBEB', color: '#791F1F',
          label: 'Active Outbreaks', value: list.length, sub: 'being tracked'
        });
        finish();
      },
      error: () => finish()
    });

    this.caseService.getAllCases().subscribe({
      next: (res: any) => {
        const list = this.safeArr(res);
        this.stats.push({
          icon: 'ti-stethoscope', tint: '#E1F5EE', color: '#0F6E56',
          label: 'Cases on file', value: list.length
        });
        finish();
      },
      error: (err: any) => {
        if (err?.status === 404) {
          this.stats.push({ icon: 'ti-stethoscope', tint: '#E1F5EE', color: '#0F6E56', label: 'Cases on file', value: 0 });
        }
        finish();
      }
    });
  }

  private loadLabStats(): void {
    const myId = this.tokenService.getUserId();
    let done = 0;
    const finish = () => { if (++done >= 2) this.isStatsLoading = false; };

    this.labTestService.getLabTests({ status: 'Pending' }).subscribe({
      next: (res: any) => {
        const list = this.safeArr(res);
        const mine = list.filter((t: any) => Number(t.technicianId) === Number(myId));
        this.stats.push({
          icon: 'ti-clipboard-data', tint: '#FAEEDA', color: '#854F0B',
          label: 'My Pending Tests', value: mine.length, sub: 'assigned to you'
        });
        finish();
      },
      error: () => finish()
    });

    this.labTestService.getLabTests({ status: 'Completed' }).subscribe({
      next: (res: any) => {
        const list = this.safeArr(res);
        const mine = list.filter((t: any) => Number(t.technicianId) === Number(myId));
        this.stats.push({
          icon: 'ti-circle-check', tint: '#E1F5EE', color: '#0F6E56',
          label: 'Completed', value: mine.length, sub: 'tests done'
        });
        finish();
      },
      error: () => finish()
    });
  }

  private loadComplianceStats(): void {
    this.complianceService.getRecords({}).subscribe({
      next: (res: any) => {
        const list: any[] = Array.isArray(res) ? res : (res?.data ?? []);
        const pending = list.filter(r => /pending/i.test(r.result || '')).length;
        const nonComp = list.filter(r => /non/i.test(r.result || '')).length;
        this.stats.push({ icon: 'ti-shield-check', tint: '#FCEBEB', color: '#A32D2D', label: 'Records', value: list.length });
        this.stats.push({ icon: 'ti-clock',         tint: '#EEEDFE', color: '#533AB7', label: 'Pending Review', value: pending });
        this.stats.push({ icon: 'ti-alert-triangle',tint: '#FCEBEB', color: '#791F1F', label: 'Non-Compliant', value: nonComp });
        this.isStatsLoading = false;
      },
      error: () => { this.isStatsLoading = false; }
    });
  }

  private loadResearcherStats(): void {
    let done = 0;
    const finish = () => { if (++done >= 2) this.isStatsLoading = false; };

    this.outbreakService.getAllActiveOutbreaks().subscribe({
      next: (rows: any) => {
        const list = Array.isArray(rows) ? rows : [];
        this.stats.push({
          icon: 'ti-virus', tint: '#FCEBEB', color: '#791F1F',
          label: 'Active Outbreaks', value: list.length, sub: 'in dataset'
        });
        finish();
      },
      error: () => finish()
    });

    this.outbreakService.getAllEpidemiology().subscribe({
      next: (rows: any) => {
        const list = Array.isArray(rows) ? rows : [];
        this.stats.push({
          icon: 'ti-microscope', tint: '#EEEDFE', color: '#533AB7',
          label: 'Epidemiology Records', value: list.length
        });
        finish();
      },
      error: () => finish()
    });
  }
}
