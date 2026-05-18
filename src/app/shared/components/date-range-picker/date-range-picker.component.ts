import { Component, ElementRef, EventEmitter, HostListener, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-date-range-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './date-range-picker.component.html',
  styleUrls: ['./date-range-picker.component.scss']
})
export class DateRangePickerComponent implements OnInit {
  @Input() fromTimestamp: string = '';
  @Input() toTimestamp: string = '';
  @Input() label: string = 'Date Range';

  @Output() apply = new EventEmitter<{ fromTimestamp: string; toTimestamp: string }>();

  constructor(private elementRef: ElementRef) {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.closeDatePicker();
    }
  }

  isDatePickerOpen = false;
  tempStartDate: Date | null = null;
  tempEndDate: Date | null = null;
  startHour = 12;
  startMinute = 0;
  startAmpm = 'AM';
  endHour = 12;
  endMinute = 0;
  endAmpm = 'AM';
  leftMonthDate = new Date();
  rightMonthDate = new Date(new Date().setMonth(new Date().getMonth() + 1));
  leftMonthWeeks: any[][] = [];
  rightMonthWeeks: any[][] = [];
  hoursList = Array.from({ length: 12 }, (_, i) => i + 1);
  minutesList = Array.from({ length: 60 }, (_, i) => i);

  ngOnInit(): void {

  }

  get formattedRangeDisplay(): string {
    if (!this.fromTimestamp || !this.toTimestamp) return '';
    return this.formatRangeDate(new Date(this.fromTimestamp)) + ' - ' + this.formatRangeDate(new Date(this.toTimestamp));
  }

  get tempRangeDisplay(): string {
    if (!this.tempStartDate) return 'Select start date';
    if (!this.tempEndDate) return 'Select end date';

    const start = this.combineDateAndTime(this.tempStartDate, this.startHour, this.startMinute, this.startAmpm);
    const end = this.combineDateAndTime(this.tempEndDate, this.endHour, this.endMinute, this.endAmpm);

    return this.formatRangeDate(start) + ' - ' + this.formatRangeDate(end);
  }

  formatRangeDate(date: Date): string {
    const m = date.getMonth() + 1;
    const d = date.getDate();
    let h = date.getHours();
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${m}/${d} ${String(h).padStart(2, '0')}:${min} ${ampm}`;
  }

  openDatePicker(): void {
    const start = this.fromTimestamp ? new Date(this.fromTimestamp) : new Date();
    const end = this.toTimestamp ? new Date(this.toTimestamp) : new Date();

    this.tempStartDate = start;
    this.tempEndDate = end;

    this.leftMonthDate = new Date(start);
    this.rightMonthDate = new Date(new Date(start).setMonth(start.getMonth() + 1));

    const sh = start.getHours();
    this.startAmpm = sh >= 12 ? 'PM' : 'AM';
    this.startHour = sh % 12 || 12;
    this.startMinute = start.getMinutes();

    const eh = end.getHours();
    this.endAmpm = eh >= 12 ? 'PM' : 'AM';
    this.endHour = eh % 12 || 12;
    this.endMinute = end.getMinutes();

    this.generateCalendars();
    this.isDatePickerOpen = true;
  }

  closeDatePicker(): void {
    this.isDatePickerOpen = false;
  }

  generateCalendars(): void {
    this.leftMonthWeeks = this.getWeeksForMonth(this.leftMonthDate);
    this.rightMonthWeeks = this.getWeeksForMonth(this.rightMonthDate);
  }

  getWeeksForMonth(date: Date): any[][] {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);

    const startDate = new Date(firstDay);
    const dayOfWeek = firstDay.getDay();
    startDate.setDate(startDate.getDate() - dayOfWeek);

    const weeks: any[][] = [];
    let currentWeek: any[] = [];

    for (let i = 0; i < 42; i++) {
      const curr = new Date(startDate);
      curr.setDate(startDate.getDate() + i);
      currentWeek.push({
        date: curr,
        isCurrentMonth: curr.getMonth() === month,
        isToday: this.isSameDay(curr, new Date())
      });

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }
    return weeks;
  }

  getMonthYearLabel(date: Date): string {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  prevMonth(): void {
    this.leftMonthDate = new Date(this.leftMonthDate.setMonth(this.leftMonthDate.getMonth() - 1));
    this.rightMonthDate = new Date(this.rightMonthDate.setMonth(this.rightMonthDate.getMonth() - 1));
    this.generateCalendars();
  }

  nextMonth(): void {
    this.leftMonthDate = new Date(this.leftMonthDate.setMonth(this.leftMonthDate.getMonth() + 1));
    this.rightMonthDate = new Date(this.rightMonthDate.setMonth(this.rightMonthDate.getMonth() + 1));
    this.generateCalendars();
  }

  isSameDay(d1: Date | null, d2: Date | null): boolean {
    if (!d1 || !d2) return false;
    return d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate();
  }

  isStartDate(date: Date): boolean {
    return this.isSameDay(date, this.tempStartDate);
  }

  isEndDate(date: Date): boolean {
    return this.isSameDay(date, this.tempEndDate);
  }

  isInRange(date: Date): boolean {
    if (!this.tempStartDate || !this.tempEndDate) return false;
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const start = new Date(this.tempStartDate.getFullYear(), this.tempStartDate.getMonth(), this.tempStartDate.getDate());
    const end = new Date(this.tempEndDate.getFullYear(), this.tempEndDate.getMonth(), this.tempEndDate.getDate());
    return d > start && d < end;
  }

  selectDay(day: Date): void {
    const clickedDate = new Date(day.getFullYear(), day.getMonth(), day.getDate());

    if (!this.tempStartDate || (this.tempStartDate && this.tempEndDate)) {
      this.tempStartDate = clickedDate;
      this.tempEndDate = null;
    } else if (this.tempStartDate && !this.tempEndDate) {
      if (clickedDate < this.tempStartDate) {
        this.tempEndDate = this.tempStartDate;
        this.tempStartDate = clickedDate;
      } else {
        this.tempEndDate = clickedDate;
      }
    }
  }

  applyCustomRange(): void {
    if (!this.tempStartDate || !this.tempEndDate) return;

    const start = this.combineDateAndTime(this.tempStartDate, this.startHour, this.startMinute, this.startAmpm);
    const end = this.combineDateAndTime(this.tempEndDate, this.endHour, this.endMinute, this.endAmpm);

    this.isDatePickerOpen = false;

    this.apply.emit({
      fromTimestamp: this.toLocalDateTimeInput(start),
      toTimestamp: this.toLocalDateTimeInput(end)
    });
  }

  combineDateAndTime(date: Date, hour: number, minute: number, ampm: string): Date {
    const d = new Date(date);
    let h = Number(hour);
    if (ampm === 'PM' && h < 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    d.setHours(h, Number(minute), 0, 0);
    return d;
  }

  toLocalDateTimeInput(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const h = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${d}T${h}:${min}`;
  }

  onStartHourChange(event: Event): void {
    this.startHour = Number((event.target as HTMLSelectElement).value);
  }
  onStartMinuteChange(event: Event): void {
    this.startMinute = Number((event.target as HTMLSelectElement).value);
  }
  onStartAmpmChange(event: Event): void {
    this.startAmpm = (event.target as HTMLSelectElement).value;
  }
  onEndHourChange(event: Event): void {
    this.endHour = Number((event.target as HTMLSelectElement).value);
  }
  onEndMinuteChange(event: Event): void {
    this.endMinute = Number((event.target as HTMLSelectElement).value);
  }
  onEndAmpmChange(event: Event): void {
    this.endAmpm = (event.target as HTMLSelectElement).value;
  }
}
