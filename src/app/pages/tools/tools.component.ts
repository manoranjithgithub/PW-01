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
  rowClassRules = {
    'tool-row-disabled': (params: any) => this.isToolInstalling(params?.data)
  };

  private subscription: Subscription | undefined;
  toolName: string = '';
  getToolsIntervel: any
  isShowToolDetails: boolean = false;
  sseSub: Subscription | null = null;
  statusSseSub: Subscription | null = null;
  initialStatusUpdated = false;

  private tabHiddenAt: number | null = null;
  private isTabHidden = false;
  private lastEnvId: string | null = null;
  private gridApi: any;

  getRowId = (params: any) => params.data._id;

  constructor(private http: ToolsService,
    private router: Router, private sharedService: SharedService, private modalService: NgbModal,
    private toaster: ToastrService, public permissionService: PermissionService,
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
      if (this.statusSseSub) {
        this.statusSseSub.unsubscribe();
        this.statusSseSub = null;
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
      tooltipValueGetter: (params: any) => this.getToolHoverMessage(params.data),
      cellRenderer: (params: any) => {
        return `<img src="${params.value}" alt="${params.data.name}" width="24" height="24" />`;
      },
      onCellClicked: (event: CellClickedEvent) =>
        this.gotoAction(event.data)
    },
    {
      headerName: 'Name', field: 'name', sortable: true, filter: true, maxWidth: 250,
      cellStyle: { cursor: 'pointer', color: '#181d1f' },
      tooltipValueGetter: (params: any) => this.getToolHoverMessage(params.data),
      onCellClicked: (event: CellClickedEvent) =>
        this.gotoAction(event.data)
    },
    {
      headerName: 'Status',
      field: 'status',
      sortable: true,
      filter: true,
      width: 150,
      tooltipValueGetter: (params: any) => this.getToolHoverMessage(params.data),
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
      headerName: 'HOST',
      field: 'privateHost',
      tooltipValueGetter: (params: any) => this.getToolHoverMessage(params.data),
      cellRenderer: (params: any) => {
        const privateUrl = params.data?.privateHost || '';
        const publicUrl = params.data?.publicHost || '';
        const parts: string[] = [];

        const makePart = (url: string, label: string) => {
          if (!url) return '';
          const rawUrl = String(url);
          const escapedUrl = rawUrl
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
          const copyUrl = rawUrl.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
          const id = `copy-${label}-${params.rowIndex}-${Math.random().toString(36).substring(2, 5)}`;
          const isSecureLink = escapedUrl.startsWith('https');
          const isAccessible = params.data?.endpointStatus === 'accessible';
          const displayLabel = label === 'private' ? 'Private' : 'Public';
          const copyTitle = isSecureLink ? 'Copy URL' : 'Copy Host Name';
          const iconId = `${id}-icon`;
          const copyButton = (isAccessible || !isSecureLink)
            ? `<button type="button" class="copy-host-btn" title="${copyTitle}"
                onclick="(function(event){ event.preventDefault(); event.stopPropagation(); navigator.clipboard.writeText('${copyUrl}'); const icon = document.getElementById('${iconId}'); if (!icon) return; icon.className = 'bi bi-check2 copy-host-icon copy-host-icon-success'; setTimeout(function(){ icon.className = 'bi bi-clipboard copy-host-icon'; }, 2000); })(event)">
                <i id="${iconId}" class="bi bi-clipboard copy-host-icon"></i>
              </button>`
            : `<button type="button" class="copy-host-btn disabled" title="Copy disabled" disabled onclick="event.preventDefault(); event.stopPropagation(); return false;">
                <i class="bi bi-clipboard copy-host-icon"></i>
              </button>`;

          const hostTitle = isSecureLink
            ? (isAccessible ? 'Click to copy URL' : 'Endpoint not ready yet')
            : 'Click to copy host name';
          const hostPart = (isAccessible || !isSecureLink)
            ? `<button type="button" class="host-link host-link-button" title="${hostTitle}"
                onclick="(function(event){ event.preventDefault(); event.stopPropagation(); navigator.clipboard.writeText('${copyUrl}'); const icon = document.getElementById('${iconId}'); if (!icon) return; icon.className = 'bi bi-check2 copy-host-icon copy-host-icon-success'; setTimeout(function(){ icon.className = 'bi bi-clipboard copy-host-icon'; }, 2000); })(event)">
                ${escapedUrl}
              </button>`
            : `<span title="${hostTitle}" class="host-link host-link-disabled">${escapedUrl}</span>`;

          if (isSecureLink) {
            if (isAccessible) {
              // handled in hostPart
            }
          }

          return `
            <div class="host-row-entry">
              <span class="host-pill ${label}">${displayLabel}</span>
              ${hostPart}
              ${copyButton}
            </div>`;
        };

        if (privateUrl) parts.push(makePart(privateUrl, 'private'));
        if (publicUrl) parts.push(makePart(publicUrl, 'public'));

        return parts.join('');
      },
      // sortable: true,
      // filter: true,
      flex: 1,
    },
    {
      headerName: 'Port',
      tooltipValueGetter: (params: any) => this.getToolHoverMessage(params.data),
      cellRenderer: (params: any) => {
        const rawPorts = params.data?.ports;
        const portItems = Array.isArray(rawPorts) ? rawPorts : (rawPorts ? [rawPorts] : []);

        const escapeJsString = (value: string) => value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
        const MAX_VISIBLE_CHIPS = 2;

        const makePart = (values: Array<string | number>, label: string) => {
          const normalized = values
            .filter((value) => value !== null && value !== undefined && value !== '')
            .map((value) => String(value));
          if (!normalized.length) return '';

          const displayLabel = label === 'private' ? 'Private' : 'Public';
          const visibleValues = normalized.slice(0, MAX_VISIBLE_CHIPS);
          const remainingValues = normalized.slice(MAX_VISIBLE_CHIPS);
          const selectedView = encodeURIComponent(String(params.data?.name || ''));
          const toolId = encodeURIComponent(String(params.data?.id || ''));

          const chips = visibleValues.map((value) => {
            const escaped = escapeJsString(value);
            return `<button type="button" class="port-chip-copy" title="Copy"
                onclick="(function(event){ event.preventDefault(); event.stopPropagation(); navigator.clipboard.writeText('${escaped}'); const btn = event.currentTarget; if (!btn) return; btn.setAttribute('title', 'Copied'); btn.classList.remove('show-copied-tip'); void btn.offsetWidth; btn.classList.add('show-copied-tip'); setTimeout(function(){ btn.setAttribute('title', 'Copy'); btn.classList.remove('show-copied-tip'); }, 1200); })(event)">
                ${value}
              </button>`;
          });

          if (remainingValues.length) {
            chips.push(`<button type="button" class="port-more-btn" title="show more"
                onclick="(function(event){ event.preventDefault(); event.stopPropagation(); window.location.href='/tools/view-tool?selectedView=${selectedView}&id=${toolId}#network-section'; })(event)">
                +${remainingValues.length}
              </button>`);
          }

          return `
            <div class="port-row-entry">
              <span class="host-pill ${label}">${displayLabel}</span>
              <div class="port-chip-list">
                ${chips.join('')}
              </div>
            </div>`;
        };

        const privatePorts = portItems
          .map((port: any) => port?.privatePort)
          .filter((value: any) => value !== undefined && value !== null && value !== '');
        const publicPorts = portItems
          .map((port: any) => port?.publicPort)
          .filter((value: any) => value !== undefined && value !== null && value !== '');

        const parts = [
          makePart(privatePorts, 'private'),
          makePart(publicPorts, 'public')
        ].filter(Boolean);

        return parts.length ? parts.join('') : '-';
      },
      width: 220,
    },
    {
      headerName: "Actions",
      field: "actions",
      width: 100,
      cellStyle: { cursor: 'pointer' },
      tooltipValueGetter: (params: any) => this.getToolHoverMessage(params.data),
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
    if (this.isToolInstalling(params)) {
      return;
    }
    this.toolName = params.name;
    this.router.navigate(['/tools/view-tool'], { queryParams: { selectedView: this.toolName, id: params.id } })
  }

  getToolHoverMessage(params: any): string | null {
    if (this.isToolInstalling(params)) {
      return 'Tool is deploying. Please wait until it is up.';
    }
    return null;
  }

  isToolInstalling(params: any): boolean {
    const status = String(params?.status || '').toLowerCase();
    return status === 'deploying' || status === 'not available';
  }

  getAvailableTools(envId: string): void {
    if (!envId || this.sseSub) return;
    if (this.statusSseSub) {
      this.statusSseSub.unsubscribe();
      this.statusSseSub = null;
    }

    this.lastEnvId = envId;
    this.initialStatusUpdated = false;
    this.sharedService.show();

    let firstEmit = true;

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

        if (firstEmit) {
          firstEmit = false;
          // Fetch statuses immediately on load and render only after status refresh completes
          this.getToolsStatus(true);
        }
      },
      () => {
        this.rowData = [];
        this.initialStatusUpdated = true;
        this.sharedService.hide();
      }
    );
  }
  handleVisibilityChange = () => {
    if (document.hidden) {
      if (this.isTabHidden) return;

      // console.log('Tab hidden → stopping tools SSE');
      this.isTabHidden = true;
      this.tabHiddenAt = Date.now();

      this.sseSub?.unsubscribe();
      this.sseSub = null;
      this.statusSseSub?.unsubscribe();
      this.statusSseSub = null;

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
    modalRef.componentInstance.requireConfirmation = true;
    modalRef.componentInstance.confirmationWord = this.toolName;

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
    // console.log('Determining icon for tool:', toolName);
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
    } if (name.includes('n8n')) {
      return 'assets/images/icons/n8n.png';
    }
    if (name.includes('minio')) {
      return 'assets/images/icons/minio.png';
    }
    if (name.includes('rabbitmq')) {
      return 'assets/images/icons/rabbitmq.png';
    }
    return 'assets/images/icons/default-tool.png';
  }

  updateTools(newTools: any[]) {
    let changed = false;
    newTools.forEach(newTool => {
      const index = this.rowData.findIndex((t: any) => t._id === newTool._id);
      const { status, ...updateFields } = newTool;

      if (index > -1) {
        const existing = this.rowData[index];

        const hasChanges = Object.keys(updateFields).some(
          key => existing[key] !== updateFields[key]
        );

        if (hasChanges) {
          this.rowData[index] = { ...existing, ...updateFields };
          changed = true;
        }

      } else {
        this.rowData.push(updateFields);
        changed = true;
      }
    });
    if (changed) {
      this.rowData = [...this.rowData];
    }
  }

  getToolsStatus(initial = false) {
  const finalizeInitial = () => {
    if (initial) {
      this.initialStatusUpdated = true;
      this.sharedService.hide();
    }
  };
  if (!this.rowData?.length) {
    finalizeInitial();
    return;
  }
  if (this.statusSseSub) return;
  const req = {
    environmentId: this.lastEnvId || "",
    workloadIds: this.rowData.map((tool: any) => tool.id) || [],
    type: "tool"
  };
  this.statusSseSub = this.http.getDeploymentStatus(req).subscribe({
    next: (res: any) => {
      const statusMap = new Map<string, string>(
        (res?.data || [])
          .filter((item: any) => item?.deploymentId)
          .map((item: any) => [
            item.deploymentId,
            item.status === 'UNKNOWN' ? 'not available' : (item.status || 'not available')
          ])
      );
      this.rowData = this.rowData.map((tool: any) => ({
        ...tool,
        status: statusMap.get(tool.id) ?? 'not available'
      }));
      this.gridApi?.refreshCells({ force: true });
      finalizeInitial();
    },
    error: (err: any) => {
      console.error('Error fetching tools status', err);
      finalizeInitial();
    }
  });
}

  ngOnDestroy(): void {
    clearInterval(this.getToolsIntervel);
    this.subscription?.unsubscribe();
    this.sseSub?.unsubscribe();
    this.sseSub = null;
    this.statusSseSub?.unsubscribe();
    this.statusSseSub = null;
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
  }
}
