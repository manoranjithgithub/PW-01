import { AfterViewChecked, Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardBodyComponent, CardComponent, CardGroupComponent } from '@coreui/angular';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { HighlightPipe } from '../../../shared/pipes/highlight.pipe';
import { ActivatedRoute } from '@angular/router';
import { DeploymentsService } from '../deployment.service';

@Component({
  selector: 'app-deployment-observability',
  standalone: true,
  imports: [CommonModule, CardGroupComponent, CardComponent, CardBodyComponent, ReactiveFormsModule,
    MatSelectModule,
    MatFormFieldModule, FormsModule,
    MatCheckboxModule, HighlightPipe],
  providers: [DeploymentsService],
  templateUrl: './deployment-observability.component.html',
  styleUrl: './deployment-observability.component.scss'
})
export class DeploymentObservabilityComponent implements OnInit {
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
    { label: 'IST (Asia/Kolkata)', value: 'IST'},
    { label: 'UTC', value: 'UTC' },
    { label: 'PST (America/Los_Angeles)', value: 'PST' },
    { label: 'EST (America/New_York)', value: 'EST' },
    { label: 'CET (Europe/Paris)', value: 'CET' }
  ];
  deploymentLogs: any;
  isAutoRefresh: boolean = false;
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

    this.filterForm.get('duration')?.valueChanges.subscribe(value => {
      if (value !== 'custom') {
        this.filterForm.patchValue({
          fromTimestamp: fromTimestamp,
          toTimestamp: toTimestamp
        });
      }
    });

    this.getApplicationLogs(this.deploymentId, '15m');

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

  // ngAfterViewChecked() {
  //   this.scrollToBottom();
  // }

  scrollToBottom(): void {
    const container = document.getElementById('logContainer');
    if (container)
      container.scrollTop = container.scrollHeight;
  }

  getApplicationLogs(deploymentId: string, duration?: string) {
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

    this.deploymentService.getSelectedDeploymentLogs(req).subscribe(
      (response: any) => {
        if (response.status.toLowerCase() === 'success') {
          this.deploymentLogs = response.data;
          if (!this.deploymentLogs.logs || this.deploymentLogs.logs.length === 0) {
            console.warn('No logs available for this deployment.');
            return;
          }
          this.parsedLogs = this.deploymentLogs.logs.map((log: string) => {
            const [timestamp, ...messageParts] = log.split(' ');
            return { timestamp, message: messageParts.join(' ') };
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
        if (response.status.toLowerCase() === 'success') {
          this.deploymentLogs = response.data;
          if (!this.deploymentLogs.logs || this.deploymentLogs.logs.length === 0) {
            console.warn('No logs available for this deployment.');
            this.filteredLogs = [];
            this.parsedLogs = [];
            return;
          }
          this.parsedLogs = this.deploymentLogs.logs.map((log: string) => {
            const [timestamp, ...messageParts] = log.split(' ');
            return { timestamp, message: messageParts.join(' ') };
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
    this.itemsPerPage = event.target.value;
    this.currentPage = 1;
    this.getApplicationLogs(this.deploymentId);
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

}
