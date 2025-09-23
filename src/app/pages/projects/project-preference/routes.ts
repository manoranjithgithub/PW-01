import { Routes } from '@angular/router';
export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./project-preference.component').then(m => m.ProjectPreferenceComponent),
    // data: {
    //   breadcrumb: $localize`Project Preference`
    // }
  }
];