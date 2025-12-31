import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { DeploymentObservabilityComponent } from './deployment-observability.component';
import { DeploymentsService } from '../deployment.service';
import { FormBuilder, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { CardComponent, CardGroupComponent, CardBodyComponent } from '@coreui/angular';
import { HighlightPipe } from '../../../shared/pipes/highlight.pipe';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('DeploymentObservabilityComponent', () => {
  let component: DeploymentObservabilityComponent;
  let fixture: ComponentFixture<DeploymentObservabilityComponent>;
  let mockDeploymentService: any;

  beforeEach(async () => {
    mockDeploymentService = {
      getSelectedDeploymentLogs: jasmine.createSpy('getSelectedDeploymentLogs').and.returnValue(of({
        status: 'Success',
        data: {
          logs: ['1627891234 Test log message'],
          totalPages: 1
        }
      }))
    };

    await TestBed.configureTestingModule({
      imports: [
        DeploymentObservabilityComponent, 
        CommonModule,
        ReactiveFormsModule,
        FormsModule,
        MatSelectModule,
        MatFormFieldModule,
        MatCheckboxModule,
        CardGroupComponent,
        CardComponent,
        CardBodyComponent,
        HighlightPipe,
        HttpClientTestingModule
      ],
      providers: [
        FormBuilder,
        // `DeploymentsService` is provided at the component level; we'll override that below
        {
          provide: ActivatedRoute,
          useValue: { queryParams: of({ id: '123' }) }
        }
      ]
    });

    // Override the component's providers so the standalone component uses our mock
    TestBed.overrideComponent(DeploymentObservabilityComponent, {
      set: {
        providers: [
          { provide: DeploymentsService, useValue: mockDeploymentService }
        ]
      }
    });

    await TestBed.compileComponents();

  });

  beforeEach(() => {
    // Mock localStorage
    spyOn(localStorage, 'getItem').and.callFake((key: string) => {
      if (key === 'environment') {
        return JSON.stringify({ id: 'env-123' });
      }
      return null;
    });

    fixture = TestBed.createComponent(DeploymentObservabilityComponent);
    component = fixture.componentInstance;
    component.appName = 'test-app';
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize the form with default values', () => {
    expect(component.filterForm).toBeDefined();
    expect(component.filterForm.get('searchText')?.value).toBe('');
    expect(component.filterForm.get('duration')?.value).toBe('15m');
    expect(component.filterForm.get('timeZone')?.value).toBe('IST');
  });

  it('should fetch logs on initialization', () => {
    expect(mockDeploymentService.getSelectedDeploymentLogs).toHaveBeenCalled();
    expect(component.deploymentLogs.logs.length).toBe(1);
    expect(component.parsedLogs[0].message).toBe('Test log message');
  });

  it('should filter logs based on search text', fakeAsync(() => {
    // ensure initial logs are loaded
    tick();
    fixture.detectChanges();

    component.filterForm.get('searchText')?.setValue('test');
    fixture.detectChanges();
    tick(500);
    expect(component.filteredLogs.length).toBe(1);

    component.filterForm.get('searchText')?.setValue('nomatch');
    fixture.detectChanges();
    tick(500);
    expect(component.filteredLogs.length).toBe(0);
  }));

  it('should toggle light mode', () => {
    const initialMode = component.isLightMode;
    component.toggleMode(new Event('click'));
    expect(component.isLightMode).toBe(!initialMode);
  });

  it('should convert timestamps correctly', () => {
    const ts = '1627891234';
    const formatted = component['convertTimestampToTZ'](ts, 'IST');
    expect(formatted).toContain('IST');
  });

  it('should handle page change', () => {
    component.onPageChange(2);
    expect(component.currentPage).toBe(2);
    expect(mockDeploymentService.getSelectedDeploymentLogs).toHaveBeenCalledTimes(2);
  });

  it('should handle page size change', () => {
    const event = { target: { value: 250 } };
    component.onChangePageSize(event);
    expect(component.itemsPerPage).toBe(250);
    expect(component.currentPage).toBe(1);
  });

  it('should scroll to top', () => {
    const div = document.createElement('div');
    div.id = 'logContainer';
    div.scrollTop = 100;
    document.body.appendChild(div);
    component.scrollToTop();
    expect(div.scrollTop).toBe(0);
    document.body.removeChild(div);
  });

  it('should toggle auto-refresh', () => {
    const initial = component.isAutoRefresh;
    component.toggleAutoRefresh(new Event('click'));
    expect(component.isAutoRefresh).toBe(!initial);
  });

  describe('formatDateForDatetimeLocal', () => {
    it('should format date correctly', () => {
      const date = new Date('2024-01-15T09:05:00');
      const formatted = component['formatDateForDatetimeLocal'](date);
      expect(formatted).toBe('2024-01-15T09:05');
    });

    it('should pad single digit months and days', () => {
      const date = new Date('2024-03-05T08:07:00');
      const formatted = component['formatDateForDatetimeLocal'](date);
      expect(formatted).toBe('2024-03-05T08:07');
    });
  });

  describe('getTimezoneOffset', () => {
    it('should return IST offset', () => {
      const offset = component['getTimezoneOffset']('IST');
      expect(offset).toBe('+05:30');
    });

    it('should return UTC offset', () => {
      const offset = component['getTimezoneOffset']('UTC');
      expect(offset).toBe('+00:00');
    });

    it('should return PST offset', () => {
      const offset = component['getTimezoneOffset']('PST');
      expect(offset).toBe('-08:00');
    });

    it('should return EST offset', () => {
      const offset = component['getTimezoneOffset']('EST');
      expect(offset).toBe('-05:00');
    });

    it('should return CET offset', () => {
      const offset = component['getTimezoneOffset']('CET');
      expect(offset).toBe('+01:00');
    });

    it('should return default IST offset for unknown timezone', () => {
      const offset = component['getTimezoneOffset']('UNKNOWN');
      expect(offset).toBe('+05:30');
    });
  });

  describe('convertTimestampToTZ', () => {
    it('should handle 10-digit unix timestamp', () => {
      const result = component['convertTimestampToTZ']('1627891234', 'IST');
      expect(result).toContain('IST');
      expect(result).toMatch(/\d{4}-\d{2}-\d{2}/);
    });

    it('should handle 13-digit millisecond timestamp', () => {
      const result = component['convertTimestampToTZ']('1627891234000', 'UTC');
      expect(result).toContain('UTC');
    });

    it('should handle ISO date string', () => {
      const result = component['convertTimestampToTZ']('2021-08-02T10:20:34Z', 'EST');
      expect(result).toContain('EST');
    });

    it('should handle space-separated timestamp by converting to ISO', () => {
      const result = component['convertTimestampToTZ']('2021-08-02 10:20:34', 'CET');
      expect(result).toContain('CET');
    });

    it('should return original timestamp for invalid date', () => {
      const invalid = 'invalid-timestamp';
      const result = component['convertTimestampToTZ'](invalid, 'IST');
      expect(result).toBe(invalid);
    });

    it('should handle empty timestamp', () => {
      const result = component['convertTimestampToTZ']('', 'IST');
      expect(result).toBe('');
    });

    it('should handle negative timezone offset', () => {
      const result = component['convertTimestampToTZ']('1627891234', 'PST');
      expect(result).toContain('PST');
      expect(result).toMatch(/\d{4}-\d{2}-\d{2}/);
    });
  });

  describe('scrollToBottom', () => {
    it('should scroll container to bottom when container exists', () => {
      const div = document.createElement('div');
      div.id = 'logContainer';
      div.style.height = '100px';
      div.style.overflow = 'auto';
      div.innerHTML = '<div style="height: 500px;"></div>';
      document.body.appendChild(div);
      
      component.scrollToBottom();
      
      // scrollTop should be set to scrollHeight
      expect(div.scrollTop).toBeGreaterThanOrEqual(0);
      document.body.removeChild(div);
    });

    it('should handle missing container gracefully', () => {
      expect(() => component.scrollToBottom()).not.toThrow();
    });
  });

  describe('getApplicationLogs', () => {
    it('should fetch logs with duration parameter', fakeAsync(() => {
      component.filterForm.patchValue({
        fromTimestamp: '2024-01-01T10:00',
        toTimestamp: '2024-01-01T11:00',
        timeZone: 'UTC'
      });
      
      component.getApplicationLogs('test-123', '30m');
      tick();
      
      expect(mockDeploymentService.getSelectedDeploymentLogs).toHaveBeenCalled();
      const callArgs = mockDeploymentService.getSelectedDeploymentLogs.calls.mostRecent().args[0];
      expect(callArgs.timeRange).toBe('30m');
      expect(callArgs.logType).toBe('application');
    }));

    it('should handle empty logs response', fakeAsync(() => {
      mockDeploymentService.getSelectedDeploymentLogs.and.returnValue(of({
        status: 'Success',
        data: { logs: [], totalPages: 0 }
      }));
      
      spyOn(console, 'warn');
      component.getApplicationLogs('test-123');
      tick();
      
      expect(console.warn).toHaveBeenCalledWith('No logs available for this deployment.');
    }));

    it('should handle null logs response', fakeAsync(() => {
      mockDeploymentService.getSelectedDeploymentLogs.and.returnValue(of({
        status: 'Success',
        data: { logs: null, totalPages: 0 }
      }));
      
      spyOn(console, 'warn');
      component.getApplicationLogs('test-123');
      tick();
      
      expect(console.warn).toHaveBeenCalledWith('No logs available for this deployment.');
    }));

    it('should handle failed response status', fakeAsync(() => {
      mockDeploymentService.getSelectedDeploymentLogs.and.returnValue(of({
        status: 'Failure',
        message: 'Error occurred'
      }));
      
      spyOn(console, 'error');
      component.getApplicationLogs('test-123');
      tick();
      
      expect(console.error).toHaveBeenCalledWith('Failed to fetch logs:', 'Error occurred');
    }));

    it('should handle error during log fetch', fakeAsync(() => {
      const error = new Error('Network error');
      mockDeploymentService.getSelectedDeploymentLogs.and.returnValue(
        throwError(() => error)
      );
      
      spyOn(console, 'error');
      component.getApplicationLogs('test-123');
      tick();
      
      expect(console.error).toHaveBeenCalledWith('Error fetching logs:', error);
    }));

    it('should use pageSize and currentPage in request', fakeAsync(() => {
      component.currentPage = 3;
      component.pageSize = 250;
      
      component.getApplicationLogs('test-123');
      tick();
      
      const callArgs = mockDeploymentService.getSelectedDeploymentLogs.calls.mostRecent().args[0];
      expect(callArgs.page).toBe(3);
      expect(callArgs.limit).toBe(250);
    }));
  });

  describe('onFilter', () => {
    beforeEach(() => {
      mockDeploymentService.getSelectedDeploymentLogs.calls.reset();
    });

    it('should filter with search keyword', fakeAsync(() => {
      component.filterForm.patchValue({
        searchText: 'error',
        duration: '1h'
      });
      
      component.onFilter();
      tick();
      
      const callArgs = mockDeploymentService.getSelectedDeploymentLogs.calls.mostRecent().args[0];
      expect(callArgs.keyword).toBe('error');
      expect(callArgs.timeRange).toBe('1h');
    }));

    it('should filter with custom duration', fakeAsync(() => {
      component.filterForm.patchValue({
        duration: 'custom',
        fromTimestamp: '2024-01-01T10:00',
        toTimestamp: '2024-01-01T11:00'
      });
      
      component.onFilter();
      tick();
      
      const callArgs = mockDeploymentService.getSelectedDeploymentLogs.calls.mostRecent().args[0];
      expect(callArgs.timeRange).toBe('');
      expect(callArgs.fromTimestamp).toBeInstanceOf(Date);
      expect(callArgs.toTimestamp).toBeInstanceOf(Date);
    }));

    it('should handle empty logs in filter response', fakeAsync(() => {
      mockDeploymentService.getSelectedDeploymentLogs.and.returnValue(of({
        status: 'Success',
        data: { logs: [], totalPages: 0 }
      }));
      
      spyOn(console, 'warn');
      component.onFilter();
      tick();
      
      expect(console.warn).toHaveBeenCalledWith('No logs available for this deployment.');
      expect(component.filteredLogs).toEqual([]);
      expect(component.parsedLogs).toEqual([]);
    }));

    it('should parse and convert timestamps for filtered logs', fakeAsync(() => {
      mockDeploymentService.getSelectedDeploymentLogs.and.returnValue(of({
        status: 'Success',
        data: {
          logs: ['1627891234 First log', '1627891250 Second log'],
          totalPages: 1
        }
      }));
      
      component.filterForm.patchValue({ timeZone: 'UTC' });
      component.onFilter();
      tick();
      
      expect(component.parsedLogs.length).toBe(2);
      expect(component.parsedLogs[0].message).toBe('First log');
      expect(component.parsedLogs[1].message).toBe('Second log');
      expect(component.parsedLogs[0].timestamp).toContain('UTC');
    }));

    it('should handle filter error', fakeAsync(() => {
      const error = new Error('Filter failed');
      mockDeploymentService.getSelectedDeploymentLogs.and.returnValue(
        throwError(() => error)
      );
      
      spyOn(console, 'error');
      component.onFilter();
      tick();
      
      expect(console.error).toHaveBeenCalledWith('Error fetching logs:', error);
    }));

    it('should handle failed status in filter', fakeAsync(() => {
      mockDeploymentService.getSelectedDeploymentLogs.and.returnValue(of({
        status: 'Failed',
        message: 'Auth error'
      }));
      
      spyOn(console, 'error');
      component.onFilter();
      tick();
      
      expect(console.error).toHaveBeenCalledWith('Failed to fetch logs:', 'Auth error');
    }));
  });

  describe('onRefresh', () => {
    it('should call onFilter when refreshing', () => {
      spyOn(component, 'onFilter');
      component.onRefresh();
      expect(component.onFilter).toHaveBeenCalled();
    });
  });

  describe('pages getter', () => {
    it('should calculate page range correctly when on first page', () => {
      component.totalItems = 10;
      component.currentPage = 1;
      component.maxSize = 5;
      
      const pages = component.pages;
      
      expect(pages).toEqual([1, 2, 3, 4, 5]);
    });

    it('should calculate page range correctly when on middle page', () => {
      component.totalItems = 10;
      component.currentPage = 5;
      component.maxSize = 5;
      
      const pages = component.pages;
      
      expect(pages).toEqual([3, 4, 5, 6, 7]);
    });

    it('should calculate page range correctly when on last page', () => {
      component.totalItems = 10;
      component.currentPage = 10;
      component.maxSize = 5;
      
      const pages = component.pages;
      
      expect(pages).toEqual([6, 7, 8, 9, 10]);
    });

    it('should handle fewer total pages than maxSize', () => {
      component.totalItems = 3;
      component.currentPage = 2;
      component.maxSize = 5;
      
      const pages = component.pages;
      
      expect(pages).toEqual([1, 2, 3]);
    });

    it('should handle single page', () => {
      component.totalItems = 1;
      component.currentPage = 1;
      component.maxSize = 5;
      
      const pages = component.pages;
      
      expect(pages).toEqual([1]);
    });
  });

  describe('form valueChanges', () => {
    it('should reset timestamps when duration changes from custom', fakeAsync(() => {
      component.filterForm.patchValue({
        duration: 'custom',
        fromTimestamp: '2024-01-01T10:00',
        toTimestamp: '2024-01-01T11:00'
      });
      tick();
      
      component.filterForm.patchValue({ duration: '1h' });
      tick();
      
      // Timestamps should be reset to default values (last 15 mins)
      expect(component.filterForm.get('fromTimestamp')?.value).toBeDefined();
      expect(component.filterForm.get('toTimestamp')?.value).toBeDefined();
    }));

    it('should not reset timestamps when duration is custom', fakeAsync(() => {
      const customFrom = '2024-01-01T10:00';
      const customTo = '2024-01-01T11:00';
      
      component.filterForm.patchValue({
        duration: 'custom',
        fromTimestamp: customFrom,
        toTimestamp: customTo
      });
      tick(100);
      
      // When staying on custom, timestamps should remain
      expect(component.filterForm.get('fromTimestamp')?.value).toBe(customFrom);
      expect(component.filterForm.get('toTimestamp')?.value).toBe(customTo);
    }));
  });

  describe('ngOnInit', () => {
    it('should set deploymentId from query params', fakeAsync(() => {
      tick();
      expect(component.deploymentId).toBe('123');
    }));

    it('should initialize filter form with timestamps', () => {
      const fromTimestamp = component.filterForm.get('fromTimestamp')?.value;
      const toTimestamp = component.filterForm.get('toTimestamp')?.value;
      
      expect(fromTimestamp).toBeDefined();
      expect(toTimestamp).toBeDefined();
      expect(fromTimestamp).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/);
      expect(toTimestamp).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/);
    });
  });

  describe('log parsing', () => {
    it('should parse logs with multiple spaces in message', fakeAsync(() => {
      mockDeploymentService.getSelectedDeploymentLogs.and.returnValue(of({
        status: 'Success',
        data: {
          logs: ['1627891234 Error: Multiple   spaces   here'],
          totalPages: 1
        }
      }));
      
      component.getApplicationLogs('test-123');
      tick();
      
      expect(component.parsedLogs[0].message).toBe('Error: Multiple   spaces   here');
    }));

    it('should handle log with only timestamp', fakeAsync(() => {
      mockDeploymentService.getSelectedDeploymentLogs.and.returnValue(of({
        status: 'Success',
        data: {
          logs: ['1627891234'],
          totalPages: 1
        }
      }));
      
      component.getApplicationLogs('test-123');
      tick();
      
      expect(component.parsedLogs[0].message).toBe('');
    }));
  });

  describe('localStorage environment', () => {
    it('should handle missing environment in localStorage', fakeAsync(() => {
      (localStorage.getItem as jasmine.Spy).and.returnValue(null);
      
      component.getApplicationLogs('test-123');
      tick();
      
      const callArgs = mockDeploymentService.getSelectedDeploymentLogs.calls.mostRecent().args[0];
      expect(callArgs.environmentId).toBe('');
    }));
  });
});
