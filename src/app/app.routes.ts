import { Routes } from '@angular/router';
import { DefaultLayoutComponent } from './shared/components/layout';
import { AuthGuard } from '../app/core/services/auth.guard';
import { RedirectIfAuthenticatedGuard } from '../app/core/services/redirect-if-authenticated.guard';
import '@angular/localize/init';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'projects',
    pathMatch: 'full',
  },
  {
    path: '',
    component: DefaultLayoutComponent,
    data: {
      breadcrumb: 'Home',
    },

    children: [
      {
        path: 'dashboard',
        canActivate: [AuthGuard],
        loadChildren: () =>
          import('./pages/dashboard/routes').then((m) => m.routes),
      },
      {
        path: 'invoice-list',
        canActivate: [AuthGuard],
        loadChildren: () =>
          import('./pages/invoice/routes').then((m) => m.routes),
      },
      {
        path: 'deployment',
        canActivate: [AuthGuard],
        loadChildren: () => import('./pages/deployments/routes').then((m) => m.routes),
      },
      {
        path: 'projects',
        canActivate: [AuthGuard],
        loadChildren: () => import('./pages/projects/routes').then((m) => m.routes),
      },
      {
        path: 'tools',
        canActivate: [AuthGuard],
        loadChildren: () =>
          import('./pages/tools/routes').then((m) => m.routes),
      },
      {
        path: 'account-settings',
        loadChildren: () =>
          import('./pages/account-settings/routes').then((m) => m.routes),
        canActivate: [AuthGuard],
      },
      {
        path: 'users-list',
        canActivate: [AuthGuard],
        loadChildren: () =>
          import('./pages/users-list/routes').then((m) => m.routes),
      },
      {
        path: 'llm',
        canActivate: [AuthGuard],
        loadChildren: () =>
          import('./pages/llm-deployments/routes').then((m) => m.routes),
      }
    ],
  },
  {
    path: 'callback',
    loadComponent: () =>
      import('./shared/components/redirect/redirect.component').then(
        (m) => m.RedirectComponent
      ),
  },
  {
    path: 'create-new-account',
    loadComponent: () =>
      import('./pages/register/register.component').then(
        (m) => m.RegisterComponent
      ),
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./pages/forgot-password/forgot-password.component').then(
        (m) => m.ForgotPasswordComponent  
      ),
  },
  {
    path: 'vcs/callback',
    loadComponent: () =>
      import('./pages/vcs-callback/vcs-callback.component').then(
        (m) => m.VcsCallbackComponent
      ),
  },
  {
    path: 'login',
    canActivate: [RedirectIfAuthenticatedGuard],
    loadComponent: () =>
      import('./pages/login/login.component').then(
        (m) => m.LoginComponent
      ),
  },
  { path: '**', redirectTo: 'login' },
];
