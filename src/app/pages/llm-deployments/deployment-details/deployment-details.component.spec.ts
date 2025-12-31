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
    // first call returns main data, second call returns release data
    deploymentSpy.getDeploymentById.and.returnValues(
      of({ status: 'success', data: { name: 'app1', status: 'Running' } }),
      of({ status: 'success', data: { release: 'r1' } })
    );

    const sharedServiceSpy = jasmine.createSpyObj('SharedService', ['setlastReleaseData', 'getlastReleaseData']);
    sharedServiceSpy.getlastReleaseData.and.returnValue({});
    // ensure releaseStatus$ observable exists so component can subscribe safely
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
    // Ensure the component uses our spy instance instead of creating its own provider.
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
    // set snapshot query params to include other params
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
});
