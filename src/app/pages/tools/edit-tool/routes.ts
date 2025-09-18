
import { Routes } from '@angular/router';
export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./edit-tool.component').then(m => m.EditToolComponent),
    // data: {
    //   breadcrumb: $localize`Tools`
    // }
  }
];