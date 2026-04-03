import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SharedService } from '../../shared/services/shared.service';
import { max, Subscription } from 'rxjs';
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
  // providers: [DeploymentsService]
})
export class DeploymentsComponent implements OnInit, OnDestroy {

  tableData: any[] = [];
  subscription?: Subscription;
  sseSub: Subscription | null = null;

  private tabHiddenAt: number | null = null;
  private isTabHidden = false;
  private lastEnv: any = null;
  private gridApi: any;

  getRowId = (params: any) => params.data.id;

  columnDefs: ColDef[] = [
    {
      headerName: 'Name',
      field: 'name',
      sortable: true,
      filter: true,
      // flex: 1,
      minWidth: 250,
      tooltipField: 'name',
      onCellClicked: (event: CellClickedEvent) => this.gotoAction(event.data)
    },
    {
      headerName: 'Date',
      field: 'createdAt',
      sortable: true,
      width: 130,
      filter: 'agTextColumnFilter',
      valueGetter: (params: any) => {
        if (!params.data?.createdAt) return '';
        const date = new Date(params.data.createdAt);
        return isNaN(date.getTime())
          ? ''
          : date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          });
      },
      onCellClicked: (event: CellClickedEvent) => this.gotoAction(event.data)
    },
    {
      headerName: 'URL',
      field: 'name',
      minWidth: 300,
      tooltipField: 'urlTooltip',
      cellRenderer: UrlCellRendererComponent
    },
    {
      headerName: 'Application Status',
      field: 'status',
      flex: 1,
      minWidth: 150,
      cellRenderer: (params: any) => this.statusCellRenderer(params),
      onCellClicked: (event: CellClickedEvent) => this.gotoAction(event.data)
    },
    {
      headerName: 'Last Release Status',
      field: 'releaseStatus',
      flex: 1,
      minWidth: 160,
      cellRenderer: (params: any) => this.statusCellRenderer(params)
    },
    {
      headerName: 'Instance Type',
      field: 'application.instanceType',
      flex: 1,
      minWidth: 150,
      sortable: true,
      filter: false,
      onCellClicked: (event: CellClickedEvent) => this.gotoAction(event.data)
    },
    {
      headerName: '',
      field: 'actions',
      width: 102,
      cellRenderer: ActionCellRendererComponent,
      valueGetter: (params) => { return params.data; },
      cellStyle: { cursor: 'pointer' },
      cellRendererParams: {
        additionalParam: 'deployment'
      }
    }
  ];

  constructor(
    private deploymentsService: DeploymentsService,
    private sharedService: SharedService,
    private router: Router
  ) { }

  onGridReady(params: any): void {
    this.gridApi = params.api;
  }

  ngOnInit(): void {
    const storedEnvironment = localStorage.getItem('environment');
    if (storedEnvironment && storedEnvironment !== 'undefined') {
      this.getDeployment(JSON.parse(storedEnvironment));
    }

    this.subscription = this.sharedService.envValueChange$.subscribe(env => {
      this.sseSub?.unsubscribe();
      this.sseSub = null;
      this.tableData = [];
      this.getDeployment(env);
    });

    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  getDeployment(env: any): void {
    if (!env || this.sseSub) return;

    this.lastEnv = env;
    this.sharedService.show();

    let firstEmit = true;

    this.sseSub = this.deploymentsService
      .liveDeploymentData(env.id)
      .subscribe(
        (res: any) => {
          if (res?.deployment) {
            // console.log('SSE deployment data', res.deployment);
            this.updateTableData(res.deployment);
            localStorage.setItem(
              'availableDeployments',
              JSON.stringify(res.deployment.map((x: any) => x.name))
            );
          }

          if (firstEmit) {
            firstEmit = false;
            this.sharedService.hide();
          }
        },
        () => {
          this.tableData = [];
          this.sharedService.hide();
        }
      );
  }

  handleVisibilityChange = () => {
    if (document.hidden) {
      if (this.isTabHidden) return;
      this.isTabHidden = true;
      this.tabHiddenAt = Date.now();

      this.sseSub?.unsubscribe();
      this.sseSub = null;

    } else {
      if (!this.isTabHidden) return;

      const idleTime = Date.now() - (this.tabHiddenAt ?? Date.now());

      this.isTabHidden = false;
      this.tabHiddenAt = null;

      if (this.lastEnv) {
        this.getDeployment(this.lastEnv);
      }
    }
  };

  updateTableData(newData: any[]) {
    if (!this.gridApi) {
      this.tableData = newData;
      return;
    }

    const itemsToUpdate: any[] = [];
    const itemsToAdd: any[] = [];

    newData.forEach(newItem => {
      const index = this.tableData.findIndex(item => item.id === newItem.id);

      if (index > -1) {
        const existing = this.tableData[index];
        const hasChanges = Object.keys(newItem).some(
          key => existing[key] !== newItem[key]
        );

        if (hasChanges) {
          itemsToUpdate.push(newItem);
          this.tableData[index] = newItem;
        }
      } else {
        itemsToAdd.push(newItem);
        this.tableData.push(newItem);
      }
    });

    if (itemsToUpdate.length > 0 || itemsToAdd.length > 0) {
      this.gridApi.applyTransaction({
        update: itemsToUpdate,
        add: itemsToAdd
      });
    }
  }

  statusCellRenderer(params: any): string {
    const meta = this.sharedService.getStatusMeta(params.value);
    return `
      <span class="${meta.statusClass} text-capitalize">
        <i class="bi ${meta.icon}"></i> ${meta.label.toLowerCase()}
      </span>
    `;
  }

  gotoAction(data: any) {
    this.router.navigate(['/applications/application-details'], {
      queryParams: { id: data.id }
    });
  }

  goToNewDeployment() {
    this.router.navigate(['/applications/create-application']);
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    this.sseSub?.unsubscribe();
    if (this.gridApi) {
      this.gridApi.destroy();
      this.gridApi = null;
    }

    this.tableData = [];
    this.lastEnv = null;
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
  }
}
