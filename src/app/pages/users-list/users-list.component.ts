import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { BehaviorSubject, forkJoin, Observable, of, Subject } from 'rxjs';
import { map, switchMap, shareReplay, takeUntil, startWith, filter, finalize } from 'rxjs/operators';

import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmationModalComponent } from '../../shared/components/modal/confirmation-modal/confirmation-modal.component';

import { VALIDATION_REGEX } from '../../core/constants/validation-regex.constant';
import { UsersListService } from './users-list.service';
import { AgGridTableComponent } from '../../shared/components/ag-grid-table/ag-grid-table.component';
import { ActionCellRendererComponent } from '../../shared/components/action-cell-renderer/action-cell-renderer.component';
import { ModalComponent } from '../../shared/components/model/model.component';
import { SharedService } from '../../shared/services/shared.service';
import { User, Environment, PolicyMapped, PolicyRaw, Project } from '../../core/models/user-data.model';
import { PermissionService } from '../../shared/services/permission.service';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [CommonModule, AgGridTableComponent, ReactiveFormsModule, ModalComponent],
  templateUrl: './users-list.component.html',
  styleUrl: './users-list.component.scss',
  providers: [UsersListService],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UsersListComponent implements OnInit, OnDestroy {
  @ViewChild('policyModal') private policyModal!: ModalComponent;
  @ViewChild('editPolicyModal') private editPolicyModal!: ModalComponent;

  addUserForm!: FormGroup;
  editPolicyForm!: FormGroup;

  showAddUserSection = false;
  allExpanded = false;
  isEditPolicy = false;
  isAddPolicy = false;
  editIndex: number | null = null;

  envList$: Observable<Environment[]> = new Observable<Environment[]>();
  private editEnvListSubject = new BehaviorSubject<Environment[]>([]);
  editEnvList$ = this.editEnvListSubject.asObservable();

  selectedUserDetails: User | any;
  selectedUserPolicyInfo: PolicyMapped[] = [];
  selectedUserPolicyDisplay: any[] = [];
  policyList: PolicyMapped[] = [];
  projectList: any;
  editingPolicy: PolicyMapped | null = null;

  availableProjectList: Project[] = [];
  availableAccess = [
    { text: 'Read', value: 'read' },
    { text: 'Write', value: 'write' },
    { text: 'All', value: 'delete' }
  ];

  // Modal configs
  public policyModalConfig: any = {
    modalTitle: 'Policy Details',
    width: '780px',
    height: 'auto',
    hideDismissButton: () => true,
    hideCloseButton: () => false
  };
  public editPolicyModalConfig: any = {
    modalTitle: 'Edit Permissions',
    width: '780px',
    height: 'auto',
    hideDismissButton: () => true,
    hideCloseButton: () => false
  };

  columnDefs = [
    {
      field: '',
      headerName: 'S.No',
      maxWidth: 80,
      sortable: true,
      valueGetter: (params: any) => params.node.rowIndex + 1
    },
    {
      field: 'name',
      headerName: 'Name',
      tooltipField: 'name',
      sortable: true,
      width: 150,
      cellClass: 'truncate'
    },
    {
      field: 'email',
      headerName: 'Email',
      tooltipField: 'email',
      width: 250,
      cellClass: 'truncate'
    },
    {
      field: 'isVerfied', headerName: 'Verified Email',
      // cellStyle: { display: 'flex', justifyContent: 'center', alignItems: 'center' },
      cellRenderer: (params: any) => {
        const val = params?.value;
        if (val === true || val === 'true') {
          return `<span class="status-badge status-success">Verified</span>`;
        } else if (val === false || val === 'false') {
          return `<span class="status-badge status-danger">Unverified</span>`;
        } else {
          return `<span class="status-badge status-muted">-</span>`;
        }
      }
    },
    {
      field: 'createdAt',
      headerName: 'Added on',
      flex: 1,
      valueFormatter: (params: any) => this.formatDate(params.value)
    },
    {
      field: 'updatedAt',
      headerName: 'Updated At',
      flex: 1,
      valueFormatter: (params: any) => this.formatDate(params.value)
    },
    {
      headerName: 'Manage Policies',
      field: '',
      // flex: 1,
      width: 150,
      cellRenderer: ActionCellRendererComponent,
      cellRendererParams: {
        additionalParam: 'user-list',
        onActionClick: (data: any, params: any) => this.onActionClick(data, params)
      }
    }
  ];
  private destroy$ = new Subject<void>();
  tableData: any;

  constructor(
    private http: UsersListService,
    private fb: FormBuilder,
    private toastr: ToastrService,
    private modalService: NgbModal,
    private sharedService: SharedService,
    public permissionService: PermissionService
  ) {
    this.addUserForm = this.fb.group({
      username: ['', [Validators.required, Validators.maxLength(30), Validators.pattern(VALIDATION_REGEX.USERNAME)]],
      email: ['', [Validators.required, Validators.email]],
      project: [''],
      env: [''],
      action: ['']
    });

    this.editPolicyForm = this.fb.group({
      project: ['', Validators.required],
      env: [''],
      action: ['']
    });
  }

  ngOnInit(): void {
    this.loadUsersProjectsPolicies();

    this.envList$ = this.addUserForm.get('project')!.valueChanges.pipe(
      startWith(this.addUserForm.get('project')!.value),
      switchMap((value: string) => {
        const allOption = [{ name: 'all', id: '*' } as Environment];
        if (!value) return [<Environment[]>[]];
        if (value === '*') return [allOption];

        const proj = (this.projectList || []).find((p: any) => p.id === value || p.name === value);
        if (proj) {
          return [allOption.concat(proj.environments || [])];
        }
        return this.http.getEnvironmentsByProject(value).pipe(
          map((res: any) => res?.status?.toLowerCase() === 'success' ? allOption.concat(res.data as Environment[]) : allOption)
        );
      }),
      shareReplay(1)
    );
    this.editPolicyForm.get('project')!.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe((value: string) => {
      const allOption = [{ name: 'all', id: '*' } as Environment];
      if (!value) {
        this.editEnvListSubject.next([]);
        return;
      }
      if (value === '*') {
        this.editEnvListSubject.next(allOption);
        return;
      }
      const proj = (this.projectList || []).find((p: any) => p.id === value || p.name === value);
      if (proj) {
        this.editEnvListSubject.next(allOption.concat(proj.environments || []));
        return;
      }
      this.http.getEnvironmentsByProject(value).pipe(
        takeUntil(this.destroy$)
      ).subscribe((res: any) => {
        const envs = res?.status?.toLowerCase() === 'success' ? res.data : [];
        this.editEnvListSubject.next(allOption.concat(envs));
      }
      );
    });
  }
  private loadUsersProjectsPolicies(): void {
    this.sharedService.show();

    forkJoin({
      usersRes: this.http.getAllUSers(),
      projectsRes: this.http.getAllProjects(),
      policiesRes: this.http.getPolicies()
    }).pipe(
      switchMap(({ usersRes, projectsRes, policiesRes }: any) => {
        this.tableData = usersRes?.status?.toLowerCase() === 'success' ? usersRes.data : [];

        const rawProjects: Project[] = projectsRes.status.toLowerCase() === 'success'
          ? projectsRes.data.map((p: any) => ({ ...p, environments: [] }))
          : [];
        this.projectList = rawProjects;
        this.availableProjectList = [
          { name: 'all', id: '*', description: "" },
          ...projectsRes.data
        ];

        const envCalls = rawProjects.map(project => this.http.getEnvironmentsByProject(project.id));
        if (envCalls.length === 0) {
          const policies: PolicyMapped[] = this.mapPolicies(policiesRes.data, rawProjects);
          return of({ projectsWithEnv: rawProjects, policies });
        }

        return forkJoin(envCalls).pipe(
          map((envResponses: any[]) => {
            const projectsWithEnv = rawProjects.map((project, index) => ({
              ...project,
              environments: envResponses[index]?.status?.toLowerCase() === 'success'
                ? envResponses[index].data
                : []
            }));
            const policies: PolicyMapped[] = this.mapPolicies(policiesRes.data, projectsWithEnv);
            return { projectsWithEnv, policies };
          })
        );
      }),
      takeUntil(this.destroy$),
      finalize(() => this.sharedService.hide())
    ).subscribe(
      ({ projectsWithEnv, policies }) => {
        this.projectList = projectsWithEnv;
        this.policyList = policies;
      },
      (err) => {
        console.error('Failed to load users and policies', err);
        this.sharedService.hide();
      }
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  addnewUser(value: boolean) {
    this.showAddUserSection = value;
  }

  onSubmitAddUser() {
    if (this.addUserForm.valid) {
      const formValue = this.addUserForm.getRawValue();
      this.http.inviteNewUser(formValue).pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
        if (res.status.toLowerCase() === 'success') {
          this.loadUsersProjectsPolicies();
          this.showAddUserSection = false;
          this.toastr.success(res.message);
          this.addUserForm.reset();
        }
      });
    }
  }

  resetForm() {
    this.addUserForm.reset();
    this.showAddUserSection = false;
  }

  onActionClick(action: 'view' | 'edit' | 'delete', params: User) {
    this.resetEditForm()
    this.selectedUserDetails = params;
    this.selectedUserPolicyInfo = this.policyList.filter((x: PolicyMapped) => x.userid === params?.id);
    if (this.selectedUserPolicyInfo.length === 0) {
      this.selectedUserPolicyInfo.push({
        userid: params?.id,
        accountid: localStorage.getItem('accountId') || '',
        projectid: '',
        envid: '',
        projectname: '',
        envname: '',
        permissions: []
      });
    }
    this.selectedUserPolicyDisplay = this.computeMergedPolicies(this.selectedUserPolicyInfo);

    const isVerified = params?.isVerfied === 'true' || params?.isVerfied === true;
    const iconClass = isVerified ? 'bi-patch-check-fill' : '';

    const subtitle = `
      <p class="mb-0 text-capitalize"> <span class="mx-2">-</span> 
        ${params?.name} <i class="bi ${iconClass} text-success"></i>
      </p>`;

    if (action === 'delete') {
      const modalRef = this.modalService.open(ConfirmationModalComponent);
      modalRef.componentInstance.selectedItem = 'User';
      modalRef.componentInstance.message = 'Are you sure you want to delete this user?';

      modalRef.result.then((result) => {
        if (!result) return;
        this.http.deleteUser({ username: params?.name }).pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
          if (res?.status?.toLowerCase() === 'success') {
            this.toastr.success(res?.message || 'User deleted');
            this.http.getAllUSers().pipe(takeUntil(this.destroy$)).subscribe((usersRes: any) => {
              if (usersRes?.status?.toLowerCase() === 'success') {
                this.tableData = usersRes.data;
              }
            });
          } else {
            this.toastr.error(res?.message || 'Failed to delete user');
          }
        }, (err) => {
          console.error('deleteUser error', err);
        });
      }).catch(() => {
        // modal dismissed or cancelled - no action needed
      });
      return;
    }

    if (action === 'view') {
      this.policyModalConfig.modalSubtitle = subtitle;
      this.policyModal.open('right');
    } else {
      this.editPolicyModalConfig.modalSubtitle = subtitle;
      this.editPolicyModal.open('right');
    }
  }

  private computeMergedPolicies(policies: PolicyMapped[] = []): any[] {
    if (!policies || policies.length === 0) return [];
    const groups = new Map<string, { projectname: string; items: PolicyMapped[] }>();
    for (const p of policies) {
      const key = p.projectid || p.projectname || '';
      if (!groups.has(key)) {
        groups.set(key, { projectname: p.projectname, items: [p] });
      } else {
        groups.get(key)!.items.push(p);
      }
    }
    const display: any[] = [];
    for (const [, group] of groups) {
      const permGroups = new Map<string, PolicyMapped[]>();
      for (const item of group.items) {
        const permKey = (item.permissions || []).slice().sort().join(',') || '';
        if (!permGroups.has(permKey)) permGroups.set(permKey, []);
        permGroups.get(permKey)!.push(item);
      }
      const projectTotal = group.items.length;
      let firstProjectRowEmitted = false;
      for (const [, pItems] of permGroups) {
        pItems.forEach((item, idx) => {
          display.push({
            ...item,
            __permKey: (item.permissions || []).slice().sort().join(',') || '',
            showProjectCell: !firstProjectRowEmitted,
            projectRowSpan: !firstProjectRowEmitted ? projectTotal : 0,
            showPermissionCell: idx === 0,
            permissionRowSpan: idx === 0 ? pItems.length : 0,
            showActionCell: idx === 0,
            actionRowSpan: idx === 0 ? pItems.length : 0
          });
          firstProjectRowEmitted = true;
        });
      }
    }

    for (let i = 0; i < display.length;) {
      const key = display[i].__permKey || '';
      let j = i + 1;
      while (j < display.length && display[j].__permKey === key) j++;
      const runLength = j - i;
      display[i].showPermissionCell = true;
      display[i].permissionRowSpan = runLength;
      display[i].showActionCell = true;
      display[i].actionRowSpan = runLength;
      for (let k = i + 1; k < j; k++) {
        display[k].showPermissionCell = false;
        display[k].permissionRowSpan = 0;
        display[k].showActionCell = false;
        display[k].actionRowSpan = 0;
      }
      i = j;
    }
    display.forEach(d => delete d.__permKey);
    return display;
  }

  private formatDate(value?: string): string {
    if (!value) return '';
    const date = new Date(value);
    return date instanceof Date && !isNaN(date.getTime()) ? date.toLocaleDateString() : '';
  }

  public formatPermissionDisplay(permissions: any): string {
    if (!permissions) return '';
    const perms = Array.isArray(permissions) ? permissions : String(permissions).split(',').map(p => p.trim());
    const lower = perms.map(p => String(p).toLowerCase());
    if (lower.includes('delete')) return 'all';
    return perms.join(', ');
  }

  public isAdminPolicy(policy: any): boolean {
    if (!policy) return false;
    const permissions = policy.permissions;
    if (!permissions) return false;
    const perms = Array.isArray(permissions) ? permissions : String(permissions).split(',').map((p: string) => p.trim());
    return perms.map((p: string) => p.toLowerCase()).includes('admin');
  }

  private mapPolicies(policies: PolicyRaw[] = [], projects: Project[] = []): PolicyMapped[] {
    const combined: PolicyMapped[] = [];

    policies.forEach((p, pIndex) => {
      if (p.V2 === '*') {
        const projectWildcardKey = `proj_wild_${pIndex}_${p.V0}`;
        const matchedProjects = projects;

        matchedProjects.forEach((project) => {
          const matchedEnvs = p.V3 === '*'
            ? project.environments
            : project.environments.filter((env) => env.id === p.V3);

          matchedEnvs.forEach((env) => {
            const existing = combined.find((c) =>
              c.userid === p.V0 && c.projectid === project.id && c.envid === env.id
            );

            if (existing) {
              if (!existing.permissions.includes(p.V4)) {
                existing.permissions.push(p.V4);
              }
            } else {
              combined.push({
                userid: p.V0,
                accountid: p.V1,
                projectid: project.id,
                envid: env.id,
                projectname: project.name,
                envname: env.name,
                permissions: [p.V4],
                projectWildcardKey
              } as any);
            }
          });
        });

        return;
      }

      const matchedProjects = projects.filter((proj) => proj.id === p.V2);

      matchedProjects.forEach((project) => {
        const isEnvWildcard = p.V3 === '*';
        const envWildcardKey = isEnvWildcard ? `env_wild_${pIndex}_${p.V0}_${project.id}` : undefined;
        const matchedEnvs = isEnvWildcard
          ? project.environments
          : project.environments.filter((env) => env.id === p.V3);

        matchedEnvs.forEach((env) => {
          const existing = combined.find((c) =>
            c.userid === p.V0 && c.projectid === project.id && c.envid === env.id
          );

          if (existing) {
            if (!existing.permissions.includes(p.V4)) {
              existing.permissions.push(p.V4);
            }
            // if this policy originated from an env wildcard, ensure existing entry records that
            if (envWildcardKey && !(existing as any).envWildcardKey) {
              (existing as any).envWildcardKey = envWildcardKey;
            }
          } else {
            const entry: any = {
              userid: p.V0,
              accountid: p.V1,
              projectid: project.id,
              envid: env.id,
              projectname: project.name,
              envname: env.name,
              permissions: [p.V4]
            };
            if (envWildcardKey) entry.envWildcardKey = envWildcardKey;
            combined.push(entry);
          }
        });
      });
    });

    return combined;
  }

  private refreshPolicies(): void {
    this.http.getPolicies().pipe(takeUntil(this.destroy$)).subscribe((polRes: any) => {
      if (polRes?.status?.toLowerCase() === 'success') {
        this.policyList = this.mapPolicies(polRes.data || [], this.projectList || []);
        if (this.selectedUserDetails && this.selectedUserDetails.id) {
          this.selectedUserPolicyInfo = this.policyList.filter((x: PolicyMapped) => x.userid === this.selectedUserDetails.id);
          this.selectedUserPolicyDisplay = this.computeMergedPolicies(this.selectedUserPolicyInfo);
        }
      }
    }, (err) => {
      console.error('Failed to refresh policies', err);
    });
  }
  editPolicy(index: number, policy: any) {
    this.editIndex = index;
    this.editPolicyForm.get('project')?.disable();
    this.editPolicyForm.get('env')?.disable();
    this.isAddPolicy = true;
    let targetPolicy = policy as PolicyMapped;
    if (policy && policy.envid !== '*') {
      const foundWildcard = (this.selectedUserPolicyInfo || []).find((p: any) => {
        if (p.projectWildcardKey && p.userid === policy.userid) return true;
        if (p.envWildcardKey && p.projectid === policy.projectid && p.userid === policy.userid) return true;
        return false;
      });
      if (foundWildcard) targetPolicy = foundWildcard as PolicyMapped;
    }

    this.editingPolicy = targetPolicy;

    const projectControl = this.editPolicyForm.get('project');
    const envControl = this.editPolicyForm.get('env');
    const actionControl = this.editPolicyForm.get('action');
    const allOption = [{ name: 'all', id: '*' } as Environment];

    const setFormValues = (proj: string, env: string, action: string) => {
      if (projectControl) projectControl.setValue(proj, { emitEvent: false });
      if (envControl) envControl.setValue(env, { emitEvent: false });
      if (actionControl) actionControl.setValue(action, { emitEvent: false });
    };

    if ((targetPolicy as any).projectWildcardKey || targetPolicy.projectid === '*') {
      this.editEnvListSubject.next(allOption);
      setFormValues('*', '*', targetPolicy.permissions[0]);
      return;
    }
    if ((targetPolicy as any).envWildcardKey || targetPolicy.envid === '*') {
      const proj = (this.projectList || []).find((p: any) => p.id === targetPolicy.projectid || p.name === targetPolicy.projectid);
      if (proj) {
        this.editEnvListSubject.next(allOption.concat(proj.environments || []));
        setFormValues(targetPolicy.projectid, '*', targetPolicy.permissions[0]);
      } else {
        this.http.getEnvironmentsByProject(targetPolicy.projectid).pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
          const envs = res?.status?.toLowerCase() === 'success' ? res.data : [];
          this.editEnvListSubject.next(allOption.concat(envs));
          setFormValues(targetPolicy.projectid, '*', targetPolicy.permissions[0]);
        }, (err) => {
          console.error('Failed to load environments for project', err);
          setFormValues(targetPolicy.projectid, '*', targetPolicy.permissions[0]);
        });
      }
      return;
    }

    // Default: specific project + env
    const proj = (this.projectList || []).find((p: any) => p.id === targetPolicy.projectid || p.name === targetPolicy.projectid);
    if (proj) {
      this.editEnvListSubject.next([{ name: 'all', id: '*' } as Environment].concat(proj.environments || []));
      setFormValues(targetPolicy.projectid, targetPolicy.envid, targetPolicy.permissions[0]);
    } else {
      this.http.getEnvironmentsByProject(targetPolicy.projectid).pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
        const envs = res?.status?.toLowerCase() === 'success' ? res.data : [];
        this.editEnvListSubject.next([{ name: 'all', id: '*' } as Environment].concat(envs));
        setFormValues(targetPolicy.projectid, targetPolicy.envid, targetPolicy.permissions[0]);
      }, (err) => {
        console.error('Failed to load environments for project', err);
        setFormValues(targetPolicy.projectid, targetPolicy.envid, targetPolicy.permissions[0]);
      });
    }

  }
  enableAddPolicy() {
    this.editPolicyForm.get('project')?.enable();
    this.editPolicyForm.get('env')?.enable();
    this.editPolicyForm.reset();
    this.isAddPolicy = true;
    this.editingPolicy = null;
  }
  resetEditForm() {
    this.editPolicyForm.reset();
    this.isAddPolicy = false;
    this.editingPolicy = null;
  }
  createPolicy() {
    // console.log(this.selectedUserPolicyInfo)
    this.isAddPolicy = false;
    if (this.editPolicyForm.invalid) {
      return;
    }
    const formValue = this.editPolicyForm.getRawValue();
    if (this.editingPolicy) {
      const res = {
        oldPolicy: {
          ptype: 'p',
          v0: this.editingPolicy.userid,
          v1: this.editingPolicy.accountid,
          v2: this.editingPolicy.projectid === '*' || (this.editingPolicy as any).projectWildcardKey ? '*' : this.editingPolicy.projectid,
          v3: (this.editingPolicy.envid === '*' || (this.editingPolicy as any).projectWildcardKey || (this.editingPolicy as any).envWildcardKey) ? '*' : this.editingPolicy.envid,
          v4: this.editingPolicy.permissions[0]
        },
        newPolicy: {
          ptype: 'p',
          v0: this.editingPolicy.userid,
          v1: this.editingPolicy.accountid,
          v2: formValue.project,
          v3: formValue.env || '*',
          v4: formValue.action || '*'
        }
      };

      this.http.updatePolicy(res).pipe(takeUntil(this.destroy$)).subscribe((updateRes: any) => {
        if (updateRes.status?.toLowerCase() === 'success') {
          this.toastr.success(updateRes.message || 'Policy updated');
          this.editPolicyForm.reset();
          this.editingPolicy = null;
          this.refreshPolicies();
        } else {
          this.toastr.error(updateRes?.message || 'Failed to update policy');
        }
      }, (err) => {
        console.error('updatePolicy error', err);
      });
    } else {
      const res = [{
        ptype: 'p',
        v0: this.selectedUserPolicyInfo[0]?.userid,
        v1: this.selectedUserPolicyInfo[0]?.accountid,
        v2: formValue.project,
        v3: formValue.env || '*',
        v4: formValue.action || '*'
      }];

      this.http.createPolicy(res).pipe(takeUntil(this.destroy$)).subscribe((createRes: any) => {
        if (createRes.status?.toLowerCase() === 'success') {
          this.toastr.success(createRes.message || 'Policy created');
          this.editPolicyForm.reset();
          this.refreshPolicies();
        } else {
          this.toastr.error(createRes?.message || 'Failed to create policy');
        }
      }, (err) => {
        // console.error('createPolicy error', err);
      });
    }
  }
  deletePolicy(index: number, policy: any) {
    this.resetEditForm();
    const modalRef = this.modalService.open(ConfirmationModalComponent);
    modalRef.componentInstance.selectedItem = 'Policy';
    modalRef.componentInstance.message = 'Are you sure you want to delete this policy?';

    modalRef.result.then((result) => {
      if (result) {
        const res = [{
          ptype: "p",
          v0: policy.userid,
          v1: policy.accountid,
          v2: policy.projectid === '*' || (policy as any).projectWildcardKey ? '*' : policy.projectid,
          v3: policy.envid === '*' || (policy as any).projectWildcardKey || (policy as any).envWildcardKey ? '*' : policy.envid,
          v4: policy.permissions[0]
        }];
        this.http.deletePolicy(res).pipe(takeUntil(this.destroy$)).subscribe((deleteRes: any) => {
          if (deleteRes.status?.toLowerCase() === 'success') {
            this.editIndex = null;
            this.refreshPolicies();
            this.editPolicyModal.close();
          } else {
            this.toastr.error(deleteRes?.message || 'Failed to delete policy');
          }
        }, (err) => {
          console.error('deletePolicy error', err);
        });
      }
    }).catch(() => {
      // modal dismissed or cancelled - no action needed
    });
  }
}
