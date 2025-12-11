import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, } from '@angular/router';
import { SharedService } from '../../shared/services/shared.service';
import { Subscription } from 'rxjs';
import { CellClickedEvent, ColDef } from 'ag-grid-community';
import { ActionCellRendererComponent } from '../../shared/components/action-cell-renderer/action-cell-renderer.component';
import { DeploymentsService } from './deployment.service';
import { UrlCellRendererComponent } from '../../shared/components/url-cell-renderer/url-cell-renderer.component';
import { SHARED_IMPORTS } from '../../shared/shared-imports';

@Component({
  selector: 'app-deployments',
  standalone: true,
  imports: [SHARED_IMPORTS],
  templateUrl: './deployments.component.html',
  styleUrls: ['./deployments.component.scss'],
  providers: [DeploymentsService]
})
export class DeploymentsComponent implements OnInit, OnDestroy {
  tableData: any[] = [];

  private subscription: Subscription | undefined;
  statusData: any;
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
        additionalParam: 'deployment',
      },
    }

  ];
  messages: any[] = [];
  getDeploymentIntervel: any;
  sseSub: Subscription | null = null;

  constructor(
    private deploymentsService: DeploymentsService,
    private sharedService: SharedService,
    private router: Router,
  ) { }

  ngOnInit(): void {
    const storedEnvironment = localStorage.getItem('environment');
    if (storedEnvironment && storedEnvironment !== "undefined") {
      this.getDeployment(JSON.parse(storedEnvironment));
    }
    this.subscription = this.sharedService.envValueChange$.subscribe(value => {
      if (this.sseSub) {
        this.sseSub.unsubscribe();
        this.sseSub = null;
      }
      this.tableData = [];
      this.getDeployment(value);
    });
    // this.getDeploymentIntervel = setInterval(() => {
    //   this.getDeployment(JSON.parse(localStorage.getItem('environment') || '{}'));
    // }, 30000);

  }
  getDeployment(env: any): any {
    if (env) {
      this.sseSub = this.deploymentsService.liveDeploymentData(env.id).subscribe((res: any) => {
        if (res) {
          this.updateTableData(res.deployment);
          localStorage.setItem('availableDeployments', JSON.stringify(res.deployment?.map((x: any) => x.name)));
        }
      },
        err => {
          this.tableData = [];
        });
    }
  }
  statusCellRenderer(params: any): string {
    const status = params.value;
    const meta = this.sharedService.getStatusMeta(status);
    return `<span class="${meta.statusClass} text-capitalize"><i class="bi ${meta.icon}"></i> ${meta.label.toLowerCase()}</span>`;
  }

  gotoAction(params: any) {
    this.router.navigate(['/deployment/deployment-details'], { queryParams: { id: params.id } })
  }
  goToNewDeployment() {
    this.router.navigate(['/deployment/create-deployment'])
  }

  updateTableData(newData: any[]) {
    let changed = false;
    newData.forEach(newItem => {
      const index = this.tableData.findIndex(item => item.id === newItem.id);

      if (index > -1) {
        const existing = this.tableData[index];
        const hasChanges = Object.keys(newItem).some(
          key => existing[key] !== newItem[key]
        );

        if (hasChanges) {
          this.tableData[index] = { ...existing, ...newItem };
          changed = true;
        }

      } else {
        this.tableData.push(newItem);
        changed = true;
      }
    });
    if (changed) {
      this.tableData = [...this.tableData];
    }
  }

  ngOnDestroy(): void {
    clearInterval(this.getDeploymentIntervel)
    this.subscription?.unsubscribe();
    this.sseSub?.unsubscribe();
  }
}
