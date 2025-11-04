import { CommonModule, Location } from '@angular/common';
import { Component, EventEmitter, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { CardBodyComponent, CardComponent, CardGroupComponent, NavComponent, NavItemComponent, NavLinkDirective, TabContentComponent, TabContentRefDirective, TabPaneComponent } from '@coreui/angular';
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
import { Observable, Subject, Subscription, switchMap, takeUntil } from 'rxjs';
import { DeploymentsService } from '../deployment.service';
import { ToastrService } from 'ngx-toastr';
import { SharedService } from '../../../shared/services/shared.service';
import { SHARED_IMPORTS } from '../../../shared/shared-imports';



@Component({
  selector: 'app-deployment-details',
  standalone: true,
  imports: [SHARED_IMPORTS,
    DeploymentReleasesComponent, DeploymentSettingsComponent,
    DeploymentSecretsComponent, DeploymentConfigMapsComponent, EnvironmentVariablesComponent,
    DeploymentMetricsComponent, DeploymentObservabilityComponent, DeploymentNetworkingComponent],
  providers: [DeploymentsService],
  templateUrl: './deployment-details.component.html',
  styleUrl: './deployment-details.component.scss'
})
export class DeploymentDetailsComponent implements OnInit, OnDestroy {
  @Output() closeModalEvent = new EventEmitter<void>();
  selectedTabIndex = 0;
  private destroy$ = new Subject<void>();
  deploymentId: string = '';
  @ViewChild(EnvironmentVariablesComponent) envVarChild!: EnvironmentVariablesComponent;
  @ViewChild(DeploymentConfigMapsComponent) configMapChild!: DeploymentConfigMapsComponent;
  lastReleaseStatus: string = '';

  private wsSubscription!: Subscription;
  messages: any[] = [];
  appName: string = '';

  constructor(private router: Router, private modalService: NgbModal, private sharedService: SharedService,
    private layoutActionService: LayoutActionService, private deploymentService: DeploymentsService, private location: Location,
    private activateRoute: ActivatedRoute, private toastr: ToastrService) { }

  ngOnInit(): void {

    this.activateRoute.queryParams.pipe(takeUntil(this.destroy$),
      switchMap(params => {
        if (params['id'] != undefined) {
          this.deploymentId = params['id'];
          this.selectedTabIndex = Number(params['tabIndex']) || 0;
          return this.deploymentService.getDeploymentById(this.deploymentId);
        }
        return [];
      }))
      .subscribe((data: any) => {
        this.appName = data?.data.name;
        if (data.status.toLowerCase() === 'success') {
          this.deploymentService.getReleasesByDeploymentId(this.deploymentId).subscribe((res: any) => {
            const releaseData = res?.data?.releases[0];
            this.sharedService.setlastReleaseStatus(releaseData.status);
            this.lastReleaseStatus = this.sharedService.getlastReleaseStatus() ?? '';
          });
        }
        this.layoutActionService.setExtraTitle(`${data.data.name} (${data.data.status})`);
      });
    this.activateRoute.fragment.subscribe((fragment: string | null) => {
      if (fragment === 'network-section') {
        this.onTabChange(7)
      }
    });

    this.sharedService.releaseStatus$.subscribe(status => {
      this.lastReleaseStatus = status ?? '';
    });
    this.layoutActionService.actionClick$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.onLayoutButtonClick();
      });
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
      this.envVarChild.createEnvironmentVariable()
    }
    if (this.selectedTabIndex === 3) {
      this.configMapChild.updateConfigFile()
    }
    if (this.selectedTabIndex < 4) {
      this.selectedTabIndex++;
    }

  }
  goBack() {
    this.router.navigate(['/deployment'])
  }
  onLayoutButtonClick() {
    const modalRef = this.modalService.open(ConfirmationModalComponent);
    modalRef.componentInstance.selectedItem = 'Deployment';
    modalRef.componentInstance.message = 'Are you sure you want to proceed?';

    modalRef.result.then(
      (result) => {
        if (result) {
          this.deploymentService.deleteDeployment(this.deploymentId).subscribe((res: any) => {
            if (res.status.toLowerCase() === 'success') {
              this.toastr.success('Deployment deleted successfully');
              this.router.navigate(['/deployment']);
            }
          });
        } else {
          console.log('Cancelled delete deployment!');
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.layoutActionService.clearExtraTitle();
  }
}
