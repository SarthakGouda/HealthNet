import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export type AlertType = 'success' | 'danger' | 'warning' | 'info';

@Component({
  selector: 'app-alert',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="message"
         class="alert alert-{{ type }} alert-dismissible fade show"
         role="alert">
      {{ message }}
      <button type="button"
              class="btn-close"
              (click)="onClose()"
              aria-label="Close">
      </button>
    </div>
  `
})
export class AlertComponent {
  @Input() message: string = '';
  @Input() type: AlertType = 'info';
  @Output() closed = new EventEmitter<void>();

  onClose(): void {
    this.message = '';
    this.closed.emit();
  }
}
