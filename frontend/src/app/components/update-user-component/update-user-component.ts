import { Component } from '@angular/core';
import {FormsModule} from '@angular/forms'
import {CommonModule} from '@angular/common'
import { Router, RouterLink } from '@angular/router';
import { UpdateUser } from '../../core/models/UpdateUser';
import { TokenService } from '../../core/services/token-service';
import { UserService } from '../../core/services/user/user-service';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth-service';


@Component({
  selector: 'app-update-user-component',
  imports: [FormsModule, CommonModule, RouterLink, MatIconModule],
  templateUrl: './update-user-component.html',
  styleUrl: './update-user-component.css',
})
export class UpdateUserComponent {
  user: UpdateUser = { Email: '', Name: '', PhoneNumber: '', RoleName: ''};
  errMsg: string;

  constructor(private authService: AuthService, private userService: UserService, private tokenService: TokenService, private router: Router){
    this.errMsg = "";
    this.getUserDetails();
  }

  getUserDetails(){
    this.userService.getUserData(this.tokenService.getUserId()).subscribe({
      next: (response: any)=>{
        console.log("Response : ",response);
        this.user.Name = response?.name;
        this.user.Email = response?.email;
        this.user.PhoneNumber = response?.phone;
        this.user.RoleName = response?.roleName;
        this.errMsg = "";
      },
      error: (err)=>{
        this.errMsg = err.error;
      }
    })
  }

  isValidPhoneNumber(value: string): boolean {
    const regex = /^(\+\d{1,2}\s?)?\d{10}$/;
    return regex.test(value);
  } 

  onPhoneNumberChange(): void{
    if(!this.isValidPhoneNumber(this.user.PhoneNumber)){
      this.errMsg = "*Please enter a valid mobile number.";
    }
  }

  onUpdate(){
    this.userService.updateUserDate(this.tokenService.getUserId(),this.user).subscribe({
      next: (response: any) => {
        this.authService.logout();
        sessionStorage.clear();
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.errMsg = err.error;
        console.log("Update user error : "+err);
      }
    })
  }
}
