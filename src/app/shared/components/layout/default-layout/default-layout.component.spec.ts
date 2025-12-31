import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { DefaultLayoutComponent } from './default-layout.component';
import { DeploymentsService } from '../../../../pages/deployments/deployment.service';
import { ProjectsService } from '../../../../pages/projects/projects.service';
import { ColorModeService } from '@coreui/angular';
import { Router, NavigationStart, NavigationEnd, Event as RouterEvent, ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { Subject, of } from 'rxjs';
import { ToastrService, TOAST_CONFIG } from 'ngx-toastr';
import { toastConfigMock, createToastrSpy } from '../../../../../test-helpers/testing-mocks';
import { SharedService } from '../../../services/shared.service';
import { SidebarService } from '../../../services/sidebar.service';
import { Renderer2, ElementRef } from '@angular/core';
import { LayoutActionService } from '../../../services/layout-action.service';
import { PermissionService } from '../../../services/permission.service';
import { AuthService } from '../../../../core/services/auth.service';

describe('DefaultLayoutComponent', () => {
  let component: DefaultLayoutComponent;
  let fixture: any;

  const routerEvents$ = new Subject<RouterEvent>();
  const routerStub: any = { events: routerEvents$.asObservable(), url: '/init', navigateByUrl: jasmine.createSpy('navigateByUrl') };
  const titleSpy = { setTitle: jasmine.createSpy('setTitle') };
  const sharedSpy: any = { user$: of({ owner: 'owner' }), emitValueChange: jasmine.createSpy('emit') };
  const sidebarSvc: any = { sidebarToggle$: new Subject<boolean>() };
  const rendererSpy: Partial<Renderer2> = { addClass: jasmine.createSpy('addClass'), removeClass: jasmine.createSpy('removeClass') };
  const layoutActionSpy: any = { extraTitle$: new Subject<string>(), triggerAction: jasmine.createSpy('triggerAction') };
  const permissionSpy: any = { canAdminGlobal: jasmine.createSpy('canAdminGlobal').and.returnValue(false), canWriteForCurrentUser: jasmine.createSpy('canWrite').and.returnValue(false), canDeleteForCurrentUser: jasmine.createSpy('canDelete').and.returnValue(true) };
  const authSpy: any = { logout: jasmine.createSpy('logout') };

  const colorModeMock: any = (() => {
    const f: any = jasmine.createSpy('colorMode').and.returnValue('light');
    f.set = jasmine.createSpy('set');
    return f;
  })();

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        { provide: TOAST_CONFIG, useValue: toastConfigMock },
        { provide: ToastrService, useValue: createToastrSpy() },
        { provide: ActivatedRoute, useValue: { snapshot: { params: {} }, queryParams: of({}) } },
        { provide: Router, useValue: routerStub },
        { provide: Title, useValue: titleSpy },
        { provide: SharedService, useValue: sharedSpy },
        { provide: SidebarService, useValue: sidebarSvc },
        { provide: Renderer2, useValue: rendererSpy },
        { provide: LayoutActionService, useValue: layoutActionSpy },
        { provide: PermissionService, useValue: permissionSpy },
        { provide: AuthService, useValue: authSpy },
        { provide: DeploymentsService, useValue: {} },
        { provide: ProjectsService, useValue: {} },
        { provide: ColorModeService, useValue: { colorMode: colorModeMock, localStorageItemName: { set: jasmine.createSpy('ls.set') } } }
      ]
    }).compileComponents();

    // override template to avoid heavy standalone imports
    TestBed.overrideComponent(DefaultLayoutComponent, { set: { template: '<div></div>' } });
    fixture = TestBed.createComponent(DefaultLayoutComponent);
    component = fixture.componentInstance;

    // provide a fake sidebarRef element
    (component as any).sidebarRef = { nativeElement: {} } as ElementRef;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('getCurrentProjectId parses JSON and plain strings', () => {
    localStorage.setItem('project', JSON.stringify({ id: 'p1' }));
    expect(component.getCurrentProjectId()).toBe('p1');

    localStorage.setItem('project', 'plain-id');
    expect(component.getCurrentProjectId()).toBe('plain-id');

    localStorage.setItem('project', 'undefined');
    expect(component.getCurrentProjectId()).toBeUndefined();
  });

  it('getCurrentEnvId parses JSON and plain strings', () => {
    localStorage.setItem('environment', JSON.stringify({ id: 'e1' }));
    expect(component.getCurrentEnvId()).toBe('e1');

    localStorage.setItem('environment', 'env-plain');
    expect(component.getCurrentEnvId()).toBe('env-plain');

    localStorage.setItem('environment', 'undefined');
    expect(component.getCurrentEnvId()).toBeUndefined();
  });

  it('onScroll sets isScrolled based on window.scrollY', () => {
    (window as any).scrollY = 100;
    component.onScroll();
    expect(component.isScrolled).toBeTrue();

    (window as any).scrollY = 0;
    component.onScroll();
    expect(component.isScrolled).toBeFalse();
  });

  it('isProjectsPage checks url paths', () => {
    component.currentUrl = '/projects';
    expect(component.isProjectsPage()).toBeTrue();
    component.currentUrl = '/other';
    expect(component.isProjectsPage()).toBeFalse();
  });

  it('updateTitle sets title and showSwitchProject', () => {
    component.pageHeaders = [{ url: '/x', title: 'T', subText: 'S' } as any];
    (routerStub as any).url = '/x';
    localStorage.setItem('project', JSON.stringify({ id: 'proj' }));
    component.updateTitle();
    expect(titleSpy.setTitle).toHaveBeenCalledWith('T');
    expect(component.pageTitle).toBe('T');
    expect(component.subText).toBe('S');
    expect(component.showSwitchProject).toBeTrue();
  });

  it('canPerformPageDelete delegates to permissionService for pref routes', () => {
    (routerStub as any).url = '/projects/project-preferences';
    permissionSpy.canAdminGlobal.and.returnValue(true);
    expect(component.canPerformPageDelete()).toBeTrue();
    permissionSpy.canAdminGlobal.and.returnValue(false);
    expect(component.canPerformPageDelete()).toBeFalse();
  });

  it('setTheme stores theme and calls colorMode.set and emits value', () => {
    const evt: any = { target: { checked: true } };
    component.setTheme(evt as Event);
    expect(JSON.parse(localStorage.getItem('theme-default') || '""')).toBe('light');
    expect((colorModeMock as any).set).toHaveBeenCalled();
    expect(sharedSpy.emitValueChange).toHaveBeenCalled();
  });

  it('onPageActionClick triggers layout action', () => {
    component.onPageActionClick();
    expect(layoutActionSpy.triggerAction).toHaveBeenCalled();
  });

  it('toggleDropdown, logout, getItemName/status, cleanColorMode', () => {
    component.toggleDropdown('src', {} as MouseEvent);
    expect(component.openDropdown).toBe('src');

    component.logout();
    expect(authSpy.logout).toHaveBeenCalled();

    component.selectedItemFromCom = 'Item Name (OK)';
    expect(component.getItemName()).toBe('Item Name');
    expect(component.getItemStatus()).toBe('OK');

    // cleanColorMode when colorMode returns JSON
    (colorModeMock as any).andReturn = undefined;
    (colorModeMock as any).and.returnValue('"dark"');
    const clean = component.cleanColorMode;
    expect(clean).toBe('dark');
  });

});
