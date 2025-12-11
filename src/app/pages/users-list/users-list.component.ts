import { Component, OnInit, ViewChild } from '@angular/core';
import { UsersListService } from './users-list.service';
import { CommonModule } from '@angular/common';
import { AgGridTableComponent } from '../../shared/components/ag-grid-table/ag-grid-table.component';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { VALIDATION_REGEX } from '../../core/constants/validation-regex.constant';
import { ActionCellRendererComponent } from '../../shared/components/action-cell-renderer/action-cell-renderer.component';
import { ModalComponent } from '../../shared/components/model/model.component';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [CommonModule, AgGridTableComponent, ReactiveFormsModule, ModalComponent],
  templateUrl: './users-list.component.html',
  styleUrl: './users-list.component.scss',
  providers: [UsersListService]
})
export class UsersListComponent implements OnInit {
  tableData: any[] = [];
  showAddUserSection = false;
  addUserForm!: FormGroup;
  users = [];

  policyDetails: any[] = [];
  allExpanded = false;

  columnDefs = [
    {
      field: '', headerName: 'S.No', maxWidth: 80, sortable: true,
      valueGetter: (params: any) => {
        const rowIndex = params.node.rowIndex;
        return rowIndex + 1;
      },
    },
    {
      field: 'name', headerName: 'Name', tooltipField: 'name', sortable: true, width: 150,
      cellStyle: { 'white-space': 'nowrap', 'overflow': 'hidden !important', 'text-overflow': 'ellipsis' },
    },
    {
      field: 'email', headerName: 'Email', tooltipField: 'email', width: 250,
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
    },
    {
      headerName: "Actions",
      field: "",
      flex: 1,
      cellRenderer: ActionCellRendererComponent,
      cellRendererParams: {
        additionalParam: 'user-list',
        // onActionClick: (data: any, params: any) => this.onActionClick(data, params)
      },

    }
  ];
  orgName: string = '';
  projectList: any = [];
  envList: any = [];
  availableAccess = [{ text: 'Read', value: 'read' }, { text: 'Write', value: 'write' }, { text: 'Delete', value: 'delete' }]
  @ViewChild('policyModal') private policyModal!: ModalComponent;
  @ViewChild('editPolicyModal') private editPolicyModal!: ModalComponent;
  selectedUserDetails: any;
  selectedUserPolicyInfo: any;

  public policyModalConfig: any = {
    modalTitle: 'Policy Details',
    width: '780px',
    height: 'auto',
    hideDismissButton: () => true,
    hideCloseButton: () => false
  };
  public editPolicyModalConfig: any = {
    modalTitle: 'Edit Policy',
    width: '780px',
    height: 'auto',
    hideDismissButton: () => true,
    hideCloseButton: () => false
  };
  projectMap: any = {};
  envMap: any = {};

  constructor(
    private http: UsersListService,
    private fb: FormBuilder,
    private toastr: ToastrService
  ) {
    this.addUserForm = this.fb.group({
      username: ['', [Validators.required, Validators.pattern(VALIDATION_REGEX.USERNAME)]],
      email: ['', [Validators.required, Validators.email]],
      project: [''],
      env: [''],
      action: ['']
    });
  }

  ngOnInit(): void {
    this.getAllUsers();
    this.http.getAllProjects().subscribe((res: any) => {
      if (res && res.status.toLowerCase() == 'success') {
        this.projectList = res.data;
        this.projectList.forEach((p: any) => {
          this.projectMap[p.id] = p.name;

          // For each project, load environments
          this.http.getEnvironmentsByProject(p.id).subscribe((envRes: any) => {
            if (envRes?.status?.toLowerCase() === 'success') {
              this.envMap[p.id] = envRes.data; // store env list by projectId
            }
          });
        });
      }
    });

    this.addUserForm.get('project')?.valueChanges.subscribe(value => {
      if (value) {
        this.http.getEnvironmentsByProject(value).subscribe((res: any) => {
          if (res && res.status.toLowerCase() == 'success') {
            this.envList = res.data;
          }
        })
      }
    });
    this.http.getPolicies().subscribe((res: any) => {
      this.policyDetails = this.transformPermissions(res.data);
    })
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
        this.tableData = res.data;
        this.users = res.data
      }

    })
  }

  toggle(node: any) {
    node.expanded = !node.expanded;
  }
  toggleAll() {
    this.allExpanded = !this.allExpanded;

    this.selectedUserPolicyInfo?.projects.forEach((p: any) => {
      p.expanded = this.allExpanded;

      p.environments?.forEach((e: any) => {
        e.expanded = this.allExpanded;
      });
    });
  }

  transformPermissions(actual: any[]) {
    const users: any[] = [];

    actual.forEach(entry => {
      const userId = entry.V0;
      const projectId = entry.V2;
      const envId = entry.V3;
      const action = entry.V4;
      let user = users.find(u => u.userId === userId);
      if (!user) {
        user = { userId, projects: [] };
        users.push(user);
      }
      let project = user.projects.find((p: any) => p.id === projectId);
      if (!project) {
        const projectName = this.projectMap[projectId];

        project = {
          id: projectId,
          name: projectName ? `Project: ${projectName}` : `Project: ${projectId}`,
          environments: [],
          permissions: []
        };

        user.projects.push(project);
      }
      if (!envId || envId === "*") {
        project.permissions.push({ name: action });
        return;
      }
      let env = project.environments.find((e: any) => e.id === envId);
      if (!env) {
        const envListForProject = this.envMap[projectId] || [];
        const envInfo = envListForProject.find((e: any) => e.id === envId);

        env = {
          id: envId,
          name: envInfo ? `Environment: ${envInfo.name}` : `Environment: ${envId}`,
          permissions: []
        };

        project.environments.push(env);
      }

      env.permissions.push({ name: action });
    });

    return users;
  }

  onActionClick(data: any, params: any) {
    this.selectedUserDetails = params;
    this.selectedUserPolicyInfo = this.policyDetails?.find((x: any) => x.userId === params?.id);

    if (data === 'view') {
      this.policyModal.open('right')

    } else {
      this.editPolicyModal.open('right');
    }

  }
}
