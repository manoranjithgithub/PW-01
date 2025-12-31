import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActionCellRendererComponent } from './action-cell-renderer.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService, TOAST_CONFIG } from 'ngx-toastr';
import { DeploymentsService } from '../../services/deployments.service';
import { SharedService } from '../../services/shared.service';
import { PermissionService } from '../../services/permission.service';
import { of, throwError } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { toastConfigMock } from '../../../../test-helpers/testing-mocks';

describe('ActionCellRendererComponent', () => {
  let component: ActionCellRendererComponent;
  let fixture: ComponentFixture<ActionCellRendererComponent>;

  let routerSpy: jasmine.SpyObj<Router>;
  let modalSpy: jasmine.SpyObj<NgbModal>;
  let toastrSpy: jasmine.SpyObj<ToastrService>;
  let deploymentServiceSpy: jasmine.SpyObj<DeploymentsService>;

  beforeEach(async () => {
    // Mock localStorage to prevent JSON.parse errors in component constructor
    spyOn(localStorage, 'getItem').and.callFake((key: string) => {
      if (key === 'environment') {
        return JSON.stringify({ id: 'env-123' });
      }
      if (key === 'project') {
        return JSON.stringify({ id: 'proj-123' });
      }
      return null;
    });

    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    modalSpy = jasmine.createSpyObj('NgbModal', ['open']);
    toastrSpy = jasmine.createSpyObj('ToastrService', ['success', 'error']);
    deploymentServiceSpy = jasmine.createSpyObj('DeploymentsService', [
      'updateDeployment',
      'deleteTools',
      'getReleasesViewByDeploymentId',
      'getDeploymentViewLogs'
    ]);

    await TestBed.configureTestingModule({
      imports: [ActionCellRendererComponent, HttpClientTestingModule],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: NgbModal, useValue: modalSpy },
        { provide: ToastrService, useValue: toastrSpy },
        { provide: DeploymentsService, useValue: deploymentServiceSpy },
        { provide: SharedService, useValue: {} },
        { provide: PermissionService, useValue: {} },
        { provide: TOAST_CONFIG, useValue: toastConfigMock }
      ],
      schemas: [NO_ERRORS_SCHEMA] // Ignore CoreUI / modal templates
    });

    TestBed.overrideComponent(ActionCellRendererComponent as any, {
      set: {
        providers: [
          { provide: DeploymentsService, useValue: deploymentServiceSpy }
        ]
      }
    });

    await TestBed.compileComponents();

    fixture = TestBed.createComponent(ActionCellRendererComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create component', () => {
    expect(component).toBeTruthy();
  });

  describe('agInit()', () => {
    it('should initialize params and user verification flag', () => {
      const params = {
        data: { isVerfied: true },
        additionalParam: 'deployment'
      };

      component.agInit(params);

      expect(component.params).toEqual(params);
      expect(component.additionalParam).toBe('deployment');
      expect(component.isUserVerified).toBeTrue();
    });
  });

  describe('refresh()', () => {
    it('should refresh params and update verification flag', () => {
      const params = {
        data: { isVerfied: 'true' }
      };

      const result = component.refresh(params);

      expect(result).toBeTrue();
      expect(component.isUserVerified).toBeTrue();
    });
  });

  describe('onActionSelected()', () => {
    beforeEach(() => {
      component.params = { data: { id: '123', name: 'test' } };
    });

    it('should call edit()', () => {
      spyOn(component, 'edit');
      component.onActionSelected('edit');
      expect(component.edit).toHaveBeenCalled();
    });

    it('should call delete()', () => {
      spyOn(component, 'delete');
      component.onActionSelected('delete');
      expect(component.delete).toHaveBeenCalled();
    });

    it('should call restart()', () => {
      spyOn(component, 'restart');
      component.onActionSelected('redeploy');
      expect(component.restart).toHaveBeenCalled();
    });
  });

  describe('edit()', () => {
    it('should navigate to edit deployment', () => {
      component.additionalParam = 'deployment';
      component.edit({ name: 'demo' });

      expect(routerSpy.navigate).toHaveBeenCalledWith(
        ['/edit-deployment'],
        { queryParams: { id: 'demo' } }
      );
    });
  });

  describe('viewLogs()', () => {
    it('should navigate to llm deployment details', () => {
      component.additionalParam = 'llm';
      component.params = { data: { id: '1' } };

      component.viewLogs();

      expect(routerSpy.navigate).toHaveBeenCalledWith(
        ['/llm/deployment-details'],
        { queryParams: { id: '1', tabIndex: 1 } }
      );
    });
  });

  describe('pause()', () => {
    it('should call updateDeployment on confirm', async () => {
      component.additionalParam = 'deployment';

      modalSpy.open.and.returnValue({
        componentInstance: {},
        result: Promise.resolve(true)
      } as any);

      deploymentServiceSpy.updateDeployment.and.returnValue(
        of({ status: 'SUCCESS' })
      );

      component.pause({ id: '1' }, 'Pause');

      await fixture.whenStable();

      expect(deploymentServiceSpy.updateDeployment).toHaveBeenCalled();
      expect(toastrSpy.success).toHaveBeenCalledWith('Successfully initiated');
    });

    it('should show error toast on failure', async () => {
      component.additionalParam = 'deployment';

      modalSpy.open.and.returnValue({
        componentInstance: {},
        result: Promise.resolve(true)
      } as any);

      deploymentServiceSpy.updateDeployment.and.returnValue(
        throwError(() => new Error('error'))
      );

      component.pause({ id: '1' }, 'Pause');

      await fixture.whenStable();

      expect(toastrSpy.error).toHaveBeenCalled();
    });
  });

  describe('restart()', () => {
    it('should redeploy successfully', async () => {
      component.additionalParam = 'deployment';
      component.params = { data: { id: '1', sourceCode: 'git' } };

      modalSpy.open.and.returnValue({
        componentInstance: {},
        result: Promise.resolve(true)
      } as any);

      deploymentServiceSpy.updateDeployment.and.returnValue(
        of({ status: 'SUCCESS' })
      );

      component.restart(component.params.data);

      await fixture.whenStable();

      expect(deploymentServiceSpy.updateDeployment).toHaveBeenCalled();
      expect(toastrSpy.success).toHaveBeenCalledWith('Redeploy initiated');
    });
  });

  describe('toggleDropdown()', () => {
    it('should toggle dropdown open state', () => {
      const event = new MouseEvent('click');
      const btn = document.createElement('button');
      component.toggleDropdown(event, btn);

      expect(component.isDropdownOpen).toBeTrue();
    });
  });

  describe('onOutsideClick()', () => {
    it('should close dropdown when clicking outside', () => {
      component.isDropdownOpen = true;

      const event = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(event, 'target', {
        value: document.createElement('div')
      });

      component.onOutsideClick(event);

      expect(component.isDropdownOpen).toBeFalse();
    });
  });

  describe('openConfirmationDialog() and delete tools flow', () => {
    // it('should call deleteTools and show success when confirmed and param tools', async () => {
    //   component.additionalParam = 'tools';
    //   component.toolsDetails = { name: 'tool1', namespace: 'ns1' } as any;

    //   modalSpy.open.and.returnValue({ componentInstance: {}, result: Promise.resolve(true) } as any);
    //   deploymentServiceSpy.deleteTools.and.returnValue(of({ status: true }));

    //   // attempt to spy on window.location.reload safely; some environments disallow it
    //   let reloadSpy: jasmine.Spy | undefined;
    //   try {
    //     // Spy if writable in this environment
    //     reloadSpy = spyOn((window as any).location, 'reload' as any).and.callFake(() => {});
    //   } catch (e) {
    //     reloadSpy = undefined;
    //   }

    //   component.openConfirmationDialog();
    //   await fixture.whenStable();

    //   expect(deploymentServiceSpy.deleteTools).toHaveBeenCalled();
    //   expect(toastrSpy.success).toHaveBeenCalledWith('Deleted Successfully');
    //   if (reloadSpy) {
    //     expect(reloadSpy).toHaveBeenCalled();
    //   }
    // });

    it('should not call deleteTools when confirmation is cancelled', async () => {
      component.additionalParam = 'tools';
      component.toolsDetails = { name: 'tool2', namespace: 'ns2' } as any;

      modalSpy.open.and.returnValue({ componentInstance: {}, result: Promise.resolve(false) } as any);
      deploymentServiceSpy.deleteTools.and.returnValue(of({ status: true }));

      component.openConfirmationDialog();
      await fixture.whenStable();

      expect(deploymentServiceSpy.deleteTools).not.toHaveBeenCalled();
      expect(toastrSpy.success).not.toHaveBeenCalledWith('Deleted Successfully');
    });

    it('should NOT show success when deleteTools returns false status', async () => {
      component.additionalParam = 'tools';
      component.toolsDetails = { name: 'tool3', namespace: 'ns3' } as any;

      modalSpy.open.and.returnValue({ componentInstance: {}, result: Promise.resolve(true) } as any);
      deploymentServiceSpy.deleteTools.and.returnValue(of({ status: false }));

      // try to spy on reload but safe-guarded in environment
      let reloadSpy: jasmine.Spy | undefined;
      try { reloadSpy = spyOn((window as any).location, 'reload' as any).and.callFake(() => { }); } catch (e) { reloadSpy = undefined; }

      component.openConfirmationDialog();
      await fixture.whenStable();

      expect(deploymentServiceSpy.deleteTools).toHaveBeenCalled();
      expect(toastrSpy.success).not.toHaveBeenCalledWith('Deleted Successfully');
      if (reloadSpy) {
        expect(reloadSpy).not.toHaveBeenCalled();
      }
    });
  });

  describe('logs and releases', () => {
    it('should get releases and call viewLogsa', () => {
      const fakeReleases = { data: [{ id: 'r1' }, { id: 'r2' }] };
      deploymentServiceSpy.getReleasesViewByDeploymentId.and.returnValue(of(fakeReleases));
      spyOn(component, 'viewLogsa');
      component.deploymentId = 'd1';
      component.getReleasesByDeploymentId();
      expect(deploymentServiceSpy.getReleasesViewByDeploymentId).toHaveBeenCalledWith('d1');
      expect(component.viewLogsa).toHaveBeenCalledWith(fakeReleases.data[0]);
    });

    it('should fetch logs and update paginatedLogs on success', () => {
      component.realeseId = 'r1';
      const lines = ['2025-01-01 log1', '2025-01-02 log2', '2025-01-03 log3'];
      deploymentServiceSpy.getDeploymentViewLogs.and.returnValue(of({ status: 'success', data: lines }));

      component.deploymentLogs = [];
      component.currentPage = 1;
      component.pageSize = 2;

      component.getLogData(0, 'build');

      expect(deploymentServiceSpy.getDeploymentViewLogs).toHaveBeenCalledWith('r1', 'build');
      expect(component.deploymentLogs.length).toBe(3);
      expect(component.paginatedLogs.length).toBe(2);
    });

    it('should show error toast when logs response is not success', () => {
      component.realeseId = 'r1';
      deploymentServiceSpy.getDeploymentViewLogs.and.returnValue(of({ status: 'error', message: 'oops' }));
      component.getLogData(0, 'build');
      expect(toastrSpy.error).toHaveBeenCalledWith('oops');
    });

    it('should show invalid id error when release id missing', () => {
      component.realeseId = ''; // missing
      component.getLogData(0, 'build');
      expect(toastrSpy.error).toHaveBeenCalledWith('Invalid release ID or type');
    });
  });

  describe('view and policies actions', () => {
    it('should navigate to view-tool when additionalParam is tools', () => {
      component.additionalParam = 'tools';
      component.view({ name: 'toolX' } as any);
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/tools/view-tool'], { queryParams: { selectedView: 'toolX' } });
    });

    it('should alert when additionalParam is user-list', () => {
      spyOn(window, 'alert');
      component.additionalParam = 'user-list';
      component.view({} as any);
      expect(window.alert).toHaveBeenCalledWith('user-list');
    });

    it('viewPolicies and editPolicies should call params.onActionClick', () => {
      const onAction = jasmine.createSpy('onAction');
      component.params = { onActionClick: onAction, data: { id: 'x' } } as any;
      component.viewPolicies();
      component.editPolicies();
      expect(onAction).toHaveBeenCalledTimes(2);
    });
  });

  describe('scroll and UI helpers', () => {
    it('should toggle mode', () => {
      const prev = component.isLightMode;
      component.toggleMode(new Event('click'));
      expect(component.isLightMode).toBe(!prev);
    });

    it('should scrollToTop and scrollToend use native scroll', (done) => {
      const native = {
        scrollTo: jasmine.createSpy('scrollTo'),
        scrollHeight: 1000
      } as any;
      component.scrollContainer = { nativeElement: native } as any;
      component.deploymentLogs = Array(10).fill({ timestamp: '', message: '' });
      component.pageSize = 2;
      component.currentPage = 1;

      component.scrollToTop();
      expect(native.scrollTo).toHaveBeenCalled();

      // make totalPages > currentPage to trigger scrollToend progression
      component.currentPage = 1;
      component.pageSize = 2;
      // call scrollToend and allow timeouts to execute
      component.scrollToend();
      setTimeout(() => {
        expect(native.scrollTo).toHaveBeenCalled();
        done();
      }, 500);
    });

    it('should not close dropdown when clicking inside menu or button', () => {
      component.isDropdownOpen = true;

      // simulate click inside floating-dropdown
      const insideMenu = document.createElement('div');
      insideMenu.classList.add('floating-dropdown');
      const eventMenu = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(eventMenu, 'target', { value: insideMenu });
      component.onOutsideClick(eventMenu);
      expect(component.isDropdownOpen).toBeTrue();

      // simulate click inside button
      const insideBtn = document.createElement('button');
      insideBtn.classList.add('btn-icon');
      const eventBtn = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(eventBtn, 'target', { value: insideBtn });
      component.onOutsideClick(eventBtn);
      expect(component.isDropdownOpen).toBeTrue();
    });
  });
});
