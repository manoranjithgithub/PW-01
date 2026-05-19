import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgxDaterangepickerMd, DaterangepickerDirective } from 'ngx-daterangepicker-material';
import dayjs from 'dayjs';

@Component({
  selector: 'app-date-range-picker',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxDaterangepickerMd],
  templateUrl: './date-range-picker.component.html',
  styleUrls: ['./date-range-picker.component.scss']
})
export class DateRangePickerComponent implements OnInit, OnChanges, AfterViewInit {
  @Input() fromTimestamp: string = '';
  @Input() toTimestamp: string = '';
  @Input() label: string = 'Date Range';

  @Output() apply = new EventEmitter<{ fromTimestamp: string; toTimestamp: string }>();

  @ViewChild(DaterangepickerDirective) pickerDirective!: DaterangepickerDirective;

  selected: { startDate: dayjs.Dayjs; endDate: dayjs.Dayjs } | null = null;

  locale = {
    format: 'M/D hh:mm A',
    direction: 'ltr',
    separator: ' - ',
    applyLabel: 'Apply',
    cancelLabel: 'Cancel',
    customRangeLabel: 'Custom range',
    daysOfWeek: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
    monthNames: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    firstDay: 0
  };

  ngOnInit(): void {
    this.syncInputToPicker();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.pickerDirective) {
        this.pickerDirective.open();
      }
    }, 150);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['fromTimestamp'] || changes['toTimestamp']) {
      this.syncInputToPicker();
    }
  }

  private syncInputToPicker(): void {
    const start = this.fromTimestamp ? dayjs(this.fromTimestamp) : null;
    const end = this.toTimestamp ? dayjs(this.toTimestamp) : null;
    if (start && end && start.isValid() && end.isValid()) {
      this.selected = { startDate: start, endDate: end };
    } else {
      this.selected = null;
    }
  }

  onDatesUpdated(event: any): void {
    if (event && event.startDate && event.endDate) {
      const start = event.startDate.toDate();
      const end = event.endDate.toDate();
      
      this.apply.emit({
        fromTimestamp: this.toLocalDateTimeInput(start),
        toTimestamp: this.toLocalDateTimeInput(end)
      });
    }
  }

  toLocalDateTimeInput(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const h = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${d}T${h}:${min}`;
  }

  openCalendar(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    if (this.pickerDirective) {
      this.pickerDirective.open();
    }
  }
}

