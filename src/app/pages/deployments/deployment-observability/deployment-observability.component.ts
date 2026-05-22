import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardBodyComponent, CardComponent, CardGroupComponent } from '@coreui/angular';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { HighlightPipe } from '../../../shared/pipes/highlight.pipe';
import { ActivatedRoute } from '@angular/router';
import { DeploymentsService } from '../deployment.service';
import { DateRangePickerComponent } from '../../../shared/components/date-range-picker/date-range-picker.component';

@Component({
  selector: 'app-deployment-observability',
  standalone: true,
  imports: [CommonModule, CardGroupComponent, CardComponent, CardBodyComponent, ReactiveFormsModule,
    MatSelectModule,
    MatFormFieldModule, FormsModule,
    MatCheckboxModule, HighlightPipe, DateRangePickerComponent],
  providers: [DeploymentsService],
  templateUrl: './deployment-observability.component.html',
  styleUrl: './deployment-observability.component.scss'
})
export class DeploymentObservabilityComponent implements OnInit, OnDestroy {
  isLightMode: boolean = false;
  parsedLogs: { timestamp: string; message: string }[] = [];
  filteredLogs: any[] = [];
  filterForm!: FormGroup;
  durations = [
    { label: 'Last 15 mins', value: '15m' },
    { label: 'Last 30 mins', value: '30m' },
    { label: 'Last 1 hour', value: '1h' },
    { label: 'Past 1 day', value: '1d' },
    { label: 'Past 7 days', value: '7d' },
    { label: 'Past 1 month', value: '30d' },
    { label: 'Custom', value: 'custom' }
  ];
  timeZones = [
    { label: 'IST (Asia/Kolkata)', value: 'IST' },
    { label: 'UTC', value: 'UTC' },
    { label: 'PST (America/Los_Angeles)', value: 'PST' },
    { label: 'EST (America/New_York)', value: 'EST' },
    { label: 'CET (Europe/Paris)', value: 'CET' }
  ];
  deploymentLogs: any;
  isAutoRefresh: boolean = false;
  refreshIntervals = [
    { label: 'Off', value: 0 },
    { label: '10s', value: 10000 },
    { label: '30s', value: 30000 },
    { label: '1m', value: 60000 }
  ];
  selectedRefreshInterval = 30000;
  private refreshTimer: ReturnType<typeof setInterval> | null = null;
  deploymentId: any;
  pageSizes: number[] = [200, 250, 300];
  itemsPerPage: number = 300;
  currentPage = 1;
  pageSize = 300;
  totalItems: number = 0;
  maxSize = 5;
  @Input() appName: string = '';

  constructor(private fb: FormBuilder, private activateRoute: ActivatedRoute, private deploymentService: DeploymentsService) {
  }

  ngOnInit() {
    this.activateRoute.queryParams.subscribe(params => {
      if (params['id'] != undefined) {
        this.deploymentId = params['id'];
      }
    });
    const now = new Date();
    const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60000); // 15 minutes in ms

    const fromTimestamp = this.formatDateForDatetimeLocal(fifteenMinutesAgo);
    const toTimestamp = this.formatDateForDatetimeLocal(now);

    this.filterForm = this.fb.group({
      searchText: [''],
      duration: ['15m'],
      fromTimestamp: [fromTimestamp],
      toTimestamp: [toTimestamp],
      timeZone: ['IST']
    });

    this.getApplicationLogs(this.deploymentId, '15m');
    this.startAutoRefresh();

    this.filterForm.get('searchText')?.valueChanges.subscribe(search => {
      const keyword = (search || '').toLowerCase();
      this.filteredLogs = this.parsedLogs.filter(log =>
        log.message.toLowerCase().includes(keyword)
      );
    }
    );

  }


  private formatDateForDatetimeLocal(date: Date): string {
    const pad = (n: number) => n < 10 ? '0' + n : n;
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  private getTimezoneOffset(tz: string): string {
    const map: { [key: string]: string } = {
      'IST': '+05:30',
      'UTC': '+00:00',
      'PST': '-08:00',
      'EST': '-05:00',
      'CET': '+01:00'
    };
    return map[tz] || '+05:30';
  }

  private getIanaTimeZone(tz: string): string {
    const map: { [key: string]: string } = {
      'IST': 'Asia/Kolkata',
      'UTC': 'UTC',
      'PST': 'America/Los_Angeles',
      'EST': 'America/New_York',
      'CET': 'Europe/Paris'
    };
    return map[tz] || 'Asia/Kolkata';
  }

  private convertTimestampToTZ(timestamp: string, tzLabel: string): string {
    if (!timestamp) return '';
    let date: Date | null = null;
    const numeric = /^\d+$/.test(timestamp);
    if (numeric) {
      if (timestamp.length <= 10) {
        date = new Date(parseInt(timestamp, 10) * 1000);
      } else {
        date = new Date(parseInt(timestamp, 10));
      }
    } else {
      date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        const iso = timestamp.replace(' ', 'T') + 'Z';
        date = new Date(iso);
      }
    }
    if (!date || isNaN(date.getTime())) return timestamp;

    const iana = this.getIanaTimeZone(tzLabel || 'IST');
    try {
      const opts: any = { timeZone: iana, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
      const parts = new Intl.DateTimeFormat('en-US', opts).formatToParts(date);
      const map: any = {};
      parts.forEach((p: any) => map[p.type] = p.value);
      const formatted = `${map.year}-${map.month}-${map.day} ${map.hour}:${map.minute}:${map.second} ${tzLabel}`;
      return formatted;
    } catch (e) {
      return timestamp;
    }
  }
  scrollToBottom(): void {
    const container = document.getElementById('logContainer');
    if (container)
      container.scrollTop = container.scrollHeight;
  }

  getApplicationLogs(deploymentId: string, duration?: string, skipLoader = false) {
    const environmentStr = localStorage.getItem('environment');
    const environmentId = environmentStr ? JSON.parse(environmentStr).id : '';
    const timeZone = this.getTimezoneOffset(this.filterForm.value.timeZone || 'IST');
    const fromDate = new Date(this.filterForm.value.fromTimestamp + ":00");
    const toDate = new Date(this.filterForm.value.toTimestamp + ":00");

    const req = {
      environmentId: environmentId,
      logType: 'application',
      name: this.appName,
      page: this.currentPage,
      limit: this.pageSize,
      timeRange: duration,
      keyword: "",
      fromTimestamp: this.filterForm.value.fromTimestamp ? fromDate : '',
      toTimestamp: this.filterForm.value.toTimestamp ? toDate : '',
      timeZone: timeZone
    };

    this.deploymentService.getSelectedDeploymentLogs(req, { skipLoader }).subscribe(
      (response: any) => {
        if (response.status.toLowerCase() === 'success') {
          this.deploymentLogs = response.data;
          if (!this.deploymentLogs.logs || this.deploymentLogs.logs.length === 0) {
            console.warn('No logs available for this deployment.');
            return;
          }
          const tzLabel = this.filterForm?.value?.timeZone || 'IST';
          this.parsedLogs = this.deploymentLogs.logs.map((log: string) => {
            const [timestamp, ...messageParts] = log.split(' ');
            const converted = this.convertTimestampToTZ(timestamp, tzLabel);
            return { timestamp: converted, message: messageParts.join(' ') };
          });
          this.filteredLogs = [...this.parsedLogs];
          this.totalItems = this.deploymentLogs.totalPages;
        } else {
          console.error('Failed to fetch logs:', response.message);
        }
      },
      (error: any) => {
        console.error('Error fetching logs:', error);
      }
    );
  }

  toggleMode(event: Event) {
    this.isLightMode = !this.isLightMode;
  }

  onFilter(): void {
    const filterValues = this.filterForm.value;

    let duration: string | undefined = '';
    let keyword: string | undefined = '';
    if (filterValues.searchText) {
      keyword = filterValues.searchText;
    }
    if (filterValues.duration && filterValues.duration !== 'custom') {
      duration = filterValues.duration;
    }

    const environmentStr = localStorage.getItem('environment');
    const environmentId = environmentStr ? JSON.parse(environmentStr).id : '';
    const timeZone = this.getTimezoneOffset(this.filterForm.value.timeZone || 'IST');
    const fromDate = new Date(this.filterForm.value.fromTimestamp + ":00");
    const toDate = new Date(this.filterForm.value.toTimestamp + ":00");
    const req = {
      environmentId: environmentId,
      logType: 'application',
      name: this.appName,
      page: this.currentPage,
      limit: this.pageSize,
      timeRange: duration,
      keyword: keyword,
      fromTimestamp: this.filterForm.value.fromTimestamp ? fromDate : '',
      toTimestamp: this.filterForm.value.toTimestamp ? toDate : '',
      timeZone: timeZone,
    };

    this.deploymentService.getSelectedDeploymentLogs(req).subscribe(
      (response: any) => {
        if (response.status.toLowerCase() === 'success') {
          this.deploymentLogs = response.data;
          if (!this.deploymentLogs.logs || this.deploymentLogs.logs.length === 0) {
            console.warn('No logs available for this deployment.');
            this.filteredLogs = [];
            this.parsedLogs = [];
            return;
          }
          const tzLabel = this.filterForm?.value?.timeZone || 'IST';
          this.parsedLogs = this.deploymentLogs.logs.map((log: string) => {
            const [timestamp, ...messageParts] = log.split(' ');
            const converted = this.convertTimestampToTZ(timestamp, tzLabel);
            return { timestamp: converted, message: messageParts.join(' ') };
          });
          this.filteredLogs = [...this.parsedLogs];
          this.totalItems = this.deploymentLogs.totalPages;
        } else {
          console.error('Failed to fetch logs:', response.message);
        }
      },
      (error: any) => {
        console.error('Error fetching logs:', error);
      }
    );
  }

  onRefresh(): void {
    this.onFilter();
  }

  onRefreshIntervalChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectedRefreshInterval = Number(select.value);

    if (!this.selectedRefreshInterval) {
      this.clearAutoRefresh();
      this.getApplicationLogs(this.deploymentId, this.getAutoRefreshTimeRange());
      return;
    }

    this.getApplicationLogs(this.deploymentId, this.getAutoRefreshTimeRange());
    this.startAutoRefresh();
  }

  private startAutoRefresh(): void {
    this.clearAutoRefresh();
    if (!this.selectedRefreshInterval) return;

    this.refreshTimer = setInterval(() => {
      this.getApplicationLogs(this.deploymentId, this.getAutoRefreshTimeRange(), true);
    }, this.selectedRefreshInterval);
  }

  private clearAutoRefresh(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  private getAutoRefreshTimeRange(): string | undefined {
    const duration = this.filterForm?.value?.duration;
    return duration && duration !== 'custom' ? duration : undefined;
  }

  onDurationSelect(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const value = select.value;

    this.filterForm.get('duration')?.setValue(value);
    this.currentPage = 1;

    if (value !== 'custom') {
      const toTimestamp = new Date();
      const fromTimestamp = this.getRangeStart(value, toTimestamp);
      this.filterForm.patchValue({
        fromTimestamp: this.formatDateForDatetimeLocal(fromTimestamp),
        toTimestamp: this.formatDateForDatetimeLocal(toTimestamp)
      }, { emitEvent: false });
      this.onFilter();
    }
  }

  onCustomRangeApplied(event: { fromTimestamp: string; toTimestamp: string }): void {
    this.filterForm.patchValue({
      fromTimestamp: this.normalizeCustomPickerTimestamp(event.fromTimestamp),
      toTimestamp: this.normalizeCustomPickerTimestamp(event.toTimestamp)
    });
    this.currentPage = 1;
    this.onFilter();
  }

  private normalizeCustomPickerTimestamp(value: string): string {
    if (!value) return value;

    const date = new Date(`${value}:00`);
    if (isNaN(date.getTime())) return value;

    const localWallClockDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
    return this.formatDateForDatetimeLocal(localWallClockDate);
  }

  onTimeZoneSelect(): void {
    this.currentPage = 1;
    this.onFilter();
  }

  toggleAutoRefresh(event: Event) {
    this.isAutoRefresh = !this.isAutoRefresh;
  }

  scrollToTop(): void {
    const container = document.getElementById('logContainer');
    if (container)
      container.scrollTop = 0;
  }
  onPageChange(page: number) {
    this.currentPage = page;
    this.getApplicationLogs(this.deploymentId);
  }
  onChangePageSize(event: any) {
    this.itemsPerPage = Number(event.target.value);
    this.pageSize = Number(event.target.value);
    this.currentPage = 1;
    this.getApplicationLogs(this.deploymentId);
  }

  private getRangeStart(duration: string, toDate: Date): Date {
    switch (duration) {
      case '15m': return new Date(toDate.getTime() - 15 * 60000);
      case '30m': return new Date(toDate.getTime() - 30 * 60000);
      case '1h': return new Date(toDate.getTime() - 60 * 60000);
      case '1d': return new Date(toDate.getTime() - 24 * 60 * 60000);
      case '7d': return new Date(toDate.getTime() - 7 * 24 * 60 * 60000);
      case '30d': return new Date(toDate.getTime() - 30 * 24 * 60 * 60000);
      default: return new Date(toDate.getTime() - 15 * 60000);
    }
  }

  get pages(): number[] {
    const total = this.totalItems;
    const max = this.maxSize;
    const current = this.currentPage;

    let start = Math.max(current - Math.floor(max / 2), 1);
    let end = start + max - 1;

    if (end > total) {
      end = total;
      start = Math.max(end - max + 1, 1);
    }

    const pages: number[] = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }
  getLogClass(message: string): string {
    const msg = message.toLowerCase();

    if (msg.includes('error') || msg.includes('failed')) return 'log-error';
    if (msg.includes('warn')) return 'log-warn';
    if (msg.includes('debug')) return 'log-debug';
    if (msg.includes('done') || msg.includes('success')) return 'log-success';
    if (msg.startsWith('#')) return 'log-step';

    return 'log-info';
  }

  onDownloadLogs(): void {
    const filterValues = this.filterForm.value;

    let duration: string | undefined = '';
    let fromTimestamp: string | undefined = '';
    let toTimestamp: string | undefined = '';
    let keyword: string | undefined = '';
    if (filterValues.searchText) {
      keyword = filterValues.searchText;
    }
    if (filterValues.duration && filterValues.duration !== 'custom') {
      duration = filterValues.duration;
    } else if (filterValues.duration === 'custom') {
      fromTimestamp = `${filterValues.fromTimestamp}:00Z`;
      toTimestamp = `${filterValues.toTimestamp}:00Z`;
    }

    const environmentStr = localStorage.getItem('environment');
    const environmentId = environmentStr ? JSON.parse(environmentStr).id : '';
    const timeZone = this.getTimezoneOffset(this.filterForm.value.timeZone || 'IST');
    const fromDate = new Date(this.filterForm.value.fromTimestamp + ":00");
    const toDate = new Date(this.filterForm.value.toTimestamp + ":00");
    const req = {
      environmentId: environmentId,
      logType: 'application',
      name: this.appName,
      page: this.currentPage,
      limit: this.pageSize,
      timeRange: duration,
      keyword: keyword,
      fromTimestamp: this.filterForm.value.fromTimestamp ? fromDate : '',
      toTimestamp: this.filterForm.value.toTimestamp ? toDate : '',
      timeZone: timeZone,
    };

    this.deploymentService.getSelectedDeploymentLogs(req).subscribe(
      (response: any) => {
        if (response.status.toLowerCase() === 'success' && response.data.logs && response.data.logs.length > 0) {
          const content = response.data.logs
            .map((log: any) => log)
            .join('\n');

          const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
          const link = document.createElement('a');

          link.href = URL.createObjectURL(blob);
          link.download = 'app-logs.txt';
          link.click();

          URL.revokeObjectURL(link.href);
        }else{
          console.error('No logs available for download.');
        }
      },
      (error: any) => {
        console.error('Error fetching logs:', error);
      }
    );

  }

  ngOnDestroy(): void {
    this.clearAutoRefresh();
  }
}
