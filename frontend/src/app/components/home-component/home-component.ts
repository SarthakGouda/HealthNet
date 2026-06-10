import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth-service';
import { FooterComponent } from '../../shared/components/footer-component/footer-component';

interface Feature { icon: string; tint: string; color: string; title: string; text: string; }
interface RoleCard { icon: string; tint: string; color: string; role: string; line: string; }

@Component({
  selector: 'app-home-component',
  standalone: true,
  imports: [CommonModule, RouterLink, FooterComponent],
  templateUrl: './home-component.html',
  styleUrl: './home-component.css',
})
export class HomeComponent {
  isLoggedIn = false;

  constructor(private authService: AuthService) {
    this.isLoggedIn = this.authService.isLoggedIn();
  }

  features: Feature[] = [
    { icon: 'ti-activity',     tint: '#E6F1FB', color: '#185FA5', title: 'Real-time signals',   text: 'Citizen symptom reports flow straight into clinical triage and outbreak tracking — no spreadsheets, no delay.' },
    { icon: 'ti-shield-check', tint: '#FCEBEB', color: '#791F1F', title: 'Compliance built-in', text: 'Every record is tagged Compliant, Partial, Non-Compliant or Pending Review — every mutation is attributed.' },
    { icon: 'ti-microscope',   tint: '#FAEEDA', color: '#854F0B', title: 'Lab pipeline',        text: 'Doctors order tests, technicians upload signed reports, results route back into the case file.' },
    { icon: 'ti-virus',        tint: '#EEEDFE', color: '#533AB7', title: 'Outbreak watch',      text: 'Track diseases by location and severity with live epidemiology metrics — cases, recoveries, Rt-now.' },
    { icon: 'ti-chart-bar',    tint: '#E1F5EE', color: '#0F6E56', title: 'Insightful analytics',text: 'Cases, patients, outbreaks and compliance — every metric is charted and filterable.' },
    { icon: 'ti-users-group',  tint: '#E6F1FB', color: '#0C447C', title: 'Role-aware access',   text: 'Seven distinct roles, server-enforced. Citizens see their own data; officers see what they oversee.' }
  ];

  roleCards: RoleCard[] = [
    { icon: 'ti-stethoscope',       tint: '#E1F5EE', color: '#0F6E56', role: 'Doctor',                line: 'Triage symptoms, manage cases & medical records.' },
    { icon: 'ti-flask',             tint: '#FAEEDA', color: '#854F0B', role: 'Lab Technician',        line: 'Run tests, upload signed reports for assigned cases.' },
    { icon: 'ti-building-hospital', tint: '#EEEDFE', color: '#533AB7', role: 'Public Health Officer', line: 'Track outbreaks, log epidemiology, run audits.' },
    { icon: 'ti-shield-check',      tint: '#FCEBEB', color: '#A32D2D', role: 'Compliance Officer',    line: 'Review records, mark outcomes, close findings.' },
    { icon: 'ti-microscope',        tint: '#FBEAF0', color: '#993556', role: 'Researcher',            line: 'Read-only access to anonymized population data.' },
    { icon: 'ti-user',              tint: '#E6F1FB', color: '#185FA5', role: 'Citizen',               line: 'Submit symptom reports, view your history.' }
  ];

  stats = [
    { num: '7',   label: 'User roles' },
    { num: '12+', label: 'API modules' },
    { num: '4',   label: 'Compliance outcomes' },
    { num: '24/7',label: 'Outbreak monitoring' }
  ];
}
