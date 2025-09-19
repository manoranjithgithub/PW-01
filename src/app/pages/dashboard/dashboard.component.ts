import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';

import { DashboardsService } from './dashboard.service';
import { SummaryCardComponent } from './summary-card/summary-card.component';
import { FormBuilder, FormGroup, NgModel, ReactiveFormsModule } from '@angular/forms';
import { UtilizationChartComponent } from './utilization-chart/utilization-chart.component';
import Litepicker from 'litepicker';
import { CommonModule } from '@angular/common';
import { SharedService } from '../../shared/services/shared.service';
import { Router } from '@angular/router';
import { DropdownComponent, DropdownItemDirective, DropdownMenuDirective, DropdownToggleDirective } from '@coreui/angular';
import { ConfirmationModalComponent } from '../../shared/components/modal/confirmation-modal/confirmation-modal.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { env } from 'process';
import { ToastrService } from 'ngx-toastr';


@Component({
  templateUrl: 'dashboard.component.html',
  styleUrls: ['dashboard.component.scss'],
  standalone: true,
  imports: [
    CommonModule, SummaryCardComponent, ReactiveFormsModule,
    UtilizationChartComponent, DropdownComponent, DropdownItemDirective, DropdownMenuDirective,
    DropdownToggleDirective
  ],
  providers: [DashboardsService],
  encapsulation: ViewEncapsulation.None
})

export class DashboardComponent implements OnInit, AfterViewInit {

  @ViewChild('dateRangeInput', { static: true }) inputRef!: ElementRef;
  selectedRange: { start: string; end: string } | null = null;
  private picker!: Litepicker;

  cards = [
    { value: 0, label: 'Spent cost', change: -3.4, description: 'Month to date' },
    { value: 0, label: 'Estimated cost', change: 3.4, description: ' ' },
    { value: '', label: 'Active/Paused deployments', change: -6.2, description: ' ' },
    { value: 0, label: 'Failed/Pending deployments', change: -9.5, description: ' ' },
  ];
  form!: FormGroup;

  utilizationData = [
    {
      title: 'CPU',
      subtitle: 'CPU Utilized vs. Allocated',
      value: 0,
      rawValue: '1056'
    },
    {
      title: 'Memory',
      subtitle: 'Memory Utilized vs. Allocated',
      value: 0,
      rawValue: '3200'
    },
    {
      title: 'Storage',
      subtitle: 'Storage Utilized vs. Allocated',
      value: 0,
      rawValue: '5800'
    }
  ];
  endpoints: any = [];
  currentEnvId: string = '';
  constructor(private fb: FormBuilder, private http: DashboardsService, private sharedService: SharedService,
    private router: Router, private modalService: NgbModal, private toastr: ToastrService
  ) {

  }

  ngOnInit(): void {
    this.cards[1].description = this.getCurrentMonthRange();

    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);

    const req = {
      fromTimestamp: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0)).toISOString(),
      toTimestamp: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999)).toISOString(),
      userId: localStorage.getItem('userId')
    };
    this.http.getUsageCost(req).subscribe((res: any) => {
      if (res.status.toLowerCase() === 'success') {
        const totalCostSum = res.data?.usage?.reduce(
          (acc: number, item: any) => acc + (item.totalCost || 0),
          0
        ) ?? 0;
        const roundedTotalCost = Math.round(totalCostSum * 100) / 100;

        this.cards[0].value = totalCostSum === 0
          ? '$0.00'
          : roundedTotalCost.toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          });

        const estimatedCostSum =
          res.data?.estimatedUsage && res.data.estimatedUsage.length > 0
            ? res.data.estimatedUsage.reduce(
              (acc: number, item: any) => acc + (item.estimatedCost || 0),
              0
            )
            : 150;
        console.log(estimatedCostSum)
        const roundedEstimatedCost = Math.round(estimatedCostSum * 100) / 100;

        this.cards[1].value = estimatedCostSum === 0
          ? '$0'
          : roundedEstimatedCost.toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          });
      }
    })
    // const environment = this.sharedService.getCookie('environment');
    const environment = localStorage.getItem('environment');
    if (environment) {
      const envID = JSON.parse(environment).id;
      this.http.getDeploymentStatus(envID).subscribe((res: any) => {
        if (res.status.toLowerCase() === 'success') {
          this.cards[2].value = `${res.data.toalActiveWorkloads} / ${res.data.totalPausedWorkloads}`;
          this.cards[3].value = `${res.data.totalFailedWorkloads} / ${res.data.totalPendingWorkloads}`;
        }
      });
      this.currentEnvId = envID;
      this.getEndpointsList(envID)

    }
    this.http.getDeploymentUtilization(this.currentEnvId).subscribe((res: any) => {
      console.log(res);
      this.utilizationData.forEach(item => {
        switch (item.title) {
          case 'CPU':
            item.value = parseFloat(res.data.cpuPercentage);
            item.rawValue = `${(res.data.totalCpuAvg * 1000).toFixed(2)}mCPU`;
            break;

          case 'Memory':
            item.value = parseFloat(res.data.ramPercentage);
            item.rawValue = `${(res.data.totalRamAvg * 1000).toFixed(2)}Mi`;
            break;

          case 'Storage':
            item.value = 0;
            item.rawValue = '0GB';
            break;
        }
      });
    });
  }

  ngAfterViewInit(): void {
    this.picker = new Litepicker({
      element: this.inputRef.nativeElement,
      singleMode: false,
      format: 'YYYY-MM-DD',
      autoApply: true,
      setup: (picker) => {
        picker.on('selected', (startDate, endDate) => {
          this.selectedRange = {
            start: startDate.format('YYYY-MM-DD'),
            end: endDate.format('YYYY-MM-DD'),
          };
        });
      }
    });
  }

  openPicker() {
    this.picker?.show();
  }
  gotoNetworkSection(data: any) {
    if (data.deploymentId) {
      this.router.navigate(
        ['/deployment/deployment-details'],
        {
          queryParams: {
            id: data.deploymentId
          },
          fragment: 'network-section'
        }
      );
    } else {
      this.router.navigate(
        ['/tools'])
    }

  }

  getEndpointsList(envId: string) {
    this.http.getEndpoints(envId).subscribe((res: any) => {
      this.endpoints = res.data;
      console.log(res)
    })
  }
  viewEndpoint(data: any) {
    console.log(data);
    this.gotoNetworkSection(data);
  }
  deleteEndpoint(data: any) {
    const modalRef = this.modalService.open(ConfirmationModalComponent);
    modalRef.componentInstance.selectedItem = 'Endpoint';
    modalRef.componentInstance.message = 'Are you sure you want to proceed?';

    modalRef.result.then(
      (result) => {
        if (result) {
          this.http.deleteEndpoint(this.currentEnvId, data.name).subscribe((res: any) => {
            if (res.status === 'Success') {
              this.getEndpointsList(this.currentEnvId);
              this.toastr.success(res.message);
            }
          });
        } else {
          console.log('Cancelled delete Endpoint!');
        }
      });
    console.log(data)
  }

  getCurrentMonthRange(): string {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const options = { month: 'short' as const };
    const startMonth = start.toLocaleString('default', options);
    const endMonth = end.toLocaleString('default', options);

    return `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}`;
  }

  copyToUrl(text: string): void {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
  }

}
