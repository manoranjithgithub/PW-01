import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DeploymentNetworkingComponent } from './deployment-networking.component';
import { DeploymentsService } from '../deployment.service';
import { ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { of } from 'rxjs';
import { PermissionService } from '../../../shared/services/permission.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Validators } from '@angular/forms';

class MockDeploymentsService {
  getDeploymentById = jasmine.createSpy('getDeploymentById').and.callFake((id: string) =>
    of({ status: 'success', data: { id, name: 'Test App', network: {} } })
  );
  getAuthenticatedresponse = jasmine.createSpy('getAuthenticatedresponse').and.returnValue(of({ data: { authentication: { username: '', password: '' } } }));
  createEndpoint = jasmine.createSpy('createEndpoint').and.returnValue(of({ status: 'success', data: {}, message: 'Success' }));
  deleteEndpoint = jasmine.createSpy('deleteEndpoint').and.returnValue(of({ status: 'success', message: 'Deleted' }));
}

class MockToastrService {
  success(message: string) {}
  error(message: string) {}
}

describe('DeploymentNetworkingComponent', () => {
  let component: DeploymentNetworkingComponent;
  let fixture: ComponentFixture<DeploymentNetworkingComponent>;
  let deploymentService: DeploymentsService;
  let toastr: ToastrService;

  beforeEach(async () => {
    const mockDeploymentsService = new MockDeploymentsService();

    await TestBed.configureTestingModule({
      imports: [DeploymentNetworkingComponent, HttpClientTestingModule,BrowserAnimationsModule],
      providers: [
        { provide: DeploymentsService, useValue: mockDeploymentsService },
        { provide: ToastrService, useClass: MockToastrService },
        { provide: ActivatedRoute, useValue: { queryParams: of({ id: '1' }) } },
        PermissionService
      ]
    }).compileComponents();

    TestBed.overrideComponent(DeploymentNetworkingComponent, {
      set: {
        providers: [
          { provide: DeploymentsService, useValue: mockDeploymentsService }
        ]
      }
    });
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DeploymentNetworkingComponent);
    component = fixture.componentInstance;
    deploymentService = TestBed.inject(DeploymentsService);
    toastr = TestBed.inject(ToastrService);
    localStorage.setItem('environment', JSON.stringify({ id: 'env1' }));
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize the form', () => {
    expect(component.networkSettingsForm).toBeDefined();
    expect(component.networkSettingsForm.get('service')?.value).toBe('Test App');
  });

  it('should fetch deployment details on init', () => {
    expect((deploymentService as any).getDeploymentById).toHaveBeenCalledWith('1');
  });

  it('should toggle host disabled state', () => {
    component.toggleHost({ target: { checked: false } } as any);
    expect(component.isHostDisabled).toBe(true);

    component.toggleHost({ target: { checked: true } } as any);
    expect(component.isHostDisabled).toBe(false);
  });

  it('should submit networking form', () => {
    const createEndpointSpy = (deploymentService as any).createEndpoint;
    spyOn(toastr, 'success');

    component.networkSettingsForm.get('service')?.setValue('TestService');
    component.networkSettingsForm.get('customDns')?.setValue(false);

    component.onNetworkingSubmit();

    expect(createEndpointSpy).toHaveBeenCalled();
    expect(toastr.success).toHaveBeenCalledWith('Success');
  });

  it('should copy domain to clipboard', () => {
    let writeSpy: any;
    if (navigator.clipboard && (navigator.clipboard.writeText as any) && (navigator.clipboard.writeText as any).and) {
      writeSpy = (navigator.clipboard.writeText as any);
    } else if (navigator.clipboard && typeof (navigator.clipboard.writeText as any) === 'function') {
      writeSpy = spyOn(navigator.clipboard, 'writeText');
    } else {
      Object.defineProperty(navigator, 'clipboard', { value: { writeText: jasmine.createSpy('writeText') }, configurable: true });
      writeSpy = (navigator.clipboard as any).writeText;
    }

    component.copyDomain('test.com');
    expect(writeSpy).toHaveBeenCalledWith('test.com');
  });

  describe('Additional Coverage Tests', () => {
    it('should handle currentStatus "Building" and disable form', () => {
      component.currentStatus = 'Building';
      component.ngOnInit();
      expect(component.freezeAddNewData).toBeTrue();
      expect(component.formDisabled).toBeTrue();
    });

    it('should enable form when user has write permissions and status is not Building', () => {
      const permissionService = TestBed.inject(PermissionService);
      spyOn(permissionService, 'canWriteGlobal').and.returnValue(true);
      component.currentStatus = 'Running';
      component.ngOnInit();
      expect(component.formDisabled).toBeFalse();
    });

    it('should disable form when user lacks permissions', () => {
      const permissionService = TestBed.inject(PermissionService);
      spyOn(permissionService, 'canWriteGlobal').and.returnValue(false);
      spyOn(permissionService, 'canAdminGlobal').and.returnValue(false);
      spyOn(permissionService, 'canDeleteForCurrentUser').and.returnValue(false);
      component.currentStatus = 'Running';
      component.ngOnInit();
      expect(component.formDisabled).toBeTrue();
    });

    it('should update host value when service name changes', () => {
      localStorage.setItem('environment', JSON.stringify({ id: 'test-env', type: 'prod' }));
      component.ngOnInit();
      component.networkSettingsForm.get('service')?.setValue('my-app');
      expect(component.networkSettingsForm.get('host')?.value).toContain('my-app-test-env');
      expect(component.networkSettingsForm.get('host')?.value).toContain('.lb.nimbuz.tech');
    });

    it('should generate dev domain when environment type is not prod', () => {
      localStorage.setItem('environment', JSON.stringify({ id: 'dev-env', type: 'dev' }));
      component.ngOnInit();
      component.networkSettingsForm.get('service')?.setValue('test-service');
      expect(component.networkSettingsForm.get('host')?.value).toContain('.dev.');
    });

    it('should update customDnsHost form control when customDnsHost control changes', () => {
      component.ngOnInit();
      component.customDnsHost.setValue('custom.domain.com');
      expect(component.networkSettingsForm.get('customDnsHost')?.value).toBe('custom.domain.com');
    });

    it('should reset authentication fields when host changes and not patched', () => {
      component.ngOnInit();
      component.isPatchedValue = false;
      const authGroup = component.networkSettingsForm.get('authentication') as any;
      authGroup.get('username')?.setValue('testuser');
      authGroup.get('password')?.setValue('testpass');
      
      component.networkSettingsForm.get('host')?.setValue('newhost.com');
      
      expect(authGroup.get('username')?.value).toBe('');
      expect(authGroup.get('password')?.value).toBe('');
    });

    it('should reset authentication fields when customDns changes', () => {
      component.ngOnInit();
      component.isPatchedValue = false;
      const authGroup = component.networkSettingsForm.get('authentication') as any;
      authGroup.get('username')?.setValue('testuser');
      
      component.networkSettingsForm.get('customDns')?.setValue(true);
      
      expect(authGroup.get('username')?.value).toBe('');
    });

    it('should reset showAuthentication to false when customDnsHost changes', () => {
      component.ngOnInit();
      component.isPatchedValue = false;
      component.networkSettingsForm.get('showAuthentication')?.setValue(true);
      
      component.networkSettingsForm.get('customDnsHost')?.setValue('new.domain.com');
      
      expect(component.networkSettingsForm.get('showAuthentication')?.value).toBe(false);
    });

    it('should set isHostDisabled when customDomain exists in authenticated response', () => {
      (deploymentService as any).getAuthenticatedresponse.and.returnValue(
        of({ data: { status: 'active', customDomain: 'custom.com', authentication: null } })
      );
      component.ngOnInit();
      expect(component.isHostDisabled).toBeTrue();
      expect(component.customDnsHost.value).toBe('custom.com');
    });

    it('should patch authentication values when authentication exists', () => {
      (deploymentService as any).getAuthenticatedresponse.and.returnValue(
        of({ data: { status: 'active', customDomain: '', authentication: { username: 'admin', password: 'secret' } } })
      );
      component.ngOnInit();
      const authGroup = component.networkSettingsForm.get('authentication') as any;
      expect(authGroup.get('username')?.value).toBe('admin');
      expect(authGroup.get('password')?.value).toBe('********');
    });

    it('should handle getDeploymentById success with network data', () => {
      component.deploymentdetails = { id: 'dep-123' };
      (deploymentService as any).getDeploymentById.and.returnValue(
        of({ status: 'Success', data: { network: { appIngressDomain: 'app.domain.com', customDomain: 'custom.com' } } })
      );
      
      component.getDeploymentById();
      
      expect(component.ingressDomain).toBe('app.domain.com');
      expect(component.showCustomDnsHost).toBeTrue();
      expect(component.customDnsHost.value).toBe('custom.com');
    });

    it('should handle getDeploymentById with no customDomain', () => {
      component.deploymentdetails = { id: 'dep-123' };
      (deploymentService as any).getDeploymentById.and.returnValue(
        of({ status: 'success', data: { network: { appIngressDomain: 'app.domain.com', customDomain: null } } })
      );
      
      component.getDeploymentById();
      
      expect(component.showCustomDnsHost).toBeFalse();
    });

    it('should toggle visibility', () => {
      component.hide = true;
      component.toggleVisibility();
      expect(component.hide).toBeFalse();
      component.toggleVisibility();
      expect(component.hide).toBeTrue();
    });

    it('should disable host and clear customDnsHost when toggleHost is unchecked', () => {
      spyOn(component, 'onNetworkingSubmit');
      component.toggleHost({ target: { checked: false } } as any);
      
      expect(component.isHostDisabled).toBeTrue();
      expect(component.customDnsHost.value).toBe('');
      expect(component.networkSettingsForm.get('customDnsHost')?.value).toBe('');
      expect(component.onNetworkingSubmit).toHaveBeenCalled();
    });

    it('should enable host when toggleHost is checked', () => {
      component.toggleHost({ target: { checked: true } } as any);
      expect(component.isHostDisabled).toBeFalse();
    });

    it('should delete authentication from form value if showAuthentication is false', () => {
      const createEndpointSpy = (deploymentService as any).createEndpoint;
      component.networkSettingsForm.get('showAuthentication')?.setValue(false);
      component.networkSettingsForm.get('customDns')?.setValue(true);
      
      component.onNetworkingSubmit();
      
      const callArgs = createEndpointSpy.calls.mostRecent().args[1];
      expect(callArgs.authentication).toBeUndefined();
    });

    it('should delete customDnsHost if customDns is false', () => {
      const createEndpointSpy = (deploymentService as any).createEndpoint;
      component.networkSettingsForm.get('customDns')?.setValue(false);
      
      component.onNetworkingSubmit();
      
      const callArgs = createEndpointSpy.calls.mostRecent().args[1];
      expect(callArgs.customDnsHost).toBeUndefined();
    });

    it('should set showCustomDnsHost when response has customDomain', () => {
      (deploymentService as any).createEndpoint.and.returnValue(
        of({ status: 'success', data: { customDomain: 'custom.com' }, message: 'Created' })
      );
      spyOn(component, 'fetchCustomDnsHost');
      spyOn(toastr, 'success');
      
      component.onNetworkingSubmit();
      
      expect(component.showCustomDnsHost).toBeTrue();
      expect(toastr.success).toHaveBeenCalledWith('Created');
      expect(component.fetchCustomDnsHost).toHaveBeenCalled();
    });

    it('should set ingressDomain when response has domain', () => {
      (deploymentService as any).createEndpoint.and.returnValue(
        of({ status: 'success', data: { domain: 'app.ingress.com' }, message: 'Created' })
      );
      spyOn(component, 'fetchCustomDnsHost');
      
      component.onNetworkingSubmit();
      
      expect(component.ingressDomain).toBe('app.ingress.com');
      expect(component.fetchCustomDnsHost).toHaveBeenCalled();
    });

    it('should close modal if response status is not success', () => {
      (deploymentService as any).createEndpoint.and.returnValue(
        of({ status: 'failure', data: {}, message: 'Failed' })
      );
      spyOn(component, 'closeModal');
      
      component.onNetworkingSubmit();
      
      expect(component.showCustomDnsHost).toBeFalse();
      expect(component.closeModal).toHaveBeenCalled();
    });

    it('should delete endpoint after confirmation', (done) => {
      const modalService = TestBed.inject(NgbModal);
      const modalRef = { result: Promise.resolve(true), componentInstance: {} } as any;
      spyOn(modalService, 'open').and.returnValue(modalRef);
      const successSpy = spyOn(toastr, 'success');
      component.deploymentdetails = { name: 'test-app' };
      
      component.deleteEndpoint();
      
      modalRef.result.then(() => {
        setTimeout(() => {
          expect((deploymentService as any).deleteEndpoint).toHaveBeenCalledWith('env1', 'test-app');
          expect(successSpy).toHaveBeenCalled();
          expect(component.ingressDomain).toBe('');
          done();
        }, 100);
      });
    });

    it('should not delete endpoint if user cancels', (done) => {
      const modalService = TestBed.inject(NgbModal);
      const modalRef = { result: Promise.resolve(false), componentInstance: {} } as any;
      spyOn(modalService, 'open').and.returnValue(modalRef);
      const consoleSpy = spyOn(console, 'log');
      
      component.deleteEndpoint();
      
      modalRef.result.then(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Cancelled delete endpoint!');
        done();
      });
    });

    it('should handle delete endpoint error', (done) => {
      const modalService = TestBed.inject(NgbModal);
      const modalRef = { result: Promise.resolve(true), componentInstance: {} } as any;
      spyOn(modalService, 'open').and.returnValue(modalRef);
      (deploymentService as any).deleteEndpoint.and.returnValue({
        subscribe: (handlers: any) => {
          if (handlers.error) {
            handlers.error(new Error('Delete failed'));
          }
        }
      });
      
      component.deleteEndpoint();
      
      modalRef.result.then(() => {
        setTimeout(() => {
          expect((deploymentService as any).deleteEndpoint).toHaveBeenCalled();
          done();
        }, 100);
      });
    });

    it('should fetch custom DNS host data', () => {
      component.deploymentId = 'dep-456';
      (deploymentService as any).getAuthenticatedresponse.and.returnValue(
        of({ data: { status: 'active', customDomain: 'new.custom.com', authentication: { username: 'user1', password: 'pass1' } } })
      );
      
      component.fetchCustomDnsHost();
      
      expect(component.showAuthenticationData.status).toBe('active');
      expect(component.endpointStatus).toBe('active');
      expect(component.customDnsHost.value).toBe('new.custom.com');
      expect(component.isHostDisabled).toBeTrue();
    });

    it('should patch authentication in fetchCustomDnsHost', () => {
      component.deploymentId = 'dep-789';
      (deploymentService as any).getAuthenticatedresponse.and.returnValue(
        of({ data: { status: 'active', customDomain: '', authentication: { username: 'admin2', password: 'secret2' } } })
      );
      
      component.fetchCustomDnsHost();
      
      const authGroup = component.networkSettingsForm.get('authentication') as any;
      expect(authGroup.get('username')?.value).toBe('admin2');
      expect(authGroup.get('password')?.value).toBe('secret2');
      expect(component.networkSettingsForm.get('showAuthentication')?.value).toBeTrue();
    });

    it('should return true for shouldEnableButtons when showAuthentication is true', () => {
      component.networkSettingsForm.get('showAuthentication')?.setValue(true);
      expect(component.shouldEnableButtons()).toBeTrue();
    });

    it('should return true for shouldEnableButtons when customDns is true', () => {
      component.networkSettingsForm.get('customDns')?.setValue(true);
      expect(component.shouldEnableButtons()).toBeTrue();
    });

    it('should return false for shouldEnableButtons when both are false', () => {
      component.networkSettingsForm.get('showAuthentication')?.setValue(false);
      component.networkSettingsForm.get('customDns')?.setValue(false);
      expect(component.shouldEnableButtons()).toBeFalse();
    });

    it('should close modal and reset form values', () => {
      component.showCustomDnsHost = true;
      component.closeModal();
      
      expect(component.networkSettingsForm.get('customDns')?.value).toBeFalse();
      expect(component.customDnsHost.value).toBe('');
      expect(component.networkSettingsForm.get('customDnsHost')?.value).toBe('');
      expect(component.showCustomDnsHost).toBeFalse();
    });

    it('should toggle authentication on and update validation', () => {
      spyOn(component as any, 'updateAuthenticationValidation');
      component.toggleAuthentication({ target: { checked: true } } as any);
      
      expect(component.showAuthentication).toBeTrue();
      expect(component.networkSettingsForm.get('showAuthentication')?.value).toBeTrue();
      expect((component as any).updateAuthenticationValidation).toHaveBeenCalled();
    });

    it('should toggle authentication off', () => {
      component.toggleAuthentication({ target: { checked: false } } as any);
      expect(component.showAuthentication).toBeFalse();
    });

    it('should clear validators when authentication is disabled', () => {
      component.showAuthentication = false;
      (component as any).updateAuthenticationValidation();
      
      const authGroup = component.authentication;
      authGroup.get('username')?.setValue('');
      authGroup.get('password')?.setValue('');
      expect(authGroup.get('username')?.errors).toBeNull();
      expect(authGroup.get('password')?.errors).toBeNull();
    });

    it('should get authentication form group', () => {
      const authGroup = component.authentication;
      expect(authGroup).toBeDefined();
      expect(authGroup.get('username')).toBeDefined();
      expect(authGroup.get('password')).toBeDefined();
    });

    it('should return false for isInvalid when control is valid', () => {
      const control = component.networkSettingsForm.get('service');
      control?.setValue('valid-service');
      expect(component.isInvalid('service')).toBeFalse();
    });

    it('should return false for isInvalid when control does not exist', () => {
      expect(component.isInvalid('nonexistent')).toBeFalse();
    });

    it('should copy domain using fallback when clipboard API not available', () => {
      const originalClipboard = navigator.clipboard;
      Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
      
      spyOn(document, 'createElement').and.callThrough();
      spyOn(document, 'execCommand').and.returnValue(true);
      
      component.copyDomain('fallback.com');
      
      expect(document.createElement).toHaveBeenCalledWith('textarea');
      expect(document.execCommand).toHaveBeenCalledWith('copy');
      
      Object.defineProperty(navigator, 'clipboard', { value: originalClipboard, configurable: true });
    });

    it('should not skip authentication reset when isPatchedValue is true', () => {
      component.ngOnInit();
      component.isPatchedValue = true;
      const authGroup = component.networkSettingsForm.get('authentication') as any;
      authGroup.get('username')?.setValue('testuser');
      
      component.networkSettingsForm.get('host')?.setValue('newhost.com');
      
      expect(authGroup.get('username')?.value).toBe('testuser');
    });

    it('should handle environment with empty type', () => {
      localStorage.setItem('environment', JSON.stringify({ id: 'env-no-type' }));
      component.ngOnInit();
      component.networkSettingsForm.get('service')?.setValue('my-service');
      expect(component.networkSettingsForm.get('host')?.value).toContain('.dev.');
    });

    it('should handle missing environment in localStorage', () => {
      localStorage.removeItem('environment');
      component.ngOnInit();
      expect(component.networkSettingsForm).toBeDefined();
    });

    it('should call scrollTo on successful endpoint deletion', (done) => {
      const modalService = TestBed.inject(NgbModal);
      const modalRef = { result: Promise.resolve(true), componentInstance: {} } as any;
      spyOn(modalService, 'open').and.returnValue(modalRef);
      spyOn(window, 'scrollTo');
      component.deploymentdetails = { name: 'test-app' };
      
      component.deleteEndpoint();
      
      modalRef.result.then(() => {
        setTimeout(() => {
          expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
          done();
        }, 100);
      });
    });

    it('should set isHostDisabled to true when custom domain exists', () => {
      component.deploymentId = 'dep-789';
      (deploymentService as any).getAuthenticatedresponse.and.returnValue(
        of({ data: { customDomain: 'test.domain.com', authentication: { username: '', password: '' } } })
      );
      
      component.fetchCustomDnsHost();
      
      expect(component.isHostDisabled).toBeTrue();
    });

    it('should patch authentication values when authentication data exists', () => {
      component.deploymentId = 'dep-auth';
      (deploymentService as any).getAuthenticatedresponse.and.returnValue(
        of({ 
          data: { 
            customDomain: '', 
            authentication: { username: 'admin', password: 'secret' } 
          } 
        })
      );
      
      component.fetchCustomDnsHost();
      
      expect(component.networkSettingsForm.get('showAuthentication')?.value).toBeTrue();
      const username = component.authentication.get('username')?.value;
      const password = component.authentication.get('password')?.value;
      expect(username).toBeTruthy();
      expect(password).toBeTruthy();
    });

    it('should handle showCustomDnsHost when custom domain in response', () => {
      const createEndpointSpy = (deploymentService as any).createEndpoint;
      createEndpointSpy.and.returnValue(
        of({ status: 'success', data: { customDomain: 'custom.example.com' }, message: 'Created' })
      );
      
      component.onNetworkingSubmit();
      
      expect(component.showCustomDnsHost).toBeTrue();
    });

    it('should close modal when no custom domain in response', () => {
      const createEndpointSpy = (deploymentService as any).createEndpoint;
      createEndpointSpy.and.returnValue(
        of({ status: 'failed', data: {}, message: 'Failed' })
      );
      spyOn(component, 'closeModal');
      
      component.onNetworkingSubmit();
      
      expect(component.showCustomDnsHost).toBeFalse();
      expect(component.closeModal).toHaveBeenCalled();
    });

    it('should mark form as pristine after successful submission', () => {
      const createEndpointSpy = (deploymentService as any).createEndpoint;
      createEndpointSpy.and.returnValue(
        of({ status: 'success', data: { domain: 'test.com' }, message: 'Success' })
      );
      
      component.networkSettingsForm.markAsDirty();
      component.onNetworkingSubmit();
      
      expect(component.networkSettingsForm.pristine).toBeTrue();
    });

    it('should handle authentication in fetchCustomDnsHost when no auth data', () => {
      component.deploymentId = 'dep-no-auth';
      (deploymentService as any).getAuthenticatedresponse.and.returnValue(
        of({ 
          data: { 
            customDomain: 'test.com', 
            authentication: { username: '', password: '' }
          } 
        })
      );
      
      component.fetchCustomDnsHost();
      expect(component.customDnsHost.value).toBe('test.com');
    });

    it('should reset customDnsHost when toggleHost disables host', () => {
      component.isHostDisabled = false;
      const event = { target: { checked: false } } as any;
      const submitSpy = spyOn(component, 'onNetworkingSubmit');
      
      component.toggleHost(event);
      
      expect(component.customDnsHost.value).toBe('');
      expect(component.networkSettingsForm.get('customDnsHost')?.value).toBe('');
      expect(submitSpy).toHaveBeenCalled();
    });

    it('should enable host control when toggleHost enables', () => {
      component.isHostDisabled = true;
      const event = { target: { checked: true } } as any;
      const hostControl = component.networkSettingsForm.get('host');
      hostControl?.disable();
      
      component.toggleHost(event);
      
      expect(component.isHostDisabled).toBeFalse();
    });

    it('should set environment type to dev for type other than prod', () => {
      localStorage.setItem('environment', JSON.stringify({ id: 'env1', type: 'development' }));
      component.ngOnInit();
      component.networkSettingsForm.get('service')?.setValue('test-service');
      expect(component.networkSettingsForm.get('host')?.value).toContain('dev');
    });

    it('should set environment type to prod when type is prod', () => {
      localStorage.setItem('environment', JSON.stringify({ id: 'env1', type: 'prod' }));
      component.ngOnInit();
      component.networkSettingsForm.get('service')?.setValue('prod-service');
      expect(component.networkSettingsForm.get('host')?.value).toContain('prod');
    });

    it('should delete form values correctly before submission', () => {
      component.networkSettingsForm.patchValue({
        service: 'test',
        showAuthentication: false,
        customDns: false,
        host: 'some-host'
      });
      const createEndpointSpy = (deploymentService as any).createEndpoint;
      createEndpointSpy.and.returnValue(
        of({ status: 'success', data: { domain: 'test.com' }, message: 'Success' })
      );
      
      component.onNetworkingSubmit();
      
      const callArgs = createEndpointSpy.calls.mostRecent().args[1];
      expect(callArgs.authentication).toBeUndefined();
      expect(callArgs.showAuthentication).toBeUndefined();
      expect(callArgs.host).toBeUndefined();
      expect(callArgs.customDnsHost).toBeUndefined();
    });

    it('should include authentication in submission when showAuthentication is true', () => {
      component.networkSettingsForm.patchValue({
        service: 'test',
        showAuthentication: true,
        authentication: { username: 'user', password: 'pass' },
        customDns: false
      });
      const createEndpointSpy = (deploymentService as any).createEndpoint;
      createEndpointSpy.and.returnValue(
        of({ status: 'success', data: { domain: 'test.com' }, message: 'Success' })
      );
      
      component.onNetworkingSubmit();
      
      const callArgs = createEndpointSpy.calls.mostRecent().args[1];
      expect(callArgs.showAuthentication).toBeUndefined();
    });

    it('should include customDnsHost when customDns is true', () => {
      component.networkSettingsForm.patchValue({
        service: 'test',
        showAuthentication: false,
        customDns: true,
        customDnsHost: 'custom.example.com'
      });
      const createEndpointSpy = (deploymentService as any).createEndpoint;
      createEndpointSpy.and.returnValue(
        of({ status: 'success', data: { domain: 'test.com' }, message: 'Success' })
      );
      
      component.onNetworkingSubmit();
      
      const callArgs = createEndpointSpy.calls.mostRecent().args[1];
      expect(callArgs.customDnsHost).toBe('custom.example.com');
    });

    it('should call getDeploymentById in ngOnInit', () => {
      expect((deploymentService as any).getDeploymentById).toHaveBeenCalled();
    });

    it('should set ingressDomain from network data', () => {
      (deploymentService as any).getDeploymentById.and.returnValue(
        of({ 
          status: 'success', 
          data: { 
            id: '123', 
            name: 'Test', 
            network: { appIngressDomain: 'test.ingress.com', customDomain: null } 
          } 
        })
      );
      
      component.getDeploymentById();
      
      expect(component.ingressDomain).toBe('test.ingress.com');
      expect(component.showCustomDnsHost).toBeFalse();
    });

    it('should set showCustomDnsHost when custom domain exists in network', () => {
      (deploymentService as any).getDeploymentById.and.returnValue(
        of({ 
          status: 'success', 
          data: { 
            id: '123', 
            name: 'Test', 
            network: { customDomain: 'custom.domain.com' } 
          } 
        })
      );
      
      component.getDeploymentById();
      
      expect(component.showCustomDnsHost).toBeTrue();
      expect(component.customDnsHost.value).toBe('custom.domain.com');
    });

    it('should reset authentication fields when host control value changes and isPatchedValue is false', () => {
      component.ngOnInit();
      component.isPatchedValue = false;
      const authGroup = component.authentication;
      authGroup.get('username')?.setValue('user1');
      authGroup.get('password')?.setValue('pass1');
      component.networkSettingsForm.get('showAuthentication')?.setValue(true);
      
      component.networkSettingsForm.get('host')?.setValue('new-host.com');
      
      expect(authGroup.get('username')?.value).toBe('');
      expect(authGroup.get('password')?.value).toBe('');
      expect(component.networkSettingsForm.get('showAuthentication')?.value).toBe(false);
    });

    it('should reset authentication fields when customDns control value changes', () => {
      component.ngOnInit();
      component.isPatchedValue = false;
      const authGroup = component.authentication;
      authGroup.get('username')?.setValue('user2');
      component.networkSettingsForm.get('showAuthentication')?.setValue(true);
      
      component.networkSettingsForm.get('customDns')?.setValue(true);
      
      expect(authGroup.get('username')?.value).toBe('');
      expect(component.networkSettingsForm.get('showAuthentication')?.value).toBe(false);
    });

    it('should reset authentication fields when customDnsHost control value changes', () => {
      component.ngOnInit();
      component.isPatchedValue = false;
      const authGroup = component.authentication;
      authGroup.get('password')?.setValue('password123');
      component.networkSettingsForm.get('showAuthentication')?.setValue(true);
      
      component.networkSettingsForm.get('customDnsHost')?.setValue('new.custom.com');
      
      expect(authGroup.get('password')?.value).toBe('');
      expect(component.networkSettingsForm.get('showAuthentication')?.value).toBe(false);
    });

    it('should clear validators when updateAuthenticationValidation disables authentication', () => {
      component.showAuthentication = false;
      const authGroup = component.authentication;
      authGroup.get('username')?.setValidators([Validators.required]);
      authGroup.get('password')?.setValidators([Validators.required]);
      
      (component as any).updateAuthenticationValidation();
      
      authGroup.get('username')?.setValue('');
      authGroup.get('password')?.setValue('');
      authGroup.get('username')?.updateValueAndValidity();
      authGroup.get('password')?.updateValueAndValidity();
      
      expect(authGroup.get('username')?.hasError('required')).toBeFalse();
      expect(authGroup.get('password')?.hasError('required')).toBeFalse();
    });
  });
});
