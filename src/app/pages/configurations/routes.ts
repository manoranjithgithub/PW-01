import { Routes } from '@angular/router';
export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./configurations.component').then(m => m.ConfigurationsComponent),
    data: {
      breadcrumb: $localize`Configurations`
    }
  }
];