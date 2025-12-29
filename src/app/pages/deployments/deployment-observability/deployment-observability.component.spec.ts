import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { DeploymentObservabilityComponent } from './deployment-observability.component';
import { DeploymentsService } from '../deployment.service';
import { FormBuilder, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { of } from 'rxjs';
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
});
