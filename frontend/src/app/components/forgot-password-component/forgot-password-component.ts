import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { UserService } from '../../core/services/user/user-service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password-component.html',
  styleUrl: './forgot-password-component.css'
})
export class ForgotPasswordComponent {
  form: FormGroup;
  isSubmitting = false;
  error = '';
  success = '';
  showPass = false;
  showConfirm = false;

  constructor(private fb: FormBuilder, private userService: UserService, private router: Router) {
    this.form = this.fb.group({
      email:           ['', [Validators.required, Validators.email]],
      newPassword:     ['', [Validators.required, Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordsMatch });
  }

  private passwordsMatch(group: AbstractControl): ValidationErrors | null {
    const a = group.get('newPassword')?.value;
    const b = group.get('confirmPassword')?.value;
    return a && b && a !== b ? { mismatch: true } : null;
  }

  submit(): void {
    this.error = '';
    this.success = '';
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.isSubmitting = true;
    this.userService.forgotPassword(this.form.value).subscribe({
      next: () => {
        this.success = 'Password reset successfully. Redirecting to login...';
        this.isSubmitting = false;
        setTimeout(() => this.router.navigate(['/login']), 1500);
      },
      error: (err) => {
        this.error = err.error?.message || err.error || 'Failed to reset password.';
        this.isSubmitting = false;
      }
    });
  }
}
