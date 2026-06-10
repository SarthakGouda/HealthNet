import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { UserService } from '../../core/services/user/user-service';
import { AuthService } from '../../core/services/auth-service';
import { TokenService } from '../../core/services/token-service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './admin-dashboard-component.html',
  styleUrl: './admin-dashboard-component.css'
})
export class AdminDashboardComponent implements OnInit {
  users: any[] = [];
  filteredUsers: any[] = [];
  isLoading = false;
  error = '';
  success = '';
  searchTerm = '';
  selectedRole = '';
  today = new Date();
  adminName = '';
  updateTargetId: number | null = null;
  deleteTargetId: number | null = null;

  roles = ['Citizen', 'Doctor', 'Lab Technician', 'Public Health Officer', 'Researcher', 'Compliance Officer', 'Admin'];

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private tokenService: TokenService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.adminName = this.tokenService.getUserEmail()?.split('@')[0] || 'Admin';
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading = true;
    this.userService.getAllUsers().subscribe({
      next: (res: any) => {
        const list = res?.data ?? (Array.isArray(res) ? res : []);
        // Newest first
        this.users = [...list].sort((a: any, b: any) =>
          ((b.userId ?? b.UserId) ?? 0) - ((a.userId ?? a.UserId) ?? 0)
        );
        this.applyFilter();
        this.isLoading = false;
      },
      error: (err) => { this.error = err.error?.message || 'Failed to load users.'; this.isLoading = false; }
    });
  }

  applyFilter(): void {
    let u = [...this.users];
    if (this.searchTerm) {
      const q = this.searchTerm.toLowerCase();
      u = u.filter(x => (x.name ?? x.Name ?? '').toLowerCase().includes(q) || (x.email ?? x.Email ?? '').toLowerCase().includes(q));
    }
    if (this.selectedRole) {
      u = u.filter(x => (x.roleName ?? x.role ?? x.RoleName ?? '').toLowerCase() === this.selectedRole.toLowerCase());
    }
    this.filteredUsers = u;
  }

  deleteUser(id: number): void {
    if (!confirm('Deactivate this user?')) return;
    this.userService.deleteUserAccount(id).subscribe({
      next: () => { this.success = 'User deactivated.'; this.loadUsers(); setTimeout(() => this.success = '', 3000); },
      error: (err) => { this.error = err.error?.message || 'Failed to deactivate.'; }
    });
  }

  getRoleColor(role: string): string {
    const m: Record<string,string> = {
      Admin:'#0C447C', Doctor:'#0F6E56', 'Lab Technician':'#854F0B',
      'Public Health Officer':'#533AB7', Researcher:'#993556',
      'Compliance Officer':'#A32D2D', Citizen:'#185FA5'
    };
    return m[role] ?? '#718096';
  }

  getRoleBg(role: string): string {
    const m: Record<string,string> = {
      Admin:'#E6F1FB', Doctor:'#E1F5EE', 'Lab Technician':'#FAEEDA',
      'Public Health Officer':'#EEEDFE', Researcher:'#FBEAF0',
      'Compliance Officer':'#FCEBEB', Citizen:'#E6F1FB'
    };
    return m[role] ?? '#f5f5f5';
  }

  /** Backend may serialize Status as bool, "Active"/"Inactive", or 0/1. */
  private isActive(u: any): boolean {
    const v = u?.status ?? u?.Status;
    if (typeof v === 'boolean') return v;
    if (typeof v === 'number')  return v !== 0;
    if (typeof v === 'string') {
      const s = v.trim().toLowerCase();
      return s === 'active' || s === 'true' || s === '1';
    }
    return !!v;
  }

  get totalUsers(): number    { return this.users.length; }
  get activeUsers(): number   { return this.users.filter(u => this.isActive(u)).length; }
  get activePercent(): number { return this.totalUsers ? Math.round((this.activeUsers / this.totalUsers) * 100) : 0; }
  get adminCount(): number    { return this.users.filter(u => (u.roleName ?? u.role ?? u.RoleName) === 'Admin').length; }
  get citizenCount(): number  { return this.users.filter(u => (u.roleName ?? u.role ?? u.RoleName) === 'Citizen').length; }
  get staffCount(): number {
    return this.users.filter(u => {
      const r = u.roleName ?? u.role ?? u.RoleName;
      return r && r !== 'Citizen' && r !== 'Admin';
    }).length;
  }

  get totalByRole(): Record<string, number> {
    const r: Record<string, number> = {};
    this.users.forEach(u => {
      const role = u.roleName ?? u.role ?? u.RoleName ?? 'Unknown';
      r[role] = (r[role] ?? 0) + 1;
    });
    return r;
  }
}
