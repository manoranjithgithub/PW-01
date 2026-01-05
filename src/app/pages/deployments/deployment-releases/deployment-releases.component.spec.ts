import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DeploymentReleasesComponent } from './deployment-releases.component';
import { DeploymentsService } from '../deployment.service';
import { SharedService } from '../../../shared/services/shared.service';
import { ToastrService } from 'ngx-toastr';
import { ActivatedRoute } from '@angular/router';
import { of, Subject } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
class MockDeploymentsService {
  getDeploymentById() {
    return of({
      data: { id: 'dep1', name: 'Test Deployment' }
    });
  }

  getSelectedDeploymentLogs() {
    return of({
      status: 'success',
      data: {
        logs: ['2024-01-01 Log message'],
        totalPages: 2
      }
    });
  }
}

class MockSharedService {
  releaseStatus$ = of([]);

  getStatusMeta(status: string) {
    return {
      icon: 'icon-' + status,
      statusClass: 'class-' + status
    };
  }
}

class MockToastrService {
  error = jasmine.createSpy('error');
}

class MockActivatedRoute {
  queryParams = of({ id: 'dep1' });
}

describe('DeploymentReleasesComponent (logic)', () => {
  let component: DeploymentReleasesComponent;
  let fixture: ComponentFixture<DeploymentReleasesComponent>;
  let toaster: MockToastrService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeploymentReleasesComponent,HttpClientTestingModule,BrowserAnimationsModule],
      providers: [
        { provide: DeploymentsService, useClass: MockDeploymentsService },
        { provide: SharedService, useClass: MockSharedService },
        { provide: ToastrService, useClass: MockToastrService },
        { provide: ActivatedRoute, useClass: MockActivatedRoute }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    });

    TestBed.overrideComponent(DeploymentReleasesComponent, {
      set: {
        providers: [
          { provide: DeploymentsService, useClass: MockDeploymentsService }
        ]
      }
    });

    await TestBed.compileComponents();

    fixture = TestBed.createComponent(DeploymentReleasesComponent);
    component = fixture.componentInstance;
    toaster = TestBed.inject(ToastrService) as any;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });


  // it('should load deployment details on init', () => {
  //   expect(component.deploymentId).toBe('dep1');
  //   expect(component.deploymentdetails).toBeTruthy();
  // });

  it('should process releases and update steps', () => {
    const releases = [{
      status: 'success',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
      buildStartedAt: '2024-01-01'
    }];

    spyOn(component, 'updateSteps');
    component.getReleasesByDeploymentId(releases);

    expect(component.active).toBe(releases[0]);
    expect(component.updateSteps).toHaveBeenCalled();
  });

  it('should detect failed status in steps', () => {
    component.steps = [
      { title: 'Test', status: 'failed', time: '' }
    ];

    expect(component.hasFailedStatus()).toBeTrue();
  });

  it('should return class list from shared service', () => {
    const result = component.getClassList('success');
    expect(result).toContain('icon-success');
    expect(result).toContain('class-success');
  });

  it('should fetch logs successfully', () => {
    component.realeseId = 'rel1';
    component.selectedReleaseDetails = { jobName: 'job1' };

    spyOn(localStorage, 'getItem').and.returnValue(
      JSON.stringify({ id: 'env1' })
    );

    component.getLogData('build');

    expect(component.deploymentLogs.length).toBe(1);
    expect(component.totalPages).toBe(2);
  });

  it('should show error if releaseId is missing', () => {
    component.realeseId = '';
    component.selectedReleaseDetails = { jobName: '' } as any;
    component.getLogData('build');

    expect(toaster.error).toHaveBeenCalled();
  });

  it('should toggle light mode', () => {
    component.isLightMode = false;
    component.toggleMode(new Event('click'));
    expect(component.isLightMode).toBeTrue();
  });

  it('should toggle dropdown', () => {
    const event = new MouseEvent('click');
    spyOn(event, 'stopPropagation');

    component.toggleDropdown('active', event);
    expect(component.openDropdown).toBe('active');

    component.toggleDropdown('active', event);
    expect(component.openDropdown).toBeNull();
  });

  it('should close dropdown on outside click', () => {
    component.openDropdown = 'active';
    component.onOutsideClick();
    expect(component.openDropdown).toBeNull();
  });

  it('should calculate duration correctly', () => {
    const result = component.getDuration(
      '2024-01-01T00:00:00Z',
      '2024-01-01T01:01:01Z'
    );

    expect(result).toContain('1h');
    expect(result).toContain('1m');
    expect(result).toContain('1s');
  });

  it('should update page size and reload logs', () => {
    spyOn(component, 'getLogData');
    component.onPageSizeChange(
      { currentPage: 2, itemsPerPage: 250 },
      'build'
    );

    expect(component.currentPage).toBe(2);
    expect(component.pageSize).toBe(250);
    expect(component.getLogData).toHaveBeenCalled();
  });

  it('should generate steps for pending build', () => {
    component.active = {
      status: 'pending',
      createdAt: '2024-01-01',
      updatedAt: '',
      buildStartedAt: ''
    };

    component.updateSteps(component.active);

    expect(component.steps.length).toBeGreaterThan(1);
    expect(component.steps[1].status).toBe('pending');
  });

  it('should generate steps for paused deploy', () => {
    component.active = {
      status: 'paused',
      createdAt: '2024-01-01',
      updatedAt: '',
      buildStartedAt: ''
    };

    component.updateSteps(component.active);

    const deployStep = component.steps.at(-1);
    expect(deployStep?.status).toBe('paused');
  });

  it('should complete destroy$ on ngOnDestroy', () => {
    spyOn(component['destroy$'], 'next');
    spyOn(component['destroy$'], 'complete');

    component.ngOnDestroy();

    expect(component['destroy$'].next).toHaveBeenCalled();
    expect(component['destroy$'].complete).toHaveBeenCalled();
  });
});
