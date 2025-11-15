import { Component, OnDestroy, OnInit } from '@angular/core';
import { AgGridModule } from 'ag-grid-angular';
import { ColDef, CellClickedEvent } from 'ag-grid-community';
import { CommonModule } from '@angular/common';
import {
  CardGroupComponent, CardComponent, CardBodyComponent, NavComponent, NavItemComponent, NavLinkDirective, TabContentRefDirective, TabContentComponent, RoundedDirective, TabPaneComponent
} from '@coreui/angular';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
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

  private subscription: Subscription | undefined;
  toolName: string = '';
  loading: boolean = true;
  getToolsIntervel: any

  constructor(private http: ToolsService,
    private router: Router, private sharedService: SharedService
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
        const meta = this.sharedService.getStatusMeta(status);

        return `
            <span style="display: flex; align-items: center; gap: 5px;" class="${meta.statusClass}">
              <i class="bi ${meta.icon}"></i>
              <span class="text-capitalize">${meta.label}</span>
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
    this.router.navigate(['/tools/create-tool'])
  }

  gotoAction(params: any) {
    this.toolName = params.name;
    this.router.navigate(['/tools/view-tool'], { queryParams: { selectedView: this.toolName } })
  }

  getAvailableTools(value: any): void {
    if (value) {
      this.http.getToolsList(value).subscribe((res: any) => {
        if (res.status) {
          this.rowData = res.data.map((tool: any) => ({
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
  showToolsTable() {
    this.isShowTable = true;
  }

  ngOnDestroy(): void {
    clearInterval(this.getToolsIntervel)
    this.subscription?.unsubscribe();
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
