import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, OnInit, ViewChild } from '@angular/core';
import { BillsComponent } from './bills/bills.component';
import { SharedService } from '../../shared/services/shared.service';
import { PricingsService } from './pricing.service';
import { InvoiceRow } from '../../core/models/company-billing-info.model';
import { PaymentsComponent } from './payments/payments.component';

type TopSection = 'bill' | 'payments';

@Component({
  selector: 'app-billing',
  standalone: true,
  imports: [CommonModule, FormsModule, BillsComponent, PaymentsComponent],
  templateUrl: './billing.component.html',
  styleUrl: './billing.component.scss',
  providers: [PricingsService]
})
export class BillingComponent implements OnInit {
  @ViewChild(BillsComponent) billsComponent!: BillsComponent;

  activeTopSection: TopSection = 'bill';
  tableData: InvoiceRow[] = [];

  constructor(private sharedService: SharedService, private http: PricingsService) {}

  ngOnInit(): void {
    this.getInvoiceList();
  }

  get duePayments(): InvoiceRow[] {
    return this.tableData.filter((invoice) => this.isDuePayment(invoice));
  }

  get overdueDays(): number {
    if (!this.duePayments.length) {
      return 0;
    }
    const oldestInvoice = this.duePayments.reduce((oldest, current) => {
      const oldestDate = this.getInvoiceDate(oldest);
      const currentDate = this.getInvoiceDate(current);
      if (!oldestDate) return current;
      if (!currentDate) return oldest;
      return currentDate < oldestDate ? current : oldest;
    });

    const invoiceDate = this.getInvoiceDate(oldestInvoice);
    if (!invoiceDate) {
      return 0;
    }

    const today = new Date();
    const differenceInTime = today.getTime() - invoiceDate.getTime();
    const differenceInDays = Math.floor(differenceInTime / (1000 * 3600 * 24));
    return Math.max(0, differenceInDays);
  }

  get totalOutstandingBalance(): number {
    return this.duePayments.reduce((sum, invoice) => sum + this.getAmount(invoice.total), 0);
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
      this.getInvoiceList();
    }
  }
  formatMoney(amount: number | undefined | null, currencyFrom?: string): string {
    return this.sharedService.formatMoney(amount, currencyFrom);
  }

  private getInvoiceList(): void {
    const accountId = localStorage.getItem('accountId');
    if (accountId) {
      this.http.getInvoiceList(accountId, 100, 0).subscribe({
        next: (data: any) => {
          if (data.success) {
            const payload = data.data || {};
            this.tableData = [...payload.data];
          }
        },
        error: (error) => {
          console.error('Error fetching invoice data:', error);
        }
      });
    }
  }

  private isDuePayment(invoice: InvoiceRow): boolean {
    const status = (invoice.status || '').toLowerCase();
    return (status === 'draft' || status === 'unpaid') && this.getAmount(invoice.total || invoice.subtotal) > 0;
  }

  private getAmount(value: any): number {
    const amount = Number(value || 0);
    return Number.isFinite(amount) ? amount : 0;
  }

  private getInvoiceDate(row: InvoiceRow): Date | null {
    const value = row.issued_at || row.period;
    if (!value) {
      return null;
    }
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  }
}
