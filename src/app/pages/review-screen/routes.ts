import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./review-screen.component').then(m => m.ReviewScreenComponent),
    data: {
      title: $localize `Review Screen`
    }
  }
];

