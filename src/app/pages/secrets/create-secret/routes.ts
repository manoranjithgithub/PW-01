import { Routes } from '@angular/router';
export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./create-secret.component').then(m => m.CreateSecretComponent),
    data: {
      title: $localize`Secrets`
    }
  }
];