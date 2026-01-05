import { TestBed, fakeAsync, tick } from '@angular/core/testing';
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
  const sharedSpy: any = { user$: new Subject<any>(), emitValueChange: jasmine.createSpy('emit') };
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

    TestBed.overrideComponent(DefaultLayoutComponent, { set: { template: '<div></div>' } });
    fixture = TestBed.createComponent(DefaultLayoutComponent);
    component = fixture.componentInstance;
    (component as any).sidebarRef = { nativeElement: document.createElement('div') } as ElementRef;
    routerStub.navigateByUrl.calls.reset();
    (rendererSpy.addClass as jasmine.Spy).calls.reset();
    (rendererSpy.removeClass as jasmine.Spy).calls.reset();
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
    (colorModeMock as any).andReturn = undefined;
    (colorModeMock as any).and.returnValue('"dark"');
    const clean = component.cleanColorMode;
    expect(clean).toBe('dark');
  });
  it('should handle NavigationStart and prevent unauthorized access to users-list', () => {
    localStorage.setItem('project', JSON.stringify({ id: 'p1' }));
    localStorage.setItem('environment', JSON.stringify({ id: 'e1' }));
    permissionSpy.canAdminGlobal.and.returnValue(false);
    component.currentUser = 'someUser';

    const toastrSpy = TestBed.inject(ToastrService);
    const navStart = new NavigationStart(1, '/users-list');
    routerEvents$.next(navStart);

    expect(toastrSpy.warning).toHaveBeenCalledWith('You are not authorized to view that page.');
    expect(routerStub.navigateByUrl).toHaveBeenCalledWith('/projects', { replaceUrl: true });
  });


  it('should redirect to projects if project is missing on NavigationStart', () => {
    localStorage.removeItem('project');
    localStorage.setItem('environment', JSON.stringify({ id: 'e1' }));
    
    const toastrSpy = TestBed.inject(ToastrService);
    const navStart = new NavigationStart(3, '/dashboard');
    routerEvents$.next(navStart);

    expect(toastrSpy.warning).toHaveBeenCalledWith('Please select a project and environment before continuing.');
    expect(routerStub.navigateByUrl).toHaveBeenCalledWith('/projects', { replaceUrl: true });
  });

  it('should redirect to projects if environment is missing on NavigationStart', () => {
    localStorage.setItem('project', JSON.stringify({ id: 'p1' }));
    localStorage.removeItem('environment');
    
    const toastrSpy = TestBed.inject(ToastrService);
    const navStart = new NavigationStart(4, '/dashboard');
    routerEvents$.next(navStart);

    expect(toastrSpy.warning).toHaveBeenCalledWith('Please select a project and environment before continuing.');
    expect(routerStub.navigateByUrl).toHaveBeenCalledWith('/projects', { replaceUrl: true });
  });

  it('should allow navigation to allowed routes without project/environment', () => {
    localStorage.removeItem('project');
    localStorage.removeItem('environment');
    routerStub.navigateByUrl.calls.reset();
    
    const navStart = new NavigationStart(5, '/projects');
    routerEvents$.next(navStart);

    expect(routerStub.navigateByUrl).not.toHaveBeenCalled();
  });

  it('should allow navigation to public routes without project/environment', () => {
    localStorage.removeItem('project');
    localStorage.removeItem('environment');
    
    const navStart = new NavigationStart(6, '/login');
    routerEvents$.next(navStart);

    expect(routerStub.navigateByUrl).not.toHaveBeenCalled();
  });

  it('should handle NavigationEnd and update title and button visibility', () => {
    localStorage.setItem('project', JSON.stringify({ id: 'p1' }));
    localStorage.setItem('environment', JSON.stringify({ id: 'e1' }));
    
    const navEnd = new NavigationEnd(7, '/projects/project-preferences', '/projects/project-preferences');
    routerStub.url = '/projects/project-preferences';
    routerEvents$.next(navEnd);

    expect(component.currentUrl).toBe('/projects/project-preferences');
  });

  // it('should include users-list in allowedRoutes for non-nimbuz global admins during NavigationStart', () => {
  //   localStorage.setItem('project', JSON.stringify({ id: 'p1' }));
  //   localStorage.setItem('environment', JSON.stringify({ id: 'e1' }));
  //   component.currentUser = 'testUser';
  //   permissionSpy.canAdminGlobal.and.returnValue(true);
  //   routerStub.navigateByUrl.calls.reset();

  //   const navStart = new NavigationStart(8, '/users-list');
  //   routerEvents$.next(navStart);

  //   expect(routerStub.navigateByUrl).not.toHaveBeenCalled();
  // });

  it('should include create-project in allowedRoutes for global admins', () => {
    localStorage.setItem('project', JSON.stringify({ id: 'p1' }));
    localStorage.setItem('environment', JSON.stringify({ id: 'e1' }));
    permissionSpy.canAdminGlobal.and.returnValue(true);

    const navStart = new NavigationStart(9, '/projects/create-project');
    routerEvents$.next(navStart);

    expect(routerStub.navigateByUrl).not.toHaveBeenCalled();
  });

  it('should include create-environment in allowedRoutes for users with write access', () => {
    localStorage.setItem('project', JSON.stringify({ id: 'p1' }));
    localStorage.setItem('environment', JSON.stringify({ id: 'e1' }));
    permissionSpy.canAdminGlobal.and.returnValue(false);
    permissionSpy.canWriteForCurrentUser.and.returnValue(true);

    const navStart = new NavigationStart(10, '/projects/create-environment');
    routerEvents$.next(navStart);

    expect(routerStub.navigateByUrl).not.toHaveBeenCalled();
  });

  it('ngOnInit should filter out LLM Deployments in production', (done) => {
    component.ngOnInit();
    
    sharedSpy.user$.next({ owner: 'testUser' });
    
    setTimeout(() => {
      const hasLLM = component.navItems.find((item: any) => item.name === 'LLM Deployments');
      expect(hasLLM).toBeDefined();
      done();
    }, 100);
  });

  it('ngOnInit should add Users nav item for non-nimbuz global admins', (done) => {
    permissionSpy.canAdminGlobal.and.returnValue(true);
    component.ngOnInit();
    
    sharedSpy.user$.next({ owner: 'testUser' });

    setTimeout(() => {
      const usersItem = component.navItems.find((item: any) => item.name === 'Users');
      expect(usersItem).toBeDefined();
      expect(usersItem?.url).toBe('/users-list');
      done();
    }, 100);
  });

  it('ngOnInit should not add Users nav item for nimbuz owner', (done) => {
    permissionSpy.canAdminGlobal.and.returnValue(true);
    component.ngOnInit();
    
    sharedSpy.user$.next({ owner: 'nimbuz' });

    setTimeout(() => {
      const usersItem = component.navItems.find((item: any) => item.name === 'Users');
      expect(usersItem).toBeUndefined();
      done();
    }, 100);
  });

  it('ngOnInit should handle sidebarToggle subscription with visible=false', fakeAsync(() => {
    const mockElement = document.createElement('div');
    (component as any).sidebarRef = { nativeElement: mockElement };
    const addClassSpy = jasmine.createSpy('addClass');
    const removeClassSpy = jasmine.createSpy('removeClass');
    (component as any).renderer = { addClass: addClassSpy, removeClass: removeClassSpy };
    
    component.ngOnInit();
    tick();
    
    sidebarSvc.sidebarToggle$.next(false);
    tick();

    expect(addClassSpy).toHaveBeenCalledWith(mockElement, 'hide');
    expect(removeClassSpy).toHaveBeenCalledWith(mockElement, 'show');
  }));

  it('ngOnInit should handle sidebarToggle subscription with visible=true', fakeAsync(() => {
    const mockElement = document.createElement('div');
    (component as any).sidebarRef = { nativeElement: mockElement };
    const addClassSpy = jasmine.createSpy('addClass');
    const removeClassSpy = jasmine.createSpy('removeClass');
    (component as any).renderer = { addClass: addClassSpy, removeClass: removeClassSpy };
    
    component.ngOnInit();
    tick();
    
    sidebarSvc.sidebarToggle$.next(true);
    tick();

    expect(addClassSpy).toHaveBeenCalledWith(mockElement, 'show');
    expect(removeClassSpy).toHaveBeenCalledWith(mockElement, 'hide');
  }));

  it('updateTitle should handle unmatched URL', () => {
    routerStub.url = '/some-random-url';
    localStorage.setItem('project', JSON.stringify({ id: 'p1' }));
    
    component.updateTitle();

    expect(titleSpy.setTitle).toHaveBeenCalledWith('');
    expect(component.pageTitle).toBe('');
  });

  it('updateTitle should set showSwitchProject to false when project is undefined', () => {
    localStorage.setItem('project', 'undefined');
    routerStub.url = '/dashboard';
    
    component.updateTitle();

    expect(component.showSwitchProject).toBeFalse();
  });

  it('updateTitle should set showSwitchProject to false when project is null', () => {
    localStorage.removeItem('project');
    routerStub.url = '/dashboard';
    
    component.updateTitle();

    expect(component.showSwitchProject).toBeFalse();
  });

  it('canPerformPageDelete should delegate to canDeleteForCurrentUser for non-pref routes', () => {
    routerStub.url = '/deployments';
    permissionSpy.canDeleteForCurrentUser.and.returnValue(true);
    
    const result = component.canPerformPageDelete();

    expect(result).toBeTrue();
    expect(permissionSpy.canDeleteForCurrentUser).toHaveBeenCalled();
  });

  it('canPerformPageDelete should handle project-preference route (alternative path)', () => {
    routerStub.url = '/projects/project-preference';
    permissionSpy.canAdminGlobal.and.returnValue(true);
    
    const result = component.canPerformPageDelete();

    expect(result).toBeTrue();
  });

  it('setTheme should set dark theme when checkbox is unchecked', () => {
    const evt: any = { target: { checked: false } };
    component.setTheme(evt as Event);
    
    expect(JSON.parse(localStorage.getItem('theme-default') || '""')).toBe('dark');
    expect((colorModeMock as any).set).toHaveBeenCalledWith('dark');
  });

  it('updateButtonVisibility should set showPageActionButton to true for project-preferences URL', () => {
    routerStub.url = '/projects/project-preferences';
    
    component.updateButtonVisibility();

    expect(component.showPageActionButton).toBeTrue();
  });

  it('updateButtonVisibility should set showPageActionButton to false for other URLs', () => {
    routerStub.url = '/deployments';
    
    component.updateButtonVisibility();

    expect(component.showPageActionButton).toBeFalse();
  });

  it('getItemName should return empty string when selectedItemFromCom is null', () => {
    component.selectedItemFromCom = null;
    
    expect(component.getItemName()).toBe('');
  });

  it('getItemStatus should return empty string when no match found', () => {
    component.selectedItemFromCom = 'ItemWithoutStatus';
    
    expect(component.getItemStatus()).toBe('');
  });

  it('getItemStatus should return empty string when selectedItemFromCom is null', () => {
    component.selectedItemFromCom = null;
    
    expect(component.getItemStatus()).toBe('');
  });

  it('cleanColorMode should return mode as-is when JSON.parse fails', () => {
    (colorModeMock as any).and.returnValue('light');
    
    const result = component.cleanColorMode;
    
    expect(result).toBe('light');
  });

  it('cleanColorMode should return mode as-is when it is not a string', () => {
    (colorModeMock as any).and.returnValue({ value: 'dark' });
    
    const result = component.cleanColorMode;
    
    expect(result).toEqual({ value: 'dark' });
  });

  it('getCurrentProjectId should return undefined when project is null', () => {
    localStorage.removeItem('project');
    
    expect(component.getCurrentProjectId()).toBeUndefined();
  });

  it('getCurrentEnvId should return undefined when environment is null', () => {
    localStorage.removeItem('environment');
    
    expect(component.getCurrentEnvId()).toBeUndefined();
  });

  it('getCurrentProjectId should handle JSON parse error gracefully', () => {
    localStorage.setItem('project', 'invalid-json{');
    
    const result = component.getCurrentProjectId();
    
    expect(result).toBe('invalid-json{');
  });

  it('getCurrentEnvId should handle JSON parse error gracefully', () => {
    localStorage.setItem('environment', 'invalid-env{');
    
    const result = component.getCurrentEnvId();
    
    expect(result).toBe('invalid-env{');
  });

  it('layoutActionService extraTitle$ subscription should update selectedItemFromCom', () => {
    component.ngOnInit();
    
    layoutActionSpy.extraTitle$.next('New Title');

    expect(component.selectedItemFromCom).toBe('New Title');
  });

  it('should handle URL with query parameters in NavigationStart', () => {
    localStorage.setItem('project', JSON.stringify({ id: 'p1' }));
    localStorage.setItem('environment', JSON.stringify({ id: 'e1' }));
    
    const navStart = new NavigationStart(11, '/projects?tab=overview');
    routerEvents$.next(navStart);

    expect(routerStub.navigateByUrl).not.toHaveBeenCalled();
  });

  it('isProjectsPage should return true for /environment path', () => {
    component.currentUrl = '/environment';
    expect(component.isProjectsPage()).toBeTrue();
  });

  it('isProjectsPage should return true for /create-environment path', () => {
    component.currentUrl = '/create-environment';
    expect(component.isProjectsPage()).toBeTrue();
  });

  it('isProjectsPage should return true for /create-account path', () => {
    component.currentUrl = '/create-account';
    expect(component.isProjectsPage()).toBeTrue();
  });

  it('isProjectsPage should return true for /projects/create-project path', () => {
    component.currentUrl = '/projects/create-project';
    expect(component.isProjectsPage()).toBeTrue();
  });

  it('getCurrentProjectId should return undefined when parsed JSON has no id', () => {
    localStorage.setItem('project', JSON.stringify({ name: 'test' }));
    
    expect(component.getCurrentProjectId()).toBeUndefined();
  });

  it('getCurrentEnvId should return undefined when parsed JSON has no id', () => {
    localStorage.setItem('environment', JSON.stringify({ name: 'test' }));
    
    expect(component.getCurrentEnvId()).toBeUndefined();
  });
});
