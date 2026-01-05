import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { DeploymentSettingsComponent } from './deployment-settings.component';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule, ViewportScroller } from '@angular/common';
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
  let mockViewportScroller: jasmine.SpyObj<ViewportScroller>;

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
      if (id === '123') {
        return of({ status: 'Success', data: { id: '123', name: 'TestDeployment' } });
      }
      return of({ status: 'Success', data: { name: 'TestDeployment', application: { replicas: 1, instanceType: 'Nvidia L2', storage: null }, buildConfig: {}, sourceCode: { type: 'git', gitUrl: 'https://github.com/org/repo.git branch' } } });
    });
    mockDeploymentService.getDeployments.and.returnValue(of({ status: 'Success', data: [] }));
    mockDeploymentService.getInstanceTypes.and.returnValue(of({ data: { 'Nvidia L2': { cpu: '2', memory: '4Gi' } } }));
    mockDeploymentService.updateDeployment.and.returnValue(of({ status: 'Success', data: { name: 'TestDeployment', application: { instanceType: 'Nvidia L2', replicas: 1, storage: null } } }));

    mockPermissionService = jasmine.createSpyObj('PermissionService', ['canWriteGlobal', 'canAdminGlobal', 'canDeleteForCurrentUser']);
    mockPermissionService.canWriteGlobal.and.returnValue(true);
    mockPermissionService.canAdminGlobal.and.returnValue(false);
    mockPermissionService.canDeleteForCurrentUser.and.returnValue(true);

    mockViewportScroller = jasmine.createSpyObj('ViewportScroller', ['scrollToAnchor']);

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
        { provide: PermissionService, useValue: mockPermissionService },
        { provide: ViewportScroller, useValue: mockViewportScroller }
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
    fixture.detectChanges();
    tick();
    expect(component.generalSettingsForm.valid).toBeTrue();
    component.onGeneralSubmit();
    expect(mockDeploymentService.updateDeployment).toHaveBeenCalled();
  }));

  it('should mark form as touched if invalid on submit', () => {
    component.generalSettingsForm.patchValue({ name: '' }); 
    component.onGeneralSubmit();
    expect(component.generalSettingsForm.touched).toBeTrue();
  });

  describe('ngAfterViewInit', () => {
    it('should scroll to fragment if present', fakeAsync(() => {
      mockActivatedRoute.snapshot.fragment = 'test-section';
      component.ngAfterViewInit();
      tick(150);
      expect(mockViewportScroller.scrollToAnchor).toHaveBeenCalledWith('test-section');
    }));

    it('should not scroll when no fragment', fakeAsync(() => {
      mockActivatedRoute.snapshot.fragment = null;
      component.ngAfterViewInit();
      tick(150);
      expect(mockViewportScroller.scrollToAnchor).not.toHaveBeenCalled();
    }));
  });

  describe('ngOnInit edge cases', () => {
    it('should handle missing deployment ID', () => {
      mockActivatedRoute.queryParams = of({});
      component.ngOnInit();
      expect(mockToastr.error).toHaveBeenCalledWith('Deployment ID is missing in the URL');
    });

    it('should set freezeAddNewData when status is building', () => {
      component.currentStatus = 'Building';
      component.ngOnInit();
      expect(component.freezeAddNewData).toBeTrue();
    });

    it('should disable form when user lacks permissions', () => {
      mockPermissionService.canWriteGlobal.and.returnValue(false);
      mockPermissionService.canAdminGlobal.and.returnValue(false);
      mockPermissionService.canDeleteForCurrentUser.and.returnValue(false);
      component.ngOnInit();
      expect(component.formDisabled).toBeTrue();
    });

    it('should handle missing environment in localStorage', () => {
      spyOn(localStorage, 'getItem').and.returnValue(null);
      component.ngOnInit();
      expect(component.envId).toBeNull();
    });

    it('should parse resourceUsage from localStorage', () => {
      const resourceUsage = [
        { resource_type: 'CPU', remaining: 10 },
        { resource_type: 'RAM', remaining: 20 },
        { resource_type: 'ephemeral_storage', remaining: 30 }
      ];
      spyOn(localStorage, 'getItem').and.callFake((key: string) => {
        if (key === 'resourceUsage') return JSON.stringify(resourceUsage);
        if (key === 'environment') return JSON.stringify({ id: 'env-123' });
        return null;
      });
      component.ngOnInit();
      expect(component.cpuQuota.remaining).toBe(10);
      expect(component.ramQuota.remaining).toBe(20);
      expect(component.ephemeralQuota.remaining).toBe(30);
    });
  });

  describe('getDeploymentById', () => {
    it('should parse git URL and extract provider', fakeAsync(() => {
      mockDeploymentService.getDeploymentById.and.returnValue(of({
        status: 'SUCCESS',
        data: {
          name: 'test',
          sourceCode: {
            type: 'vcs',
            gitUrl: 'https://oauth:token@github.com/user/repo.git -b main'
          }
        }
      }));
      component.deploymentdetails = { name: 'test' };
      component.getDeploymentById();
      tick();
      expect(component.generalSettingsForm).toBeDefined();
    }));

    it('should handle file-based source code', fakeAsync(() => {
      mockDeploymentService.getDeploymentById.and.returnValue(of({
        status: 'SUCCESS',
        data: {
          name: 'test',
          sourceCode: { type: 'file', s3FileKey: 'test-key-123' }
        }
      }));
      component.deploymentdetails = { name: 'test' };
      component.getDeploymentById();
      tick();
      expect(component.s3FileKey).toBe('test-key-123');
    }));

    it('should handle missing sourceCode', fakeAsync(() => {
      mockDeploymentService.getDeploymentById.and.returnValue(of({
        status: 'SUCCESS',
        data: { name: 'test' }
      }));
      component.deploymentdetails = { name: 'test' };
      component.getDeploymentById();
      tick();
      expect(component.generalSettingsForm).toBeDefined();
    }));
  });

  describe('onInstanceTypeChange', () => {
    beforeEach(() => {
      component.resources = [
        { name: 'Nvidia L2', cpu: '2000m', memory: '4Gi' },
        { name: 'Nvidia L4', cpu: '4', memory: '8192Mi' }
      ];
    });

    it('should convert CPU from millicores to cores', () => {
      component.cpuQuota = { remaining: 10 };
      component.ramQuota = { remaining: 10 };
      component.generalSettingsForm.patchValue({ instanceType: 'Nvidia L2' });
      component.onInstanceTypeChange();
      expect(component.cpuExhausted).toBeFalse();
    });

    it('should convert RAM from Mi to GB', () => {
      component.cpuQuota = { remaining: 10 };
      component.ramQuota = { remaining: 10 };
      component.generalSettingsForm.patchValue({ instanceType: 'Nvidia L4' });
      component.onInstanceTypeChange();
      expect(component.ramExhausted).toBeFalse();
    });

    it('should set cpuExhausted when quota exceeded', () => {
      component.cpuQuota = { remaining: 1 };
      component.ramQuota = { remaining: 10 };
      component.generalSettingsForm.patchValue({ instanceType: 'Nvidia L2' });
      component.onInstanceTypeChange();
      expect(component.cpuExhausted).toBeTrue();
    });

    it('should set ramExhausted when quota exceeded', () => {
      component.cpuQuota = { remaining: 10 };
      component.ramQuota = { remaining: 2 };
      component.generalSettingsForm.patchValue({ instanceType: 'Nvidia L2' });
      component.onInstanceTypeChange();
      expect(component.ramExhausted).toBeTrue();
    });

    it('should handle no selected resource', () => {
      component.generalSettingsForm.patchValue({ instanceType: 'Unknown' });
      component.onInstanceTypeChange();
      expect(component.selectedResource).toBeUndefined();
    });

    it('should clear exhausted flags when quota available', () => {
      component.cpuQuota = { remaining: 10 };
      component.ramQuota = { remaining: 10 };
      component.cpuExhausted = true;
      component.ramExhausted = true;
      component.generalSettingsForm.patchValue({ instanceType: 'Nvidia L2' });
      component.onInstanceTypeChange();
      expect(component.cpuExhausted).toBeFalse();
      expect(component.ramExhausted).toBeFalse();
    });
  });

  describe('onGeneralSubmit edge cases', () => {
    it('should handle response with error', fakeAsync(() => {
      component.deploymentdetails = { id: '123', name: 'Test', application: {}, buildConfig: {} };
      component.generalSettingsForm.patchValue({
        name: 'NewName',
        modelId: 'model-1',
        replicas: 2,
        instanceType: 'Nvidia L4',
        contextLength: 1024,
        storageSize: 20,
        ephemeralStorageSize: 20
      });
      const errorSpy = spyOn(console, 'error');
      mockDeploymentService.updateDeployment.and.returnValue(
        of({ status: 'ERROR', message: 'Update failed' })
      );
      component.onGeneralSubmit();
      tick();
      expect(mockToastr.success).not.toHaveBeenCalled();
    }));

    it('should only send changed fields', fakeAsync(() => {
      component.deploymentdetails = {
        id: '123',
        name: 'OldName',
        application: { replicas: 1, instanceType: 'Nvidia L2', storage: null }
      };
      component.generalSettingsForm.patchValue({
        name: 'NewName',
        modelId: 'model-1',
        replicas: 2,
        instanceType: 'Nvidia L4',
        contextLength: 512,
        storageSize: 10,
        ephemeralStorageSize: 10,
        storage: 100
      });
      component.onGeneralSubmit();
      tick();
      const callArgs = mockDeploymentService.updateDeployment.calls.mostRecent().args[1];
      expect(callArgs.name).toBe('NewName');
      expect(callArgs.application.replicas).toBe(2);
    }));
  });

  describe('deleteDeployment', () => {
    xit('should call deleteDeployment and show success message', fakeAsync(() => {
      component.deploymentdetails = { id: '123' };
      const modalRef = {
        componentInstance: {},
        result: Promise.resolve(true)
      };
      mockModal.open.and.returnValue(modalRef as any);
      mockDeploymentService.deleteDeployment.and.returnValue(
        of({ status: 'SUCCESS', message: 'Deleted successfully' })
      );
      
      component.deleteDeployment();
      tick();
      
      expect(mockDeploymentService.deleteDeployment).toHaveBeenCalledWith('123');
      expect(mockToastr.success).toHaveBeenCalledWith('Deleted successfully');
    }));

    it('should not delete when modal is cancelled', fakeAsync(() => {
      component.deploymentdetails = { id: '123' };
      const modalRef = {
        componentInstance: {},
        result: Promise.resolve(false)
      };
      mockModal.open.and.returnValue(modalRef as any);
      const consoleSpy = spyOn(console, 'log');
      
      component.deleteDeployment();
      tick();
      
      expect(mockDeploymentService.deleteDeployment).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('Cancelled delete environment!');
    }));
  });

  describe('getDeployments', () => {
    it('should fetch deployments when envId exists', () => {
      spyOn(localStorage, 'getItem').and.returnValue(JSON.stringify({ id: 'env-123' }));
      component.getDeployments();
      expect(mockDeploymentService.getDeployments).toHaveBeenCalledWith('env-123');
    });

    it('should not fetch when envId is missing', () => {
      spyOn(localStorage, 'getItem').and.returnValue(null);
      mockDeploymentService.getDeployments.calls.reset();
      component.getDeployments();
      expect(mockDeploymentService.getDeployments).not.toHaveBeenCalled();
    });

    it('should handle error response', () => {
      component.serviceList = undefined; // Reset to undefined before test
      spyOn(localStorage, 'getItem').and.returnValue(JSON.stringify({ id: 'env-123' }));
      mockDeploymentService.getDeployments.and.returnValue(
        of({ status: 'ERROR', data: [] })
      );
      component.getDeployments();
      expect(component.serviceList).toBeUndefined();
    });
  });

  describe('isError', () => {
    it('should return true when control has error and is touched', () => {
      const control = component.generalSettingsForm.get('name');
      control?.setErrors({ required: true });
      control?.markAsTouched();
      expect(component.isError('name', 'required')).toBeTrue();
    });

    it('should return false when control has no error', () => {
      const control = component.generalSettingsForm.get('name');
      control?.setValue('TestName');
      expect(component.isError('name', 'required')).toBeFalse();
    });

    it('should return false when control is not touched', () => {
      const control = component.generalSettingsForm.get('name');
      control?.setErrors({ required: true });
      expect(component.isError('name', 'required')).toBeFalse();
    });
  });

  describe('getChangedFields', () => {
    it('should detect changed string fields', () => {
      const current = { name: 'NewName', value: 'test' };
      const original = { name: 'OldName', value: 'test' };
      const changed = (component as any).getChangedFields(current, original);
      expect(changed.name).toBe('NewName');
      expect(changed.value).toBeUndefined();
    });

    it('should trim and compare strings', () => {
      const current = { name: 'test  ' };
      const original = { name: 'test' };
      const changed = (component as any).getChangedFields(current, original);
      expect(Object.keys(changed).length).toBe(0);
    });

    it('should ignore null and undefined values', () => {
      const current = { name: 'test', value: null, other: undefined };
      const original = { name: 'test', value: 'old' };
      const changed = (component as any).getChangedFields(current, original);
      expect(changed.value).toBeUndefined();
      expect(changed.other).toBeUndefined();
    });

    it('should detect non-string changes', () => {
      const current = { count: 5, enabled: true };
      const original = { count: 3, enabled: false };
      const changed = (component as any).getChangedFields(current, original);
      expect(changed.count).toBe(5);
      expect(changed.enabled).toBeTrue();
    });

    it('should handle missing original value', () => {
      const current = { name: 'test', value: 'new' };
      const original = null;
      const changed = (component as any).getChangedFields(current, original);
      expect(changed.name).toBe('test');
      expect(changed.value).toBe('new');
    });
  });

  describe('onCloseClicked', () => {
    it('should emit closeModalEvent', () => {
      spyOn(component.closeModalEvent, 'emit');
      component.onCloseClicked();
      expect(component.closeModalEvent.emit).toHaveBeenCalled();
    });
  });

  describe('form validation', () => {
    it('should validate storage pattern', () => {
      const control = component.generalSettingsForm.get('storage');
      control?.setValue('abc');
      expect(control?.invalid).toBeTrue();
      control?.setValue('123');
      expect(control?.valid).toBeTrue();
    });

    it('should require name field', () => {
      const control = component.generalSettingsForm.get('name');
      control?.setValue('');
      expect(control?.hasError('required')).toBeTrue();
    });

    it('should require modelId field', () => {
      const control = component.generalSettingsForm.get('modelId');
      control?.setValue('');
      expect(control?.hasError('required')).toBeTrue();
    });
  });

  describe('instanceType with Gi suffix', () => {
    it('should handle RAM with Gi suffix correctly', () => {
      component.resources = [{ name: 'Test', cpu: '2', memory: '8Gi' }];
      component.cpuQuota = { remaining: 10 };
      component.ramQuota = { remaining: 10 };
      component.generalSettingsForm.patchValue({ instanceType: 'Test' });
      component.onInstanceTypeChange();
      expect(component.ramExhausted).toBeFalse();
    });
  });

  describe('form state changes', () => {
    it('should track form changes after initialization', fakeAsync(() => {
      mockDeploymentService.getDeploymentById.and.returnValue(of({
        status: 'SUCCESS',
        data: { name: 'test', application: { replicas: 1 }, sourceCode: { type: 'git' } }
      }));
      component.deploymentdetails = { name: 'test' };
      component.getDeploymentById();
      tick();
      component.generalSettingsForm.patchValue({ name: 'changed' });
      tick();
      expect(component.isGeneralSettingsChanged).toBeTrue();
    }));
  });
});
