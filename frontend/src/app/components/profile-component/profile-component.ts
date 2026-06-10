import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth-service';
import { UserService } from '../../core/services/user/user-service';
import { TokenService } from '../../core/services/token-service';
import { User } from '../../core/models/User';

@Component({
  selector: 'app-profile-component',
  standalone: true,
  imports: [FormsModule, RouterLink, CommonModule],
  templateUrl: './profile-component.html',
  styleUrl: './profile-component.css'
})
export class ProfileComponent implements OnInit {
  user: User = new User('', '', '', '', '', '');
  errMsg = '';
  isLoading = true;
  initials = '';
  joinedLabel = '';

  constructor(
    private authService: AuthService,
    private tokenService: TokenService,
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.getUserDetails();
  }

  getUserDetails(): void {
    this.isLoading = true;
    const id = this.tokenService.getUserId();
    this.userService.getUserData(id).subscribe({
      next: (res: any) => {
        this.user.Name = res?.name ?? '';
        this.user.Email = res?.email ?? '';
        this.user.Phone = res?.phone ?? '';
        this.user.RoleName = res?.roleName ?? '';
        this.errMsg = '';
        this.computeInitials();
        this.joinedLabel = `Member · #${id}`;
        this.isLoading = false;
      },
      error: (err) => {
        this.errMsg = typeof err.error === 'string' ? err.error : 'Failed to load profile.';
        this.isLoading = false;
      }
    });
  }

  computeInitials(): void {
    const parts = (this.user.Name || '').trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) {
      this.initials = '?';
    } else if (parts.length === 1) {
      this.initials = parts[0].charAt(0).toUpperCase();
    } else {
      this.initials = (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }
  }

  // Role → matching accent palette for the avatar/banner
  get roleColor(): { from: string; to: string; tint: string; chip: string } {
    const m: Record<string, { from: string; to: string; tint: string; chip: string }> = {
      'Admin':                 { from: '#0C447C', to: '#185FA5', tint: '#E6F1FB', chip: '#0C447C' },
      'Doctor':                { from: '#0F6E56', to: '#15a37e', tint: '#E1F5EE', chip: '#0F6E56' },
      'Lab Technician':        { from: '#854F0B', to: '#B96E0E', tint: '#FAEEDA', chip: '#854F0B' },
      'Public Health Officer': { from: '#533AB7', to: '#7B5FE3', tint: '#EEEDFE', chip: '#533AB7' },
      'Researcher':            { from: '#993556', to: '#C2547A', tint: '#FBEAF0', chip: '#993556' },
      'Compliance Officer':    { from: '#A32D2D', to: '#D04B4B', tint: '#FCEBEB', chip: '#A32D2D' },
      'Citizen':               { from: '#185FA5', to: '#2B7BD1', tint: '#E6F1FB', chip: '#185FA5' }
    };
    return m[this.user.RoleName] || m['Citizen'];
  }

  get roleIcon(): string {
    const m: Record<string, string> = {
      'Admin':                 'ti-settings',
      'Doctor':                'ti-stethoscope',
      'Lab Technician':        'ti-flask',
      'Public Health Officer': 'ti-building-hospital',
      'Researcher':            'ti-microscope',
      'Compliance Officer':    'ti-shield-check',
      'Citizen':               'ti-user'
    };
    return m[this.user.RoleName] || 'ti-user';
  }

  isAdmin(): boolean { return this.user.RoleName === 'Admin'; }

  goUpdate(): void { this.router.navigate(['/update']); }
  goDelete(): void { this.router.navigate(['/delete']); }
  logout(): void { this.authService.logout(); }
}
