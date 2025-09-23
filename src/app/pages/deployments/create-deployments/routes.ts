import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./create-deployments.component').then(m => m.CreateDeploymentsComponent),
    // data: {
    //   breadcrumb: $localize`Create Deployment`
    // }
  }
];

