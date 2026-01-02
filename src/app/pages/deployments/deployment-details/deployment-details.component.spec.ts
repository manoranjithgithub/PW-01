import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DeploymentDetailsComponent } from './deployment-details.component';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { LayoutActionService } from '../../../shared/services/layout-action.service';
import { DeploymentsService } from '../deployment.service';
import { ToastrService } from 'ngx-toastr';
import { SharedService } from '../../../shared/services/shared.service';
import { of, Subject } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

class MockRouter {
  url = '/deployment/details?id=1';
  navigate = jasmine.createSpy('navigate');
}

class MockActivatedRoute {
  queryParams = of({ id: '123', tabIndex: '2' });
  fragment = of(null);
  snapshot = {
    queryParams: { id: '123', tabIndex: '2' }
  };
}

class MockLocation {
  replaceState = jasmine.createSpy('replaceState');
}

class MockModalRef {
  componentInstance: any = {};
  result = Promise.resolve(true);
}

class MockModalService {
  open() {
    return new MockModalRef();
  }
}

class MockLayoutActionService {
  actionClick$ = new Subject<void>();
  setExtraTitle = jasmine.createSpy('setExtraTitle');
  clearExtraTitle = jasmine.createSpy('clearExtraTitle');
}

class MockDeploymentsService {
  getDeploymentById() {
    return of({
      status: 'success',
      data: { name: 'TestApp', status: 'Running' }
    });
  }

  liveReleaseStatus() {
    return of({
      releases: { releases: { status: 'success' } }
    });
  }

  deleteDeployment() {
    return of({ status: 'success' });
  }
}

class MockSharedService {
  releaseStatus$ = of([{ status: 'success', createdAt: '2024-01-01', updatedAt: '2024-01-02', buildStartedAt: '2024-01-01' }]);
  envValueChange$ = of(true);

  setlastReleaseData = jasmine.createSpy('setlastReleaseData');
  getlastReleaseData() {
    return [];
  }
}

class MockToastrService {
  success = jasmine.createSpy('success');
}

describe('DeploymentDetailsComponent', () => {
  let component: DeploymentDetailsComponent;
  let fixture: ComponentFixture<DeploymentDetailsComponent>;
  let layoutService: MockLayoutActionService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeploymentDetailsComponent, HttpClientTestingModule,BrowserAnimationsModule],
      providers: [
        { provide: Router, useClass: MockRouter },
        { provide: ActivatedRoute, useClass: MockActivatedRoute },
        { provide: Location, useClass: MockLocation },
        { provide: NgbModal, useClass: MockModalService },
        { provide: LayoutActionService, useClass: MockLayoutActionService },
        { provide: DeploymentsService, useClass: MockDeploymentsService },
        { provide: SharedService, useClass: MockSharedService },
        { provide: ToastrService, useClass: MockToastrService }
      ],
      schemas: [NO_ERRORS_SCHEMA] 
    }).compileComponents();

    TestBed.overrideComponent(DeploymentDetailsComponent, {
      set: {
        providers: [
          { provide: DeploymentsService, useClass: MockDeploymentsService }
        ]
      }
    });

    await TestBed.compileComponents();

    fixture = TestBed.createComponent(DeploymentDetailsComponent);
    component = fixture.componentInstance;
    layoutService = TestBed.inject(LayoutActionService) as any;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set deploymentId and selectedTabIndex from query params', () => {
    expect(component.deploymentId).toBe('123');
    expect(component.selectedTabIndex).toBe(2);
  });

  it('should set app name and layout title', () => {
    expect(component.appName).toBe('TestApp');
    expect(layoutService.setExtraTitle).toHaveBeenCalledWith(
      'TestApp (Running)'
    );
  });


  it('should update selectedTabIndex and replace URL on tab change', () => {
    component.onTabChange(3);
    expect(component.selectedTabIndex).toBe(3);
  });


  it('should increment tab index if less than 4', () => {
    component.selectedTabIndex = 2;
    component.goToNextTab();
    expect(component.selectedTabIndex).toBe(3);
  });


  it('should emit close event when onCloseClicked is called', () => {
    spyOn(component.closeModalEvent, 'emit');
    component.onCloseClicked();
    expect(component.closeModalEvent.emit).toHaveBeenCalled();
  });


  it('should delete deployment and navigate on confirm', async () => {
    const router = TestBed.inject(Router) as any;
    const toastr = TestBed.inject(ToastrService) as any;

    component.deploymentId = '123';
    component.onLayoutButtonClick();
    await fixture.whenStable();

    expect(toastr.success).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/deployment']);
  });


  it('should cleanup subscriptions on destroy', () => {
    spyOn(component['destroy$'], 'next');
    spyOn(component['destroy$'], 'complete');

    component.ngOnDestroy();

    expect(component['destroy$'].next).toHaveBeenCalled();
    expect(component['destroy$'].complete).toHaveBeenCalled();
    expect(layoutService.clearExtraTitle).toHaveBeenCalled();
  });
});
