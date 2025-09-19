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
    private http: DeploymentsService, private route: Router, private toaster: ToastrService, private sharedService: SharedService,
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
      case 'restart':
        this.restart(this.params.data);
        break;
    }
  }

   viewLogs(){
    //  this.showDeploymentView(this.params.data)
    const data = this.params.data;
    this.route.navigate(['/deployment/deployment-details'], { queryParams: { id: data.id , tabIndex:5} });
  }


  edit(data: any) {
    if (this.additionalParam === "deployment") {
      this.route.navigate(['/edit-deployment'], { queryParams: { id: data.name } });
    }

    if (this.additionalParam === "tools") {
      this.route.navigate(['/edit-tool'], { queryParams: { selectedEdit: data.name } });
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

  scaleDeployment() {
    const data = {
      data: {
        replicas: this.replicaCount
      }
    }
    this.http.updateDeployment(this.envId, this.params.data.name, data).subscribe((res: any) => {
      if (res.success) {
        this.toaster.success('Successfully scaled');
        this.closeModal();
      }
    });
  }


  restart(data: any) {
    console.log(data)
    if (this.additionalParam === "deployment") {
      const req = this.params.data;
      this.http.restartDeployment(this.envId, this.params.data.name, req).subscribe((res: any) => {
        if (res.success) {
          this.toaster.success('Successfully initiated');
          console.log("Restarted at", res.data?.restartedAt);
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
            this.http.deleteTools(this.envId, this.toolName).subscribe((res: any) => {
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
      this.route.navigate(['/view-tool'], { queryParams: { selectedView: data.name } });
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
    this.getLogData(0,'build');
    this.openModal();
  }

  getLogData(index: number,type: string) {
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

  toggleDropdown(event: MouseEvent): void {
    event.stopPropagation();
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  @HostListener('document:click', ['$event'])
  onOutsideClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.custom-dropdown')) {
      this.isDropdownOpen = false;
    }
  }
}