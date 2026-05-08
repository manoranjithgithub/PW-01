import { CommonModule } from '@angular/common';
import { Renderer2, Component, ElementRef, ViewChild, HostListener, Output, EventEmitter } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ConfirmationModalComponent } from '../modal/confirmation-modal/confirmation-modal.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DeploymentsService } from '../../services/deployments.service';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { SharedService } from '../../services/shared.service';
import { ModalComponent } from '../model/model.component';
import { FormsModule, NgModel } from '@angular/forms';
import { PermissionService } from '../../services/permission.service';
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
  private static toolActionStatusByKey = new Map<string, 'running' | 'stopped'>();

  params: any;
  additionalParam: string = '';
  public isUserVerified: boolean = true;
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
  typeofDeployment: string = '';
  isPauseResumeDisabled = false;

  @ViewChild('scaleDeploymentsModel') private scaleDeploymentsModel!: ModalComponent;
  @ViewChild('logsModal') private logsModal!: ModalComponent;
  @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLDivElement>;
  // menu viewChild refs not required for positioning; using fixed coords
  dropdownStyle: any = {};
  private lastButtonRef?: HTMLElement | null = null;

  public scaleDeploymentsModelConfig: any = {
    modalTitle: 'Scale Application',
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

  projects: any[] = [];
  allExpanded = false;
  currentProjectId: string | undefined = undefined;

  constructor(private el: ElementRef, private renderer: Renderer2, private modalService: NgbModal,
    private http: DeploymentsService, private route: Router, private toaster: ToastrService,
    private sharedService: SharedService,
    public permissionService: PermissionService,
  ) {
    // const storedValue = this.sharedService.getCookie('environment');
    const storedValue = localStorage.getItem('environment');
    if (storedValue) {
      this.envId = JSON.parse(storedValue).id;
    }
    const storedProject = localStorage.getItem('project');
    if (storedProject) {
      try {
        this.currentProjectId = JSON.parse(storedProject).id;
      } catch {
        this.currentProjectId = storedProject || undefined;
      }
    }
  }

  agInit(params: any): void {
    this.params = params;
    this.additionalParam = params.additionalParam;
    this.typeofDeployment = params?.data?.sourceCode?.type || '';
    const isVer = params?.data?.isVerfied;
    this.isUserVerified = (isVer === true || isVer === 'true');
  }

  refresh(params: any): boolean {
    this.params = params;
    const isVer = params?.data?.isVerfied;
    this.isUserVerified = (isVer === true || isVer === 'true');
    return true;
  }

  get pauseResumeLabel(): string {
    return this.params?.data?.status?.toLowerCase() === 'stopped' ? 'Resume' : 'Pause';
  }

  get toolStartStopLabel(): string {
    return this.isToolStopped() ? 'Start' : 'Stop';
  }

  get toolStartStopAction(): string {
    return this.isToolStopped() ? 'startTool' : 'stopTool';
  }

  get canEditTool(): boolean {
    return !!this.permissionService?.canWriteForCurrentUser?.(this.currentProjectId, this.envId) && !this.isToolStopped();
  }

  private isToolStopped(): boolean {
    return ['stopped', 'stop', 'paused'].includes(this.toolStatus);
  }

  private getToolActionKey(data: any = this.params?.data): string {
    const envId = data?.namespace || data?.environmentId || this.envId || '';
    const name = data?.name || data?.id || data?._id || '';
    return envId && name ? `${envId}:${name}` : '';
  }

  private get toolStatus(): string {
    const data = this.params?.data;
    const key = this.getToolActionKey(data);
    return String(
      (key && ActionCellRendererComponent.toolActionStatusByKey.get(key)) ||
      data?.toolActionStatus ||
      data?.status ||
      data?.state ||
      ''
    ).toLowerCase();
  }

  private updateToolActionStatus(data: any, status: 'running' | 'stopped'): void {
    const key = this.getToolActionKey(data);
    if (key) {
      ActionCellRendererComponent.toolActionStatusByKey.set(key, status);
    }

    if (data) {
      Object.assign(data, { status, toolActionStatus: status });
    }

    if (this.params?.data) {
      Object.assign(this.params.data, { status, toolActionStatus: status });
    }

    if (this.params?.node?.data) {
      Object.assign(this.params.node.data, { status, toolActionStatus: status });
    }

    this.params?.api?.refreshCells?.({
      rowNodes: this.params?.node ? [this.params.node] : undefined,
      force: true
    });
  }

  onOptionSelected(action: string): void {
    this.isDropdownOpen = false;
    this.onActionSelected(action);
  }

  onActionSelected(action: string): void {
    if (this.additionalParam === 'llm-models') {
      if (this.params?.onActionClick) {
        this.params.onActionClick(action, this.params?.data);
      } else if (action === 'view') {
        const id = this.params?.data?.id || this.params?.data?._id || this.params?.data?.llmId || this.params?.data?.llm_id;
        this.route.navigate(['/llm-models/view-model'], { queryParams: { id }, state: { row: this.params?.data } });
      }
      return;
    }
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
      case 'startTool':
      case 'stopTool':
        this.toggleToolState(this.params.data, action);
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

  toggleToolState(data: any, action: 'startTool' | 'stopTool'): void {
    const isStart = action === 'startTool';
    const label = isStart ? 'Start' : 'Stop';
    const envId = data?.namespace || data?.environmentId || this.envId;
    const name = data?.name;

    if (!envId || !name) {
      this.toaster.error(`Unable to ${label.toLowerCase()} tool`);
      return;
    }

    const modalRef = this.modalService.open(DeployConfirmationComponent);
    modalRef.componentInstance.message = `Are you sure you want to ${label} this Tool?`;

    modalRef.result.then((result) => {
      if (!result) return;

      const req = {
        environmentId: envId,
        name,
        action: isStart ? 'resume' as const : 'pause' as const,
        projectId: data?.projectId || this.currentProjectId
      };

      this.http.pauseResumeTool(req).subscribe({
        next: (res: any) => {
          if (String(res?.status || '').toLowerCase() === 'success' || res?.success) {
            this.updateToolActionStatus(data, isStart ? 'running' : 'stopped');
            this.toaster.success(`Tool ${isStart ? 'started' : 'stopped'} successfully`);
          } else {
            this.toaster.error(res?.message || `Unable to ${label.toLowerCase()} tool`);
          }
        },
        error: () => {
          this.toaster.error(`Unable to ${label.toLowerCase()} tool`);
        }
      });
    });
  }

  isRevokedLlmModel(): boolean {
    const rawStatus = String(this.params?.data?.status || this.params?.data?.state || '').toLowerCase();
    return rawStatus.includes('revoked');
  }

  viewLogs() {
    //  this.showDeploymentView(this.params.data)
    const data = this.params.data;
    if (this.additionalParam === 'llm') {
      this.route.navigate(['/llm/deployment-details'], { queryParams: { id: data.id, tabIndex: 1 } });

    } else if (this.additionalParam === 'deployment') {
      this.route.navigate(['/applications/application-details'], { queryParams: { id: data.id, tabIndex: 5 } });
    }
  }


  edit(data: any) {
    if (this.additionalParam === "deployment") {
      this.route.navigate(['/edit-deployment'], { queryParams: { id: data.name } });
    }
    if (this.additionalParam === "tools") {
      if (!this.canEditTool) return;
      const id = data?.id || data?._id || '';
      this.route.navigate(['/tools/edit-tool'], { queryParams: { selectedEdit: data.name, id } });
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
    if (this.isPauseResumeDisabled) return;

    if (this.additionalParam === "deployment" || this.additionalParam === "llm") {
      const req = {
        action: type === 'Pause' ? 'pause' : 'resume',
      };
      const modalRef = this.modalService.open(DeployConfirmationComponent);
      modalRef.componentInstance.message = `Are you sure you want to ${type} this Application?`;

      modalRef.result.then(
        (result) => {
          if (result) {
            this.isPauseResumeDisabled = true;
            this.sharedService.setOptimisticDeploymentDisabled(data?.id, type === 'Pause');
            this.http.updateDeployment(data?.id, req).subscribe((res: any) => {
              if (res.status.toLowerCase() === "success") {
                this.toaster.success(`Application ${type === 'Pause' ? 'paused' : 'resumed'} successfully`);
                this.route.navigate(['/applications/application-details'], { queryParams: { id: data.id} });
              }
              setTimeout(() => {
                this.isPauseResumeDisabled = false;
              }, 10000);
            },
              err => {
                this.sharedService.clearOptimisticDeploymentDisabled(data?.id);
                this.toaster.error(`Error in ${type} application`);
                this.isPauseResumeDisabled = false;
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
    if (this.additionalParam === "deployment" || this.additionalParam === "llm") {
      const req = this.params.data;
      const modalRef = this.modalService.open(DeployConfirmationComponent);
      modalRef.componentInstance.message = 'Are you sure you want to redeploy this application?';

      modalRef.result.then(
        (result) => {
          if (result) {
            this.http.updateDeployment(req.id, { sourceCode: req?.sourceCode }).subscribe((res: any) => {
              if (res.status.toLowerCase() === "success") {
                this.toaster.success('Redeploy initiated');
                this.route.navigate(['/applications/application-details'], { queryParams: { id: req.id} });

              }
            },
              err => {
                this.toaster.error('Error redeploying application');
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
    if (this.additionalParam === "tools") {
      const id = data?.id || data?._id || '';
      this.route.navigate(['/tools/view-tool'], { queryParams: { selectedView: data.name, id } });
    }
    if (this.additionalParam === 'user-list') {
      // alert('user-list')
    }
  }
  showDeploymentView(deploymentDetails: any) {
    this.deploymentId = deploymentDetails.id;
    this.getReleasesByDeploymentId();
  }

  getReleasesByDeploymentId(): void {
    this.http.getReleasesViewByDeploymentId(this.deploymentId).subscribe((res: any) => {
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
    if (type && this.realeseId) {
      this.http.getDeploymentViewLogs(this.realeseId, type).subscribe((res: any) => {
        if (res.status.toLowerCase() === 'success') {
          this.deploymentLogs = res.data.map((line: any) => {
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
    this.updateDropdownPosition(btn);

    const willOpen = !this.isDropdownOpen;
    if (willOpen) {
      window.dispatchEvent(new Event('close-action-dropdowns'));
    }
    this.isDropdownOpen = willOpen;
    this.lastButtonRef = willOpen ? (btn as HTMLElement) : null;
  }

  updateDropdownPosition(btn: HTMLElement | undefined | null) {
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const menuWidth = 160;
    let top = rect.bottom + 8;
    let left = rect.right - menuWidth;

    if (this.additionalParam === 'deployment') {
      const menuHeight = 150;
      const margin = 8;
      top = rect.bottom + margin;
      if (window.innerHeight - rect.bottom < menuHeight + margin) {
        top = rect.top - menuHeight - margin;
      }
      top = Math.max(margin, Math.min(top, window.innerHeight - menuHeight - margin));
      left = Math.max(margin, Math.min(left, window.innerWidth - menuWidth - margin));
    }

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
  viewPolicies() {
    this.params.onActionClick('view', this.params?.data);
  }
  editPolicies() {
    this.params.onActionClick('edit', this.params?.data);
  }
  deleteUser() {
    this.params.onActionClick('delete', this.params?.data);
  }

  isLoggedInUser(): boolean {
    const userData = this.params?.data;
    if (!userData) return false;

    const currentUserId = localStorage.getItem('userId');
    return !!currentUserId && String(userData.id) === currentUserId;
  }
}
