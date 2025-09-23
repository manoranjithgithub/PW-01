import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  ContainerComponent, ShadowOnScrollDirective,
  CardGroupComponent, CardComponent, CardBodyComponent
} from '@coreui/angular';

import { SharedService } from '../../shared/services/shared.service';
import { CommonModule } from '@angular/common';
import {  Subscription } from 'rxjs';
import { CellClickedEvent, ColDef } from 'ag-grid-community';
import { AgGridTableComponent } from '../../shared/components/ag-grid-table/ag-grid-table.component';
import { DefaultHeaderComponent } from '../../shared/components/layout';
import { ConfigurationService } from './configurations.service';
@Component({
    selector: 'app-configurations',
    standalone:true,
    imports: [RouterLink, DefaultHeaderComponent,
        ContainerComponent, ShadowOnScrollDirective, CardGroupComponent,
        CardComponent, CardBodyComponent, CommonModule, AgGridTableComponent],
    templateUrl: './configurations.component.html',
    styleUrl: './configurations.component.scss',
    providers: [ConfigurationService]
})
export class ConfigurationsComponent implements OnInit, OnDestroy {

  tableData = [];
  private subscription: Subscription | undefined;

  constructor(private http: ConfigurationService, private router: Router, private sharedService: SharedService) {
   // const storedValue = this.sharedService.getCookie('environment');
   const storedValue = localStorage.getItem('environment');
    if (storedValue && storedValue !== "undefined") {
      this.getAvailableConfigs(JSON.parse(storedValue));
    }
  }

  ngOnInit(): void {

   this.subscription = this.sharedService.envValueChange$.subscribe(value => {
      this.getAvailableConfigs(value);
    });
  }
  getAvailableConfigs(value: any) {
    if (value.id) {
      this.http.getConfigList(value.id).subscribe((res: any) => {
        if (res.success) {
          this.tableData = res.data;
        }
      }, error => {
        this.tableData = [];
      })
    }
  }

  createConfig() {
    this.router.navigate(['/create-config']);
  }
  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  columnDefs: ColDef[] = [
    {
      headerName: 'Name', field: 'name', sortable: true, filter: true, flex: 1,
      cellStyle: { cursor: 'pointer', textDecoration: 'underline', color: '#39f' },
      onCellClicked: (event: CellClickedEvent) =>
        this.gotoAction(event.data)
    },
    {
      headerName: 'Created At',
      field: 'createdAt',
      sortable: true,
      filter: false,
      flex: 1,
      sort: 'desc',
      valueFormatter: (params: any) => this.sharedService.formatDate(params.value)
    },

  ];

  gotoAction(value:any){
    this.router.navigate(['/create-config'],{ queryParams: { id: value.name} })
  }
}
