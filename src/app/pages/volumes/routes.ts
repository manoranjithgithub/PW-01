import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./volumes.component').then(m => m.VolumesComponent),
    data: {
      title: $localize`Volumes`
    }
  }
];