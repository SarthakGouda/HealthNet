import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AnalyticsService } from '../../core/services/analytics.service';
import { AuthService } from '../../core/services/auth-service';

interface BarSlice { label: string; value: number; cssClass: string; }
interface DonutSlice { label: string; value: number; color: string; }

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './analytics-component.html',
  styleUrl: './analytics-component.css'
})
export class AnalyticsComponent implements OnInit {
  role = '';
  isLoading = false;
  error = '';
  activeTab: 'cases' | 'patients' | 'outbreaks' | 'epidemiology' | 'compliance' = 'outbreaks';

  caseData: any = null;
  patientData: any = null;
  complianceData: any = null;
  outbreakData: any = null;
  epiData: any = null;

  startDate = '';
  endDate   = '';
  statusFilter = '';

  constructor(
    private analyticsService: AnalyticsService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.role = this.authService.getUserRole() || 'Citizen';
    this.activeTab = this.role === 'Citizen' ? 'outbreaks' : 'cases';
    this.loadAll();
  }

  // ── Role-aware tabs ────────────────────────────────────────────
  get tabs(): Array<'cases' | 'patients' | 'outbreaks' | 'epidemiology' | 'compliance'> {
    // Outbreak + epidemiology are public health data — visible to everyone.
    // Cases/patients are operational — staff only.
    if (this.role === 'Citizen') {
      return ['outbreaks', 'epidemiology'];
    }
    const base: any[] = ['cases', 'patients', 'outbreaks', 'epidemiology'];
    if (['Admin', 'Compliance Officer'].includes(this.role)) base.push('compliance');
    return base;
  }

  // ── Data load ──────────────────────────────────────────────────
  loadAll(): void {
    this.isLoading = true;
    this.error = '';
    const filters: any = {};
    if (this.startDate) filters.startDate = this.startDate;
    if (this.endDate)   filters.endDate   = this.endDate;
    if (this.statusFilter) filters.status = this.statusFilter;

    // Outbreaks + epidemiology — every authenticated user can hit these
    this.analyticsService.getOutbreakAnalytics(filters).subscribe({
      next: d => this.outbreakData = d,
      error: () => {}
    });
    this.analyticsService.getEpidemiologicalAnalytics(filters).subscribe({
      next: d => this.epiData = d,
      error: () => {}
    });

    // Cases + patients — Citizens may not be authorized, swallow 403 quietly
    if (this.role !== 'Citizen') {
      this.analyticsService.getCaseAnalytics(filters).subscribe({ next: d => this.caseData = d, error: () => {} });
      this.analyticsService.getPatientAnalytics(filters).subscribe({ next: d => this.patientData = d, error: () => {} });
    }

    // Compliance — Admin / Compliance Officer only
    if (['Admin', 'Compliance Officer'].includes(this.role)) {
      this.analyticsService.getComplianceMetrics(filters).subscribe({ next: d => this.complianceData = d, error: () => {} });
    }

    // Stop spinner shortly — fetches are independent and we don't want to wait on the slowest one
    setTimeout(() => this.isLoading = false, 400);
  }

  applyFilters(): void { this.loadAll(); }

  // ── Chart data builders ────────────────────────────────────────
  caseBars(): BarSlice[] {
    if (!this.caseData) return [];
    return [
      { label: 'Active',   value: this.caseData.activecases   ?? 0, cssClass: 'bar-amber' },
      { label: 'Resolved', value: this.caseData.inActiveCases ?? 0, cssClass: 'bar-green' }
    ];
  }

  patientBars(): BarSlice[] {
    if (!this.patientData) return [];
    return [
      { label: 'Active',   value: this.patientData.activePatients   ?? 0, cssClass: 'bar-green' },
      { label: 'Inactive', value: this.patientData.inActivePatients ?? 0, cssClass: 'bar-gray' }
    ];
  }

  outbreakBars(): BarSlice[] {
    if (!this.outbreakData) return [];
    return [
      { label: 'Active',   value: this.outbreakData.activeOutbreaks   ?? 0, cssClass: 'bar-red' },
      { label: 'Resolved', value: this.outbreakData.resolvedOutbreaks ?? 0, cssClass: 'bar-green' }
    ];
  }

  epiBars(): BarSlice[] {
    if (!this.epiData) return [];
    return [
      { label: 'Active Epi',     value: this.epiData.activeEpidemiologies ?? 0, cssClass: 'bar-amber' },
      { label: 'Active Outbr.',  value: this.epiData.activeOutbreaks      ?? 0, cssClass: 'bar-red' },
      { label: 'Inactive Outbr', value: this.epiData.inActiveOutbreaks    ?? 0, cssClass: 'bar-gray' }
    ];
  }

  complianceDonut(): DonutSlice[] {
    if (!this.complianceData) return [];
    return [
      { label: 'Compliant',   value: this.complianceData.compliantRecords ?? 0,           color: '#22c55e' },
      { label: 'Non-Comp.',   value: this.complianceData.nonCompliantRecords ?? 0,        color: '#dc2626' },
      { label: 'Partial',     value: this.complianceData.partiallyCompliantRecords ?? 0,  color: '#f59e0b' },
      { label: 'Pending',     value: this.complianceData.pendingReviewRecords ?? 0,       color: '#6366f1' }
    ];
  }

  // Map outbreak rows to bars per disease (top 6)
  outbreakByDisease(): BarSlice[] {
    const rows = this.outbreakData?.data || [];
    const counts: Record<string, number> = {};
    rows.forEach((o: any) => {
      const k = (o.disease || o.Disease || '—').toString();
      counts[k] = (counts[k] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([label, value]) => ({ label, value, cssClass: 'bar-blue' }));
  }

  // ── SVG helpers ────────────────────────────────────────────────
  maxBar(bars: BarSlice[]): number {
    const m = Math.max(...bars.map(b => b.value), 1);
    return m;
  }
  barWidthPct(b: BarSlice, bars: BarSlice[]): number {
    return (b.value / this.maxBar(bars)) * 100;
  }

  donutTotal(slices: DonutSlice[]): number {
    return slices.reduce((s, x) => s + x.value, 0) || 1;
  }
  // Returns the stroke-dasharray for each donut slice
  donutDash(value: number, total: number, circumference: number): string {
    const portion = (value / total) * circumference;
    return `${portion} ${circumference - portion}`;
  }
  // Cumulative offset for donut slice positioning
  donutOffset(slices: DonutSlice[], i: number, total: number, circumference: number): number {
    let acc = 0;
    for (let k = 0; k < i; k++) acc += (slices[k].value / total) * circumference;
    return -acc;
  }

  pct(n: number): string { return n != null ? n.toFixed(1) + '%' : '—'; }
  fmt(n: number): string { return n != null ? n.toLocaleString() : '0'; }
}
