import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EnvironmentVariablesComponent } from './environment-variables.component';
import { FormBuilder, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { DeploymentsService } from '../deployment.service';
import { ToastrService } from 'ngx-toastr';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { PermissionService } from '../../../shared/services/permission.service';
import { of } from 'rxjs';
import { ActivatedRoute } from '@angular/router';

describe('EnvironmentVariablesComponent', () => {
  let component: EnvironmentVariablesComponent;
  let fixture: ComponentFixture<EnvironmentVariablesComponent>;
  let mockDeploymentsService: any;
  let mockToastr: any;
  let mockModalService: any;
  let mockActivatedRoute: any;

  beforeEach(async () => {
    mockDeploymentsService = jasmine.createSpyObj(['getDeploymentById', 'updateDeployment']);
    mockDeploymentsService.getDeploymentById.and.returnValue(of({ data: { environment: { VAR1: 'value1' } } }));
    mockDeploymentsService.updateDeployment.and.returnValue(of({ data: { environment: {} } }));

    mockToastr = jasmine.createSpyObj(['success', 'error']);
    mockModalService = jasmine.createSpyObj(['open']);
    mockActivatedRoute = {
      queryParams: of({ id: '123' })
    };

    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, FormsModule, HttpClientTestingModule, EnvironmentVariablesComponent],
      providers: [
        FormBuilder,
        { provide: DeploymentsService, useValue: mockDeploymentsService },
        { provide: ToastrService, useValue: mockToastr },
        { provide: NgbModal, useValue: mockModalService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        PermissionService
      ],
    });

    TestBed.overrideComponent(EnvironmentVariablesComponent, {
      set: {
        providers: [
          { provide: DeploymentsService, useValue: mockDeploymentsService }
        ]
      }
    });

    await TestBed.compileComponents();

    fixture = TestBed.createComponent(EnvironmentVariablesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form array with one rule when adding new variable', () => {
    component.cancelVariableForm();
    expect(component.showNewVariableForm).toBeTrue();
    expect(component.rulesFormArray.length).toBe(1);
  });

  it('should add a new environment variable', () => {
    component.showNewVariableForm = true;
    component.addRule();
    const rule = component.rulesFormArray.at(0);
    rule.get('name')?.setValue('TEST_VAR');
    rule.get('value')?.setValue('123');
    component.addVariable();

    expect(component.envList.length).toBe(1);
    expect(component.envList[0].EnvVariable).toBe('TEST_VAR');
    expect(component.envList[0].Value).toBe('123');
  });

  it('should edit an existing environment variable', () => {
    component.envList = [{ EnvVariable: 'EXISTING_VAR', Value: 'oldValue' }];
    component.editDetails(0);
    const rule = component.rulesFormArray.at(0);
    rule.get('value')?.setValue('newValue');
    component.addVariable();

    expect(component.envList[0].Value).toBe('newValue');
  });

  it('should delete an environment variable', async () => {
    component.envList = [{ EnvVariable: 'VAR_TO_DELETE', Value: 'value' }];
    const modalRefMock: any = {
      componentInstance: {},
      result: Promise.resolve(true)
    };
    mockModalService.open.and.returnValue(modalRefMock);

    await component.deleteDetails(0);
    expect(component.envList.length).toBe(0);
  });

  it('should toggle raw editor modal', () => {
    (component as any).rawEditorModel = jasmine.createSpyObj('ModalComponent', ['open', 'dismiss']);
    component.openRawEditor();
    expect((component as any).rawEditorModel.open).toHaveBeenCalled();
    component.closeModal({});
    expect((component as any).rawEditorModel.dismiss).toHaveBeenCalled();
  });

  // Additional tests

  it('should emit envDetails when canAddVariables is false in addEnvVariables', () => {
    component.canAddVariables = false;
    const emitSpy = spyOn(component.envDetails, 'emit');
    const sample = [{ EnvVariable: 'X', Value: '1' }];
    component.addEnvVariables(sample);
    expect(emitSpy).toHaveBeenCalledWith({ data: { X: '1' } });
  });

  it('nameValueDependencyValidator should return null when both empty and error when name present and value empty', () => {
    const fb = new FormBuilder();
    const bothEmpty = fb.group({ name: [''], value: [''] });
    const onlyName = fb.group({ name: ['NAME'], value: [''] });

    expect(component.nameValueDependencyValidator(bothEmpty)).toBeNull();
    expect(component.nameValueDependencyValidator(onlyName)).toEqual({ valueRequired: true });
  });

  it('createEnvironmentVariable should not call updateDeployment when updatedReq.data is empty', () => {
    component.updatedReq = { data: {} };
    const updateSpy = mockDeploymentsService.updateDeployment;
    component.deploymentId = '123';
    component.createEnvironmentVariable();
    expect(updateSpy).not.toHaveBeenCalled();
  });

  it('createEnvironmentVariable should call updateDeployment when updatedReq has data and deploymentId is set', () => {
    component.updatedReq = { data: { A: '1' } };
    component.deploymentId = 'dep-1';
    component.createEnvironmentVariable();
    expect(mockDeploymentsService.updateDeployment).toHaveBeenCalledWith('dep-1', { environment: { A: '1' } });
  });

  it('mapEnvVariables (private) should map object to array (accessed via any)', () => {
    const mapped = (component as any).mapEnvVariables({ K1: 'v1', K2: 'v2' });
    expect(mapped).toEqual(jasmine.arrayContaining([
      { EnvVariable: 'K1', Value: 'v1' },
      { EnvVariable: 'K2', Value: 'v2' }
    ]));
  });
});
