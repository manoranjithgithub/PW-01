import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./deployment-logs.component').then(m => m.DeploymentLogsComponent),
    data: {
      breadcrumb: $localize`Deployment Logs`
    }
  }
];
