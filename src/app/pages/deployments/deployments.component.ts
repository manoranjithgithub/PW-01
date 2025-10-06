import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink, RouterOutlet } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule, FormControl } from '@angular/forms';
import { ContainerComponent, ShadowOnScrollDirective } from '@coreui/angular';
import { ModalComponent } from '../../shared/components/model/model.component';
import { SharedService } from '../../shared/services/shared.service';
import { map, Observable, startWith, Subscription } from 'rxjs';
import { CellClickedEvent, ColDef } from 'ag-grid-community';
import { AgGridTableComponent } from '../../shared/components/ag-grid-table/ag-grid-table.component';
import { AgGridModule } from 'ag-grid-angular';
import { MatIconModule } from '@angular/material/icon';
import { ActionCellRendererComponent } from '../../shared/components/action-cell-renderer/action-cell-renderer.component';
import { LoaderComponent } from '../../shared/components/loader/loader.component';
import { ToastrService } from 'ngx-toastr';
import { DefaultHeaderComponent } from '../../shared/components/layout';
import { environment } from '../../../environments/environment';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { DeploymentOptions } from '../../core/models/list-item.model';
import { DeploymentsService } from './deployment.service';
import {
  FormControlDirective, FormCheckInputDirective,
  FormCheckLabelDirective, FormDirective, FormCheckComponent, AlertComponent
} from '@coreui/angular';
import { SidebarService } from '../../shared/services/sidebar.service';

import { interval, switchMap } from 'rxjs';
import { UrlCellRendererComponent } from '../../shared/components/url-cell-renderer/url-cell-renderer.component';

@Component({
  selector: 'app-deployments',
  standalone: true,
  imports: [
    ReactiveFormsModule, CommonModule, RouterLink, RouterOutlet,
    DefaultHeaderComponent, ContainerComponent, ShadowOnScrollDirective,
    AgGridTableComponent, AgGridModule, MatIconModule, LoaderComponent, FormsModule, MatAutocompleteModule, MatFormFieldModule,
    MatInputModule, FormControlDirective, ModalComponent, AlertComponent,
    FormCheckInputDirective, FormCheckLabelDirective, FormDirective, FormCheckComponent
  ],
  templateUrl: './deployments.component.html',
  styleUrls: ['./deployments.component.scss'],
  providers: [DeploymentsService]
})
export class DeploymentsComponent implements OnInit, OnDestroy {

  @ViewChild('deployGitHubReposModel') private deployGitHubReposModel!: ModalComponent;
  @ViewChild('newDeployModel') private newDeployModel!: ModalComponent;
  @ViewChild('showDeployModel') private showDeployModel!: ModalComponent;
  // @ViewChild('deployementDetailsModel') private deployementDetailsModel!: ModalComponent;

  deployments: any[] = [];
  authUrl: string = '';
  showconfig: boolean = false;

  public deployGitHubReposConfig: any = {
    modalTitle: 'Deploy GitHub Repository',
    width: '500px',
    height: '1500px',
    hideDismissButton: () => true,
    hideCloseButton: () => true
  };

  public newDeployConfig: any = {
    modalTitle: 'New Project',
    width: '500px',
    height: 'auto',
    hideDismissButton: () => true,
    hideCloseButton: () => true
  };

  public modalConfig: any = {
    modalTitle: 'Deployment details',
    width: 'auto',
    height: 'auto',
    hideDismissButton: () => true,
    hideCloseButton: () => false
  };


  environmentForm!: FormGroup;
  submitted = false;
  githubAuthenticated: boolean = false;
  buttonText: string = '';
  tableData: any[] = [];
  reposList: any[] = [];
  user: any;
  deploymentsExhausted: boolean = false;
  // userId : string = localStorage.getItem('userId') ?? '';

  private subscription: Subscription | undefined;
  selectedRepo: any = "";
  isDisabled: boolean = true;
  selectedDeployType!: DeploymentOptions;

  searchControl = new FormControl('');

  deployOptions: DeploymentOptions[] = [
    { icon: 'bi-github', name: 'Deploy from GitHub repo', color: '#000', value: 'gitHub' },
    { icon: 'bi-gitlab', name: 'Deploy from GitLab repo', color: 'orange', value: 'gitLab' },
    { icon: 'bi-file-zip', name: 'Deploy zip', color: 'red', value: 'zip' }
  ];
  filteredOptions!: any;


  private clientId = environment.gitlab.clientId;
  private redirectUri = environment.gitlab.redirectUri;
  private gitAuthUrl = environment.gitlab.authUrl;
  deployForm: FormGroup;
  statusData: any;
  private pollingSubscription!: Subscription;
  columnDefs: ColDef[] = [
    {
      headerName: 'Name', field: 'name', sortable: true, filter: true, flex: 1, minWidth: 250, tooltipField: 'name',
      cellStyle: { 'white-space': 'nowrap', 'overflow': 'hidden !important', 'text-overflow': 'ellipsis' },
      onCellClicked: (event: CellClickedEvent) =>
        this.gotoAction(event.data)
    },
    // { headerName: 'Id', field: 'id', sortable: true, filter: false, flex: 1, width: 200 },
    {
      headerName: 'Date',
      field: 'createdAt',
      sortable: true,
      filter: false,
      // flex: 1,
      width: 130,
      //sort: 'desc',
      valueFormatter: (params: any) => {
        return new Date(params.value).toLocaleDateString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
      },
      onCellClicked: (event: CellClickedEvent) =>
        this.gotoAction(event.data)
    },
    {
      headerName: 'URL',
      field: 'name',
      sortable: true,
      filter: false,
      // flex: 1,
      width: 300,
      autoHeight: true,
      tooltipField: 'urlTooltip',
      cellRenderer: UrlCellRendererComponent
    },
    {
      headerName: 'Application Status',
      field: 'status',
      sortable: true,
      filter: false,
      flex: 1,
      minWidth: 150,
      // cellClass: 'text-center',
      //sort: 'desc',
      cellRenderer: (params: any) => this.statusCellRenderer(params),
      onCellClicked: (event: CellClickedEvent) =>
        this.gotoAction(event.data)
    },
    {
      headerName: 'Last Release Status',
      field: 'releaseStatus',
      // field: 'releaseStatus',
      sortable: true,
      filter: false,
      flex: 1,
      minWidth: 200,
      // cellClass: 'text-center',
      // onCellClicked: (event: CellClickedEvent) =>
      //   this.gotoAction(event.data)
      cellRenderer: (params: any) => this.statusCellRenderer(params),
    },
    {
      headerName: "",
      field: "actions",
      cellStyle: { cursor: 'pointer' },
      width: 102,
      cellRenderer: ActionCellRendererComponent,
      cellRendererParams: {
        additionalParam: 'deployment',
      },
    }
    
  ];
  messages: any[] = [];
  private wsSubscription!: Subscription;

  constructor(
    private fb: FormBuilder,
    private deploymentsService: DeploymentsService,
    private sharedService: SharedService,
    private router: Router,
  ) {
    // const storedEnvironment = this.sharedService.getCookie('environment');
    const storedEnvironment = localStorage.getItem('environment');
    // const storedProject = this.sharedService.getCookie('project');
    const storedProject = localStorage.getItem('project');
    if (storedEnvironment && storedEnvironment !== "undefined") {
      this.getDeployment(JSON.parse(storedEnvironment));
      // this.startPolling(JSON.parse(storedEnvironment));
    }
    //if (this.sharedService.getCookie('resourceUsage')) {
    if (localStorage.getItem('resourceUsage')) {
      //const resourceUsage = JSON.parse(this.sharedService.getCookie('resourceUsage'));
      const resourceUsage = JSON.parse(localStorage.getItem('resourceUsage') || '[]');
      const deploymentResource = resourceUsage.find(
        (res: any) => res.resource_type === 'deployments'
      );

      this.deploymentsExhausted = deploymentResource?.remaining === 0;
    }


    this.deployForm = this.fb.group({
      replicas: ['', [Validators.required, Validators.pattern("^[0-9]+$")]],
      instanceType: ['', Validators.required],
      buildCmd: [''],
      startCmd: [''],
      ephStorage: [''],
      envVariables: [''],
    });

  }

  ngOnInit(): void {

    this.initializeForms();
    this.subscription = this.sharedService.envValueChange$.subscribe(value => {
      this.getDeployment(value);
    });

    this.filteredOptions = this.searchControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value || ''))
    );
  }
  private _filter(value: string): any[] {
    return this.deployOptions.filter(option => option.name === value);
  }
  initializeForms(): void {
    this.environmentForm = this.fb.group({
      environmentName: ['', Validators.required]
    });


  }

  getDeployment(env: any): void {
    if (env) {
      this.deploymentsService.getDeployments(env.id).subscribe((res: any) => {
        if (res.status.toLowerCase() === "success") {
          this.tableData = res.data;
          // const deploymentNames = res.dat.map(item => item.name);
          localStorage.setItem('availableDeplyements', JSON.stringify(res.data));
          this.mergeStatusIntoTable();
        }
      },
        err => {
          this.tableData = [];
        });
    }
  }

  closeModal(): void {
    this.deployGitHubReposModel.close();
  }




  statusCellRenderer(params: any): string {
    const status = params.value;

    const iconMap: Record<string, string> = {
      'Initiated': 'bi-hourglass-split',
      'Building': 'bi-check-circle-fill',
      'Deploying': 'bi-cloud-upload',
      'Active': 'bi-check-circle-fill',
      'Paused': 'bi-pause-circle-fill',
      'Superseded': 'bi-arrow-clockwise',
      'Deploy Failed': 'bi-x-circle-fill',
      'Failed': 'bi-x-circle-fill',
      'Build Timeout': 'bi-clock-history',
      'Build Failed': 'bi-x-circle-fill',
      'Deploy Timeout': 'bi-clock-history',
      'Unavailable': 'bi-x-circle-fill',
      'Running': 'bi-check-circle-fill',
      'Pending': 'bi-clock',
      'Create Job Failed': 'bi-x-circle-fill',
      'Stopped': 'bi-slash-circle-fill',
      'Success': 'bi-check-circle-fill'
    };

    const statusClassMap: Record<string, string> = {
      'Active': 'success',
      'Initiated': 'success',
      'Building': 'success',
      'Deploying': 'success',
      'Paused': 'warning',
      'Superseded': 'warning',
      'Deploy Failed': 'danger',
      'Failed': 'danger',
      'Build Timeout': 'danger',
      'Build Failed': 'danger',
      'Deploy Timeout': 'danger',
      'Unavailable': 'danger',
      'Running': 'primary',
      'Pending': 'warning',
      'Create Job Failed': 'danger',
      'Stopped': 'danger',
      'Success': 'success'
    };

    const icon = iconMap[status] || 'bi-question-circle-fill';
    const statusClass = statusClassMap[status] || 'secondary';
    return `<span class="${statusClass}"><i class="bi ${icon}"></i> ${status}</span>`;
  }

  gotoAction(params: any) {
    console.log(params)
    // this.sidebarService.hideSidebar();
    this.router.navigate(['/deployment/deployment-details'], { queryParams: { id: params.id } })
    // this.openDetailsModal(params);
  }


  onDropdownChange() {
    if (this.selectedRepo) {
      console.log('Selected Repo URL:', this.selectedRepo.url);
      this.isDisabled = false;
    }
  }

  createDeployment() {
    this.closeModal();
    this.router.navigate(['/create-deployment'], { state: { repoName: this.selectedRepo.name, repoUrl: this.selectedRepo.url } });
  }
  loginWithGitLab(): void {
    const url = `${environment.gitlab.authUrl}?client_id=${this.clientId}&redirect_uri=${this.redirectUri}&response_type=code&scope=read_user api`;
    window.location.href = url;
  }
  openNewDeployModel() {
    this.newDeployModel.open();
  }
  selectDeployType(type: string) {
    this.showconfig = true;
  }
  closeNewDeployModel() {
    this.newDeployModel.close();
  }
  goToNewDeployModel() {
    this.router.navigate(['/create-deployment'])
  }
  showDeploy() {
    this.showDeployModel.open();
  }

  openDetailsModal(data: any) {
    console.log(data);
    this.sharedService.setData(data);
    this.modalConfig.modalTitle = data.name;
    // this.deployementDetailsModel.open('right');
  }

  closeDetailsModal() {
    // this.deployementDetailsModel.close();
  }
  startPolling(env: any) {
    this.pollingSubscription = interval(30000)
      .pipe(
        switchMap(() => this.deploymentsService.getDeploymentStatus(env.id))
      )
      .subscribe({
        next: (data: any) => {
          if (data && data.status == 'Success') {
            this.statusData = data.data?.deployments;
            this.mergeStatusIntoTable();
          }
        },
        error: (err) => {
          console.error('Polling error:', err);
        }
      });
  }

  mergeStatusIntoTable(): void {
    if (!this.tableData || !this.statusData) return;

    this.tableData = this.tableData.map(deployment => {
      const matchedStatus = this.statusData.find((status: any) => status.name === deployment.name);
      return {
        ...deployment,
        status: matchedStatus
          ? matchedStatus.status
          : deployment.status,
      };
    });
  }
  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    this.pollingSubscription?.unsubscribe();
  }
}
