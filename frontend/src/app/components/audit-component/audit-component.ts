import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuditService } from '../../core/services/audit.service';
import { AuthService } from '../../core/services/auth-service';
import { AuditFilterDto, AuditListDto } from '../../core/models/audit.model';

@Component({
  selector: 'app-audit',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './audit-component.html',
  styleUrl: './audit-component.css'
})
export class AuditComponent implements OnInit {
  audits: AuditListDto[] = [];
  isLoading = false;
  error = '';
  success = '';
  role = '';

  showCreate = false;
  isSubmitting = false;
  editingId: number | null = null;
  detail: AuditListDto | null = null;

  createForm: FormGroup;
  editForm: FormGroup;
  filterForm: FormGroup;
  getByIdForm: FormGroup;

  constructor(
    private auditService: AuditService,
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    this.createForm = this.fb.group({
      scope:    ['', [Validators.required, Validators.minLength(2)]],
      findings: ['', [Validators.required, Validators.minLength(2)]],
      status:   [true]
    });
    this.editForm = this.fb.group({
      scope:    ['', [Validators.required, Validators.minLength(2)]],
      findings: ['', [Validators.required, Validators.minLength(2)]]
    });
    this.filterForm = this.fb.group({
      auditId:   [null],
      officerId: [null],
      scope:     [''],
      findings:  [''],
      date:      ['']
    });
    this.getByIdForm = this.fb.group({
      auditId: [null, [Validators.required, Validators.min(1)]]
    });
  }

  ngOnInit(): void {
    this.role = this.authService.getUserRole();
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.error = '';
    const f: AuditFilterDto = {};
    const v = this.filterForm.value;
    if (v.auditId)   f.auditId   = Number(v.auditId);
    if (v.officerId) f.officerId = Number(v.officerId);
    if (v.scope)     f.scope     = v.scope;
    if (v.findings)  f.findings  = v.findings;
    if (v.date)      f.date      = v.date;
    this.auditService.getAudits(f).subscribe({
      next: (rows) => {
        // Newest first — auditId descending
        this.audits = [...(rows || [])].sort((a: any, b: any) => (b.auditId ?? 0) - (a.auditId ?? 0));
        this.isLoading = false;
      },
      error: (err) => {
        const msg = err.error?.message || err.error || 'Failed to load audits.';
        this.audits = [];
        if (err.status === 404) {
          this.error = '';
        } else {
          this.error = typeof msg === 'string' ? msg : 'Failed to load audits.';
        }
        this.isLoading = false;
      }
    });
  }

  clearFilters(): void {
    this.filterForm.reset({ auditId: null, officerId: null, scope: '', findings: '', date: '' });
    this.load();
  }

  // ── Create ────────────────────────────────────────────────────
  onCreate(): void {
    if (this.createForm.invalid) { this.createForm.markAllAsTouched(); return; }
    this.isSubmitting = true;
    this.auditService.createAudit(this.createForm.value).subscribe({
      next: (res: any) => {
        this.success = `Audit #${res?.auditId ?? ''} created.`;
        this.isSubmitting = false;
        this.showCreate = false;
        this.createForm.reset({ status: true });
        this.load();
        setTimeout(() => this.success = '', 3000);
      },
      error: (err) => {
        this.error = err.error?.message || err.error || 'Failed to create audit.';
        this.isSubmitting = false;
      }
    });
  }

  // ── Edit ──────────────────────────────────────────────────────
  startEdit(a: AuditListDto): void {
    if (!a.status) { this.error = 'Closed audits cannot be edited.'; return; }
    this.editingId = a.auditId;
    this.editForm.patchValue({ scope: a.scope, findings: a.findings });
    this.showCreate = false;
  }
  cancelEdit(): void { this.editingId = null; }

  onSaveEdit(): void {
    if (!this.editingId || this.editForm.invalid) { this.editForm.markAllAsTouched(); return; }
    this.isSubmitting = true;
    this.auditService.updateAudit(this.editingId, this.editForm.value).subscribe({
      next: () => {
        this.success = `Audit #${this.editingId} updated.`;
        this.editingId = null;
        this.isSubmitting = false;
        this.load();
        setTimeout(() => this.success = '', 3000);
      },
      error: (err) => {
        this.error = err.error?.message || err.error || 'Update failed.';
        this.isSubmitting = false;
      }
    });
  }

  // ── View / GetById ────────────────────────────────────────────
  view(id: number): void {
    this.auditService.getAuditById(id).subscribe({
      next: (a) => { this.detail = a; },
      error: (err) => { this.error = err.error?.message || err.error || 'Audit not found.'; }
    });
  }
  onGetById(): void {
    if (this.getByIdForm.invalid) return;
    this.view(Number(this.getByIdForm.value.auditId));
  }
  closeDetail(): void { this.detail = null; }

  // ── Close & Delete ────────────────────────────────────────────
  closeAudit(id: number): void {
    if (!confirm(`Close audit #${id}?`)) return;
    this.auditService.closeAudit(id).subscribe({
      next: () => { this.success = `Audit #${id} closed.`; this.load(); setTimeout(() => this.success = '', 3000); },
      error: (err) => { this.error = err.error?.message || err.error || 'Close failed.'; }
    });
  }
  remove(id: number): void {
    if (!confirm(`Delete audit #${id}?`)) return;
    this.auditService.deleteAudit(id).subscribe({
      next: () => { this.success = `Audit #${id} deleted.`; this.load(); setTimeout(() => this.success = '', 3000); },
      error: (err) => { this.error = err.error?.message || err.error || 'Delete failed.'; }
    });
  }

  // ── Helpers ──────────────────────────────────────────────────
  statusClass(open: boolean): string { return open ? 'badge-open' : 'badge-closed'; }
  statusLabel(open: boolean): string { return open ? 'Open' : 'Closed'; }
  formatDate(d: string): string { return d ? new Date(d).toLocaleDateString('en-GB') : '—'; }
}
