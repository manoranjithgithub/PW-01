import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { DeploymentSettingsComponent } from './deployment-settings.component';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Router, ActivatedRoute } from '@angular/router';
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
    mockDeploymentService.getDeploymentById.and.returnValue(of({ status: 'Success', data: { name: 'TestDeployment', application: {}, buildConfig: {}, sourceCode: {} } }));
    mockDeploymentService.getDeployments.and.returnValue(of({ status: 'Success', data: [] }));
    mockDeploymentService.getInstanceTypes.and.returnValue(of({ data: { 'Nvidia L2': { cpu: '2', memory: '4Gi' } } }));

    mockPermissionService = jasmine.createSpyObj('PermissionService', ['canWriteGlobal', 'canAdminGlobal', 'canDeleteForCurrentUser']);
    mockPermissionService.canWriteGlobal.and.returnValue(true);
    mockPermissionService.canAdminGlobal.and.returnValue(false);
    mockPermissionService.canDeleteForCurrentUser.and.returnValue(true);

    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, FormsModule, CommonModule, DeploymentSettingsComponent],
      providers: [
        { provide: ToastrService, useValue: mockToastr },
        { provide: NgbModal, useValue: mockModal },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: LLMDeploymentsService, useValue: mockDeploymentService },
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
    component.generalSettingsForm.patchValue({ name: 'OldName', replicas: 1, instanceType: 'Nvidia L2', storage: null });
    tick();
    component.onGeneralSubmit();
    expect(mockDeploymentService.updateDeployment).toHaveBeenCalled();
  }));

  it('should mark form as touched if invalid on submit', () => {
    component.generalSettingsForm.patchValue({ name: '' }); // invalid
    component.onGeneralSubmit();
    expect(component.generalSettingsForm.touched).toBeTrue();
  });
});
