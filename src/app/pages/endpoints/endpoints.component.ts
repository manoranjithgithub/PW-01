import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import {
  ContainerComponent, ShadowOnScrollDirective, InputGroupComponent, InputGroupTextDirective,
  FormControlDirective, CardGroupComponent, CardComponent, CardBodyComponent, FormCheckInputDirective,
  FormCheckLabelDirective, FormDirective, FormCheckComponent
} from '@coreui/angular';
import { ToastrService } from 'ngx-toastr';
import { SharedService } from '../../shared/services/shared.service';
import { Subscription } from 'rxjs';
import { CellClickedEvent, ColDef } from 'ag-grid-community';
import { AgGridTableComponent } from '../../shared/components/ag-grid-table/ag-grid-table.component';
import { DefaultHeaderComponent } from '../../shared/components/layout';
import { EndpointsService } from './endpoints.service';

@Component({
    selector: 'app-endpoints',
    standalone:true,
    imports: [
        CommonModule, RouterLink, RouterOutlet,
        DefaultHeaderComponent, ContainerComponent, ShadowOnScrollDirective, InputGroupComponent,
        InputGroupTextDirective, FormControlDirective, CardGroupComponent, CardComponent, FormCheckInputDirective,
        FormCheckLabelDirective, CardBodyComponent, FormDirective, FormCheckComponent, CommonModule, AgGridTableComponent
    ],
    templateUrl: './endpoints.component.html',
    styleUrls: ['./endpoints.component.scss'],
    providers: [EndpointsService]
})
export class EndpointsComponent implements OnInit, OnDestroy {

  rowData = [];
  private subscription: Subscription | undefined;

  constructor(
    private http: EndpointsService,
    private toaster: ToastrService,
    private router: Router,
    private sharedService: SharedService
  ) {
    // const storedValue = this.sharedService.getCookie('environment');
    const storedValue = localStorage.getItem('environment');
    if (storedValue && storedValue !== "undefined") {
      this.getEnvironment(JSON.parse(storedValue));
    }
  }

  columnDefs: ColDef[] = [
    {
      headerName: 'Name', field: 'name', sortable: true, filter: true, flex: 1,
      cellStyle: { cursor: 'pointer', textDecoration: 'underline', color: '#39f' },
      onCellClicked: (event: CellClickedEvent) =>
        this.gotoAction(event.data)
    },
    {
      headerName: 'Endpoint', field: 'host', sortable: true, flex: 1,
      cellStyle: { cursor: 'pointer', textDecoration: 'underline', color: '#39f' },
      onCellClicked: (event: CellClickedEvent) =>
        this.openHost(event.data)
    },
    {
      headerName: 'Authentication',
      field: 'authentication',
      sortable: true,
      flex: 1,
      cellRenderer: (params: any) => {
        const status = params.value
          ? { text: 'Authenticated', class: 'badge-success' }
          : { text: 'Not Authenticated', class: 'badge-danger' };

        return `<span class="badge ${status.class}">${status.text}</span>`;
      },
      cellStyle: { textAlign: 'left' }
    },
    {
      headerName: 'Created At',
      sortable:true,
      sort:'desc',
      field: 'createdAt',
      width: 150,
      valueFormatter: (params: any) => this.sharedService.formatDate(params.value)
    }

  ];

  ngOnInit(): void {
    this.subscription = this.sharedService.envValueChange$.subscribe(value => {
      this.getEnvironment(value);
    });

  }

  getEnvironment(value: any): void {
    this.http.getEndPoints(value.id).subscribe((res: any) => {
      if (res.success) {
        this.rowData = res.data;
      }
    }, () => {
      this.rowData = [];
    });
  }


  addEnvironment(): void {
    this.router.navigate(['/create-endpoint'])
  }
  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  statusCellStyle(params: any): { backgroundColor?: string; color?: string } {
    const authentication = params.data.authentication;
    const style: { backgroundColor?: string; color?: string } = {};

    if (authentication) {
      style.color = 'darkgreen';
    } else {
      style.color = 'red';
    }

    return style;
  }
  gotoAction(params: any) {
    this.router.navigate(['/create-endpoint'], { queryParams: { id: params.name } })
  }
  openHost(params: any) {
    window.open(`https://${params?.host}`, '_blank');
  }
}