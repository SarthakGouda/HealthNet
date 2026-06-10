import { Component, EventEmitter, HostListener, Input, OnChanges, Output, SimpleChanges, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { LookupOption } from '../../../core/services/lookup.service';

/**
 * A searchable dropdown for picking an ID.
 *
 * Set [allowManualEntry]="true" to let the user type a numeric ID that isn't in
 * the list — useful when the lookup endpoint is restricted (e.g. /User/GetAll
 * is Admin-only, so a Doctor can't see lab-tech IDs and must enter one).
 *
 * Usage in a reactive form:
 *   <app-id-picker
 *     [options]="patients$ | async"
 *     placeholder="Select a patient..."
 *     [allowManualEntry]="true"
 *     formControlName="patientId">
 *   </app-id-picker>
 */
@Component({
  selector: 'app-id-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './id-picker.html',
  styleUrls: ['./id-picker.css'],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => IdPickerComponent), multi: true }
  ]
})
export class IdPickerComponent implements ControlValueAccessor, OnChanges {

  @Input() options: LookupOption[] | null = [];
  @Input() placeholder = 'Select an option...';
  @Input() emptyText   = 'No matches';
  @Input() loadingText = 'Loading…';
  @Input() disabled    = false;
  @Input() searchable  = true;
  /** Allow the user to commit a typed numeric ID even if it isn't in the option list. */
  @Input() allowManualEntry = false;

  @Output() openChange = new EventEmitter<boolean>();

  value: number | null = null;
  selected: LookupOption | null = null;
  isOpen = false;
  search = '';

  private onChange: (v: number | null) => void = () => {};
  private onTouched: () => void = () => {};

  ngOnChanges(_: SimpleChanges): void {
    this.syncSelected();
  }

  get filtered(): LookupOption[] {
    const q = (this.search || '').toLowerCase().trim();
    const opts = this.options || [];
    if (!q) return opts;
    return opts.filter(o =>
      o.label.toLowerCase().includes(q) ||
      (o.sub || '').toLowerCase().includes(q) ||
      String(o.value).includes(q)
    );
  }

  /** Parsed numeric value when the user types a positive integer. */
  get manualCandidate(): number | null {
    const q = (this.search || '').trim();
    if (!/^\d+$/.test(q)) return null;
    const n = parseInt(q, 10);
    if (!n || n <= 0) return null;
    // Suppress if exact match is already shown in the list
    if ((this.options || []).some(o => o.value === n)) return null;
    return n;
  }

  toggle(): void {
    if (this.disabled) return;
    this.isOpen = !this.isOpen;
    this.openChange.emit(this.isOpen);
    if (this.isOpen) this.search = '';
  }

  pick(o: LookupOption): void {
    this.value = o.value;
    this.selected = o;
    this.isOpen = false;
    this.search = '';
    this.onChange(this.value);
    this.onTouched();
    this.openChange.emit(false);
  }

  /** Commit a typed numeric ID as the value (manual-entry fallback). */
  pickManual(): void {
    const n = this.manualCandidate;
    if (n == null) return;
    this.value = n;
    this.selected = { value: n, label: `#${n}`, sub: 'Entered manually' };
    this.isOpen = false;
    this.search = '';
    this.onChange(this.value);
    this.onTouched();
    this.openChange.emit(false);
  }

  clear(ev: Event): void {
    ev.stopPropagation();
    this.value = null;
    this.selected = null;
    this.onChange(null);
    this.onTouched();
  }

  // ── ControlValueAccessor ─────────────────────────────────────
  writeValue(value: number | null): void {
    this.value = value ?? null;
    this.syncSelected();
  }
  registerOnChange(fn: (v: number | null) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void { this.disabled = isDisabled; }

  private syncSelected(): void {
    if (this.value == null) { this.selected = null; return; }
    const fromList = (this.options || []).find(o => o.value === this.value);
    if (fromList) {
      this.selected = fromList;
    } else if (!this.selected || this.selected.value !== this.value) {
      // Value set externally and not in the list — render a stub
      this.selected = { value: this.value, label: `#${this.value}`, sub: '' };
    }
  }

  @HostListener('document:click', ['$event'])
  closeOnOutside(ev: MouseEvent): void {
    const tgt = ev.target as HTMLElement;
    if (!tgt.closest('app-id-picker')) {
      if (this.isOpen) {
        this.isOpen = false;
        this.openChange.emit(false);
      }
    }
  }
}
