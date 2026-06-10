import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

/**
 * Shared footer — drop <app-footer></app-footer> into any page that needs a
 * compact, branded footer. Sticks visually to the bottom of whatever wraps it.
 *
 * Inputs:
 *   variant = 'light' (default) | 'dark'   colour palette
 *   compact = true to render only the bottom strip
 */
@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './footer-component.html',
  styleUrl: './footer-component.css'
})
export class FooterComponent {
  @Input() variant: 'light' | 'dark' = 'light';
  @Input() compact = false;

  year = new Date().getFullYear();
}
