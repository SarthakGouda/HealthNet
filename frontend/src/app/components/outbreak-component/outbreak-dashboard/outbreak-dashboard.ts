import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { OutbreakService } from '../../../core/services/outbreak-service';
import { AuthService } from '../../../core/services/auth-service';
import { GetOutbreakResponse } from '../../../core/models/Outbreak';

const ROLE_ADMIN  = 'Admin';
const ROLE_DOCTOR = 'Doctor';
const ROLE_PHO    = 'Public Health Officer';

@Component({
  selector: 'app-outbreak-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './outbreak-dashboard.html',
  styleUrls: ['./outbreak-dashboard.css']
})
export class OutbreakDashboardComponent implements OnInit {

  role: string | null = null;

  outbreaks: GetOutbreakResponse[] = [];
  totalOutbreaks = 0;
  activeOutbreaks = 0;
  resolvedOutbreaks = 0;
  criticalOutbreaks = 0;

  isLoading = false;
  apiError = '';

  // ── Delete confirmation modal state ─────────────────────────────
  confirmDelete: GetOutbreakResponse | null = null;
  isDeleting = false;
  deleteError = '';
  deleteSuccess = '';

  constructor(
    private outbreakService: OutbreakService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.role = this.authService.getUserRole();
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.isLoading = true;
    this.apiError = '';

    this.outbreakService.getAllActiveOutbreaks().subscribe({
      next: (data) => {
        this.isLoading = false;
        this.outbreaks = data || [];
        this.totalOutbreaks    = this.outbreaks.length;
        this.activeOutbreaks   = this.outbreaks.filter(o => o.status).length;
        this.resolvedOutbreaks = this.outbreaks.filter(o => !o.status).length;
        this.criticalOutbreaks = this.outbreaks
          .filter(o => o.severity?.toLowerCase() === 'high').length;
      },
      error: (err) => {
        this.isLoading = false;
        this.apiError =
          typeof err.error === 'string'
            ? err.error
            : err.error?.message || 'Failed to load dashboard data.';
      }
    });
  }

  // ── Permission getters (Officer-driven split) ───────────────────
  get canDeclare(): boolean {
    return this.role === ROLE_ADMIN || this.role === ROLE_PHO;
  }
  get canUpdate(): boolean {
    return this.role === ROLE_ADMIN || this.role === ROLE_PHO;
  }
  get canDelete(): boolean {
    return this.role === ROLE_ADMIN;
  }

  // ── Recent slice (top 5 by start date desc) ─────────────────────
  get recentOutbreaks(): GetOutbreakResponse[] {
    return [...this.outbreaks]
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
      .slice(0, 5);
  }

  // ── Display helpers ─────────────────────────────────────────────
  roleLabel(): string {
    switch (this.role) {
      case ROLE_ADMIN:  return 'Administrator';
      case ROLE_DOCTOR: return 'Doctor';
      case ROLE_PHO:    return 'Public Health Officer';
      default:          return 'User';
    }
  }

  roleSubtitle(): string {
    switch (this.role) {
      case ROLE_ADMIN:  return 'Full access — declare, update, delete and manage epidemiology';
      case ROLE_DOCTOR: return 'Read-only view of outbreaks declared by Public Health Officers';
      case ROLE_PHO:    return 'Declare, update and manage epidemiology for outbreaks';
      default:          return 'Outbreak monitoring overview';
    }
  }

  getSeverityBadgeClass(severity: string): string {
    switch (severity?.toLowerCase()) {
      case 'high':   return 'badge-sev-high';
      case 'medium': return 'badge-sev-medium';
      case 'low':    return 'badge-sev-low';
      default:       return 'badge-sev-low';
    }
  }

  getStatusBadgeClass(status: boolean): string {
    return status ? 'badge-status-active' : 'badge-status-closed';
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-GB');
  }

  // ── Navigation ──────────────────────────────────────────────────
  goDeclare()      { this.router.navigate(['/outbreaks/new']); }
  goList()         { this.router.navigate(['/outbreaks/list']); }
  goEdit(id: number) { this.router.navigate(['/outbreaks', id, 'edit']); }
  goView(id: number) { this.router.navigate(['/outbreaks', id]); }

  // ── Delete flow ────────────────────────────────────────────────
  askDelete(outbreak: GetOutbreakResponse): void {
    this.deleteError = '';
    this.deleteSuccess = '';
    this.confirmDelete = outbreak;
  }

  cancelDelete(): void {
    if (this.isDeleting) return;
    this.confirmDelete = null;
    this.deleteError = '';
  }

  doDelete(): void {
    if (!this.confirmDelete) return;
    const id = this.confirmDelete.outbreakId;
    this.isDeleting = true;
    this.deleteError = '';

    this.outbreakService.deleteOutbreak(id).subscribe({
      next: (res) => {
        this.isDeleting = false;
        if (res?.success === false) {
          this.deleteError = res.message || 'Delete failed.';
          return;
        }
        this.deleteSuccess = `Outbreak #${id} deleted successfully.`;
        this.confirmDelete = null;
        this.loadDashboard();
        setTimeout(() => (this.deleteSuccess = ''), 2500);
      },
      error: (err) => {
        this.isDeleting = false;
        this.deleteError =
          typeof err.error === 'string'
            ? err.error
            : err.error?.message || 'Delete failed. Please try again.';
      }
    });
  }
}
