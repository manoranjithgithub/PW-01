import { Routes } from '@angular/router';
export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./create-config.component').then(m => m.CreateConfigComponent),
    data: {
      title: $localize`Configurations`
    }
  }
];