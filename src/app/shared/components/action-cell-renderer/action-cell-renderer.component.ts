import { CommonModule } from '@angular/common';
import { Renderer2, Component, ElementRef, ViewChild, HostListener } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ConfirmationModalComponent } from '../modal/confirmation-modal/confirmation-modal.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DeploymentsService } from '../../services/deployments.service';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { SharedService } from '../../services/shared.service';
import { ModalComponent } from '../model/model.component';
import { FormsModule, NgModel } from '@angular/forms';
import {
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
  TabPaneComponent,
  TabsModule
} from '@coreui/angular';
import { DeployConfirmationComponent } from '../deploy-confirmation/deploy-confirmation.component';

@Component({
  selector: 'app-action-cell-renderer',
  imports: [
    CommonModule,
    ModalComponent,
    FormsModule,
    DropdownComponent,
    DropdownItemDirective,
    DropdownMenuDirective,
    DropdownToggleDirective,
    NavComponent,
    NavItemComponent,
    NavLinkDirective,
    TabContentRefDirective,
    TabContentComponent,
    TabPaneComponent,
    CalloutComponent,
    TabsModule
  ],
  providers: [DeploymentsService],
  standalone: true,
  templateUrl: './action-cell-renderer.component.html',
  styleUrl: './action-cell-renderer.component.scss',
})
export class ActionCellRendererComponent implements ICellRendererAngularComp {

  params: any;
  additionalParam: string = '';
  envId: string = '';
  replicaCount: number = 0;
  toolName: any;
  toolsDetails: any;
  realeseId: string = '';
  currentPage = 1;
  pageSize = 30;
  deploymentId: any;
  openDropdown: 'active' | 'history' | null = null;
  active: any = [];
  history: any = [];
  public isLightMode: boolean = true;
  deploymentLogs: { timestamp: string; message: string }[] = [];
  paginatedLogs: { timestamp: string; message: string }[] = [];
  activeTabIndex: number = 0;
  isDropdownOpen = false;

  @ViewChild('scaleDeploymentsModel') private scaleDeploymentsModel!: ModalComponent;
  @ViewChild('logsModal') private logsModal!: ModalComponent;
  @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLDivElement>;
  // menu viewChild refs not required for positioning; using fixed coords
  dropdownStyle: any = {};
  private lastButtonRef?: HTMLElement | null = null;

  public scaleDeploymentsModelConfig: any = {
    modalTitle: 'Scale Deployment',
    width: '500px',
    height: '1500px',
    hideDismissButton: () => true,
    hideCloseButton: () => true
  };

  public logsModalConfig: any = {
    modalTitle: 'View log',
    width: '1150px',
    height: 'auto',
    hideDismissButton: () => true,
    hideCloseButton: () => false
  };

  constructor(private el: ElementRef, private renderer: Renderer2, private modalService: NgbModal,
    private http: DeploymentsService, private route: Router, private toaster: ToastrService,
    private sharedService: SharedService,
  ) {
    // const storedValue = this.sharedService.getCookie('environment');
    const storedValue = localStorage.getItem('environment');
    if (storedValue) {
      this.envId = JSON.parse(storedValue).id;
    }
  }

  agInit(params: any): void {
    this.params = params;
    this.additionalParam = params.additionalParam;
  }

  refresh(params: any): boolean {
    this.params = params;
    return true;
  }

  onOptionSelected(action: string): void {
    this.isDropdownOpen = false;
    this.onActionSelected(action);
  }

  onActionSelected(action: string): void {
    switch (action) {
      case 'edit':
        this.edit(this.params.data);
        break;
      case 'delete':
        this.delete(this.params.data);
        break;
      case 'view':
        this.view(this.params.data);
        break;
      case 'redeploy':
        this.restart(this.params.data);
        break;
      case 'Pause':
        this.pause(this.params.data, 'Pause');
        break;
      case 'Resume':
        this.pause(this.params.data, 'Resume');
        break;
    }
  }

  viewLogs() {
    //  this.showDeploymentView(this.params.data)
    const data = this.params.data;
    if (this.additionalParam === 'llm') {
      this.route.navigate(['/llm/deployment-details'], { queryParams: { id: data.id, tabIndex: 1 } });

    } else if (this.additionalParam === 'deployment') {
      this.route.navigate(['/deployment/deployment-details'], { queryParams: { id: data.id, tabIndex: 5 } });
    }
  }


  edit(data: any) {
    if (this.additionalParam === "deployment") {
      this.route.navigate(['/edit-deployment'], { queryParams: { id: data.name } });
    }
    if (this.additionalParam === "tools") {
      this.route.navigate(['/tools/edit-tool'], { queryParams: { selectedEdit: data.name } });
    }
  }

  delete(data: any) {
    this.toolsDetails = data;
    this.envId = this.toolsDetails.namespace;
    this.toolName = this.toolsDetails.name;
    this.openConfirmationDialog();
  }

  scale(data: any) {
    this.scaleDeploymentsModel.open();
    if (this.additionalParam === "deployment") {
      const req = this.params.data;
      this.replicaCount = req.replicas;
    }
  }
  pause(data: any, type: string) {
    if (this.additionalParam === "deployment" || this.additionalParam === "llm") {
      const req = {
        application: {
          replicas: type === 'Pause' ? '0' : '1'
        },
      };
      //  const req = {
      //   action: type === 'Pause' ? 'pause' : 'resume',
      // };
      const modalRef = this.modalService.open(DeployConfirmationComponent);
      modalRef.componentInstance.message = `Are you sure you want to ${type} this deployment?`;

      modalRef.result.then(
        (result) => {
          if (result) {
            this.http.updateDeployment(data?.id, req).subscribe((res: any) => {
              if (res.status.toLowerCase() === "success") {
                this.toaster.success('Successfully initiated');
              }
            },
              err => {
                this.toaster.error(`Error in ${type} deployment`);
                console.error(err);
              });
          }
        });
    }
  }

  scaleDeployment() {
    const data = {
      data: {
        replicas: this.replicaCount
      }
    }
    // this.http.updateDeployment(this.envId, this.params.data.name, data).subscribe((res: any) => {
    //   if (res.success) {
    //     this.toaster.success('Successfully scaled');
    //     this.closeModal();
    //   }
    // });
  }


  restart(data: any) {
    console.log(data)
    if (this.additionalParam === "deployment" || this.additionalParam === "llm") {
      const req = this.params.data;
      const modalRef = this.modalService.open(DeployConfirmationComponent);
      modalRef.componentInstance.message = 'Are you sure you want to redeploy this deployment?';

      modalRef.result.then(
        (result) => {
          if (result) {
            this.http.updateDeployment(req.id, { sourceCode: req?.sourceCode }).subscribe((res: any) => {
              if (res.status.toLowerCase() === "success") {
                this.toaster.success('Redeploy initiated');

              }
            },
              err => {
                this.toaster.error('Error redeploying deployment');
                console.error(err);
              });
          }
        });
    }
  }

  openConfirmationDialog() {
    const modalRef = this.modalService.open(ConfirmationModalComponent);
    modalRef.componentInstance.selectedItem = '';
    modalRef.componentInstance.message = 'Are you sure you want to proceed?';

    modalRef.result.then(
      (result) => {
        if (result) {
          if (this.additionalParam === "deployment") {
            this.http.deleteDeployments(this.envId, this.params.data.name).subscribe((res: any) => {
              if (res.success) {
                this.toaster.success('Deleted Successfully');
                window.location.reload();
              }
            });

          }
          if (this.additionalParam === "tools") {
            const envId = localStorage.getItem('environment') ? JSON.parse(localStorage.getItem('environment') || '{}').id : '';
            this.http.deleteTools(envId, this.toolName).subscribe((res: any) => {
              if (res.status) {
                this.toaster.success('Deleted Successfully');
                window.location.reload();
              }
            });
          }
        } else {
          console.log('Cancelled delete!');
        }
      });
  }

  closeModal() {
    this.scaleDeploymentsModel.close();
  }

  view(data: any) {
    console.log("additionalParamView", this.additionalParam);
    console.log("View data", data.name);
    if (this.additionalParam === "tools") {
      this.route.navigate(['/tools/view-tool'], { queryParams: { selectedView: data.name } });
    }
  }
  showDeploymentView(deploymentDetails: any) {
    console.log('ShowDeploymentID', deploymentDetails.id);
    this.deploymentId = deploymentDetails.id;
    this.getReleasesByDeploymentId();
  }

  getReleasesByDeploymentId(): void {
    this.http.getReleasesViewByDeploymentId(this.deploymentId).subscribe((res: any) => {
      console.log('AllReleaseData', res);
      [this.active, ...this.history] = res.data;
      this.viewLogsa(this.active)
    })
  }

  openModal() {
    this.activeTabIndex = 0;
    this.logsModal.open('right');
  }

  viewLogsa(release: any) {
    this.realeseId = release.id
    this.getLogData(0, 'build');
    this.openModal();
  }

  getLogData(index: number, type: string) {
    this.activeTabIndex = index;
    console.log('getLogData', this.realeseId)
    if (type && this.realeseId) {
      this.http.getDeploymentViewLogs(this.realeseId, type).subscribe((res: any) => {
        if (res.status.toLowerCase() === 'success') {
          this.deploymentLogs = res.data.map((line: any) => {
            // console.log('DeploymentLogLineData', line)
            const splitIndex = line.indexOf(' ');
            return {
              timestamp: line.slice(0, splitIndex),
              message: line.slice(splitIndex + 1)
            };
          });
          this.updatePaginatedLogs();
        } else {
          this.toaster.error(res.message);
        }
      })

    } else {
      this.toaster.error('Invalid release ID or type');
    }
  }

  updatePaginatedLogs(): void {
    const end = this.currentPage * this.pageSize;
    this.paginatedLogs = this.deploymentLogs.slice(0, end);
  }

  get totalPages(): number {
    return Math.ceil(this.deploymentLogs.length / this.pageSize);
  }

  toggleMode(event: Event) {
    this.isLightMode = !this.isLightMode;
  }

  onScroll(event: Event): void {
    const target = event.target as HTMLElement;
    const threshold = 150;
    const position = target.scrollTop + target.clientHeight;
    const height = target.scrollHeight;

    if (height - position < threshold && this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePaginatedLogs();
    }
  }

  scrollToTop(): void {
    this.scrollContainer.nativeElement.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  scrollToend(): void {
    const container = this.scrollContainer.nativeElement;
    const loadNext = () => {
      if (this.currentPage < this.totalPages) {
        this.currentPage++;
        this.updatePaginatedLogs();

        setTimeout(() => {
          container.scrollTo({
            top: container.scrollHeight,
            behavior: 'smooth'
          });

          loadNext();
        }, 300);
      } else {
        setTimeout(() => {
          container.scrollTo({
            top: container.scrollHeight,
            behavior: 'smooth'
          });
        }, 100);
      }
    };

    loadNext();
  }

  toggleDropdown(event: MouseEvent, btnRef?: HTMLElement): void {
    event.stopPropagation();
    const btn = (btnRef as HTMLElement) || (event.target as HTMLElement);
    const rect = btn.getBoundingClientRect();
    // prefer placing menu under the button; adjust if near bottom
    const top = rect.bottom + 8; // 8px gap from viewport
    // align menu so its right edge aligns near button's right edge
    const left = rect.right - 160; // 160 is approx menu width

    this.dropdownStyle = {
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      'z-index': 9999,
      'pointer-events': 'auto'
    };

    const willOpen = !this.isDropdownOpen;
    if (willOpen) {
      // ask other instances to close first
      window.dispatchEvent(new Event('close-action-dropdowns'));
    }

    this.isDropdownOpen = willOpen;
    // store button ref so we can recompute position on scroll/resize
    this.lastButtonRef = willOpen ? (btn as HTMLElement) : null;
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
    // close when click outside the floating menu or button
    const clickedInsideMenu = !!target.closest('.floating-dropdown');
    const clickedInsideBtn = !!target.closest('.btn-icon');
    if (!clickedInsideMenu && !clickedInsideBtn) {
      this.isDropdownOpen = false;
    }
  }

  // Close when another instance asks to close (only one open at a time)
  @HostListener('window:close-action-dropdowns', ['$event'])
  onCloseActionDropdowns(_: Event) {
    this.isDropdownOpen = false;
    this.lastButtonRef = null;
  }
}