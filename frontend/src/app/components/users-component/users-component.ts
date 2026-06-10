import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdminUserResponse, UserService } from '../../core/services/user/user-service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './users-component.html',
  styleUrl: './users-component.css'
})
export class UsersComponent implements OnInit {
  allUsers: AdminUserResponse[] = [];
  filtered: AdminUserResponse[] = [];
  isLoading = false;
  error = '';
  success = '';

  search = '';
  statusFilter: '' | 'Active' = '';
  roleFilter = '';

  detail: AdminUserResponse | null = null;
  editForm: FormGroup;
  editingId: number | null = null;
  isSubmitting = false;

  // Password reset modal
  resetForm: FormGroup;
  resetTarget: AdminUserResponse | null = null;
  showResetPwd = false;
  showResetConfirm = false;
  isResetting = false;

  readonly roles = ['Admin', 'Doctor', 'Lab Technician', 'Public Health Officer', 'Researcher', 'Compliance Officer', 'Citizen'];

  constructor(private userService: UserService, private fb: FormBuilder) {
    this.editForm = this.fb.group({
      name:        ['', [Validators.required, Validators.minLength(2)]],
      email:       ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      roleName:    ['', Validators.required]
    });
    this.resetForm = this.fb.group({
      newPassword:     ['', [Validators.required, Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)]],
      confirmPassword: ['', Validators.required]
    });
  }

  ngOnInit(): void { this.load(); }

  load(): void {
    this.isLoading = true;
    this.error = '';
    this.userService.getAllUsers().subscribe({
      next: (res: any) => {
        const raw = Array.isArray(res) ? res : (res?.data ?? []);
        // Normalize each row — backend may serialize Status as bool, "Active"/"Inactive", or 0/1
        this.allUsers = raw
          .map((u: any) => ({
            userId:   u.userId   ?? u.UserId,
            name:     u.name     ?? u.Name,
            email:    u.email    ?? u.Email,
            phone:    u.phone    ?? u.Phone,
            roleName: u.roleName ?? u.RoleName,
            status:   this.normalizeStatus(u.status ?? u.Status)
          }))
          // Newest first
          .sort((a: any, b: any) => (b.userId ?? 0) - (a.userId ?? 0));
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err) => {
        this.error = err.error?.message || err.error || 'Failed to load users.';
        this.isLoading = false;
      }
    });
  }

  /** Backend `Status` can be a bool, a string ("Active"/"Inactive"), or 0/1. Normalize to bool. */
  private normalizeStatus(v: any): boolean {
    if (typeof v === 'boolean') return v;
    if (typeof v === 'number')  return v !== 0;
    if (typeof v === 'string') {
      const s = v.trim().toLowerCase();
      if (s === 'active' || s === 'true' || s === '1') return true;
      if (s === 'inactive' || s === 'false' || s === '0') return false;
    }
    return !!v;
  }

  applyFilters(): void {
    const s = (this.search || '').toLowerCase().trim();
    this.filtered = this.allUsers.filter(u => {
      const matchesText = !s
        || u.name?.toLowerCase().includes(s)
        || u.email?.toLowerCase().includes(s);
      const matchesStatus = !this.statusFilter
        || (this.statusFilter === 'Active' && u.status === true);
      const matchesRole = !this.roleFilter || u.roleName === this.roleFilter;
      return matchesText && matchesStatus && matchesRole;
    });
  }

  showActiveOnly(): void { this.statusFilter = 'Active'; this.applyFilters(); }
  resetFilters(): void { this.search = ''; this.statusFilter = ''; this.roleFilter = ''; this.applyFilters(); }

  /** Count active users for the header pill. */
  get activeCount(): number { return this.allUsers.filter(u => u.status === true).length; }

  view(id: number): void {
    this.userService.getUserData(id).subscribe({
      next: (u: any) => {
        this.detail = {
          userId: u.userId ?? u.UserId ?? id,
          name: u.name ?? u.Name ?? '—',
          email: u.email ?? u.Email ?? '—',
          phone: u.phone ?? u.Phone ?? '—',
          roleName: u.roleName ?? u.RoleName ?? '—',
          status: typeof u.status === 'boolean' ? u.status : (u.status === 'Active' || u.Status === 'Active' || u.Status === true)
        };
      },
      error: (err) => { this.error = err.error?.message || 'Failed to fetch user.'; }
    });
  }

  closeDetail(): void { this.detail = null; }

  startEdit(u: AdminUserResponse): void {
    this.editingId = u.userId;
    this.editForm.patchValue({
      name: u.name,
      email: u.email,
      phoneNumber: u.phone,
      roleName: u.roleName
    });
  }

  cancelEdit(): void { this.editingId = null; }

  onSaveEdit(): void {
    if (!this.editingId || this.editForm.invalid) { this.editForm.markAllAsTouched(); return; }
    this.isSubmitting = true;
    const payload = {
      Name: this.editForm.value.name,
      Email: this.editForm.value.email,
      PhoneNumber: this.editForm.value.phoneNumber,
      RoleName: this.editForm.value.roleName
    } as any;
    this.userService.updateUserDate(this.editingId, payload).subscribe({
      next: () => {
        this.success = 'User updated.';
        this.isSubmitting = false;
        this.editingId = null;
        this.load();
        setTimeout(() => this.success = '', 3000);
      },
      error: (err) => {
        this.error = err.error?.message || err.error || 'Update failed.';
        this.isSubmitting = false;
      }
    });
  }

  softDelete(u: AdminUserResponse): void {
    if (!confirm(`Deactivate user "${u.name}" (#${u.userId})?`)) return;
    this.error = '';
    this.userService.deleteUserAccount(u.userId).subscribe({
      next: () => {
        // Optimistic update — flip the local row immediately so the count pills,
        // the "Inactive" filter, and the badge all reflect the change without
        // waiting for the refetch to come back.
        const idx = this.allUsers.findIndex(x => x.userId === u.userId);
        if (idx >= 0) this.allUsers[idx] = { ...this.allUsers[idx], status: false };
        this.applyFilters();
        this.success = `User #${u.userId} deactivated.`;
        // Refetch to stay in sync with the server (won't undo our optimistic flip).
        this.load();
        setTimeout(() => this.success = '', 3000);
      },
      error: (err) => {
        this.error = err.error?.message || err.error || 'Failed to deactivate.';
      }
    });
  }

  // ── Password reset (admin-driven) ──────────────────────────────
  openReset(u: AdminUserResponse): void {
    this.resetTarget = u;
    this.resetForm.reset();
    this.showResetPwd = false;
    this.showResetConfirm = false;
    this.error = '';
  }

  closeReset(): void {
    this.resetTarget = null;
    this.resetForm.reset();
  }

  onResetPassword(): void {
    if (!this.resetTarget) return;
    const v = this.resetForm.value;
    if (this.resetForm.invalid) { this.resetForm.markAllAsTouched(); return; }
    if (v.newPassword !== v.confirmPassword) {
      this.error = 'Passwords do not match.';
      return;
    }
    this.isResetting = true;
    this.error = '';
    this.userService.forgotPassword({
      email: this.resetTarget.email,
      newPassword: v.newPassword,
      confirmPassword: v.confirmPassword
    }).subscribe({
      next: () => {
        this.success = `Password reset for ${this.resetTarget?.email}.`;
        this.isResetting = false;
        this.closeReset();
        setTimeout(() => this.success = '', 3000);
      },
      error: (err) => {
        this.error = err.error?.message || err.error || 'Reset failed.';
        this.isResetting = false;
      }
    });
  }

  badge(status: boolean): string { return status ? 'badge-active' : 'badge-inactive'; }
  label(status: boolean): string { return status ? 'Active' : 'Inactive'; }
}
