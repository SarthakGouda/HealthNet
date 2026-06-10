import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TokenService {
  private readonly TOKEN_KEY = 'healthnet_token';

  getToken(): string | null {
    return sessionStorage.getItem(this.TOKEN_KEY);
  }

  setToken(token: string): void {
    sessionStorage.setItem(this.TOKEN_KEY, token);
  }

  removeToken(): void {
    sessionStorage.removeItem(this.TOKEN_KEY);
  }

  isTokenPresent(): boolean {
    return !!this.getToken();
  }

  decodeToken(): any | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload));
    } catch {
      return null;
    }
  }

  isTokenExpired(): boolean {
    const decoded = this.decodeToken();
    if (!decoded || !decoded.exp) return true;
    return decoded.exp * 1000 < Date.now();
  }

  getUserRole(): string {
    const decoded = this.decodeToken();
    if (!decoded) return '';

    // Log full token so you can confirm the exact claim key
    console.log('JWT claims:', JSON.stringify(decoded));

    return (
      decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ||
      decoded['role'] ||
      decoded['Role'] ||
      decoded['roles']?.[0] ||
      decoded['Roles']?.[0] ||
      decoded['RoleName'] ||
      decoded['roleName'] ||
      ''
    );
  }

  getUserId(): number {
    const decoded = this.decodeToken();
    return decoded?.sub || decoded?.userId || decoded?.UserId || 0;
  }

  getUserEmail(): string {
    const decoded = this.decodeToken();
    return decoded?.email || decoded?.Email ||
      decoded?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] || '';
  }
}
