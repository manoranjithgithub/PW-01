import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from './auth.service';
import { PermissionService } from '../../shared/services/permission.service';
import { ToastrService } from 'ngx-toastr';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router,
    private toastr: ToastrService,
    private permissionService: PermissionService
  ) { }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const url = state.url.split('?')[0];
    const allowedRoutes = [
      '/projects',
      '/projects/create-project',
      '/projects/create-environment',
      '/account-settings',
      '/projects/project-preferences',
      '/users-list',
    ];
    const publicRoutes = ['/', '/login', '/create-account', '/logout', '/login', '/forgot-password'];

    const isAllowed = allowedRoutes.some(r => url.startsWith(r));
    const isPublicRoute = publicRoutes.includes(url);
    const isProjectMissing = !localStorage.getItem('project');
    const isEnvironmentMissing = !localStorage.getItem('environment');

    if (!this.authService.isAuthenticated()) {
      this.router.navigateByUrl('/login');
      return false;
    }
    if ((isProjectMissing || isEnvironmentMissing) && !isAllowed && !isPublicRoute) {
      this.toastr.warning('Please select a project and environment before continuing.');
      this.router.navigateByUrl('/projects', { replaceUrl: true });
      return false;
    }
    if (url.startsWith('/projects/create-project') && !this.permissionService.canAdminGlobal()) {
      this.toastr.warning('You are not authorized to access Create Project.');
      this.router.navigateByUrl('/projects', { replaceUrl: true });
      return false;
    }
    if (url.startsWith('/projects/create-environment')) {
      const projectStr = localStorage.getItem('project');
      let projectId: string | null = null;
      try {
        const parsed = projectStr ? JSON.parse(projectStr) : null;
        projectId = parsed?.id || null;
      } catch {
        projectId = projectStr || null;
      }
      const canCreateEnv = this.permissionService.canAdminGlobal();
      if (!canCreateEnv) {
        this.toastr.warning('You are not authorized to create an environment for the selected project.');
        this.router.navigateByUrl('/projects', { replaceUrl: true });
        return false;
      }
    }
    if (url.startsWith('/users-list')) {
      let owner: string | undefined;
      try {
        const hostname = window?.location?.hostname || '';
        const subdomain = hostname.split('.')[0] || '';
        if (subdomain === 'app') {
          owner = 'nimbuz';
        } else {
          owner = subdomain;
        }
      } catch {
        // ignore and use owner from shared service
      }
      const canAccessUsers = (owner && owner !== 'nimbuz' && this.permissionService.canAdminGlobal());
      if (!canAccessUsers) {
        this.toastr.warning('You are not authorized to view that page.');
        this.router.navigateByUrl('/projects', { replaceUrl: true });
        return false;
      }
    }
    if (url.startsWith('/tools/create-tool')) {
      const projectStr = localStorage.getItem('project');
      let projectId: string | null = null;
      try {
        const parsed = projectStr ? JSON.parse(projectStr) : null;
        projectId = parsed?.id || null;
      } catch {
        projectId = projectStr || null;
      }
      const envStr = localStorage.getItem('environment');
      let envId: string | null = null;
      try {
        const parsedE = envStr ? JSON.parse(envStr) : null;
        envId = parsedE?.id || null;
      } catch {
        envId = envStr || null;
      }
      const canCreateTool = this.permissionService.canAdminGlobal() || this.permissionService.canWriteForCurrentUser(projectId, envId);
      if (!canCreateTool) {
        this.toastr.warning('You are not authorized to create tools.');
        this.router.navigateByUrl('/tools', { replaceUrl: true });
        return false;
      }
    }
    if (url.includes('/create-deployment')) {
      const projectStr = localStorage.getItem('project');
      let projectId: string | null = null;
      try {
        const parsed = projectStr ? JSON.parse(projectStr) : null;
        projectId = parsed?.id || null;
      } catch {
        projectId = projectStr || null;
      }
      const envStr = localStorage.getItem('environment');
      let envId: string | null = null;
      try {
        const parsedE = envStr ? JSON.parse(envStr) : null;
        envId = parsedE?.id || null;
      } catch {
        envId = envStr || null;
      }
      const canCreateDeployment = this.permissionService.canAdminGlobal() || this.permissionService.canWriteForCurrentUser(projectId, envId);
      if (!canCreateDeployment) {
        this.toastr.warning('You are not authorized to create deployments.');
        this.router.navigateByUrl('/deployment', { replaceUrl: true });
        return false;
      }
    }
    if (environment.production && route.routeConfig?.path?.includes('llm')) {
      this.router.navigate(['/login']);
      return false;
    }
    return true;
  }
}
