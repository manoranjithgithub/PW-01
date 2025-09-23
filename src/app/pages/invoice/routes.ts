import { Routes } from '@angular/router';
export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./invoice.component').then(m => m.InvoiceComponent),
    // data: {
    //   breadcrumb: $localize`Tools`
    // }
  }
];