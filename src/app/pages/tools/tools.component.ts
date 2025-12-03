import { Component, OnDestroy, OnInit } from '@angular/core';
import { ColDef, CellClickedEvent } from 'ag-grid-community';
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
  loading: boolean = true;
  getToolsIntervel: any
  isShowToolDetails: boolean = false;
  sseSub: Subscription | null = null;


  constructor(private http: ToolsService,
    private router: Router, private sharedService: SharedService, private modalService: NgbModal,
    private toaster: ToastrService
  ) {
    const storedValue = localStorage.getItem('environment');
    if (storedValue && storedValue !== "undefined") {
      this.envId = JSON.parse(storedValue).id
      this.getAvailableTools(JSON.parse(storedValue).id);
    }
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

      if (this.sseSub) {
        this.sseSub.unsubscribe();
        this.sseSub = null;
      }
      this.getAvailableTools(envId);
    });
    this.getAvailableTools(JSON.parse(localStorage.getItem('environment') || '{}').id)
    // this.getToolsIntervel = setInterval(() => {
    //   this.getAvailableTools(JSON.parse(localStorage.getItem('environment') || '{}').id);
    // }, 30000);
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

          ? `<i class="bi bi-clipboard-check" style="cursor: pointer; position: relative;font-size: 20px; color: #F60;" 
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
          background: black;
          color: white;
          padding: 5px 10px;
          border-radius: 5px;
          font-size: 12px;
          opacity: 0;
          transition: opacity 0.2s;
          pointer-events: none;
          z-index: 1000;
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
    this.router.navigate(['/tools/create-tool'])
  }

  gotoAction(params: any) {
    this.toolName = params.name;
    this.router.navigate(['/tools/view-tool'], { queryParams: { selectedView: this.toolName } })
  }

  getAvailableTools(value: any): any {
    if (value) {
      this.sseSub = this.http.liveToolsData(value).subscribe((res: any) => {
        if (res) {
          this.rowData = Object.values(res.tools)?.map((tool: any) => ({
            ...tool,
            icon: this.getToolIcon(tool.schemaId)
          }));
          localStorage.setItem('availableTools', JSON.stringify(res.data?.map((tool: any) => tool.name)));
          this.loading = false
        }
      }, error => {
        this.rowData = [];
        this.loading = false
      })
    }
  }

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

  ngOnDestroy(): void {
    clearInterval(this.getToolsIntervel)
    this.subscription?.unsubscribe();
    this.sseSub?.unsubscribe();
  }
}
