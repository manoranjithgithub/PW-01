import { ComponentFixture, TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { DeploymentSecretsComponent } from './deployment-secrets.component';
import { FormBuilder, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { DeploymentsService } from '../deployment.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { PermissionService } from '../../../shared/services/permission.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { of, BehaviorSubject, throwError } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('DeploymentSecretsComponent', () => {
  let component: DeploymentSecretsComponent;
  let fixture: ComponentFixture<DeploymentSecretsComponent>;
  let mockDeploymentsService: any;
  let mockToastr: any;
  let mockModalService: any;
  let mockPermissionService: any;
  let formBuilder: FormBuilder;
  const queryParamsSubject = new BehaviorSubject<any>({});

  beforeEach(async () => {
    spyOn(localStorage, 'getItem').and.callFake((key: string) => {
      if (key === 'environment') {
        return JSON.stringify({ id: 'env-123' });
      }
      if (key === 'resourceUsage') {
        return JSON.stringify([{ resource_type: 'secrets', remaining: 5 }]);
      }
      return null;
    });

    mockDeploymentsService = jasmine.createSpyObj(['getDeploymentById', 'updateDeployment']);
    mockDeploymentsService.getDeploymentById.and.returnValue(of({ data: {} }));
    mockDeploymentsService.updateDeployment.and.returnValue(of({}));
    mockToastr = jasmine.createSpyObj(['success', 'error']);
    mockModalService = jasmine.createSpyObj(['open']);
    mockPermissionService = jasmine.createSpyObj(['canWriteGlobal', 'canAdminGlobal', 'canDeleteForCurrentUser']);
    mockPermissionService.canWriteGlobal.and.returnValue(true);
    mockPermissionService.canAdminGlobal.and.returnValue(true);
    mockPermissionService.canDeleteForCurrentUser.and.returnValue(true);

    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, FormsModule, HttpClientTestingModule, DeploymentSecretsComponent],
      providers: [
        FormBuilder,
        { provide: DeploymentsService, useValue: mockDeploymentsService },
        { provide: ToastrService, useValue: mockToastr },
        { provide: NgbModal, useValue: mockModalService },
        { provide: PermissionService, useValue: mockPermissionService },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'deployment123' } }, queryParams: queryParamsSubject.asObservable() } }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .overrideComponent(DeploymentSecretsComponent, {
      set: {
        providers: [
          { provide: DeploymentsService, useValue: mockDeploymentsService },
          { provide: NgbModal, useValue: mockModalService },
          { provide: ToastrService, useValue: mockToastr }
        ]
      }
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeploymentSecretsComponent);
    component = fixture.componentInstance;
    formBuilder = TestBed.inject(FormBuilder);
    fixture.detectChanges();
  });

  afterEach(() => {
    queryParamsSubject.next({});
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form on ngOnInit', () => {
    component.ngOnInit();
    expect(component.secretForm).toBeDefined();
    expect(component.rulesFormArray.length).toBe(0);
  });

  it('ngOnInit: loads secrets when queryParams contains id and calls getDeploymentById', fakeAsync(() => {
    const mockResp = { data: { name: 'dep', secret: { KEY: 'VAL' } } };
    mockDeploymentsService.getDeploymentById.and.returnValue(of(mockResp));

    queryParamsSubject.next({ id: 'dep-xyz' });
    component.ngOnInit();
    flushMicrotasks();

    expect(component.deploymentId).toBe('dep-xyz');
    expect(component.isEditSecret).toBeTrue();
    expect(component.secretList.length).toBeGreaterThan(0);
  }));

  it('should add and remove rules', () => {
    component.addRule();
    expect(component.rulesFormArray.length).toBe(1);
    component.removeRule(0);
    expect(component.rulesFormArray.length).toBe(0);
  });

  it('should toggle password visibility', () => {
    const index = 0;
    expect(component.isPasswordVisible(index)).toBeFalse();
    component.togglePassword(index);
    expect(component.isPasswordVisible(index)).toBeTrue();
    component.togglePassword(index);
    expect(component.isPasswordVisible(index)).toBeFalse();
  });

  it('should add secret to secretList and emit', () => {
    component.addRule();
    component.rulesFormArray.at(0).patchValue({ name: 'TEST_KEY', value: '123' });

    spyOn(component.secretDetails, 'emit');
    component.addSecret();

    expect(component.secretList.length).toBe(1);
    expect(component.secretDetails.emit).toHaveBeenCalled();
    expect(component.secretList[0]).toEqual({ EnvVariable: 'TEST_KEY', Value: '123' });
    expect(mockDeploymentsService.updateDeployment).not.toHaveBeenCalled();
  });

  it('editSecret should populate form', () => {
    component.secretList = [{ EnvVariable: 'TEST_KEY', Value: '123' }];
    component.editSecret(0);
    expect(component.showSecretForm).toBeTrue();
    expect(component.editIndex).toBe(0);
    expect(component.rulesFormArray.at(0).value).toEqual({ name: 'TEST_KEY', value: '123' });
  });

  it('nameValueDependencyValidator should validate', () => {
    const group = formBuilder.group({ name: ['TEST'], value: [''] });
    expect(component.nameValueDependencyValidator(group)).toEqual({ valueRequired: true });
    const group2 = formBuilder.group({ name: ['TEST'], value: ['123'] });
    expect(component.nameValueDependencyValidator(group2)).toBeNull();
  });

  it('deleteSecret updates local state when confirmed', fakeAsync(() => {
    component.deploymentId = 'dep-1';
    component.secretList = [{ EnvVariable: 'A', Value: 'B' }];
    const modalRef: any = { result: Promise.resolve(true), componentInstance: {} };
    mockModalService.open.and.returnValue(modalRef);

    component.deleteSecret(0);
    flushMicrotasks();

    expect(component.secretList.length).toBe(0);
    expect(mockDeploymentsService.updateDeployment).not.toHaveBeenCalled();
  }));

  it('deleteSecret shows toaster on update error', fakeAsync(() => {
    component.deploymentId = 'dep-2';
    component.secretList = [{ EnvVariable: 'X', Value: 'Y' }];
    const modalRef: any = { result: Promise.resolve(true), componentInstance: {} };
    mockModalService.open.and.returnValue(modalRef);
    mockDeploymentsService.updateDeployment.and.returnValue(throwError(() => new Error('fail')));

    component.deleteSecret(0);
    flushMicrotasks();

    expect(mockToastr.error).toHaveBeenCalled();
  }));

  it('addSecret updates existing secret locally when editing', fakeAsync(() => {
    component.deploymentId = 'dep-update-1';
    component.secretList = [{ EnvVariable: 'KEEP', Value: '0' }, { EnvVariable: 'OLD', Value: '1' }];
    component.editIndex = 1 as any;
    component.showSecretForm = true;
    component.addRule();
    component.rulesFormArray.at(0).patchValue({ name: 'NEW', value: '2' });

    component.addSecret();
    flushMicrotasks();

    expect(component.secretList.length).toBe(2);
    expect(component.secretList[1]).toEqual({ EnvVariable: 'NEW', Value: '2' });
    expect(mockDeploymentsService.updateDeployment).not.toHaveBeenCalled();
  }));

  it('addSecret does not change secrets when form invalid', () => {
    component.secretList = [];
    component.showSecretForm = true;

    component.addSecret();

    expect(component.secretList.length).toBe(0);
  });

  it('addEnvVariables stores draft data without calling updateDeployment', fakeAsync(() => {
    component.deploymentId = 'dep-error-1';
    mockDeploymentsService.updateDeployment.and.returnValue(throwError(() => new Error('update-fail')));

    const data = [{ EnvVariable: 'A', Value: 'B' }];
    component.addEnvVariables(data);
    flushMicrotasks();

    expect(mockDeploymentsService.updateDeployment).not.toHaveBeenCalled();
    expect(mockToastr.error).not.toHaveBeenCalled();
  }));

  it('onVariablesUpdated replaces secretList without saving immediately', () => {
    const spyEmit = spyOn(component.secretDetails, 'emit');

    const updated = [{ EnvVariable: 'K', Value: 'V' }];
    component.onVariablesUpdated(updated);

    expect(component.secretList.some((s: any) => s.EnvVariable === 'K')).toBeTrue();
    expect(spyEmit).toHaveBeenCalled();
    expect(mockDeploymentsService.updateDeployment).not.toHaveBeenCalled();
  });

  it('createSecretVariable should call updateDeployment when updatedReq has data', fakeAsync(() => {
    component.deploymentId = 'dep-save-1';
    component.updatedReq = { data: { A: '1' } };
    mockDeploymentsService.updateDeployment.and.returnValue(of({ data: { secret: { A: '1' } } }));

    component.createSecretVariable();
    flushMicrotasks();

    expect(mockDeploymentsService.updateDeployment).toHaveBeenCalledWith('dep-save-1', { secret: { A: '1' } });
    expect(mockToastr.success).toHaveBeenCalledWith('Secrets updated successfully');
  }));

  it('createSecretVariable should not call updateDeployment when updatedReq is missing', () => {
    component.deploymentId = 'dep-save-2';
    component.createSecretVariable();

    expect(mockDeploymentsService.updateDeployment).not.toHaveBeenCalled();
  }));
});
