import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { DeploymentSettingsComponent } from './deployment-settings.component';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Router, ActivatedRoute } from '@angular/router';
import { SharedService } from '../../../shared/services/shared.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { PermissionService } from '../../../shared/services/permission.service';
import { LLMDeploymentsService } from '../llm-deployment.service';
import { of } from 'rxjs';

describe('DeploymentSettingsComponent', () => {
  let component: DeploymentSettingsComponent;
  let fixture: ComponentFixture<DeploymentSettingsComponent>;
  let mockToastr: jasmine.SpyObj<ToastrService>;
  let mockModal: jasmine.SpyObj<NgbModal>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockActivatedRoute: any;
  let mockDeploymentService: jasmine.SpyObj<LLMDeploymentsService>;
  let mockPermissionService: jasmine.SpyObj<PermissionService>;

  beforeEach(async () => {
    mockToastr = jasmine.createSpyObj('ToastrService', ['success', 'error']);
    mockModal = jasmine.createSpyObj('NgbModal', ['open']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockActivatedRoute = {
      snapshot: { fragment: null },
      queryParams: of({ id: '123' })
    };
    mockDeploymentService = jasmine.createSpyObj('LLMDeploymentsService', ['getDeploymentById', 'updateDeployment', 'deleteDeployment', 'getDeployments', 'getInstanceTypes']);
    mockDeploymentService.getDeploymentById.and.callFake((id: any) => {
      // First call by id -> return lightweight meta
      if (id === '123') {
        return of({ status: 'Success', data: { id: '123', name: 'TestDeployment' } });
      }
      // Second call by name -> return full details used by getDeploymentById()
      return of({ status: 'Success', data: { name: 'TestDeployment', application: { replicas: 1, instanceType: 'Nvidia L2', storage: null }, buildConfig: {}, sourceCode: { type: 'git', gitUrl: 'https://github.com/org/repo.git branch' } } });
    });
    mockDeploymentService.getDeployments.and.returnValue(of({ status: 'Success', data: [] }));
    mockDeploymentService.getInstanceTypes.and.returnValue(of({ data: { 'Nvidia L2': { cpu: '2', memory: '4Gi' } } }));
    mockDeploymentService.updateDeployment.and.returnValue(of({ status: 'Success', data: { name: 'TestDeployment', application: { instanceType: 'Nvidia L2', replicas: 1, storage: null } } }));

    mockPermissionService = jasmine.createSpyObj('PermissionService', ['canWriteGlobal', 'canAdminGlobal', 'canDeleteForCurrentUser']);
    mockPermissionService.canWriteGlobal.and.returnValue(true);
    mockPermissionService.canAdminGlobal.and.returnValue(false);
    mockPermissionService.canDeleteForCurrentUser.and.returnValue(true);

    // Ensure component-level provider is overridden so the component uses our spy
    TestBed.overrideProvider(LLMDeploymentsService, { useValue: mockDeploymentService });

    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, FormsModule, CommonModule, DeploymentSettingsComponent, HttpClientTestingModule],
      providers: [
        { provide: ToastrService, useValue: mockToastr },
        { provide: NgbModal, useValue: mockModal },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: LLMDeploymentsService, useValue: mockDeploymentService },
        { provide: SharedService, useValue: { getCookie: () => null, getResourceUsage: () => [] } },
        { provide: PermissionService, useValue: mockPermissionService }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DeploymentSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize generalSettingsForm', () => {
    expect(component.generalSettingsForm).toBeDefined();
    const controls = component.generalSettingsForm.controls;
    expect(controls['name']).toBeDefined();
    expect(controls['modelId']).toBeDefined();
    expect(controls['replicas']).toBeDefined();
  });

  it('should fetch deployment details on init', fakeAsync(() => {
    component.ngOnInit();
    tick();
    expect(mockDeploymentService.getDeploymentById).toHaveBeenCalled();
    expect(component.deploymentdetails.name).toBe('TestDeployment');
  }));

  it('should detect changes in generalSettingsForm', fakeAsync(() => {
    component.ngOnInit();
    tick();
    component.generalSettingsForm.get('name')?.setValue('NewName');
    expect(component.isGeneralSettingsChanged).toBeTrue();
  }));

  it('should call updateDeployment on onGeneralSubmit', fakeAsync(() => {
    component.deploymentdetails = { id: '123', name: 'OldName', application: { replicas: 1, instanceType: 'Nvidia L2', storage: null }, buildConfig: {} };
    // supply all required fields so the form is valid
    component.generalSettingsForm.patchValue({
      name: 'OldName',
      modelId: 'model-1',
      replicas: 1,
      instanceType: 'Nvidia L2',
      contextLength: 512,
      storageSize: 10,
      ephemeralStorageSize: 10,
      environmentId: 'env-123'
    });
    // ensure form validity is propagated to the component
    fixture.detectChanges();
    tick();
    expect(component.generalSettingsForm.valid).toBeTrue();
    component.onGeneralSubmit();
    expect(mockDeploymentService.updateDeployment).toHaveBeenCalled();
  }));

  it('should mark form as touched if invalid on submit', () => {
    component.generalSettingsForm.patchValue({ name: '' }); // invalid
    component.onGeneralSubmit();
    expect(component.generalSettingsForm.touched).toBeTrue();
  });
});
