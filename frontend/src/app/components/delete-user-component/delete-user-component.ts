import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RegisterResponse } from '../../core/models/register';
import { TokenService } from '../../core/services/token-service';
import { UserService } from '../../core/services/user/user-service';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth-service';

@Component({
  selector: 'app-delete-user-component',
  imports: [FormsModule, CommonModule, MatIconModule, RouterLink],
  templateUrl: './delete-user-component.html',
  styleUrl: './delete-user-component.css',
})
export class DeleteUserComponent {
  user: RegisterResponse = {} as RegisterResponse;
  errMsg: string;

  constructor(private authService: AuthService, private tokenService: TokenService, private router: Router, private userService: UserService){
    this.errMsg = "";
    this.getUserDetails();
  }

  getUserDetails(){
    this.userService.getUserData(this.tokenService.getUserId()).subscribe({
      next: (response: any)=>{
        console.log("Response : ",response);
        this.user.userId = response?.id;
        this.user.name = response?.name;
        this.user.email = response?.email;
        this.user.phone = response?.phone;
        this.user.role = response?.roleName;
        this.user.status = response?.status;
        this.errMsg = "";
      },
      error: (err)=>{
        this.errMsg = err.error;
      }
    })
  }

  onDelete(){
    this.userService.deleteUserAccount(this.tokenService.getUserId()).subscribe({
      next: ()=>{
        this.authService.logout();
        sessionStorage.clear();
        this.router.navigate(['/login'])
      },
      error: (err)=>{
        this.errMsg = err.error;
      }
    })
  }
}
