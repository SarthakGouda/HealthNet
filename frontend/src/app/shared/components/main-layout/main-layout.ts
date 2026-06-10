import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/services/auth-service';
import { SidebarComponent } from '../sidebar-component/sidebar-component';
import { HeaderComponent } from '../header-component/header-component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, HeaderComponent],
  template: `
    <div class="layout-wrap">
      <app-sidebar *ngIf="isLoggedIn"></app-sidebar>
      <div class="content-area" [class.no-sidebar]="!isLoggedIn">
        <app-header-component></app-header-component>
        <main class="main-content">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .layout-wrap { display: flex; min-height: 100vh; }
    .content-area { flex: 1; display: flex; flex-direction: column; min-width: 0; }
    .main-content { flex: 1; overflow-y: auto; }
  `]
})
export class MainLayoutComponent implements OnInit {
  isLoggedIn = false;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.isLoggedIn$.subscribe(v => this.isLoggedIn = v);
    this.isLoggedIn = this.authService.isLoggedIn();
  }
}
