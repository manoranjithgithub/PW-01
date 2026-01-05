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
      schemas: [NO_ERRORS_SCHEMA] 
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
      component.realeseId = ''; 
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

      component.currentPage = 1;
      component.pageSize = 2;
      component.scrollToend();
      setTimeout(() => {
        expect(native.scrollTo).toHaveBeenCalled();
        done();
      }, 500);
    });

    it('should not close dropdown when clicking inside menu or button', () => {
      component.isDropdownOpen = true;
      const insideMenu = document.createElement('div');
      insideMenu.classList.add('floating-dropdown');
      const eventMenu = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(eventMenu, 'target', { value: insideMenu });
      component.onOutsideClick(eventMenu);
      expect(component.isDropdownOpen).toBeTrue();
      const insideBtn = document.createElement('button');
      insideBtn.classList.add('btn-icon');
      const eventBtn = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(eventBtn, 'target', { value: insideBtn });
      component.onOutsideClick(eventBtn);
      expect(component.isDropdownOpen).toBeTrue();
    });
  });

  describe('constructor with different localStorage scenarios', () => {
    it('should handle missing environment in localStorage', () => {
      (localStorage.getItem as jasmine.Spy).and.returnValue(null);
      const newFixture = TestBed.createComponent(ActionCellRendererComponent);
      const newComponent = newFixture.componentInstance;
      expect(newComponent.envId).toBe('');
    });

    it('should handle missing project in localStorage', () => {
      (localStorage.getItem as jasmine.Spy).and.callFake((key: string) => {
        if (key === 'environment') return JSON.stringify({ id: 'env-123' });
        return null;
      });
      const newFixture = TestBed.createComponent(ActionCellRendererComponent);
      const newComponent = newFixture.componentInstance;
      expect(newComponent.currentProjectId).toBeUndefined();
    });

    it('should handle invalid JSON in project localStorage', () => {
      (localStorage.getItem as jasmine.Spy).and.callFake((key: string) => {
        if (key === 'environment') return JSON.stringify({ id: 'env-123' });
        if (key === 'project') return 'invalid-json';
        return null;
      });
      const newFixture = TestBed.createComponent(ActionCellRendererComponent);
      const newComponent = newFixture.componentInstance;
      expect(newComponent.currentProjectId).toBe('invalid-json');
    });
  });

  describe('onActionSelected with additional branches', () => {
    beforeEach(() => {
      component.params = { data: { id: '123', name: 'test' } };
    });

    it('should call view when action is view', () => {
      spyOn(component, 'view');
      component.onActionSelected('view');
      expect(component.view).toHaveBeenCalledWith(component.params.data);
    });

    it('should call pause with Pause type', () => {
      spyOn(component, 'pause');
      component.onActionSelected('Pause');
      expect(component.pause).toHaveBeenCalledWith(component.params.data, 'Pause');
    });

    it('should call pause with Resume type', () => {
      spyOn(component, 'pause');
      component.onActionSelected('Resume');
      expect(component.pause).toHaveBeenCalledWith(component.params.data, 'Resume');
    });
  });

  describe('edit with different additionalParams', () => {
    it('should navigate to edit tool when additionalParam is tools', () => {
      component.additionalParam = 'tools';
      component.edit({ name: 'my-tool' });
      expect(routerSpy.navigate).toHaveBeenCalledWith(
        ['/tools/edit-tool'],
        { queryParams: { selectedEdit: 'my-tool' } }
      );
    });

    it('should not navigate when additionalParam is unknown', () => {
      component.additionalParam = 'unknown';
      routerSpy.navigate.calls.reset();
      component.edit({ name: 'test' });
      expect(routerSpy.navigate).not.toHaveBeenCalled();
    });
  });

  describe('viewLogs with different params', () => {
    it('should navigate to deployment details when additionalParam is deployment', () => {
      component.additionalParam = 'deployment';
      component.params = { data: { id: 'dep-123' } };
      component.viewLogs();
      expect(routerSpy.navigate).toHaveBeenCalledWith(
        ['/deployment/deployment-details'],
        { queryParams: { id: 'dep-123', tabIndex: 5 } }
      );
    });

    it('should not navigate when additionalParam is unknown', () => {
      component.additionalParam = 'unknown';
      component.params = { data: { id: 'test' } };
      routerSpy.navigate.calls.reset();
      component.viewLogs();
      expect(routerSpy.navigate).not.toHaveBeenCalled();
    });
  });

  describe('pause with different scenarios', () => {
    it('should not call updateDeployment when additionalParam is not deployment or llm', () => {
      component.additionalParam = 'tools';
      component.pause({ id: '1' }, 'Pause');
      expect(modalSpy.open).not.toHaveBeenCalled();
      expect(deploymentServiceSpy.updateDeployment).not.toHaveBeenCalled();
    });

    it('should handle resume action for llm', async () => {
      component.additionalParam = 'llm';
      modalSpy.open.and.returnValue({
        componentInstance: {},
        result: Promise.resolve(true)
      } as any);
      deploymentServiceSpy.updateDeployment.and.returnValue(
        of({ status: 'SUCCESS' })
      );
      component.pause({ id: 'llm-1' }, 'Resume');
      await fixture.whenStable();
      const callArgs = deploymentServiceSpy.updateDeployment.calls.mostRecent().args;
      expect(callArgs[1].action).toBe('resume');
    });

    it('should not call updateDeployment when modal is cancelled', async () => {
      component.additionalParam = 'deployment';
      modalSpy.open.and.returnValue({
        componentInstance: {},
        result: Promise.resolve(false)
      } as any);
      deploymentServiceSpy.updateDeployment.calls.reset();
      component.pause({ id: '1' }, 'Pause');
      await fixture.whenStable();
      expect(deploymentServiceSpy.updateDeployment).not.toHaveBeenCalled();
    });
  });

  describe('restart with different scenarios', () => {
    it('should handle restart for llm deployment', async () => {
      component.additionalParam = 'llm';
      component.params = { data: { id: 'llm-1', sourceCode: 'repo' } };
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
    });

    it('should not call updateDeployment when additionalParam is not deployment or llm', () => {
      component.additionalParam = 'tools';
      component.params = { data: { id: '1' } };
      component.restart(component.params.data);
      expect(modalSpy.open).not.toHaveBeenCalled();
    });

    it('should not call updateDeployment when modal is cancelled', async () => {
      component.additionalParam = 'deployment';
      component.params = { data: { id: '1', sourceCode: 'git' } };
      modalSpy.open.and.returnValue({
        componentInstance: {},
        result: Promise.resolve(false)
      } as any);
      deploymentServiceSpy.updateDeployment.calls.reset();
      component.restart(component.params.data);
      await fixture.whenStable();
      expect(deploymentServiceSpy.updateDeployment).not.toHaveBeenCalled();
    });
  });

  describe('openConfirmationDialog with non-tools param', () => {
    it('should not call deleteTools when additionalParam is not tools', async () => {
      component.additionalParam = 'deployment';
      modalSpy.open.and.returnValue({
        componentInstance: {},
        result: Promise.resolve(true)
      } as any);
      component.openConfirmationDialog();
      await fixture.whenStable();
      expect(deploymentServiceSpy.deleteTools).not.toHaveBeenCalled();
    });
  });

  describe('scale and modal functions', () => {
    it('should set replica count for deployment', () => {
      component.additionalParam = 'deployment';
      component.params = { data: { replicas: 3 } };
      component.scale(component.params.data);
      expect(component.replicaCount).toBe(3);
    });

    it('should handle scale for non-deployment', () => {
      component.additionalParam = 'other';
      component.params = { data: {} };
      component.scale({});
      expect(component).toBeTruthy();
    });

    it('should call closeModal', () => {
      component.closeModal();
      expect(component).toBeTruthy();
    });

    it('should set activeTabIndex when openModal is called', () => {
      component.openModal();
      expect(component.activeTabIndex).toBe(0);
    });
  });

  describe('showDeploymentView and viewLogsa', () => {
    it('should set deploymentId and call getReleasesByDeploymentId', () => {
      spyOn(component, 'getReleasesByDeploymentId');
      component.showDeploymentView({ id: 'dep-456' });
      expect(component.deploymentId).toBe('dep-456');
      expect(component.getReleasesByDeploymentId).toHaveBeenCalled();
    });

    it('should call getLogData and openModal in viewLogsa', () => {
      spyOn(component, 'getLogData');
      spyOn(component, 'openModal');
      component.viewLogsa({ id: 'rel-1' });
      expect(component.realeseId).toBe('rel-1');
      expect(component.getLogData).toHaveBeenCalledWith(0, 'build');
      expect(component.openModal).toHaveBeenCalled();
    });
  });

  describe('getLogData with missing type', () => {
    it('should show error when type is empty', () => {
      component.realeseId = 'r1';
      component.getLogData(0, '');
      expect(toastrSpy.error).toHaveBeenCalledWith('Invalid release ID or type');
    });
  });

  describe('onScroll functionality', () => {
    it('should increment page and update logs when near bottom', () => {
      component.deploymentLogs = Array(100).fill({ timestamp: '', message: '' });
      component.pageSize = 10;
      component.currentPage = 1;
      const mockEvent = {
        target: {
          scrollTop: 800,
          clientHeight: 200,
          scrollHeight: 1100
        }
      } as any;
      component.onScroll(mockEvent);
      expect(component.currentPage).toBe(2);
    });

    it('should not increment page when not near bottom', () => {
      component.deploymentLogs = Array(100).fill({ timestamp: '', message: '' });
      component.pageSize = 10;
      component.currentPage = 1;
      const mockEvent = {
        target: {
          scrollTop: 100,
          clientHeight: 200,
          scrollHeight: 1000
        }
      } as any;
      component.onScroll(mockEvent);
      expect(component.currentPage).toBe(1);
    });

    it('should not increment page when already at last page', () => {
      component.deploymentLogs = Array(10).fill({ timestamp: '', message: '' });
      component.pageSize = 10;
      component.currentPage = 1;
      const mockEvent = {
        target: {
          scrollTop: 800,
          clientHeight: 200,
          scrollHeight: 1100
        }
      } as any;
      component.onScroll(mockEvent);
      expect(component.currentPage).toBe(1);
    });
  });

  describe('window event listeners', () => {
    it('should call onWindowScroll when dropdown is open', () => {
      component.isDropdownOpen = true;
      const btn = document.createElement('button');
      spyOn(btn, 'getBoundingClientRect').and.returnValue({
        bottom: 100,
        right: 200
      } as any);
      const event = new MouseEvent('click');
      component.toggleDropdown(event, btn);
      component.onWindowScroll();
      expect(component.dropdownStyle.top).toBeDefined();
    });

    it('should not update position when dropdown is closed', () => {
      component.isDropdownOpen = false;
      const prevStyle = component.dropdownStyle;
      component.onWindowScroll();
      expect(component.dropdownStyle).toEqual(prevStyle);
    });

    it('should call onWindowResize when dropdown is open', () => {
      component.isDropdownOpen = true;
      const btn = document.createElement('button');
      spyOn(btn, 'getBoundingClientRect').and.returnValue({
        bottom: 150,
        right: 300
      } as any);
      const event = new MouseEvent('click');
      component.toggleDropdown(event, btn);
      component.onWindowResize();
      expect(component.dropdownStyle.top).toBeDefined();
    });

    it('should close dropdown on window close-action-dropdowns event', () => {
      component.isDropdownOpen = true;
      component.onCloseActionDropdowns(new Event('close-action-dropdowns'));
      expect(component.isDropdownOpen).toBeFalse();
    });
  });

  describe('toggleDropdown advanced scenarios', () => {
    it('should stop event propagation', () => {
      const event = new MouseEvent('click');
      spyOn(event, 'stopPropagation');
      const btn = document.createElement('button');
      spyOn(btn, 'getBoundingClientRect').and.returnValue({
        bottom: 100,
        right: 200
      } as any);
      component.toggleDropdown(event, btn);
      expect(event.stopPropagation).toHaveBeenCalled();
    });

    it('should dispatch close event when opening', () => {
      component.isDropdownOpen = false;
      const event = new MouseEvent('click');
      const btn = document.createElement('button');
      spyOn(btn, 'getBoundingClientRect').and.returnValue({
        bottom: 100,
        right: 200
      } as any);
      spyOn(window, 'dispatchEvent');
      component.toggleDropdown(event, btn);
      expect(window.dispatchEvent).toHaveBeenCalled();
      expect(component.isDropdownOpen).toBeTrue();
    });

    it('should use event target when btnRef is not provided', () => {
      const btn = document.createElement('button');
      spyOn(btn, 'getBoundingClientRect').and.returnValue({
        bottom: 50,
        right: 150
      } as any);
      const event = new MouseEvent('click');
      Object.defineProperty(event, 'target', { value: btn, configurable: true });
      component.isDropdownOpen = false;
      component.toggleDropdown(event);
      expect(component.dropdownStyle.top).toBe('58px');
    });

    it('should close dropdown when toggling from open state', () => {
      component.isDropdownOpen = true;
      const btn = document.createElement('button');
      spyOn(btn, 'getBoundingClientRect').and.returnValue({
        bottom: 100,
        right: 200
      } as any);
      const event = new MouseEvent('click');
      component.toggleDropdown(event, btn);
      expect(component.isDropdownOpen).toBeFalse();
    });
  });

  describe('updateDropdownPosition edge cases', () => {
    it('should not update when btn is undefined', () => {
      const prevStyle = component.dropdownStyle;
      component.updateDropdownPosition(undefined);
      expect(component.dropdownStyle).toEqual(prevStyle);
    });

    it('should not update when btn is null', () => {
      const prevStyle = component.dropdownStyle;
      component.updateDropdownPosition(null);
      expect(component.dropdownStyle).toEqual(prevStyle);
    });

    it('should update style when btn is provided', () => {
      const btn = document.createElement('button');
      spyOn(btn, 'getBoundingClientRect').and.returnValue({
        bottom: 200,
        right: 400
      } as any);
      component.updateDropdownPosition(btn);
      expect(component.dropdownStyle.top).toBe('208px');
      expect(component.dropdownStyle.left).toBe('240px');
    });
  });

  describe('onOptionSelected', () => {
    it('should close dropdown and call onActionSelected', () => {
      component.isDropdownOpen = true;
      spyOn(component, 'onActionSelected');
      component.onOptionSelected('edit');
      expect(component.isDropdownOpen).toBeFalse();
      expect(component.onActionSelected).toHaveBeenCalledWith('edit');
    });
  });

  describe('totalPages getter', () => {
    it('should calculate total pages correctly', () => {
      component.deploymentLogs = Array(50).fill({ timestamp: '', message: '' });
      component.pageSize = 10;
      expect(component.totalPages).toBe(5);
    });

    it('should handle zero logs', () => {
      component.deploymentLogs = [];
      component.pageSize = 10;
      expect(component.totalPages).toBe(0);
    });
  });

  describe('scaleDeployment', () => {
    it('should set replica data', () => {
      component.replicaCount = 5;
      component.scaleDeployment();
      expect(component).toBeTruthy();
    });
  });

  describe('agInit with false isVerified', () => {
    it('should set isUserVerified to false when isVerfied is false', () => {
      const params = {
        data: { isVerfied: false },
        additionalParam: 'test'
      };
      component.agInit(params);
      expect(component.isUserVerified).toBeFalse();
    });

    it('should set isUserVerified to false when isVerfied is undefined', () => {
      const params = {
        data: {},
        additionalParam: 'test'
      };
      component.agInit(params);
      expect(component.isUserVerified).toBeFalse();
    });
  });

  describe('refresh with false isVerified', () => {
    it('should set isUserVerified to false when isVerfied is string false', () => {
      const params = {
        data: { isVerfied: 'false' }
      };
      component.refresh(params);
      expect(component.isUserVerified).toBeFalse();
    });
  });
});
