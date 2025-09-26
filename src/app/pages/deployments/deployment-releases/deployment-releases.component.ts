import { AfterViewChecked, AfterViewInit, Component, ElementRef, HostListener, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import {
  AccordionButtonDirective,
  AccordionComponent,
  AccordionItemComponent,
  TemplateIdDirective,
  CalloutComponent,
  DropdownComponent,
  DropdownItemDirective,
  DropdownMenuDirective,
  DropdownToggleDirective,
  NavComponent,
  NavItemComponent,
  NavLinkDirective,
  TabContentRefDirective,
  TabContentComponent,
  TabPaneComponent
} from '@coreui/angular';
import { DeploymentsService } from '../deployment.service';
import { AgGridTableComponent } from '../../../shared/components/ag-grid-table/ag-grid-table.component';
import { AgGridModule } from 'ag-grid-angular';
import { ToastrService } from 'ngx-toastr';
import { CommonModule } from '@angular/common';
import { SharedService } from '../../../shared/services/shared.service';
import { ActivatedRoute } from '@angular/router';
import { ModalComponent } from '../../../shared/components/model/model.component';
import { DeployConfirmationComponent } from '../../../shared/components/deploy-confirmation/deploy-confirmation.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { RelativeTimePipe } from '../../../shared/pipes/relative-time.pipe';
import { LogViewerComponent } from '../../../shared/components/log-viewer/log-viewer.component';
import { skip, Subject, switchMap, take, takeUntil } from 'rxjs';

@Component({
  selector: 'app-deployment-releases',
  standalone: true,
  imports: [AccordionComponent,
    AccordionItemComponent,
    TemplateIdDirective,
    AccordionButtonDirective,
    CalloutComponent, AgGridModule, AgGridTableComponent, CommonModule, ModalComponent,
    DropdownComponent, DropdownItemDirective, DropdownMenuDirective, DropdownToggleDirective,
    NavComponent, NavItemComponent, NavLinkDirective,
    TabContentRefDirective, TabContentComponent, TabPaneComponent, DeployConfirmationComponent,
    RelativeTimePipe, LogViewerComponent],
  providers: [DeploymentsService],
  templateUrl: './deployment-releases.component.html',
  styleUrl: './deployment-releases.component.scss'
})
export class DeploymentReleasesComponent implements OnInit, OnDestroy {

  deploymentdetails: any;
  active: any = [];
  history: any = [];
  selectedHistoryId: string = '';
  steps: {
    title: string;
    status: 'success' | 'failed' | 'pending' | 'in-process' | 'paused';
    time: string;
    message?: string;
  }[] = [];

  showScrollToBottom = false;
  @ViewChild('logsModal') private logsModal!: ModalComponent;
  // @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLDivElement>;

  public logsModalConfig: any = {
    modalTitle: 'View log',
    width: '1150px',
    height: 'auto',
    hideDismissButton: () => true,
    hideCloseButton: () => false
  };

  isLightMode: boolean = false;
  openDropdown: 'active' | 'history' | null = null;
  realeseId: string = '';
  pageSize = 300;
  currentPage = 1;
  totalPages: number = 0
  deploymentLogs: { timestamp: string; message: string }[] = [];

  paginatedLogs: { timestamp: string; message: string }[] = [];
  firstLoadScrolled = false;
  activeTabIndex: number = 0;
  @Input() currentStatus: string = '';
  pagesArray: number[] = [];
  pageSizes: number[] = [200, 250, 300];
  itemsPerPage = 300;
  private destroy$ = new Subject<void>();
  selectedRelease: any;
  selectedReleaseDetails: any;
  deploymentId: string = '';
  releaseData: any;

  constructor(private deploymentService: DeploymentsService, private sharedService: SharedService,
    private toaster: ToastrService, private ac: ActivatedRoute,
    private modalService: NgbModal) { }



  ngOnInit(): void {
    // this.sharedService.deploymentData$.subscribe(data => {
    //   if (data) {
    //     this.deploymentdetails = data;
    //     this.getReleasesByDeploymentId();
    //   }
    // });
    this.ac.queryParams.pipe(takeUntil(this.destroy$),
      switchMap(params => {
        const depolyementId = params['id'];
        this.deploymentId = depolyementId;
        return this.deploymentService.getDeploymentById(depolyementId);
      })
    )
      .subscribe((res: any) => {
        this.deploymentdetails = res.data;
        this.getReleasesByDeploymentId();
      });
    this.sharedService.releaseStatus$
      .pipe(takeUntil(this.destroy$), skip(1))
      .subscribe(status => {
        if (status && status !== this.currentStatus) {
          this.getReleasesByDeploymentId();
        }
      });
  }

  onOptionSelected(selectedValue: string, realeseData: any, sectionName: string): void {

    this.realeseId = realeseData.id;
    this.selectedReleaseDetails = realeseData;
    // const moreOptions = event.target as HTMLSelectElement;
    // const selectedValue = moreOptions.value;
    this.onActionSelected(selectedValue, realeseData.id, sectionName);
    // if (selectedValue !== "three-dots") {
    //   moreOptions.options[0].text = '⋮';
    //   moreOptions.value = "three-dots";
    // }
  }

  onActionSelected(action: any, releaseId: string, sectionName: string): void {
    switch (action) {
      case 'view':
        this.viewDeploymentLogs(releaseId, sectionName);
        break;
      case 'redeploy':
        this.redeployDeployment();
        break;
      case 'pause':
        this.pauseDeployment();
        break;
      case 'resume':
        this.resumeDeployment();
    }
  }

  viewDeploymentLogs(releaseId: string, sectionName?: string): void {
    this.openModal();
    this.realeseId = releaseId;
    this.getLogData(0, 'build');
    // this.deploymentService.viewDeploymentLogs(releaseId).subscribe((res: any) => {
    //   if (res.status === "success") {
    //     this.deploymentLogs = res.data.map((line: any) => {
    //       const splitIndex = line.indexOf(' ');
    //       return {
    //         timestamp: line.slice(0, splitIndex),
    //         message: line.slice(splitIndex + 1)
    //       };
    //     });
    //     console.log(this.deploymentLogs)

    //   }
    // },
    //   err => {
    //     this.toaster.error('Error viewing deployment logs');
    //     console.error(err);
    //   });
  }

  redeployDeployment(): void {
    const req = {
      environmentId: JSON.parse(localStorage.getItem('environment') || '{}').id,
      name: this.deploymentdetails?.name,
      application: this.deploymentdetails?.application,
      sourceCode: this.deploymentdetails?.sourceCode,
      network: this.deploymentdetails?.network,
      config: this.deploymentdetails?.config,
      secret: this.deploymentdetails?.secret,
      environment: this.deploymentdetails?.environment,
    };
    const modalRef = this.modalService.open(DeployConfirmationComponent);
    modalRef.componentInstance.message = 'Are you sure you want to redeploy this deployment?';

    modalRef.result.then(
      (result) => {
        if (result) {
          this.deploymentService.updateDeployment(this.deploymentdetails?.id, req).subscribe((res: any) => {
            if (res.status.toLowerCase() === "success") {
              this.toaster.success(res.message);

            }
          },
            err => {
              this.toaster.error('Error redeploying deployment');
              console.error(err);
            });
        }
      });
  }

  pauseDeployment(): void {
    this.deploymentdetails.application.replicas = '0';
    const req = {
      environmentId: JSON.parse(localStorage.getItem('environment') || '{}').id,
      name: this.deploymentdetails?.name,
      application: this.deploymentdetails?.application,
      sourceCode: this.deploymentdetails?.sourceCode,
      network: this.deploymentdetails?.network,
      config: this.deploymentdetails?.config,
      secret: this.deploymentdetails?.secret,
      environment: this.deploymentdetails?.environment,
    };
    const modalRef = this.modalService.open(DeployConfirmationComponent);
    modalRef.componentInstance.message = 'Are you sure you want to pause this deployment?';

    modalRef.result.then(
      (result) => {
        if (result) {
          this.deploymentService.updateDeployment(this.deploymentdetails?.id, req).subscribe((res: any) => {
            if (res.status.toLowerCase() === "success") {
              this.toaster.success(res.message);
            }
          },
            err => {
              this.toaster.error('Error in pause deployment');
              console.error(err);
            });
        }
      });

  }

  resumeDeployment(): void {
    this.deploymentdetails.application.replicas = '1';
    const req = {
      environmentId: JSON.parse(localStorage.getItem('environment') || '{}').id,
      name: this.deploymentdetails?.name,
      application: this.deploymentdetails?.application,
      sourceCode: this.deploymentdetails?.sourceCode,
      network: this.deploymentdetails?.network,
      config: this.deploymentdetails?.config,
      secret: this.deploymentdetails?.secret,
      environment: this.deploymentdetails?.environment,
    };
    const modalRef = this.modalService.open(DeployConfirmationComponent);
    modalRef.componentInstance.message = 'Are you sure you want to resume this deployment?';

    modalRef.result.then(
      (result) => {
        if (result) {
          this.deploymentService.updateDeployment(this.deploymentdetails?.id, req).subscribe((res: any) => {
            if (res.status.toLowerCase() === "success") {
              this.toaster.success(res.message);
            }
          },
            err => {
              this.toaster.error('Error in resume deployment');
              console.error(err);
            });
        }
      });
  }

  getReleasesByDeploymentId(): void {
    this.deploymentService.getReleasesByDeploymentId(this.deploymentId).subscribe((res: any) => {
      [this.active, ...this.history] = res.data?.releases || [];
      this.deploymentService.getReleaseDataById(this.active.id).pipe(take(1)).subscribe((response: any) => {
        const status = response.data?.status;
        this.releaseData = response.data;

        const isBuilding = status === "Initiated" || status === "Building";
        const isPending = status === "Pending";
        const isBuildFailed = ["Build Failed", "Build Timeout", "Failed"].includes(status);
        const isDeploying = status === "Deploying";
        const isDeployFailed = ["Deploy Failed", "Deploy Timeout", "Create Job Failed"].includes(status);
        const isPaused = status === "Paused";

        const buildStatus = isPending ? "pending" : (isBuildFailed ? "failed" : "success");
        const deployStatus = isPaused
          ? "paused"
          : isPending
            ? "pending"
            : isDeployFailed
              ? "failed"
              : isBuildFailed || isBuilding
                ? "pending"
                : "success";

        this.steps = [
          {
            title: "Initiated",
            status: "success",
            time: this.active.createdAt,
            message: ""
          }
        ];

        // Conditionally add build step if not paused
        if (!isPaused) {
          const buildTime = new Date(this.active.updatedAt).toLocaleString();
          const initiatedTime = new Date(this.active.createdAt).toLocaleString();
          const buildDuration = this.getDuration(initiatedTime, buildTime);

          this.steps.push({
            title: isPending
              ? "Build : Pending"
              : isBuilding
                ? "Building..."
                : buildStatus === "success"
                  ? "Build : Passed"
                  : "Build › Build image",

            status: isPending ? "pending" : (isBuilding ? "in-process" : buildStatus),

            time: (isPending || isBuilding) ? "" : buildTime,

            message: isPending
              ? "Build is waiting to be scheduled."
              : isBuildFailed
                ? "Failed to build an image. Please check the build logs for more details."
                : `Duration: ${buildDuration}`
          });
        }

        const deployTime = this.active.updatedAt;
        const buildTime = this.active.updatedAt;
        const initiatedTime = this.active.createdAt;

        const deployDuration = (isPaused || isBuilding || isBuildFailed || isPending)
          ? ""
          : this.getDuration(buildTime, deployTime);

        // Always add deploy step
        this.steps.push({
          title: isPending
            ? "Deploy : Pending"
            : isDeploying
              ? "Deploying..."
              : deployStatus === "success"
                ? "Deploy : Passed"
                : deployStatus === "paused"
                  ? "Deploy: Paused"
                  : deployStatus === "failed"
                    ? "Deploy : Failed"
                    : "Deploy",

          status: isPending
            ? "pending"
            : isDeploying
              ? "in-process"
              : isPaused
                ? "paused"
                : isBuilding || isBuildFailed
                  ? "pending"
                  : deployStatus,

          time: (isBuilding || isBuildFailed || isPaused || isPending) ? "" : deployTime,

          message: isPending
            ? "Deployment is waiting to be scheduled."
            : isDeployFailed
              ? `Duration: ${deployDuration}` + "<br><br>" + "Failed to Deploy. Please check the build logs for more details."
              : isPaused
                ? "Deployment is currently paused."
                : (deployDuration ? `Duration: ${deployDuration}` : "")
        });
      });

    });
    //  time: this.getDuration(this.active.created_at, this.active.updated_at),
  }
  hasFailedStatus(): boolean {
    return this.steps.some(s => s.status === 'failed');
  }
  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      'Initiated': 'pending',
      'Building': 'in-process',
      'Deploying': 'success',
      'Active': 'success',
      'Running': 'success',
      'Paused': 'paused',
      'Superseded': 'paused',
      'Deploy Failed': 'failed',
      'Build Failed': 'failed',
      'Build Timeout': 'warning',
      'Deploy Timeout': 'warning',
      'Pending': 'warning',
      'Create Job Failed': 'danger',
    };
    return map[status] || 'Pending';
  }
  getIcons(status: string) {

    const map: Record<string, string> = {
      'Initiated': 'bi-check-circle-fill',
      'Building': 'bi-check-circle-fill',
      'Deploying': 'bi-check-circle-fill',
      'Active': 'bi-check-circle-fill',
      'Paused': 'bi-pause-circle-fill',
      'Superseded': 'bi-arrow-clockwise',
      'Deploy Failed': 'bi-x-circle-fill',
      'Build Failed': 'bi-x-circle-fill',
      'Build Timeout': 'bi-clock-history',
      'Deploy Timeout': 'bi-clock-history',
      'Running': 'bi-arrow-repeat',
      'Pending': 'bi-clock',
      'Create Job Failed': 'bi-x-circle-fill',
    };
    return map[status] || '';
  }

  getClassList(status: string): string {
    return `${this.getIcons(status)} ${this.getStatusClass(status)}`;
  }

  openModal() {
    this.activeTabIndex = 0;
    this.logsModal.open('right');
  }
  getLogData(index: number, type: string, resetPage: boolean = false) {
    this.activeTabIndex = index;
    if (resetPage) {
      this.currentPage = 1;
    }
    const environmentStr = localStorage.getItem('environment');
    const environmentId = environmentStr ? JSON.parse(environmentStr).id : '';
    const req = {
      environmentId: environmentId,
      logType: 'job',
      name: this.selectedReleaseDetails.jobName,
      page: this.currentPage,
      limit: this.pageSize,
    };
    if (type && this.realeseId) {
      this.deploymentService.getSelectedDeploymentLogs(req).subscribe((res: any) => {
        if (res.status.toLowerCase() === 'success') {
          this.deploymentLogs = res.logs.map((line: any) => {
            const splitIndex = line.indexOf(' ');
            return {
              timestamp: line.slice(0, splitIndex),
              message: line.slice(splitIndex + 1)
            };
          });
          this.totalPages = res?.totalPages ?? 0;
          // this.pagesArray = Array.from({ length: this.totalPages }, (_, i) => i + 1);
          // this.updatePaginatedLogs();
        } else {
          this.toaster.error(res.message);
        }
      })

    } else {
      this.toaster.error('Invalid release ID or type');
    }
  }
  toggleMode(event: Event) {
    this.isLightMode = !this.isLightMode;
  }

  toggleDropdown(source: 'active' | 'history', event: MouseEvent): void {
    event.stopPropagation();
    this.openDropdown = this.openDropdown === source ? null : source;
  }

  @HostListener('document:click')
  onOutsideClick(): void {
    this.openDropdown = null;
  }

  // get totalPages(): number {
  //   return Math.ceil(this.deploymentLogs.length / this.pageSize);
  // }

  updatePaginatedLogs(): void {
    const end = this.currentPage * this.pageSize;
    this.paginatedLogs = this.deploymentLogs.slice(0, end);
  }
  onScroll(event: Event): void {
    const target = event.target as HTMLElement;

    const threshold = 150;
    const position = target.scrollTop + target.clientHeight;
    const height = target.scrollHeight;

    if (height - position < threshold && this.currentPage < this.totalPages) {
      this.currentPage++;
      // this.updatePaginatedLogs();
    }
  }
  // previousPage(): void {
  //   if (this.currentPage > 1) {
  //     this.currentPage--;
  //     this.updatePaginatedLogs();
  //   }
  // }

  // nextPage(): void {
  //   if (this.currentPage < this.totalPages) {
  //     this.currentPage++;
  //     this.updatePaginatedLogs();
  //   }
  // }
  getDuration(start: string, end: string): string {
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    const durationInSeconds = Math.floor((endTime - startTime) / 1000);
    const hours = Math.floor(durationInSeconds / 3600);
    const minutes = Math.floor((durationInSeconds % 3600) / 60);
    const seconds = durationInSeconds % 60;
    const parts: string[] = [];
    if (hours > 0) {
      parts.push(`${hours}h`);
    }
    if (minutes > 0 || hours > 0) {
      parts.push(`${minutes}m`);
    }
    parts.push(`${seconds}s`);

    return parts.join(' ');
  }

  // scrollToTop(): void {
  //   this.scrollContainer.nativeElement.scrollTo({
  //     top: 0,
  //     behavior: 'smooth'
  //   });
  // }

  // scrollToBottom(): void {
  //   const container = this.scrollContainer.nativeElement;
  //   container.scrollTo({
  //     top: container.scrollHeight,
  //     behavior: 'smooth'
  //   });
  // }
  // scrollToend(): void {
  //   const container = this.scrollContainer.nativeElement;

  //   const loadNext = () => {
  //     if (this.currentPage < this.totalPages) {
  //       this.currentPage++;
  //       this.updatePaginatedLogs();

  //       setTimeout(() => {
  //         container.scrollTo({
  //           top: container.scrollHeight,
  //           behavior: 'smooth'
  //         });

  //         loadNext();
  //       }, 300);
  //     } else {
  //       setTimeout(() => {
  //         container.scrollTo({
  //           top: container.scrollHeight,
  //           behavior: 'smooth'
  //         });
  //       }, 100);
  //     }
  //   };

  //   loadNext();
  // }


  getLogsInfo(realeseData: any, index: number) {
    this.realeseId = realeseData.id;
    this.selectedReleaseDetails = realeseData;
    this.openModal();
    if (index === 1) {
      this.selectedRelease = realeseData?.build_job_name;
      this.getLogData(0, 'build', true);
    } else {
      this.selectedRelease = realeseData?.deploy_job_name;
      this.getLogData(1, 'deploy', true);
    }
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.getLogData(this.activeTabIndex, this.activeTabIndex === 0 ? 'build' : 'deploy');
    }
  }

  onPageSizeChange(event: any, type: string) {
    this.currentPage = event.currentPage;
    this.pageSize = event.itemsPerPage;
    this.getLogData(this.activeTabIndex, type);
  }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
