import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth-service';
import { TokenService } from '../../../core/services/token-service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  roles: string[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar-component.html',
  styleUrl: './sidebar-component.css'
})
export class SidebarComponent implements OnInit {
  role: string = '';
  userName: string = '';
  isCollapsed = false;

  allNavItems: NavItem[] = [
    // Citizen
    { label: 'Home',              icon: 'ti-home',              route: '/citizen-home',       roles: ['Citizen'] },
    { label: 'Report Symptoms',   icon: 'ti-report-medical',    route: '/symptom-report',     roles: ['Citizen'] },
    { label: 'My Reports',        icon: 'ti-clipboard-list',    route: '/symptom-history',    roles: ['Citizen'] },
    // Shared / staff dashboard
    { label: 'Dashboard',         icon: 'ti-home',              route: '/home',               roles: ['Doctor', 'Public Health Officer', 'Researcher', 'Compliance Officer', 'Lab Technician', 'Admin'] },
    // Clinical
    { label: 'Patients',          icon: 'ti-users',             route: '/patients',           roles: ['Doctor', 'Admin', 'Public Health Officer', 'Lab Technician'] },
    { label: 'Cases',             icon: 'ti-stethoscope',       route: '/cases',              roles: ['Doctor', 'Public Health Officer', 'Admin'] },
    { label: 'Medical Records',   icon: 'ti-heartbeat',         route: '/medical-records',    roles: ['Doctor', 'Admin'] },
    { label: 'Symptom Reports',   icon: 'ti-clipboard-text',    route: '/all-symptom-reports',roles: ['Doctor', 'Researcher', 'Public Health Officer', 'Admin'] },
    // Lab
    { label: 'Lab Tests',         icon: 'ti-flask',             route: '/lab-tests',          roles: ['Doctor', 'Lab Technician', 'Admin'] },
    { label: 'My Assignments',    icon: 'ti-clipboard-data',    route: '/lab-tests/my-assignments', roles: ['Lab Technician'] },
    { label: 'Upload Report',     icon: 'ti-upload',            route: '/lab-tests/upload-report',  roles: ['Lab Technician'] },
    { label: 'Lab Reports',       icon: 'ti-file-analytics',    route: '/lab-tests',          roles: ['Researcher', 'Compliance Officer'] },
    // Outbreak
    { label: 'Outbreaks',         icon: 'ti-virus',             route: '/outbreaks',          roles: ['Doctor', 'Public Health Officer', 'Admin'] },
    { label: 'Epidemiology',      icon: 'ti-microscope',        route: '/epidemiology',       roles: ['Doctor', 'Public Health Officer', 'Admin'] },
    // Compliance & audit
    { label: 'Compliance',        icon: 'ti-shield-check',      route: '/compliance-records', roles: ['Compliance Officer', 'Admin'] },
    { label: 'New Compliance',    icon: 'ti-shield-plus',       route: '/compliance-records/new', roles: ['Compliance Officer', 'Admin'] },
    { label: 'Audit',             icon: 'ti-clipboard-check',   route: '/audit',              roles: ['Compliance Officer', 'Public Health Officer', 'Admin'] },
    // Analytics — visible to everyone
    { label: 'Analytics',         icon: 'ti-chart-bar',         route: '/analytics',          roles: ['Citizen', 'Doctor', 'Lab Technician', 'Public Health Officer', 'Researcher', 'Compliance Officer', 'Admin'] },
    // Admin
    { label: 'User Management',   icon: 'ti-users-group',       route: '/users',              roles: ['Admin'] },
  ];

  get navItems(): NavItem[] {
    return this.allNavItems.filter(item => item.roles.includes(this.role));
  }

  constructor(
    private authService: AuthService,
    private tokenService: TokenService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.role = this.tokenService.getUserRole() || '';
    this.userName = this.tokenService.getUserEmail()?.split('@')[0] || 'User';
  }

  logout(): void {
    this.authService.logout();
  }

  toggleCollapse(): void {
    this.isCollapsed = !this.isCollapsed;
  }

  getRoleColor(): string {
    const map: Record<string, string> = {
      'Citizen': '#185FA5',
      'Doctor': '#0F6E56',
      'Lab Technician': '#854F0B',
      'Public Health Officer': '#533AB7',
      'Researcher': '#993556',
      'Compliance Officer': '#A32D2D',
      'Admin': '#0C447C'
    };
    return map[this.role] || '#185FA5';
  }

  getRoleBg(): string {
    const map: Record<string, string> = {
      'Citizen': '#E6F1FB',
      'Doctor': '#E1F5EE',
      'Lab Technician': '#FAEEDA',
      'Public Health Officer': '#EEEDFE',
      'Researcher': '#FBEAF0',
      'Compliance Officer': '#FCEBEB',
      'Admin': '#E6F1FB'
    };
    return map[this.role] || '#E6F1FB';
  }
}
