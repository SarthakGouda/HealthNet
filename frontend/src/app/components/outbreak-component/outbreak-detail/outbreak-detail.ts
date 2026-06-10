import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { OutbreakService } from '../../../core/services/outbreak-service';
import { AuthService } from '../../../core/services/auth-service';
import { GetOutbreakResponse } from '../../../core/models/Outbreak';

const ROLE_ADMIN = 'Admin';
const ROLE_PHO   = 'Public Health Officer';

@Component({
  selector: 'app-outbreak-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './outbreak-detail.html',
  styleUrls: ['./outbreak-detail.css']
})
export class OutbreakDetailComponent implements OnInit {

  outbreakId!: number;
  outbreak: GetOutbreakResponse | null = null;

  isLoading = false;
  apiError = '';

  // Delete modal
  confirmDelete = false;
  isDeleting = false;
  deleteError = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private outbreakService: OutbreakService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.outbreakId = Number(idParam);
    if (!this.outbreakId || isNaN(this.outbreakId)) {
      this.apiError = 'Invalid outbreak id.';
      return;
    }
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.apiError = '';

    this.outbreakService.getOutbreakById(this.outbreakId).subscribe({
      next: (data) => {
        this.isLoading = false;
        this.outbreak = data;
        if (!data) this.apiError = 'Outbreak not found.';
      },
      error: (err) => {
        this.isLoading = false;
        if (err.status === 404) {
          this.apiError = 'Outbreak not found.';
          return;
        }
        this.apiError =
          typeof err.error === 'string'
            ? err.error
            : err.error?.message || 'Failed to load outbreak.';
      }
    });
  }

  // ── Permissions ────────────────────────────────────────────
  get role(): string | null { return this.authService.getUserRole(); }
  get canEdit(): boolean {
    return (this.role === ROLE_ADMIN || this.role === ROLE_PHO) && !!this.outbreak?.status;
  }
  get canDelete(): boolean {
    return this.role === ROLE_ADMIN;
  }
  get canAddEpidemiology(): boolean {
    return (this.role === ROLE_ADMIN || this.role === ROLE_PHO || this.role === 'Doctor') && !!this.outbreak?.status;
  }

  // ── Navigation ─────────────────────────────────────────────
  goBack(): void { this.router.navigate(['/outbreaks/list']); }
  goEdit(): void { this.router.navigate(['/outbreaks', this.outbreakId, 'edit']); }
  goAddEpidemiology(): void {
    this.router.navigate(['/epidemiology'], { queryParams: { outbreakId: this.outbreakId } });
  }

  // ── Delete flow ────────────────────────────────────────────
  askDelete(): void { this.deleteError = ''; this.confirmDelete = true; }
  cancelDelete(): void {
    if (this.isDeleting) return;
    this.confirmDelete = false;
    this.deleteError = '';
  }
  doDelete(): void {
    if (!this.outbreak) return;
    this.isDeleting = true;
    this.deleteError = '';

    this.outbreakService.deleteOutbreak(this.outbreakId).subscribe({
      next: (res) => {
        this.isDeleting = false;
        if (res?.success === false) {
          this.deleteError = res.message || 'Delete failed.';
          return;
        }
        this.router.navigate(['/outbreaks/list']);
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

  // ── Display helpers ────────────────────────────────────────
  severityClass(s: string): string {
    switch (s?.toLowerCase()) {
      case 'high':   return 'badge-sev-high';
      case 'medium': return 'badge-sev-medium';
      case 'low':    return 'badge-sev-low';
      default:       return 'badge-sev-low';
    }
  }
  statusClass(active: boolean): string {
    return active ? 'badge-status-active' : 'badge-status-closed';
  }
  formatDate(iso: string): string {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }
  durationDays(): number | null {
    if (!this.outbreak?.startDate) return null;
    const start = new Date(this.outbreak.startDate);
    const end = this.outbreak.status
      ? new Date()
      : new Date(this.outbreak.endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;
    return Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  }
}
