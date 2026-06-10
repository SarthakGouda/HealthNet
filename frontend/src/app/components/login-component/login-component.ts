import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from "@angular/router";
import { LoginRequest } from '../../core/models/auth';
import { AuthService } from '../../core/services/auth-service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login-component',
  imports: [RouterLink, FormsModule, CommonModule],
  templateUrl: './login-component.html',
  styleUrl: './login-component.css',
})
export class LoginComponent {
  email: string;
  password: string;
  errMsg: string | null;
  isSubmitting: boolean;
  seePassword: boolean;
  
  constructor(private authService: AuthService, private router: Router){
    this.email = "";
    this.password = "";
    this.errMsg = "";
    this.isSubmitting = false;
    this.seePassword = false;
  }

  showPassword(){
    this.seePassword = !this.seePassword;
  }

  onSubmit(): void {
    if (this.isSubmitting) return;                       // guard double-clicks

    if (!this.email || !this.password) {
      this.errMsg = '*Email or Password cannot be empty.';
      return;
    }

    // Flip BEFORE the request fires so the button spinner is visible
    // for the whole duration of the network call (was inside `next` —
    // which meant the spinner only flashed after the response landed).
    this.isSubmitting = true;
    this.errMsg = null;

    const data: LoginRequest = {
      email: this.email,
      password: this.password
    };

    this.authService.login(data).subscribe({
      next: () => {
        // Keep the spinner up during the route change so the user sees
        // continuity instead of the button snapping back briefly.
        this.errMsg = null;
        this.redirectByRole();
      },
      error: (err: any) => {
        this.isSubmitting = false;
        this.errMsg = err?.status === 401
          ? '*Invalid email or password.'
          : '*Login failed. Please try again.';
        console.error(err);
      }
    });
  }

private redirectByRole(): void {
  const role = this.authService.getUserRole();
  const roleRoutes: Record<string, string> = {
    Citizen:             '/citizen-home',
    Doctor:              '/home',
    LabTechnician:       '/home',
    PublicHealthOfficer: '/home',
    Researcher:          '/home',
    Admin:               '/home/admin',
    ComplianceOfficer:   '/compliance'
  };
  this.router.navigate([roleRoutes[role ?? ''] ?? '/home']);
}

}
