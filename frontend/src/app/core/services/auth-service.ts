import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { TokenService } from './token-service';
import { AuthStateService } from './auth-state';
import { environment } from '../../../environments/environment';
import { LoginRequest, LoginResponse } from '../models/auth';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly apiUrl = environment.apiUrl;
  
  private isLoggedInSubject = new BehaviorSubject<boolean>(false);

  // Observable for components to subscribe
  isLoggedIn$ = this.isLoggedInSubject.asObservable();

  constructor(
    private http: HttpClient,
    private tokenService: TokenService,
    private authStateService: AuthStateService,
    private router: Router
  ) {  
    this.isLoggedInSubject.next(this.isLoggedIn());
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
  return this.http.post<LoginResponse>(`${this.apiUrl}/User`, credentials).pipe(
    tap(response => {
      this.tokenService.setToken(response.token);
      const userId: number = this.tokenService.getUserId();
      const role: string = this.tokenService.getUserRole();
      this.authStateService.setLoggedIn(userId, role);
      this.isLoggedInSubject.next(true);
    })
  );
}

  logout(): void {
    this.tokenService.removeToken();
    this.authStateService.setLoggedOut();
    this.isLoggedInSubject.next(false);
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return this.tokenService.isTokenPresent() && !this.tokenService.isTokenExpired();
  }

  getUserRole(): string  {
    return this.tokenService.getUserRole();
  }

  hasRole(role: string): boolean {
    return this.getUserRole() === role;
  }

  hasAnyRole(roles: string[]): boolean {
    const userRole = this.getUserRole();
    return userRole ? roles.includes(userRole) : false;
  }
}
