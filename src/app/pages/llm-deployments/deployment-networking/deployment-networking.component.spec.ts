import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TOAST_CONFIG, ToastrService } from 'ngx-toastr';
import { toastConfigMock, createToastrSpy, activatedRouteMock } from '../../../../test-helpers/testing-mocks';
import { ActivatedRoute } from '@angular/router';
import { Subject, of } from 'rxjs';

import { DeploymentNetworkingComponent } from './deployment-networking.component';
import { LLMDeploymentsService } from '../llm-deployment.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

describe('DeploymentNetworkingComponent', () => {
  let component: DeploymentNetworkingComponent;
  let fixture: ComponentFixture<DeploymentNetworkingComponent>;
  let queryParams$: Subject<any>;

  beforeEach(async () => {
    queryParams$ = new Subject<any>();

    const deploymentSpy = jasmine.createSpyObj('LLMDeploymentsService', ['getDeploymentById']);
    deploymentSpy.getDeploymentById.and.returnValue(of({ status: 'success', data: { name: 'svc', network: { appIngressDomain: 'ing.example' } } }));

    const modalSpy = jasmine.createSpyObj('NgbModal', ['open']);
    modalSpy.open.and.returnValue({ componentInstance: {}, result: Promise.resolve(true) } as any);

    const activatedRoute = {
      ...activatedRouteMock,
      queryParams: queryParams$.asObservable()
    } as unknown as ActivatedRoute;
    TestBed.overrideComponent(DeploymentNetworkingComponent as any, {
      set: { providers: [{ provide: LLMDeploymentsService, useValue: deploymentSpy }] }
    });

    await TestBed.configureTestingModule({
      imports: [DeploymentNetworkingComponent, HttpClientTestingModule],
      providers: [
        { provide: TOAST_CONFIG, useValue: toastConfigMock },
        { provide: ToastrService, useValue: createToastrSpy() },
        { provide: ActivatedRoute, useValue: activatedRoute },
        { provide: NgbModal, useValue: modalSpy }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    localStorage.setItem('environment', JSON.stringify({ id: 'env-test' }));

    fixture = TestBed.createComponent(DeploymentNetworkingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set form service and ingressDomain when queryParams emit', (done) => {
    queryParams$.next({ id: 'd1' });

    setTimeout(() => {
      expect(component.networkSettingsForm.get('service')?.value).toBe('svc');
      expect(component.ingressDomain).toBe('ing.example');
      done();
    }, 0);
  });

  it('should patch host when service value changes using environment type', (done) => {
    localStorage.setItem('environment', JSON.stringify({ id: 'env1', type: 'prod' }));
    fixture = TestBed.createComponent(DeploymentNetworkingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    component.networkSettingsForm.get('service')?.setValue('myservice');

    setTimeout(() => {
      const host = component.networkSettingsForm.get('host')?.value as string;
      expect(host).toContain('env1');
      expect(host).toContain('ap-south-1a');
      done();
    }, 0);
  });

  it('deleteEndpoint should open confirmation modal', () => {
    const modal = TestBed.inject(NgbModal) as any;
    component.deleteEndpoint();
    expect(modal.open).toHaveBeenCalled();
  });

  it('closeModal should emit closeModalEvent', () => {
    let emitted = false;
    component.closeModalEvent.subscribe(() => emitted = true);
    component.closeModal();
    expect(emitted).toBeTrue();
  });

  it('copyDomain should use navigator.clipboard when available', () => {
    const writeSpy = jasmine.createSpy('writeText');
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: writeSpy }, configurable: true });
    component.copyDomain('abc');
    expect(writeSpy).toHaveBeenCalledWith('abc');
  });
});
