import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth-service';
import { CommonModule } from '@angular/common';
import { RegisterResponse } from '../../../core/models/register';
import { TokenService } from '../../../core/services/token-service';

@Component({
  selector: 'app-header-component',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule, MatIconModule],
  templateUrl: './header-component.html',
  styleUrl: './header-component.css',
})
export class HeaderComponent {
  
  appName = 'HealthNet';
  isLoggedIn: boolean = false;
  nameLogo: string | undefined;
  menuOpen: boolean;

  constructor(private authService: AuthService, private tokenService: TokenService, private router: Router){
    this.menuOpen = false;
    this.nameLogo = this.tokenService.getUserEmail()?.at(0)?.toUpperCase();
    console.log("Logo : ",this.nameLogo);
  }
  
  ngOnInit() {
    this.isLoggedIn = this.authService.isLoggedIn();
  
    this.authService.isLoggedIn$.subscribe(status => {
      this.isLoggedIn = status;
    });
  }


  toggleMenu(event: Event) {
    event.stopPropagation(); // prevent immediate close
    this.menuOpen = !this.menuOpen;
  }

  goToProfile() {
    this.menuOpen = !this.menuOpen;
    this.router.navigate(['/profile']);
  }

  logout(){
    this.menuOpen = !this.menuOpen;
    this.authService.logout();
    this.isLoggedIn = this.authService.isLoggedIn();
  }

}