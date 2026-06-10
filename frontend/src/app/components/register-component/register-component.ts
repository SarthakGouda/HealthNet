import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { User } from '../../core/models/User';
import { UserService } from '../../core/services/user/user-service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-register-component',
  imports: [FormsModule, CommonModule, MatIconModule, RouterLink],
  templateUrl: './register-component.html',
  styleUrl: './register-component.css',
})
export class RegisterComponent {
  name: string = '';
  email: string = '';
  password: string = '';
  confirmPassword: string = '';
  phoneNumber: string = '';
  role: string = '';
  errMsg: string | null = '';
  passwordMatch: boolean = true;
  user: User;
  isSubmitting: boolean = false;
  isStrongPassword: boolean = false;
  seePassword: boolean = false;
  seeConfirmPassword: boolean = false;

  constructor(private userService: UserService, private router: Router) {
    this.user = new User('', '', '', '', '', '');
  }

  checkStrongPassword(value: string): boolean {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
    return regex.test(value);
  }

  onPasswordChange(): void {
    this.isStrongPassword = this.checkStrongPassword(this.password);
  }

  onConfirmPasswordChange(): void {
    this.passwordMatch = this.password === this.confirmPassword;
  }

  showPassword(): void { this.seePassword = !this.seePassword; }
  showConfirmPassword(): void { this.seeConfirmPassword = !this.seeConfirmPassword; }

  isValidPhoneNumber(value: string): boolean {
    return /^\d{10}$/.test(value);
  }

  onPhoneNumberChange(): void {
    if (this.phoneNumber && !this.isValidPhoneNumber(this.phoneNumber)) {
      this.errMsg = '*Enter a valid 10-digit number (digits only, no +91 prefix).';
    } else {
      this.errMsg = '';
    }
  }

  onSubmit(): void {
    this.errMsg = '';

    if (!this.name || !this.email || !this.password ||
      !this.confirmPassword || !this.role || !this.phoneNumber) {
      this.errMsg = '*All fields are required.';
      return;
    }

    if (!this.isStrongPassword) {
      this.errMsg = '*Password must have uppercase, lowercase, a digit and a special character.';
      return;
    }

    if (!this.passwordMatch) {
      this.errMsg = '*Passwords do not match.';
      return;
    }

    if (!this.isValidPhoneNumber(this.phoneNumber)) {
      this.errMsg = '*Phone must be exactly 10 digits (no spaces, no +91).';
      return;
    }

    this.user = new User(
      this.name,
      this.email,
      this.password,
      this.confirmPassword,
      this.phoneNumber,
      this.role
    );

    console.log('Registering:', JSON.stringify(this.user));
    this.isSubmitting = true;

    this.userService.register(this.user).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.errMsg = null;
        this.router.navigate(['/login']);
      },
      error: (err: any) => {
        this.isSubmitting = false;
        console.error('Register error status:', err.status);
        console.error('Register error body:', err.error);

        if (typeof err.error === 'string') {
          this.errMsg = '*' + err.error;
        } else if (err.error?.errors) {
          this.errMsg = '*' + Object.values(err.error.errors).flat().join(' ');
        } else if (err.error?.message) {
          this.errMsg = '*' + err.error.message;
        } else if (err.error?.title) {
          this.errMsg = '*' + err.error.title;
        } else {
          this.errMsg = '*Registration failed (HTTP ' + err.status + '). See console for details.';
        }
      }
    });
  }
}
