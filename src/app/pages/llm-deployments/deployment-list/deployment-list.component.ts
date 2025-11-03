import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl } from '@angular/forms';
import { Subscription } from 'rxjs';
import { CellClickedEvent, ColDef } from 'ag-grid-community';
import { UrlCellRendererComponent } from '../../../shared/components/url-cell-renderer/url-cell-renderer.component';
import { ActionCellRendererComponent } from '../../../shared/components/action-cell-renderer/action-cell-renderer.component';
import { SharedService } from '../../../shared/services/shared.service';
import { Router } from '@angular/router';
import { AgGridTableComponent } from '../../../shared/components/ag-grid-table/ag-grid-table.component';
import { AgGridModule } from 'ag-grid-angular';
import { LLMDeploymentsService } from '../llm-deployment.service';

@Component({
  selector: 'app-deployment-list',
  templateUrl: './deployment-list.component.html',
  styleUrls: ['./deployment-list.component.scss'],
  standalone: true,
  imports: [CommonModule, AgGridTableComponent, AgGridModule],
  providers: [LLMDeploymentsService]
})
export class DeploymentListComponent implements OnInit, OnDestroy {

  deployments: any[] = [];


  buttonText: string = '';
  tableData: any[] = [];
  reposList: any[] = [];
  user: any;

  private subscription: Subscription | undefined;
  searchControl = new FormControl('');
  statusData: any;
  private pollingSubscription!: Subscription;
  columnDefs: ColDef[] = [
    {
      headerName: 'Name', field: 'name', sortable: true, filter: true, flex: 1, minWidth: 250, tooltipField: 'name',
      cellStyle: { 'white-space': 'nowrap', 'overflow': 'hidden !important', 'text-overflow': 'ellipsis' },
      onCellClicked: (event: CellClickedEvent) =>
        this.gotoAction(event.data)
    },
    {
      headerName: 'Date',
      field: 'createdAt',
      sortable: true,
      width: 130,
      filter: 'agTextColumnFilter',
      valueGetter: (params: any) => {
        if (!params.data || !params.data.createdAt) return '';
        const date = new Date(params.data.createdAt);
        return isNaN(date.getTime()) ? '' : date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
      },
      valueFormatter: (params: any) => {
        console.log(params)
        return params.value || '';
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
      cellRenderer: (params: any) => this.statusCellRenderer(params),
      onCellClicked: (event: CellClickedEvent) =>
        this.gotoAction(event.data)
    },
    {
      headerName: 'Last Release Status',
      field: 'releaseStatus',
      sortable: true,
      filter: false,
      flex: 1,
      minWidth: 200,
      cellRenderer: (params: any) => this.statusCellRenderer(params),
    },
    {
      headerName: "",
      field: "actions",
      cellStyle: { cursor: 'pointer' },
      width: 102,
      cellRenderer: ActionCellRendererComponent,
      cellRendererParams: {
        additionalParam: 'llm',
      },
    }

  ];
  messages: any[] = [];
  loading: boolean = true;
  getDeploymentIntervel: any;

  constructor(
    private sharedService: SharedService,
    private router: Router,
    private deploymentsService: LLMDeploymentsService
  ) {
    const storedEnvironment = localStorage.getItem('environment');
    const storedProject = localStorage.getItem('project');
    if (storedEnvironment && storedEnvironment !== "undefined") {
      this.getDeployment(JSON.parse(storedEnvironment));
    }
    if (localStorage.getItem('resourceUsage')) {
      const resourceUsage = JSON.parse(localStorage.getItem('resourceUsage') || '[]');
      const deploymentResource = resourceUsage.find(
        (res: any) => res.resource_type === 'deployments'
      );
    }
  }

  ngOnInit(): void {

    this.subscription = this.sharedService.envValueChange$.subscribe(value => {
      this.getDeployment(value);
    });

    // this.filteredOptions = this.searchControl.valueChanges.pipe(
    //   startWith(''),
    //   map(value => this._filter(value || ''))
    // );
  }
  // private _filter(value: string): any[] {
  //   return this.deployOptions.filter(option => option.name === value);
  // }


  getDeployment(env: any): void {
    if (env) {

      this.deploymentsService.getDeployments(env.id).subscribe((res: any) => {
        if (res.status.toLowerCase() === "success") {
          this.tableData = res.data;
          // const deploymentNames = res.dat.map(item => item.name);
          localStorage.setItem('availableDeplyements', JSON.stringify(res.data));
          this.mergeStatusIntoTable();
          this.loading = false
        }
      },
        err => {
          this.tableData = [];
          this.loading = false
        });
    }
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
      'Success': 'bi-check-circle-fill',
      'Inprogress': 'bi-check-circle-fill',
      'Updating': 'bi-box-arrow-in-up',
      'Degraded': 'bi-arrow-90deg-down',
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
      'Success': 'success',
      'Inprogress': 'in-process',
      'Updating': 'warning',
      'Degraded': 'warning',
    };

    const icon = iconMap[status] || 'bi-question-circle-fill';
    const statusClass = statusClassMap[status] || 'secondary';
    return `<span class="${statusClass}"><i class="bi ${icon}"></i> ${status}</span>`;
  }

  gotoAction(params: any) {
    console.log(params)
    // this.sidebarService.hideSidebar();
    this.router.navigate(['/llm/deployment-details'], { queryParams: { id: params.name } })
    // this.openDetailsModal(params);
  }
  goToNewDeployModel() {
    this.router.navigate(['/llm/create-deployment'])
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
    clearInterval(this.getDeploymentIntervel)
    this.subscription?.unsubscribe();
    this.pollingSubscription?.unsubscribe();
  }

}
