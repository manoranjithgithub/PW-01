import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router,
    private toastr: ToastrService
  ) { }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const url = state.url.split('?')[0];
    const allowedRoutes = [
      '/projects',
      '/create-project',
      '/create-environment',
      '/account-settings',
      '/projects/project-preferences',
      '/users-list',
    ];
    const publicRoutes = ['/', '/login', '/create-account', '/logout', '/login'];

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
    return true;
  }
}
