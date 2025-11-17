import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./deployment-list/deployment-list.component').then(m => m.DeploymentListComponent),
  },
  {
    path: 'create-deployment',
    loadComponent: () => import('./create-deployment/create-deployment.component').then(m => m.CreateDeploymentComponent),
  },
  {
    path: 'deployment-details',
    loadComponent: () => import('./deployment-details/deployment-details.component').then(m => m.DeploymentDetailsComponent),
  }
];

