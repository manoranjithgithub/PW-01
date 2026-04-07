import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./deployments.component').then(m => m.DeploymentsComponent),
  },
  {
    path: 'application-details',
    loadComponent: () => import('./deployment-details/deployment-details.component').then(m => m.DeploymentDetailsComponent)
  },
  {
    path: 'create-application',
    loadComponent: () => import('./create-deployments/create-deployments.component').then(m => m.CreateDeploymentsComponent)
  },
  {
    path: 'review-screen',
    loadComponent: () => import('./review-screen/review-screen.component').then(m => m.ReviewScreenComponent)
  },
];

