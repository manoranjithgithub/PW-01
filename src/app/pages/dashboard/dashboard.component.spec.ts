import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { DashboardComponent } from './dashboard.component';
import { DashboardsService } from './dashboard.service';
import { SharedService } from '../../shared/services/shared.service';
import { PermissionService } from '../../shared/services/permission.service';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { of, Subject, throwError } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';


class MockDashboardsService {
  getCostDetails = jasmine.createSpy('getCostDetails').and.returnValue(of({
    success: true,
    data: {
      totals: [{ total_cost: 100, currency: 'USD' }],
      projection_mtd_simple: [{ projected_total: 200, currency: 'USD' }]
    }
  }));

  getEndpoints = jasmine.createSpy('getEndpoints').and.returnValue(of({ data: [] }));

  deleteEndpoint = jasmine.createSpy('deleteEndpoint').and.returnValue(of({ status: 'success', message: 'Deleted' }));

  getDeployments = jasmine.createSpy('getDeployments').and.returnValue(of({
    data: [
      { status: 'running' },
      { status: 'paused' }
    ]
  }));

  getToolsList = jasmine.createSpy('getToolsList').and.returnValue(of({
    data: [
      { status: 'failed' },
      { status: 'pending' }
    ]
  }));

  getDeploymentUtilizationSSE = jasmine.createSpy('getDeploymentUtilizationSSE').and.returnValue(of({
    values: {
      cpu: { usage: 2, limit: 4 },
      memory: { usage: 1024 * 1024 * 1024, limit: 2 * 1024 * 1024 * 1024 }
    }
  }));
}

class MockSharedService {
  envValueChange$ = new Subject<void>();
  currencyChange$ = new Subject<void>();

  getCurrency = jasmine.createSpy('getCurrency').and.returnValue('USD');
  convertAmount = jasmine.createSpy('convertAmount').and.callFake((amount: number) => amount);
}

class MockRouter {
  navigate = jasmine.createSpy('navigate');
}

class MockModalService {
  open = jasmine.createSpy('open').and.returnValue({
    componentInstance: {},
    result: Promise.resolve(true)
  });
}

class MockToastrService {
  success = jasmine.createSpy('success');
}

class MockPermissionService {}


describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let sharedService: MockSharedService;
  let dashboardService: MockDashboardsService;
  let router: MockRouter;
  let modalService: MockModalService;
  let toastrService: MockToastrService;

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
    dashboardService = fixture.debugElement.injector.get(DashboardsService) as any;
    router = TestBed.inject(Router) as any;
    modalService = TestBed.inject(NgbModal) as any;
    toastrService = TestBed.inject(ToastrService) as any;

    spyOn(localStorage, 'getItem').and.callFake((key: string) => {
      if (key === 'environment') return JSON.stringify({ id: 'env1' });
      if (key === 'project') return JSON.stringify({ id: 'proj1' });
      if (key === 'accountId') return 'acc1';
      return null;
    });

    // Reset mocks before each test
    dashboardService.getCostDetails.calls.reset();
    dashboardService.getEndpoints.calls.reset();
    dashboardService.deleteEndpoint.calls.reset();
    dashboardService.getDeployments.calls.reset();
    dashboardService.getToolsList.calls.reset();
    dashboardService.getDeploymentUtilizationSSE.calls.reset();
    sharedService.getCurrency.calls.reset();
    sharedService.convertAmount.calls.reset();

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

  it('should subscribe to envValueChange$ on ngOnInit', fakeAsync(() => {
    // Create a fresh component without calling ngOnInit yet
    const freshFixture = TestBed.createComponent(DashboardComponent);
    const freshComponent = freshFixture.componentInstance;
    const initSpy = spyOn(freshComponent, 'initializeDashboard');
    
    freshComponent.ngOnInit();
    expect(initSpy).toHaveBeenCalledTimes(1);
    
    sharedService.envValueChange$.next();
    tick();
    
    expect(initSpy).toHaveBeenCalledTimes(2);
  }));

  it('should subscribe to currencyChange$ on ngOnInit and recompute costs', fakeAsync(() => {
    component['lastCostResponse'] = {
      totals: [{ total_cost: 100, currency: 'USD' }],
      projection_mtd_simple: [{ projected_total: 200, currency: 'USD' }]
    };
    const applySpy = spyOn<any>(component, 'applyCostsToCards');
    
    component.ngOnInit();
    applySpy.calls.reset();
    sharedService.currencyChange$.next();
    tick();
    
    expect(applySpy).toHaveBeenCalledWith(component['lastCostResponse']);
  }));

  it('should not call applyCostsToCards when lastCostResponse is null', fakeAsync(() => {
    const applySpy = spyOn<any>(component, 'applyCostsToCards');
    component.ngOnInit();
    applySpy.calls.reset();
    component['lastCostResponse'] = null;
    
    sharedService.currencyChange$.next();
    tick();
    
    expect(applySpy).not.toHaveBeenCalled();
  }));

  it('should initialize dashboard with cost details', () => {
    component.initializeDashboard();
    expect(dashboardService.getCostDetails).toHaveBeenCalledWith('acc1', 'proj1', 'env1');
    expect(component.currentEnvId).toBe('env1');
  });

  it('should handle getCostDetails when success is true', fakeAsync(() => {
    spyOn<any>(component, 'applyCostsToCards');
    component.initializeDashboard();
    tick();
    expect(component['lastCostResponse']).toEqual({
      totals: [{ total_cost: 100, currency: 'USD' }],
      projection_mtd_simple: [{ projected_total: 200, currency: 'USD' }]
    });
    expect(component['applyCostsToCards']).toHaveBeenCalled();
  }));

  it('should handle getCostDetails when success is false', fakeAsync(() => {
    dashboardService.getCostDetails.and.returnValue(of({ success: false }));
    spyOn<any>(component, 'applyCostsToCards');
    component.initializeDashboard();
    tick();
    expect(component['applyCostsToCards']).not.toHaveBeenCalled();
  }));

  it('should apply cost values to cards', () => {
    component['applyCostsToCards']({
      totals: [{ total_cost: 150, currency: 'USD' }],
      projection_mtd_simple: [{ projected_total: 300, currency: 'USD' }]
    });

    expect(component.cards[0].value).toContain('$');
    expect(component.cards[1].value).toContain('$');
  });

  it('should apply cost value as 0 when totalCostSum is 0', () => {
    component['applyCostsToCards']({
      totals: [{ total_cost: 0, currency: 'USD' }],
      projection_mtd_simple: [{ projected_total: 0, currency: 'USD' }]
    });

    expect(component.cards[0].value).toBe('0');
    expect(component.cards[1].value).toBe('0');
  });

  it('should handle applyCostsToCards with missing totals', () => {
    spyOn(console, 'error');
    component['applyCostsToCards']({
      totals: null,
      projection_mtd_simple: null
    });

    expect(component.cards[0].value).toBe('0');
    expect(component.cards[1].value).toBe('0');
  });

  it('should handle applyCostsToCards with empty arrays', () => {
    component['applyCostsToCards']({
      totals: [],
      projection_mtd_simple: []
    });

    expect(component.cards[0].value).toBe('0');
    expect(component.cards[1].value).toBe('0');
  });

  it('should handle applyCostsToCards error', () => {
    spyOn(console, 'error');
    sharedService.convertAmount.and.throwError('conversion error');
    
    component['applyCostsToCards']({
      totals: [{ total_cost: 100, currency: 'USD' }],
      projection_mtd_simple: [{ projected_total: 200, currency: 'USD' }]
    });

    expect(console.error).toHaveBeenCalledWith('Error applying currency conversion', jasmine.any(Error));
  });

  it('should get endpoints list', fakeAsync(() => {
    dashboardService.getEndpoints.and.returnValue(of({ data: [{ name: 'endpoint1' }] }));
    component.getEndpointsList('env1');
    tick();
    expect(component.endpoints).toEqual([{ name: 'endpoint1' }]);
  }));

  it('should navigate to deployment details when viewEndpoint is called with deploymentId', () => {
    const data = { deploymentId: 'deploy123' };
    component.viewEndpoint(data);
    
    expect(router.navigate).toHaveBeenCalledWith(
      ['/deployment/deployment-details'],
      {
        queryParams: { id: 'deploy123' },
        fragment: 'network-section'
      }
    );
  });

  it('should navigate to tools when viewEndpoint is called without deploymentId', () => {
    const data = {};
    component.viewEndpoint(data);
    
    expect(router.navigate).toHaveBeenCalledWith(['/tools']);
  });

  it('should delete endpoint successfully', fakeAsync(() => {
    spyOn(window, 'scrollTo');
    spyOn(component, 'getEndpointsList');
    component.currentEnvId = 'env1';
    
    const data = { name: 'endpoint1' };
    component.deleteEndpoint(data);
    tick();

    expect(modalService.open).toHaveBeenCalled();
    expect(dashboardService.deleteEndpoint).toHaveBeenCalledWith('env1', 'endpoint1');
    expect(toastrService.success).toHaveBeenCalledWith('Deleted');
    expect(component.getEndpointsList).toHaveBeenCalledWith('env1');
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
  }));

  it('should handle deleteEndpoint error', fakeAsync(() => {
    spyOn(window, 'scrollTo');
    spyOn(console, 'log');
    dashboardService.deleteEndpoint.and.returnValue(throwError(() => new Error('Delete failed')));
    component.currentEnvId = 'env1';
    
    const data = { name: 'endpoint1' };
    component.deleteEndpoint(data);
    tick();

    expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
  }));

  it('should handle deleteEndpoint cancellation', fakeAsync(() => {
    spyOn(console, 'log');
    modalService.open.and.returnValue({
      componentInstance: {},
      result: Promise.resolve(false)
    });
    
    const data = { name: 'endpoint1' };
    component.deleteEndpoint(data);
    tick();

    expect(console.log).toHaveBeenCalledWith('Cancelled delete Endpoint!');
    expect(dashboardService.deleteEndpoint).not.toHaveBeenCalled();
  }));

  it('should get current month range', () => {
    const result = component.getCurrentMonthRange();
    expect(result).toMatch(/\w+ \d+ - \w+ \d+/);
  });

  it('should calculate deployment status counts', fakeAsync(() => {
    component.currentEnvId = 'env1';
    component.getStatusCount();
    tick();

    expect(component.cards[2].value).toBe('1 / 1'); 
    expect(component.cards[3].value).toBe('1 / 1');
  }));

  it('should handle status count with multiple statuses', fakeAsync(() => {
    dashboardService.getDeployments.and.returnValue(of({
      data: [
        { status: 'running' },
        { status: 'running' },
        { status: 'paused' }
      ]
    }));
    dashboardService.getToolsList.and.returnValue(of({
      data: [
        { status: 'failed' },
        { status: 'pending' },
        { status: 'pending' }
      ]
    }));

    component.currentEnvId = 'env1';
    component.getStatusCount();
    tick();

    expect(component.cards[2].value).toBe('2 / 1');
    expect(component.cards[3].value).toBe('1 / 2');
  }));

  it('should calculate CPU utilization percentage', fakeAsync(() => {
    component.currentEnvId = 'env1';
    component.startCpuStream();
    tick();
    expect(component.utilizationData[0].value).toBe(50);
    expect(component.utilizationData[0].rawValue).toBe('2.00 / 4');
  }));

  it('should handle CPU stream with alternative data structure', fakeAsync(() => {
    dashboardService.getDeploymentUtilizationSSE.and.returnValue(of({
      cpu: { usage: 3, limit: 6 }
    }));
    
    component.currentEnvId = 'env1';
    component.startCpuStream();
    tick();
    
    expect(component.utilizationData[0].value).toBe(50);
  }));

  it('should handle CPU stream with null values', fakeAsync(() => {
    dashboardService.getDeploymentUtilizationSSE.and.returnValue(of({
      values: { cpu: { usage: null, limit: null } }
    }));
    
    component.currentEnvId = 'env1';
    component.startCpuStream();
    tick();
    
    expect(component.utilizationData[0].value).toBe(0);
  }));

  it('should handle CPU stream error', fakeAsync(() => {
    spyOn(console, 'error');
    dashboardService.getDeploymentUtilizationSSE.and.returnValue(throwError(() => new Error('CPU error')));
    
    component.currentEnvId = 'env1';
    component.startCpuStream();
    tick();
    
    expect(console.error).toHaveBeenCalledWith('CPU SSE error', jasmine.any(Error));
  }));

  it('should calculate Memory utilization percentage', fakeAsync(() => {
    component.currentEnvId = 'env1';
    component.startMemoryStream();
    tick();
    expect(component.utilizationData[1].value).toBe(50);
    expect(component.utilizationData[1].rawValue).toBe('1.00 GB / 2.00 GB');
  }));

  it('should handle Memory stream with alternative data structure', fakeAsync(() => {
    dashboardService.getDeploymentUtilizationSSE.and.returnValue(of({
      values: {},
      memory: { usage: 1024 * 1024 * 1024 * 1.5, limit: 1024 * 1024 * 1024 * 3 }
    }));
    
    component.currentEnvId = 'env1';
    component.startMemoryStream();
    tick();
    
    expect(component.utilizationData[1].value).toBe(50);
  }));

  it('should handle Memory stream with null values', fakeAsync(() => {
    dashboardService.getDeploymentUtilizationSSE.and.returnValue(of({
      values: { memory: { usage: null, limit: null } }
    }));
    
    component.currentEnvId = 'env1';
    component.startMemoryStream();
    tick();
    
    expect(component.utilizationData[1].value).toBe(0);
  }));

  it('should handle Memory stream error', fakeAsync(() => {
    spyOn(console, 'error');
    dashboardService.getDeploymentUtilizationSSE.and.returnValue(throwError(() => new Error('Memory error')));
    
    component.currentEnvId = 'env1';
    component.startMemoryStream();
    tick();
    
    expect(console.error).toHaveBeenCalledWith('Memory SSE error', jasmine.any(Error));
  }));

  it('should return correct percentage', () => {
    expect(component.getPercentage(50, 100)).toBe(50);
    expect(component.getPercentage(null, 100)).toBe(0);
    expect(component.getPercentage(10, 0)).toBe(0);
    expect(component.getPercentage(undefined, 100)).toBe(0);
    expect(component.getPercentage(10, null)).toBe(0);
    expect(component.getPercentage(10, undefined)).toBe(0);
    expect(component.getPercentage(33.333, 100)).toBe(33.33);
  });

  it('should toggle dropdown state and set styles', () => {
    const btn = document.createElement('button');
    const rect = { bottom: 100, right: 200, getBoundingClientRect: () => rect } as any;
    spyOn(btn, 'getBoundingClientRect').and.returnValue(rect);
    spyOn(window, 'dispatchEvent');
    
    const event = new MouseEvent('click');
    spyOn(event, 'stopPropagation');
    
    component.toggleDropdown(event, btn);
    
    expect(event.stopPropagation).toHaveBeenCalled();
    expect(component.isDropdownOpen).toBeTrue();
    expect(component.dropdownStyle.top).toBe('100px');
    expect(component.dropdownStyle.left).toBe('40px');
    expect(window.dispatchEvent).toHaveBeenCalledWith(jasmine.any(Event));
  });

  it('should close dropdown when toggling open dropdown', () => {
    component.isDropdownOpen = true;
    const btn = document.createElement('button');
    const event = new MouseEvent('click');
    spyOn(event, 'stopPropagation');
    
    component.toggleDropdown(event, btn);
    
    expect(component.isDropdownOpen).toBeFalse();
    expect(component.lastButtonRef).toBeNull();
  });

  it('should handle toggleDropdown without btnRef parameter', () => {
    const btn = document.createElement('button');
    const rect = { bottom: 100, right: 200 };
    spyOn(btn, 'getBoundingClientRect').and.returnValue(rect as any);
    
    const event = { target: btn, stopPropagation: jasmine.createSpy('stopPropagation') } as any;
    spyOn(window, 'dispatchEvent');
    
    component.toggleDropdown(event);
    
    expect(event.stopPropagation).toHaveBeenCalled();
    expect(component.isDropdownOpen).toBeTrue();
  });

  it('should update dropdown position on window scroll', () => {
    const btn = document.createElement('button');
    const rect = { bottom: 150, right: 250 };
    spyOn(btn, 'getBoundingClientRect').and.returnValue(rect as any);
    
    component.isDropdownOpen = true;
    component.lastButtonRef = btn;
    
    component.onWindowScroll();
    
    expect(component.dropdownStyle.top).toBe('158px');
    expect(component.dropdownStyle.left).toBe('90px');
  });

  it('should not update dropdown position on scroll when dropdown is closed', () => {
    component.isDropdownOpen = false;
    component.lastButtonRef = document.createElement('button');
    spyOn<any>(component, 'updateDropdownPosition');
    
    component.onWindowScroll();
    
    expect(component['updateDropdownPosition']).not.toHaveBeenCalled();
  });

  it('should update dropdown position on window resize', () => {
    const btn = document.createElement('button');
    const rect = { bottom: 120, right: 220 };
    spyOn(btn, 'getBoundingClientRect').and.returnValue(rect as any);
    
    component.isDropdownOpen = true;
    component.lastButtonRef = btn;
    
    component.onWindowResize();
    
    expect(component.dropdownStyle.top).toBe('128px');
    expect(component.dropdownStyle.left).toBe('60px');
  });

  it('should not update dropdown position on resize when dropdown is closed', () => {
    component.isDropdownOpen = false;
    component.lastButtonRef = document.createElement('button');
    spyOn<any>(component, 'updateDropdownPosition');
    
    component.onWindowResize();
    
    expect(component['updateDropdownPosition']).not.toHaveBeenCalled();
  });

  it('should close dropdown on outside click', () => {
    component.isDropdownOpen = true;
    const target = document.createElement('div');
    const event = { target } as any;
    
    component.onOutsideClick(event);
    
    expect(component.isDropdownOpen).toBeFalse();
  });

  it('should not close dropdown when clicking inside menu', () => {
    component.isDropdownOpen = true;
    const menu = document.createElement('div');
    menu.className = 'floating-dropdown';
    const target = document.createElement('span');
    menu.appendChild(target);
    document.body.appendChild(menu);
    
    const event = { target } as any;
    component.onOutsideClick(event);
    
    expect(component.isDropdownOpen).toBeTrue();
    document.body.removeChild(menu);
  });

  it('should not close dropdown when clicking button', () => {
    component.isDropdownOpen = true;
    const btn = document.createElement('button');
    btn.className = 'btn-icon';
    const target = document.createElement('span');
    btn.appendChild(target);
    document.body.appendChild(btn);
    
    const event = { target } as any;
    component.onOutsideClick(event);
    
    expect(component.isDropdownOpen).toBeTrue();
    document.body.removeChild(btn);
  });

  it('should close dropdown on close-action-dropdowns event', () => {
    component.isDropdownOpen = true;
    component.lastButtonRef = document.createElement('button');
    
    component.onCloseActionDropdowns(new Event('close-action-dropdowns'));
    
    expect(component.isDropdownOpen).toBeFalse();
    expect(component.lastButtonRef).toBeNull();
  });

  it('should not update dropdown position when btn is null', () => {
    component.updateDropdownPosition(null);
    // Should not throw error
    expect(component.dropdownStyle).toBeDefined();
  });

  it('should not update dropdown position when btn is undefined', () => {
    component.updateDropdownPosition(undefined);
    // Should not throw error
    expect(component.dropdownStyle).toBeDefined();
  });

  it('should update dropdown position with valid button', () => {
    const btn = document.createElement('button');
    const rect = { bottom: 200, right: 300 };
    spyOn(btn, 'getBoundingClientRect').and.returnValue(rect as any);
    
    component.updateDropdownPosition(btn);
    
    expect(component.dropdownStyle.top).toBe('208px');
    expect(component.dropdownStyle.left).toBe('140px');
  });

  it('should unsubscribe on destroy', () => {
    const sub1 = jasmine.createSpyObj('Subscription', ['unsubscribe']);
    const sub2 = jasmine.createSpyObj('Subscription', ['unsubscribe']);
    component['subscriptions'] = [sub1, sub2];
    component['envValueSubscription'] = jasmine.createSpyObj('Subscription', ['unsubscribe']);
    
    component.ngOnDestroy();
    
    expect(sub1.unsubscribe).toHaveBeenCalled();
    expect(sub2.unsubscribe).toHaveBeenCalled();
    expect(component['envValueSubscription']?.unsubscribe).toHaveBeenCalled();
  });

  it('should handle ngOnDestroy when envValueSubscription is undefined', () => {
    component['subscriptions'] = [];
    component['envValueSubscription'] = undefined;
    
    expect(() => component.ngOnDestroy()).not.toThrow();
  });
});
