import { Routes } from '@angular/router';
export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./tools.component').then(m => m.ToolsComponent),
    // data: {
    //   breadcrumb: $localize`Tools`
    // }
  }
];