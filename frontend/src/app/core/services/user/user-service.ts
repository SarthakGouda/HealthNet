import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { User } from '../../models/User';
import { Observable } from 'rxjs';
import { RegisterResponse } from '../../models/register';
import { UpdateUser } from '../../models/UpdateUser';

export interface ForgotPasswordRequest {
  email: string;
  newPassword: string;
  confirmPassword: string;
}

export interface AdminUserResponse {
  userId: number;
  name: string;
  email: string;
  phone: string;
  status: boolean;
  roleName: string;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private http: HttpClient = inject(HttpClient);
  private readonly apiBaseUrl = `${environment.apiUrl}/User`;

  register(userData: User): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.apiBaseUrl}/register`, userData);
  }

  getUserData(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiBaseUrl}/${id}`);
  }

  updateUserDate(id: number, userData: UpdateUser): Observable<RegisterResponse> {
    return this.http.put<RegisterResponse>(`${this.apiBaseUrl}/update/${id}`, userData);
  }

  deleteUserAccount(id: number): Observable<any> {
    // Backend route param carries the id; body is unused. Send {} to keep the wire clean.
    return this.http.patch<any>(`${this.apiBaseUrl}/delete/${id}`, {});
  }

  getAllUsers(): Observable<{ success: boolean; count: number; data: AdminUserResponse[] }> {
    return this.http.get<{ success: boolean; count: number; data: AdminUserResponse[] }>(
      `${this.apiBaseUrl}/GetAll`
    );
  }

  forgotPassword(payload: ForgotPasswordRequest): Observable<any> {
    return this.http.put<any>(`${this.apiBaseUrl}/forgotpassword`, payload);
  }
}
