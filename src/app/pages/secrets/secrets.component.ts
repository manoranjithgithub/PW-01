import { Component,  OnDestroy,  OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  ContainerComponent, ShadowOnScrollDirective, CardGroupComponent, CardComponent, CardBodyComponent
} from '@coreui/angular';
import { SharedService } from '../../shared/services/shared.service';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import {AgGridTableComponent} from '../../shared/components/ag-grid-table/ag-grid-table.component'
import { CellClickedEvent, ColDef } from 'ag-grid-community';
import { LoaderComponent } from '../../shared/components/loader/loader.component';
import { DefaultHeaderComponent } from '../../shared/components/layout';
import { SecretsService } from './secrets.service';

@Component({
    selector: 'app-secrets',
    standalone:true,
    imports: [CommonModule, AgGridTableComponent],
    templateUrl: './secrets.component.html',
    styleUrl: './secrets.component.scss',
    providers: [SecretsService]
})
export class SecretsComponent implements OnInit, OnDestroy {
  
  envId: string = '';
  tableData =[];
  private subscription: Subscription | undefined;

  constructor(private http: SecretsService, private router: Router,
    private sharedService: SharedService
  ) {
   // const storedValue = this.sharedService.getCookie('environment');
    const storedValue = localStorage.getItem('environment');
    if (storedValue && storedValue !== "undefined") {
      this.getAvailableSecrets(JSON.parse(storedValue).id);
    }
  }

  ngOnInit(): void {
    this.subscription = this.sharedService.envValueChange$.subscribe((value:any) => {
      this.getAvailableSecrets(value.id);
    });
   
  }
  getAvailableSecrets(value: any) {
    this.envId = value
    if (this.envId) {
      this.http.getSecretsList(this.envId).subscribe((res: any) => {
        if (res.success) {
          this.tableData = res.data;
        }
      }, error => {
        this.tableData = [];
      })
    }
  }
  
  createSecret() {
    this.router.navigate(['/create-secret']);
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
      sort:'desc',
      valueFormatter: (params: any) => this.sharedService.formatDate(params.value)
    },
  ];

  gotoAction(value:any){
    this.router.navigate(['/create-secret'],{ queryParams: { id: value.name} })
  }
 
}
