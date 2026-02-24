import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PricingsService } from './pricing.service';
import { ToastrService } from 'ngx-toastr';
import { SharedService } from '../../shared/services/shared.service';
import { UserService } from '../../core/services/user.service';
import { environment } from '../../../environments/environment';
import { ProjectsService } from '../projects/projects.service';
import { BillServiceRow, CompanyBillingInfo, InvoiceRow, ScopeOption } from '../../core/models/company-billing-info.model';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';
declare const Cashfree: any;

type PaymentTab = 'payments-due' | 'unapplied-funds' | 'transactions';
type TopSection = 'bill' | 'payments';
type BillTab = 'service' | 'taxes';
type TimeRangeOption = '30d' | '3m' | '6m' | 'current-month' | 'all';
type StatusFilterOption = 'all' | 'tool' | 'application';


@Component({
  selector: 'app-invoice',
  standalone: true,
  imports: [CommonModule,FormsModule],
  templateUrl: './invoice.component.html',
  styleUrl: './invoice.component.scss',
  providers: [PricingsService]
})
export class InvoiceComponent implements OnInit {
  rawInvoiceData: InvoiceRow[] = [];
  tableData: InvoiceRow[] = [];
  activeTopSection: TopSection = 'bill';
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
    { value: 'tool', label: 'Tools' },
    { value: 'application', label: 'Application' }
  ];
  billRows: BillServiceRow[] = [];
  billLoading = false;
  projectOptions: ScopeOption[] = [{ id: 'all', name: 'All projects' }];
  environmentOptions: ScopeOption[] = [{ id: 'all', name: 'All environments' }];
  selectedProjectId = 'all';
  selectedEnvironmentId = 'all';
  selectedDate = new Date().toISOString().split('T')[0];
  selectedMonth = '';
  monthPickerOpen = false;
  monthPickerMonth = new Date().getMonth() + 1;
  monthPickerYear = new Date().getFullYear();
  readonly monthOptions: Array<{ value: number; label: string }> = [
    { value: 1, label: 'Jan' },
    { value: 2, label: 'Feb' },
    { value: 3, label: 'Mar' },
    { value: 4, label: 'Apr' },
    { value: 5, label: 'May' },
    { value: 6, label: 'Jun' },
    { value: 7, label: 'Jul' },
    { value: 8, label: 'Aug' },
    { value: 9, label: 'Sep' },
    { value: 10, label: 'Oct' },
    { value: 11, label: 'Nov' },
    { value: 12, label: 'Dec' }
  ];
  startDate = '';
  endDate = '';
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

  get filteredBillRows(): BillServiceRow[] {
    const query = (this.billServiceFilter || '').trim().toLowerCase();
    const rowsWithUptime = this.billRows.filter((row) => this.getBillRowUptimeHours(row) > 0);
    if (!query) {
      return rowsWithUptime;
    }
    return rowsWithUptime.filter((row) =>
      `${row.description} ${row.usage}`.toLowerCase().includes(query)
    );
  }

  get billEstimatedTotal(): number {
    return this.billRows.reduce((sum, item) => sum + this.getAmount(item.amount), 0);
  }

  get filteredBillInstanceSubtotal(): number {
    return this.filteredBillRows.reduce((sum, row) => sum + this.getAmount(row.instanceCost), 0);
  }

  get filteredBillCpuSubtotal(): number {
    return this.filteredBillRows.reduce((sum, row) => sum + this.getAmount(row.cpuCost), 0);
  }

  get filteredBillMemorySubtotal(): number {
    return this.filteredBillRows.reduce((sum, row) => sum + this.getAmount(row.memoryCost), 0);
  }

  get filteredBillChargeSubtotal(): number {
    return this.filteredBillRows.reduce((sum, row) => sum + this.getAmount(row.amount), 0);
  }

  get billChargesTotal(): number {
    return this.selectedMonthInvoices.reduce((sum, row) => sum + this.getAmount(row.subtotal), 0);
  }

  get billTaxesTotal(): number {
    return this.selectedMonthInvoices.reduce((sum, row) => sum + this.getAmount(row.tax_amount), 0);
  }

  get billCreditsApplied(): number {
    const grossDue = this.billChargesTotal + this.billTaxesTotal;
    return Math.max(0, grossDue - this.billTotalDue);
  }

  get billTotalDue(): number {
    return this.selectedMonthDueInvoices.reduce((sum, row) => sum + this.getAmount(row.total || row.subtotal), 0);
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
    const start = this.parseDateValue(this.startDate);
    const end = this.parseDateValue(this.endDate);
    if (!start || !end) {
      return '--';
    }
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
    return this.monthScopedBillRows.filter((row) => row.source === 'tool').length;
  }

  get toolServiceCostTotal(): number {
    return this.monthScopedBillRows
      .filter((row) => row.source === 'tool')
      .reduce((sum, row) => sum + this.getAmount(row.amount), 0);
  }

  get totalBillableServicesCount(): number {
    return this.monthScopedBillRows.length;
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

  get yearOptions(): number[] {
    const currentYear = new Date().getFullYear();
    const years: number[] = [];
    for (let year = currentYear; year >= 2000; year -= 1) {
      years.push(year);
    }
    return years;
  }

  get selectedMonthLabel(): string {
    const [yearText, monthText] = (this.selectedMonth || '').split('-');
    const year = Number(yearText);
    const month = Number(monthText);
    if (!year || !month) {
      return 'Select month';
    }
    const monthLabel = this.monthOptions.find((item) => item.value === month)?.label;
    return monthLabel ? `${monthLabel} ${year}` : 'Select month';
  }

  get selectedMonthInvoices(): InvoiceRow[] {
    const start = this.parseDateValue(this.startDate);
    const end = this.parseDateValue(this.endDate);
    if (!start || !end) {
      return [];
    }
    return this.transactions.filter((row) => {
      const rowDate = this.getInvoiceDate(row);
      console.log(rowDate)
      return rowDate ? rowDate >= start && rowDate <= end : false;
    });
  }

  get selectedMonthDueInvoices(): InvoiceRow[] {
    return this.selectedMonthInvoices.filter((row) => this.isDuePayment(row));
  }

  get monthScopedBillRows(): BillServiceRow[] {
    return this.billRows.filter((row) => this.getBillRowUptimeHours(row) > 0);
  }

  ngOnInit(): void {
    this.selectedMonth = this.getCurrentMonthValue();
    this.syncMonthPickerFromSelected();
    this.applyMonthSelection(this.selectedMonth);

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

  reviewDueInvoices(): void {
    this.activeTopSection = 'payments';
    this.activeTab = 'transactions';
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
    return this.formatDateAsYMD(date);
  }

  getDefaultEndDate(): string {
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return this.formatDateAsYMD(end);
  }

  getCurrentMonthValue(): string {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${now.getFullYear()}-${month}`;
  }

  onMonthChange(value: string): void {
    if (!value) {
      return;
    }
    const [yearText, monthText] = value.split('-');
    const year = Number(yearText);
    const month = Number(monthText);
    if (!year || !month) {
      return;
    }
    const bounded = this.clampToAllowedMonth(year, month);
    const normalized = `${bounded.year}-${String(bounded.month).padStart(2, '0')}`;
    this.selectedMonth = normalized;
    this.applyMonthSelection(normalized);
    this.syncMonthPickerFromSelected();
    this.refreshInvoices();
  }

  toggleMonthPicker(event: MouseEvent): void {
    event.stopPropagation();
    if (this.monthPickerOpen) {
      return;
    }
    this.syncMonthPickerFromSelected();
    this.monthPickerOpen = true;
  }

  onMonthPickerMonthChange(value: string): void {
    const parsed = Number(value);
    if (!parsed) {
      return;
    }
    const bounded = this.clampToAllowedMonth(this.monthPickerYear, parsed);
    this.monthPickerYear = bounded.year;
    this.monthPickerMonth = bounded.month;
  }

  onMonthPickerYearChange(value: string): void {
    const parsed = Number(value);
    if (!parsed) {
      return;
    }
    const bounded = this.clampToAllowedMonth(parsed, this.monthPickerMonth);
    this.monthPickerYear = bounded.year;
    this.monthPickerMonth = bounded.month;
  }

  applyMonthPickerSelection(): void {
    const parsedMonth = Number(this.monthPickerMonth);
    const parsedYear = Number(this.monthPickerYear);
    if (!parsedMonth || !parsedYear) {
      return;
    }
    const bounded = this.clampToAllowedMonth(parsedYear, parsedMonth);
    this.monthPickerMonth = bounded.month;
    this.monthPickerYear = bounded.year;

    const month = String(this.monthPickerMonth).padStart(2, '0');
    const value = `${this.monthPickerYear}-${month}`;
    this.selectedMonth = value;
    this.applyMonthSelection(value);
    this.refreshInvoices();
    this.monthPickerOpen = false;
  }

  onApplyMonthPicker(event: MouseEvent): void {
    event.stopPropagation();
    this.applyMonthPickerSelection();
  }

  onCancelMonthPicker(event: MouseEvent): void {
    event.stopPropagation();
    this.closeMonthPicker();
  }

  closeMonthPicker(): void {
    this.monthPickerOpen = false;
    this.syncMonthPickerFromSelected();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (!target?.closest('.date-range-selector')) {
      this.closeMonthPicker();
    }
  }

  private applyMonthSelection(value: string): void {
    const [yearText, monthText] = value.split('-');
    const year = Number(yearText);
    const month = Number(monthText);
    if (!year || !month) {
      return;
    }
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);
    this.startDate = this.formatDateAsYMD(start);
    this.endDate = this.formatDateAsYMD(end);
  }

  private syncMonthPickerFromSelected(): void {
    const [yearText, monthText] = (this.selectedMonth || '').split('-');
    const year = Number(yearText);
    const month = Number(monthText);
    if (!year || !month) {
      const now = new Date();
      this.monthPickerYear = now.getFullYear();
      this.monthPickerMonth = now.getMonth() + 1;
      return;
    }
    const bounded = this.clampToAllowedMonth(year, month);
    this.monthPickerYear = bounded.year;
    this.monthPickerMonth = bounded.month;
  }

  isMonthDisabled(month: number): boolean {
    const now = new Date();
    return this.monthPickerYear === now.getFullYear() && month > now.getMonth() + 1;
  }

  private clampToAllowedMonth(year: number, month: number): { year: number; month: number } {
    const now = new Date();
    const normalizedYear = Math.min(Math.max(2000, year), now.getFullYear());
    const normalizedMonth = Math.min(Math.max(1, month), 12);
    if (normalizedYear === now.getFullYear() && normalizedMonth > now.getMonth() + 1) {
      return { year: normalizedYear, month: now.getMonth() + 1 };
    }
    return { year: normalizedYear, month: normalizedMonth };
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

  private getBillRowUptimeHours(row: BillServiceRow): number {
    const raw = row?.uptimeHours;
    if (typeof raw === 'number') {
      return Number.isFinite(raw) ? raw : 0;
    }
    if (typeof raw === 'string') {
      const parsed = parseFloat(raw);
      return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
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
      const category = this.getTransactionCategory(row);
      return status === category;
    });
  }

  private getTransactionCategory(row: InvoiceRow): 'tool' | 'application' {
    const hint = `${row?.['source'] || ''} ${row?.['type'] || ''} ${row?.['category'] || ''} ${row?.['description'] || ''} ${row?.['name'] || ''}`.toLowerCase();
    return hint.includes('tool') ? 'tool' : 'application';
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
    console.log(value)
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  }

  private parseDateValue(value: string): Date | null {
    if (!value) {
      return null;
    }
    const [yearText, monthText, dayText] = value.split('-');
    const year = Number(yearText);
    const month = Number(monthText);
    const day = Number(dayText);
    if (!year || !month || !day) {
      return null;
    }
    const date = new Date(year, month - 1, day);
    return isNaN(date.getTime()) ? null : date;
  }

  private formatDateAsYMD(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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
      if (
        this.selectedEnvironmentId === 'all' ||
        !this.environmentOptions.some((env) => env.id === this.selectedEnvironmentId)
      ) {
        this.selectedEnvironmentId = this.getDefaultEnvironmentId(this.environmentOptions);
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

        if (
          this.selectedEnvironmentId === 'all' ||
          !this.environmentOptions.some((env) => env.id === this.selectedEnvironmentId)
        ) {
          this.selectedEnvironmentId = this.getDefaultEnvironmentId(this.environmentOptions);
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

    this.tableData = rows;

    this.totalRecords = rows.length;
  }

  private getDefaultEnvironmentId(options: ScopeOption[]): string {
    const firstSpecific = options.find((env) => env.id !== 'all');
    return firstSpecific?.id || 'all';
  }



  private safeParseLocalStorage(key: string): any {
    try {
      return JSON.parse(localStorage.getItem(key) || '{}');
    } catch {
      return {};
    }
  }

  private loadBillServiceCharges(): void {
    const accountId = localStorage.getItem('accountId') || this.sharedService.getUser()?.id || '';
    const envIds = this.getScopedEnvironmentIds();
    if (!accountId || !envIds.length) {
      this.billRows = [];
      this.billLoading = false;
      return;
    }

    this.billLoading = true;
    const envNameMap = this.environmentOptions.reduce((acc: Record<string, string>, env) => {
      acc[env.id] = env.name;
      return acc;
    }, {});

    forkJoin(
      envIds.map((envId) =>
        forkJoin({
          envId: of(envId),
          costs: this.http.getCostByService(
            accountId,
            this.selectedEnvironmentId,
            this.startDate,
            this.endDate,
            this.selectedProjectId
          ).pipe(catchError(() => of({ data: [] }))),
          deployments: this.http.getDeployments(envId).pipe(catchError(() => of({ data: [] }))),
          // tools: this.http.getToolsList(envId).pipe(catchError(() => of({ data: [] })))
        })
      )
    ).subscribe({
      next: (responses: any[]) => {
        const responseRows = responses.map((response: any) => {
          const envId = String(response?.envId || '');
          const envName = envNameMap[envId] || envId;
          const deploymentNameById = this.buildNameMap(response?.deployments?.data, ['id', 'deploymentId'], ['name', 'deploymentName']);
          // const toolNameById = this.buildNameMap(response?.tools?.data, ['id', 'toolId'], ['name', 'toolName']);
          const toolNameById = {};
          const items = this.extractCostByServiceItems(response?.costs);
          return { envName, deploymentNameById, toolNameById, items };
        });

        const deploymentIds = Array.from(new Set(
          responseRows.flatMap(({ items }) =>
            items
              .map((item: any) => item?.deploymentId ?? item?.deployment_id)
              .filter((id: any) => id !== undefined && id !== null && id !== '')
              .map((id: any) => String(id))
          )
        ));

        const setRows = (resolvedDeploymentNames: Record<string, string>) => {
          const rows: BillServiceRow[] = [];
          responseRows.forEach(({ envName, deploymentNameById, toolNameById, items }) => {
            const mergedDeploymentNames = { ...deploymentNameById, ...resolvedDeploymentNames };
            items.forEach((item: any) => {
              rows.push(this.mapCostByServiceItem(item, envName, mergedDeploymentNames, toolNameById));
            });
          });
          this.billRows = rows;
          this.billLoading = false;
        };

        if (!deploymentIds.length) {
          setRows({});
          return;
        }

        forkJoin(
          deploymentIds.map((id) =>
            this.http.getDeploymentById(id).pipe(catchError(() => of({ data: null })))
          )
        ).subscribe({
          next: (deploymentResponses: any[]) => {
            const resolvedDeploymentNames = deploymentIds.reduce((acc: Record<string, string>, id, index) => {
              const deployment = deploymentResponses[index]?.data;
              const name = deployment?.name || deployment?.deploymentName;
              if (name) {
                acc[id] = name;
              }
              return acc;
            }, {});
            setRows(resolvedDeploymentNames);
          },
          error: () => {
            setRows({});
          }
        });
      },
      error: () => {
        this.billRows = [];
        this.billLoading = false;
      }
    });
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

  private extractCostByServiceItems(response: any): any[] {
    const payload = response?.data ?? response ?? {};
    const projects = Array.isArray(payload?.projects) ? payload.projects : [];
    if (projects.length) {
      const flattened: any[] = [];
      projects.forEach((project: any) => {
        const environments = Array.isArray(project?.environments) ? project.environments : [];
        environments.forEach((environment: any) => {
          const deployments = Array.isArray(environment?.deployments) ? environment.deployments : [];
          deployments.forEach((deployment: any) => {
            flattened.push({
              ...deployment,
              projectId: project?.projectId || deployment?.projectId,
              environmentId: environment?.environmentId || deployment?.environmentId,
              source: deployment?.source || 'deployment'
            });
          });

          const tools = Array.isArray(environment?.tools) ? environment.tools : [];
          tools.forEach((tool: any) => {
            flattened.push({
              ...tool,
              projectId: project?.projectId || tool?.projectId,
              environmentId: environment?.environmentId || tool?.environmentId,
              source: tool?.source || 'tool'
            });
          });
        });
      });
      return flattened;
    }

    if (Array.isArray(payload)) {
      return payload;
    }

    const candidates = [
      payload?.cost_by_service,
      payload?.costByService,
      payload?.services,
      payload?.items,
      payload?.totals,
      payload?.data
    ];

    for (const candidate of candidates) {
      if (Array.isArray(candidate)) {
        return candidate;
      }
    }

    return [];
  }

  private mapCostByServiceItem(
    item: any,
    envName: string,
    deploymentNameById: Record<string, string>,
    toolNameById: Record<string, string>
  ): BillServiceRow {
    const deploymentId = item?.deploymentId || item?.deployment_id || item?.id;
    const toolId = item?.toolId || item?.tool_id || item?.id;
    const deploymentKey = deploymentId !== undefined && deploymentId !== null ? String(deploymentId) : '';
    const toolKey = toolId !== undefined && toolId !== null ? String(toolId) : '';
    const deploymentDisplayName = item?.dep?.deploymentName ||
      item?.dep?.name ||
      item?.deployment?.deploymentName ||
      item?.deployment?.name;
    const toolDisplayName = item?.tool?.toolName || item?.tool?.name;
    const defaultName = item?.service_name ||
      item?.serviceName ||
      item?.service ||
      item?.name ||
      (deploymentKey ? deploymentNameById[deploymentKey] : undefined) ||
      (toolKey ? toolNameById[toolKey] : undefined) ||
      item?.deploymentName ||
      item?.toolName ||
      item?.resource_name ||
      'Unnamed service';
    const source = this.inferServiceSource(item, defaultName);
    const name = source === 'deployment'
      ? (deploymentDisplayName || defaultName)
      : source === 'tool'
        ? (toolDisplayName || defaultName)
        : defaultName;
    const instanceType = item?.instanceType || item?.instance_type || item?.resource_type || '';
    const usageValue = item?.usage ?? item?.usageQuantity ?? item?.quantity;
    const uptimeHours = this.getAmount(item?.uptimeHours ?? item?.uptime_hours);
    const usageParts = [];
    if (instanceType) {
      usageParts.push(String(instanceType));
    }
    if (usageValue !== undefined && usageValue !== null && usageValue !== '') {
      usageParts.push(`usage: ${usageValue}`);
    }
    // if (uptimeHours > 0) {
    //   usageParts.push(`uptime: ${uptimeHours.toFixed(2)}h`);
    // }
    if (this.getAmount(item?.costCpu) > 0) {
      usageParts.push(`cpu: ${this.getAmount(item.costCpu).toFixed(4)}`);
    }
    if (this.getAmount(item?.costMem) > 0) {
      usageParts.push(`mem: ${this.getAmount(item.costMem).toFixed(4)}`);
    }
    if (this.getAmount(item?.costInstance) > 0) {
      usageParts.push(`instance: ${this.getAmount(item.costInstance).toFixed(4)}`);
    }
    const cpuCost = this.getAmount(item?.costCpu);
    const memoryCost = this.getAmount(item?.costMem);
    const instanceCost = this.getAmount(item?.costInstance);
    return {
      name,
      description: `${source === 'tool' ? 'Tool' : 'Deployment'}: ${name}`,
      usage: usageParts.join(' | '),
      amount: this.getAmount(
        item?.total_cost ??
        item?.totalCost ??
        item?.projected_total ??
        item?.projectedCost ??
        item?.cost ??
        item?.amount ??
        item?.charge ??
        item?.costCpu ??
        item?.costMem ??
        item?.costInstance,
      ),
      source,
      currency: item?.currency || 'USD',
      uptimeHours: `${uptimeHours.toFixed(2)}h`,
      instanceCost,
      cpuCost,
      memoryCost
    };
  }

  private inferServiceSource(item: any, name: string): 'deployment' | 'tool' {
    const hint = `${item?.source || ''} ${item?.service_type || ''} ${item?.type || ''} ${name}`.toLowerCase();
    if (item?.toolId || item?.tool_id || hint.includes('tool')) {
      return 'tool';
    }
    if (item?.deploymentId || item?.deployment_id || hint.includes('deployment')) {
      return 'deployment';
    }
    return hint.includes('tool') ? 'tool' : 'deployment';
  }

  private buildNameMap(items: any[], idKeys: string[], nameKeys: string[]): Record<string, string> {
    const list = Array.isArray(items) ? items : [];
    return list.reduce((acc: Record<string, string>, item: any) => {
      const id = idKeys.map((key) => item?.[key]).find((value) => value !== undefined && value !== null);
      const name = nameKeys.map((key) => item?.[key]).find((value) => typeof value === 'string' && value.trim());
      if (id !== undefined && id !== null && name) {
        acc[String(id)] = name;
      }
      return acc;
    }, {});
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
