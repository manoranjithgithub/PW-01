import { Component, HostListener, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';

import { DashboardsService } from './dashboard.service';
import { SummaryCardComponent } from './summary-card/summary-card.component';
import { UtilizationChartComponent } from './utilization-chart/utilization-chart.component';
import { CommonModule } from '@angular/common';
import { SharedService } from '../../shared/services/shared.service';
import { Router } from '@angular/router';
import { DropdownComponent, DropdownItemDirective, DropdownMenuDirective, DropdownToggleDirective } from '@coreui/angular';
import { ConfirmationModalComponent } from '../../shared/components/modal/confirmation-modal/confirmation-modal.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { forkJoin } from 'rxjs';
import { CARDS_DATA, UTILIZATION_DATA } from '../../shared/constants/nimbuz.constant';

@Component({
  templateUrl: 'dashboard.component.html',
  styleUrls: ['dashboard.component.scss'],
  standalone: true,
  imports: [
    CommonModule, SummaryCardComponent,
    UtilizationChartComponent, DropdownComponent, DropdownItemDirective, DropdownMenuDirective,
    DropdownToggleDirective
  ],
  providers: [DashboardsService],
  encapsulation: ViewEncapsulation.None
})

export class DashboardComponent implements OnInit, OnDestroy {
  cards = CARDS_DATA;
  utilizationData = UTILIZATION_DATA;
  endpoints: any = [];
  currentEnvId: string = '';
  private subscriptions: Subscription[] = [];

  private envValueSubscription: Subscription | undefined;
  dropdownStyle: any = {};
  isDropdownOpen: boolean = false;
  lastButtonRef: HTMLElement | null = null;

  constructor(private http: DashboardsService, private sharedService: SharedService,
    private router: Router, private modalService: NgbModal, private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.envValueSubscription = this.sharedService.envValueChange$.subscribe(value => {
      this.initializeDashboard();
    });
    this.initializeDashboard()
  }
  initializeDashboard() {
    this.cards[1].description = this.getCurrentMonthRange();

    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);

    const env = JSON.parse(localStorage.getItem('environment') || '{}');
    const accountId = localStorage.getItem('accountId');
    const project = JSON.parse(localStorage.getItem('project') || '{}');
    this.http.getCostDetails(accountId, project?.id, env?.id).subscribe((res: any) => {
      if (res.success) {
        const totalCostSum = res.data?.totals?.reduce(
          (acc: number, item: any) => acc + (item.total_cost || 0),
          0
        ) ?? 0;
        const roundedTotalCost = Math.round(totalCostSum * 100) / 100;

        this.cards[0].value = totalCostSum === 0
          ? '0'
          : roundedTotalCost.toLocaleString('en-US', {
            style: 'currency',
            currency: res?.data?.totals[0].currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          });

        const estimatedCostSum = res.data?.projection_mtd_simple?.reduce(
          (acc: number, item: any) => acc + (Number(item.projected_total) || 0),
          0
        ) ?? 0;
        const roundedEstimatedCost = Math.round(estimatedCostSum * 100) / 100;

        this.cards[1].value = estimatedCostSum === 0
          ? '0'
          : roundedEstimatedCost.toLocaleString('en-US', {
            style: 'currency',
            currency: res?.data?.projection_mtd_simple[0].currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          });
      }
    })
    this.currentEnvId = env?.id;
    this.getEndpointsList(env?.id);
    this.getStatusCount();
    this.startCpuStream();
    this.startMemoryStream();
  }
  getEndpointsList(envId: string) {
    this.http.getEndpoints(envId).subscribe((res: any) => {
      this.endpoints = res.data;
    })
  }
  viewEndpoint(data: any) {
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
  deleteEndpoint(data: any) {
    const modalRef = this.modalService.open(ConfirmationModalComponent);
    modalRef.componentInstance.selectedItem = 'Endpoint';
    modalRef.componentInstance.message = 'Are you sure you want to proceed?';

    modalRef.result.then(
      (result) => {
        if (result) {
          this.http.deleteEndpoint(this.currentEnvId, data.name).subscribe((res: any) => {
            if (res.status.toLowerCase() === 'success') {
              this.getEndpointsList(this.currentEnvId);
              this.toastr.success(res.message);
              scrollTo(0, 0);
            }
          }, error => {
            scrollTo(0, 0);
          });
        } else {
          console.log('Cancelled delete Endpoint!');
        }
      });
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
  startCpuStream() {
    const sub = this.http
      .getDeploymentUtilizationSSE(this.currentEnvId, 'cpu')
      .subscribe({
        next: (res: any) => {
          const cpu = res.values?.cpu || res.cpu || { usage: 0, limit: 0 };
          const usageCores = cpu.usage ?? 0;
          const limitCores = cpu.limit ?? 0;
          this.utilizationData[0].value = this.getPercentage(usageCores, limitCores);
          this.utilizationData[0].rawValue = `${usageCores.toFixed(2)} / ${limitCores}`;
        },
        error: (err) => console.error('CPU SSE error', err),
      });
    this.subscriptions.push(sub);
  }

  startMemoryStream() {
    const sub = this.http
      .getDeploymentUtilizationSSE(this.currentEnvId, 'memory')
      .subscribe({
        next: (res: any) => {
          const mem = res.values.memory || res.memory || { usage: 0, limit: 0 };
          const usageGB = mem.usage ? mem.usage / (1024 * 1024 * 1024) : 0;
          const limitGB = mem.limit ? mem.limit / (1024 * 1024 * 1024) : 0;
          this.utilizationData[1].value = this.getPercentage(usageGB, limitGB);
          this.utilizationData[1].rawValue = `${usageGB.toFixed(2)} GB / ${limitGB.toFixed(2)} GB`;
        },
        error: (err) => console.error('Memory SSE error', err),
      });
    this.subscriptions.push(sub);
  }
  getPercentage(usage: number | null | undefined, limit: number | null | undefined): number {
    if (usage == null || limit == null || limit === 0) return 0;
    return parseFloat(((usage / limit) * 100).toFixed(2));
  }
  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.envValueSubscription?.unsubscribe();
    //  document.removeEventListener('click', this.handleDocClick);
  }

  getStatusCount() {
    forkJoin([
      this.http.getDeployments(this.currentEnvId),
      this.http.getToolsList(this.currentEnvId)
    ]).subscribe(([res1, res2]) => {
      const data = res1 as any
      const data2 = res2 as any

      const combined = [...data.data, ...data2.data];

      const statusCount = combined.reduce((acc, item) => {
        if (item.status.toLowerCase() === 'running') acc.running += 1;
        else if (item.status.toLowerCase() === 'pending') acc.pending += 1;
        else if (item.status.toLowerCase() === 'failed') acc.failed += 1;
        else if (item.status.toLowerCase() === 'paused') acc.paused += 1;
        return acc;
      }, { running: 0, pending: 0, failed: 0, paused: 0 });
      this.cards[2].value = `${statusCount.running} / ${statusCount.paused}`;
      this.cards[3].value = `${statusCount.failed} / ${statusCount.pending}`;
    });
  }
  toggleDropdown(event: MouseEvent, btnRef?: HTMLElement): void {
    event.stopPropagation();
    const btn = (btnRef as HTMLElement) || (event.target as HTMLElement);
    const rect = btn.getBoundingClientRect();
    const top = rect.bottom + 0;
    const left = rect.right - 160;

    this.dropdownStyle = {
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      'z-index': 9999,
      'pointer-events': 'auto'
    };

    const willOpen = !this.isDropdownOpen;
    if (willOpen) {
      window.dispatchEvent(new Event('close-action-dropdowns'));
    }
    this.isDropdownOpen = willOpen;
    this.lastButtonRef = willOpen ? (btn as HTMLElement) : null;
  }

  @HostListener('window:scroll', ['$event'])
  onWindowScroll() {
    if (this.isDropdownOpen && this.lastButtonRef) {
      this.updateDropdownPosition(this.lastButtonRef);
    }
  }

  @HostListener('window:resize', ['$event'])
  onWindowResize() {
    if (this.isDropdownOpen && this.lastButtonRef) {
      this.updateDropdownPosition(this.lastButtonRef);
    }
  }

  @HostListener('document:click', ['$event'])
  onOutsideClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const clickedInsideMenu = !!target.closest('.floating-dropdown');
    const clickedInsideBtn = !!target.closest('.btn-icon');
    if (!clickedInsideMenu && !clickedInsideBtn) {
      this.isDropdownOpen = false;
    }
  }
  @HostListener('window:close-action-dropdowns', ['$event'])
  onCloseActionDropdowns(_: Event) {
    this.isDropdownOpen = false;
    this.lastButtonRef = null;
  }
  updateDropdownPosition(btn: HTMLElement | undefined | null) {
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const top = rect.bottom + 8;
    const left = rect.right - 160;
    this.dropdownStyle = {
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      'z-index': 9999,
      'pointer-events': 'auto'
    };
  }
}
