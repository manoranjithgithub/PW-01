import { Component, HostListener, Input, OnDestroy, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import {
  AccordionButtonDirective,
  AccordionComponent,
  AccordionItemComponent,
  TemplateIdDirective,
  CalloutComponent,
} from '@coreui/angular';
import { DeploymentsService } from '../deployment.service';
import { ToastrService } from 'ngx-toastr';
import { CommonModule } from '@angular/common';
import { SharedService } from '../../../shared/services/shared.service';
import { ActivatedRoute } from '@angular/router';
import { ModalComponent } from '../../../shared/components/model/model.component';
import { DeployConfirmationComponent } from '../../../shared/components/deploy-confirmation/deploy-confirmation.component';
import { RelativeTimePipe } from '../../../shared/pipes/relative-time.pipe';
import { LogViewerComponent } from '../../../shared/components/log-viewer/log-viewer.component';
import { interval, skip, Subject, switchMap, take, takeUntil, takeWhile, tap } from 'rxjs';

@Component({
  selector: 'app-deployment-releases',
  standalone: true,
  imports: [AccordionComponent,
    AccordionItemComponent,
    TemplateIdDirective,
    AccordionButtonDirective,
    CalloutComponent, CommonModule, ModalComponent, DeployConfirmationComponent,
    RelativeTimePipe, LogViewerComponent],
  providers: [DeploymentsService],
  templateUrl: './deployment-releases.component.html',
  styleUrl: './deployment-releases.component.scss'
})
export class DeploymentReleasesComponent implements OnInit, OnDestroy {

  @Input() deploymentdetails: any;
  active: any = [];
  history: any = [];
  steps: {
    title: string;
    status: 'success' | 'failed' | 'pending' | 'in-process' | 'paused';
    time: string;
    message?: string;
  }[] = [];

  @ViewChild('logsModal') private logsModal!: ModalComponent;

  public logsModalConfig: any = {
    modalTitle: 'View log',
    width: '1250px',
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
    private toaster: ToastrService, private ac: ActivatedRoute, private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.ac.queryParams.pipe(
      takeUntil(this.destroy$)).subscribe(params => {
        const depolyementId = params['id'];
        this.deploymentId = depolyementId;
      });

    this.sharedService.releaseStatus$.subscribe(res => {
      if (res) {
        this.getReleasesByDeploymentId(res);
      }
    })

  }

  onOptionSelected(realeseData: any, sectionName: string): void {
    this.realeseId = realeseData.id;
    this.selectedReleaseDetails = realeseData;
    this.currentPage = 1;
    this.getLogData('build');
    this.logsModal.open('right');
  }

  getReleasesByDeploymentId(res: any): void {
    if (!res || res.length === 0) return;
    
    [this.active, ...this.history] = res;
    this.releaseData = this.active;
    this.updateSteps(this.active);
    this.cdr.detectChanges();
  }
  hasFailedStatus(): boolean {
    return this.steps.some(s => s.status === 'failed');
  }

  getClassList(status: string): string {
    const meta = this.sharedService.getStatusMeta(status);
    return `${meta.icon} ${meta.statusClass}`;
  }

  getProviderName(gitUrl: string): string {
    if (!gitUrl) return 'vcs';
    
    try {
      const urlLower = gitUrl.toLowerCase();
      if (urlLower.includes('github.com')) return 'GitHub';
      if (urlLower.includes('gitlab.com')) return 'GitLab';
      return 'vcs';
    } catch {
      return 'vcs';
    }
  }

  getLogData(type: string, resetPage: boolean = false) {
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
          this.deploymentLogs = res.data?.logs.map((line: any) => {
            const splitIndex = line.indexOf(' ');
            return {
              timestamp: line.slice(0, splitIndex),
              message: line.slice(splitIndex + 1)
            };
          });
          this.totalPages = res.data?.totalPages ?? 0;
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

  getDuration(start: string, end: string): string {
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    const durationInSeconds = Math.floor((endTime - startTime) / 1000) || 0;
    const hours = Math.floor(durationInSeconds / 3600) || 0;
    const minutes = Math.floor((durationInSeconds % 3600) / 60) || 0;
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

  onPageSizeChange(event: any, type: string) {
    this.currentPage = event.currentPage;
    this.pageSize = event.itemsPerPage;
    this.getLogData(type);
  }
  updateSteps(responseData: any) {
    const status = responseData?.status?.toLowerCase();
    this.releaseData = responseData;
    this.currentStatus = responseData?.status;

    const isBuilding = status === "initiated" || status === "building";
    const isPending = status === "pending";
    const isBuildFailed = ["build failed", "build timeout", "failed"].includes(status);
    const isDeploying = status === "deploying";
    const isDeployFailed = ["deploy failed", "deploy timeout", "create job failed"].includes(status);
    const isPaused = status === "paused";

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

    if (!isPaused && responseData.jobMode === 'BUILD_AND_DEPLOY') {
      const buildTime = this.active.buildStartedAt;
      const initiatedTime = this.active.createdAt;

      this.steps.push({
        title: isPending
          ? "Build : Pending"
          : isBuilding
            ? "Building..."
            : buildStatus === "success"
              ? "Build : Passed"
              : "Build › Build image",

        status: isPending ? "pending" : (isBuilding ? "in-process" : buildStatus),
        time: (isPending || isBuilding) ? initiatedTime : buildTime,

        message: isPending
          ? "Build is waiting to be scheduled."
          : isBuildFailed
            ? "Failed to build an image. Please check the build logs for more details."
            : ""
      });
    }

    const deployTime = this.active.updatedAt;

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
          ? "Failed to Deploy. Please check logs."
          : isPaused
            ? "Deployment is currently paused."
            : ""
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
