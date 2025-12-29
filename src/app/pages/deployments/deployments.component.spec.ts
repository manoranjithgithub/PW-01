import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DeploymentsComponent } from './deployments.component';
import { DeploymentsService } from './deployment.service';
import { SharedService } from '../../shared/services/shared.service';
import { Router } from '@angular/router';
import { of, Subject } from 'rxjs';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ToastrService } from 'ngx-toastr';
import { PermissionService } from 'src/app/shared/services/permission.service';

// Mock services
class MockDeploymentsService {
  liveDeploymentData(envId: string) {
    return of({ deployment: [{ id: '1', name: 'Test Deployment', status: 'Active' }] });
  }
}

class MockSharedService {
  envValueChange$ = new Subject<any>();
  valueChange$ = new Subject<any>();
  isLoading$ = new Subject<boolean>();
  getStatusMeta(status: string) {
    return { statusClass: 'status-class', icon: 'bi-check', label: status || '' };
  }
}

class MockRouter {
  url = '/deployment';
  navigate = jasmine.createSpy('navigate');
}

describe('DeploymentsComponent', () => {
  let component: DeploymentsComponent;
  let fixture: ComponentFixture<DeploymentsComponent>;
  let sharedService: MockSharedService;
  let router: MockRouter;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [DeploymentsComponent, HttpClientTestingModule],
      providers: [
            { provide: DeploymentsService, useClass: MockDeploymentsService },
            { provide: ToastrService, useValue: jasmine.createSpyObj(['success', 'error']) },
            { provide: PermissionService, useValue: { canAdminGlobal: () => true, canWriteGlobal: () => true, canDeleteForCurrentUser: () => true, canWriteForCurrentUser: () => true } },
        { provide: SharedService, useClass: MockSharedService },
        { provide: Router, useClass: MockRouter },
      ]
    });

    TestBed.overrideComponent(DeploymentsComponent, {
      set: {
        providers: [{ provide: DeploymentsService, useClass: MockDeploymentsService }]
      }
    });

    await TestBed.compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DeploymentsComponent);
    component = fixture.componentInstance;
    sharedService = TestBed.inject(SharedService) as unknown as MockSharedService;
    router = TestBed.inject(Router) as unknown as MockRouter;

    localStorage.setItem('environment', JSON.stringify({ id: 'env1' }));

    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize table data from service', (done) => {
    component.getDeployment({ id: 'env1' });
    fixture.detectChanges();

    setTimeout(() => {
      expect(component.tableData.length).toBe(1);
      expect(component.tableData[0].name).toBe('Test Deployment');
      done();
    }, 0);
  });

  it('should update table data correctly', () => {
    const newData = [{ id: '1', name: 'Updated Deployment', status: 'Inactive' }];
    component.tableData = [{ id: '1', name: 'Test Deployment', status: 'Active' }];
    component.updateTableData(newData);
    expect(component.tableData[0].name).toBe('Updated Deployment');
    expect(component.tableData[0].status).toBe('Inactive');
  });

  it('should navigate to deployment details on gotoAction', () => {
    const params = { id: '1' };
    component.gotoAction(params);
    expect(router.navigate).toHaveBeenCalledWith(['/deployment/deployment-details'], { queryParams: { id: '1' } });
  });

  it('should navigate to create deployment page', () => {
    component.goToNewDeployment();
    expect(router.navigate).toHaveBeenCalledWith(['/deployment/create-deployment']);
  });

  it('should render status cell correctly', () => {
    const params = { value: 'Active' };
    const result = component.statusCellRenderer(params);
    expect(result).toContain('status-class');
    expect(result).toContain('bi-check');
    expect(result).toContain('active');
  });

  it('should unsubscribe on destroy', () => {
    spyOn(component.sseSub!, 'unsubscribe');
    spyOn(component.subscription!, 'unsubscribe');
    component.ngOnDestroy();
    expect(component.sseSub!.unsubscribe).toHaveBeenCalled();
    expect(component.subscription!.unsubscribe).toHaveBeenCalled();
  });
});
