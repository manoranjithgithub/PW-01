import { Routes } from '@angular/router';
export const routes: Routes = [
 
  {
    path: '',
    loadComponent: () => import('./projects.component').then(m => m.ProjectsComponent),
    // data: {
    //   breadcrumb: $localize`Projects`
    // }
  }
];