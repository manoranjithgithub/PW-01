import { Routes } from '@angular/router';
export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./create-endpoints.component').then(m => m.CreateEndpointsComponent),
    data: {
      breadcrumb: $localize`Endpoints`
    }
  }
];