import { Component, EventEmitter, Input, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { ColDef, GridApi, GridOptions, GridReadyEvent } from 'ag-grid-community';
import { AgGridAngular, AgGridModule } from 'ag-grid-angular';
import { CommonModule } from '@angular/common';
import { LoaderComponent } from '../loader/loader.component';
import { SharedService } from '../../services/shared.service';
import { PermissionService } from '../../services/permission.service';
import { ActionCellRendererComponent } from '../action-cell-renderer/action-cell-renderer.component';
import { Router } from '@angular/router';
@Component({
  selector: 'app-ag-grid-table',
  standalone: true,
  imports: [CommonModule, AgGridModule, LoaderComponent],
  templateUrl: './ag-grid-table.component.html',
  styleUrls: ['./ag-grid-table.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AgGridTableComponent implements OnInit {
  @Input() columnDefs: ColDef[] = [];
  @Input() rowData: any[] = [];
  @Input() getRowId?: (params: any) => any;
  tableTheme = 'ag-theme-alpine';
  tableData = [];
  paginationPageSize = 20;
  @Input() showProjectButton: boolean = false;
  @Input() showDeployButton: boolean = false;
  @Input({ required: false }) showAddUser: boolean = false;
  @Output() goToNewDeployModel = new EventEmitter<boolean>();
  @Output() rowClicked = new EventEmitter<boolean>();
  @Output() addUuserEvent = new EventEmitter<boolean>();
  @Output() gridReady = new EventEmitter<GridReadyEvent>();
  tableName: string = '';
  tablebtn: string = '';
  overlayMessage: string = '';

  private gridApi!: GridApi;

  onGridReady(params: GridReadyEvent) {
    this.gridApi = params.api;
    this.gridReady.emit(params);
    this.overlayMessage = `You do not have  ${this.tableName}${this.tableName === 'invoice-list' ? '.' : `, please click 'New ${this.tablebtn}' to create one.`}`;

  }

  defaultColDef =
    {
      resizable: true,
      // wrapText: true,
      autoHeight: true,
      minWidth: 50,
      suppressSizeToFit: true,
      // flex:1
    };

  get gridOptions(): GridOptions {
    const options: GridOptions = {
      rowHeight: 50,
      suppressRowTransform: true,
      enableBrowserTooltips: true,
      suppressLoadingOverlay: true,
      onGridReady: (params) => this.onGridReady(params),
    };
    
    if (this.getRowId) {
      options.getRowId = (params) => this.getRowId!(params);
    }
    
    return options;
  }


  constructor(private sharedService: SharedService, private router: Router, public permissionService: PermissionService) {
    this.tableTheme = localStorage.getItem('theme-default') || 'ag-theme-alpine';
    const urlSegments = this.router.url.split('/').filter(Boolean);
    this.tableName = urlSegments[urlSegments.length - 1] == 'tools' ? 'tool' : urlSegments[urlSegments.length - 1];
    const lastSegment = urlSegments[urlSegments.length - 1];
    this.tablebtn = this.capitalizeFirstLetter(lastSegment);

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
  getCurrentEnvId(): string | undefined {
    const e = localStorage.getItem('environment');
    if (!e || e === 'undefined') return undefined;
    try {
      const parsed = JSON.parse(e);
      return parsed?.id || undefined;
    } catch {
      return e || undefined;
    }
  }
  capitalizeFirstLetter(word?: string) {
    if (!word || typeof word !== 'string' || word.length === 0) return '';
    return word.charAt(0).toUpperCase() + word.slice(1);
  }
  ngOnInit(): void {
    this.sharedService.valueChange$.subscribe(value => {
      this.tableTheme = value;
    });
    this.sharedService.isLoading$.subscribe((isLoading: boolean) => {
      if (isLoading) {
        this.overlayMessage = '';
        if (this.gridApi && !this.gridApi.isDestroyed()) {
          this.gridApi.showNoRowsOverlay();
        }
      } else {
        if (this.rowData && this.rowData.length > 0) {
          this.overlayMessage = '';
          if (this.gridApi && !this.gridApi.isDestroyed()) {
            this.gridApi.hideOverlay();
          }
        } else {
          this.overlayMessage = `You do not have  ${this.tableName}${this.tableName === 'invoice-list' ? '.' : `, please click 'New ${this.tablebtn}' to create one.`}`;
          if (this.gridApi && !this.gridApi.isDestroyed()) {
            this.gridApi.showNoRowsOverlay();
          }
        }
      }
    });
    this.gridOptions.components = {
      actionDropdownRenderer: ActionCellRendererComponent
    };
  }

  onFilterTextBoxChanged() {
    this.gridApi.setGridOption(
      "quickFilterText",
      (document.getElementById("filter-text-box") as HTMLInputElement).value,
    );
  }

  newDeploy() {
    this.goToNewDeployModel.emit(true);
  }
  getSeletedRow(data: any) {
    this.rowClicked.emit(data.data)
  }
  newProject() {
    if (this.permissionService.canAdminGlobal()) {
      this.router.navigate(['/projects/create-project']);
    }
  }
  addNewUser() {
    this.addUuserEvent.emit(true);
  }
  get noRowsTemplate(): string {
    return `<div class="text-center py-4">${this.overlayMessage}</div>`;
  }
}
