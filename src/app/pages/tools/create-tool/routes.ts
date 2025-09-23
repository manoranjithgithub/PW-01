import { Routes } from '@angular/router';
export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./create-tool.component').then(m => m.CreateToolComponent),
    // data: {
    //   breadcrumb: $localize`Tools`
    // }
  }
];