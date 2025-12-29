import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DeploymentNetworkingComponent } from './deployment-networking.component';
import { DeploymentsService } from '../deployment.service';
import { ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { of } from 'rxjs';
import { PermissionService } from '../../../shared/services/permission.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

// Mock services
class MockDeploymentsService {
  getDeploymentById = jasmine.createSpy('getDeploymentById').and.callFake((id: string) =>
    of({ status: 'success', data: { id, name: 'Test App', network: {} } })
  );
  getAuthenticatedresponse = jasmine.createSpy('getAuthenticatedresponse').and.returnValue(of({ data: { authentication: { username: 'user', password: 'pass' } } }));
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
    // component init populates service name from the deployment mock
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
    // `createEndpoint` is already a jasmine spy on the mock service; use that spy directly
    const createEndpointSpy = (deploymentService as any).createEndpoint;
    spyOn(toastr, 'success');

    component.networkSettingsForm.get('service')?.setValue('TestService');
    component.networkSettingsForm.get('customDns')?.setValue(false);

    component.onNetworkingSubmit();

    expect(createEndpointSpy).toHaveBeenCalled();
    expect(toastr.success).toHaveBeenCalledWith('Success');
  });

  it('should copy domain to clipboard', () => {
    const spy = spyOn(navigator.clipboard, 'writeText');
    component.copyDomain('test.com');
    expect(spy).toHaveBeenCalledWith('test.com');
  });
});
