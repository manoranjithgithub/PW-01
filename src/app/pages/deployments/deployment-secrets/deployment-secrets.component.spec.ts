import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DeploymentSecretsComponent } from './deployment-secrets.component';
import { FormBuilder, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { DeploymentsService } from '../deployment.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { PermissionService } from '../../../shared/services/permission.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

describe('DeploymentSecretsComponent', () => {
  let component: DeploymentSecretsComponent;
  let fixture: ComponentFixture<DeploymentSecretsComponent>;
  let mockDeploymentsService: any;
  let mockToastr: any;
  let mockModalService: any;
  let mockPermissionService: any;
  let formBuilder: FormBuilder;

  beforeEach(async () => {
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
      imports: [ReactiveFormsModule, FormsModule, HttpClientTestingModule,
         DeploymentSecretsComponent],
      providers: [
        FormBuilder,
        { provide: DeploymentsService, useValue: mockDeploymentsService },
        { provide: ToastrService, useValue: mockToastr },
        { provide: NgbModal, useValue: mockModalService },
        { provide: PermissionService, useValue: mockPermissionService },
        {provide: ActivatedRoute, useValue: { 
          snapshot: { paramMap: { get: () => 'deployment123' } },
          queryParams: of({})
        } }
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DeploymentSecretsComponent);
    component = fixture.componentInstance;
    formBuilder = TestBed.inject(FormBuilder);
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form on ngOnInit', () => {
    component.ngOnInit();
    expect(component.secretForm).toBeDefined();
    expect(component.rulesFormArray.length).toBe(0);
  });

  it('should add a new rule', () => {
    component.addRule();
    expect(component.rulesFormArray.length).toBe(1);
  });

  it('should remove a rule', () => {
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

  it('should add secret to secretList', () => {
    component.addRule();
    component.rulesFormArray.at(0).patchValue({ name: 'TEST_KEY', value: '123' });

    component.addSecret();

    expect(component.secretList.length).toBe(1);
    expect(component.secretList[0]).toEqual({ EnvVariable: 'TEST_KEY', Value: '123' });
  });

  it('should edit an existing secret', () => {
    component.secretList = [{ EnvVariable: 'TEST_KEY', Value: '123' }];
    component.editSecret(0);

    expect(component.showSecretForm).toBeTrue();
    expect(component.editIndex).toBe(0);
    expect(component.rulesFormArray.at(0).value).toEqual({ name: 'TEST_KEY', value: '123' });
  });

  it('should call addEnvVariables when adding secret', () => {
    spyOn(component, 'addEnvVariables');

    component.addRule();
    component.rulesFormArray.at(0).patchValue({ name: 'NEW_KEY', value: '456' });

    component.addSecret();

    expect(component.addEnvVariables).toHaveBeenCalledWith(component.secretList);
  });

  it('nameValueDependencyValidator should return error if name exists but value is empty', () => {
    const group = formBuilder.group({ name: ['TEST'], value: [''] });
    const result = component.nameValueDependencyValidator(group);
    expect(result).toEqual({ valueRequired: true });
  });

  it('nameValueDependencyValidator should return null if both name and value exist', () => {
    const group = formBuilder.group({ name: ['TEST'], value: ['123'] });
    const result = component.nameValueDependencyValidator(group);
    expect(result).toBeNull();
  });
});
