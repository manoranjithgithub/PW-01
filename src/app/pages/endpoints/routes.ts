import { Routes } from '@angular/router';
export const routes: Routes = [
 
  {
    path: '',
    loadComponent: () => import('./endpoints.component').then(m => m.EndpointsComponent),
    data: {
      breadcrumb: $localize`Endpoints`
    }
  }
];