import { CommonModule, Location } from '@angular/common';
import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Subject, switchMap, takeUntil } from 'rxjs';
import { SharedService } from '../../../shared/services/shared.service';
import { LayoutActionService } from '../../../shared/services/layout-action.service';
import { ToastrService } from 'ngx-toastr';
import { ConfirmationModalComponent } from '../../../shared/components/modal/confirmation-modal/confirmation-modal.component';
import { NavComponent, NavItemComponent, NavLinkDirective, TabContentComponent, TabContentRefDirective, TabPaneComponent } from '@coreui/angular';
import { DeploymentsService } from '../../deployments/deployment.service';
import { DeploymentObservabilityComponent } from '../deployment-observability/deployment-observability.component';
import { DeploymentMetricsComponent } from '../deployment-metrics/deployment-metrics.component';
import { DeploymentNetworkingComponent } from '../deployment-networking/deployment-networking.component';
import { DeploymentSettingsComponent } from '../deployment-settings/deployment-settings.component';

@Component({
  selector: 'app-deployment-details',
  templateUrl: './deployment-details.component.html',
  styleUrls: ['./deployment-details.component.scss'],
  standalone: true,
  imports: [CommonModule,
    NavComponent, NavItemComponent, NavLinkDirective, TabContentRefDirective,
    TabContentComponent, TabPaneComponent, DeploymentObservabilityComponent, DeploymentMetricsComponent,
  DeploymentNetworkingComponent, DeploymentSettingsComponent, ],
  providers: [DeploymentsService]
})
export class DeploymentDetailsComponent implements OnInit, OnDestroy {
  @Output() closeModalEvent = new EventEmitter<void>();
  selectedTabIndex = 0;
  private destroy$ = new Subject<void>();
  deploymentId: string = '';
  lastReleaseStatus: string = '';

  messages: any[] = [];
  appName: string = '';

  constructor(private router: Router, private modalService: NgbModal, private sharedService: SharedService,
    private layoutActionService: LayoutActionService, private location: Location,
    private activateRoute: ActivatedRoute, private toastr: ToastrService, private deploymentService: DeploymentsService) { }

  ngOnInit(): void {

    this.activateRoute.queryParams.pipe(takeUntil(this.destroy$),
      switchMap(params => {
        if (params['id'] != undefined) {
          this.deploymentId = params['id'];
          this.selectedTabIndex = Number(params['tabIndex']) || 0;
          return this.deploymentService.getDeploymentById(this.deploymentId);
          return '';
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
        // this.onNewMessage().subscribe((msg: any) => {
        //   const res = JSON.parse(msg);
        //   console.log(res)
        //   if (res && res.deployment_id === this.deploymentId) {
        //     this.sharedService.setlastReleaseStatus(res.status);
        //     console.log(res.status)
        //   }
        // })

      });
    this.activateRoute.fragment.subscribe((fragment: string | null) => {
      if (fragment === 'network-section') {
        this.onTabChange(7)
      }
    });

    this.sharedService.releaseStatus$.subscribe(status => {
      this.lastReleaseStatus = status ?? '';
    });


    // this.onTabChange(4);

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
      // this.child.createEnvironmentVariable()
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
          // this.deploymentService.deleteDeployment(this.deploymentId).subscribe((res: any) => {
          //   if (res.status.toLowerCase() === 'success') {
          //     this.toastr.success('Deployment deleted successfully');
          //     this.router.navigate(['/deployment']);
          //   }
          // });
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
