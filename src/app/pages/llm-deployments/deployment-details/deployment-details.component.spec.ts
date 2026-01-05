import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TOAST_CONFIG, ToastrService } from 'ngx-toastr';
import { toastConfigMock, createToastrSpy, activatedRouteMock } from '../../../../test-helpers/testing-mocks';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { DeploymentDetailsComponent } from './deployment-details.component';
import { LLMDeploymentsService } from '../llm-deployment.service';
import { SharedService } from '../../../shared/services/shared.service';
import { LayoutActionService } from '../../../shared/services/layout-action.service';
import { ConfirmationModalComponent } from '../../../shared/components/modal/confirmation-modal/confirmation-modal.component';
import { Subject, of } from 'rxjs';

describe('DeploymentDetailsComponent', () => {
  let component: DeploymentDetailsComponent;
  let fixture: ComponentFixture<DeploymentDetailsComponent>;
  let queryParams$: Subject<any>;
  let fragment$: Subject<string | null>;

  beforeEach(async () => {
    queryParams$ = new Subject<any>();
    fragment$ = new Subject<string | null>();

    const deploymentSpy = jasmine.createSpyObj('LLMDeploymentsService', ['getDeploymentById']);
    deploymentSpy.getDeploymentById.and.returnValues(
      of({ status: 'success', data: { name: 'app1', status: 'Running' } }),
      of({ status: 'success', data: { release: 'r1' } })
    );

    const sharedServiceSpy = jasmine.createSpyObj('SharedService', ['setlastReleaseData', 'getlastReleaseData']);
    sharedServiceSpy.getlastReleaseData.and.returnValue({});
    (sharedServiceSpy as any).releaseStatus$ = of([]);

    const layoutActionSpy = jasmine.createSpyObj('LayoutActionService', ['setExtraTitle', 'clearExtraTitle']);
    (layoutActionSpy as any).actionClick$ = new Subject<void>();

    const modalSpy = jasmine.createSpyObj('NgbModal', ['open']);
    modalSpy.open.and.returnValue({ componentInstance: {}, result: Promise.resolve(true) } as any);

    const routerSpy = { navigate: jasmine.createSpy('navigate'), url: '/llm/deployment-details?x=1' };

    const activatedRoute = {
      ...activatedRouteMock,
      queryParams: queryParams$.asObservable(),
      fragment: fragment$.asObservable()
    } as unknown as ActivatedRoute;
    TestBed.overrideComponent(DeploymentDetailsComponent as any, {
      set: {
        providers: [{ provide: LLMDeploymentsService, useValue: deploymentSpy }]
      }
    });

    await TestBed.configureTestingModule({
      imports: [ DeploymentDetailsComponent, HttpClientTestingModule ],
      providers: [
        { provide: TOAST_CONFIG, useValue: toastConfigMock },
        { provide: ToastrService, useValue: createToastrSpy() },
        { provide: ActivatedRoute, useValue: activatedRoute },
        { provide: LLMDeploymentsService, useValue: deploymentSpy },
        { provide: SharedService, useValue: sharedServiceSpy },
        { provide: LayoutActionService, useValue: layoutActionSpy },
        { provide: NgbModal, useValue: modalSpy },
        { provide: Router, useValue: routerSpy },
        { provide: Location, useValue: { replaceState: jasmine.createSpy('replaceState') } }
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DeploymentDetailsComponent);
    component = fixture.componentInstance;
    localStorage.setItem('environment', JSON.stringify({ id: 'env1' }));
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load deployment on queryParams and set appName and layout title', (done) => {
    const deploymentService = TestBed.inject(LLMDeploymentsService);
    const layout = TestBed.inject(LayoutActionService) as any;

    queryParams$.next({ id: 'd1', tabIndex: '2' });

    setTimeout(() => {
      expect(component.appName).toBe('app1');
      expect(layout.setExtraTitle).toHaveBeenCalledWith('app1 (Running)');
      done();
    }, 0);
  });

  it('onTabChange should update selectedTabIndex and replace state', () => {
    const router = TestBed.inject(Router) as any;
    (component as any).activateRoute.snapshot.queryParams = { a: 'b', tabIndex: '3' };
    (router as any).url = '/llm/deployment-details?tabIndex=3&a=b';
    const location = TestBed.inject(Location) as any;

    component.onTabChange(1);

    expect(component.selectedTabIndex).toBe(1);
    expect(location.replaceState).toHaveBeenCalled();
  });

  it('onCloseClicked should emit closeModalEvent', () => {
    let emitted = false;
    component.closeModalEvent.subscribe(() => emitted = true);
    component.onCloseClicked();
    expect(emitted).toBeTrue();
  });

  it('goToNextTab should increment selectedTabIndex up to limit', () => {
    component.selectedTabIndex = 0;
    component.goToNextTab();
    expect(component.selectedTabIndex).toBe(1);
    component.selectedTabIndex = 4;
    component.goToNextTab();
    expect(component.selectedTabIndex).toBe(4);
  });

  it('goBack should navigate to llm list', () => {
    const router = TestBed.inject(Router) as any;
    component.goBack();
    expect(router.navigate).toHaveBeenCalledWith(['llm/list']);
  });

  it('ngOnDestroy should clear extra title', () => {
    const layout = TestBed.inject(LayoutActionService) as any;
    component.ngOnDestroy();
    expect(layout.clearExtraTitle).toHaveBeenCalled();
  });

  describe('ngOnInit edge cases', () => {
    it('should handle queryParams without id', (done) => {
      const deploymentService = TestBed.inject(LLMDeploymentsService);
      deploymentService.getDeploymentById = jasmine.createSpy().and.returnValue(of({}));
      
      queryParams$.next({ someOtherParam: 'value' });
      
      setTimeout(() => {
        expect(deploymentService.getDeploymentById).not.toHaveBeenCalled();
        done();
      }, 0);
    });

    it('should handle tabIndex from queryParams', (done) => {
      queryParams$.next({ id: 'd2', tabIndex: '3' });
      
      setTimeout(() => {
        expect(component.selectedTabIndex).toBe(3);
        done();
      }, 100);
    });

    it('should default tabIndex to 0 when not provided', (done) => {
      queryParams$.next({ id: 'd3' });
      
      setTimeout(() => {
        expect(component.selectedTabIndex).toBe(0);
        done();
      }, 100);
    });

    it('should handle failed status in getDeploymentById', (done) => {
      const deploymentService = TestBed.inject(LLMDeploymentsService);
      deploymentService.getDeploymentById = jasmine.createSpy().and.returnValue(
        of({ status: 'Failed', data: { name: 'app2', status: 'Stopped' } })
      );
      
      const sharedService = TestBed.inject(SharedService) as any;
      
      queryParams$.next({ id: 'd4' });
      
      setTimeout(() => {
        expect(deploymentService.getDeploymentById).toHaveBeenCalledTimes(1);
        expect(sharedService.setlastReleaseData).not.toHaveBeenCalled();
        done();
      }, 100);
    });

    it('should set lastReleaseData from sharedService', (done) => {
      const sharedService = TestBed.inject(SharedService) as any;
      const mockReleaseData = { release: 'v1.0' };
      sharedService.getlastReleaseData.and.returnValue(mockReleaseData);
      
      queryParams$.next({ id: 'd5' });
      
      setTimeout(() => {
        expect(sharedService.setlastReleaseData).toHaveBeenCalled();
        expect(component.lastReleaseData).toEqual(mockReleaseData);
        done();
      }, 100);
    });

    it('should handle null from getlastReleaseData', (done) => {
      const sharedService = TestBed.inject(SharedService) as any;
      sharedService.getlastReleaseData.and.returnValue(null);
      
      queryParams$.next({ id: 'd6' });
      
      setTimeout(() => {
        expect(component.lastReleaseData).toEqual([]);
        done();
      }, 100);
    });
  });

  describe('fragment navigation', () => {
    it('should navigate to tab 7 when fragment is network-section', (done) => {
      spyOn(component, 'onTabChange');
      
      fragment$.next('network-section');
      
      setTimeout(() => {
        expect(component.onTabChange).toHaveBeenCalledWith(7);
        done();
      }, 0);
    });

    it('should not navigate when fragment is null', (done) => {
      spyOn(component, 'onTabChange');
      
      fragment$.next(null);
      
      setTimeout(() => {
        expect(component.onTabChange).not.toHaveBeenCalled();
        done();
      }, 0);
    });

    it('should not navigate when fragment is not network-section', (done) => {
      spyOn(component, 'onTabChange');
      
      fragment$.next('other-section');
      
      setTimeout(() => {
        expect(component.onTabChange).not.toHaveBeenCalled();
        done();
      }, 0);
    });
  });

  describe('releaseStatus$ subscription', () => {
    it('should update lastReleaseData from releaseStatus$', (done) => {
      const sharedService = TestBed.inject(SharedService) as any;
      const statusSubject = new Subject<any>();
      sharedService.releaseStatus$ = statusSubject.asObservable();
      
      component.ngOnInit();
      
      const newStatus = { release: 'v2.0' };
      statusSubject.next(newStatus);
      
      setTimeout(() => {
        expect(component.lastReleaseData).toEqual(newStatus);
        done();
      }, 0);
    });

    it('should handle null status from releaseStatus$', (done) => {
      const sharedService = TestBed.inject(SharedService) as any;
      const statusSubject = new Subject<any>();
      sharedService.releaseStatus$ = statusSubject.asObservable();
      
      component.ngOnInit();
      
      statusSubject.next(null);
      
      setTimeout(() => {
        expect(component.lastReleaseData).toEqual([]);
        done();
      }, 0);
    });
  });

  describe('onLayoutButtonClick', () => {
    it('should open confirmation modal and handle delete confirmation', (done) => {
      const modalService = TestBed.inject(NgbModal) as any;
      const modalRef = {
        componentInstance: { selectedItem: '', message: '' },
        result: Promise.resolve(true)
      };
      modalService.open.and.returnValue(modalRef);
      
      component.onLayoutButtonClick();
      
      expect(modalService.open).toHaveBeenCalledWith(ConfirmationModalComponent);
      expect(modalRef.componentInstance.selectedItem).toBe('Deployment');
      expect(modalRef.componentInstance.message).toBe('Are you sure you want to proceed?');
      
      modalRef.result.then(() => {
        done();
      });
    });

    it('should handle modal cancellation', (done) => {
      const modalService = TestBed.inject(NgbModal) as any;
      const modalRef = {
        componentInstance: { selectedItem: '', message: '' },
        result: Promise.resolve(false)
      };
      modalService.open.and.returnValue(modalRef);
      spyOn(console, 'log');
      
      component.onLayoutButtonClick();
      
      modalRef.result.then(() => {
        expect(console.log).toHaveBeenCalledWith('Cancelled delete deployment!');
        done();
      });
    });
  });

  describe('layoutActionService actionClick$', () => {
    it('should call onLayoutButtonClick when action is clicked', (done) => {
      const layoutActionService = TestBed.inject(LayoutActionService) as any;
      spyOn(component, 'onLayoutButtonClick');
      
      component.ngOnInit();
      
      layoutActionService.actionClick$.next();
      
      setTimeout(() => {
        expect(component.onLayoutButtonClick).toHaveBeenCalled();
        done();
      }, 0);
    });
  });

  describe('goToNextTab edge cases', () => {
    it('should not increment beyond tab 4', () => {
      component.selectedTabIndex = 5;
      component.goToNextTab();
      expect(component.selectedTabIndex).toBe(5);
    });

    it('should increment from tab 0 to tab 1', () => {
      component.selectedTabIndex = 0;
      component.goToNextTab();
      expect(component.selectedTabIndex).toBe(1);
    });

    it('should increment from tab 2 to tab 3', () => {
      component.selectedTabIndex = 2;
      component.goToNextTab();
      expect(component.selectedTabIndex).toBe(3);
    });

    it('should increment from tab 3 to tab 4', () => {
      component.selectedTabIndex = 3;
      component.goToNextTab();
      expect(component.selectedTabIndex).toBe(4);
    });
  });

  describe('onTabChange query params handling', () => {
    it('should handle empty query params', () => {
      const router = TestBed.inject(Router) as any;
      (component as any).activateRoute.snapshot.queryParams = {};
      (router as any).url = '/llm/deployment-details';
      const location = TestBed.inject(Location) as any;

      component.onTabChange(2);

      expect(component.selectedTabIndex).toBe(2);
      expect(location.replaceState).toHaveBeenCalledWith('/llm/deployment-details');
    });

    it('should preserve other query params and remove tabIndex', () => {
      const router = TestBed.inject(Router) as any;
      (component as any).activateRoute.snapshot.queryParams = { id: 'test123', tabIndex: '1', filter: 'active' };
      (router as any).url = '/llm/deployment-details?id=test123&tabIndex=1&filter=active';
      const location = TestBed.inject(Location) as any;

      component.onTabChange(3);

      expect(component.selectedTabIndex).toBe(3);
      const callArgs = location.replaceState.calls.mostRecent().args[0];
      expect(callArgs).toContain('id=test123');
      expect(callArgs).toContain('filter=active');
      expect(callArgs).not.toContain('tabIndex');
    });
  });

  describe('localStorage environment', () => {
    it('should handle missing environment in localStorage', () => {
      localStorage.setItem('environment', JSON.stringify({ name: 'Test Env' }));
      
      expect(() => {
        component.ngOnInit();
      }).not.toThrow();
      
      expect(component.envId).toBe('');
    });

    it('should extract environment id correctly', () => {
      localStorage.setItem('environment', JSON.stringify({ id: 'env-test-123', name: 'Test Env' }));
      
      component.ngOnInit();
      
      expect(component.envId).toBe('env-test-123');
    });
  });

  describe('destroy$ cleanup', () => {
    it('should complete destroy$ subject on ngOnDestroy', () => {
      const destroySpy = spyOn((component as any).destroy$, 'complete');
      const nextSpy = spyOn((component as any).destroy$, 'next');
      
      component.ngOnDestroy();
      
      expect(nextSpy).toHaveBeenCalled();
      expect(destroySpy).toHaveBeenCalled();
    });
  });
});
