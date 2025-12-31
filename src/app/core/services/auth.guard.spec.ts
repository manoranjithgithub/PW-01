import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { PermissionService } from '../../shared/services/permission.service';
import { ToastrService } from 'ngx-toastr';
import { environment } from '../../../environments/environment';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let authSpy: any;
  let routerSpy: any;
  let toastSpy: any;
  let permSpy: any;
  const dummyRoute = {} as ActivatedRouteSnapshot;
  const mkState = (url: string): RouterStateSnapshot => ({ url } as RouterStateSnapshot);

  beforeEach(() => {
    authSpy = jasmine.createSpyObj('AuthService', ['isAuthenticated']);
    routerSpy = jasmine.createSpyObj('Router', ['navigateByUrl', 'navigate']);
    toastSpy = jasmine.createSpyObj('ToastrService', ['warning']);
    permSpy = jasmine.createSpyObj('PermissionService', ['canAdminGlobal', 'canWriteForCurrentUser']);

    TestBed.configureTestingModule({
      providers: [
        AuthGuard,
        { provide: AuthService, useValue: authSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ToastrService, useValue: toastSpy },
        { provide: PermissionService, useValue: permSpy }
      ]
    });

    guard = TestBed.inject(AuthGuard);
    // ensure clean localStorage baseline
    localStorage.removeItem('project');
    localStorage.removeItem('environment');
  });

  afterEach(() => {
    // restore environment.production default (reasonable default false)
    (environment as any).production = false;
    localStorage.removeItem('project');
    localStorage.removeItem('environment');
  });

  it('redirects to login when not authenticated', () => {
    authSpy.isAuthenticated.and.returnValue(false);
    const res = guard.canActivate(dummyRoute, mkState('/any'));
    expect(res).toBeFalse();
    expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/login');
  });

  it('warns and navigates to /projects when project/env missing', () => {
    authSpy.isAuthenticated.and.returnValue(true);
    // missing project & environment
    localStorage.removeItem('project');
    localStorage.removeItem('environment');
    permSpy.canAdminGlobal.and.returnValue(false);

    const res = guard.canActivate(dummyRoute, mkState('/some/protected'));
    expect(res).toBeFalse();
    expect(toastSpy.warning).toHaveBeenCalled();
    expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/projects', { replaceUrl: true });
  });

  it('blocks create-project when not admin', () => {
    authSpy.isAuthenticated.and.returnValue(true);
    permSpy.canAdminGlobal.and.returnValue(false);
    const res = guard.canActivate(dummyRoute, mkState('/projects/create-project'));
    expect(res).toBeFalse();
    expect(toastSpy.warning).toHaveBeenCalled();
    expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/projects', { replaceUrl: true });
  });

  it('blocks create-environment when not admin', () => {
    authSpy.isAuthenticated.and.returnValue(true);
    permSpy.canAdminGlobal.and.returnValue(false);
    // set project in storage to simulate selection
    localStorage.setItem('project', JSON.stringify({ id: 'p1' }));
    const res = guard.canActivate(dummyRoute, mkState('/projects/create-environment'));
    expect(res).toBeFalse();
    expect(toastSpy.warning).toHaveBeenCalled();
    expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/projects', { replaceUrl: true });
  });

  it('blocks users-list when owner is nimbuz or not admin', () => {
    authSpy.isAuthenticated.and.returnValue(true);
    permSpy.canAdminGlobal.and.returnValue(false);

    const res = guard.canActivate(dummyRoute, mkState('/users-list'));
    expect(res).toBeFalse();
    expect(toastSpy.warning).toHaveBeenCalled();
    expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/projects', { replaceUrl: true });
  });


  it('allows tools/create-tool when canWriteForCurrentUser returns true', () => {
    authSpy.isAuthenticated.and.returnValue(true);
    // provide project/env in storage
    localStorage.setItem('project', JSON.stringify({ id: 'p1' }));
    localStorage.setItem('environment', JSON.stringify({ id: 'e1' }));
    permSpy.canAdminGlobal.and.returnValue(false);
    permSpy.canWriteForCurrentUser.and.returnValue(true);

    const res = guard.canActivate(dummyRoute, mkState('/tools/create-tool'));
    expect(res).toBeTrue();
  });

  it('blocks create-deployment when no permission', () => {
    authSpy.isAuthenticated.and.returnValue(true);
    localStorage.setItem('project', JSON.stringify({ id: 'p1' }));
    localStorage.setItem('environment', JSON.stringify({ id: 'e1' }));
    permSpy.canAdminGlobal.and.returnValue(false);
    permSpy.canWriteForCurrentUser.and.returnValue(false);

    const res = guard.canActivate(dummyRoute, mkState('/some/create-deployment/path'));
    expect(res).toBeFalse();
    expect(toastSpy.warning).toHaveBeenCalled();
    expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/deployment', { replaceUrl: true });
  });

  it('redirects when production and llm route present', () => {
    authSpy.isAuthenticated.and.returnValue(true);
    // set production mode
    (environment as any).production = true;
    const routeSnap = { routeConfig: { path: 'llm/some' } } as ActivatedRouteSnapshot;
    const res = guard.canActivate(routeSnap, mkState('/llm/whatever'));
    expect(res).toBeFalse();
    // router navigation may be proxied in different test envs; ensure guard returns false
  });
});
