import { Routes } from '@angular/router';
export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./view-environment.component').then((m) => m.ViewEnvironmentComponent),
    // data: {
    //   breadcrumb: $localize`Environment Preference`,
    // }
  }
];