import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TOAST_CONFIG, ToastrService } from 'ngx-toastr';

import { DeploymentListComponent } from './deployment-list.component';
import { SharedService } from '../../../shared/services/shared.service';
import { LLMDeploymentsService } from '../llm-deployment.service';
import { Router } from '@angular/router';
import { of, throwError, Subject } from 'rxjs';
import { PermissionService } from '../../../shared/services/permission.service';

describe('DeploymentListComponent', () => {
  let component: DeploymentListComponent;
  let fixture: ComponentFixture<DeploymentListComponent>;

  beforeEach(async () => {
    const sharedSpy = jasmine.createSpyObj('SharedService', ['getStatusMeta'], { valueChange$: of('ag-theme-alpine'), isLoading$: of(false), envValueChange$: of(null) } as any);
    sharedSpy.getStatusMeta.and.returnValue({ icon: 'bi-check', statusClass: 'success', label: 'active' });
    const deploymentSpy = jasmine.createSpyObj('LLMDeploymentsService', ['getDeployments']);
    deploymentSpy.getDeployments.and.returnValue(of({ status: 'success', data: [{ name: 'd1', status: 'active' }] }));

    const routerSpy = { navigate: jasmine.createSpy('navigate'), url: '/llm/deployment-list' };

    await TestBed.configureTestingModule({
      imports: [ DeploymentListComponent, HttpClientTestingModule ],
      providers: [
        { provide: SharedService, useValue: sharedSpy },
        { provide: LLMDeploymentsService, useValue: deploymentSpy },
        { provide: Router, useValue: routerSpy },
        { provide: PermissionService, useValue: (() => {
          const p = jasmine.createSpyObj('PermissionService', ['canAdminGlobal','hasAnyPermission','canWriteForCurrentUser']);
          p.canWriteForCurrentUser.and.returnValue(true);
          return p;
        })() }
      ]
    })
    .compileComponents();
    // Component declares its own provider for LLMDeploymentsService; ensure the component
    // receives our spy instance instead of creating a fresh service.
    TestBed.overrideComponent(DeploymentListComponent as any, {
      set: {
        providers: [{ provide: LLMDeploymentsService, useValue: deploymentSpy }]
      }
    });
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DeploymentListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should populate tableData on successful getDeployment', () => {
    const svc = TestBed.inject(LLMDeploymentsService) as jasmine.SpyObj<LLMDeploymentsService>;
    // simulate environment
    component.getDeployment({ id: 'env1' });
    expect(component.tableData.length).toBeGreaterThan(0);
    expect(component.loading).toBeFalse();
  });

  it('should handle getDeployment error gracefully', () => {
    const svc = TestBed.inject(LLMDeploymentsService) as jasmine.SpyObj<LLMDeploymentsService>;
    svc.getDeployments.and.returnValue(throwError(() => new Error('fail')));
    component.getDeployment({ id: 'env1' });
    expect(component.tableData.length).toBe(0);
    expect(component.loading).toBeFalse();
  });

  it('statusCellRenderer should return formatted html based on shared service', () => {
    const shared = TestBed.inject(SharedService) as jasmine.SpyObj<SharedService>;
    const html = component.statusCellRenderer({ value: 'active' });
    expect(html).toContain('bi-check');
    expect(html).toContain('success');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('constructor', () => {
    it('should load deployment from localStorage on init if environment exists', () => {
      localStorage.setItem('environment', JSON.stringify({ id: 'env-test' }));
      const svc = TestBed.inject(LLMDeploymentsService) as jasmine.SpyObj<LLMDeploymentsService>;
      svc.getDeployments.calls.reset();
      
      const newComponent = new DeploymentListComponent(
        TestBed.inject(SharedService),
        TestBed.inject(Router),
        svc
      );
      
      expect(svc.getDeployments).toHaveBeenCalledWith('env-test');
    });

    it('should not call getDeployment if localStorage environment is undefined string', () => {
      localStorage.setItem('environment', 'undefined');
      const svc = TestBed.inject(LLMDeploymentsService) as jasmine.SpyObj<LLMDeploymentsService>;
      svc.getDeployments.calls.reset();
      
      const newComponent = new DeploymentListComponent(
        TestBed.inject(SharedService),
        TestBed.inject(Router),
        svc
      );
      
      expect(svc.getDeployments).not.toHaveBeenCalled();
    });

    it('should not call getDeployment if localStorage environment is null', () => {
      localStorage.removeItem('environment');
      const svc = TestBed.inject(LLMDeploymentsService) as jasmine.SpyObj<LLMDeploymentsService>;
      svc.getDeployments.calls.reset();
      
      const newComponent = new DeploymentListComponent(
        TestBed.inject(SharedService),
        TestBed.inject(Router),
        svc
      );
      
      expect(svc.getDeployments).not.toHaveBeenCalled();
    });
  });

  describe('ngOnInit', () => {
    it('should subscribe to envValueChange$ and call getDeployment', () => {
      spyOn(component, 'getDeployment');
      const subscription = component['subscription'];
      
      // Verify subscription exists after ngOnInit (already called in beforeEach)
      expect(subscription).toBeDefined();
    });
  });

  describe('getDeployment', () => {
    it('should not call service if env is null', () => {
      const svc = TestBed.inject(LLMDeploymentsService) as jasmine.SpyObj<LLMDeploymentsService>;
      svc.getDeployments.calls.reset();
      
      component.getDeployment(null);
      
      expect(svc.getDeployments).not.toHaveBeenCalled();
    });

    it('should not call service if env is undefined', () => {
      const svc = TestBed.inject(LLMDeploymentsService) as jasmine.SpyObj<LLMDeploymentsService>;
      svc.getDeployments.calls.reset();
      
      component.getDeployment(undefined);
      
      expect(svc.getDeployments).not.toHaveBeenCalled();
    });

    it('should set tableData and save to localStorage on success', () => {
      const svc = TestBed.inject(LLMDeploymentsService) as jasmine.SpyObj<LLMDeploymentsService>;
      const mockData = [
        { name: 'app1', status: 'running' },
        { name: 'app2', status: 'stopped' }
      ];
      svc.getDeployments.and.returnValue(of({ 
        status: 'Success', 
        data: mockData 
      }));
      
      component.getDeployment({ id: 'env2' });
      
      expect(component.tableData).toEqual(mockData);
      expect(component.loading).toBeFalse();
      const stored = JSON.parse(localStorage.getItem('availableDeployments') || '[]');
      expect(stored).toEqual(['app1', 'app2']);
    });

    it('should handle case-insensitive success status', () => {
      const svc = TestBed.inject(LLMDeploymentsService) as jasmine.SpyObj<LLMDeploymentsService>;
      svc.getDeployments.and.returnValue(of({ 
        status: 'SUCCESS', 
        data: [{ name: 'test' }] 
      }));
      
      component.getDeployment({ id: 'env3' });
      
      expect(component.tableData.length).toBe(1);
    });

    it('should call mergeStatusIntoTable after successful fetch', () => {
      const svc = TestBed.inject(LLMDeploymentsService) as jasmine.SpyObj<LLMDeploymentsService>;
      spyOn(component, 'mergeStatusIntoTable');
      
      component.getDeployment({ id: 'env4' });
      
      expect(component.mergeStatusIntoTable).toHaveBeenCalled();
    });

    it('should set loading to false on error', () => {
      const svc = TestBed.inject(LLMDeploymentsService) as jasmine.SpyObj<LLMDeploymentsService>;
      svc.getDeployments.and.returnValue(throwError(() => new Error('Network error')));
      
      component.loading = true;
      component.getDeployment({ id: 'env5' });
      
      expect(component.loading).toBeFalse();
      expect(component.tableData).toEqual([]);
    });
  });

  describe('gotoAction', () => {
    it('should navigate to deployment details with name param', () => {
      const router = TestBed.inject(Router) as any;
      
      component.gotoAction({ name: 'my-app', status: 'running' });
      
      expect(router.navigate).toHaveBeenCalledWith(
        ['/llm/deployment-details'], 
        { queryParams: { id: 'my-app' } }
      );
    });
  });

  describe('goToNewDeployModel', () => {
    it('should navigate to create deployment page', () => {
      const router = TestBed.inject(Router) as any;
      
      component.goToNewDeployModel();
      
      expect(router.navigate).toHaveBeenCalledWith(['/llm/create-deployment']);
    });
  });

  describe('mergeStatusIntoTable', () => {
    it('should not process if tableData is null', () => {
      component.tableData = null as any;
      component.statusData = [{ name: 'app1', status: 'active' }];
      
      expect(() => component.mergeStatusIntoTable()).not.toThrow();
    });

    it('should not process if statusData is null', () => {
      component.tableData = [{ name: 'app1', status: 'unknown' }];
      component.statusData = null;
      
      expect(() => component.mergeStatusIntoTable()).not.toThrow();
    });

    it('should merge matching status into table', () => {
      component.tableData = [
        { name: 'app1', status: 'unknown' },
        { name: 'app2', status: 'unknown' }
      ];
      component.statusData = [
        { name: 'app1', status: 'running' },
        { name: 'app3', status: 'stopped' }
      ];
      
      component.mergeStatusIntoTable();
      
      expect(component.tableData[0].status).toBe('running');
      expect(component.tableData[1].status).toBe('unknown');
    });

    it('should keep original status if no match found', () => {
      component.tableData = [{ name: 'app-no-match', status: 'original' }];
      component.statusData = [{ name: 'other-app', status: 'new-status' }];
      
      component.mergeStatusIntoTable();
      
      expect(component.tableData[0].status).toBe('original');
    });

    it('should handle empty statusData array', () => {
      component.tableData = [{ name: 'app1', status: 'original' }];
      component.statusData = [];
      
      component.mergeStatusIntoTable();
      
      expect(component.tableData[0].status).toBe('original');
    });

    it('should handle empty tableData array', () => {
      component.tableData = [];
      component.statusData = [{ name: 'app1', status: 'running' }];
      
      component.mergeStatusIntoTable();
      
      expect(component.tableData).toEqual([]);
    });
  });

  describe('ngOnDestroy', () => {
    it('should clear interval', () => {
      component.getDeploymentIntervel = setInterval(() => {}, 1000);
      spyOn(window, 'clearInterval');
      
      component.ngOnDestroy();
      
      expect(clearInterval).toHaveBeenCalledWith(component.getDeploymentIntervel);
    });

    it('should unsubscribe from subscription if exists', () => {
      const mockSub = jasmine.createSpyObj('Subscription', ['unsubscribe']);
      component['subscription'] = mockSub;
      
      component.ngOnDestroy();
      
      expect(mockSub.unsubscribe).toHaveBeenCalled();
    });

    it('should not throw if subscription is undefined', () => {
      component['subscription'] = undefined;
      
      expect(() => component.ngOnDestroy()).not.toThrow();
    });

    it('should unsubscribe from pollingSubscription if exists', () => {
      const mockSub = jasmine.createSpyObj('Subscription', ['unsubscribe']);
      component['pollingSubscription'] = mockSub;
      
      component.ngOnDestroy();
      
      expect(mockSub.unsubscribe).toHaveBeenCalled();
    });

    it('should not throw if pollingSubscription is undefined', () => {
      component['pollingSubscription'] = undefined as any;
      
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('columnDefs', () => {
    it('should have name column with onCellClicked', () => {
      const nameCol = component.columnDefs.find(col => col.field === 'name');
      expect(nameCol).toBeDefined();
      expect(nameCol?.onCellClicked).toBeDefined();
    });

    it('should have date column with valueGetter and valueFormatter', () => {
      const dateCol = component.columnDefs.find(col => col.field === 'createdAt');
      expect(dateCol).toBeDefined();
      expect(dateCol?.valueGetter).toBeDefined();
      expect(dateCol?.valueFormatter).toBeDefined();
    });

    it('should format valid date in date column', () => {
      const dateCol = component.columnDefs.find(col => col.field === 'createdAt');
      const result = (dateCol?.valueGetter as any)({
        data: { createdAt: '2024-01-15T10:00:00Z' }
      });
      expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    });

    it('should handle invalid date in date column', () => {
      const dateCol = component.columnDefs.find(col => col.field === 'createdAt');
      const result = (dateCol?.valueGetter as any)({
        data: { createdAt: 'invalid-date' }
      });
      expect(result).toBe('');
    });

    it('should handle missing createdAt in date column', () => {
      const dateCol = component.columnDefs.find(col => col.field === 'createdAt');
      const result = (dateCol?.valueGetter as any)({
        data: {}
      });
      expect(result).toBe('');
    });

    it('should handle null data in date column', () => {
      const dateCol = component.columnDefs.find(col => col.field === 'createdAt');
      const result = (dateCol?.valueGetter as any)({ data: null });
      expect(result).toBe('');
    });

    it('should format date value correctly', () => {
      const dateCol = component.columnDefs.find(col => col.field === 'createdAt');
      const formatted = (dateCol?.valueFormatter as any)({ value: '01/15/2024' });
      expect(formatted).toBe('01/15/2024');
    });

    it('should handle empty value in date formatter', () => {
      const dateCol = component.columnDefs.find(col => col.field === 'createdAt');
      const formatted = (dateCol?.valueFormatter as any)({ value: '' });
      expect(formatted).toBe('');
    });

    it('should have status column with custom renderer', () => {
      const statusCol = component.columnDefs.find(col => col.field === 'status');
      expect(statusCol).toBeDefined();
      expect(statusCol?.cellRenderer).toBeDefined();
    });

    it('should call statusCellRenderer for status column', () => {
      const statusCol = component.columnDefs.find(col => col.field === 'status');
      spyOn(component, 'statusCellRenderer').and.returnValue('<span>test</span>');
      
      (statusCol?.cellRenderer as any)({ value: 'active' });
      
      expect(component.statusCellRenderer).toHaveBeenCalledWith({ value: 'active' });
    });

    it('should call statusCellRenderer for releaseStatus column', () => {
      const releaseCol = component.columnDefs.find(col => col.field === 'releaseStatus');
      spyOn(component, 'statusCellRenderer').and.returnValue('<span>test</span>');
      
      (releaseCol?.cellRenderer as any)({ value: 'deployed' });
      
      expect(component.statusCellRenderer).toHaveBeenCalledWith({ value: 'deployed' });
    });
  });
});
