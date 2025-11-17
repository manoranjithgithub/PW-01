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

  cpuChart!: Chart;
  ramChart!: Chart;
  storageChart!: Chart;
  cpuUsageData: any[] = [];
  ramUsageData: any[] = [];

  filterForm!: FormGroup;
  podList: string[] = [];

  durations = DURATIONS;
  intervals = INTERVALS;
  storageUsageData = METRICS_REFRESH_INTERVALS;

  showNoDataMessage: boolean = false;
  deploymentdetails: any;
  viewInitialized: boolean = false;
  showPodError: boolean = false;
  instanceTypes: any = {};
  maxCpuLimit: number = 0;
  maxRamLimit: number = 0;

  constructor(private eRef: ElementRef, private fb: FormBuilder, private deploymentService: DeploymentsService,
    private activatedRoute: ActivatedRoute, private sharedService: SharedService) { }

  ngOnInit() {
    this.activatedRoute.queryParams.subscribe(params => {
      if (params['id'] != undefined) {
        this.deploymentId = params['id'];
      }
      this.deploymentService.getDeploymentById(this.deploymentId).subscribe((res: any) => {
        this.deploymentdetails = res.data;
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
    this.onFilter()
  }

  computeMaxLimits(): void {
    this.deploymentService.getInstanceTypes().subscribe((response: any) => {
      this.instanceTypes = response.data;
      const deploymentInstanceType = this.deploymentdetails?.instance_type?.trim();

      if (!deploymentInstanceType) {
        console.warn('Instance type is null or undefined.');
        return;
      }

      const instanceTypeKey = Object.keys(this.instanceTypes).find((key: any) =>
        key.trim() === deploymentInstanceType
      );

      if (instanceTypeKey) {
        const instanceInfo = this.instanceTypes[instanceTypeKey];
        if (instanceInfo.cpu.endsWith('m')) {
          this.maxCpuLimit = parseFloat(instanceInfo.cpu.replace('m', ''));
        } else {
          this.maxCpuLimit = parseFloat(instanceInfo.cpu) * 1000; //show value in mCpu
        }
        if (instanceInfo.memory.endsWith('Mi')) {
          this.maxRamLimit = parseFloat(instanceInfo.memory.replace('Mi', ''));
        } else {
          this.maxRamLimit = parseFloat(instanceInfo.memory) * 1000; //show value in MiB
        }
      }
    });
  }

  private formatDateForDatetimeLocal(date: Date): string {
    const pad = (n: number) => n < 10 ? '0' + n : n;
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }


  ngAfterViewInit(): void {
    this.viewInitialized = true;
  }

  getPodsByDeploymentId(deploymentId: string): void {
    this.deploymentService.getPodsByDeploymentId(deploymentId).subscribe((response: any) => {
      if (response.status.toLowerCase() === 'success') {
        if (response.data.length === 0) {
          this.showNoDataMessage = true;
          this.cpuUsageData = [];
          this.ramUsageData = [];
          this.storageUsageData = [];
          return;
        }
        this.showNoDataMessage = false;
        this.podList = response.data;
        this.selectedPods = this.podList;
        this.filterForm.get('pods')?.setValue(this.podList);

        const now = new Date().toISOString().split('.')[0] + 'Z';
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString().split('.')[0] + 'Z';
      }
      else {
        this.showNoDataMessage = true;
      }
    });
  }

  getDeploymentMetrics(reqBody: any): void {
    this.sharedService.show();
    this.deploymentService.getDeploymentMetrics(reqBody).subscribe((response: any) => {
      if (response.data.length === 0) {
        this.showNoDataMessage = true;
        this.cpuUsageData = [];
        this.ramUsageData = [];
        this.storageUsageData = [];
        return;
      } else {
        this.showNoDataMessage = false;
        this.cpuUsageData = response.data.map((item: any) => ({
          _id: item._id,
          cpuAverage: item.cpuAverage
        }));
        this.ramUsageData = response.data.map((item: any) => ({
          _id: item._id,
          ramAverage: item.memoryAverage
        }));
      }
      if (this.viewInitialized) {
        this.renderCpuChart();
        this.renderRamChart();
        this.renderStorageChart();
      } else {
        setTimeout(() => {
          this.renderCpuChart();
          this.renderRamChart();
          this.renderStorageChart();
        }, 100);
      }
    });
    this.sharedService.hide();
  }

  renderCpuChart(): void {
    if (!this.chartRef || !this.chartRef.nativeElement) {
      console.warn('chartRef not ready, retrying...');
      setTimeout(() => this.renderCpuChart(), 500);
      return;
    }
    if (this.cpuChart) {
      this.cpuChart.destroy();
    }
    const data = this.cpuUsageData.map(item => Number(item.cpuAverage) || 0);
    const labels = data.map((_, index) => index);
    if (labels.length === 1) {
      labels.push(labels[0] + 1);
      data.push(data[0]);
    }
    this.cpuChart = new Chart(this.chartRef.nativeElement, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'CPU Usage (mCPU)',
            data,
            borderColor: 'rgba(54, 162, 235, 1)',
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#1e88e5'
          },
          {
            label: 'Max CPU Limit',
            data: labels.map(() => this.maxCpuLimit),
            borderColor: 'red',
            borderWidth: 1,
            pointRadius: 0,
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: true },
          tooltip: { enabled: true },
          title: { display: true, text: 'CPU Usage Over Time' }
        },
        scales: {
          x: {
            type: 'linear',
            title: { display: true, text: 'Data Point Index' },
            ticks: {
              autoSkip: true,
              maxRotation: 45,
              minRotation: 0
            }
          },
          y: {
            title: { display: true, text: 'CPU (mCPU)' },
            beginAtZero: true
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

    if (this.ramChart) {
      this.ramChart.destroy();
    }

    // Prepare data
    const data = this.ramUsageData.map(item => Number(item.ramAverage) || 0);
    const labels = data.map((_, index) => index); // simple numeric index

    // Handle single data point
    if (labels.length === 1) {
      labels.push(labels[0] + 1);
      data.push(data[0]);
    }

    // Create chart
    this.ramChart = new Chart(this.ramChartRef.nativeElement, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'RAM Usage (MiB)',
            data,
            borderColor: 'rgba(75, 192, 192, 1)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            fill: true,
            tension: 0.4
          },
          {
            label: 'Max RAM Limit',
            data: labels.map(() => this.maxRamLimit),
            borderColor: 'red',
            borderWidth: 1,
            pointRadius: 0,
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          title: { display: true, text: 'RAM Usage Over Time' },
          legend: { display: true },
          tooltip: { enabled: true }
        },
        scales: {
          x: {
            type: 'linear',
            title: { display: true, text: 'Data Point Index' },
            ticks: { autoSkip: true, maxRotation: 45, minRotation: 0 }
          },
          y: {
            title: { display: true, text: 'RAM (MiB)' },
            beginAtZero: true
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
    const labels = this.storageUsageData.map((item: any) =>
      new Date(item._id).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    );
    const data = this.storageUsageData.map((item: any) => item.storageAverage);
    const maxStorageLimit = 100;

    this.storageChart = new Chart(this.storageChartRef.nativeElement, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Storage Usage (GB)',
          data: data,
          borderColor: 'rgb(240, 157, 48)',
          backgroundColor: 'rgba(250, 127, 66, 0.2)',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Max Storage Limit',
          data: labels.map(() => maxStorageLimit),
          borderColor: 'red',
          borderWidth: 1,
          pointRadius: 0,
          fill: false,
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: { display: true, text: 'Storage Usage Over Time' }
        },
        scales: {
          x: { title: { display: true, text: 'Time' } },
          y: { title: { display: true, text: 'Storage (GB)' }, beginAtZero: true }
        }
      }
    });
  }

  isSelected(option: string): boolean {
    return this.filterForm.get('pods')?.value.includes(option);
  }

  onFilter(): void {
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
        return;
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
    const environmentId = JSON.parse(localStorage.getItem('environment') || '{}').id || '';
    this.deploymentService.getDeploymentMetricsByTime(environmentId, fromISO, toISO, timeIntervalSeconds).subscribe((res: any) => {
      const cpuValues: [number | string, number | null][] =
        res.data.cpu?.usageRange?.data?.result?.[0]?.values || [];
      const memValues: [number | string, number | null][] =
        res.data.memory?.usageRange?.data?.result?.[0]?.values || [];

      const aggregatedData: Record<string, { cpu: number; mem: number; count: number }> = {};
      const timestampSet = new Set<string>();
      let hasData = false;

      const processValues = (values: [number | string, number | null][], key: 'cpu' | 'mem') => {
        values.forEach(([ts, value]) => {
          hasData = true;
          const tsStr = ts.toString();
          timestampSet.add(tsStr);

          if (!aggregatedData[tsStr]) {
            aggregatedData[tsStr] = { cpu: 0, mem: 0, count: 0 };
          }
          aggregatedData[tsStr][key] += Number(value) || 0;
          aggregatedData[tsStr].count += 1;
        });
      };

      processValues(cpuValues, 'cpu');
      processValues(memValues, 'mem');

      if (!hasData) {
        this.showNoDataMessage = true;
        this.cpuUsageData = [];
        this.ramUsageData = [];
        // this.storageUsageData = [];
        return;
      }

      this.showNoDataMessage = false;

      const timestamps = Array.from(timestampSet).sort();

      this.cpuUsageData = timestamps.map(ts => ({
        _id: ts,
        cpuAverage: +Number(aggregatedData[ts]?.cpu || 0).toFixed(2)
      }));

      this.ramUsageData = timestamps.map(ts => ({
        _id: ts,
        ramAverage: +Number(aggregatedData[ts]?.mem || 0).toFixed(2)
      }));

      this.renderCpuChart();
      this.renderRamChart();
      this.renderStorageChart();
    });
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
}
