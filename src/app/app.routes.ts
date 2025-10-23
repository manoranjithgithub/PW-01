import { Routes } from '@angular/router';
import { DefaultLayoutComponent } from './shared/components/layout';
import { AuthGuard } from '../app/core/services/auth.guard';
import '@angular/localize/init';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
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
        // data: { breadcrumb: 'Deployments' },
        children: [
          {
            path: '',
            loadChildren: () =>
              import('./pages/deployments/routes').then((m) => m.routes),
            // data: { breadcrumb: 'Deployments' },
          },
          {
            path: 'deployment-details',
            loadChildren: () =>
              import('./pages/deployments/deployment-details/routes').then(
                (m) => m.routes
              ),
            // data: { breadcrumb: 'Deployments Details' }
          },
        ],
      },
      {
        path: 'create-deployment',
        canActivate: [AuthGuard],
        loadChildren: () =>
          import('./pages/deployments/create-deployments/routes').then(
            (m) => m.routes
          ),
      },

      // {
      //   path: 'edit-deployment',
      //   canActivate: [AuthGuard],
      //   loadChildren: () => import('./pages/deployments/create-deployments/routes').then((m) => m.routes)
      // },
      {
        path: 'deployment-logs',
        canActivate: [AuthGuard],
        loadChildren: () =>
          import('./pages/deployments/deployment-logs/routes').then(
            (m) => m.routes
          ),
      },
      {
        path: 'projects',
        canActivate: [AuthGuard],
        children: [
          {
            path: '',
            loadChildren: () =>
              import('./pages/projects/routes').then((m) => m.routes),
          },
          {
            path: 'project-preferences',
            canActivate: [AuthGuard],
            loadChildren: () =>
              import('./pages/projects/project-preference/routes').then(
                (m) => m.routes
              ),
          },
        ],
      },
      {
        path: 'create-project',
        canActivate: [AuthGuard],
        loadChildren: () =>
          import('./pages/projects/create-project/routes').then(
            (m) => m.routes
          ),
      },

      {
        path: 'endpoints',
        // canActivate: [AuthGuard],
        loadChildren: () =>
          import('./pages/endpoints/routes').then((m) => m.routes),
      },
      {
        path: 'create-endpoint',
        canActivate: [AuthGuard],
        loadChildren: () =>
          import('./pages/endpoints/create-endpoints/routes').then(
            (m) => m.routes
          ),
      },
      {
        path: 'configs',
        canActivate: [AuthGuard],
        loadChildren: () =>
          import('./pages/configurations/routes').then((m) => m.routes),
      },
      {
        path: 'create-config',
        canActivate: [AuthGuard],
        loadChildren: () =>
          import('./pages/configurations/create-config/routes').then(
            (m) => m.routes
          ),
      },
      {
        path: 'secrets',
        canActivate: [AuthGuard],
        loadChildren: () =>
          import('./pages/secrets/routes').then((m) => m.routes),
      },
      {
        path: 'create-secret',
        canActivate: [AuthGuard],
        loadChildren: () =>
          import('./pages/secrets/create-secret/routes').then((m) => m.routes),
      },
      {
        path: 'tools',
        canActivate: [AuthGuard],
        loadChildren: () =>
          import('./pages/tools/routes').then((m) => m.routes),
      },
      {
        path: 'create-tool',
        canActivate: [AuthGuard],
        loadChildren: () =>
          import('./pages/tools/create-tool/routes').then((m) => m.routes),
      },
      {
        path: 'settings',
        canActivate: [AuthGuard],
        loadChildren: () =>
          import('./pages/settings/routes').then((m) => m.routes),
      },
      {
        path: 'volumes',
        canActivate: [AuthGuard],
        loadChildren: () =>
          import('./pages/volumes/routes').then((m) => m.routes),
      },
      {
        path: 'account-settings',
        loadChildren: () =>
          import('./pages/account-settings/routes').then((m) => m.routes),
        canActivate: [AuthGuard],
        // data: {
        //   title: $localize`:account-settings:Account Settings`
        // }
      },
      {
        path: 'review-screen',
        loadComponent: () =>
          import('./pages/review-screen/review-screen.component').then(
            (m) => m.ReviewScreenComponent
          ),
      },
      {
        path: 'create-environment',
        canActivate: [AuthGuard],
        loadChildren: () =>
          import('./pages/projects/create-environment/routes').then(
            (m) => m.routes
          ),
      },
      {
        path: 'environment-preferences',
        canActivate: [AuthGuard],
        loadChildren: () =>
          import('./pages/projects/view-environment/routes').then(
            (m) => m.routes
          ),
      },
      {
        path: 'view-tool',
        canActivate: [AuthGuard],
        loadChildren: () =>
          import('./pages/tools/view-tool/routes').then((m) => m.routes),
      },
      {
        path: 'edit-tool',
        canActivate: [AuthGuard],
        loadChildren: () =>
          import('./pages/tools/edit-tool/routes').then((m) => m.routes),
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
      },
      {
        path: 'llm/create-deployment',
        canActivate: [AuthGuard],
        loadChildren: () =>
          import('./pages/llm-deployments/routes').then((m) => m.routes),
      },
      {
        path: 'llm/deployment-details',
        canActivate: [AuthGuard],
        loadChildren: () =>
          import('./pages/llm-deployments/routes').then((m) => m.routes),
      },
    ],
  },
  {
    path: '404',
    loadComponent: () =>
      import('./pages/page404/page404.component').then(
        (m) => m.Page404Component
      ),
    // data: {
    //   breadcrumb: 'Page 404'
    // }
  },
  {
    path: '500',
    loadComponent: () =>
      import('./pages/page500/page500.component').then(
        (m) => m.Page500Component
      ),
    // data: {
    //   breadcrumb: 'Page 500'
    // }
  },
  {
    path: 'business-registration',
    loadComponent: () =>
      import('./pages/login/login.component').then((m) => m.LoginComponent),
    // data: {
    //   title: 'Login Page'
    // }
  },
  {
    path: 'callback',
    loadComponent: () =>
      import('./shared/components/redirect/redirect.component').then(
        (m) => m.RedirectComponent
      ),
  },
  {
    path: 'create-account',
    loadComponent: () =>
      import('./pages/register/register.component').then(
        (m) => m.RegisterComponent
      ),
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./pages/register/register.component').then(
        (m) => m.RegisterComponent
      ),
  },
  {
    path: 'environment',
    loadComponent: () =>
      import('../app/pages/environment/environment.component').then(
        (m) => m.EnvironmentComponent
      ),
    // data: {
    //   breadcrumb: 'Environment Page'
    // }
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
    loadComponent: () =>
      import('./pages/login/login.component').then(
        (m) => m.LoginComponent
      ),
  },
  { path: '**', redirectTo: 'project' },
];
