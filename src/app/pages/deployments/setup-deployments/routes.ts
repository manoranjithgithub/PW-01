import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./setup-deployments.component').then(m => m.SetupDeploymentsComponent),
    data: {
      title: $localize`Create Deployment`
    }
  }
];
