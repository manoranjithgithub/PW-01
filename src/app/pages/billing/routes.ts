import { Routes } from '@angular/router';
export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./billing.component').then(m => m.BillingComponent)
  }
];
