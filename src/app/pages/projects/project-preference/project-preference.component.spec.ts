import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProjectPreferenceComponent } from './project-preference.component';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';
import { of, Subject } from 'rxjs';
import { FormBuilder } from '@angular/forms';

import { ProjectsService } from '../projects.service';
import { SharedService } from '../../../shared/services/shared.service';
import { DeploymentsService } from '../../../shared/services/deployments.service';
import { LayoutActionService } from '../../../shared/services/layout-action.service';
import { PermissionService } from '../../../shared/services/permission.service';
import { ToastrService } from 'ngx-toastr';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('ProjectPreferenceComponent', () => {
  let component: ProjectPreferenceComponent;
  let fixture: ComponentFixture<ProjectPreferenceComponent>;

  const sharedServiceMock = {
    user$: of({ owner: 'nimbuz' }),
    emitEnvDDChange: jasmine.createSpy(),
    isValidName: () => () => null
  };

  const layoutActionServiceMock = {
    actionClick$: new Subject<void>(),
    setExtraTitle: jasmine.createSpy(),
    clearExtraTitle: jasmine.createSpy()
  };
  const permissionServiceMock = {
  canAdminGlobal: jasmine.createSpy().and.returnValue(true),
  canEditProject: jasmine.createSpy().and.returnValue(true),
  canDeleteProject: jasmine.createSpy().and.returnValue(true)
};
const projectServiceMock = {
  getProjectDetailsById: jasmine.createSpy().and.returnValue(
    of({
      status: 'Success',
      data: {
        id: '1',
        name: 'Test Project',
        description: 'Test Desc',
        environments: [],
        github: false,
        gitlab: false
      }
    })
  ),
  getAllProjects: jasmine.createSpy().and.returnValue(of({ data: [] })),
  getAllEnvironmentsByProject: jasmine.createSpy().and.returnValue(of({ data: [] })),
  getEnvironmentsByProject: jasmine.createSpy().and.returnValue(of({ data: [] })),
  updateProject: jasmine.createSpy().and.returnValue(of({ status: 'Success' })),
  updateEnvironment: jasmine.createSpy().and.returnValue(of({ status: 'Success' })),
  deleteEnvironment: jasmine.createSpy().and.returnValue(of({ status: 'Success', message: 'deleted' })),
  deleteProject: jasmine.createSpy().and.returnValue(of({ status: 'Success' }))
};

  beforeEach(async () => {
    // ensure the component receives our mock service instance (standalone component providers can shadow TestBed providers)
    TestBed.overrideProvider(ProjectsService, { useValue: projectServiceMock });
    await TestBed.configureTestingModule({
      imports: [
        ProjectPreferenceComponent,
        RouterTestingModule,
        HttpClientTestingModule,
        BrowserAnimationsModule
      ],
      providers: [
        FormBuilder,
        { provide: ProjectsService, useValue: projectServiceMock },
        { provide: SharedService, useValue: sharedServiceMock },
        { provide: DeploymentsService, useValue: {} },
        { provide: LayoutActionService, useValue: layoutActionServiceMock },
        { provide: PermissionService, useValue: permissionServiceMock },
        { provide: ToastrService, useValue: jasmine.createSpyObj('ToastrService', ['success', 'error']) },
        { provide: NgbModal, useValue: jasmine.createSpyObj('NgbModal', ['open']) },
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: of({ projectId: '1' })
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectPreferenceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create component', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle general edit mode', () => {
    component.isGeneralEditMode = false;
    component.toggleGeneralEditMode();
    expect(component.isGeneralEditMode).toBeTrue();
  });

  it('should add email rule', () => {
    const initialLength = component.rulesFormArray.length;
    component.addEmail();
    expect(component.rulesFormArray.length).toBe(initialLength + 1);
  });

  it('should remove email rule', () => {
    component.addEmail();
    const lengthAfterAdd = component.rulesFormArray.length;
    component.removeEmail(0);
    expect(component.rulesFormArray.length).toBe(lengthAfterAdd - 1);
  });

  it('should calculate current usage total', () => {
    component.currentUsageData = [
      { totalCost: 10 },
      { totalCost: 5.5 }
    ];
    expect(component.currentUsageTotal).toBe('15.50');
  });

  it('should calculate estimated usage total', () => {
    component.estimatedUsageData = [
      { totalCost: 2.1234 },
      { totalCost: 1 }
    ];
    expect(component.estimatedUsageTotal).toBe('3.1234');
  });

  it('should clean up on destroy', () => {
    spyOn(component['destroy$'], 'next');
    spyOn(component['destroy$'], 'complete');

    component.ngOnDestroy();

    expect(component['destroy$'].next).toHaveBeenCalled();
    expect(component['destroy$'].complete).toHaveBeenCalled();
    expect(layoutActionServiceMock.clearExtraTitle).toHaveBeenCalled();
  });

  it('should update integration status', () => {
    component.updateIntegrationStatus('github', true);
    const github = component.integrations.find(i => i.provider === 'github');
    expect(github?.status).toBe('connected');

    component.updateIntegrationStatus('gitlab', false);
    const gitlab = component.integrations.find(i => i.provider === 'gitlab');
    expect(gitlab?.status).toBe('not connected');
  });

  it('should update environment and close modal', () => {
    (component as any).editEnvironmentsModel = { close: jasmine.createSpy('close') } as any;
    component.environmentForm = new FormBuilder().group({ envName: ['Env'] });
    component.currentProjectId = '1';
    component.envId = 'e1';

    component.updateEnvironment();

    expect((component as any).editEnvironmentsModel.close).toHaveBeenCalled();
  });

  it('should save general changes when form valid', () => {
    component.generalSettingForm = new FormBuilder().group({ projectName: ['Test Project'], projectId: ['1'], description: ['desc'] });
    component.currentProjectId = '1';

    component.saveGeneralChanges();

    expect(projectServiceMock.updateProject).toHaveBeenCalled();
  });

  it('should map environments with resource units from localStorage', () => {
    const resourceUsage = [
      { resource_type: 'CPU', unit: 'cores' },
      { resource_type: 'RAM', unit: 'mb' },
      { resource_type: 'ephemeral_storage', unit: 'gb' }
    ];
    localStorage.setItem('resourceUsage', JSON.stringify(resourceUsage));

    const envData = [{ id: 'e1', name: 'env1', cpuMaxPlatformLimit: 2, memoryMaxPlatformLimit: 1024, ephemeralStorageMaxPlatformLimit: 10, region: 'us' }];
    const mapped = component['mapEnvironments'](envData as any[]);

    expect(mapped.length).toBe(1);
    expect(mapped[0].id).toBe('e1');
    expect(mapped[0].resourceLimit).toContain('CPU');
    // memory unit is uppercased in the string (MB)
    expect(mapped[0].resourceLimit).toContain('(MB)');
    localStorage.removeItem('resourceUsage');
  });

  it('should open deleteEnvironment modal and call service on confirm', async () => {
    const modal = {
      componentInstance: {},
      result: Promise.resolve(true)
    } as any;
    const ngb = TestBed.inject(NgbModal) as any;
    ngb.open.and.returnValue(modal);

    component.currentProjectId = '1';
    const env = { id: 'e1', name: 'env1' } as any;

    component.deleteEnvironment(env);
    await modal.result;

    expect(ngb.open).toHaveBeenCalled();
    expect(projectServiceMock.deleteEnvironment).toHaveBeenCalledWith('1', 'e1');
  });

  it('should toggle dropdown and clear on outside click', () => {
    const env = { id: 'e1' } as any;
    component.toggleDropdown(env, new MouseEvent('click'));
    expect(component.activeEnv).toBe(env);

    const fakeEvent = { target: document.createElement('div') } as unknown as MouseEvent;
    (fakeEvent.target as HTMLElement).className = 'not-custom';
    component.onOutsideClick(fakeEvent);
    expect(component.activeEnv).toBeNull();
  });

  it('should add and cancel add user', () => {
    component.userForm = new FormBuilder().group({ name: ['n'], email: ['a@b.com'], role: ['r'] });
    const initial = component.userList.length;
    component.addUser();
    expect(component.userList.length).toBeGreaterThanOrEqual(initial);

    component.cancelAddUser();
    expect(component.showAddUserForm).toBeFalse();
  });

  it('should delete access when confirmed', async () => {
    const modal = { componentInstance: {}, result: Promise.resolve(true) } as any;
    const ngb = TestBed.inject(NgbModal) as any;
    ngb.open.and.returnValue(modal);
    component.userList = [{ email: 'a@b.com' } as any];
    component.deleteAccess({ email: 'a@b.com' });
    await modal.result;
    expect(component.userList.find(u => u.email === 'a@b.com')).toBeUndefined();
  });

  it('should check project name uniqueness', () => {
    component.availableProjects = ['test project'];
    // ensure control value is a plain string (trim() exists)
    component.generalSettingForm = new FormBuilder().group({ projectName: 'Test Project' } as any);
    component.checkProjectNameUnique();
    expect(component.projectNameControl.hasError('uniqueName')).toBeTrue();

    component.generalSettingForm.get('projectName')?.setValue('unique');
    component.availableProjects = [];
    component.checkProjectNameUnique();
    expect(component.projectNameControl.hasError('uniqueName')).toBeFalse();
  });

  it('getState uses subdomain and getProfile logs error for invalid provider', () => {
    spyOn(console, 'error');
    spyOn(component as any, 'getSubdomain').and.returnValue('custom');
    const state = component.getState();
    expect(state).toBe('custom');

    component.getProfile('invalid');
    expect((console.error as any)).toHaveBeenCalled();
  });

  it('onActionSelected routes to view and opens editor for edit', () => {
    spyOn((component as any).router, 'navigate');
    const env = { id: 'e1', name: 'env1', region: 'us' } as any;

    component.onActionSelected('view', env);
    expect((component as any).router.navigate).toHaveBeenCalled();

    (component as any).editEnvironmentsModel = { open: jasmine.createSpy('open') } as any;
    component.onActionSelected('edit', env);
    expect((component as any).editEnvironmentsModel.open).toHaveBeenCalled();
  });
});
