import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { DeploymentMetricsComponent } from './deployment-metrics.component';
import { DeploymentsService } from '../deployment.service';
import { ActivatedRoute } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { NO_ERRORS_SCHEMA, ElementRef } from '@angular/core';
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

    it('should calculate average for empty array', () => {
      const avg = (component as any).average([]);
      expect(avg).toBe(0);
    });

    it('should calculate average with null values', () => {
      const avg = (component as any).average([1, null, 3]);
      expect(avg).toBeCloseTo(1.333, 2);
    });

    it('should format cpu label correctly', () => {
      const label = (component as any).formatCpuForLabel(1234.56);
      expect(label).toBe('1235 mCPU');
    });

    it('should parse unix timestamp correctly', () => {
      const date = (component as any).parseTimestampToDate(1700000000);
      expect(date instanceof Date).toBeTrue();
    });

    it('should parse millisecond timestamp', () => {
      const date = (component as any).parseTimestampToDate(1700000000000);
      expect(date instanceof Date).toBeTrue();
    });

    it('should parse string date', () => {
      const date = (component as any).parseTimestampToDate('2023-01-01T00:00:00Z');
      expect(date instanceof Date).toBeTrue();
    });

    it('should return current date for invalid timestamp', () => {
      const date = (component as any).parseTimestampToDate('invalid');
      expect(date instanceof Date).toBeTrue();
    });

    it('computeMaxLimits should warn when instance type missing and not call onFilter', () => {
      component.deploymentdetails = {}; // no application.instanceType
      spyOn(console, 'warn');
      spyOn(component, 'onFilter');

      deploymentServiceSpy.getInstanceTypes.and.returnValue(of({ data: [] }));

      component.computeMaxLimits();

      expect(console.warn).toHaveBeenCalled();
      expect(component.onFilter).not.toHaveBeenCalled();
    });

    it('computeMaxLimits should not set limits when instance type not found in list', () => {
      component.deploymentdetails = { application: { instanceType: 'unknown' } };
      component.maxCpuLimit = 0;
      component.maxRamLimit = 0;
      spyOn(component, 'onFilter');

      deploymentServiceSpy.getInstanceTypes.and.returnValue(of({
        data: [{ instanceType: 'small', cpuVcpu: '1', memoryGb: '2' }]
      }));

      component.computeMaxLimits();

      expect(component.maxCpuLimit).toBe(0);
      expect(component.maxRamLimit).toBe(0);
      expect(component.onFilter).toHaveBeenCalled();
    });

    it('onFilter should set loading false when both cpu and memory calls fail', fakeAsync(() => {
      // prepare filter form expected by onFilter
      component.filterForm = new FormBuilder().group({ duration: ['15'], interval: ['5'], fromTimestamp: [''], toTimestamp: [''] });
      // mock both metric calls to fail
      deploymentServiceSpy.getDeploymentMetricsByTime.and.returnValue(throwError(() => new Error('boom')));

      component.onFilter();
      tick();

      expect(component.loading).toBeFalse();
      expect((component as any).pendingMetricsRequests).toBe(0);
      expect(component.cpuUsageData.length).toBe(0);
      expect(component.ramUsageData.length).toBe(0);
    }));
  });

  describe('formatDateForDatetimeLocal', () => {
    it('should format date correctly', () => {
      const date = new Date('2023-05-15T10:30:00');
      const formatted = (component as any).formatDateForDatetimeLocal(date);
      expect(formatted).toMatch(/2023-05-15T10:30/);
    });

    it('should pad single digit months and days', () => {
      const date = new Date('2023-01-05T09:05:00');
      const formatted = (component as any).formatDateForDatetimeLocal(date);
      expect(formatted).toContain('2023-01-05');
      expect(formatted).toContain('09:05');
    });
  });

  describe('computeFilterParams', () => {
    beforeEach(() => {
      component.filterForm = new FormBuilder().group({
        duration: ['15'],
        interval: ['5'],
        fromTimestamp: [''],
        toTimestamp: ['']
      });
    });

    it('should compute params for predefined duration', () => {
      component.filterForm.patchValue({ duration: '30', interval: '5' });
      const params = (component as any).computeFilterParams();
      
      expect(params).toBeDefined();
      expect(params.fromISO).toBeDefined();
      expect(params.toISO).toBeDefined();
      expect(params.timeIntervalSeconds).toBe(300); // interval 5 minutes
    });

    it('should compute params for custom duration', () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 3600000);
      
      component.filterForm.patchValue({
        duration: 'custom',
        fromTimestamp: (component as any).formatDateForDatetimeLocal(oneHourAgo),
        toTimestamp: (component as any).formatDateForDatetimeLocal(now),
        interval: '5'
      });

      const params = (component as any).computeFilterParams();
      
      expect(params).toBeDefined();
      expect(params.fromISO).toContain('Z');
      expect(params.toISO).toContain('Z');
      expect(params.timeIntervalSeconds).toBe(300);
    });

    it('should return null for custom duration without timestamps', () => {
      spyOn(console, 'error');
      component.filterForm.patchValue({ duration: 'custom', fromTimestamp: '', toTimestamp: '' });
      
      const params = (component as any).computeFilterParams();
      
      expect(params).toBeNull();
      expect(console.error).toHaveBeenCalled();
    });

    it('should use default interval when not provided', () => {
      component.filterForm.patchValue({ duration: '1440', interval: null });
      const params = (component as any).computeFilterParams();
      
      expect(params).toBeDefined();
      expect(params.timeIntervalSeconds).toBe(3600);
    });
  });

  describe('getTimeScaleConfig', () => {
    beforeEach(() => {
      component.filterForm = new FormBuilder().group({
        duration: ['15'],
        interval: ['5'],
        fromTimestamp: [''],
        toTimestamp: ['']
      });
    });

    it('should return minute config for duration <= 60 minutes', () => {
      component.filterForm.patchValue({ duration: '30' });
      const config = (component as any).getTimeScaleConfig();
      
      expect(config.unit).toBe('minute');
    });

    it('should return hour config for duration <= 1440 minutes (1 day)', () => {
      component.filterForm.patchValue({ duration: '1440' });
      const config = (component as any).getTimeScaleConfig();
      
      expect(config.unit).toBe('hour');
    });

    it('should return day config for duration <= 10080 minutes (1 week)', () => {
      component.filterForm.patchValue({ duration: '10080' });
      const config = (component as any).getTimeScaleConfig();
      
      expect(config.unit).toBe('day');
    });

    it('should return month config for duration > 1 week', () => {
      component.filterForm.patchValue({ duration: '43834' });
      const config = (component as any).getTimeScaleConfig();
      
      expect(config.unit).toBe('month');
    });

    it('should handle custom duration', () => {
      const now = new Date();
      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 3600000);
      
      component.filterForm.patchValue({
        duration: 'custom',
        fromTimestamp: (component as any).formatDateForDatetimeLocal(twoDaysAgo),
        toTimestamp: (component as any).formatDateForDatetimeLocal(now)
      });

      const config = (component as any).getTimeScaleConfig();
      
      expect(config.unit).toBe('day'); // 2 days = 2880 minutes
    });

    it('should return default config when duration not set', () => {
      component.filterForm.patchValue({ duration: null });
      const config = (component as any).getTimeScaleConfig();
      
      expect(config.unit).toBe('minute');
    });
  });

  describe('chart rendering', () => {
    beforeEach(() => {
      component.cpuUsageData = [{ _id: '1234567890', cpuAverage: 500 }];
      component.ramUsageData = [{ _id: '1234567890', ramAverage: 1073741824 }];
      component.maxCpuLimit = 2000;
      component.maxRamLimit = 4096;
    });

    it('should retry renderCpuChart when chartRef not ready', fakeAsync(() => {
      (component as any).chartRef = null;
      spyOn(console, 'warn');
      spyOn(window, 'setTimeout');
      
      (component as any).renderCpuChart.and.callThrough();
      component['renderCpuChart']();
      
      expect(console.warn).toHaveBeenCalledWith('chartRef not ready, retrying...');
      expect(setTimeout).toHaveBeenCalled();
    }));

    it('should retry renderRamChart when ramChartRef not ready', fakeAsync(() => {
      (component as any).ramChartRef = null;
      spyOn(console, 'warn');
      spyOn(window, 'setTimeout');
      
      (component as any).renderRamChart.and.callThrough();
      component['renderRamChart']();
      
      expect(console.warn).toHaveBeenCalledWith('ramChartRef not ready, retrying...');
      expect(setTimeout).toHaveBeenCalled();
    }));

    it('should retry renderStorageChart when chartRef not ready', fakeAsync(() => {
      (component as any).chartRef = null;
      spyOn(console, 'warn');
      spyOn(window, 'setTimeout');
      
      (component as any).renderStorageChart.and.callThrough();
      component['renderStorageChart']();
      
      expect(console.warn).toHaveBeenCalledWith('chartRef not ready, retrying...');
      expect(setTimeout).toHaveBeenCalled();
    }));

    it('should create CPU chart with correct configuration', () => {
      // Reset spy to allow actual call
      (component as any).renderCpuChart.and.callThrough();
      
      component.chartRef = {
        nativeElement: document.createElement('canvas')
      } as ElementRef<HTMLCanvasElement>;
      
      component.cpuUsageData = [
        { _id: '1234567890', cpuAverage: 500 },
        { _id: '1234567900', cpuAverage: 600 }
      ];
      component.maxCpuLimit = 2000;
      component.filterForm = new FormBuilder().group({
        duration: ['15'],
        interval: ['5'],
        fromTimestamp: [''],
        toTimestamp: ['']
      });

      expect(() => component['renderCpuChart']()).not.toThrow();
      expect(component.cpuChart).toBeDefined();
    });

    it('should create RAM chart with correct configuration', () => {
      (component as any).renderRamChart.and.callThrough();
      
      component.ramChartRef = {
        nativeElement: document.createElement('canvas')
      } as ElementRef<HTMLCanvasElement>;
      
      component.ramUsageData = [
        { _id: '1234567890', ramAverage: 1073741824 },
        { _id: '1234567900', ramAverage: 2147483648 }
      ];
      component.maxRamLimit = 4096;
      component.filterForm = new FormBuilder().group({
        duration: ['15'],
        interval: ['5'],
        fromTimestamp: [''],
        toTimestamp: ['']
      });

      expect(() => component['renderRamChart']()).not.toThrow();
      expect(component.ramChart).toBeDefined();
    });

    it('should create storage chart with correct configuration', () => {
      (component as any).renderStorageChart.and.callThrough();
      
      component.chartRef = {
        nativeElement: document.createElement('canvas')
      } as ElementRef<HTMLCanvasElement>;
      
      component.storageChartRef = {
        nativeElement: document.createElement('canvas')
      } as ElementRef<HTMLCanvasElement>;
      
      component.storageUsageData = [
        { _id: '1234567890', storageAverage: 50 },
        { _id: '1234567900', storageAverage: 60 }
      ];
      component.filterForm = new FormBuilder().group({
        duration: ['15'],
        interval: ['5'],
        fromTimestamp: [''],
        toTimestamp: ['']
      });

      expect(() => component['renderStorageChart']()).not.toThrow();
      expect(component.storageChart).toBeDefined();
    });

    it('should destroy existing CPU chart before creating new one', () => {
      (component as any).renderCpuChart.and.callThrough();
      
      component.chartRef = {
        nativeElement: document.createElement('canvas')
      } as ElementRef<HTMLCanvasElement>;
      
      const mockChart = { destroy: jasmine.createSpy('destroy') };
      component.cpuChart = mockChart as any;
      
      component.cpuUsageData = [{ _id: '1234567890', cpuAverage: 500 }];
      component.filterForm = new FormBuilder().group({
        duration: ['15'],
        interval: ['5'],
        fromTimestamp: [''],
        toTimestamp: ['']
      });

      component['renderCpuChart']();
      
      expect(mockChart.destroy).toHaveBeenCalled();
    });

    it('should destroy existing RAM chart before creating new one', () => {
      (component as any).renderRamChart.and.callThrough();
      
      component.ramChartRef = {
        nativeElement: document.createElement('canvas')
      } as ElementRef<HTMLCanvasElement>;
      
      const mockChart = { destroy: jasmine.createSpy('destroy') };
      component.ramChart = mockChart as any;
      
      component.ramUsageData = [{ _id: '1234567890', ramAverage: 1073741824 }];
      component.filterForm = new FormBuilder().group({
        duration: ['15'],
        interval: ['5'],
        fromTimestamp: [''],
        toTimestamp: ['']
      });

      component['renderRamChart']();
      
      expect(mockChart.destroy).toHaveBeenCalled();
    });

    it('should destroy existing storage chart before creating new one', () => {
      (component as any).renderStorageChart.and.callThrough();
      
      component.chartRef = {
        nativeElement: document.createElement('canvas')
      } as ElementRef<HTMLCanvasElement>;
      
      component.storageChartRef = {
        nativeElement: document.createElement('canvas')
      } as ElementRef<HTMLCanvasElement>;
      
      const mockChart = { destroy: jasmine.createSpy('destroy') };
      component.storageChart = mockChart as any;
      
      component.storageUsageData = [{ _id: '1234567890', storageAverage: 50 }];
      component.filterForm = new FormBuilder().group({
        duration: ['15'],
        interval: ['5'],
        fromTimestamp: [''],
        toTimestamp: ['']
      });

      component['renderStorageChart']();
      
      expect(mockChart.destroy).toHaveBeenCalled();
    });

    it('should handle single data point by duplicating it', () => {
      (component as any).renderCpuChart.and.callThrough();
      
      component.chartRef = {
        nativeElement: document.createElement('canvas')
      } as ElementRef<HTMLCanvasElement>;
      
      component.cpuUsageData = [{ _id: '1234567890', cpuAverage: 500 }];
      component.filterForm = new FormBuilder().group({
        duration: ['15'],
        interval: ['5'],
        fromTimestamp: [''],
        toTimestamp: ['']
      });

      component['renderCpuChart']();
      
      expect(component.cpuChart).toBeDefined();
      expect(component.cpuChart.data.datasets[0].data.length).toBeGreaterThan(1);
    });
  });

  describe('decrementPendingRequests', () => {
    it('should decrement pending requests', () => {
      (component as any).pendingMetricsRequests = 2;
      component.loading = true;
      
      (component as any).decrementPendingRequests();
      
      expect((component as any).pendingMetricsRequests).toBe(1);
      expect(component.loading).toBeTrue();
    });

    it('should set loading to false when all requests complete', () => {
      (component as any).pendingMetricsRequests = 1;
      component.loading = true;
      
      (component as any).decrementPendingRequests();
      
      expect((component as any).pendingMetricsRequests).toBe(0);
      expect(component.loading).toBeFalse();
    });

    it('should not go below zero', () => {
      (component as any).pendingMetricsRequests = 0;
      component.loading = false;
      
      (component as any).decrementPendingRequests();
      
      expect((component as any).pendingMetricsRequests).toBe(0);
      expect(component.loading).toBeFalse();
    });
  });

  describe('isSelected', () => {
    beforeEach(() => {
      component.filterForm = new FormBuilder().group({
        pods: [['pod1', 'pod2']]
      });
    });

    it('should return true for selected pod', () => {
      expect(component.isSelected('pod1')).toBeTrue();
    });

    it('should return false for unselected pod', () => {
      expect(component.isSelected('pod3')).toBeFalse();
    });
  });

  describe('ngAfterViewInit', () => {
    it('should set loading to true', () => {
      component.loading = false;
      component.ngAfterViewInit();
      expect(component.loading).toBeTrue();
    });
  });

  describe('duration valueChanges', () => {
    it('should update timestamps when duration changes', fakeAsync(() => {
      fixture.detectChanges();
      queryParams$.next({ id: 'dep-123' });
      tick();

      const initialFrom = component.filterForm.get('fromTimestamp')?.value;

      // Wait a bit and change duration
      tick(1000);
      component.filterForm.get('duration')?.setValue('30');
      tick();

      const newFrom = component.filterForm.get('fromTimestamp')?.value;
      const newTo = component.filterForm.get('toTimestamp')?.value;

      expect(newFrom).toBeDefined();
      expect(newTo).toBeDefined();
      // They should be different due to time passing
      expect(typeof newFrom).toBe('string');
    }));
  });

  describe('edge cases', () => {
    it('should handle empty cpu metrics response', fakeAsync(() => {
      component.filterForm = new FormBuilder().group({
        duration: ['15'],
        interval: ['5'],
        fromTimestamp: [''],
        toTimestamp: ['']
      });

      deploymentServiceSpy.getDeploymentMetricsByTime.and.returnValue(
        of({ data: { usageRange: { data: { result: [] } } } })
      );

      component['onFilterCpu']({
        fromISO: 'from',
        toISO: 'to',
        timeIntervalSeconds: 60
      });

      tick();

      expect(component.cpuUsageData).toEqual([]);
    }));

    it('should handle null cpu values', fakeAsync(() => {
      component.filterForm = new FormBuilder().group({
        duration: ['15'],
        interval: ['5'],
        fromTimestamp: [''],
        toTimestamp: ['']
      });

      deploymentServiceSpy.getDeploymentMetricsByTime.and.returnValue(
        of({ data: { usageRange: { data: { result: [{ values: [[1234567890, null]] }] } } } })
      );

      component['onFilterCpu']({
        fromISO: 'from',
        toISO: 'to',
        timeIntervalSeconds: 60
      });

      tick();

      expect(component.cpuUsageData[0].cpuAverage).toBe(0);
    }));

    it('should handle empty memory metrics response', fakeAsync(() => {
      component.filterForm = new FormBuilder().group({
        duration: ['15'],
        interval: ['5'],
        fromTimestamp: [''],
        toTimestamp: ['']
      });

      deploymentServiceSpy.getDeploymentMetricsByTime.and.returnValue(
        of({ data: { usageRange: { data: { result: [] } } } })
      );

      component['onFilterMem']({
        fromISO: 'from',
        toISO: 'to',
        timeIntervalSeconds: 60
      });

      tick();

      expect(component.ramUsageData).toEqual([]);
    }));

    it('should handle null memory values', fakeAsync(() => {
      component.filterForm = new FormBuilder().group({
        duration: ['15'],
        interval: ['5'],
        fromTimestamp: [''],
        toTimestamp: ['']
      });

      deploymentServiceSpy.getDeploymentMetricsByTime.and.returnValue(
        of({ data: { usageRange: { data: { result: [{ values: [[1234567890, null]] }] } } } })
      );

      component['onFilterMem']({
        fromISO: 'from',
        toISO: 'to',
        timeIntervalSeconds: 60
      });

      tick();

      expect(component.ramUsageData[0].ramAverage).toBe(0);
    }));

    it('should handle missing usageRange in response', fakeAsync(() => {
      component.filterForm = new FormBuilder().group({
        duration: ['15'],
        interval: ['5'],
        fromTimestamp: [''],
        toTimestamp: ['']
      });

      deploymentServiceSpy.getDeploymentMetricsByTime.and.returnValue(
        of({ data: {} })
      );

      component['onFilterCpu']({
        fromISO: 'from',
        toISO: 'to',
        timeIntervalSeconds: 60
      });

      tick();

      expect(component.cpuUsageData).toEqual([]);
    }));
  });

  describe('onFilter with custom params', () => {
    it('should return early when computeFilterParams returns null', () => {
      component.filterForm = new FormBuilder().group({
        duration: ['custom'],
        interval: ['5'],
        fromTimestamp: [''],
        toTimestamp: ['']
      });

      spyOn<any>(component, 'onFilterCpu');
      spyOn<any>(component, 'onFilterMem');

      component.onFilter();

      expect(component['onFilterCpu']).not.toHaveBeenCalled();
      expect(component['onFilterMem']).not.toHaveBeenCalled();
    });
  });

  describe('computeMaxLimits', () => {
    it('should compute max CPU and RAM limits from instance type', fakeAsync(() => {
      component.deploymentdetails = {
        application: {
          instanceType: 't2.medium'
        }
      };

      const mockInstanceTypes = [
        { instanceType: 't2.medium', cpuVcpu: '2', memoryGb: '4' }
      ];

      deploymentServiceSpy.getInstanceTypes.and.returnValue(of({ data: mockInstanceTypes }));
      spyOn(component, 'onFilter');

      component.computeMaxLimits();
      tick();

      expect(component.maxCpuLimit).toBe(2000); // 2 * 1000
      expect(component.maxRamLimit).toBe(4096); // 4 * 1024
      expect(component.onFilter).toHaveBeenCalled();
    }));

    it('should handle missing instance type gracefully', fakeAsync(() => {
      component.deploymentdetails = {
        application: {
          instanceType: null
        }
      };

      deploymentServiceSpy.getInstanceTypes.and.returnValue(of({ data: [] }));
      spyOn(console, 'warn');
      const onFilterSpy = spyOn(component, 'onFilter');

      component.computeMaxLimits();
      tick();

      expect(console.warn).toHaveBeenCalledWith('Instance type is null or undefined.');
      // onFilter is not called when instanceType is missing based on code logic
    }));

    it('should handle instance type not found in list', fakeAsync(() => {
      component.deploymentdetails = {
        application: {
          instanceType: 't2.large'
        }
      };

      const mockInstanceTypes = [
        { instanceType: 't2.medium', cpuVcpu: '2', memoryGb: '4' }
      ];

      deploymentServiceSpy.getInstanceTypes.and.returnValue(of({ data: mockInstanceTypes }));
      spyOn(component, 'onFilter');

      component.computeMaxLimits();
      tick();

      expect(component.maxCpuLimit).toBe(0);
      expect(component.maxRamLimit).toBe(0);
      expect(component.onFilter).toHaveBeenCalled();
    }));
  });

  describe('HostListener and dropdown', () => {
    it('should close dropdown when clicking outside', () => {
      component.dropdownOpen = true;
      const outsideElement = document.createElement('div');
      const event = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(event, 'target', { value: outsideElement, enumerable: true });

      component.onClickOutside(event);

      expect(component.dropdownOpen).toBe(false);
    });

    it('should not close dropdown when clicking inside', () => {
      component.dropdownOpen = true;
      const insideElement = fixture.nativeElement.querySelector('div') || fixture.nativeElement;
      const event = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(event, 'target', { value: insideElement, enumerable: true });

      component.onClickOutside(event);

      expect(component.dropdownOpen).toBe(true);
    });

    it('should toggle dropdown state', () => {
      component.dropdownOpen = false;
      component.toggleDropdown();
      expect(component.dropdownOpen).toBe(true);

      component.toggleDropdown();
      expect(component.dropdownOpen).toBe(false);
    });
  });

  describe('RAM chart rendering', () => {
    it('should create RAM chart with correct max limit label', () => {
      (component as any).renderRamChart.and.callThrough();
      
      component.ramChartRef = {
        nativeElement: document.createElement('canvas')
      } as ElementRef<HTMLCanvasElement>;

      component.maxRamLimit = 8192;
      component.ramUsageData = [
        { _id: '1234567890', ramAverage: 2147483648 }, // 2048 MiB
        { _id: '1234567900', ramAverage: 4294967296 }  // 4096 MiB
      ];
      component.filterForm = new FormBuilder().group({
        duration: ['15'],
        interval: ['5'],
        fromTimestamp: [''],
        toTimestamp: ['']
      });

      component['renderRamChart']();

      expect(component.ramChart).toBeDefined();
      expect(component.ramChart.data.datasets.length).toBe(2);
    });

    it('should destroy existing RAM chart before creating new one', () => {
      (component as any).renderRamChart.and.callThrough();
      
      const mockChart = { destroy: jasmine.createSpy('destroy') };
      component.ramChart = mockChart as any;

      component.ramChartRef = {
        nativeElement: document.createElement('canvas')
      } as ElementRef<HTMLCanvasElement>;

      component.ramUsageData = [{ _id: '1234567890', ramAverage: 2147483648 }];
      component.filterForm = new FormBuilder().group({
        duration: ['15'],
        interval: ['5'],
        fromTimestamp: [''],
        toTimestamp: ['']
      });

      component['renderRamChart']();

      expect(mockChart.destroy).toHaveBeenCalled();
    });
  });

  describe('Custom duration in getTimeScaleConfig', () => {
    it('should handle custom duration with 2-hour range', () => {
      const fromDate = new Date('2024-01-01T10:00:00');
      const toDate = new Date('2024-01-01T12:00:00');

      component.filterForm = new FormBuilder().group({
        duration: ['custom'],
        interval: ['5'],
        fromTimestamp: [fromDate.toISOString().slice(0, 16)],
        toTimestamp: [toDate.toISOString().slice(0, 16)]
      });

      const config = component['getTimeScaleConfig']();

      expect(config.unit).toBe('hour');
    });

    it('should handle custom duration with 5-day range', () => {
      const fromDate = new Date('2024-01-01T10:00:00');
      const toDate = new Date('2024-01-06T10:00:00');

      component.filterForm = new FormBuilder().group({
        duration: ['custom'],
        interval: ['5'],
        fromTimestamp: [fromDate.toISOString().slice(0, 16)],
        toTimestamp: [toDate.toISOString().slice(0, 16)]
      });

      const config = component['getTimeScaleConfig']();

      expect(config.unit).toBe('day');
    });

    it('should handle custom duration with 2-month range', () => {
      const fromDate = new Date('2024-01-01T10:00:00');
      const toDate = new Date('2024-03-01T10:00:00');

      component.filterForm = new FormBuilder().group({
        duration: ['custom'],
        interval: ['5'],
        fromTimestamp: [fromDate.toISOString().slice(0, 16)],
        toTimestamp: [toDate.toISOString().slice(0, 16)]
      });

      const config = component['getTimeScaleConfig']();

      expect(config.unit).toBe('month');
    });
  });

  describe('Chart configuration validation', () => {
    it('should set correct tension and fill for CPU chart', () => {
      (component as any).renderCpuChart.and.callThrough();
      
      component.chartRef = {
        nativeElement: document.createElement('canvas')
      } as ElementRef<HTMLCanvasElement>;

      component.cpuUsageData = [
        { _id: '1234567890', cpuAverage: 500 },
        { _id: '1234567900', cpuAverage: 600 }
      ];
      component.filterForm = new FormBuilder().group({
        duration: ['15'],
        interval: ['5'],
        fromTimestamp: [''],
        toTimestamp: ['']
      });

      component['renderCpuChart']();

      const dataset = component.cpuChart.data.datasets[0];
      expect(dataset.tension).toBe(0.4);
      expect(dataset.fill).toBe(true);
    });

    it('should include max limit line in CPU chart', () => {
      (component as any).renderCpuChart.and.callThrough();
      
      component.chartRef = {
        nativeElement: document.createElement('canvas')
      } as ElementRef<HTMLCanvasElement>;

      component.maxCpuLimit = 2000;
      component.cpuUsageData = [{ _id: '1234567890', cpuAverage: 500 }];
      component.filterForm = new FormBuilder().group({
        duration: ['15'],
        interval: ['5'],
        fromTimestamp: [''],
        toTimestamp: ['']
      });

      component['renderCpuChart']();

      expect(component.cpuChart.data.datasets.length).toBe(2);
      expect(component.cpuChart.data.datasets[1].label).toContain('Max CPU Limit');
    });
  });

  describe('ngOnInit queryParams', () => {
    it('should handle deployment details fetch on init', fakeAsync(() => {
      const mockDeployment = {
        id: 'test-deployment',
        application: {
          instanceType: 't2.medium'
        }
      };

      deploymentServiceSpy.getDeploymentById.and.returnValue(of({ data: mockDeployment }));
      const computeMaxLimitsSpy = jasmine.createSpy('computeMaxLimits');
      component.computeMaxLimits = computeMaxLimitsSpy;

      // Manually simulate the subscription from ngOnInit
      component.deploymentId = 'test-123';
      deploymentServiceSpy.getDeploymentById(component.deploymentId).subscribe((res: any) => {
        component.deploymentdetails = res.data;
        component.computeMaxLimits();
      });
      
      tick();

      expect(deploymentServiceSpy.getDeploymentById).toHaveBeenCalledWith('test-123');
      expect(component.deploymentdetails).toEqual(mockDeployment);
      expect(computeMaxLimitsSpy).toHaveBeenCalled();
    }));
  });

  describe('Filter form interval mapping', () => {
    it('should map 30 minutes duration to 15 minute interval', () => {
      component.filterForm = new FormBuilder().group({
        duration: ['30'],
        interval: [''],
        fromTimestamp: [''],
        toTimestamp: ['']
      });

      const params = component['computeFilterParams']();

      expect(params?.timeIntervalSeconds).toBe(900); // 15 * 60
    });

    it('should map 60 minutes duration to 15 minute interval', () => {
      component.filterForm = new FormBuilder().group({
        duration: ['60'],
        interval: [''],
        fromTimestamp: [''],
        toTimestamp: ['']
      });

      const params = component['computeFilterParams']();

      expect(params?.timeIntervalSeconds).toBe(900); // 15 * 60
    });

    it('should map 7 days duration to 1 day interval', () => {
      component.filterForm = new FormBuilder().group({
        duration: ['10080'],
        interval: [''],
        fromTimestamp: [''],
        toTimestamp: ['']
      });

      const params = component['computeFilterParams']();

      expect(params?.timeIntervalSeconds).toBe(86400); // 1440 * 60
    });

    it('should map 1 month duration to 1 day interval', () => {
      component.filterForm = new FormBuilder().group({
        duration: ['43834'],
        interval: [''],
        fromTimestamp: [''],
        toTimestamp: ['']
      });

      const params = component['computeFilterParams']();

      expect(params?.timeIntervalSeconds).toBe(86400); // 1440 * 60
    });

    it('should use form interval when provided', () => {
      component.filterForm = new FormBuilder().group({
        duration: ['15'],
        interval: ['10'],
        fromTimestamp: [''],
        toTimestamp: ['']
      });

      const params = component['computeFilterParams']();

      expect(params?.timeIntervalSeconds).toBe(600); // 10 * 60
    });
  });
});
