import { Routes } from '@angular/router';
export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./account-settings.component').then(m => m.AccountComponent),
  }
];