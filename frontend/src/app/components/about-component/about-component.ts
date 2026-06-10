import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth-service';

interface Pillar { icon: string; title: string; text: string; }
interface Stat   { num: string; label: string; }
interface Module { img: string; tag: string; title: string; text: string; }

@Component({
  selector: 'app-about-component',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './about-component.html',
  styleUrl: './about-component.css',
})
export class AboutComponent {
  isloggedIn: boolean;

  // Numeric stats below the hero
  stats: Stat[] = [
    { num: '7',   label: 'User roles' },
    { num: '12+', label: 'API resources' },
    { num: '4',   label: 'Compliance outcomes' },
    { num: '24/7',label: 'Outbreak monitoring' }
  ];

  pillars: Pillar[] = [
    { icon: 'ti-shield-check', title: 'Privacy-first',    text: 'JWT-secured access, role-scoped endpoints, soft-delete by default — patient data never leaves the boundary it belongs in.' },
    { icon: 'ti-activity',     title: 'Real-time signals', text: 'Citizen symptom reports feed clinical cases and outbreak signals so officers see what\'s happening as it unfolds.' },
    { icon: 'ti-clipboard-data',title: 'Audit-ready',     text: 'Every mutation is attributed to a named user. Compliance officers can filter, review and close audits without leaving the app.' },
    { icon: 'ti-stack-3',      title: 'One platform',     text: 'Citizens, doctors, lab techs, officers, researchers and admins all work from the same data — no spreadsheets, no email chains.' }
  ];

  // Use the pre-existing screenshots in /assets/images
  modules: Module[] = [
    { img: 'assets/images/image1.png', tag: 'Citizen',    title: 'Submit symptoms in minutes',  text: 'Citizens select symptoms, log vitals and submit reports that get routed to the right officer.' },
    { img: 'assets/images/image2.png', tag: 'Clinician',  title: 'Cases & medical records',     text: 'Doctors triage symptom reports, open cases, write diagnoses, and maintain medical-record history per patient.' },
    { img: 'assets/images/image3.png', tag: 'Lab',        title: 'Tests & report uploads',      text: 'Technicians see assignments, run tests, and upload signed reports back into the system.' },
    { img: 'assets/images/image4.png', tag: 'Public Health', title: 'Outbreaks & epidemiology', text: 'Officers track outbreaks across locations, record epidemiology metrics, and watch trend lines in real time.' },
    { img: 'assets/images/image5.png', tag: 'Analytics',  title: 'Dashboards that lead to action', text: 'Cases, patients, outbreaks, epidemiology and compliance — every metric is charted and filterable.' }
  ];

  constructor(private authService: AuthService) {
    this.isloggedIn = this.authService.isLoggedIn();
  }
}
