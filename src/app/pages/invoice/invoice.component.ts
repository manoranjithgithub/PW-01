import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { PricingsService } from './pricing.service';
import { ToastrService } from 'ngx-toastr';
import { SharedService } from '../../shared/services/shared.service';
import { UserService } from '../../core/services/user.service';
import { environment } from '../../../environments/environment';
import { DeploymentsService } from '../deployments/deployment.service';
import { ToolsService } from '../tools/tools.service';
import { ProjectsService } from '../projects/projects.service';
import { BillServiceRow, CompanyBillingInfo, InvoiceRow, ScopeOption } from '../../core/models/company-billing-info.model';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import Litepicker from 'litepicker';
declare const Cashfree: any;

type PaymentTab = 'payments-due' | 'unapplied-funds' | 'transactions';
type TopSection = 'bill' | 'payments';
type BillTab = 'service' | 'taxes';
type TimeRangeOption = '30d' | '3m' | '6m' | 'current-month' | 'all';
type StatusFilterOption = 'all' | 'paid' | 'due' | 'unpaid' | 'credit';


@Component({
  selector: 'app-invoice',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './invoice.component.html',
  styleUrl: './invoice.component.scss',
  providers: [PricingsService]
})
export class InvoiceComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('dateRangePickerInput', { static: false }) dateRangePickerInput?: ElementRef<HTMLInputElement>;

  rawInvoiceData: InvoiceRow[] = [];
  tableData: InvoiceRow[] = [];
  activeTopSection: TopSection = 'payments';
  activeTab: PaymentTab = 'transactions';
  activeBillTab: BillTab = 'service';
  transactionsFilter = '';
  transactionStatusFilter: StatusFilterOption = 'all';
  billServiceFilter = '';
  billTaxFilter = '';
  selectedTimeRange: TimeRangeOption = '3m';
  readonly timeRangeOptions: Array<{ value: TimeRangeOption; label: string }> = [
    { value: 'current-month', label: 'Current month' },
    { value: '3m', label: 'Last 3 months' },
    { value: '6m', label: 'Last 6 months' },
    { value: 'all', label: 'All time' }
  ];
  readonly statusFilterOptions: Array<{ value: StatusFilterOption; label: string }> = [
    { value: 'all', label: 'All status' },
    { value: 'paid', label: 'Paid' },
    { value: 'due', label: 'Unpaid' },
    { value: 'unpaid', label: 'Unpaid' },
    { value: 'credit', label: 'Credit' }
  ];
  billRows: BillServiceRow[] = [];
  billLoading = false;
  projectOptions: ScopeOption[] = [{ id: 'all', name: 'All projects' }];
  environmentOptions: ScopeOption[] = [{ id: 'all', name: 'All environments' }];
  selectedProjectId = 'all';
  selectedEnvironmentId = 'all';
  selectedDate = new Date().toISOString().split('T')[0];
  startDate = '';
  endDate = '';
  dateRangeDisplay = 'Select date range';
  companyBillingInfo: CompanyBillingInfo = {
    companyName: null,
    gstNumber: null,
    panNumber: null,
    addressLine1: null,
    addressLine2: null,
    city: null,
    state: null,
    country: null,
    postalCode: null,
    paymentMethod: null
  };
  accountId: string | null = null;
  billingDetailsLoading = false;
  private dateRangePicker: any = null;

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
    private deploymentsService: DeploymentsService,
    private toolsService: ToolsService,
    private projectsService: ProjectsService
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

  get paidInvoicesCount(): number {
    return this.transactions.filter((row) => (row.status || '').toLowerCase() === 'paid').length;
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

  get lastInvoiceActivityDate(): string {
    if (!this.transactions.length) {
      return '--';
    }
    const dates = this.transactions
      .map((row) => this.getInvoiceDate(row))
      .filter((date): date is Date => !!date)
      .sort((a, b) => b.getTime() - a.getTime());

    if (!dates.length) {
      return '--';
    }

    return dates[0].toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  get filteredBillRows(): BillServiceRow[] {
    const query = (this.billServiceFilter || '').trim().toLowerCase();
    if (!query) {
      return this.billRows;
    }
    return this.billRows.filter((row) =>
      `${row.description} ${row.usage}`.toLowerCase().includes(query)
    );
  }

  get billEstimatedTotal(): number {
    return this.billRows.reduce((sum, item) => sum + this.getAmount(item.amount), 0);
  }

  get taxRows(): InvoiceRow[] {
    return this.transactions.filter((row) => this.getAmount(row.tax_amount) > 0);
  }

  get filteredTaxRows(): InvoiceRow[] {
    return this.filterRecords(this.taxRows, this.billTaxFilter);
  }

  get totalTaxAmount(): number {
    return this.filteredTaxRows.reduce((sum, row) => sum + this.getAmount(row.tax_amount), 0);
  }

  get billPeriodLabel(): string {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const startLabel = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endLabel = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${startLabel} - ${endLabel}`;
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
      .filter((row) => (row.status || '').toLowerCase() === 'pending')
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

  get paidPercentage(): number {
    const total = this.totalInvoiceAmount;
    return total > 0 ? Math.round((this.paidAmount / total) * 100) : 0;
  }

  get unpaidPercentage(): number {
    const total = this.totalInvoiceAmount;
    return total > 0 ? Math.round((this.unpaidAmount / total) * 100) : 0;
  }

  get pendingPercentage(): number {
    const total = this.totalInvoiceAmount;
    return total > 0 ? Math.round((this.pendingAmount / total) * 100) : 0;
  }

  get overduePercentage(): number {
    const total = this.totalInvoiceAmount;
    return total > 0 ? Math.round((this.overdueAmount / total) * 100) : 0;
  }

  get deploymentServiceCount(): number {
    return this.billRows.filter((row) => row.source === 'deployment').length;
  }

  get toolServiceCount(): number {
    return this.billRows.filter((row) => row.source === 'tool').length;
  }

  get highestServiceCharge(): BillServiceRow | null {
    if (!this.billRows.length) {
      return null;
    }
    return [...this.billRows].sort((a, b) => b.amount - a.amount)[0];
  }

  get currentPage(): number {
    return Math.floor(this.offset / this.limit) + 1;
  }

  get totalPages(): number {
    if (!this.totalRecords) {
      return 1;
    }
    return Math.max(1, Math.ceil(this.totalRecords / this.limit));
  }

  get pageRangeLabel(): string {
    if (!this.totalRecords) {
      return '0-0 of 0';
    }
    const start = this.offset + 1;
    const end = Math.min(this.offset + this.limit, this.totalRecords);
    return `${start}-${end} of ${this.totalRecords}`;
  }

  ngOnInit(): void {
    // Initialize date range
    this.startDate = this.getDefaultStartDate();
    this.endDate = this.getDefaultEndDate();
    this.dateRangeDisplay = this.formatDateRangeDisplay();
    
    this.initializeScopeFilters();
    this.getInvoiceList();
    this.loadBillServiceCharges();
    this.loadBillingDetails();
    // refresh table when currency changes by reassigning the data array
    this.sharedService.currencyChange$.subscribe(() => {
      this.tableData = Array.isArray(this.tableData) ? [...this.tableData] : this.tableData;
    });
    try {
      if (typeof Cashfree !== 'undefined') {
        this.cashfree = Cashfree({ mode: environment.cashFree });
      }
    } catch (e) {
      // Cashfree SDK not available in test environments; ignore
      this.cashfree = undefined;
    }
    // this.cashfree.on('payment.success', (event: any) => {
    //   console.log('Payment Success:', event);
    //   this.toastr.success(event.transaction.txnId);
    // });

    // this.cashfree.on('payment.failed', (event: any) => {
    //   console.error('Payment Failed:', event);
    //   this.toastr.error(event.transaction.message);
    // });

    // this.cashfree.on('payment.dismissed', (event: any) => {
    //   console.warn('Payment Dismissed:', event);
    //   this.toastr.warning('Payment Dismissed');
    // });
  }

  ngAfterViewInit(): void {
    this.initializeDateRangePicker();
  }

  ngOnDestroy(): void {
    if (this.dateRangePicker?.destroy) {
      this.dateRangePicker.destroy();
      this.dateRangePicker = null;
    }
  }

  reviewDueInvoices(): void {
    // this.activeTopSection = 'payments';
    // this.activeTab = 'payments-due';
    setTimeout(() => {
      const duePanel = document.getElementById('payments-due-panel');
      duePanel?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  }

  switchTopSection(section: TopSection): void {
    this.activeTopSection = section;
    if (section === 'bill' && !this.billRows.length) {
      this.loadBillServiceCharges();
    }
  }

  onProjectScopeChange(value: string): void {
    this.selectedProjectId = value || 'all';
    this.selectedEnvironmentId = 'all';
    this.offset = 0;
    this.loadEnvironmentOptionsByProject(this.selectedProjectId);
    this.getInvoiceList();
  }

  onEnvironmentScopeChange(value: string): void {
    this.selectedEnvironmentId = value || 'all';
    this.offset = 0;
    this.applyInvoiceScopeFilter();
    this.loadBillServiceCharges();
  }

  resetScopeFilters(): void {
    this.selectedProjectId = 'all';
    this.selectedEnvironmentId = 'all';
    this.offset = 0;
    this.loadEnvironmentOptionsByProject('all');
    this.getInvoiceList();
  }

  onTimeRangeChange(value: TimeRangeOption): void {
    this.selectedTimeRange = value || '3m';
  }

  getCurrentDate(): string {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  onDateFilterChange(value: string): void {
    this.selectedDate = value;
    this.refreshInvoices();
  }

  getDefaultStartDate(): string {
    const date = new Date();
    date.setMonth(date.getMonth() - 3);
    date.setDate(1);
    return date.toISOString().split('T')[0];
  }

  getDefaultEndDate(): string {
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return end.toISOString().split('T')[0];
  }

  formatDateRangeDisplay(): string {
    const start = new Date(this.startDate);
    const end = new Date(this.endDate);
    const startLabel = start.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    const endLabel = end.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    return `${startLabel} - ${endLabel}`;
  }

  openDateRangePicker(): void {
    this.initializeDateRangePicker();
    if (this.dateRangePicker?.show) {
      this.dateRangePicker.show();
    }
  }

  onDateRangeChange(event: any): void {
    const value = event.target.value;
    if (value) {
      this.startDate = value.split(' - ')[0] || this.startDate;
      this.endDate = value.split(' - ')[1] || this.endDate;
      this.dateRangeDisplay = this.formatDateRangeDisplay();
      this.refreshInvoices();
    }
  }

  private initializeDateRangePicker(): void {
    if (this.dateRangePicker || !this.dateRangePickerInput?.nativeElement) {
      return;
    }

    this.dateRangePicker = new Litepicker({
      element: this.dateRangePickerInput.nativeElement,
      singleMode: false,
      numberOfMonths: 2,
      numberOfColumns: 2,
      autoApply: true,
      format: 'MMM YYYY',
      startDate: this.startDate,
      endDate: this.endDate,
      setup: (picker: any) => {
        picker.on('selected', (start: any, end: any) => {
          const nextStart = this.getPickerDateValue(start);
          const nextEnd = this.getPickerDateValue(end);
          if (!nextStart || !nextEnd) {
            return;
          }
          this.startDate = this.toMonthStart(nextStart);
          this.endDate = this.toMonthEnd(nextEnd);
          this.dateRangeDisplay = this.formatDateRangeDisplay();
          this.refreshInvoices();
        });
      }
    });
  }

  private getPickerDateValue(value: any): string {
    if (!value) {
      return '';
    }
    if (typeof value.format === 'function') {
      return value.format('YYYY-MM-DD');
    }
    const parsed = new Date(value);
    if (isNaN(parsed.getTime())) {
      return '';
    }
    return parsed.toISOString().split('T')[0];
  }

  private toMonthStart(value: string): string {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return value;
    }
    return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
  }

  private toMonthEnd(value: string): string {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return value;
    }
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];
  }

  onStatusFilterChange(tab: PaymentTab, value: StatusFilterOption): void {
    const selected = value || 'all';
   
    this.transactionStatusFilter = selected;
  }

  switchBillTab(tab: BillTab): void {
    this.activeBillTab = tab;
  }

  onFilterChange(value: string, tab: PaymentTab): void {
    this.transactionsFilter = value;
  }

  goToNewDeployModel(data: any) {
    console.log('Navigating to new deployment modal with data:', data);
  }

  getRowId(row: InvoiceRow): string {
    return row.invoiceNumber || String(row.id || '--');
  }

  getIssuedDate(row: InvoiceRow): string {
    const value = row.issued_at || row.period;
    if (!value) {
      return '--';
    }
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return '--';
    }
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getDueDate(row: InvoiceRow): string {
    return this.getIssuedDate(row);
  }

  getBillingPeriod(row: InvoiceRow): string {
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

  getPaymentMethod(row: InvoiceRow): string {
    return row.payment_method || 'BankRedirect';
  }

  getCurrencyLabel(row: InvoiceRow): string {
    return row.currency || this.sharedService.getCurrency() || 'USD';
  }

  getStatusLabel(row: InvoiceRow): string {
    const value = (row.status || '').toLowerCase();
    if (!value) {
      return '--';
    }
    if (value === 'draft') {
      return 'Unpaid';
    }
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  getStatusClass(row: InvoiceRow): string {
    const value = (row.status || '').toLowerCase();
    if (value === 'paid') {
      return 'status-paid';
    }
    if (value === 'draft') {
      return 'status-due';
    }
    return 'status-default';
  }

  canShowPayNow(row: InvoiceRow): boolean {
    const normalized = this.getNormalizedStatus(row);
    const amount = this.getAmount(row.total || row.subtotal);
    return (normalized === 'due' || normalized === 'unpaid') && amount > 0;
  }

  formatMoney(amount: number | undefined | null, currencyFrom?: string): string {
    const target = this.sharedService.getCurrency() || 'USD';
    const converted = this.sharedService.convertAmount(Number(amount || 0), currencyFrom || 'USD', target);
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: target,
        minimumFractionDigits: 2,
      }).format(converted);
    } catch (e) {
      return String(converted);
    }
  }

  refreshInvoices(): void {
    this.getInvoiceList();
    this.loadBillServiceCharges();
  }

  printPage(): void {
    window.print();
  }

  downloadAll(): void {
    const rows = this.filteredTransactions.filter((row) => !!row.pdf_generated_at);
    if (!rows.length) {
      this.toastr.info('No PDFs available to download');
      return;
    }
    rows.forEach((row) => this.viewPdf(row));
  }

  onDownload(row: InvoiceRow): void {
    this.viewPdf(row);
  }

  payOutstandingNow(): void {
    const payableInvoice = this.duePayments.find(
      (invoice) => this.getAmount(invoice.total || invoice.subtotal) > 0
    );
    if (!payableInvoice) {
      this.toastr.info('No unpaid invoices available for payment');
      return;
    }
    this.openPayNow(payableInvoice);
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

  openPayNow(data: any) {
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
            this.getInvoiceList()
          }
        }, (error: any) => {
          this.toastr.error('Payment Dismissed');
        });

      }

    });
  }

  viewPdf(data: any) {
    if (!data?.id) {
      this.toastr.error('Invoice ID not found');
      return;
    }
    this.http.getPdfInvoice(data.id).subscribe({
      next: (response: any) => {
        if (response?.data?.url) {
          window.open(response.data.url, '_blank');
        } else {
          this.toastr.error('PDF URL not available');
        }
      },
      error: (error) => {
        this.toastr.error(error.message || 'Failed to fetch PDF');
      },
      complete: () => {
        window.location.reload();
      }
    });
  }
  getInvoiceList() {
    const accountId = localStorage.getItem('accountId');
    if (accountId) {
      this.http.getInvoiceList(accountId, this.limit, this.offset).subscribe({
        next: (data: any) => {
          if (data.success) {
            const payload = data.data || {};
            this.rawInvoiceData = payload.data || [];
            this.applyInvoiceScopeFilter();
          }
        },
        error: (error) => {
          console.error('Error fetching invoice data:', error);
        }
      });
    }
  }
  onPageChange(event: { limit: number; offset: number }) {
    this.limit = event.limit;
    this.offset = event.offset;
    this.getInvoiceList();
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
      const normalized = this.getNormalizedStatus(row);
      if (status === 'due') {
        return normalized === 'due' || normalized === 'draft';
      }
      if (status === 'credit') {
        return normalized === 'credit' || normalized === 'unapplied';
      }
      return normalized === status;
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

  private initializeScopeFilters(): void {
    const storedProject = this.safeParseLocalStorage('project');
    const storedEnvironment = this.safeParseLocalStorage('environment');

    this.selectedProjectId = storedProject?.id || 'all';
    this.selectedEnvironmentId = storedEnvironment?.id || 'all';

    this.loadProjectOptions();
  }

  private loadProjectOptions(): void {
    this.projectsService.getAllProjects().subscribe({
      next: (res: any) => {
        const projects = Array.isArray(res?.data) ? res.data : [];
        this.projectOptions = [
          { id: 'all', name: 'All projects' },
          ...projects.map((item: any) => ({ id: String(item.id), name: item.name || item.id }))
        ];

        if (!this.projectOptions.some((p) => p.id === this.selectedProjectId)) {
          this.selectedProjectId = 'all';
        }

        this.loadEnvironmentOptionsByProject(this.selectedProjectId);
      },
      error: () => {
        this.projectOptions = [{ id: 'all', name: 'All projects' }];
        this.loadEnvironmentOptionsByProject(this.selectedProjectId);
      }
    });
  }

  private loadEnvironmentOptionsByProject(projectId: string): void {
    if (!projectId || projectId === 'all') {
      const storedEnv = this.safeParseLocalStorage('environment');
      this.environmentOptions = [
        { id: 'all', name: 'All environments' },
        ...(storedEnv?.id ? [{ id: String(storedEnv.id), name: storedEnv.name || storedEnv.id }] : [])
      ];
      if (!this.environmentOptions.some((env) => env.id === this.selectedEnvironmentId)) {
        this.selectedEnvironmentId = 'all';
      }
      this.applyInvoiceScopeFilter();
      this.loadBillServiceCharges();
      return;
    }

    this.projectsService.getAllEnvironmentsByProject(projectId).subscribe({
      next: (res: any) => {
        const environments = Array.isArray(res?.data) ? res.data : [];
        this.environmentOptions = [
          { id: 'all', name: 'All environments' },
          ...environments.map((item: any) => ({ id: String(item.id), name: item.name || item.id }))
        ];

        if (!this.environmentOptions.some((env) => env.id === this.selectedEnvironmentId)) {
          this.selectedEnvironmentId = 'all';
        }

        this.applyInvoiceScopeFilter();
        this.loadBillServiceCharges();
      },
      error: () => {
        this.environmentOptions = [{ id: 'all', name: 'All environments' }];
        this.selectedEnvironmentId = 'all';
        this.applyInvoiceScopeFilter();
        this.loadBillServiceCharges();
      }
    });
  }

  private applyInvoiceScopeFilter(): void {
    let rows = [...this.rawInvoiceData];

    // if (this.selectedProjectId !== 'all') {
    //   rows = rows.filter((row) =>
    //     this.matchesScope(row, ['projectId', 'project_id', 'projectID'], this.selectedProjectId)
    //   );
    // }

    // if (this.selectedEnvironmentId !== 'all') {
    //   rows = rows.filter((row) =>
    //     this.matchesScope(row, ['environmentId', 'environment_id', 'envId', 'env_id'], this.selectedEnvironmentId)
    //   );
    // }
    this.tableData = rows;
    console.log('Filtered invoice rows based on scope:', this.tableData);

    this.totalRecords = rows.length;
  }

  private matchesScope(row: Record<string, any>, keys: string[], selectedId: string): boolean {
    return keys.some((key) => {
      const value = row[key];
      return value != null && String(value) === selectedId;
    });
  }

  private safeParseLocalStorage(key: string): any {
    try {
      return JSON.parse(localStorage.getItem(key) || '{}');
    } catch {
      return {};
    }
  }

  private loadBillServiceCharges(): void {
    const envIds = this.getScopedEnvironmentIds();
    if (!envIds.length) {
      this.billRows = [];
      return;
    }

    this.billLoading = true;

    forkJoin({
      catalog: this.deploymentsService.getInstanceTypes().pipe(catchError(() => of({ data: [] }))),
      envBatches: forkJoin(
        envIds.map((envId) =>
          forkJoin({
            envId: of(envId),
            deployments: this.deploymentsService.getDeployments(envId).pipe(catchError(() => of({ data: [] }))),
            tools: this.toolsService.getToolsList(envId).pipe(catchError(() => of({ data: [] })))
          })
        )
      )
    }).subscribe({
      next: ({ catalog, envBatches }: any) => {
        const pricingCatalog = Array.isArray(catalog?.data) ? catalog.data : [];
        const rateMap = this.getInstanceRateMap(pricingCatalog);
        const envNameMap = this.environmentOptions.reduce((acc: Record<string, string>, env) => {
          acc[env.id] = env.name;
          return acc;
        }, {});

        const rows: BillServiceRow[] = [];
        (envBatches || []).forEach((batch: any) => {
          const envId = String(batch?.envId || '');
          const envName = envNameMap[envId] || envId;
          const deploymentRows = Array.isArray(batch?.deployments?.data) ? batch.deployments.data : [];
          const toolRows = Array.isArray(batch?.tools?.data) ? batch.tools.data : [];

          deploymentRows.forEach((item: any) => {
            rows.push(this.createBillServiceRow(item, 'deployment', rateMap, envName));
          });
          toolRows.forEach((item: any) => {
            rows.push(this.createBillServiceRow(item, 'tool', rateMap, envName));
          });
        });

        this.billRows = rows;
      },
      error: () => {
        this.billRows = [];
      },
      complete: () => {
        this.billLoading = false;
      }
    });
  }

  private createBillServiceRow(
    item: any,
    source: 'deployment' | 'tool',
    rateMap: Record<string, { rate: number; currency?: string }>,
    envName: string
  ): BillServiceRow {
    const name = item?.name || item?.deploymentName || item?.toolName || 'Unnamed service';
    const instanceType = this.getInstanceType(item);
    const fromRate = instanceType ? rateMap[instanceType] : undefined;
    const apiAmount = this.getAmount(item?.totalCost ?? item?.estimatedCost ?? item?.total_cost ?? item?.cost);
    const estimatedFromRate = this.getAmount((fromRate?.rate || 0) * 730);

    return {
      name,
      description: `${source === 'deployment' ? 'Deployment' : 'Tool'}: ${name}`,
      usage: `${envName}${instanceType ? ` | ${instanceType}` : ''}`,
      amount: apiAmount > 0 ? apiAmount : estimatedFromRate,
      source,
      currency: fromRate?.currency || item?.currency || 'USD'
    };
  }

  private getScopedEnvironmentIds(): string[] {
    if (this.selectedEnvironmentId !== 'all') {
      return [this.selectedEnvironmentId];
    }

    if (this.selectedProjectId !== 'all') {
      const ids = this.environmentOptions
        .filter((env) => env.id !== 'all')
        .map((env) => env.id);
      return ids;
    }

    const storedEnvironment = this.safeParseLocalStorage('environment');
    return storedEnvironment?.id ? [String(storedEnvironment.id)] : [];
  }

  private getInstanceRateMap(catalog: any[]): Record<string, { rate: number; currency?: string }> {
    return catalog.reduce((acc: Record<string, { rate: number; currency?: string }>, item: any) => {
      const key = item?.instanceType;
      if (!key) {
        return acc;
      }
      const rate = this.getAmount(item?.instanceHourRate ?? item?.price);
      acc[key] = { rate, currency: item?.currency || 'USD' };
      return acc;
    }, {});
  }

  private getInstanceType(item: any): string {
    return (
      item?.instanceType ||
      item?.application?.instanceType ||
      item?.schema?.instanceType ||
      item?.resource?.instanceType ||
      ''
    );
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
            panNumber: response.data.panNumber || null,
            addressLine1: response.data.addressLine1 || response.data.address_line1 || null,
            addressLine2: response.data.addressLine2 || response.data.address_line2 || null,
            city: response.data.city || null,
            state: response.data.state || null,
            country: response.data.country || null,
            postalCode: response.data.postalCode || response.data.postal_code || null,
            paymentMethod: response.data.paymentMethod || response.data.payment_method || null
          };
        }
      },
      error: () => {
        this.companyBillingInfo = {
          companyName: null,
          gstNumber: null,
          panNumber: null,
          addressLine1: null,
          addressLine2: null,
          city: null,
          state: null,
          country: null,
          postalCode: null,
          paymentMethod: null
        };
      },
      complete: () => {
        this.billingDetailsLoading = false;
      }
    });
  }

  navigateToAccountSettings(): void {
    this.router.navigate(['/account-settings']);
  }
}
