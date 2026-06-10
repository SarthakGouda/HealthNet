import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface FlowStep   { num: string; icon: string; title: string; text: string; }
interface RoleAccess { role: string; create: boolean; review: boolean; audit: boolean; }
interface ResultChip { value: string; cssClass: string; }

@Component({
  selector: 'app-compliance-component',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './compliance-component.html',
  styleUrl: './compliance-component.css'
})
export class ComplianceComponent {

  flow: FlowStep[] = [
    { num: '01', icon: 'ti-clipboard-check', title: 'Audit',    text: 'Officers scope an area — a case, a lab, an outbreak — and document what they find.' },
    { num: '02', icon: 'ti-pencil',          title: 'Record',   text: 'Each finding becomes a Compliance Record tagged with one of four outcomes.' },
    { num: '03', icon: 'ti-eye-check',       title: 'Review',   text: 'Records are filtered, updated, or closed by authorised officers — every change is attributed.' }
  ];

  roleMatrix: RoleAccess[] = [
    { role: 'Admin',                 create: true,  review: true,  audit: true  },
    { role: 'Compliance Officer',    create: true,  review: true,  audit: true  },
    { role: 'Public Health Officer', create: false, review: true,  audit: true  },
    { role: 'Doctor',                create: false, review: false, audit: false },
    { role: 'Lab Technician',        create: false, review: false, audit: false },
    { role: 'Researcher',            create: false, review: false, audit: false },
    { role: 'Citizen',               create: false, review: false, audit: false }
  ];

  results: ResultChip[] = [
    { value: 'Compliant',           cssClass: 'chip-compliant' },
    { value: 'Non-Compliant',       cssClass: 'chip-non' },
    { value: 'Partially Compliant', cssClass: 'chip-partial' },
    { value: 'Pending Review',      cssClass: 'chip-pending' }
  ];
}
