import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { TokenService } from './token-service';

export interface AuthUser {
  userId: number;
  role: string | null;
  isLoggedIn: boolean;
}

const initialState: AuthUser = {
  userId: 0,
  role: null,
  isLoggedIn: false
};

@Injectable({
  providedIn: 'root'
})
export class AuthStateService {

  private authState$ = new BehaviorSubject<AuthUser>(initialState);

  constructor(private tokenService: TokenService) {
    this.initializeFromToken();
  }

  private initializeFromToken(): void {
    if (this.tokenService.isTokenPresent() && !this.tokenService.isTokenExpired()) {
      this.authState$.next({
        userId: this.tokenService.getUserId(),
        role: this.tokenService.getUserRole(),
        isLoggedIn: true
      });
    }
  }

  getAuthState(): Observable<AuthUser> {
    return this.authState$.asObservable();
  }

  isLoggedIn$(): Observable<boolean> {
    return this.authState$.pipe(map(state => state.isLoggedIn));
  }

  getUserRole$(): Observable<string | null> {
    return this.authState$.pipe(map(state => state.role));
  }

  getCurrentUser(): AuthUser {
    return this.authState$.getValue();
  }

  setLoggedIn(userId: number, role: string): void {
    console.log("set logged in called in auth state")
    this.authState$.next({
      userId,
      role,
      isLoggedIn: true
    });
  }

  setLoggedOut(): void {
    this.authState$.next(initialState);
  }
}
