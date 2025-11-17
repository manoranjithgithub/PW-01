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
    if (storedEnvironment && storedEnvironment !== "undefined") {
      this.getDeployment(JSON.parse(storedEnvironment));
    }
  }

  ngOnInit(): void {

    this.subscription = this.sharedService.envValueChange$.subscribe(value => {
      this.getDeployment(value);
    });

  }
  getDeployment(env: any): void {
    if (env) {

      this.deploymentsService.getDeployments(env.id).subscribe((res: any) => {
        if (res.status.toLowerCase() === "success") {
          this.tableData = res.data;
          localStorage.setItem('availableDeployments', JSON.stringify(res.data?.map((x: any) => x.name)));
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
    const meta = this.sharedService.getStatusMeta(status);
    return `<span class="${meta.statusClass} text-capitalize"><i class="bi ${meta.icon}"></i> ${meta.label.toLowerCase()}</span>`;
  }

  gotoAction(params: any) {
    this.router.navigate(['/llm/deployment-details'], { queryParams: { id: params.name } })
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
