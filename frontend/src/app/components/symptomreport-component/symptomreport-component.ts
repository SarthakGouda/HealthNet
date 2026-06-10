import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SymptomReportService } from '../../core/services/symptom-report';
import { AuthService } from '../../core/services/auth-service';
import { TokenService } from '../../core/services/token-service';
import { SymptomReportResponse, SymptomsJsonPayload } from '../../core/models/symptom-report';

@Component({
  selector: 'app-symptom-report',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './symptomreport-component.html',
  styleUrl: './symptomreport-component.css'
})
export class SymptomReportComponent implements OnInit {

  reportForm: FormGroup;
  isLoading = false;
  isSubmitted = false;
  errorMessage = '';
  myReports: SymptomReportResponse[] = [];
  activeTab: 'create' | 'history' = 'create';

  commonSymptoms: string[] = [
    'fever', 'cough', 'headache', 'fatigue',
    'soreThroat', 'shortnessOfBreath', 'bodyAche',
    'nausea', 'vomiting', 'diarrhea', 'chills', 'lossOfTasteOrSmell'
  ];

  symptomLabels: Record<string, string> = {
    fever: 'Fever',
    cough: 'Cough',
    headache: 'Headache',
    fatigue: 'Fatigue',
    soreThroat: 'Sore Throat',
    shortnessOfBreath: 'Shortness of Breath',
    bodyAche: 'Body Ache',
    nausea: 'Nausea',
    vomiting: 'Vomiting',
    diarrhea: 'Diarrhea',
    chills: 'Chills',
    lossOfTasteOrSmell: 'Loss of Taste/Smell'
  };

  selectedSymptoms: Set<string> = new Set();

  constructor(
    private fb: FormBuilder,
    private symptomReportService: SymptomReportService,
    private authService: AuthService,
    private tokenService: TokenService,
    private router: Router
  ) {
    this.reportForm = this.fb.group({
      date: [this.todayDate(), Validators.required],
      temperature:      [null, [Validators.required, Validators.min(90),  Validators.max(115)]],
      oxygenSaturation: [null, [Validators.required, Validators.min(50),  Validators.max(100)]],
      heartRate:        [null, [Validators.min(30),  Validators.max(220)]],
      bpSystolic:       [null, [Validators.min(60),  Validators.max(250)]],
      bpDiastolic:      [null, [Validators.min(40),  Validators.max(150)]],
      respiratoryRate:  [null, [Validators.min(5),   Validators.max(60)]],
      weight:           [null, [Validators.min(1),   Validators.max(300)]],
      otherSymptoms:    ['', Validators.maxLength(500)],
      symptoms:         this.fb.array([])
    });
  }

  navigateToHistory(): void {
    this.router.navigate(['/symptom-history']);
  }
  navigateToHome(path: string): void {
    this.router.navigate([path]);
  }

  ngOnInit(): void {
     if (!this.authService.isLoggedIn()) {
       this.router.navigate(['/login']);
       return;
     }
     if (!this.authService.hasRole('Citizen')) {
       this.router.navigate(['/unauthorized']);
       return;
     }
    this.loadMyReports();
  }

  get symptomsArray(): FormArray {
    return this.reportForm.get('symptoms') as FormArray;
  }

  todayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  toggleSymptom(key: string): void {
    if (this.selectedSymptoms.has(key)) {
      this.selectedSymptoms.delete(key);
      const index = this.symptomsArray.controls.findIndex(c => c.get('name')?.value === key);
      if (index >= 0) this.symptomsArray.removeAt(index);
    } else {
      this.selectedSymptoms.add(key);
      this.symptomsArray.push(this.fb.group({
        name: [key],
        severity: ['MILD', Validators.required]
      }));
    }
  }

  isSelected(key: string): boolean {
    return this.selectedSymptoms.has(key);
  }

  setSeverity(name: string, severity: string): void {
    const ctrl = this.symptomsArray.controls.find(c => c.get('name')?.value === name);
    ctrl?.get('severity')?.setValue(severity);
  }

  onSubmit(): void {

    if (this.selectedSymptoms.size === 0) {
      this.errorMessage = 'Please select at least one symptom.';
      return;
    }
    if (this.reportForm.invalid) {
      this.reportForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    // Compact payload — backend SymptomsJson column is small, so we only send
    // selected symptoms (true ones) and non-null vitals.
    const commonSymptoms: Record<string, boolean> = {};
    this.selectedSymptoms.forEach(k => { commonSymptoms[k] = true; });

    const vitalsRaw = {
      temperature:     this.reportForm.get('temperature')?.value,
      oxygenLevel:     this.reportForm.get('oxygenSaturation')?.value,
      heartRate:       this.reportForm.get('heartRate')?.value,
      bpSystolic:      this.reportForm.get('bpSystolic')?.value,
      bpDiastolic:     this.reportForm.get('bpDiastolic')?.value,
      respiratoryRate: this.reportForm.get('respiratoryRate')?.value,
      weight:          this.reportForm.get('weight')?.value
    };
    const vitals: Record<string, number> = {};
    Object.entries(vitalsRaw).forEach(([k, v]) => {
      if (v != null && v !== '' && !Number.isNaN(Number(v))) vitals[k] = Number(v);
    });

    const otherSymptoms = (this.reportForm.get('otherSymptoms')?.value ?? '').trim();

    const compactPayload: any = { commonSymptoms };
    if (Object.keys(vitals).length > 0) compactPayload.vitals = vitals;
    if (otherSymptoms) compactPayload.otherSymptoms = otherSymptoms.slice(0, 200);

    const request = {
      symptomsJson: JSON.stringify(compactPayload),
      date: new Date(this.reportForm.get('date')?.value).toISOString()
    };

    this.symptomReportService.submitReport(request).subscribe({
      next: () => {
        this.isLoading = false;
        this.isSubmitted = true;
        this.selectedSymptoms.clear();
        this.symptomsArray.clear();
        this.reportForm.reset({ date: this.todayDate() });
        this.loadMyReports();
      },
      error: (err) => {
        this.isLoading = false;
        console.log('Full error:', err);
        console.log('Error body:', err.error);
        if (err.status === 400) {
          this.errorMessage = err.error?.detail ?? err.error?.title ?? JSON.stringify(err.error) ?? 'Invalid request.';
        } else if (err.status === 401) {
          this.errorMessage = 'Session expired. Please log in again.';
        } else if (err.status === 403) {
          this.errorMessage = 'You are not authorized to submit reports.';
        } else {
          this.errorMessage = 'Failed to submit report. Please try again.';
        }
      }
    });
  }

  loadMyReports(): void {
    this.symptomReportService.getMyReports().subscribe({
      next: (res) => this.myReports = res.items ?? [],    
      error: () => { }
    });
  }

  parsedSymptoms(symptomsJson: string): string[] {
    try {
      const parsed: any = JSON.parse(symptomsJson);
      const cs = parsed?.commonSymptoms ?? {};
      const selected = Object.entries(cs)
        .filter(([, val]) => val === true)
        .map(([key]) => this.symptomLabels[key] ?? key);
      if (parsed?.otherSymptoms) selected.push(parsed.otherSymptoms);
      return selected.length ? selected : ['—'];
    } catch {
      return [symptomsJson];
    }
  }

  parsedVitals(symptomsJson: string): string | null {
    try {
      const parsed: SymptomsJsonPayload = JSON.parse(symptomsJson);
      const v = parsed.vitals;
      const parts: string[] = [];
      if (v?.['temperature']) parts.push(`Temp: ${v['temperature']}°F`);
      if (v?.['heartRate']) parts.push(`HR: ${v['heartRate']} BPM`);
      if (v?.['oxygenLevel']) parts.push(`SpO₂: ${v['oxygenLevel']}%`);
      if (v?.['bpSystolic']) parts.push(`BP: ${v['bpSystolic']}/${v['bpDiastolic']} mmHg`);
      return parts.length ? parts.join(' · ') : null;
    } catch {
      return null;
    }
  }

  resetForm(): void {
    this.isSubmitted = false;
    this.errorMessage = '';
    this.selectedSymptoms.clear();
    this.symptomsArray.clear();
    this.reportForm.reset({ date: this.todayDate() });
  }

  logout(): void {
    this.authService.logout();
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      Submitted: 'status-submitted',
      UnderReview: 'status-underreview',
      Reviewed: 'status-reviewed',
      Closed: 'status-closed'
    };
    return map[status] ?? 'status-submitted';
  }
}
