import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ViewEnvironmentComponent } from './view-environment.component';
import { ProjectsService } from '../projects.service';
import { SharedService } from '../../../shared/services/shared.service';
import { ToastrService } from 'ngx-toastr';
import { Router, ActivatedRoute } from '@angular/router';
import { LayoutActionService } from '../../../shared/services/layout-action.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { PermissionService } from '../../../shared/services/permission.service';
import { FormBuilder, Validators } from '@angular/forms';
import { of, Subject } from 'rxjs';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('ViewEnvironmentComponent', () => {
  let component: ViewEnvironmentComponent;
  let fixture: ComponentFixture<ViewEnvironmentComponent>;

  let projectSpy: jasmine.SpyObj<ProjectsService>;
  let sharedSpy: jasmine.SpyObj<SharedService>;
  let toastrSpy: jasmine.SpyObj<ToastrService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let modalSpy: jasmine.SpyObj<NgbModal>;
  let layoutSpy: jasmine.SpyObj<LayoutActionService>;

  const queryParams$ = new Subject<any>();

  beforeEach(async () => {
    projectSpy = jasmine.createSpyObj('ProjectsService', [
      'getEnvironmentById',
      'updateEnvironment',
      'deleteEnvironment'
    ]);

    sharedSpy = jasmine.createSpyObj(
      'SharedService',
      ['isValidName'],
      { user$: of({ owner: 'nimbuz' }) }
    );

    (sharedSpy.isValidName as jasmine.Spy).and.returnValue(() => null);

    toastrSpy = jasmine.createSpyObj('ToastrService', ['success']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    layoutSpy = jasmine.createSpyObj(
      'LayoutActionService',
      ['setExtraTitle', 'clearExtraTitle'],
      { actionClick$: of() }
    );

    modalSpy = jasmine.createSpyObj('NgbModal', ['open']);

    projectSpy.getEnvironmentById.and.returnValue(
      of({ status: 'Success', data: { name: 'Env-1' } })
    );
    TestBed.overrideProvider(ProjectsService, { useValue: projectSpy });

    await TestBed.configureTestingModule({
      imports: [ViewEnvironmentComponent, HttpClientTestingModule, BrowserAnimationsModule],
      providers: [
        FormBuilder,
        { provide: ProjectsService, useValue: projectSpy },
        { provide: SharedService, useValue: sharedSpy },
        { provide: ToastrService, useValue: toastrSpy },
        { provide: Router, useValue: routerSpy },
        {
          provide: ActivatedRoute,
          useValue: { queryParams: queryParams$.asObservable() }
        },
        { provide: LayoutActionService, useValue: layoutSpy },
        { provide: NgbModal, useValue: modalSpy },
        { provide: PermissionService, useValue: {} }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ViewEnvironmentComponent);
    component = fixture.componentInstance;

    localStorage.setItem(
      'project',
      JSON.stringify({ id: 'p1', name: 'Project One' })
    );
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize forms and values on ngOnInit', () => {
    component.ngOnInit();

    queryParams$.next({
      envName: 'TestEnv',
      region: 'ap-south-1',
      envId: 'e1',
      projectId: 'p1'
    });

    expect(component.environmentForm).toBeTruthy();
    expect(component.emailIDForm).toBeTruthy();
    expect(component.preferencesForm).toBeTruthy();
    expect(component.userForm).toBeTruthy();
    expect(component.resourceQuotaForm).toBeTruthy();
  });

  it('should calculate currentUsageTotal correctly', () => {
    component.currentUsageData = [
      { totalCost: '10' },
      { totalCost: '20.5' }
    ];

    expect(component.currentUsageTotal).toBe('30.50');
  });

  it('should calculate estimatedUsageTotal correctly', () => {
    component.estimatedUsageData = [
      { totalCost: '5' },
      { totalCost: '7.5' }
    ];

    expect(component.estimatedUsageTotal).toBe('12.50');
  });

  it('should toggle general edit mode', () => {
    component.resourceQuotaForm = new FormBuilder().group({
      cpuMaxUserLimit: ['']
    });

    component.toggleGeneralEditMode();
    expect(component.isGeneralEditMode).toBeTrue();

    component.toggleGeneralEditMode();
    expect(component.isGeneralEditMode).toBeFalse();
  });

  it('should add and remove email rule', () => {
    component.ngOnInit();

    const initialLength = component.rulesFormArray.length;
    component.addEmail();

    expect(component.rulesFormArray.length).toBe(initialLength + 1);

    component.removeEmail(0);
    expect(component.rulesFormArray.length).toBe(initialLength);
  });

  it('should save environment changes', () => {
    projectSpy.updateEnvironment.and.returnValue(of({ success: true }));

    component.envId = 'e1';
    component.projectId = 'p1';
    component.environmentForm = new FormBuilder().group({
      name: ['UpdatedEnv']
    });
    component.resourceQuotaForm = new FormBuilder().group({
      cpuMaxUserLimit: ['1'],
      memoryMaxUserLimit: ['2'],
      ephemeralStorageMaxUserLimit: ['3'],
      pvcStorageMaxUserLimit: ['4']
    });

    component.saveEnvChanges();

    expect(projectSpy.updateEnvironment).toHaveBeenCalled();
    expect(toastrSpy.success).toHaveBeenCalledWith('Updated Successfully');
  });

  it('should delete environment after confirmation', async () => {
    const modalRef = {
      componentInstance: {},
      result: Promise.resolve(true)
    };

    modalSpy.open.and.returnValue(modalRef as any);
    projectSpy.deleteEnvironment.and.returnValue(
      of({ status: 'Success', message: 'Deleted' })
    );

    component.projectId = 'p1';
    component.envId = 'e1';

    await component.onLayoutButtonClick();

    expect(projectSpy.deleteEnvironment).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/projects']);
  });

  it('should clean up subscriptions on destroy', () => {
    component.ngOnDestroy();
    expect(layoutSpy.clearExtraTitle).toHaveBeenCalled();
  });

  it('should compute usage percent and bar color correctly', () => {
    const itemLow = { current_usage: 1, max_limit: 10 };
    const itemMid = { current_usage: 7, max_limit: 10 };
    const itemHigh = { current_usage: 9, max_limit: 10 };

    expect(component.getUsagePercent(itemLow)).toBeCloseTo(10);
    expect(component.getBarColor(itemLow)).toBe('#198754');

    expect(component.getUsagePercent(itemMid)).toBeCloseTo(70);
    expect(component.getBarColor(itemMid)).toBe('#ffc107');

    expect(component.getUsagePercent(itemHigh)).toBeCloseTo(90);
    expect(component.getBarColor(itemHigh)).toBe('#dc3545');
  });

  it('should add user only when form valid', () => {
    component.userForm = new FormBuilder().group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      role: ['', Validators.required]
    });

    const initialLength = component.userList.length;

    component.userForm.setValue({ name: '', email: 'bad', role: '' });
    component.addUser();
    expect(component.userList.length).toBe(initialLength);

    component.userForm.setValue({ name: 'User', email: 'u@x.com', role: 'admin' });
    component.addUser();
    expect(component.userList.length).toBe(initialLength + 1);
  });

  it('should not call deleteEnvironment when modal canceled', async () => {
    const modalRef = {
      componentInstance: {},
      result: Promise.resolve(false)
    };
    modalSpy.open.and.returnValue(modalRef as any);
    projectSpy.deleteEnvironment.and.returnValue(of({ status: 'Success' }));

    component.projectId = 'p1';
    component.envId = 'e1';

    await component.onLayoutButtonClick();

    expect(projectSpy.deleteEnvironment).not.toHaveBeenCalled();
  });
});
