import { Component, ElementRef, ViewChild, HostListener, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCheckboxModule } from '@angular/material/checkbox';
import {
  Chart,
  LineElement,
  LineController,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  Title,
  TimeScale,
  Filler
} from 'chart.js';
import { DeploymentsService } from '../deployment.service';
import { ActivatedRoute } from '@angular/router';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import 'chartjs-adapter-date-fns';
import { SharedService } from '../../../shared/services/shared.service';
import { DURATIONS, INTERVALS, METRICS_REFRESH_INTERVALS } from '../../../shared/constants/nimbuz.constant';

Chart.register(LineElement, LineController, CategoryScale, LinearScale, PointElement, Tooltip, Legend, Title, TimeScale, Filler);

@Component({
  selector: 'app-deployment-metrics',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule,
    MatSelectModule,
    MatFormFieldModule,
    MatCheckboxModule, LoaderComponent],
  providers: [DeploymentsService],
  templateUrl: './deployment-metrics.component.html',
  styleUrl: './deployment-metrics.component.scss'
})
export class DeploymentMetricsComponent implements OnInit, AfterViewInit {
  @ViewChild('cpuChartCanvas', { static: false }) chartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('ramChartCanvas', { static: false }) ramChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('storageChartCanvas', { static: false }) storageChartRef!: ElementRef<HTMLCanvasElement>;

  dropdownOpen: boolean = false;
  selectedPods: string[] = [];
  deploymentId: string = '';

  cpuChart!: Chart<any>;
  ramChart!: Chart<any>;
  storageChart!: Chart<any>;
  cpuUsageData: any[] = [];
  ramUsageData: any[] = [];
  private pendingMetricsRequests = 0;

  filterForm!: FormGroup;
  podList: string[] = [];

  durations = DURATIONS;
  intervals = INTERVALS;
  chartEmptyText: string = 'No data to display';
  storageUsageData = METRICS_REFRESH_INTERVALS;

  showNoDataMessage: boolean = false;
  deploymentdetails: any;
  loading: boolean = false;
  instanceTypes: any = {};
  maxCpuLimit: number = 0;
  maxRamLimit: number = 0;
  ramUsagePercent: number = 0;
  cpuUsagePercent: number = 0;
  currentCpuLabel: string = '0';
  currentRamLabel: string = '0';
  deploymentInstanceType: string = '';

  constructor(private eRef: ElementRef, private fb: FormBuilder, private deploymentService: DeploymentsService,
    private activatedRoute: ActivatedRoute, private sharedService: SharedService) { }

  ngOnInit() {
    this.activatedRoute.queryParams.subscribe(params => {
      if (params['id'] != undefined) {
        this.deploymentId = params['id'];
      }
      this.deploymentService.getDeploymentById(this.deploymentId).subscribe((res: any) => {
        this.deploymentdetails = res.data;
        this.deploymentInstanceType = this.deploymentdetails?.application?.instanceType || '';
        this.computeMaxLimits();
      });
    });
    const now = new Date();
    const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60000); // 15 minutes in ms

    const fromTimestamp = this.formatDateForDatetimeLocal(fifteenMinutesAgo);
    const toTimestamp = this.formatDateForDatetimeLocal(now);

    this.filterForm = this.fb.group({
      pods: [this.podList || []],
      duration: ['15'],
      fromTimestamp: [fromTimestamp],
      toTimestamp: [toTimestamp],
      interval: ['5'],
    });

    this.filterForm.get('duration')?.valueChanges.subscribe(value => {
      const now = new Date();
      const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60000);
      const fromTimestamp = this.formatDateForDatetimeLocal(fifteenMinutesAgo);
      const toTimestamp = this.formatDateForDatetimeLocal(now);
      this.filterForm.patchValue({
        fromTimestamp: fromTimestamp,
        toTimestamp: toTimestamp
      });
    });
  }

  computeMaxLimits(): void {
    this.deploymentService.getInstanceTypes().subscribe((response: any) => {
      this.instanceTypes = response.data;
      const deploymentInstanceType = this.deploymentdetails?.application?.instanceType;

      if (!deploymentInstanceType) {
        console.warn('Instance type is null or undefined.');
        return;
      }

      const instanceTypeKey = this.instanceTypes.find((x: any) =>
        x.instanceType === deploymentInstanceType
      );

      if (instanceTypeKey) {
        this.maxCpuLimit = parseFloat(instanceTypeKey.cpuVcpu) * 1000; //show value in mCpu
        this.maxRamLimit = parseFloat(instanceTypeKey.memoryGb) * 1024; //show value in MiB
      }
      this.onFilter()
    });
  }

  private formatDateForDatetimeLocal(date: Date): string {
    const pad = (n: number) => n < 10 ? '0' + n : n;
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }


  ngAfterViewInit(): void {
    this.loading = true;
  }
  renderCpuChart(): void {
    if (!this.chartRef || !this.chartRef.nativeElement) {
      console.warn('chartRef not ready, retrying...');
      setTimeout(() => this.renderCpuChart(), 500);
      return;
    }
    if (this.cpuChart) this.cpuChart.destroy();

    const points = this.cpuUsageData.map(item => ({ x: this.parseTimestampToDate(item._id), y: Number(item.cpuAverage) || 0 }));
    if (points.length === 1) points.push({ x: new Date(points[0].x.getTime() + 1000), y: points[0].y });

    const timeConfig = this.getTimeScaleConfig();

    this.cpuChart = new Chart(this.chartRef.nativeElement, {
      type: 'line',
      data: {
        datasets: [
          {
            label: `CPU Usage (${this.formatCpuForLabel(this.average(points.map(p => p.y)))})`,
            data: points,
            borderColor: '#3da1ff',
            backgroundColor: 'rgba(61, 161, 255, 0.18)',
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 4,
            pointBackgroundColor: '#3da1ff',
            borderWidth: 3
          },
          {
            label: `Max CPU Limit (${this.maxCpuLimit} mCPU)` ,
            data: points.map(p => ({ x: p.x, y: this.maxCpuLimit })),
            borderColor: '#ff6b6b',
            borderWidth: 2,
            borderDash: [6, 6],
            pointRadius: 0,
            fill: false,
            parsing: false
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            align: 'start',
            labels: {
              usePointStyle: false,
              boxWidth: 20,
              boxHeight: 4,
              padding: 18,
              color: '#6b7a90',
              font: { size: 12 }
            }
          },
          title: { display: false },
          tooltip: {
            enabled: true,
            backgroundColor: '#ffffff',
            borderColor: '#e4e9f1',
            borderWidth: 1,
            titleColor: '#3b4a5a',
            bodyColor: '#111827',
            displayColors: false,
            padding: 10,
            filter: (ctx) => !String(ctx.dataset?.label || '').toLowerCase().includes('max'),
            callbacks: {
              title: (items) => {
                const x = items[0]?.parsed?.x;
                if (!x) return '';
                const d = new Date(x);
                const dateStr = d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
                const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                return `${dateStr} ${timeStr}`;
              },
              label: (ctx) => `CPU Usage: ${Number(ctx.parsed.y).toFixed(2)} mCPU`
            }
          }
        },
        interaction: { mode: 'index', intersect: false },
        scales: {
          x: {
            type: 'time',
            time: { tooltipFormat: 'PPpp', ...timeConfig },
            title: { display: false },
            ticks: {
              autoSkip: true,
              maxTicksLimit: 6,
              autoSkipPadding: 12,
              maxRotation: 0,
              minRotation: 0,
              color: '#7a889c',
              callback: (val: any) => {
                const d = new Date(val);
                const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const durationVal: any = this.filterForm?.get('duration')?.value;
                if (durationVal && Number(durationVal) <= 60) return timeStr;
                const dateStr = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
                return `${dateStr} ${timeStr}`;
              }
            },
            grid: { color: 'rgba(15, 23, 42, 0.06)' }
          },
          y: {
            title: { display: false },
            beginAtZero: true,
            ticks: { color: '#7a889c' },
            grid: { color: 'rgba(15, 23, 42, 0.06)' }
          }
        }
      }
    });
  }

  renderRamChart(): void {
    if (!this.ramChartRef || !this.ramChartRef.nativeElement) {
      console.warn('ramChartRef not ready, retrying...');
      setTimeout(() => this.renderRamChart(), 500);
      return;
    }
    if (this.ramChart) this.ramChart.destroy();

    const points = this.ramUsageData.map(val => ({ x: this.parseTimestampToDate(val._id), y: Number(val.ramAverage) / (1024 * 1024) }));
    if (points.length === 1) points.push({ x: new Date(points[0].x.getTime() + 1000), y: points[0].y });

    const timeConfig = this.getTimeScaleConfig();

    this.ramChart = new Chart(this.ramChartRef.nativeElement, {
      type: 'line',
      data: {
        datasets: [
          {
            label: `RAM Usage (${Number(this.average(points.map(p => p.y))).toFixed(2)} MiB)` ,
            data: points,
            borderColor: '#3cdacb',
            backgroundColor: 'rgba(60, 218, 203, 0.18)',
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 4,
            borderWidth: 2
          },
          {
            label: `Max Limit (${this.maxRamLimit} MiB)` ,
            data: points.map(p => ({ x: p.x, y: this.maxRamLimit })),
            borderColor: '#ff6b6b',
            borderWidth: 2,
            borderDash: [6, 6],
            pointRadius: 0,
            fill: false,
            parsing: false
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            align: 'start',
            labels: {
              usePointStyle: false,
              boxWidth: 20,
              boxHeight: 4,
              padding: 18,
              color: '#6b7a90',
              font: { size: 12 },
              generateLabels: (chart) => {
                const labels = Chart.defaults.plugins.legend.labels.generateLabels(chart);
                labels.forEach((label: any) => {
                  if (label.text.includes('Max')) label.text = `Max Limit (${this.maxRamLimit} MiB)`;
                });
                return labels;
              }
            }
          },
          tooltip: {
            enabled: true,
            backgroundColor: '#ffffff',
            borderColor: '#e4e9f1',
            borderWidth: 1,
            titleColor: '#3b4a5a',
            bodyColor: '#111827',
            displayColors: false,
            padding: 10,
            filter: (ctx) => !String(ctx.dataset?.label || '').toLowerCase().includes('max'),
            callbacks: {
              title: (items) => {
                const x = items[0]?.parsed?.x;
                if (!x) return '';
                const d = new Date(x);
                const dateStr = d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
                const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                return `${dateStr} ${timeStr}`;
              },
              label: (ctx) => `RAM Usage: ${Number(ctx.parsed.y).toFixed(2)} MiB`
            }
          }
        },
        interaction: { mode: 'index', intersect: false },
        scales: {
          x: {
            type: 'time',
            time: { tooltipFormat: 'PPpp', ...timeConfig },
            title: { display: false },
            ticks: {
              autoSkip: true,
              maxTicksLimit: 6,
              autoSkipPadding: 12,
              maxRotation: 0,
              minRotation: 0,
              color: '#7a889c',
              callback: (val: any) => {
                const d = new Date(val);
                const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const durationVal: any = this.filterForm?.get('duration')?.value;
                if (durationVal && Number(durationVal) <= 60) return timeStr;
                const dateStr = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
                return `${dateStr} ${timeStr}`;
              }
            },
            grid: { color: 'rgba(15, 23, 42, 0.06)' }
          },
          y: {
            title: { display: false },
            beginAtZero: true,
            ticks: { color: '#7a889c' },
            grid: { color: 'rgba(15, 23, 42, 0.06)' }
          }
        }
      }
    });
  }

  renderStorageChart(): void {
    if (!this.chartRef || !this.chartRef.nativeElement) {
      console.warn('chartRef not ready, retrying...');
      setTimeout(() => this.renderStorageChart(), 100);
      return;
    }

    if (this.storageChart) {
      this.storageChart.destroy();
    }
    const points = this.storageUsageData.map((item: any) => ({ x: this.parseTimestampToDate(item._id), y: item.storageAverage }));
    const maxStorageLimit = 100;
    if (points.length === 1) points.push({ x: new Date(points[0].x.getTime() + 1000), y: points[0].y });

    const timeConfig = this.getTimeScaleConfig();

    this.storageChart = new Chart(this.storageChartRef.nativeElement, {
      type: 'line',
      data: {
        datasets: [{
          label: 'Storage Usage (GB)',
          data: points,
          borderColor: 'rgb(240, 157, 48)',
          backgroundColor: 'rgba(250, 127, 66, 0.2)',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Max Storage Limit',
          data: points.map(p => ({ x: p.x, y: maxStorageLimit })),
          borderColor: 'red',
          borderWidth: 1,
          pointRadius: 0,
          fill: false,
          parsing: false
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: { display: true, text: 'Storage Usage Over Time' }
        },
        scales: {
          x: { type: 'time', time: { tooltipFormat: 'PPpp', ...timeConfig }, title: { display: true, text: 'Time' }, ticks: { autoSkip: true, maxRotation: 0, minRotation: 0, callback: (val: any) => { const d = new Date(val); const dateStr = d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }); const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); return [dateStr, timeStr]; } } },
          y: { title: { display: true, text: 'Storage (GB)' }, beginAtZero: true }
        }
      }
    });
  }

  isSelected(option: string): boolean {
    return this.filterForm.get('pods')?.value.includes(option);
  }

  onFilter(): void {
    const params = this.computeFilterParams();
    if (!params) return;

    // show loader immediately and expect two requests (cpu + memory)
    this.loading = true;
    this.pendingMetricsRequests = 2;

    this.onFilterCpu(params);
    this.onFilterMem(params);
  }

  private computeFilterParams(): { fromISO: string; toISO: string; timeIntervalSeconds: number } | null {
    let duration = this.filterForm.get('duration')?.value;
    let fromISO: string = '';
    let toISO: string = '';
    if (duration === 'custom') {
      const fromTimestamp = this.filterForm.get('fromTimestamp')?.value;
      const toTimestamp = this.filterForm.get('toTimestamp')?.value;
      if (fromTimestamp && toTimestamp) {
        const fromDate = new Date(fromTimestamp);
        const toDate = new Date(toTimestamp);

        fromISO = fromDate.toISOString().split('.')[0] + 'Z';
        toISO = toDate.toISOString().split('.')[0] + 'Z';
        const fromTs = fromDate.getTime();
        const toTs = toDate.getTime();
        duration = Math.floor((toTs - fromTs) / (1000 * 60));
      } else {
        console.error('Please provide both From and To timestamps.');
        return null;
      }
    }
    else {
      const now = new Date();
      const from = new Date(now.getTime() - duration * 60 * 1000);

      fromISO = from.toISOString().split('.')[0] + 'Z';
      toISO = now.toISOString().split('.')[0] + 'Z';
    }
    const formInterval = this.filterForm.get('interval')?.value;
    const timeIntervalMap: { [key: string]: string } = {
      '15': '5',
      '30': '15',
      '60': '15',
      '1440': '60', // timeInterval will be 1hr for 1day
      '10080': '1440', // timeInterval will be 1day for 7days
      '43834': '1440', // timeInterval will be 1day for 1month
    };
    const timeIntervalMinutes = formInterval || timeIntervalMap[duration.toString()] || '15';
    const timeIntervalSeconds = parseInt(timeIntervalMinutes, 10) * 60;

    return { fromISO, toISO, timeIntervalSeconds };
  }

  private onFilterCpu(params: { fromISO: string; toISO: string; timeIntervalSeconds: number }): void {
    const environmentId = JSON.parse(localStorage.getItem('environment') || '{}').id || '';
    // const deploymentId = JSON.parse(localStorage.getItem('deployment') || '{}').id || '';

    this.deploymentService.getDeploymentMetricsByTime(environmentId, params.fromISO, params.toISO, params.timeIntervalSeconds, 'cpu', this.deploymentId).subscribe((res: any) => {
      const cpuValues: [number | string, number | null][] = res.data?.usageRange?.data?.result?.[0]?.values || [];

      if (!cpuValues || cpuValues.length === 0) {
        this.cpuUsageData = [];
      } else {
        this.cpuUsageData = cpuValues.map(([ts, value]) => ({ _id: ts.toString(), cpuAverage: +Number(value || 0).toFixed(2) }));
      }

      // Calculate CPU usage percent
      if (this.cpuUsageData.length > 0 && this.maxCpuLimit > 0) {
        const averageCpu = this.average(this.cpuUsageData.map(item => item.cpuAverage));
        this.cpuUsagePercent = this.getUsagePercent(averageCpu, this.maxCpuLimit);
        this.currentCpuLabel = averageCpu.toFixed(2);
      } else {
        this.cpuUsagePercent = 0;
        this.currentCpuLabel = '0';
      }
      this.renderCpuChart();
      this.decrementPendingRequests();
    }, (err) => {
      console.error('Failed to fetch CPU metrics', err);
      this.cpuUsageData = [];
      this.decrementPendingRequests();
    });
  }

  private onFilterMem(params: { fromISO: string; toISO: string; timeIntervalSeconds: number }): void {
    const environmentId = JSON.parse(localStorage.getItem('environment') || '{}').id || '';
    // const deploymentId = JSON.parse(localStorage.getItem('deployment') || '{}').id || '';

    this.deploymentService.getDeploymentMetricsByTime(environmentId, params.fromISO, params.toISO, params.timeIntervalSeconds, 'memory', this.deploymentId).subscribe((res: any) => {
      const memValues: [number | string, number | null][] = res.data?.usageRange?.data?.result?.[0]?.values || [];

      if (!memValues || memValues.length === 0) {
        this.ramUsageData = [];
      } else {
        this.ramUsageData = memValues.map(([ts, value]) => ({ _id: ts.toString(), ramAverage: +Number(value || 0).toFixed(2) }));
      }
      // Calculate RAM usage percent
      if (this.ramUsageData.length > 0 && this.maxRamLimit > 0) {
        const averageRamBytes = this.average(this.ramUsageData.map(item => item.ramAverage));
        const averageRamMiB = averageRamBytes / (1024 * 1024);
        this.ramUsagePercent = this.getUsagePercent(averageRamMiB, this.maxRamLimit);
        this.currentRamLabel = averageRamMiB.toFixed(2);
      } else {
        this.ramUsagePercent = 0;
        this.currentRamLabel = '0';
      }
      this.renderRamChart();
      this.renderStorageChart();
      this.decrementPendingRequests();
    }, (err) => {
      console.error('Failed to fetch Memory metrics', err);
      this.ramUsageData = [];
      this.decrementPendingRequests();
    });
  }

  private decrementPendingRequests(): void {
    if (this.pendingMetricsRequests > 0) {
      this.pendingMetricsRequests -= 1;
    }
    if (this.pendingMetricsRequests <= 0) {
      this.loading = false;
      this.pendingMetricsRequests = 0;
    }
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    if (!this.eRef.nativeElement.contains(event.target)) {
      this.dropdownOpen = false;
    }
  }

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }
  private parseTimestampToDate(ts: any): Date {
    const n = Number(ts);
    if (!isNaN(n)) {
      // treat 10-digit numbers as seconds
      if (String(ts).length <= 10) return new Date(n * 1000);
      return new Date(n);
    }
    const d = new Date(ts);
    if (!isNaN(d.getTime())) return d;
    return new Date();
  }

  private getTimeScaleConfig(): any {
    const durationVal: any = this.filterForm?.get('duration')?.value;
    let minutes = 15;
    if (!durationVal) return { unit: 'minute', displayFormats: { minute: 'MMM d, h:mm a' } };
    if (durationVal === 'custom') {
      const from = new Date(this.filterForm.get('fromTimestamp')?.value);
      const to = new Date(this.filterForm.get('toTimestamp')?.value);
      minutes = Math.max(1, Math.floor((to.getTime() - from.getTime()) / (1000 * 60)));
    } else {
      minutes = Number(durationVal);
    }

    if (minutes <= 60) {
      return { unit: 'minute', displayFormats: { minute: 'MMM d, h:mm a', hour: 'MMM d, h a', day: 'MMM d' } };
    }
    if (minutes <= 1440) {
      return { unit: 'hour', displayFormats: { hour: 'MMM d, h a', day: 'MMM d' } };
    }
    if (minutes <= 10080) {
      return { unit: 'day', displayFormats: { day: 'MMM d' } };
    }
    return { unit: 'month', displayFormats: { month: 'MMM yyyy' } };
  }
  private formatCpuForLabel(val: number): string {
    return `${Number(val).toFixed(2)} mCPU`;
  }
  private average(arr: number[]): number {
    if (!arr || arr.length === 0) return 0;
    return arr.reduce((s, v) => s + (Number(v) || 0), 0) / arr.length;
  }

  private getUsagePercent(currentValue: number, maxLimit: number): number {
    if (!maxLimit || maxLimit <= 0) return 0;
    return Math.min(100, (currentValue / maxLimit) * 100);
  }
}
