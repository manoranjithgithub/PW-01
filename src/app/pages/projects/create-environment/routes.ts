import { Routes } from '@angular/router';
export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./create-environment.component').then(m => m.CreateEnvironmentComponent),
    data: {
      breadcrumb: $localize`Create Environment`
    }
  }
];