import { Component, OnInit } from '@angular/core';
import { UsersListService } from './users-list.service';
import { CommonModule } from '@angular/common';
import { ColDef, ColGroupDef } from 'ag-grid-community';
import { AgGridTableComponent } from '../../shared/components/ag-grid-table/ag-grid-table.component';
import { SharedService } from '../../shared/services/shared.service';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { sortBy } from 'lodash-es';

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
    { field: '', headerName: 'S.No', maxWidth: 80,sortable: true,
      valueGetter: (params: any) => {
        const rowIndex = params.node.rowIndex;
        return rowIndex + 1;
      },
    },
    // {
    //   field: 'avatar',
    //   headerName: 'Profile',
    //   width: 100,
    //   cellRenderer: (params: any) => {
    //     const avatarUrl = params.value;
    //     const defaultAvatar = 'assets/images/avatars/avatar.jpg';

    //     const finalUrl = avatarUrl || defaultAvatar;

    //     return `<img src="${finalUrl}" alt="avatar" style="width:40px; height:40px;border:1px solid #f1f1f1;padding:5px; border-radius:50%;" onerror="this.src='${defaultAvatar}'" />`;
    //   },
    //   sortable: false,
    //   filter: false
    // },
    // {
    //   field: 'displayName', headerName: 'Display Name', tooltipField: 'name', sortable: true, flex: 1,
    //   cellStyle: { 'white-space': 'nowrap', 'overflow': 'hidden !important', 'text-overflow': 'ellipsis' },
    // },

    {
      field: 'name', headerName: 'Name',  tooltipField: 'name', sortable: true, flex: 1,
      cellStyle: { 'white-space': 'nowrap', 'overflow': 'hidden !important', 'text-overflow': 'ellipsis' },
    },
    {
      field: 'email', headerName: 'Email',  tooltipField: 'email', flex: 1,
      cellStyle: { 'white-space': 'nowrap', 'overflow': 'hidden !important', 'text-overflow': 'ellipsis' }
    },
    {
      field: 'isVerified', headerName: 'Verified Email',
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
      valueFormatter: (params:any) => {
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
    private sharedService: SharedService,
    private fb: FormBuilder,
    private toastr: ToastrService
  ) {
    this.addUserForm = this.fb.group({
      username: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]]
    });

    // this.sharedService.user$.subscribe((user: any) => {
    //   this.orgName = user.owner;
    //   this.addUserForm.get('orgName')?.setValue(user.owner);
    // });
  }

  ngOnInit(): void {
    this.getAllUsers();
  }



  addnewUser(value: boolean) {
    // this.addUserForm.get('orgName')?.setValue(this.orgName);
    this.showAddUserSection = value;
    // if (value) {
    //   this.addUserForm.reset();
    // }
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
      console.log(res)
      if (res.status?.toLowerCase() === 'success') {
        this.tableData = res.data
      }

    })
  }
}
