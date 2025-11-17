import { Component, OnInit } from '@angular/core';
import { UsersListService } from './users-list.service';
import { CommonModule } from '@angular/common';
import { AgGridTableComponent } from '../../shared/components/ag-grid-table/ag-grid-table.component';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { VALIDATION_REGEX } from '../../core/constants/validation-regex.constant';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [CommonModule, AgGridTableComponent, ReactiveFormsModule],
  templateUrl: './users-list.component.html',
  styleUrl: './users-list.component.scss',
  providers: [UsersListService]
})
export class UsersListComponent implements OnInit {
  tableData: any[] = [];
  showAddUserSection = false;
  addUserForm!: FormGroup;

  columnDefs = [
    {
      field: '', headerName: 'S.No', maxWidth: 80, sortable: true,
      valueGetter: (params: any) => {
        const rowIndex = params.node.rowIndex;
        return rowIndex + 1;
      },
    },
    {
      field: 'name', headerName: 'Name', tooltipField: 'name', sortable: true, flex: 1,
      cellStyle: { 'white-space': 'nowrap', 'overflow': 'hidden !important', 'text-overflow': 'ellipsis' },
    },
    {
      field: 'email', headerName: 'Email', tooltipField: 'email', flex: 1,
      cellStyle: { 'white-space': 'nowrap', 'overflow': 'hidden !important', 'text-overflow': 'ellipsis' }
    },
    {
      field: 'isVerfied', headerName: 'Verified Email',
      cellRenderer: (params: any) => {
        if (params.value === "true") {
          return `<span style="color: #43A047">Verified</span>`;
        } else if (params.value === "false") {
          return `<span style="color: #DB2719"> Unverified</span>`;
        } else {
          return '';
        }
      }
    },

    {
      field: 'createdAt', headerName: 'Added on',
      valueFormatter: (params: any) => {
        const value = params.value;
        const date = value ? new Date(value) : null;
        return date instanceof Date && !isNaN(date.getTime())
          ? date.toLocaleDateString()
          : '';
      }
    },
    {
      field: 'updatedAt',
      headerName: 'Updated At',
      valueFormatter: (params: any) => {
        const value = params.value;
        const date = value ? new Date(value) : null;
        return date instanceof Date && !isNaN(date.getTime())
          ? date.toLocaleDateString()
          : '';
      }
    }
  ];
  orgName: string = '';
  constructor(
    private http: UsersListService,
    private fb: FormBuilder,
    private toastr: ToastrService
  ) {
    this.addUserForm = this.fb.group({
      username: ['', [Validators.required, Validators.pattern(VALIDATION_REGEX.USERNAME)]],
      email: ['', [Validators.required, Validators.email]]
    });
  }

  ngOnInit(): void {
    this.getAllUsers();
  }

  addnewUser(value: boolean) {
    this.showAddUserSection = value;   
  }

  onSubmitAddUser() {
    if (this.addUserForm.valid) {
      const formValue = this.addUserForm.value;
      this.http.inviteNewUser(formValue).subscribe((res: any) => {
        if (res.status.toLowerCase() === 'success') {
          this.getAllUsers();
          this.showAddUserSection = false;
          this.toastr.success(res.message);
        }
      })
    }
  }
  resetForm() {
    this.addUserForm.reset();
    this.showAddUserSection = false;
  }

  getAllUsers() {
    this.http.getAllUSers().subscribe((res: any) => {
      if (res.status?.toLowerCase() === 'success') {
        this.tableData = res.data
      }

    })
  }
}
