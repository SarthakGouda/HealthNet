import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { OutbreakService } from '../../../core/services/outbreak-service';
import { AuthService } from '../../../core/services/auth-service';
import { GetOutbreakResponse, OutbreakAnalyticsRequest } from '../../../core/models/Outbreak';

const ROLE_ADMIN = 'Admin';
const ROLE_PHO   = 'Public Health Officer';

@Component({
  selector: 'app-outbreak-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './outbreak-list.html',
  styleUrls: ['./outbreak-list.css']
})
export class OutbreakListComponent implements OnInit {

  // ── Data ────────────────────────────────────────────────────
  allOutbreaks: GetOutbreakResponse[] = [];
  filteredOutbreaks: GetOutbreakResponse[] = [];

  // ── Stats ───────────────────────────────────────────────────
  totalOutbreaks = 0;
  activeOutbreaks = 0;
  resolvedOutbreaks = 0;

  // ── Filters ─────────────────────────────────────────────────
  filters: OutbreakAnalyticsRequest = {
    startDate: '',
    endDate: '',
    status: '',
    region: ''
  };

  // ── Frontend-only filters (disease, severity & location) ───
  diseaseFilter = '';
  severityFilter = '';
  locationFilter = '';

  // ── UI state ────────────────────────────────────────────────
  isLoading = false;
  apiError = '';
  today = new Date().toISOString().split('T')[0];

  severityOptions = ['', 'High', 'Medium', 'Low'];
  statusOptions   = ['', 'Active', 'InActive'];

  constructor(
    private outbreakService: OutbreakService,
    private authService: AuthService,
    private router: Router
  ) {}

  get role(): string | null {
    return this.authService.getUserRole();
  }
  get canUpdate(): boolean {
    return this.role === ROLE_ADMIN || this.role === ROLE_PHO;
  }
  get canDeclare(): boolean {
    return this.role === ROLE_ADMIN || this.role === ROLE_PHO;
  }
  get canDelete(): boolean {
    return this.role === ROLE_ADMIN;
  }
  goEdit(id: number): void {
    this.router.navigate(['/outbreaks', id, 'edit']);
  }
  goView(id: number): void {
    this.router.navigate(['/outbreaks', id]);
  }

  // ── Delete confirmation state ──────────────────────────────
  confirmDelete: GetOutbreakResponse | null = null;
  isDeleting = false;
  deleteError = '';
  deleteSuccess = '';

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
        this.loadOutbreaks();
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

  ngOnInit(): void {
    this.loadOutbreaks();
  }

  loadOutbreaks(): void {
    this.isLoading = true;
    this.apiError = '';

    // Build filter object — only send non-empty values
    const request: OutbreakAnalyticsRequest = {};
    if (this.filters.startDate) request.startDate = this.filters.startDate;
    if (this.filters.endDate)   request.endDate   = this.filters.endDate;
    if (this.filters.status)    request.status    = this.filters.status;
    if (this.filters.region)    request.region    = this.filters.region;

    this.outbreakService.getOutbreakAnalytics(request).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success) {
          // Newest first — outbreakId descending
          this.allOutbreaks = [...(res.data || [])].sort((a: any, b: any) => (b.outbreakId ?? 0) - (a.outbreakId ?? 0));
          this.totalOutbreaks   = res.totalOutbreaks;
          this.activeOutbreaks  = res.activeOutbreaks;
          this.resolvedOutbreaks = res.resolvedOutbreaks;
          this.applyFrontendFilters();
        } else {
          this.apiError = res.message;
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.apiError =
          typeof err.error === 'string'
            ? err.error
            : err.error?.message || 'Failed to load outbreaks.';
      }
    });
  }

  // Apply disease, severity & location filters on frontend
  applyFrontendFilters(): void {
    const dq = (this.diseaseFilter  || '').trim().toLowerCase();
    const lq = (this.locationFilter || '').trim().toLowerCase();
    const sq = (this.severityFilter || '').trim().toLowerCase();
    this.filteredOutbreaks = this.allOutbreaks.filter(o => {
      // Defensive — accept camelCase OR PascalCase coming back from the API
      const disease  = ((o as any).disease  ?? (o as any).Disease  ?? '').toString().toLowerCase();
      const location = ((o as any).location ?? (o as any).Location ?? '').toString().toLowerCase();
      const severity = ((o as any).severity ?? (o as any).Severity ?? '').toString().toLowerCase();
      const matchDisease  = !dq || disease.includes(dq);
      const matchLocation = !lq || location.includes(lq);
      const matchSeverity = !sq || severity === sq;
      return matchDisease && matchLocation && matchSeverity;
    });
  }

  onFilterChange(): void {
    this.applyFrontendFilters();
  }

  onApiFilterChange(): void {
    this.loadOutbreaks();
  }

  onResetFilters(): void {
    this.filters = { startDate: '', endDate: '', status: '', region: '' };
    this.diseaseFilter  = '';
    this.severityFilter = '';
    this.locationFilter = '';
    this.loadOutbreaks();
  }

  onDeclareNew(): void {
    this.router.navigate(['/outbreaks/new']);
  }

  getSeverityClass(severity: string): string {
    switch (severity?.toLowerCase()) {
      case 'high':   return 'sev-high';
      case 'medium': return 'sev-medium';
      case 'low':    return 'sev-low';
      default:       return '';
    }
  }

  getStatusClass(status: boolean): string {
    return status ? 'status-active' : 'status-inactive';
  }

  getStatusLabel(status: boolean): string {
    return status ? 'Active' : 'Inactive';
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-GB');
  }
}