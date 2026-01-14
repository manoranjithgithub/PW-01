import { Component, OnDestroy, OnInit } from '@angular/core';
import { ColDef, CellClickedEvent, ColGroupDef } from 'ag-grid-community';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ConfirmationModalComponent } from '../../shared/components/modal/confirmation-modal/confirmation-modal.component';
import { LoaderComponent } from '../../shared/components/loader/loader.component';
import { SharedService } from '../../shared/services/shared.service';
import { ToolsService } from './tools.service';
import { ActionCellRendererComponent } from '../../shared/components/action-cell-renderer/action-cell-renderer.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { SHARED_IMPORTS } from '../../shared/shared-imports';
import { PermissionService } from '../../shared/services/permission.service';
@Component({
  selector: 'app-tools',
  standalone: true,
  imports: [ConfirmationModalComponent, LoaderComponent, SHARED_IMPORTS],
  providers: [ToolsService],
  templateUrl: './tools.component.html',
  styleUrl: './tools.component.scss'
})
export class ToolsComponent implements OnInit, OnDestroy {
  envId: string = '';
  rowData: any = [];

  private subscription: Subscription | undefined;
  toolName: string = '';
  getToolsIntervel: any
  isShowToolDetails: boolean = false;
  sseSub: Subscription | null = null;

  private tabHiddenAt: number | null = null;
  private isTabHidden = false;
  private lastEnvId: string | null = null;
  private gridApi: any;

  getRowId = (params: any) => params.data._id;

  constructor(private http: ToolsService,
    private router: Router, private sharedService: SharedService, private modalService: NgbModal,
    private toaster: ToastrService, public permissionService: PermissionService
  ) {
    const storedValue = localStorage.getItem('environment');
    if (storedValue && storedValue !== "undefined") {
      this.envId = JSON.parse(storedValue).id;
      this.lastEnvId = this.envId;
    }
  }

  getCurrentProjectId(): string | undefined {
    const p = localStorage.getItem('project');
    if (!p || p === 'undefined') return undefined;
    try {
      const parsed = JSON.parse(p);
      return parsed?.id || undefined;
    } catch {
      return p || undefined;
    }
  }

  onGridReady(params: any): void {
    this.gridApi = params.api;
  }

  ngOnInit(): void {
    this.subscription = this.sharedService.envValueChange$.subscribe((value: any) => {
      const savedEnv = localStorage.getItem('environment');
      if (!savedEnv) {
        this.router.navigate(['/environments']);
        return;
      }
      const envObj = JSON.parse(savedEnv);
      const envId = envObj.id;
      this.envId = envId;
      this.lastEnvId = this.envId;

      if (this.sseSub) {
        this.sseSub.unsubscribe();
        this.sseSub = null;
      }
      this.rowData = [];
      this.getAvailableTools(envId);
    });
    // ensure we always (re)connect when the component initializes
    try {
      const env = localStorage.getItem('environment');
      if (env && env !== 'undefined') {
        const envObj = JSON.parse(env);
        if (envObj?.id) {
          this.getAvailableTools(envObj.id);
        }
      }
    } catch (e) {
      console.warn('Could not parse environment from localStorage', e);
    }
    // this.getToolsIntervel = setInterval(() => {
    //   this.getAvailableTools(JSON.parse(localStorage.getItem('environment') || '{}').id);
    // }, 30000);
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  columnDefs: (ColDef | ColGroupDef)[] = [
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
      headerName: 'Name', field: 'name', sortable: true, filter: true, maxWidth: 250,
      cellStyle: { cursor: 'pointer', color: '#181d1f' },
      onCellClicked: (event: CellClickedEvent) =>
        this.gotoAction(event.data)
    },
    {
      headerName: 'Status',
      field: 'status',
      sortable: true,
      filter: true,
      width: 150,
      // flex: 1,
      cellRenderer: (params: any) => {
        const status = params.value;
        const meta = this.sharedService.getStatusMeta(status);
        return `
            <span style="display: flex; align-items: center; gap: 5px;" class="${meta.statusClass}">
              <i class="bi ${meta.icon}"></i>
              <span class="text-capitalize">${meta.label}</span>
            </span>
          `;
      }
    },
    {
      headerName: 'Host',
      field: 'privateHost',
      // minWidth:300,
      cellRenderer: (params: any) => {
        const privateUrl = params.data?.privateHost || '';
        const publicUrl = params.data?.publicHost || '';
        const parts: string[] = [];

        const makePart = (url: string, label: string) => {
          if (!url) return '';
          const escapedUrl = String(url).replace(/"/g, '&quot;').replace(/'/g, "\\'");
          const id = `copy-${label}-${params.rowIndex}-${Math.random().toString(36).substring(2, 5)}`;
          const isSecureLink = escapedUrl.startsWith('https');
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
            ? `<i class="bi bi-clipboard-check" style="cursor: pointer; position: relative;font-size: 18px; color: #F60;" 
                onmouseenter="document.getElementById('${id}').innerText = 'Copy'" 
                onclick="(function(){ navigator.clipboard.writeText('${escapedUrl}'); const tooltip = document.getElementById('${id}'); tooltip.innerText = 'Copied!'; tooltip.style.opacity = '1'; setTimeout(() => { tooltip.innerText = 'Copy'; tooltip.style.opacity = '0'; }, 1000); })()" 
                title="${copyTooltip}"></i>`
            : `<i class="bi bi-clipboard" style="cursor: not-allowed; opacity: 0.5;" title="Copy disabled"></i>`;

          const displayLabel = label === 'private' ? 'Private' : 'Public';
          return `
            <span style="margin-bottom:4px;">
              ${clipboardIcon}
              <span id="${id}" style="position: absolute; background: black; color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px; opacity: 0; transition: opacity 0.2s; pointer-events: none; z-index: 1000;">Copy</span>
              <span style="font-weight:600; font-size:12px; color:#333; margin-right:4px;">${displayLabel}:</span>
              ${linkPart}
            </span><br/>`;
        };

        if (privateUrl) parts.push(makePart(privateUrl, 'private'));
        if (publicUrl) parts.push(makePart(publicUrl, 'public'));

        return parts.join('');
      },
      // sortable: true,
      // filter: true,
      flex: 1
    },
    {
      headerName: 'Public Port',
      field: 'publicPort',
      width: 120,
      cellStyle: { textAlign: 'center' }
    },
    {
      headerName: 'Private Port',
      field: 'privatePort',
      width: 120,
      cellStyle: { textAlign: 'center' }
    },
    // {
    //   headerName: 'Port',
    //   marryChildren: true,
    //   headerClass: 'center-header',
    //   children: [
    //     {
    //       headerName: 'Public',
    //       field: 'publicPort',
    //       width: 100,
    //       cellStyle: { textAlign: 'center' }
    //     },
    //     {
    //       headerName: 'Private',
    //       field: 'privatePort',
    //       width: 100,
    //       cellStyle: { textAlign: 'center' }
    //     }
    //   ]
    // },
    {
      headerName: "Actions",
      field: "actions",
      width: 100,
      cellStyle: { cursor: 'pointer' },
      cellRenderer: ActionCellRendererComponent,
      cellRendererParams: {
        additionalParam: 'tools',
      },
    }
  ];

  addTools() {
    this.router.navigate(['/tools/create-tool'])
  }

  gotoAction(params: any) {
    this.toolName = params.name;
    this.router.navigate(['/tools/view-tool'], { queryParams: { selectedView: this.toolName } })
  }

  getAvailableTools(envId: string): void {
    if (!envId || this.sseSub) return;

    this.lastEnvId = envId;
    this.sharedService.show();

    this.sseSub = this.http.liveToolsData(envId).subscribe(
      (res: any) => {
        if (res?.tools) {
          const newTools = Object.values(res.tools).map((tool: any) => ({
            ...tool,
            icon: this.getToolIcon(tool.schemaId)
          }));

          this.updateTools(newTools);
          localStorage.setItem(
            'availableTools',
            JSON.stringify(newTools.map((tool: any) => tool.name))
          );
        }
        this.sharedService.hide();
      },
      () => {
        this.rowData = [];
        this.sharedService.hide();
      }
    );
  }
  handleVisibilityChange = () => {
    if (document.hidden) {
      if (this.isTabHidden) return;

      console.log('Tab hidden → stopping tools SSE');
      this.isTabHidden = true;
      this.tabHiddenAt = Date.now();

      this.sseSub?.unsubscribe();
      this.sseSub = null;

    } else {
      if (!this.isTabHidden) return;

      const idleTime = Date.now() - (this.tabHiddenAt ?? Date.now());
      // console.log(`Tab visible → idle ${idleTime} ms`);

      this.isTabHidden = false;
      this.tabHiddenAt = null;

      if (this.lastEnvId) {
        this.getAvailableTools(this.lastEnvId);
      }
    }
  };

  openHost(params: any) {
    window.open(`https://${params?.host}`, '_blank');
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

  updateTools(newTools: any[]) {
    let changed = false;
    newTools.forEach(newTool => {
      const index = this.rowData.findIndex((t: any) => t._id === newTool._id);

      if (index > -1) {
        const existing = this.rowData[index];

        const hasChanges = Object.keys(newTool).some(
          key => existing[key] !== newTool[key]
        );

        if (hasChanges) {
          this.rowData[index] = { ...existing, ...newTool };
          changed = true;
        }

      } else {
        this.rowData.push(newTool);
        changed = true;
      }
    });
    if (changed) {
      this.rowData = [...this.rowData];
    }
  }



  ngOnDestroy(): void {
    clearInterval(this.getToolsIntervel)
    this.subscription?.unsubscribe();
    this.sseSub?.unsubscribe();
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
  }
}
