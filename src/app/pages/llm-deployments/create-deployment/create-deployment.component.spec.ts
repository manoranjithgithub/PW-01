import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CreateDeploymentComponent } from './create-deployment.component';
import { ReactiveFormsModule } from '@angular/forms';
import { LLMDeploymentsService } from '../llm-deployment.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ToastrService, TOAST_CONFIG } from 'ngx-toastr';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { toastConfigMock } from '../../../../test-helpers/testing-mocks';

describe('CreateDeploymentComponent', () => {
  let component: CreateDeploymentComponent;
  let fixture: ComponentFixture<CreateDeploymentComponent>;

  let serviceSpy: jasmine.SpyObj<LLMDeploymentsService>;
  let toastrSpy: jasmine.SpyObj<ToastrService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    serviceSpy = jasmine.createSpyObj('LLMDeploymentsService', ['createDeployement']);
    toastrSpy = jasmine.createSpyObj('ToastrService', ['success', 'error']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    spyOn(localStorage, 'getItem').and.callFake((key: string) => {
      if (key === 'environment') {
        return JSON.stringify({ id: 'env-123' });
      }
      return null;
    });

    await TestBed.configureTestingModule({
      imports: [CreateDeploymentComponent, ReactiveFormsModule, HttpClientTestingModule],
      providers: [
        { provide: LLMDeploymentsService, useValue: serviceSpy },
        { provide: ToastrService, useValue: toastrSpy },
        { provide: Router, useValue: routerSpy },
        { provide: TOAST_CONFIG, useValue: toastConfigMock },
      ],
      schemas: [NO_ERRORS_SCHEMA]
    });

    // Ensure component-level provider (if any) uses our spy
    TestBed.overrideComponent(CreateDeploymentComponent as any, {
      set: {
        providers: [
          { provide: LLMDeploymentsService, useValue: serviceSpy }
        ]
      }
    });

    await TestBed.compileComponents();

    fixture = TestBed.createComponent(CreateDeploymentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create component', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit()', () => {
    it('should initialize form with default values', () => {
      expect(component.deploymentForm).toBeDefined();
      expect(component.deploymentForm.get('replicas')?.value).toBe(1);
      expect(component.deploymentForm.get('instanceType')?.value).toBe('Nvidia L2');
      expect(component.envId).toBe('env-123');
    });
  });

  describe('form validation', () => {
    it('should mark form invalid when required fields are empty', () => {
      component.deploymentForm.patchValue({
        name: '',
        modelId: ''
      });

      expect(component.deploymentForm.invalid).toBeTrue();
    });

    it('isError() should return true for touched invalid control', () => {
      const control = component.deploymentForm.get('name');
      control?.markAsTouched();

      expect(component.isError('name', 'required')).toBeTrue();
    });
  });

  describe('onSubmit()', () => {
    beforeEach(() => {
      component.deploymentForm.patchValue({
        name: 'test-deploy',
        modelId: 'model-1',
        replicas: 1,
        instanceType: 'Nvidia L2',
        contextLength: 512,
        storageSize: 10,
        ephemeralStorageSize: 20
      });
    });

    it('should not submit if form is invalid', () => {
      component.deploymentForm.get('name')?.setValue('');
      component.onSubmit();

      expect(serviceSpy.createDeployement).not.toHaveBeenCalled();
    });

    it('should append Gi to storage fields and call service', () => {
      serviceSpy.createDeployement.and.returnValue(
        of({ message: 'Success' })
      );

      component.onSubmit();

      expect(serviceSpy.createDeployement).toHaveBeenCalledWith(
        jasmine.objectContaining({
          storageSize: '10Gi',
          ephemeralStorageSize: '20Gi',
          environmentId: 'env-123'
        })
      );
    });

    it('should show success toast and navigate on success', () => {
      serviceSpy.createDeployement.and.returnValue(
        of({ message: 'Deployment created successfully' })
      );

      component.onSubmit();

      expect(toastrSpy.success).toHaveBeenCalledWith('Deployment created successfully');
      expect(routerSpy.navigate).toHaveBeenCalledWith(['llm/list']);
    });

    it('should show error toast on failure', () => {
      serviceSpy.createDeployement.and.returnValue(
        throwError(() => ({ message: 'API Error' }))
      );

      component.onSubmit();

      expect(toastrSpy.error).toHaveBeenCalledWith('API Error');
      expect(routerSpy.navigate).not.toHaveBeenCalled();
    });

    it('should handle missing error message gracefully', () => {
      serviceSpy.createDeployement.and.returnValue(
        throwError(() => ({}))
      );

      component.onSubmit();

      expect(toastrSpy.error).toHaveBeenCalledWith('Failed to create deployment');
    });
  });
});
