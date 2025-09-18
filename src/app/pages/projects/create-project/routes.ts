import { Routes } from '@angular/router';
export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./create-project.component').then(m => m.CreateProjectComponent),
    // data: {
    //   breadcrumb: $localize`Create Project`,
    // }
  }
];