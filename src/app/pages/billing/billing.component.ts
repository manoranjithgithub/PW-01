import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, OnInit, ViewChild } from '@angular/core';
import { PaymentsComponent } from './payments/payments.component';
import { BillsComponent } from './bills/bills.component';

type TopSection = 'bill' | 'payments';

@Component({
  selector: 'app-billing',
  standalone: true,
  imports: [CommonModule, FormsModule, BillsComponent, PaymentsComponent],
  templateUrl: './billing.component.html',
  styleUrl: './billing.component.scss'
})
export class BillingComponent implements OnInit {
  @ViewChild(BillsComponent) billsComponent!: BillsComponent;
  @ViewChild(PaymentsComponent) paymentsComponent!: PaymentsComponent;

  activeTopSection: TopSection = 'bill';

  ngOnInit(): void {
    // Initialize if needed
  }

  get overdueDays(): number {
    return this.paymentsComponent?.overdueDays ?? 0;
  }

  get totalOutstandingBalance(): number {
    return this.paymentsComponent?.totalOutstandingBalance ?? 0;
  }

  switchTopSection(section: TopSection): void {
    this.activeTopSection = section;
  }

  reviewDueInvoices(): void {
    this.activeTopSection = 'payments';
    setTimeout(() => {
      const duePanel = document.getElementById('payments-due-panel');
      duePanel?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  }

  // Delegate methods to BillsComponent
  get selectedMonthLabel(): string {
    return this.billsComponent?.selectedMonthLabel || '';
  }

  get monthPickerOpen(): boolean {
    return this.billsComponent?.monthPickerOpen ?? false;
  }

  get monthPickerMonth(): number {
    return this.billsComponent?.monthPickerMonth ?? new Date().getMonth();
  }

  set monthPickerMonth(value: number) {
    if (this.billsComponent) {
      this.billsComponent.monthPickerMonth = value;
    }
  }

  get monthPickerYear(): number {
    return this.billsComponent?.monthPickerYear ?? new Date().getFullYear();
  }

  set monthPickerYear(value: number) {
    if (this.billsComponent) {
      this.billsComponent.monthPickerYear = value;
    }
  }

  get monthOptions(): any[] {
    return this.billsComponent?.monthOptions ?? [];
  }

  get yearOptions(): any[] {
    return this.billsComponent?.yearOptions ?? [];
  }

  toggleMonthPicker(event: Event): void {
    this.billsComponent?.toggleMonthPicker(event as MouseEvent);
  }

  isMonthDisabled(month: number): boolean {
    return this.billsComponent?.isMonthDisabled(month) ?? false;
  }

  onMonthPickerMonthChange(month: number): void {
    this.billsComponent?.onMonthPickerMonthChange(String(month));
  }

  onMonthPickerYearChange(year: number): void {
    this.billsComponent?.onMonthPickerYearChange(String(year));
  }

  onCancelMonthPicker(event: Event): void {
    this.billsComponent?.onCancelMonthPicker(event as MouseEvent);
  }

  onApplyMonthPicker(event: Event): void {
    this.billsComponent?.onApplyMonthPicker(event as MouseEvent);
  }

  refreshBills(): void {
    this.billsComponent?.refreshBills();
  }

  refresh(): void {
    if (this.activeTopSection === 'bill') {
      this.billsComponent?.refreshBills();
    } else if (this.activeTopSection === 'payments') {
      this.paymentsComponent?.getInvoiceList();
    }
  }
}
