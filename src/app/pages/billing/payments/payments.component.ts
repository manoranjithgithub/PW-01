import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PricingsService } from '../pricing.service';
import { ToastrService } from 'ngx-toastr';
import { SharedService } from '../../../shared/services/shared.service';
import { UserService } from '../../../core/services/user.service';
import { CompanyBillingInfo, InvoiceRow } from '../../../core/models/company-billing-info.model';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment';

declare const Cashfree: any;

type StatusFilterOption = 'all' | 'paid' | 'draft' | 'unpaid';
type TimeRangeOption = '30d' | '3m' | '6m' | 'current-month' | 'all';

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './payments.component.html',
  styleUrl: './payments.component.scss',
  providers: [PricingsService]
})
export class PaymentsComponent implements OnInit {
  tableData: InvoiceRow[] = [];
  transactionsFilter = '';
  transactionStatusFilter: StatusFilterOption = 'all';
  selectedTimeRange: TimeRangeOption = '3m';

  readonly timeRangeOptions: Array<{ value: TimeRangeOption; label: string }> = [
    { value: '3m', label: 'Last 3 months' },
    { value: 'current-month', label: 'Current month' },
    { value: '6m', label: 'Last 6 months' },
    { value: 'all', label: 'All time' }
  ];

  readonly statusFilterOptions: Array<{ value: StatusFilterOption; label: string }> = [
    { value: 'all', label: 'All status' },
    { value: 'paid', label: 'Paid' },
    { value: 'draft', label: 'Unpaid' }
  ];

  companyBillingInfo: CompanyBillingInfo = {
    companyName: null,
    gstNumber: null,
    addressLine1: null,
    addressLine2: null,
    city: null,
    state: null,
    country: null,
    postalCode: null,
  };

  accountId: string | null = null;
  billingDetailsLoading = false;
  cashfree: any;
  limit = 10;
  offset = 0;
  totalRecords = 0;
  readonly pageSizeOptions = [10, 20, 50, 100];

  constructor(
    private http: PricingsService,
    private toastr: ToastrService,
    private sharedService: SharedService,
    private userService: UserService,
    private router: Router,
  ) { }

  get duePayments(): InvoiceRow[] {
    return this.tableData.filter((invoice) => this.isDuePayment(invoice));
  }

  get unappliedFunds(): InvoiceRow[] {
    return this.tableData.filter((invoice) => this.isUnappliedFund(invoice));
  }

  get transactions(): InvoiceRow[] {
    return this.tableData;
  }

  get filteredTransactions(): InvoiceRow[] {
    const ranged = this.filterByTimeRange(this.transactions);
    const statusFiltered = this.filterByStatus(ranged, this.transactionStatusFilter);
    return this.filterRecords(statusFiltered, this.transactionsFilter);
  }

  get totalOutstandingBalance(): number {
    return this.duePayments.reduce((sum, invoice) => sum + this.getAmount(invoice.total), 0);
  }

  get totalAvailableFunds(): number {
    return this.unappliedFunds.reduce((sum, invoice) => sum + this.getAmount(invoice.total), 0);
  }

  get lastPaidInvoice(): InvoiceRow | null {
    const paidRows = this.transactions.filter((row) => (row.status || '').toLowerCase() === 'paid');
    if (!paidRows.length) {
      return null;
    }
    return [...paidRows].sort((a, b) => {
      const aTime = this.getInvoiceDate(a)?.getTime() || 0;
      const bTime = this.getInvoiceDate(b)?.getTime() || 0;
      return bTime - aTime;
    })[0];
  }

  get lastPaymentDateLabel(): string {
    const lastPaid = this.lastPaidInvoice;
    if (!lastPaid) {
      return '--';
    }
    const date = this.getInvoiceDate(lastPaid);
    if (!date) {
      return '--';
    }
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  get lastPaymentAmount(): number {
    const lastPaid = this.lastPaidInvoice;
    if (!lastPaid) {
      return 0;
    }
    return this.getAmount(lastPaid.total || lastPaid.subtotal);
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

  get nextDueDate(): string {
    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return endOfMonth.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  get accountIdLabel(): string {
    return localStorage.getItem('accountId') || '--';
  }

  get billingAddressLabel(): string {
    const parts = [
      this.companyBillingInfo.addressLine1,
      this.companyBillingInfo.addressLine2,
      this.companyBillingInfo.city,
      this.companyBillingInfo.state,
      this.companyBillingInfo.country,
      this.companyBillingInfo.postalCode
    ]
      .map((value) => (value || '').trim())
      .filter((value) => !!value);
    return parts.length ? parts.join(', ') : '--';
  }

  get paidAmount(): number {
    return this.transactions
      .filter((row) => (row.status || '').toLowerCase() === 'paid')
      .reduce((sum, row) => sum + this.getAmount(row.total), 0);
  }

  get unpaidAmount(): number {
    return this.totalOutstandingBalance;
  }

  get pendingAmount(): number {
    return this.transactions
      .filter((row) => (row.status || '').toLowerCase() === 'draft' || (row.status || '').toLowerCase() === 'unpaid')
      .reduce((sum, row) => sum + this.getAmount(row.total), 0);
  }

  get overdueAmount(): number {
    if (this.overdueDays > 0) {
      return this.totalOutstandingBalance;
    }
    return 0;
  }

  get totalInvoiceAmount(): number {
    return this.paidAmount + this.unpaidAmount + this.pendingAmount;
  }

  get filteredTransactionRecords(): InvoiceRow[] {
    const start = this.offset;
    const end = start + this.limit;
    return this.filteredTransactions.slice(start, end);
  }

  get filteredTransactionCount(): number {
    return this.filteredTransactions.length;
  }

  get currentPage(): number {
    return Math.floor(this.offset / this.limit) + 1;
  }

  get totalPages(): number {
    const count = this.filteredTransactionCount;
    if (!count) {
      return 1;
    }
    return Math.max(1, Math.ceil(count / this.limit));
  }

  get pageRangeLabel(): string {
    const count = this.filteredTransactionCount;
    if (!count) {
      return '0-0 of 0';
    }
    const start = this.offset + 1;
    const end = Math.min(this.offset + this.limit, count);
    return `${start}-${end} of ${count}`;
  }

  ngOnInit(): void {
    this.getInvoiceList();
    this.loadBillingDetails();
    this.sharedService.currencyChange$.subscribe(() => {
      this.tableData = Array.isArray(this.tableData) ? [...this.tableData] : this.tableData;
    });
    try {
      if (typeof Cashfree !== 'undefined') {
        this.cashfree = Cashfree({ mode: environment.cashFree });
      }
    } catch (e) {
      this.cashfree = undefined;
    }
  }

  onTimeRangeChange(value: TimeRangeOption): void {
    this.selectedTimeRange = value || '3m';
    this.offset = 0;
  }

  onStatusFilterChange(value: StatusFilterOption): void {
    const selected = value || 'all';
    this.transactionStatusFilter = selected;
    this.offset = 0;
  }

  onFilterChange(value: string): void {
    this.transactionsFilter = value;
    this.offset = 0;
  }

  onItemsPerPageChange(value: string): void {
    const pageSize = Number(value);
    if (!Number.isFinite(pageSize) || pageSize <= 0 || pageSize === this.limit) {
      return;
    }
    this.limit = pageSize;
    this.offset = 0;
    this.getInvoiceList();
  }

  previousPage(): void {
    if (this.currentPage <= 1) {
      return;
    }
    this.offset = Math.max(0, this.offset - this.limit);
    this.getInvoiceList();
  }

  nextPage(): void {
    if (this.currentPage >= this.totalPages) {
      return;
    }
    this.offset = this.offset + this.limit;
    this.getInvoiceList();
  }

  getIssuedDate(row: InvoiceRow): string {
    if (!row.period) {
      return '--';
    }
    const date = new Date(row.period);
    if (isNaN(date.getTime())) {
      return '--';
    }
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short'
    });
  }

  getIssueDate(row: InvoiceRow): string {
    const createdAt = row['created_at'];
    if (!createdAt) {
      return '--';
    }
    const date = new Date(createdAt);
    if (isNaN(date.getTime())) {
      return '--';
    }
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  canShowPayNow(row: InvoiceRow): boolean {
    const normalized = this.getNormalizedStatus(row);
    const amount = this.getAmount(row.total || row.subtotal);
    return (normalized === 'due' || normalized === 'unpaid') && amount > 0;
  }

  formatMoney(amount: number | undefined | null, currencyFrom?: string): string {
    return this.sharedService.formatMoney(amount, currencyFrom);
  }

  maskSensitiveId(value: string | null | undefined): string {
    const normalized = (value || '').trim();
    if (!normalized) {
      return '--';
    }
    if (normalized.length <= 5) {
      return normalized;
    }
    return `${normalized.charAt(0)}${'*'.repeat(normalized.length - 5)}${normalized.slice(-4)}`;
  }

  onDownload(row: InvoiceRow): void {
    if (!row?.id) {
      this.toastr.error('Invoice ID not found');
      return;
    }
    this.http.downloadPdfInvoice(String(row.id)).subscribe({
      next: (response: any) => {
        const fileUrl = response?.data?.url;
        if (!fileUrl) {
          this.toastr.error('PDF URL not available');
          return;
        }
        const link = document.createElement('a');
        link.href = fileUrl;
        link.rel = 'noopener';
        link.click();
      },
      error: () => {
        this.toastr.error('Failed to fetch PDF');
      }
    });
  }

  openPayNow(data: any): void {
    this.http.paynow(data.id).subscribe({
      next: (data: any) => {
        const sessionId = data.order.payment_session_id;
        const checkoutOptions = {
          paymentSessionId: sessionId,
          redirectTarget: '_modal',
        };
        this.cashfree.checkout(checkoutOptions).then((res: any) => {
          const message = res?.paymentDetails?.paymentMessage;
          if (message === 'Payment finished. Check status.') {
            this.getInvoiceList();
          }
        }, (error: any) => {
          this.toastr.error('Payment Dismissed');
        });
      }
    });
  }

  viewPdf(data: any): void {
    if (!data?.id) {
      this.toastr.error('Invoice ID not found');
      return;
    }
    this.http.getPdfInvoice(String(data.id)).subscribe({
      next: (response: any) => {
        if (response?.data?.url) {
          window.open(response.data.url, '_blank');
        } else {
          this.toastr.error('PDF URL not available');
        }
      },
      error: (error) => {
        this.toastr.error(error.message || 'Failed to fetch PDF');
      }
    });
  }

  navigateToAccountSettings(): void {
    this.router.navigate(['/account-settings']);
  }

  refreshInvoices(): void {
    this.getInvoiceList();
  }

  getInvoiceList(): void {
    const accountId = localStorage.getItem('accountId');
    if (accountId) {
      this.http.getInvoiceList(accountId, this.limit, this.offset).subscribe({
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

  private isUnappliedFund(invoice: InvoiceRow): boolean {
    const status = (invoice.status || '').toLowerCase();
    return status === 'credit' || status === 'unapplied';
  }

  private filterRecords(records: InvoiceRow[], query: string): InvoiceRow[] {
    const normalized = (query || '').trim().toLowerCase();
    if (!normalized) {
      return records;
    }
    return records.filter((record) =>
      JSON.stringify(record).toLowerCase().includes(normalized)
    );
  }

  private getAmount(value: any): number {
    const amount = Number(value || 0);
    return Number.isFinite(amount) ? amount : 0;
  }

  private filterByTimeRange(records: InvoiceRow[]): InvoiceRow[] {
    if (this.selectedTimeRange === 'all') {
      return records;
    }

    const now = new Date();
    let startDate = new Date(now);

    if (this.selectedTimeRange === '30d') {
      startDate.setDate(now.getDate() - 30);
    } else if (this.selectedTimeRange === '3m') {
      startDate.setMonth(now.getMonth() - 3);
    } else if (this.selectedTimeRange === '6m') {
      startDate.setMonth(now.getMonth() - 6);
    } else if (this.selectedTimeRange === 'current-month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    return records.filter((row) => {
      const rowDate = this.getInvoiceDate(row);
      return rowDate ? rowDate >= startDate && rowDate <= now : false;
    });
  }

  private filterByStatus(records: InvoiceRow[], status: StatusFilterOption): InvoiceRow[] {
    if (!status || status === 'all') {
      return records;
    }

    return records.filter((row) => {
      const rowStatus = (row.status || '').toLowerCase();
      if (status === 'paid') {
        return rowStatus === 'paid';
      } else if (status === 'draft' || status === 'unpaid') {
        return rowStatus === 'draft' || rowStatus === 'unpaid';
      }
      return true;
    });
  }

  private getNormalizedStatus(row: InvoiceRow): string {
    const status = (row.status || '').toLowerCase().trim();
    if (status === 'draft') {
      return 'due';
    }
    return status;
  }

  private getInvoiceDate(row: InvoiceRow): Date | null {
    const value = row.issued_at || row.period;
    if (!value) {
      return null;
    }
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  }

  private loadBillingDetails(): void {
    this.billingDetailsLoading = true;
    const accountId = localStorage.getItem('accountId')
      || this.sharedService.getUser()?.id;

    if (!accountId) {
      this.billingDetailsLoading = false;
      return;
    }

    this.accountId = accountId;
    this.userService.getBillingDetails(accountId).subscribe({
      next: (response: any) => {
        if (response?.data) {
          this.companyBillingInfo = {
            companyName: response.data.companyName || response.data.company_name || null,
            gstNumber: response.data.gstNumber || null,
            addressLine1: response.data.addressLine1 || response.data.address_line1 || null,
            addressLine2: response.data.addressLine2 || response.data.address_line2 || null,
            city: response.data.city || null,
            state: response.data.state || null,
            country: response.data.country || null,
            postalCode: response.data.postalCode || response.data.postal_code || null,
          };
        }
      },
      error: () => {
        this.companyBillingInfo = {
          companyName: null,
          gstNumber: null,
          addressLine1: null,
          addressLine2: null,
          city: null,
          state: null,
          country: null,
          postalCode: null,
        };
      },
      complete: () => {
        this.billingDetailsLoading = false;
      }
    });
  }
}
