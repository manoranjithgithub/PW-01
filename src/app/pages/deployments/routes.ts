import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./deployments.component').then(m => m.DeploymentsComponent),
    // data: { breadcrumb: 'Deployments' }
    // },
    // {
    //   path: 'create-deployment',
    //   loadChildren: () =>
    //     import('./deployments-steps/routes').then((m) => m.routes)
    // }
    // },
  }
];

