import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TOAST_CONFIG, ToastrService } from 'ngx-toastr';

import { DeploymentListComponent } from './deployment-list.component';
import { SharedService } from '../../../shared/services/shared.service';
import { LLMDeploymentsService } from '../llm-deployment.service';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
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
});
