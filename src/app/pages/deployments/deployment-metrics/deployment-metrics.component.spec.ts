import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { DeploymentMetricsComponent } from './deployment-metrics.component';
import { DeploymentsService } from '../deployment.service';
import { ActivatedRoute } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('DeploymentMetricsComponent', () => {
  let component: DeploymentMetricsComponent;
  let fixture: ComponentFixture<DeploymentMetricsComponent>;
  let deploymentServiceSpy: jasmine.SpyObj<DeploymentsService>;
  let queryParams$: Subject<any>;

  beforeEach(async () => {
    deploymentServiceSpy = jasmine.createSpyObj('DeploymentsService', [
      'getDeploymentById',
      'getInstanceTypes',
      'getDeploymentMetricsByTime'
    ]);
    // provide safe defaults so ngOnInit/onFilter won't call subscribe on undefined
    deploymentServiceSpy.getDeploymentById.and.returnValue(of({ data: {} }));
    deploymentServiceSpy.getInstanceTypes.and.returnValue(of({ data: [] }));
    deploymentServiceSpy.getDeploymentMetricsByTime.and.returnValue(of({ data: { usageRange: { data: { result: [] } } } }));

    queryParams$ = new Subject();

    await TestBed.configureTestingModule({
      imports: [DeploymentMetricsComponent,HttpClientTestingModule],
      providers: [
        FormBuilder,
        {
          provide: DeploymentsService,
          useValue: deploymentServiceSpy
        },
        {
          provide: ActivatedRoute,
          useValue: { queryParams: queryParams$.asObservable() }
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    });

    TestBed.overrideComponent(DeploymentMetricsComponent, {
      set: {
        providers: [
          { provide: DeploymentsService, useValue: deploymentServiceSpy }
        ]
      }
    });

    await TestBed.compileComponents();

    fixture = TestBed.createComponent(DeploymentMetricsComponent);
    component = fixture.componentInstance;

    spyOn<any>(component, 'renderCpuChart');
    spyOn<any>(component, 'renderRamChart');
    spyOn<any>(component, 'renderStorageChart');
  });

  it('should create component', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit()', () => {
    it('should read deploymentId from route and load deployment', () => {
      deploymentServiceSpy.getDeploymentById.and.returnValue(
        of({ data: { application: { instanceType: 'small' } } })
      );
      deploymentServiceSpy.getInstanceTypes.and.returnValue(
        of({ data: [{ instanceType: 'small', cpuVcpu: '1', memoryGb: '2' }] })
      );

      fixture.detectChanges();
      queryParams$.next({ id: 'dep-123' });

      expect(component.deploymentId).toBe('dep-123');
      expect(deploymentServiceSpy.getDeploymentById).toHaveBeenCalledWith('dep-123');
    });

    it('should initialize filter form with default values', () => {
      deploymentServiceSpy.getDeploymentById.and.returnValue(of({ data: {} }));
      fixture.detectChanges();
      queryParams$.next({});

      expect(component.filterForm).toBeDefined();
      expect(component.filterForm.get('duration')?.value).toBe('15');
      expect(component.filterForm.get('interval')?.value).toBe('5');
    });
  });

  describe('computeMaxLimits()', () => {
    it('should compute max cpu and ram limits and call onFilter()', () => {
      component.deploymentdetails = {
        application: { instanceType: 'medium' }
      };

      deploymentServiceSpy.getInstanceTypes.and.returnValue(
        of({
          data: [
            { instanceType: 'medium', cpuVcpu: '2', memoryGb: '4' }
          ]
        })
      );

      spyOn(component, 'onFilter');

      component.computeMaxLimits();

      expect(component.maxCpuLimit).toBe(2000);
      expect(component.maxRamLimit).toBe(4096);
      expect(component.onFilter).toHaveBeenCalled();
    });
  });

  describe('onFilter()', () => {
    beforeEach(() => {
      component.filterForm = new FormBuilder().group({
        duration: ['15'],
        interval: ['5'],
        fromTimestamp: [''],
        toTimestamp: ['']
      });
    });

    it('should set loading true and call cpu and memory filters', () => {
      spyOn<any>(component, 'onFilterCpu');
      spyOn<any>(component, 'onFilterMem');

      component.onFilter();

      expect(component.loading).toBeTrue();
      expect(component['pendingMetricsRequests']).toBe(2);
      expect(component['onFilterCpu']).toHaveBeenCalled();
      expect(component['onFilterMem']).toHaveBeenCalled();
    });
  });

  describe('onFilterCpu()', () => {
    it('should map cpu metrics and render chart', fakeAsync(() => {
      const response = {
        data: {
          usageRange: {
            data: {
              result: [
                { values: [[1234567890, '0.5']] }
              ]
            }
          }
        }
      };

      deploymentServiceSpy.getDeploymentMetricsByTime.and.returnValue(of(response));

      component['onFilterCpu']({
        fromISO: 'from',
        toISO: 'to',
        timeIntervalSeconds: 60
      });

      tick();

      expect(component.cpuUsageData.length).toBe(1);
      expect(component['renderCpuChart']).toHaveBeenCalled();
    }));

    it('should handle cpu api error', fakeAsync(() => {
      deploymentServiceSpy.getDeploymentMetricsByTime.and.returnValue(
        throwError(() => new Error('error'))
      );

      component['onFilterCpu']({
        fromISO: 'from',
        toISO: 'to',
        timeIntervalSeconds: 60
      });

      tick();

      expect(component.cpuUsageData.length).toBe(0);
    }));
  });

  describe('onFilterMem()', () => {
    it('should map ram metrics and render charts', fakeAsync(() => {
      const response = {
        data: {
          usageRange: {
            data: {
              result: [
                { values: [[1234567890, '1048576']] }
              ]
            }
          }
        }
      };

      deploymentServiceSpy.getDeploymentMetricsByTime.and.returnValue(of(response));

      component['onFilterMem']({
        fromISO: 'from',
        toISO: 'to',
        timeIntervalSeconds: 60
      });

      tick();

      expect(component.ramUsageData.length).toBe(1);
      expect(component['renderRamChart']).toHaveBeenCalled();
      expect(component['renderStorageChart']).toHaveBeenCalled();
    }));
  });

  describe('dropdown behavior', () => {
    it('should toggle dropdown', () => {
      component.dropdownOpen = false;
      component.toggleDropdown();
      expect(component.dropdownOpen).toBeTrue();
    });

    it('should close dropdown when clicking outside', () => {
      component.dropdownOpen = true;
      const event = new MouseEvent('click');
      component.onClickOutside(event);
      expect(component.dropdownOpen).toBeFalse();
    });
  });

  describe('utility methods', () => {
    it('should calculate average correctly', () => {
      const avg = (component as any).average([1, 2, 3]);
      expect(avg).toBe(2);
    });

    it('should format cpu label correctly', () => {
      const label = (component as any).formatCpuForLabel(1234.56);
      expect(label).toBe('1235 mCPU');
    });

    it('should parse unix timestamp correctly', () => {
      const date = (component as any).parseTimestampToDate(1700000000);
      expect(date instanceof Date).toBeTrue();
    });
  });
});
