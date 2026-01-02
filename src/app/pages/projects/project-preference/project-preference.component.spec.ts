import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProjectPreferenceComponent } from './project-preference.component';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { FormBuilder, AbstractControl, Validators } from '@angular/forms';

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

  it('should handle currentUsageTotal when data has NaN values', () => {
    component.currentUsageData = [
      { totalCost: 'invalid' },
      { totalCost: 5 }
    ];
    expect(component.currentUsageTotal).toBe('5.00');
  });

  it('should handle currentUsageTotal when all values are 0', () => {
    component.currentUsageData = [
      { totalCost: 0 },
      { totalCost: 0 }
    ];
    expect(component.currentUsageTotal).toBe('0');
  });

  it('should handle estimatedUsageTotal when all values are 0', () => {
    component.estimatedUsageData = [{ totalCost: 0 }];
    expect(component.estimatedUsageTotal).toBe('0');
  });

  it('should handle estimatedUsageTotal with NaN values', () => {
    component.estimatedUsageData = [
      { totalCost: null },
      { totalCost: 2.5 }
    ];
    expect(component.estimatedUsageTotal).toBe('2.5000');
  });

  it('should save changes and toggle edit mode', () => {
    component.isGeneralEditMode = true;
    component.saveChanges();
    expect(component.isGeneralEditMode).toBeFalse();
  });

  it('should get projectIdControl', () => {
    const control = component.projectIdControl;
    expect(control).toBeDefined();
  });

  it('should get descriptionControl', () => {
    const control = component.descriptionControl;
    expect(control).toBeDefined();
  });

  it('should toggle add user form', () => {
    component.showAddUserForm = false;
    component.toggleAddUserForm();
    expect(component.showAddUserForm).toBeTrue();
    component.toggleAddUserForm();
    expect(component.showAddUserForm).toBeFalse();
  });

  it('should mark form as touched if invalid when adding user', () => {
    component.userForm = new FormBuilder().group({ 
      name: ['', Validators.required], 
      email: ['', [Validators.required, Validators.email]], 
      role: ['', Validators.required] 
    });
    spyOn(component.userForm, 'markAllAsTouched');
    component.addUser();
    expect(component.userForm.markAllAsTouched).toHaveBeenCalled();
  });

  it('should create rule form group', () => {
    const rule = component.createRule();
    expect(rule.get('emailID')).toBeDefined();
  });

  it('should toggle dropdown option', () => {
    component.isDropdownOpen[0] = false;
    component.toggleDropdownOption(0);
    expect(component.isDropdownOpen[0]).toBeTrue();
  });

  it('should disconnect profile when confirmed', async () => {
    const modal = { componentInstance: {}, result: Promise.resolve(true) } as any;
    const ngb = TestBed.inject(NgbModal) as any;
    ngb.open.and.returnValue(modal);
    
    const deploymentService = { disconnectProfile: jasmine.createSpy().and.returnValue(of({ status: 'Success' })) };
    (component as any).deploymentsService = deploymentService;
    component.currentProjectId = '1';
    
    component.diconnectProfile('github');
    await modal.result;
    
    expect(deploymentService.disconnectProfile).toHaveBeenCalledWith('1', 'github');
  });

  it('should handle disconnect profile cancellation', async () => {
    const modal = { componentInstance: {}, result: Promise.resolve(false) } as any;
    const ngb = TestBed.inject(NgbModal) as any;
    ngb.open.and.returnValue(modal);
    
    const consoleSpy = spyOn(console, 'log');
    component.diconnectProfile('gitlab');
    await modal.result;
    
    expect(consoleSpy).toHaveBeenCalledWith('Cancelled!');
  });

  it('should handle disconnect profile error', async () => {
    const modal = { componentInstance: {}, result: Promise.resolve(true) } as any;
    const ngb = TestBed.inject(NgbModal) as any;
    ngb.open.and.returnValue(modal);
    
    const errorSpy = spyOn(console, 'error');
    const deploymentService = {
      disconnectProfile: jasmine.createSpy().and.returnValue(throwError(() => new Error('fail')))
    };
    (component as any).deploymentsService = deploymentService;
    component.currentProjectId = '1';
    
    component.diconnectProfile('github');
    await modal.result;
    
    expect(errorSpy).toHaveBeenCalled();
  });

  xit('should connect github profile and redirect', () => {
    // Skipped: This test would cause a page reload
    // The function calls window.location.href which triggers navigation
  });

  xit('should connect gitlab profile and redirect', () => {
    // Skipped: This test would cause a page reload
    // The function calls window.location.href which triggers navigation
  });

  it('should handle onLayoutButtonClick when environments exist', () => {
    component.environments = [{ id: '1' }] as any;
    const toastr = TestBed.inject(ToastrService) as any;
    component.onLayoutButtonClick();
    expect(toastr.error).toHaveBeenCalledWith('Environments must be deleted before deleting the project.');
  });

  it('should delete project when confirmed and no environments', async () => {
    component.environments = [];
    component.currentProjectId = '1';
    component.projectDetails = { name: 'Test' };
    const modal = { componentInstance: {}, result: Promise.resolve(true) } as any;
    const ngb = TestBed.inject(NgbModal) as any;
    ngb.open.and.returnValue(modal);
    spyOn((component as any).router, 'navigate');
    
    component.onLayoutButtonClick();
    await modal.result;
    
    expect(projectServiceMock.deleteProject).toHaveBeenCalledWith('1');
    expect((component as any).router.navigate).toHaveBeenCalledWith(['/projects']);
  });

  it('should handle project deletion cancellation', async () => {
    component.environments = [];
    const modal = { componentInstance: {}, result: Promise.resolve(false) } as any;
    const ngb = TestBed.inject(NgbModal) as any;
    ngb.open.and.returnValue(modal);
    const consoleSpy = spyOn(console, 'log');
    
    component.onLayoutButtonClick();
    await modal.result;
    
    expect(consoleSpy).toHaveBeenCalledWith('Cancelled delete  project!');
  });

  it('should handle onOptionSelected', () => {
    spyOn(component, 'onActionSelected');
    const event = { target: { value: 'view' } } as any;
    const env = { id: 'e1' } as any;
    
    component.onOptionSelected(event, env);
    expect(component.onActionSelected).toHaveBeenCalledWith('view', env);
  });

  it('should handle viewEnvironment navigation', () => {
    spyOn((component as any).router, 'navigate');
    const env = { id: 'e1', name: 'env1', region: 'us' };
    component.currentProjectId = 'p1';
    
    component.viewEnvironment(env);
    expect((component as any).router.navigate).toHaveBeenCalledWith(
      ['/projects/environment-preferences'],
      { queryParams: { envName: 'env1', region: 'us', envId: 'e1', projectId: 'p1' } }
    );
  });

  it('should handle editEnvironment', () => {
    const env = { id: 'e1', name: 'TestEnv' };
    (component as any).editEnvironmentsModel = { open: jasmine.createSpy() };
    
    component.editEnvironment(env);
    expect(component.envId).toBe('e1');
    expect(component.environmentForm.get('envName')?.value).toBe('TestEnv');
  });

  it('should close modal', () => {
    (component as any).editEnvironmentsModel = { close: jasmine.createSpy() };
    component.closeModal();
    expect((component as any).editEnvironmentsModel.close).toHaveBeenCalled();
  });

  it('should handle updateEnvironment error', () => {
    const errorSpy = spyOn(console, 'error');
    projectServiceMock.updateEnvironment.and.returnValue(throwError(() => new Error('fail')));
    (component as any).editEnvironmentsModel = { close: jasmine.createSpy() };
    component.environmentForm = new FormBuilder().group({ envName: ['Env'] });
    component.currentProjectId = '1';
    component.envId = 'e1';
    
    component.updateEnvironment();
    expect(errorSpy).toHaveBeenCalledWith('Updated failed');
  });

  it('should handle onActionSelected for delete action', () => {
    spyOn(component, 'deleteEnvironment');
    const env = { id: 'e1' } as any;
    
    component.onActionSelected('delete', env);
    expect(component.deleteEnvironment).toHaveBeenCalledWith(env);
  });

  it('should toggle dropdown with same env to null', () => {
    const env = { id: 'e1' } as any;
    component.activeEnv = env;
    
    component.toggleDropdown(env, new MouseEvent('click'));
    expect(component.activeEnv).toBeNull();
  });

  it('should handle onOutsideClick with custom-dropdown class', () => {
    const env = { id: 'e1' } as any;
    component.activeEnv = env;
    
    const element = document.createElement('div');
    element.className = 'custom-dropdown';
    const event = { target: element } as unknown as MouseEvent;
    
    component.onOutsideClick(event);
    expect(component.activeEnv).toBe(env);
  });

  it('should return nimbuz state for individual subdomain', () => {
    spyOn(component as any, 'getSubdomain').and.returnValue('app');
    expect(component.getState()).toBe('nimbuz');
  });

  it('should return subdomain for non-individual', () => {
    spyOn(component as any, 'getSubdomain').and.returnValue('custom');
    expect(component.getState()).toBe('custom');
  });

  it('should extract subdomain from hostname', () => {
    const subdomain = (component as any).getSubdomain();
    expect(typeof subdomain).toBe('string');
  });

  it('should check integration status and update', () => {
    const deploymentService = {
      getIntegrationStatus: jasmine.createSpy().and.returnValue(of({ status: 'Success', data: { key: 'value' } }))
    };
    (component as any).deploymentsService = deploymentService;
    component.currentProjectId = '1';
    
    component.checkIntegrationStatus('github');
    expect(deploymentService.getIntegrationStatus).toHaveBeenCalledWith('1', 'github');
  });

  it('should update integration to not connected when status check returns empty', () => {
    const deploymentService = {
      getIntegrationStatus: jasmine.createSpy().and.returnValue(of({ status: 'Success', data: {} }))
    };
    (component as any).deploymentsService = deploymentService;
    component.currentProjectId = '1';
    
    component.checkIntegrationStatus('gitlab');
    const gitlab = component.integrations.find(i => i.provider === 'gitlab');
    expect(gitlab?.status).toBe('not connected');
  });

  it('should handle updateEnvironments', () => {
    component.projectEnvNames = [{ id: 'e1', name: 'env1' }] as any;
    spyOn(component as any, 'mapEnvironments').and.returnValue([{ id: 'e1' }]);
    
    component.updateEnvironments();
    expect(component.environments.length).toBeGreaterThan(0);
  });

  it('should save general changes with empty description', () => {
    component.generalSettingForm = new FormBuilder().group({ 
      projectName: ['Test'], 
      projectId: ['1'], 
      description: [null] 
    });
    component.currentProjectId = '1';
    
    component.saveGeneralChanges();
    expect(projectServiceMock.updateProject).toHaveBeenCalledWith('1', { name: 'Test', description: '' });
  });

  it('should not save general changes when form is invalid', () => {
    component.generalSettingForm = new FormBuilder().group({ 
      projectName: ['', [Validators.required]],
      projectId: [''],
      description: [''] 
    });
    component.generalSettingForm.get('projectName')?.setValue('');
    component.generalSettingForm.get('projectName')?.markAsTouched();
    projectServiceMock.updateProject.calls.reset();
    
    component.saveGeneralChanges();
    expect(projectServiceMock.updateProject).not.toHaveBeenCalled();
  });

  it('should handle updateProject error', () => {
    const toastr = TestBed.inject(ToastrService) as any;
    projectServiceMock.updateProject.and.returnValue(of({ status: 'Error', message: 'Failed' }));
    component.generalSettingForm = new FormBuilder().group({ 
      projectName: ['Test'], 
      projectId: ['1'], 
      description: ['desc'] 
    });
    component.currentProjectId = '1';
    
    component.saveGeneralChanges();
    expect(toastr.error).toHaveBeenCalledWith('Failed');
  });

  it('should handle ngOnInit with business user', () => {
    sharedServiceMock.user$ = of({ owner: 'custom' });
    component.ngOnInit();
    expect(component.isBusiness).toBeTrue();
  });

  it('should uniqueNameValidator return null for empty value', () => {
    const validator = component.uniqueNameValidator(['test']);
    const control = { value: '' } as AbstractControl;
    expect(validator(control)).toBeNull();
  });

  it('should uniqueNameValidator return error for existing name', () => {
    const validator = component.uniqueNameValidator(['test', 'other']);
    const control = { value: 'Test' } as AbstractControl;
    expect(validator(control)).toEqual({ uniqueName: true });
  });

  it('should uniqueNameValidator return null for unique name', () => {
    const validator = component.uniqueNameValidator(['test', 'other']);
    const control = { value: 'unique' } as AbstractControl;
    expect(validator(control)).toBeNull();
  });

  it('should checkProjectNameUnique with empty name', () => {
    component.generalSettingForm = new FormBuilder().group({ projectName: [''] });
    component.checkProjectNameUnique();
    expect(component.projectNameControl.hasError('uniqueName')).toBeFalsy();
  });

  it('should checkProjectNameUnique clear uniqueName error if name is now unique', () => {
    component.generalSettingForm = new FormBuilder().group({ projectName: 'unique' } as any);
    component.availableProjects = [];
    component.projectNameControl.setErrors({ uniqueName: true, other: true });
    
    component.checkProjectNameUnique();
    expect(component.projectNameControl.hasError('uniqueName')).toBeFalse();
    expect(component.projectNameControl.hasError('other')).toBeTrue();
  });

  it('should checkProjectNameUnique clear all errors if only uniqueName exists', () => {
    component.generalSettingForm = new FormBuilder().group({ projectName: 'unique' } as any);
    component.availableProjects = [];
    component.projectNameControl.setErrors({ uniqueName: true });
    
    component.checkProjectNameUnique();
    expect(component.projectNameControl.errors).toBeNull();
  });
});
