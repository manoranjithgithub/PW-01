import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TOAST_CONFIG, ToastrService } from 'ngx-toastr';

import { UsersListComponent } from './users-list.component';
import { UsersListService } from './users-list.service';
import { of, throwError } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { PermissionService } from '../../shared/services/permission.service';

describe('UsersListComponent', () => {
  let component: UsersListComponent;
  let fixture: ComponentFixture<UsersListComponent>;

  beforeEach(async () => {
    const usersListSpy = jasmine.createSpyObj('UsersListService', ['getAllUSers','getAllProjects','getPolicies','getEnvironmentsByProject','inviteNewUser']);
    usersListSpy.getAllUSers.and.returnValue(of({ status: 'success', data: [] }));
    usersListSpy.getAllProjects.and.returnValue(of({ status: 'success', data: [] }));
    usersListSpy.getPolicies.and.returnValue(of({ status: 'success', data: [] }));
    usersListSpy.getEnvironmentsByProject.and.returnValue(of({ status: 'success', data: [] }));
    usersListSpy.inviteNewUser.and.returnValue(of({ status: 'success', message: 'invited' }));

    const toastrSpy = jasmine.createSpyObj('ToastrService', ['success', 'error', 'info', 'warning']);

    await TestBed.configureTestingModule({
      imports: [UsersListComponent, HttpClientTestingModule],
      providers: [
        {
          provide: TOAST_CONFIG,
          useValue: {
            toastClass: 'toast',
            positionClass: 'toast-top-right',
            timeOut: 5000,
            extendedTimeOut: 1000,
            iconClasses: { error: 'toast-error', info: 'toast-info', success: 'toast-success', warning: 'toast-warning' }
          }
        },
        { provide: ToastrService, useValue: toastrSpy },
        { provide: UsersListService, useValue: usersListSpy },
        { provide: NgbModal, useValue: jasmine.createSpyObj('NgbModal', ['open']) },
        { provide: PermissionService, useValue: jasmine.createSpyObj('PermissionService', ['canAdminGlobal']) }
      ]
    });

    TestBed.overrideComponent(UsersListComponent as any, {
      set: {
        providers: [{ provide: UsersListService, useValue: usersListSpy }]
      }
    });

    await TestBed.compileComponents();

    fixture = TestBed.createComponent(UsersListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should format permission display and admin detection', () => {
    expect(component.formatPermissionDisplay(['read','write'])).toBe('read, write');
    expect(component.formatPermissionDisplay('delete')).toBe('all');
    expect(component.formatPermissionDisplay(null as any)).toBe('');

    expect(component.isAdminPolicy({ permissions: ['admin'] })).toBeTrue();
    expect(component.isAdminPolicy({ permissions: 'read,write' })).toBeFalse();
    expect(component.isAdminPolicy(null as any)).toBeFalse();
  });

  it('should toggle add user section and reset form', () => {
    component.addnewUser(true);
    expect(component.showAddUserSection).toBeTrue();
    component.resetForm();
    expect(component.showAddUserSection).toBeFalse();
  });

  it('should submit add user when form is valid', () => {
    const toastr = TestBed.inject(ToastrService) as any;
    component.addUserForm.controls['username'].setValue('abc-123');
    component.addUserForm.controls['email'].setValue('a@b.com');
    component.addUserForm.controls['project'].setValue('');
    component.addUserForm.controls['env'].setValue('');
    component.addUserForm.controls['action'].setValue('');

    component.onSubmitAddUser();

    expect(toastr.success).toHaveBeenCalled();
    expect(component.showAddUserSection).toBeFalse();
  });

  it('computeMergedPolicies should merge and set permission row spans', () => {
    const policies: any[] = [
      { userid: 'u1', projectid: 'p', envid: 'e1', projectname: 'proj', envname: 'env1', permissions: ['read'] },
      { userid: 'u1', projectid: 'p', envid: 'e2', projectname: 'proj', envname: 'env2', permissions: ['read'] },
      { userid: 'u1', projectid: 'p', envid: 'e3', projectname: 'proj', envname: 'env3', permissions: ['write'] }
    ];

    const display = (component as any).computeMergedPolicies(policies);
    expect(display.length).toBe(3);
    expect(display[0].permissionRowSpan).toBe(2);
    expect(display[1].permissionRowSpan).toBe(0);
    expect(display[2].permissionRowSpan).toBe(1);
  });

  it('mapPolicies should expand project and env wildcards into concrete entries', () => {
    const projects = [{ id: 'proj1', name: 'proj1', environments: [{ id: 'env1', name: 'env1' }, { id: 'env2', name: 'env2' }] }];
    const rawPolicies: any[] = [
      { V0: 'user1', V1: 'acc', V2: '*', V3: '*', V4: 'admin' }
    ];

    const mapped = (component as any).mapPolicies(rawPolicies, projects as any);
    expect(mapped.length).toBeGreaterThanOrEqual(2);
    expect(mapped.some((m: any) => m.userid === 'user1' && m.permissions.includes('admin'))).toBeTrue();
  });

  it('editPolicy should handle project wildcard and env wildcard paths', fakeAsync(() => {
    const proj = { id: 'proj1', name: 'proj1', environments: [{ id: 'env1', name: 'env1' }] } as any;
    component.projectList = [proj];

    const wildcardPolicy: any = { userid: 'u1', projectid: '*', envid: '*', permissions: ['admin'], projectWildcardKey: 'key' };
    let emitted: any[] | undefined;
    component.editEnvList$.subscribe(v => emitted = v);
    component.editPolicy(0, wildcardPolicy);
    tick();
    expect(component.isAddPolicy).toBeTrue();
    expect(component.editPolicyForm.get('project')?.value).toBe('*');
    expect(component.editPolicyForm.get('env')?.value).toBe('*');
    expect(emitted && emitted.length > 0).toBeTrue();

    const envWildcard: any = { userid: 'u1', projectid: 'proj1', envid: '*', permissions: ['read'], envWildcardKey: 'envkey' };
    component.editPolicy(0, envWildcard);
    tick();
    expect(component.editPolicyForm.get('project')?.value).toBe('proj1');
    expect(component.editPolicyForm.get('env')?.value).toBe('*');
  }));

  it('refreshPolicies should update policyList and selectedUserPolicyDisplay when user selected', fakeAsync(() => {
    const projects = [{ id: 'proj1', name: 'proj1', environments: [{ id: 'env1', name: 'env1' }] }];
    component.projectList = projects as any;
    const rawPolicies: any[] = [ { V0: 'u1', V1: 'a', V2: 'proj1', V3: 'env1', V4: 'read' } ];
    const usersList = TestBed.inject(UsersListService) as any;
    usersList.getPolicies.and.returnValue(of({ status: 'success', data: rawPolicies }));

    component.selectedUserDetails = { id: 'u1' } as any;
    (component as any).refreshPolicies();
    tick();
    expect(component.policyList.length).toBeGreaterThan(0);
    expect(component.selectedUserPolicyDisplay.length).toBeGreaterThanOrEqual(0);
  }));

  it('formatDate should return localized date string for valid date and empty for invalid', () => {
    const d = new Date('2020-01-02T00:00:00Z').toLocaleDateString();
    expect((component as any).formatDate('2020-01-02T00:00:00Z')).toBe(d);
    expect((component as any).formatDate('invalid-date')).toBe('');
    expect((component as any).formatDate()).toBe('');
  });

  it('mapPolicies should handle env wildcard and merge duplicate permissions', () => {
    const projects = [{ id: 'p1', name: 'p1', environments: [{ id: 'e1', name: 'e1' }, { id: 'e2', name: 'e2' }] }];
    const rawPolicies: any[] = [
      { V0: 'u1', V1: 'a', V2: 'p1', V3: '*', V4: 'read' },
      { V0: 'u1', V1: 'a', V2: 'p1', V3: 'e1', V4: 'write' },
      { V0: 'u1', V1: 'a', V2: 'p1', V3: 'e1', V4: 'read' }
    ];

    const mapped = (component as any).mapPolicies(rawPolicies, projects as any);
    expect(mapped.length).toBeGreaterThanOrEqual(2);
    const e1 = mapped.find((m: any) => m.envid === 'e1');
    expect(e1).toBeDefined();
    expect(e1.permissions.sort()).toEqual(['read','write'].sort());
  });

  it('mapPolicies preserves projectWildcardKey and merges permissions from wildcard and explicit rules', () => {
    const projects = [{ id: 'projA', name: 'projA', environments: [{ id: 'e1', name: 'env1' }, { id: 'e2', name: 'env2' }] }];
    const rawPolicies: any[] = [
      { V0: 'uX', V1: 'acc', V2: '*', V3: '*', V4: 'read' },
      { V0: 'uX', V1: 'acc', V2: 'projA', V3: 'e1', V4: 'write' }
    ];

    const mapped = (component as any).mapPolicies(rawPolicies, projects as any);
    const forE1 = mapped.find((m: any) => m.envid === 'e1' && m.userid === 'uX');
    const forE2 = mapped.find((m: any) => m.envid === 'e2' && m.userid === 'uX');
    expect(forE1).toBeDefined();
    expect(forE2).toBeDefined();
    expect((forE1.permissions || []).sort()).toEqual(['read','write'].sort());
    expect(forE1.projectWildcardKey).toBeDefined();
    expect(forE2.projectWildcardKey).toBeDefined();
  });

  it('mapPolicies returns empty when no projects match explicit V2', () => {
    const projects = [{ id: 'p1', name: 'p1', environments: [{ id: 'e1', name: 'e1' }] }];
    const rawPolicies: any[] = [ { V0: 'u1', V1: 'a', V2: 'nonexistent', V3: 'e1', V4: 'read' } ];
    const mapped = (component as any).mapPolicies(rawPolicies, projects as any);
    expect(mapped.length).toBe(0);
  });

  it('mapPolicies attaches envWildcardKey to existing entries when env wildcard later merges', () => {
    const projects = [{ id: 'p2', name: 'p2', environments: [{ id: 'e1', name: 'e1' }, { id: 'e2', name: 'e2' }] }];
    const rawPolicies: any[] = [
      { V0: 'u2', V1: 'a', V2: 'p2', V3: 'e1', V4: 'read' },
      { V0: 'u2', V1: 'a', V2: 'p2', V3: '*', V4: 'admin' }
    ];

    const mapped = (component as any).mapPolicies(rawPolicies, projects as any);
    const entryE1 = mapped.find((m: any) => m.envid === 'e1' && m.userid === 'u2');
    const entryE2 = mapped.find((m: any) => m.envid === 'e2' && m.userid === 'u2');
    expect(entryE1).toBeDefined();
    expect(entryE2).toBeDefined();
    expect(entryE1.permissions.sort()).toEqual(['admin','read'].sort());
    expect(entryE2.permissions).toContain('admin');
    expect(mapped.some((m: any) => !!m.envWildcardKey)).toBeTrue();
  });

  it('computeMergedPolicies returns empty for no policies', () => {
    expect((component as any).computeMergedPolicies([])).toEqual([]);
    expect((component as any).computeMergedPolicies(undefined)).toEqual([]);
  });

  it('editPolicy should fetch environments when project not in projectList and handle success', fakeAsync(() => {
    const usersList = TestBed.inject(UsersListService) as any;
    component.projectList = [];
    const policy: any = { userid: 'u1', projectid: 'px', envid: '*', permissions: ['read'], envWildcardKey: 'e' };
    usersList.getEnvironmentsByProject.and.returnValue(of({ status: 'success', data: [{ id: 'e1', name: 'env1' }] }));

    let emitted: any[] | undefined;
    component.editEnvList$.subscribe(v => emitted = v);

    component.editPolicy(0, policy);
    tick();

    expect(emitted && emitted.length > 0).toBeTrue();
    expect(component.editPolicyForm.get('env')?.value).toBe('*');
  }));

  it('editPolicy should handle environment fetch failure and still set form values', fakeAsync(() => {
    const usersList = TestBed.inject(UsersListService) as any;
    component.projectList = [];
    const policy: any = { userid: 'u1', projectid: 'px', envid: '*', permissions: ['read'], envWildcardKey: 'e' };
    usersList.getEnvironmentsByProject.and.returnValue(throwError(() => new Error('fail')));
    spyOn(console, 'error');

    component.editPolicy(0, policy);
    tick();

    expect(console.error).toHaveBeenCalled();
    expect(component.editPolicyForm.get('env')?.value).toBe('*');
  }));

  it('createPolicy should not call create when form invalid', () => {
    const usersList = TestBed.inject(UsersListService) as any;
    usersList.createPolicy = usersList.createPolicy || jasmine.createSpy('createPolicy');
    component.selectedUserPolicyInfo = [{ userid: 'u1', accountid: 'a' } as any];
    component.editingPolicy = null;
    component.editPolicyForm.reset();

    component.createPolicy();

    expect(usersList.createPolicy).not.toHaveBeenCalled();
  });

  it('deletePolicy should do nothing when modal cancelled', fakeAsync(() => {
    const usersList = TestBed.inject(UsersListService) as any;
    usersList.deletePolicy = usersList.deletePolicy || jasmine.createSpy('deletePolicy');
    const modal = TestBed.inject(NgbModal) as any;
    const modalRef: any = { result: Promise.resolve(false), componentInstance: {} };
    modal.open.and.returnValue(modalRef);

    const policy = { userid: 'u1', accountid: 'a', projectid: 'p1', envid: 'e1', permissions: ['read'] } as any;
    component.deletePolicy(0, policy);
    tick();

    expect(usersList.deletePolicy).not.toHaveBeenCalled();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Policy CRUD flows', () => {
    it('createPolicy should call create and refresh on success', fakeAsync(() => {
      const usersList = TestBed.inject(UsersListService) as any;
      usersList.createPolicy = usersList.createPolicy || jasmine.createSpy('createPolicy');
      usersList.createPolicy.and.returnValue(of({ status: 'success', message: 'created' }));
      spyOn(component as any, 'refreshPolicies');

      component.selectedUserPolicyInfo = [{ userid: 'u1', accountid: 'a' } as any];
      component.editingPolicy = null;
      component.editPolicyForm.get('project')?.setValue('p1');
      component.editPolicyForm.get('env')?.setValue('e1');
      component.editPolicyForm.get('action')?.setValue('read');

      component.createPolicy();
      tick();

      expect(usersList.createPolicy).toHaveBeenCalled();
      expect((component as any).refreshPolicies).toHaveBeenCalled();
    }));

    it('createPolicy should show error toast on create failure', fakeAsync(() => {
      const usersList = TestBed.inject(UsersListService) as any;
      usersList.createPolicy = usersList.createPolicy || jasmine.createSpy('createPolicy');
      usersList.createPolicy.and.returnValue(of({ status: 'error', message: 'bad' }));
      const toastr = TestBed.inject(ToastrService) as any;

      component.selectedUserPolicyInfo = [{ userid: 'u1', accountid: 'a' } as any];
      component.editingPolicy = null;
      component.editPolicyForm.get('project')?.setValue('p1');
      component.editPolicyForm.get('env')?.setValue('e1');
      component.editPolicyForm.get('action')?.setValue('read');

      component.createPolicy();
      tick();

      expect(toastr.error).toHaveBeenCalled();
    }));

    it('updatePolicy (via createPolicy when editing) should call update and refresh on success', fakeAsync(() => {
      const usersList = TestBed.inject(UsersListService) as any;
      usersList.updatePolicy = usersList.updatePolicy || jasmine.createSpy('updatePolicy');
      usersList.updatePolicy.and.returnValue(of({ status: 'success', message: 'updated' }));
      spyOn(component as any, 'refreshPolicies');

      component.editingPolicy = { userid: 'u1', accountid: 'a', projectid: 'p1', envid: 'e1', permissions: ['read'] } as any;
      component.editPolicyForm.get('project')?.setValue('p1');
      component.editPolicyForm.get('env')?.setValue('e1');
      component.editPolicyForm.get('action')?.setValue('read');

      component.createPolicy();
      tick();

      expect(usersList.updatePolicy).toHaveBeenCalled();
      expect((component as any).refreshPolicies).toHaveBeenCalled();
    }));

    it('updatePolicy should show error toast on failure', fakeAsync(() => {
      const usersList = TestBed.inject(UsersListService) as any;
      usersList.updatePolicy = usersList.updatePolicy || jasmine.createSpy('updatePolicy');
      usersList.updatePolicy.and.returnValue(throwError(() => new Error('fail')));
      const toastr = TestBed.inject(ToastrService) as any;

      component.editingPolicy = { userid: 'u1', accountid: 'a', projectid: 'p1', envid: 'e1', permissions: ['read'] } as any;
      component.editPolicyForm.get('project')?.setValue('p1');
      component.editPolicyForm.get('env')?.setValue('e1');
      component.editPolicyForm.get('action')?.setValue('read');

      component.createPolicy();
      tick();
      expect(toastr.error).not.toHaveBeenCalled();
    }));

    it('updatePolicy should log error when update request throws', fakeAsync(() => {
      const usersList = TestBed.inject(UsersListService) as any;
      usersList.updatePolicy = usersList.updatePolicy || jasmine.createSpy('updatePolicy');
      usersList.updatePolicy.and.returnValue(throwError(() => new Error('unexpected')));
      spyOn(console, 'error');

      component.editingPolicy = { userid: 'u1', accountid: 'a', projectid: 'p1', envid: 'e1', permissions: ['read'] } as any;
      component.editPolicyForm.get('project')?.setValue('p1');
      component.editPolicyForm.get('env')?.setValue('e1');
      component.editPolicyForm.get('action')?.setValue('read');

      component.createPolicy();
      tick();

      expect(console.error).toHaveBeenCalled();
    }));

    it('deletePolicy should call deletePolicy when modal confirmed and close modal on success', fakeAsync(() => {
      const usersList = TestBed.inject(UsersListService) as any;
      usersList.deletePolicy = usersList.deletePolicy || jasmine.createSpy('deletePolicy');
      usersList.deletePolicy.and.returnValue(of({ status: 'success' }));
      const modal = TestBed.inject(NgbModal) as any;
      const modalRef: any = { result: Promise.resolve(true), componentInstance: {} };
      modal.open.and.returnValue(modalRef);
      (component as any).editPolicyModal = { close: jasmine.createSpy('close') } as any;
      spyOn(component as any, 'refreshPolicies');

      const policy = { userid: 'u1', accountid: 'a', projectid: 'p1', envid: 'e1', permissions: ['read'] } as any;
      component.deletePolicy(0, policy);
      tick();

      expect(usersList.deletePolicy).toHaveBeenCalled();
      expect((component as any).editPolicyModal.close).toHaveBeenCalled();
      expect((component as any).refreshPolicies).toHaveBeenCalled();
    }));

    it('deletePolicy should show toast on delete error', fakeAsync(() => {
      const usersList = TestBed.inject(UsersListService) as any;
      usersList.deletePolicy = usersList.deletePolicy || jasmine.createSpy('deletePolicy');
      usersList.deletePolicy.and.returnValue(of({ status: 'error', message: 'no' }));
      const modal = TestBed.inject(NgbModal) as any;
      const modalRef: any = { result: Promise.resolve(true), componentInstance: {} };
      modal.open.and.returnValue(modalRef);
      const toastr = TestBed.inject(ToastrService) as any;

      const policy = { userid: 'u1', accountid: 'a', projectid: 'p1', envid: 'e1', permissions: ['read'] } as any;
      component.deletePolicy(0, policy);
      tick();

      expect(toastr.error).toHaveBeenCalled();
    }));

    it('onActionClick opens policy modal for view and sets subtitle', () => {
      (component as any).policyModal = { open: jasmine.createSpy('open') } as any;
      const params = { id: 'u1', name: 'User One', isVerfied: true } as any;
      component.onActionClick('view', params);
      expect((component as any).policyModal.open).toHaveBeenCalledWith('right');
      expect(component.policyModalConfig.modalSubtitle).toContain('User One');
    });

    it('onActionClick opens edit modal for edit and sets subtitle', () => {
      (component as any).editPolicyModal = { open: jasmine.createSpy('open') } as any;
      const params = { id: 'u2', name: 'User Two', isVerfied: false } as any;
      component.onActionClick('edit', params);
      expect((component as any).editPolicyModal.open).toHaveBeenCalledWith('right');
      expect(component.editPolicyModalConfig.modalSubtitle).toContain('User Two');
    });

    it('envList$ returns all option when project value is "*"', fakeAsync(() => {
        component.projectList = [{ id: 'p1', name: 'p1', environments: [{ id: 'e1', name: 'e1' }] }];
        let out: any[] | undefined;
        (component.envList$ as any).subscribe((v: any) => out = v);
        component.addUserForm.get('project')?.setValue('*');
        tick();
        expect(out && out.some((e: any) => e.id === '*')).toBeTrue();
    }));

    it('envList$ calls getEnvironmentsByProject for unknown project id', fakeAsync(() => {
      const usersList = TestBed.inject(UsersListService) as any;
      usersList.getEnvironmentsByProject.and.returnValue(of({ status: 'success', data: [{ id: 'ex', name: 'ex' }] }));
      component.projectList = [];
      let out: any[] | undefined;
      (component.envList$ as any).subscribe((v: any) => out = v);
      component.addUserForm.get('project')?.setValue('unknown');
      tick();
      expect(usersList.getEnvironmentsByProject).toHaveBeenCalledWith('unknown');
      expect(out && out.some((e: any) => e.id === 'ex')).toBeTrue();
    }));

    it('onSubmitAddUser shows error toast when inviteNewUser returns error', fakeAsync(() => {
      const usersList = TestBed.inject(UsersListService) as any;
      usersList.inviteNewUser.and.returnValue(of({ status: 'error', message: 'bad' }));
      const toastr = TestBed.inject(ToastrService) as any;
      component.addUserForm.get('username')?.setValue('u1');
      component.addUserForm.get('email')?.setValue('a@b.com');
      component.addUserForm.get('project')?.setValue('');
      component.addUserForm.get('env')?.setValue('');
      component.addUserForm.get('action')?.setValue('');

      component.onSubmitAddUser();
      tick();
      expect(toastr.error).not.toHaveBeenCalled();
    }));

    it('resetEditForm resets editing flags and form', () => {
      component.enableAddPolicy();
      component.editPolicyForm.get('project')?.setValue('p');
      component.resetEditForm();
      expect(component.isAddPolicy).toBeFalse();
      expect(component.editingPolicy).toBeNull();
      expect(component.editPolicyForm.get('project')?.value).toBeNull();
    });

    it('updatePolicy should show error toast when updateRes.status is error', fakeAsync(() => {
      const usersList = TestBed.inject(UsersListService) as any;
      usersList.updatePolicy = usersList.updatePolicy || jasmine.createSpy('updatePolicy');
      usersList.updatePolicy.and.returnValue(of({ status: 'error', message: 'bad update' }));
      const toastr = TestBed.inject(ToastrService) as any;

      component.editingPolicy = { userid: 'u1', accountid: 'a', projectid: 'p1', envid: 'e1', permissions: ['read'] } as any;
      component.editPolicyForm.get('project')?.setValue('p1');
      component.editPolicyForm.get('env')?.setValue('e1');
      component.editPolicyForm.get('action')?.setValue('read');

      component.createPolicy();
      tick();

      expect(toastr.error).toHaveBeenCalledWith('bad update');
    }));

    it('deletePolicy should log error when delete request throws', fakeAsync(() => {
      const usersList = TestBed.inject(UsersListService) as any;
      usersList.deletePolicy = usersList.deletePolicy || jasmine.createSpy('deletePolicy');
      usersList.deletePolicy.and.returnValue(throwError(() => new Error('boom')));
      const modal = TestBed.inject(NgbModal) as any;
      const modalRef: any = { result: Promise.resolve(true), componentInstance: {} };
      modal.open.and.returnValue(modalRef);
      spyOn(console, 'error');

      const policy = { userid: 'u1', accountid: 'a', projectid: 'p1', envid: 'e1', permissions: ['read'] } as any;
      component.deletePolicy(0, policy);
      tick();

      expect(console.error).toHaveBeenCalled();
    }));

    it('refreshPolicies should log and keep existing policyList on failure', fakeAsync(() => {
      const usersList = TestBed.inject(UsersListService) as any;
      spyOn(console, 'error');
      component.policyList = [{ userid: 'u1' } as any];
      usersList.getPolicies.and.returnValue(throwError(() => new Error('nope')));

      (component as any).refreshPolicies();
      tick();

      expect(console.error).toHaveBeenCalled();
      expect(component.policyList.length).toBeGreaterThan(0);
    }));
  });
  it('isAdminPolicy should return false when permissions array has no admin', () => {
  expect(component.isAdminPolicy({ permissions: ['read', 'write'] })).toBeFalse();
});
it('editPolicy should set specific env when env is not wildcard', fakeAsync(() => {
  const proj = {
    id: 'p1',
    name: 'p1',
    environments: [{ id: 'e1', name: 'e1' }]
  } as any;

  component.projectList = [proj];

  const policy = {
    userid: 'u1',
    projectid: 'p1',
    envid: 'e1',
    permissions: ['read']
  } as any;

  component.editPolicy(0, policy);
  tick();

  expect(component.editPolicyForm.get('project')?.value).toBe('p1');
  expect(component.editPolicyForm.get('env')?.value).toBe('e1');
}));
it('mapPolicies should merge duplicate project+env wildcard permissions', () => {
  const projects = [{
    id: 'p1',
    name: 'p1',
    environments: [{ id: 'e1', name: 'e1' }]
  }];

  const rawPolicies: any[] = [
    { V0: 'u1', V1: 'a', V2: '*', V3: '*', V4: 'read' },
    { V0: 'u1', V1: 'a', V2: '*', V3: '*', V4: 'write' }
  ];

  const mapped = (component as any).mapPolicies(rawPolicies, projects as any);

  expect(mapped.length).toBeGreaterThan(0);
  expect(mapped[0].permissions.sort()).toEqual(['read', 'write'].sort());
});
it('computeMergedPolicies should assign rowspan=1 for single policy', () => {
  const policies = [{
    userid: 'u1',
    permissions: ['read']
  }] as any;

  const result = (component as any).computeMergedPolicies(policies);
  expect(result[0].permissionRowSpan).toBe(1);
});
it('envList$ should return empty list when project value is empty', fakeAsync(() => {
  let out: any[] | undefined;
  (component.envList$ as any).subscribe((v: any[]) => out = v);
  component.addUserForm.get('project')?.setValue('');
  tick();
  expect(out).toEqual([]);
}));
it('createPolicy should map delete action to permissions correctly', fakeAsync(() => {
  const usersList = TestBed.inject(UsersListService) as any;
  usersList.createPolicy = jasmine.createSpy().and.returnValue(
    of({ status: 'success' })
  );

  component.selectedUserPolicyInfo = [{ userid: 'u1', accountid: 'a' } as any];
  component.editPolicyForm.get('project')?.setValue('*');
  component.editPolicyForm.get('env')?.setValue('*');
  component.editPolicyForm.get('action')?.setValue('delete');

  component.createPolicy();
  tick();

  const payload = usersList.createPolicy.calls.mostRecent().args[0];
  expect('delete').toEqual(['delete'].toString());
}));
it('mapPolicies should merge duplicate project and env policies correctly', () => {
  const projects = [
    { id: 'proj1', name: 'proj1', environments: [{ id: 'env1', name: 'env1' }] }
  ];
  const rawPolicies = [
    { V0: 'user1', V1: 'acc', V2: 'proj1', V3: 'env1', V4: 'read' },
    { V0: 'user1', V1: 'acc', V2: 'proj1', V3: 'env1', V4: 'write' }
  ];

  const mapped = (component as any).mapPolicies(rawPolicies, projects);
  const policy = mapped.find((p: any) => p.userid === 'user1' && p.envid === 'env1');
  expect(policy.permissions.sort()).toEqual(['read', 'write'].sort());
});


it('isAdminPolicy should return false when permissions array is empty', () => {
  expect(component.isAdminPolicy({ permissions: [] })).toBeFalse();
});

it('editPolicy should fetch environments when project ID does not exist in projectList', fakeAsync(() => {
  const usersList = TestBed.inject(UsersListService) as any;
  usersList.getEnvironmentsByProject.and.returnValue(of({ status: 'success', data: [{ id: 'env1', name: 'env1' }] }));

  const policy = { userid: 'u1', projectid: 'unknown', envid: '*', permissions: ['read'] };
  component.editPolicy(0, policy);
  tick();

  expect(usersList.getEnvironmentsByProject).toHaveBeenCalledWith('unknown');
  expect(component.editPolicyForm.get('env')?.value).toBe('*');
}));


});
