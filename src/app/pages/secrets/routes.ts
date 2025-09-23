import { Routes } from '@angular/router';
export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./secrets.component').then(m => m.SecretsComponent),
    data: {
      title: $localize`Secrets`
    }
  }
];