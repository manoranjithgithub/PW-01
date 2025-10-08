import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { AgGridModule } from 'ag-grid-angular';
import { ColDef, CellClickedEvent } from 'ag-grid-community';
import { CommonModule } from '@angular/common';
import {
  CardGroupComponent, CardComponent, CardBodyComponent, NavComponent, NavItemComponent, NavLinkDirective, TabContentRefDirective, TabContentComponent, RoundedDirective, TabPaneComponent
} from '@coreui/angular';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { ConfirmationModalComponent } from '../../shared/components/modal/confirmation-modal/confirmation-modal.component';
import { LoaderComponent } from '../../shared/components/loader/loader.component';
import { AgGridTableComponent } from '../../shared/components/ag-grid-table/ag-grid-table.component';
import { SharedService } from '../../shared/services/shared.service';
import { ToolsService } from './tools.service';
import { ActionCellRendererComponent } from '../../shared/components/action-cell-renderer/action-cell-renderer.component';
@Component({
  selector: 'app-tools',
  standalone: true,
  imports: [AgGridModule, CardGroupComponent, CardComponent,
    CardBodyComponent, CommonModule, NavComponent, NavItemComponent, NavLinkDirective, ConfirmationModalComponent,
    TabContentRefDirective, TabContentComponent, TabPaneComponent, LoaderComponent, AgGridTableComponent
  ],
  providers: [ToolsService],
  templateUrl: './tools.component.html',
  styleUrl: './tools.component.scss'
})
export class ToolsComponent implements OnInit, OnDestroy {
  isShowTable: boolean = true;
  envId: string = '';
  rowData = [];

  deploymentData = [];
  configData = [];
  secretData = [];
  endpointsData = [];
  isShowToolDetails: boolean = false;
  private subscription: Subscription | undefined;
  toolName: string = '';
  loading: boolean = true;
  getToolsIntervel:any

  constructor(private http: ToolsService,
    private router: Router, private sharedService: SharedService, private modalService: NgbModal,
    private toaster: ToastrService, private cdr: ChangeDetectorRef
  ) {
    //this.tableTheme = this.sharedService.getCookie('theme')
    // const storedValue = this.sharedService.getCookie('environment');
    const storedValue = localStorage.getItem('environment');
    if (storedValue && storedValue !== "undefined") {
      this.envId = JSON.parse(storedValue).id
      this.getAvailableTools(JSON.parse(storedValue).id);
    }
  }

  ngOnInit(): void {
    this.subscription = this.sharedService.envValueChange$.subscribe((value: any) => {
      // const savedEnv = this.sharedService.getCookie('environment');
      const savedEnv = localStorage.getItem('environment');
      if (!savedEnv) {
        this.router.navigate(['/environments']);
        return;
      }
      const envObj = JSON.parse(savedEnv);
      const envId = envObj.id;
      this.envId = envId
      this.getAvailableTools(envId);
    });
    this.getToolsIntervel = setInterval(() => {
      this.getAvailableTools(JSON.parse(localStorage.getItem('environment') || '{}').id);
    }, 30000);
  }

  columnDefs: ColDef[] = [
    {
      headerName: ' ', field: 'icon', sortable: false, filter: false, width: 80,
      cellStyle: { cursor: 'pointer', color: '#181d1f', display: 'flex', alignItems: 'center', justifyContent: 'center' },
      cellRenderer: (params: any) => {
        return `<img src="${params.value}" alt="${params.data.name}" width="24" height="24" />`;
      },
      onCellClicked: (event: CellClickedEvent) =>
        this.gotoAction(event.data)
    },
    {
      headerName: 'Name', field: 'name', sortable: true, filter: true, flex: 1,
      cellStyle: { cursor: 'pointer', color: '#181d1f' },
      onCellClicked: (event: CellClickedEvent) =>
        this.gotoAction(event.data)
    },
    {
      headerName: 'Status',
      field: 'status',
      sortable: true,
      filter: true,
      flex: 1,
      cellRenderer: (params: any) => {
        const status = params.value;
        const iconMap: Record<string, string> = {
          'Running': 'bi-check-circle-fill text-success',
          'Failed': 'bi-x-circle-fill text-danger',
          'Pending': 'bi-clock text-warning',
          'Stopped': 'bi-slash-circle-fill text-secondary',
          'Degraded': 'bi-exclamation-circle-fill text-warning',
          'Unknown': 'bi-question-circle-fill text-muted'
        };
        const iconClass = iconMap[status] || 'bi-info-circle text-muted';

        return `
            <span style="display: flex; align-items: center; gap: 5px;">
              <i class="bi ${iconClass}"></i>
              <span>${status}</span>
            </span>
          `;
      }
    },
    // {
    //   headerName: 'Endpoint',
    //   field: 'name',
    //   sortable: true,
    //   filter: true,
    //   flex: 1,
    //   cellRenderer: (params: any) => {
    //     const url = `https://${params.value}`;
    //     return `<a href="${url}" target="_blank">${url}</a>`;
    //   }
    // },
    {
      headerName: 'Host',
      field: 'publicHost',
      cellStyle: {
        'white-space': 'nowrap',
        'overflow': 'hidden !important',
        'text-overflow': 'ellipsis',
        'cursor': 'pointer'
      },
      cellRenderer: (params: any) => {
        const url = `${params.value}`;
        const escapedUrl = url.replace(/"/g, '&quot;').replace(/'/g, "\\'");
        const id = `copy-${params.rowIndex}-${Math.random().toString(36).substring(2, 5)}`;
        const isSecureLink = url.startsWith('https');
        const isAccessible = params.data?.endpointStatus === 'accessible';

        let linkPart = '';

        if (isSecureLink) {
          if (isAccessible) {
            linkPart = `<a href="${escapedUrl}" target="_blank" title="${escapedUrl}" style="text-decoration: underline; color: blue;">${escapedUrl}</a>`;
          } else {
            linkPart = `<span title="Endpoint not ready yet" style="color: gray; cursor: not-allowed;">${escapedUrl}</span>`;
          }
        } else {
          linkPart = `<span class="link-text">${escapedUrl}</span>`;
        }

        const copyTooltip = isSecureLink ? 'Copy URL' : 'Copy Host Name';
        const clipboardIcon = (isAccessible || !isSecureLink)

          ? `<i class="bi bi-clipboard" style="cursor: pointer; position: relative;" 
        onmouseenter="document.getElementById('${id}').innerText = 'Copy'" 
        onclick="(function(){
          navigator.clipboard.writeText('${escapedUrl}');
          const tooltip = document.getElementById('${id}');
          tooltip.innerText = 'Copied!';
          tooltip.style.opacity = '1';
          setTimeout(() => {
            tooltip.innerText = 'Copy';
            tooltip.style.opacity = '0';
          }, 1000);
        })()" 
        title="${copyTooltip}"></i>`
          : `<i class="bi bi-clipboard" style="cursor: not-allowed; opacity: 0.5;" title="Copy disabled"></i>`;

        return `
    <span style="position: relative; display: flex; align-items: center; gap: 5px;">
      ${clipboardIcon}
      <span id="${id}" style="
          position: absolute;
          top: 0px;
          background: black;
          color: white;
          padding: 0 10px;
          border-radius: 5px;
          font-size: 12px;
          opacity: 0;
          transition: opacity 0.2s;
          pointer-events: none;
        ">Copy</span>
      ${linkPart}
    </span>
  `;
      },
      sortable: true,
      filter: true,
      flex: 1
    },
    {
      headerName: 'Port',
      field: 'publicPort',
      sortable: true,
      filter: true,
      flex: 1,
    },
    {
      headerName: "Actions",
      field: "actions",
      cellStyle: { cursor: 'pointer' },
      cellRenderer: ActionCellRendererComponent,
      cellRendererParams: {
        additionalParam: 'tools',
      },
    }
  ];

  addTools() {
    this.router.navigate(['/create-tool'])
  }

  editTools() {
    this.router.navigate(['/create-tool'], { queryParams: { name: this.toolName } })
  }

  gotoAction(params: any) {
    console.log(params)
    this.toolName = params.name;
    this.router.navigate(['/view-tool'], { queryParams: { selectedView: this.toolName } })
  }

  getAvailableTools(value: any): void {
    if (value) {
      this.http.getToolsList(value).subscribe((res: any) => {
        if (res.status) {
          this.rowData = res.data.map((tool: any) => ({
            ...tool,
            icon: this.getToolIcon(tool.schemaId)
          }));
          localStorage.setItem('availableTools', JSON.stringify(res.data));
          this.loading = false
        }
      }, error => {
        this.rowData = [];
      })
    }
  }
  showToolsTable() {
    this.isShowTable = true;
  }


  ngOnDestroy(): void {
    clearInterval(this.getToolsIntervel)
    this.subscription?.unsubscribe();
  }

  //deployments column def
  deploymentsColDefs: ColDef[] = [
    {
      headerName: 'Name', field: 'name', sortable: true, filter: true, flex: 1,
      cellStyle: { cursor: 'pointer', textDecoration: 'underline', color: '#39f' },
      onCellClicked: (event: CellClickedEvent) =>
        this.gotoDeploymentAction(event.data)
    },
    {
      headerName: 'Status',
      field: 'availableReplicas',
      sortable: true,
      filter: false,
      flex: 1,
      cellRenderer: (params: any) => this.statusCellRenderer(params),
      cellStyle: { textAlign: 'center' }
    },
    { headerName: 'Replicas', field: 'replicas', sortable: true, filter: false, flex: 1 },
    {
      headerName: 'Created At',
      field: 'createdAt',
      sortable: true,
      filter: false,
      flex: 1,
      sort: 'desc',
      valueFormatter: (params: any) => this.sharedService.formatDate(params.value)
    }
  ];

  statusCellRenderer(params: any): string {
    const { availableReplicas, replicas } = params.data;
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
      'Stopped': 'bi-slash-circle-fill'
    };

    const status = availableReplicas === replicas
      ? { text: 'Running', class: 'badge-success' }
      : availableReplicas > 0
        ? { text: 'Degraded', class: 'badge-warning' }
        : { text: 'Down', class: 'badge-danger' };
    const icon = iconMap["status"] || 'bi-question-circle-fill';
    return `<span class="badge ${status.class}"><i class="bi ${icon}">${status.text} </span>`;
  }

  gotoDeploymentAction(params: any) {
    this.router.navigate(['/deployment-logs'], { queryParams: { id: params.name } })
  }

  //Endpoints column def
  endpointsColDefs: ColDef[] = [
    {
      headerName: 'Name', field: 'name', sortable: true, filter: true, flex: 1,
      cellStyle: { cursor: 'pointer', textDecoration: 'underline', color: '#39f' },
      onCellClicked: (event: CellClickedEvent) =>
        this.gotoEndpointAction(event.data)
    },
    {
      headerName: 'Endpoint', field: 'host', sortable: true, flex: 1,
      cellStyle: { cursor: 'pointer', textDecoration: 'underline', color: '#39f' },
      onCellClicked: (event: CellClickedEvent) =>
        this.openHost(event.data)
    },
    {
      headerName: 'Authentication',
      field: 'authentication',
      sortable: true,
      flex: 1,
      cellRenderer: (params: any) => {
        const status = params.value
          ? { text: 'Authenticated', class: 'badge-success' }
          : { text: 'Not Authenticated', class: 'badge-danger' };

        return `<span class="badge ${status.class}">${status.text}</span>`;
      },
      cellStyle: { textAlign: 'left' }
    },
    {
      headerName: 'Created At',
      sortable: true,
      sort: 'desc',
      field: 'createdAt',
      width: 150,
      valueFormatter: (params: any) => this.sharedService.formatDate(params.value)
    }

  ];

  gotoEndpointAction(params: any) {
    this.router.navigate(['/create-endpoint'], { queryParams: { id: params.name } })
  }

  openHost(params: any) {
    window.open(`https://${params?.host}`, '_blank');
  }

  //Configurations column def
  configurationsColDefs: ColDef[] = [
    {
      headerName: 'Name', field: 'name', sortable: true, filter: true, flex: 1,
      cellStyle: { cursor: 'pointer', textDecoration: 'underline', color: '#39f' },
      onCellClicked: (event: CellClickedEvent) =>
        this.gotoConfigAction(event.data)
    },
    {
      headerName: 'Created At',
      field: 'createdAt',
      sortable: true,
      filter: false,
      flex: 1,
      sort: 'desc',
      valueFormatter: (params: any) => this.sharedService.formatDate(params.value)
    },

  ];

  gotoConfigAction(value: any) {
    this.router.navigate(['/create-config'], { queryParams: { id: value.name } })
  }

  //Secrets column Def
  secretsColDefs: ColDef[] = [
    {
      headerName: 'Name', field: 'name', sortable: true, filter: true, flex: 1,
      cellStyle: { cursor: 'pointer', textDecoration: 'underline', color: '#39f' },
      onCellClicked: (event: CellClickedEvent) =>
        this.gotoSecretsAction(event.data)
    },
    {
      headerName: 'Created At',
      field: 'createdAt',
      sortable: true,
      filter: false,
      flex: 1,
      sort: 'desc',
      valueFormatter: (params: any) => this.sharedService.formatDate(params.value)
    },
  ];

  gotoSecretsAction(value: any) {
    this.router.navigate(['/create-secret'], { queryParams: { id: value.name } })
  }

  openConfirmationDialog() {
    const modalRef = this.modalService.open(ConfirmationModalComponent);
    modalRef.componentInstance.selectedItem = 'Tool';
    modalRef.componentInstance.message = 'Are you sure you want to proceed?';

    modalRef.result.then(
      (result) => {
        if (result) {
          this.http.deleteTools(this.envId, this.toolName).subscribe((res: any) => {
            if (res.success) {
              this.toaster.success('Deleted Successfully');
              this.router.navigate(['/tools']);
              this.getAvailableTools(this.envId);
              this.isShowToolDetails = false;
            }
          })
        } else {
          console.log('Cancelled delete!');
        }
      });
  }
  getToolIcon(toolName: string): string {
    const name = toolName.toLowerCase();

    if (name.includes('cloudbeaver')) {
      return 'assets/images/icons/cloudbeaver.png';
    }
    if (name.includes('mysql')) {
      return 'assets/images/icons/mysql.png';
    }
    if (name.includes('postgres')) {
      return 'assets/images/icons/postgresql.svg';
    }
    if (name.includes('mongodb')) {
      return 'assets/images/icons/mongodb.svg';
    }

    return 'assets/images/icons/default-tool.png';
  }
}
