import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map, Observable } from 'rxjs';
import { LabTestService } from '../../core/services/lab-test.service';
import { TokenService } from '../../core/services/token-service';
import { LabTest } from '../../core/models/lab-test.model';
import { LookupOption } from '../../core/services/lookup.service';
import { IdPickerComponent } from '../../shared/components/id-picker/id-picker';

@Component({
  selector: 'app-lab-report-upload',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink, IdPickerComponent],
  templateUrl: './lab-report-upload-component.html',
  styleUrl: './lab-report-upload-component.css'
})
export class LabReportUploadComponent implements OnInit {

  testOptions$!: Observable<LookupOption[]>;

  form: FormGroup;
  file: File | null = null;
  fileName = '';
  fileSize = '';
  myTests: LabTest[] = [];

  isSubmitting = false;
  isLoadingTests = false;
  error = '';
  success = '';
  uploadedFileURI = '';

  acceptTypes = '.pdf,.jpg,.jpeg,.png,.doc,.docx';
  maxBytes = 10 * 1024 * 1024;

  constructor(
    private fb: FormBuilder,
    private labTestService: LabTestService,
    private tokenService: TokenService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.form = this.fb.group({
      testId: [null, [Validators.required, Validators.min(1)]]
    });
  }

  ngOnInit(): void {
    const pre = this.route.snapshot.queryParamMap.get('testId');
    if (pre) this.form.patchValue({ testId: Number(pre) });
    this.loadAssignments();
  }

  loadAssignments(): void {
    this.isLoadingTests = true;
    const myId = this.tokenService.getUserId();
    this.labTestService.getLabTests({ status: 'Pending' }).subscribe({
      next: (res: any) => {
        const all = res?.data ?? res?.items ?? [];
        this.myTests = (Array.isArray(all) ? all : []).filter((t: LabTest) => Number(t.technicianId) === Number(myId));
        this.isLoadingTests = false;
      },
      error: () => { this.isLoadingTests = false; }
    });

    // Build the dropdown options — only this tech's pending tests
    this.testOptions$ = this.labTestService.getLabTests({ status: 'Pending' }).pipe(
      map((res: any) => {
        const all = res?.data ?? res?.items ?? [];
        return (Array.isArray(all) ? all : [])
          .filter((t: LabTest) => Number(t.technicianId) === Number(myId))
          .map((t: LabTest) => ({
            value: t.testId,
            label: `#${t.testId} · ${t.type}`,
            sub: `Patient #${t.patientId} · ${new Date(t.date).toLocaleDateString('en-GB')}`
          } as LookupOption));
      })
    );
  }

  onFileSelected(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const f = input.files?.[0];
    if (!f) return;
    if (f.size > this.maxBytes) {
      this.error = `File too large (max ${(this.maxBytes / 1024 / 1024).toFixed(0)} MB).`;
      input.value = '';
      return;
    }
    this.error = '';
    this.file = f;
    this.fileName = f.name;
    this.fileSize = this.formatBytes(f.size);
  }

  clearFile(): void { this.file = null; this.fileName = ''; this.fileSize = ''; }

  formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  submit(): void {
    this.error = '';
    this.success = '';
    this.uploadedFileURI = '';
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    if (!this.file) { this.error = 'Please select a report file to upload.'; return; }

    const testId = Number(this.form.value.testId);
    this.isSubmitting = true;
    this.labTestService.uploadLabReport(testId, this.file).subscribe({
      next: (res: any) => {
        this.success = res?.message || 'Lab report uploaded successfully.';
        this.uploadedFileURI = res?.data?.fileURI || '';
        this.isSubmitting = false;
        this.form.reset();
        this.clearFile();
        this.loadAssignments();
      },
      error: (err) => {
        this.error = err.error?.message || err.error || 'Upload failed. Please try again.';
        this.isSubmitting = false;
      }
    });
  }

  pickTest(t: LabTest): void {
    this.form.patchValue({ testId: t.testId });
  }
}
