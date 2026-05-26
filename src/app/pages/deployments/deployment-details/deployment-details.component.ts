import { Location } from '@angular/common';
import {
  Component,
  EventEmitter,
  HostListener,
  OnDestroy,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import { DeploymentConfigMapsComponent } from '../deployment-config-maps/deployment-config-maps.component';
import { DeploymentReleasesComponent } from '../deployment-releases/deployment-releases.component';
import { DeploymentSecretsComponent } from '../deployment-secrets/deployment-secrets.component';
import { DeploymentSettingsComponent } from '../deployment-settings/deployment-settings.component';
import { DeploymentMetricsComponent } from '../deployment-metrics/deployment-metrics.component';
import { DeploymentObservabilityComponent } from '../deployment-observability/deployment-observability.component';
import { DeploymentNetworkingComponent } from '../deployment-networking/deployment-networking.component';
import { EnvironmentVariablesComponent } from '../environment-variables/environment-variables.component';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfirmationModalComponent } from '../../../shared/components/modal/confirmation-modal/confirmation-modal.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { LayoutActionService } from '../../../shared/services/layout-action.service';
import {
  Subject,
  Subscription,
  switchMap,
  takeUntil
} from 'rxjs';
import { DeploymentsService } from '../deployment.service';
import { DeploymentsService as SharedDeploymentsService } from '../../../shared/services/deployments.service';
import { ToastrService } from 'ngx-toastr';
import { SharedService } from '../../../shared/services/shared.service';
import { SHARED_IMPORTS } from '../../../shared/shared-imports';
import { DeployConfirmationComponent } from '../../../shared/components/deploy-confirmation/deploy-confirmation.component';

@Component({
  selector: 'app-deployment-details',
  standalone: true,
  imports: [
    SHARED_IMPORTS,
    DeploymentReleasesComponent,
    DeploymentSettingsComponent,
    DeploymentSecretsComponent,
    DeploymentConfigMapsComponent,
    EnvironmentVariablesComponent,
    DeploymentMetricsComponent,
    DeploymentObservabilityComponent,
    DeploymentNetworkingComponent
  ],
  providers: [DeploymentsService],
  templateUrl: './deployment-details.component.html',
  styleUrl: './deployment-details.component.scss'
})
export class DeploymentDetailsComponent implements OnInit, OnDestroy {

  @Output() closeModalEvent = new EventEmitter<void>();

  @ViewChild(EnvironmentVariablesComponent) envVarChild!: EnvironmentVariablesComponent;
  @ViewChild(DeploymentSecretsComponent) secretsChild!: DeploymentSecretsComponent;
  @ViewChild(DeploymentConfigMapsComponent) configMapChild!: DeploymentConfigMapsComponent;

  selectedTabIndex = 0;
  deploymentId = '';
  appName = '';
  deploymentdetails: any;
  lastReleaseData: any = null;
  forceDisableInputs = false;
  isPauseResumeDisabled = false;

  private destroy$ = new Subject<void>();
  private subscription?: Subscription;


  private sseSub?: Subscription;
  private statusSseSub?: Subscription;
  private tabHiddenAt: number | null = null;
  private readonly IDLE_THRESHOLD = 60 * 1000;
  private statusPollInterval?: any;

  constructor(
    private router: Router,
    private modalService: NgbModal,
    private sharedService: SharedService,
    private layoutActionService: LayoutActionService,
    private deploymentService: DeploymentsService,
    private sharedDeploymentService: SharedDeploymentsService,
    private location: Location,
    private activateRoute: ActivatedRoute,
    private toastr: ToastrService,
  ) {}

  ngOnInit(): void {

    this.activateRoute.queryParams
      .pipe(
        takeUntil(this.destroy$),
        switchMap(params => {
          if (params['id'] !== undefined) {
            this.deploymentId = params['id'];
            this.selectedTabIndex = Number(params['tabIndex']) || 0;
            this.forceDisableInputs = this.sharedService.getOptimisticDeploymentDisabled(this.deploymentId);
            return this.deploymentService.getDeploymentById(this.deploymentId);
          }
          return [];
        })
      )
      .subscribe((data: any) => {
        this.appName = data?.data?.name;

        if (data?.status?.toLowerCase() === 'success') {
          this.deploymentdetails = data.data;
          if (this.forceDisableInputs) {
            this.sharedService.clearOptimisticDeploymentDisabled(this.deploymentId);
          }
          this.startSSE();
          this.getDeploymentStatus();
          this.startStatusPolling();
        }

        this.layoutActionService.setExtraTitle(
          `${data.data.name} (${data.data.status})`
        );
        this.updateLayoutActionState();
      });

    this.activateRoute.fragment.subscribe((fragment: string | null) => {
      if (fragment === 'network-section') {
        this.onTabChange(7);
      }
    });

    this.sharedService.releaseStatus$
      .pipe(takeUntil(this.destroy$))
      .subscribe(status => {
        this.lastReleaseData = status ?? [];
      });

    this.layoutActionService.actionClick$
      .pipe(takeUntil(this.destroy$))
      .subscribe((action) => {
        switch (String(action || '').toLowerCase()) {
          case 'redeploy':
            this.redeployApplication();
            return;
          case 'pauseresume':
            this.pauseResumeApplication();
            return;
          default:
            this.onLayoutButtonClick();
        }
      });

    this.subscription = this.sharedService.envValueChange$.subscribe(() => {
      this.router.navigate(['/applications']);
    });
  }


  @HostListener('document:visibilitychange')
  onVisibilityChange() {
    if (document.hidden) {
      this.tabHiddenAt = Date.now();
      this.stopSSE();
      // this.stopStatusPolling();
    } else {
      if (
        this.tabHiddenAt &&
        Date.now() - this.tabHiddenAt >= this.IDLE_THRESHOLD
      ) {
        this.restartSSE();
        this.startStatusPolling();
      }
      this.tabHiddenAt = null;
    }
  }


  private startSSE() {
    if (this.sseSub || !this.deploymentId) return;

    this.sseSub = this.deploymentService
      .liveReleaseStatus(this.deploymentId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          const releaseData = res?.releases?.releases;
          this.sharedService.setlastReleaseData(releaseData);
          this.lastReleaseData = this.sharedService.getlastReleaseData() ?? [];
        },
        error: () => {
          this.stopSSE();
        }
      });
  }

  private stopSSE() {
    if (this.sseSub) {
      this.sseSub.unsubscribe();
      this.sseSub = undefined;
    }
  }

  private restartSSE() {
    this.stopSSE();
    this.startSSE();
  }

  private getDeploymentStatus() {
    if (!this.deploymentId || this.statusSseSub) return;

    const envId = localStorage.getItem('environment');
    if (!envId) return;

    const envObj = JSON.parse(envId);
    const req = {
      "environmentId": envObj.id,
      "workloadIds": [this.deploymentId],
      "type": "application"
    };

    this.statusSseSub = this.deploymentService.getDeploymentStatus(req).subscribe({
      next: (res: any) => {
        if (res && Array.isArray(res.data) && res.data.length > 0) {
          const statusItem = res.data.find((item: any) => item.deploymentId === this.deploymentId || item.id === this.deploymentId);
          if (statusItem && this.deploymentdetails) {
            const newStatus = statusItem.status === 'UNKNOWN' ? 'Not Available' : (statusItem.status || 'not available');
            if (this.deploymentdetails.status !== newStatus) {
              this.deploymentdetails.status = newStatus;
              this.layoutActionService.setExtraTitle(
                `${this.deploymentdetails.name} (${newStatus})`
              );
              this.updateLayoutActionState();
            }
          }
        }
      },
      error: (err: any) => {
        console.error('Error fetching deployment status', err);
      }
    });
  }

  private startStatusPolling() {
    // SSE now handles continuous status updates
    this.getDeploymentStatus();
  }

  private stopStatusPolling() {
    if (this.statusPollInterval) {
      clearInterval(this.statusPollInterval);
      this.statusPollInterval = undefined;
    }
    if (this.statusSseSub) {
      this.statusSseSub.unsubscribe();
      this.statusSseSub = undefined;
    }
  }

  onTabChange(event: number) {
    this.selectedTabIndex = event;

    const queryParams = { ...this.activateRoute.snapshot.queryParams };
    delete queryParams['tabIndex'];

    const currentPath = this.router.url.split('?')[0];
    const queryString = new URLSearchParams(queryParams).toString();

    this.location.replaceState(
      queryString ? `${currentPath}?${queryString}` : currentPath
    );
  }

  onCloseClicked() {
    this.closeModalEvent.emit();
  }

  goToNextTab(): void {
    if (this.selectedTabIndex === 1) {
      this.envVarChild.savePendingFormData();
      this.envVarChild.createEnvironmentVariable();
    }
    if (this.selectedTabIndex === 2) {
      this.secretsChild.savePendingFormData();
      this.secretsChild.createSecretVariable();
    }
    if (this.selectedTabIndex === 3) {
      this.configMapChild.updateConfigFile();
    }
    // if (this.selectedTabIndex < 4) {
    //   this.selectedTabIndex++;
    // }
  }

  goBack() {
    this.router.navigate(['/applications']);
  }

  onLayoutButtonClick() {
    const modalRef = this.modalService.open(ConfirmationModalComponent);
    modalRef.componentInstance.selectedItem = 'Deployment';
    modalRef.componentInstance.message = 'Are you sure you want to proceed?';
    modalRef.componentInstance.requireConfirmation = true;
    modalRef.componentInstance.confirmationWord = this.appName || 'the deployment';

    modalRef.result.then(result => {
      if (result) {
        this.deploymentService
          .deleteDeployment(this.deploymentId)
          .subscribe((res: any) => {
            if (res.status.toLowerCase() === 'success') {
              this.toastr.success('Application deleted successfully');
              this.router.navigate(['/applications']);
            }
          });
      }
    });
  }

  private updateLayoutActionState(): void {
    this.layoutActionService.setActionState({
      sourceType: this.deploymentdetails?.sourceCode?.type || '',
      pauseResumeDisabled: this.isPauseResumeDisabled
    });
  }

  redeployApplication(): void {
    if (!this.deploymentdetails?.id) return;
    if (this.deploymentdetails?.sourceCode?.type === 'file') {
      return;
    }

    const modalRef = this.modalService.open(DeployConfirmationComponent);
    modalRef.componentInstance.message = 'Are you sure you want to redeploy this application?';

    modalRef.result.then(result => {
      if (!result) return;

      this.sharedDeploymentService
        .updateDeployment(this.deploymentdetails.id, { sourceCode: this.deploymentdetails?.sourceCode })
        .subscribe({
          next: (res: any) => {
            if (res.status?.toLowerCase() === 'success') {
              this.toastr.success('Redeploy initiated');
            }
          },
          error: () => {
            this.toastr.error('Error redeploying application');
          }
        });
    });
  }

  pauseResumeApplication(): void {
    if (!this.deploymentdetails?.id) return;

    const currentStatus = String(this.deploymentdetails?.status || '').toLowerCase();
    const type = currentStatus === 'stopped' || currentStatus === 'paused' ? 'Resume' : 'Pause';
    const req = {
      action: type === 'Pause' ? 'pause' : 'resume',
    };

    const modalRef = this.modalService.open(DeployConfirmationComponent);
    modalRef.componentInstance.message = `Are you sure you want to ${type} this Application?`;

    modalRef.result.then(result => {
      if (!result) return;

      this.isPauseResumeDisabled = true;
      this.updateLayoutActionState();
      this.sharedService.setOptimisticDeploymentDisabled(this.deploymentdetails.id, type === 'Pause');
      this.sharedDeploymentService.updateDeployment(this.deploymentdetails.id, req).subscribe({
        next: (res: any) => {
          if (res.status?.toLowerCase() === 'success') {
            this.toastr.success(`Application ${type === 'Pause' ? 'paused' : 'resumed'} successfully`);
          }
          setTimeout(() => {
            this.isPauseResumeDisabled = false;
            this.updateLayoutActionState();
          }, 10000);
        },
        error: () => {
          this.sharedService.clearOptimisticDeploymentDisabled(this.deploymentdetails.id);
          this.toastr.error(`Error in ${type} application`);
          this.isPauseResumeDisabled = false;
          this.updateLayoutActionState();
        }
      });
    });
  }

  ngOnDestroy(): void {
    this.stopSSE();
    this.stopStatusPolling();
    this.destroy$.next();
    this.destroy$.complete();
    this.layoutActionService.clearExtraTitle();
    this.layoutActionService.clearActionState();
    this.subscription?.unsubscribe();
  }
}
