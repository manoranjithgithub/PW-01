import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardComponent } from './dashboard.component';
import { DashboardsService } from './dashboard.service';
import { SharedService } from '../../shared/services/shared.service';
import { PermissionService } from '../../shared/services/permission.service';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { of, Subject } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';


class MockDashboardsService {
  getCostDetails() {
    return of({
      success: true,
      data: {
        totals: [{ total_cost: 100, currency: 'USD' }],
        projection_mtd_simple: [{ projected_total: 200, currency: 'USD' }]
      }
    });
  }

  getEndpoints() {
    return of({ data: [] });
  }

  deleteEndpoint() {
    return of({ status: 'success', message: 'Deleted' });
  }

  getDeployments() {
    return of({
      data: [
        { status: 'running' },
        { status: 'paused' }
      ]
    });
  }

  getToolsList() {
    return of({
      data: [
        { status: 'failed' },
        { status: 'pending' }
      ]
    });
  }

  getDeploymentUtilizationSSE(_: string, __: string) {
    return of({
      values: {
        cpu: { usage: 2, limit: 4 },
        memory: { usage: 1024 * 1024 * 1024, limit: 2 * 1024 * 1024 * 1024 }
      }
    });
  }
}

class MockSharedService {
  envValueChange$ = new Subject<void>();
  currencyChange$ = new Subject<void>();

  getCurrency() {
    return 'USD';
  }

  convertAmount(amount: number) {
    return amount;
  }
}

class MockRouter {
  navigate = jasmine.createSpy('navigate');
}

class MockModalService {
  open() {
    return {
      componentInstance: {},
      result: Promise.resolve(true)
    };
  }
}

class MockToastrService {
  success = jasmine.createSpy('success');
}

class MockPermissionService {}


describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let sharedService: MockSharedService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent, HttpClientTestingModule], 
      providers: [
        { provide: SharedService, useClass: MockSharedService },
        { provide: Router, useClass: MockRouter },
        { provide: NgbModal, useClass: MockModalService },
        { provide: ToastrService, useClass: MockToastrService },
        { provide: PermissionService, useClass: MockPermissionService }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    })
    // ensure the component uses our mock dashboards service instead of its own provider
    .overrideComponent(DashboardComponent, {
      set: {
        providers: [ { provide: DashboardsService, useClass: MockDashboardsService } ]
      }
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    sharedService = TestBed.inject(SharedService) as any;

    spyOn(localStorage, 'getItem').and.callFake((key: string) => {
      if (key === 'environment') return JSON.stringify({ id: 'env1' });
      if (key === 'project') return JSON.stringify({ id: 'proj1' });
      if (key === 'accountId') return 'acc1';
      return null;
    });

    fixture.detectChanges();
  });


  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize dashboard on ngOnInit', () => {
    spyOn(component, 'initializeDashboard');
    component.ngOnInit();
    expect(component.initializeDashboard).toHaveBeenCalled();
  });


  it('should apply cost values to cards', () => {
    component['applyCostsToCards']({
      totals: [{ total_cost: 150, currency: 'USD' }],
      projection_mtd_simple: [{ projected_total: 300, currency: 'USD' }]
    });

    expect(component.cards[0].value).toContain('$');
    expect(component.cards[1].value).toContain('$');
  });


  it('should calculate deployment status counts', () => {
    component.currentEnvId = 'env1';
    component.getStatusCount();

    expect(component.cards[2].value).toBe('1 / 1'); 
    expect(component.cards[3].value).toBe('1 / 1');
  });


  it('should calculate CPU utilization percentage', () => {
    component.startCpuStream();
    expect(component.utilizationData[0].value).toBe(50);
  });

  it('should calculate Memory utilization percentage', () => {
    component.startMemoryStream();
    expect(component.utilizationData[1].value).toBe(50);
  });


  it('should return correct percentage', () => {
    expect(component.getPercentage(50, 100)).toBe(50);
    expect(component.getPercentage(null, 100)).toBe(0);
    expect(component.getPercentage(10, 0)).toBe(0);
  });


  it('should toggle dropdown state', () => {
    const event = new MouseEvent('click');
    component.toggleDropdown(event, document.createElement('button'));
    expect(component.isDropdownOpen).toBeTrue();
  });


  it('should unsubscribe on destroy', () => {
    spyOn<any>(component['subscriptions'][0], 'unsubscribe');
    component.ngOnDestroy();
    component['subscriptions'].forEach(sub =>
      expect(sub.closed).toBeTrue()
    );
  });
});
