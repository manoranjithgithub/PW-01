import { Component, OnDestroy, OnInit } from '@angular/core';
import { SharedService } from '../../shared/services/shared.service';
import { Subscription } from 'rxjs';
import {
  CardBodyComponent, CardComponent, CardGroupComponent, NavComponent, NavItemComponent, NavLinkDirective, TabContentRefDirective, TabContentComponent, RoundedDirective, TabPaneComponent,
  FormControlDirective, FormCheckInputDirective,
  FormCheckLabelDirective, FormDirective, FormCheckComponent
} from '@coreui/angular';
import { ColDef } from 'ag-grid-community';
import { AgGridTableComponent } from '../../shared/components/ag-grid-table/ag-grid-table.component';
import { VolumesService } from './volumes.service';

@Component({
  selector: 'app-volumes',
  standalone: true,
  imports: [CardGroupComponent, CardComponent, CardBodyComponent, NavComponent, NavItemComponent, NavLinkDirective,
    TabContentRefDirective, TabContentComponent, TabPaneComponent, FormControlDirective,
    FormCheckInputDirective, FormCheckLabelDirective, FormDirective, FormCheckComponent, AgGridTableComponent],
  providers: [VolumesService],
  templateUrl: './volumes.component.html',
  styleUrl: './volumes.component.scss'
})
export class VolumesComponent implements OnInit, OnDestroy {
  env: string = '';
  rowData = [];
  subscription: Subscription = new Subscription();
  constructor(private http: VolumesService, private sharedService: SharedService) {
   // const  storedValue = this.sharedService.getCookie('environment');
   const  storedValue = localStorage.getItem('environment');
    if (storedValue && storedValue !== "undefined") {
      this.env = JSON.parse(storedValue).id;
      this.getVolumes();
    }

  }

  ngOnInit(): void {
    this.subscription = this.sharedService.envValueChange$.subscribe((value: any) => {
      this.env = value.id;
      this.getVolumes();
    });

  }

  getVolumes(): void {
    this.http.getVolumesList(this.env).subscribe((res: any) => {
      this.rowData = res.data;
    });
  }

  columnDefs: ColDef[] = [
    {
      headerName: 'Name', field: 'name', sortable: true, filter: true, flex: 1

    },
    {
      headerName: 'Storage', field: 'storage', sortable: true, flex: 1

    },
    {
      headerName: 'Created At', field: 'created_at', sortable: true, flex: 1, sort: 'desc',
      valueFormatter: (params: any) => this.sharedService.formatDate(params.value)
    }]

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }
}
