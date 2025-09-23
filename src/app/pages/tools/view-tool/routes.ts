
import { Routes } from '@angular/router';
export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./view-tool.component').then(m => m.ViewToolComponent),
    // data: {
    //   breadcrumb: $localize`Tools`
    // }
  }
];