import { Component, EventEmitter, Input, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { ColDef, GridApi, GridOptions, GridReadyEvent } from 'ag-grid-community';
import { AgGridAngular, AgGridModule } from 'ag-grid-angular';
import { CommonModule } from '@angular/common';
import { LoaderComponent } from '../loader/loader.component';
import { SharedService } from '../../services/shared.service';
import { ActionCellRendererComponent } from '../action-cell-renderer/action-cell-renderer.component';
import { Router } from '@angular/router';
import { map } from 'rxjs';

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
  tableTheme = 'ag-theme-alpine';
  tableData = [];
  paginationPageSize = 20;
  @Input() showProjectButton: boolean = false;
  @Input() showDeployButton: boolean = false;
  @Input({ required: false }) showAddUser: boolean = false;
  @Output() goToNewDeployModel = new EventEmitter<boolean>();
  @Output() rowClicked = new EventEmitter<boolean>();
  @Output() addUuserEvent = new EventEmitter<boolean>();
  tableName: string = '';
  tablebtn: string = '';
  overlayMessage: string = '';


  private gridApi!: GridApi;

  onGridReady(params: GridReadyEvent) {
    this.gridApi = params.api;
    this.overlayMessage = `You do not have a ${this.tableName}, please click 'New ${this.tablebtn}' to create one.`;
  //    setTimeout(() => {
  //   this.gridApi.sizeColumnsToFit(); 
  // }, 0);
  }

  defaultColDef =
    {
      resizable: true,
      wrapText: true,
      autoHeight: true,
      minWidth: 50,
      suppressSizeToFit: true,
    };

  gridOptions: GridOptions = {
    rowHeight: 50,
    suppressRowTransform: true,
    enableBrowserTooltips: true,
    onGridReady: (params) => this.onGridReady(params),
  };


  constructor(private sharedService: SharedService, private router: Router) {
    // this.tableTheme = this.sharedService.getCookie('theme');
    this.tableTheme = localStorage.getItem('theme') || 'ag-theme-alpine';
    const urlSegments = this.router.url.split('/').filter(Boolean);
    this.tableName = urlSegments[urlSegments.length - 1] == 'tools' ? 'tool' : urlSegments[urlSegments.length - 1];
    this.tablebtn = urlSegments[urlSegments.length - 1] == 'deployment' ? 'Deploy' : 'Tool';

  }

  ngOnInit(): void {
    this.sharedService.valueChange$.subscribe(value => {
      this.tableTheme = value;
    });
    // this.gridApi.hideOverlay();
    this.sharedService.isLoading$.subscribe((isLoading: boolean) => {
      if (isLoading) {
        this.overlayMessage = 'Loading...';
        this.gridApi.showNoRowsOverlay();
      } else {
        if (this.rowData && this.rowData.length > 0) {
          this.overlayMessage = '';
          this.gridApi.hideOverlay();
        } else {
          this.overlayMessage = `You do not have a ${this.tableName}, please click 'New ${this.tablebtn}' to create one.`;
          this.gridApi.showNoRowsOverlay();
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
    this.router.navigate(['/create-project'])
  }
  addNewUser() {
    this.addUuserEvent.emit(true);
  }
  get noRowsTemplate(): string {
    return `<div class="text-center py-4">${this.overlayMessage}</div>`;
  }
}
