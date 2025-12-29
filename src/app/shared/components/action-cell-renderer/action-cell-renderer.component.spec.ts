import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActionCellRendererComponent } from './action-cell-renderer.component';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { DeploymentsService } from '../../services/deployments.service';
import { SharedService } from '../../services/shared.service';
import { PermissionService } from '../../services/permission.service';
import { of, throwError } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('ActionCellRendererComponent', () => {
  let component: ActionCellRendererComponent;
  let fixture: ComponentFixture<ActionCellRendererComponent>;

  let routerSpy: jasmine.SpyObj<Router>;
  let modalSpy: jasmine.SpyObj<NgbModal>;
  let toastrSpy: jasmine.SpyObj<ToastrService>;
  let deploymentServiceSpy: jasmine.SpyObj<DeploymentsService>;

  beforeEach(async () => {
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
      imports: [ActionCellRendererComponent],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: NgbModal, useValue: modalSpy },
        { provide: ToastrService, useValue: toastrSpy },
        { provide: DeploymentsService, useValue: deploymentServiceSpy },
        { provide: SharedService, useValue: {} },
        { provide: PermissionService, useValue: {} }
      ],
      schemas: [NO_ERRORS_SCHEMA] // Ignore CoreUI / modal templates
    }).compileComponents();

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
      component.toggleDropdown(event);

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
});
