import { CommonModule } from '@angular/common';
import { Component, HostListener, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { PricingsService } from '../pricing.service';
import { SharedService } from '../../../shared/services/shared.service';
import { ProjectsService } from '../../projects/projects.service';
import { BillServiceRow, ScopeOption, InvoiceRow } from '../../../core/models/company-billing-info.model';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';

type BillTab = 'service' | 'llm';

interface MonthOption {
  value: number;
  label: string;
}

@Component({
  selector: 'app-bills',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bills.component.html',
  styleUrl: './bills.component.scss',
  providers: [PricingsService]
})
export class BillsComponent implements OnInit, OnChanges {
  billRows: BillServiceRow[] = [];
  billLoading = false;
  activeBillTab: BillTab = 'service';
  billServiceFilter = '';
  billTaxFilter = '';
  selectedMonth = this.getPreviousMonthValue();
  private getPreviousMonthValue(): string {
    const now = new Date();
    let year = now.getFullYear();
    let month = now.getMonth(); // getMonth() is 0-based, so this is previous month
    if (month === 0) {
      month = 12;
      year -= 1;
    }
    return `${year}-${String(month).padStart(2, '0')}`;
  }
  monthlyInvoiceData: InvoiceRow | null = null;
  billServiceTypeFilter = 'All services';

  @Input() invoiceList: InvoiceRow[] = [];

  projectOptions: ScopeOption[] = [{ id: 'all', name: 'All projects' }];
  environmentOptions: ScopeOption[] = [{ id: 'all', name: 'All environments' }];
  selectedProjectId = 'all';
  selectedEnvironmentId = 'all';

  monthPickerOpen = false;
  monthPickerMonth = new Date().getMonth() + 1;
  monthPickerYear = new Date().getFullYear();

  readonly monthOptions: Array<MonthOption> = [
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
  lastChargedDate: Date | null = null;

  billLimit = 10;
  billOffset = 0;
  billTotalRecords = 0;
  readonly pageSizeOptions = [10, 20, 50, 100];
  llmIntegrationRows: BillServiceRow[] = [];

  // Get all LLM-related billing rows
  get llmCostRows(): BillServiceRow[] {
    return this.billRows.filter(row => row.source === 'llm');
  }

  // Get filtered LLM billing rows by search query
  get filteredLlmCostRows(): BillServiceRow[] {
    const query = (this.billServiceFilter || '').trim().toLowerCase();
    return this.llmCostRows.filter(row =>
      `${row.description} ${row.usage}`.toLowerCase().includes(query)
    );
  }

  // Paginate filtered LLM cost rows
  get paginatedLlmCostRows(): BillServiceRow[] {
    const start = this.billOffset;
    const end = start + this.billLimit;
    return this.filteredLlmCostRows.slice(start, end);
  }

  // LLM tab: page range label
  get llmPageRangeLabel(): string {
    if (!this.filteredLlmCostRows.length) {
      return '0-0 of 0';
    }
    const start = this.billOffset + 1;
    const end = Math.min(this.billOffset + this.billLimit, this.filteredLlmCostRows.length);
    return `${start}-${end} of ${this.filteredLlmCostRows.length}`;
  }

  // LLM tab: total pages
  get llmTotalPages(): number {
    if (!this.filteredLlmCostRows.length) {
      return 1;
    }
    return Math.max(1, Math.ceil(this.filteredLlmCostRows.length / this.billLimit));
  }

  // LLM tab: current page
  get llmCurrentPage(): number {
    return Math.floor(this.billOffset / this.billLimit) + 1;
  }

  constructor(
    private http: PricingsService,
    private sharedService: SharedService,
    private projectsService: ProjectsService
  ) { }
  // LLM cost and count helpers
  get llmServiceCount(): number {
    return this.monthBillRows.filter((row) => row.source === 'llm').length;
  }

  get llmServiceCostTotal(): number {
    return this.monthBillRows
      .filter((row) => row.source === 'llm')
      .reduce((sum, row) => sum + this.getAmount(row.amount), 0);
  }
  // Holds all bill rows for the selected month (unfiltered by scope)
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

  get isCurrentMonthSelected(): boolean {
    return this.selectedMonth === this.getCurrentMonthValue();
  }

  get billChargesTotal(): number {
    if (this.isCurrentMonthSelected) {
      return this.monthScopedBillRows.reduce((sum, row) => sum + this.getAmount(row.amount), 0);
    }
    return this.getAmount(this.monthlyInvoiceData?.subtotal || 0);
  }

  get billTaxesTotal(): number {
    if (this.isCurrentMonthSelected) {
      return 0;
    }
    return this.getAmount(this.monthlyInvoiceData?.tax_amount || 0);
  }

  get billCreditsApplied(): number {
    if (this.isCurrentMonthSelected) {
      return 0;
    }
    return this.getAmount(this.monthlyInvoiceData?.credit_applied || 0);
  }

  get billOutstandingAmount(): number {
    if (this.isCurrentMonthSelected) {
      return 0;
    }
    if (!this.monthlyInvoiceData) {
      return 0;
    }
    const status = (this.monthlyInvoiceData?.status || '').toLowerCase();
    if (status === 'paid') {
      return 0;
    }
    // Add LLM cost to outstanding
    return this.getAmount(this.monthlyInvoiceData?.total || 0) + this.llmServiceCostTotal;
  }

  get billTotalDue(): number {
    if (this.isCurrentMonthSelected) {
      return 0;
    }
    return this.billOutstandingAmount;
  }

  get billPeriodLabel(): string {
    const [yearText, monthText] = (this.selectedMonth || '').split('-');
    const year = Number(yearText);
    const month = Number(monthText);
    if (!year || !month) {
      return '--';
    }

    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);

    const startLabel = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endLabel = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${startLabel} - ${endLabel}`;
  }

  get billingPeriodEndDateLabel(): string {
    const [yearText, monthText] = (this.selectedMonth || '').split('-');
    const year = Number(yearText);
    const month = Number(monthText);
    if (!year || !month) {
      return '--';
    }

    let prevMonth = month - 1;
    let prevYear = year;
    if (prevMonth < 1) {
      prevMonth = 12;
      prevYear = year - 1;
    }

    const end = new Date(prevYear, prevMonth, 0);
    return end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  get lastChargedDateLabel(): string {
    if (!this.lastChargedDate) {
      return '--';
    }
    return this.lastChargedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
  monthBillRows: BillServiceRow[] = [];

  // Filters monthBillRows by current scope and sets billRows for the table
  // filterBillRowsByScope(): void {
  //   let filtered = this.monthBillRows;
  //   if (this.selectedProjectId && this.selectedProjectId !== 'all') {
  //     filtered = filtered.filter(row => row.projectId === this.selectedProjectId);
  //   }
  //   if (this.selectedEnvironmentId && this.selectedEnvironmentId !== 'all') {
  //     filtered = filtered.filter(row => row.environmentId === this.selectedEnvironmentId);
  //   }
  //   this.billRows = filtered;
  // }
  get deploymentServiceCount(): number {
    return this.monthBillRows.filter(
      (row) => row.source === 'application' && this.getBillRowUptimeHours(row) > 0
    ).length;
  }

  get toolServiceCount(): number {
    return this.monthBillRows.filter(
      (row) => row.source !== 'application' && this.getBillRowUptimeHours(row) > 0
    ).length;
  }

  get toolServiceCostTotal(): number {
    return this.monthBillRows
      .filter((row) => row.source === 'tool')
      .reduce((sum, row) => sum + this.getAmount(row.amount), 0);
  }

  get deploymentServiceCostTotal(): number {
    return this.monthBillRows
      .filter((row) => row.source === 'application')
      .reduce((sum, row) => sum + this.getAmount(row.amount), 0);
  }

  get totalBillableServicesCount(): number {
    return this.deploymentServiceCount + this.toolServiceCount + this.llmServiceCount;
  }

  get monthScopedBillRows(): BillServiceRow[] {
    // Use monthBillRows for summary, not affected by scope filters
    return this.monthBillRows.filter((row) => this.getBillRowUptimeHours(row) > 0);
  }

  get filteredBillRows(): BillServiceRow[] {
    const query = (this.billServiceFilter || '').trim().toLowerCase();
    const typeFilter = (this.billServiceTypeFilter || 'All services').toLowerCase();
    let rowsWithUptime = this.billRows.filter((row) => this.getBillRowUptimeHours(row) > 0);
    if (typeFilter !== 'all services') {
      rowsWithUptime = rowsWithUptime.filter(row =>
        (typeFilter === 'application' && row.source === 'application') ||
        (typeFilter === 'tool' && row.source === 'tool')
      );
    }
    if (!query) {
      return rowsWithUptime;
    }
    return rowsWithUptime.filter((row) =>
      `${row.description} ${row.usage}`.toLowerCase().includes(query)
    );
  }

  get paginatedBillRows(): BillServiceRow[] {
    const start = this.billOffset;
    const end = start + this.billLimit;
    return this.filteredBillRows.slice(start, end);
  }

  get billCurrentPage(): number {
    return Math.floor(this.billOffset / this.billLimit) + 1;
  }

  get billTotalPages(): number {
    if (!this.filteredBillRows.length) {
      return 1;
    }
    return Math.max(1, Math.ceil(this.filteredBillRows.length / this.billLimit));
  }

  get billPageRangeLabel(): string {
    if (!this.filteredBillRows.length) {
      return '0-0 of 0';
    }
    const start = this.billOffset + 1;
    const end = Math.min(this.billOffset + this.billLimit, this.filteredBillRows.length);
    return `${start}-${end} of ${this.filteredBillRows.length}`;
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

  get yearOptions(): number[] {
    const currentYear = new Date().getFullYear();
    const years: number[] = [];
    for (let year = currentYear; year >= 2000; year -= 1) {
      years.push(year);
    }
    return years;
  }

  ngOnInit(): void {
    this.selectedMonth = this.getPreviousMonthValue();
    this.syncMonthPickerFromSelected();
    this.applyMonthSelection(this.selectedMonth);

    this.initializeScopeFilters();
    this.loadBillServiceCharges();
    this.loadMonthlyInvoiceData();

    this.sharedService.currencyChange$.subscribe(() => {
      this.billRows = Array.isArray(this.billRows) ? [...this.billRows] : this.billRows;
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['invoiceList']) {
      this.loadMonthlyInvoiceData();
    }
  }

  switchBillTab(tab: BillTab): void {
    this.activeBillTab = tab;
  }

  onProjectScopeChange(value: string): void {
    this.selectedProjectId = value || 'all';
    this.selectedEnvironmentId = 'all';
    this.billOffset = 0;
    this.loadEnvironmentOptionsByProject(this.selectedProjectId);
    this.loadBillServiceCharges();
    // Do NOT call loadMonthlyInvoiceData here; summary grid should not update on scope change
  }

  onEnvironmentScopeChange(value: string): void {
    this.selectedEnvironmentId = value || 'all';
    this.billOffset = 0;
    this.loadBillServiceCharges();
    // Do NOT call loadMonthlyInvoiceData here; summary grid should not update on scope change
  }

  onBillItemsPerPageChange(value: string): void {
    const pageSize = Number(value);
    if (!Number.isFinite(pageSize) || pageSize <= 0 || pageSize === this.billLimit) {
      return;
    }
    this.billLimit = pageSize;
    this.billOffset = 0;
  }

  billPreviousPage(): void {
    if (this.billCurrentPage <= 1) {
      return;
    }
    this.billOffset = Math.max(0, this.billOffset - this.billLimit);
  }

  billNextPage(): void {
    if (this.billCurrentPage >= this.billTotalPages) {
      return;
    }
    this.billOffset = this.billOffset + this.billLimit;
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
    this.loadBillServiceCharges();
    this.loadMonthlyInvoiceData();
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

  isMonthDisabled(month: number): boolean {
    const now = new Date();
    return this.monthPickerYear === now.getFullYear() && month > now.getMonth() + 1;
  }

  refreshBills(): void {
    this.selectedMonth = this.getPreviousMonthValue();
    this.syncMonthPickerFromSelected();
    this.applyMonthSelection(this.selectedMonth);
    this.billOffset = 0;
    this.loadBillServiceCharges();
    this.loadMonthlyInvoiceData();
  }

  private getCurrentMonthValue(): string {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${now.getFullYear()}-${month}`;
  }

  private applyMonthSelection(value: string): void {
    const [yearText, monthText] = value.split('-');
    const year = Number(yearText);
    const month = Number(monthText);
    if (!year || !month) {
      return;
    }
    const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
    const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
    this.startDate = this.formatDateAsUtcTimestamp(start);
    this.endDate = this.formatDateAsUtcTimestamp(end);
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

  private clampToAllowedMonth(year: number, month: number): { year: number; month: number } {
    const now = new Date();
    const normalizedYear = Math.min(Math.max(2000, year), now.getFullYear());
    const normalizedMonth = Math.min(Math.max(1, month), 12);
    if (normalizedYear === now.getFullYear() && normalizedMonth > now.getMonth() + 1) {
      return { year: normalizedYear, month: now.getMonth() + 1 };
    }
    return { year: normalizedYear, month: normalizedMonth };
  }

  private formatDateAsUtcTimestamp(date: Date): string {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    const seconds = String(date.getUTCSeconds()).padStart(2, '0');
    const milliseconds = String(date.getUTCMilliseconds()).padStart(3, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}Z`;
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

  private initializeScopeFilters(): void {
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
      this.projectsService.getAllProjects().subscribe({
        next: (res: any) => {
          const projects = Array.isArray(res?.data) ? res.data : [];
          if (!projects.length) {
            this.environmentOptions = [{ id: 'all', name: 'All environments' }];
            this.selectedEnvironmentId = 'all';
            this.loadBillServiceCharges();
            return;
          }

          forkJoin(
            projects.map((project: any) =>
              this.projectsService.getAllEnvironmentsByProject(String(project.id)).pipe(
                catchError(() => of({ data: [] }))
              )
            )
          ).subscribe({
            next: (envResponses: any) => {
              const envMap = new Map<string, string>();
              (envResponses as any[]).forEach((envResponse: any) => {
                const envs = Array.isArray(envResponse?.data) ? envResponse.data : [];
                envs.forEach((env: any) => {
                  const envId = String(env.id);
                  envMap.set(envId, env.name || envId);
                });
              });

              this.environmentOptions = [
                { id: 'all', name: 'All environments' },
                ...Array.from(envMap.entries()).map(([id, name]) => ({ id, name }))
              ];

              if (
                this.selectedEnvironmentId === 'all' ||
                !this.environmentOptions.some((env) => env.id === this.selectedEnvironmentId)
              ) {
                // this.selectedEnvironmentId = this.getDefaultEnvironmentId(this.environmentOptions);
              }
              this.loadBillServiceCharges();
            },
            error: () => {
              this.environmentOptions = [{ id: 'all', name: 'All environments' }];
              this.selectedEnvironmentId = 'all';
              this.loadBillServiceCharges();
            }
          });
        },
        error: () => {
          this.environmentOptions = [{ id: 'all', name: 'All environments' }];
          this.selectedEnvironmentId = 'all';
          this.loadBillServiceCharges();
        }
      });
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

        this.loadBillServiceCharges();
      },
      error: () => {
        this.environmentOptions = [{ id: 'all', name: 'All environments' }];
        this.selectedEnvironmentId = 'all';
        this.loadBillServiceCharges();
      }
    });
  }

  private getDefaultEnvironmentId(options: ScopeOption[]): string {
    const firstSpecific = options.find((env) => env.id !== 'all');
    return firstSpecific?.id || 'all';
  }

  private loadBillServiceCharges(): void {
    const accountId = localStorage.getItem('accountId') || this.sharedService.getUser()?.id || '';
    if (!accountId) {
      this.monthBillRows = [];
      this.billRows = [];
      this.billLoading = false;
      return;
    }
    this.billLoading = true;

    // Always fetch full month data (no project/environment filter)
    this.http.getCostByService(
      accountId,
      this.startDate,
      this.endDate
    ).pipe(
      catchError(() => of({ data: [] }))
    ).subscribe({
      next: (response: any) => {
        const items = this.extractCostByServiceItems(response);
        const rows: BillServiceRow[] = items.map((item: any) =>
          this.mapCostByServiceItem(item)
        );
        this.monthBillRows = rows;
        this.billRows = rows;
        this.billLoading = false;
      },
      error: () => {
        this.monthBillRows = [];
        this.billRows = [];
        this.billLoading = false;
      }
    });
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
  ): BillServiceRow {

    // const deploymentDisplayName = item?.deployment?.name;
    // const toolDisplayName = item?.tool?.name;
    // const defaultName = 'Unnamed service';
    const source = item?.deploymentType === 'tool' ? 'tool' : 'application';
    const name = item.name ? String(item.name) : item?.deploymentId;
    const instanceType = item?.instanceType;
    const usageValue = item?.usage ?? item?.usageQuantity ?? item?.quantity;
    const uptimeHours = this.getAmount(item?.uptimeHours ?? item?.uptime_hours);
    const usageParts = [];
    if (instanceType) {
      usageParts.push(String(instanceType));
    }
    if (usageValue !== undefined && usageValue !== null && usageValue !== '') {
      usageParts.push(`usage: ${usageValue}`);
    }
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
    const cpu = item?.cpu;
    const memory = item?.memory;
    return {
      name,
      description: `${source === 'tool' ? 'Tool' : 'Application'}: ${name}`,
      usage: usageParts.join(' | '),
      amount: this.getAmount(
        item?.cost ??
        item?.costCpu ??
        item?.costMem ??
        item?.costInstance,
      ),
      source,
      currency: item?.currency || 'USD',
      uptimeHours: `${uptimeHours.toFixed(2)}h`,
      instanceCost,
      instanceType,
      cpuCost,
      memoryCost,
      cpu,
      memory
    };
  }

  private loadMonthlyInvoiceData(): void {
    if (this.isCurrentMonthSelected) {
      this.monthlyInvoiceData = null;
      return;
    }

    const invoices = Array.isArray(this.invoiceList) ? this.invoiceList : [];

    if (!invoices.length) {
      this.monthlyInvoiceData = null;
      return;
    }

    const [selectedYear, selectedMonth] = (this.selectedMonth || '').split('-');
    const selectedMonthNum = Number(selectedMonth);
    const selectedYearNum = Number(selectedYear);

    if (!selectedMonthNum || !selectedYearNum) {
      this.monthlyInvoiceData = null;
      return;
    }

    const monthInvoice = invoices.find((invoice: InvoiceRow) => {
      const dateStr = invoice?.issued_at || invoice?.period;
      if (!dateStr) {
        return false;
      }

      const invoiceDate = new Date(dateStr as string);

      if (isNaN(invoiceDate.getTime())) {
        return false;
      }

      return invoiceDate.getFullYear() === selectedYearNum &&
        invoiceDate.getMonth() + 1 === selectedMonthNum;
    });

    this.monthlyInvoiceData = monthInvoice || null;
  }
  onBillServiceTypeFilterChange(value: string): void {
    this.billServiceTypeFilter = value;
  }
}
